import amqp from "amqplib";
import { mqttConfig } from "../config/mqtt.js";
import History from "../models/History.js";
import mongoose from "mongoose";
import Alert from "../models/Alert.js";

class MqttService {
  constructor(socketManager) {
    this.socketManager = socketManager;
    this.connection = null;
    this.channel = null;
    this.alerts = [];
  }

  async connect() {
    try {
      this.connection = await amqp.connect(mqttConfig);
      console.log("Conectado a RabbitMQ");

      // Manejar errores y cierres de conexión
      this.connection.on("error", this.handleConnectionError.bind(this));
      this.connection.on("close", this.handleConnectionClose.bind(this));

      await this.setupChannel();
    } catch (error) {
      console.error("Error al conectar con RabbitMQ:", error);
      setTimeout(() => this.connect(), mqttConfig.reconnectTimeout);
    }
  }

  async setupChannel() {
    try {
      this.channel = await this.connection.createChannel();
      const queues = [
        mqttConfig.queueHistory,
        mqttConfig.queueNotifications,
        mqttConfig.real_Time_AirPurity,
        mqttConfig.real_Time_Hour,
        mqttConfig.real_Time_Humidity,
        mqttConfig.real_Time_Minute,
        mqttConfig.real_Time_Temperature,
        mqttConfig.real_Time_Weight1,
        mqttConfig.real_Time_Weight2,
      ];

      // Asegurar que todas las colas existen y sean duraderas
      for (const queue of queues.slice(2)) {
        this.channel.consume(queue, (msg) => {
          this.realTimeHandler(queue, msg);
        }, { noAck: false });
      }

      // Consumir mensajes de colas específicas con funciones dedicadas
      this.channel.consume(
        mqttConfig.queueHistory,
        this.handleHistoryMessage.bind(this),
        { noAck: false }
      );
      this.channel.consume(
        mqttConfig.queueNotifications,
        this.handleNotificationMessage.bind(this),
        { noAck: false }
      );

      // Consumir datos en tiempo real desde una cola compartida

      console.log(`Escuchando las colas: ${queues.join(", ")}`);
    } catch (error) {
      console.error("Error al configurar el canal:", error);
      throw error;
    }
  }

  // Maneja los datos en tiempo real de los sensores
  realTimeHandler(queueName, message) {
    try {
      const parsedMessage = JSON.parse(message.content.toString());
  
      // Obtener la última propiedad del objeto `parsedMessage`
      const lastPropertyKey = Object.keys(parsedMessage).pop();
      const lastPropertyValue = parsedMessage[lastPropertyKey];
  
      if (!lastPropertyKey || !lastPropertyValue) {
        throw new Error(`El mensaje recibido desde ${queueName} no contiene propiedades válidas.`);
      }
  
      // Emitir los datos usando el socketManager con la última propiedad
      this.socketManager.broadcast(queueName, lastPropertyValue);

      
  
      // Llamar a la función específica para manejar datos en tiempo real
      this.realTimeFunction(parsedMessage);
  
      // Confirmar que el mensaje fue procesado correctamente
      this.channel.ack(message);
    } catch (error) {
      console.error(`Error al manejar mensaje en tiempo real desde la cola "${queueName}":`, error);
      
      // Puedes decidir si deseas hacer un `nack` aquí en caso de error
      // this.channel.nack(message);
    }
  }

  // Función para manejar datos en tiempo real (adaptable según necesidades)
  async realTimeFunction(data) {
    console.log("Datos en tiempo real recibidos:", data);
    // Aquí se puede implementar la lógica específica para datos en tiempo real
  }

  // Maneja las notificaciones recibidas y las guarda en la base de datos
  async handleNotificationMessage(msg) {
    try {
      const parsedMessage = JSON.parse(msg.content.toString());
      if (parsedMessage.alerts) {
        const alerts = parsedMessage.alerts;
        console.log("Alertas recibidas:", alerts); 

        for (const alert of alerts) {
          const alertId = {
            _id: new mongoose.Types.ObjectId(),
            ...alert,
          };

          try {
            const newAlert = new Alert(alertId);
            await newAlert.save();
            console.log("Alerta guardada en la colección Alert:", newAlert);
            this.alerts.push(newAlert._id);
          } catch (error) {
            console.error(
              "Error al guardar la alerta en la colección Alert:",
              error
            );
          }
        }

        console.log(
          "Alertas procesadas y agregadas al array this.alerts:",
          this.alerts[this.alerts.length - 1]
        );
        this.channel.ack(msg); // Confirmar que el mensaje se procesó
      } else {
        console.error("No se recibió una notificación válida");
        this.channel.nack(msg); // No confirmar el mensaje si no es válido
      }
    } catch (error) {
      console.error("Error al procesar el mensaje de notificación:", error);
      this.channel.nack(msg); // No confirmar el mensaje en caso de error
    }
  }

  // Guarda el historial en la base de datos
  async handleHistoryMessage(msg) {
    try {
      const parsedMessage = JSON.parse(msg.content.toString());
      await this.saveHistory(parsedMessage);
      this.channel.ack(msg); // Confirmar que el mensaje se procesó correctamente
    } catch (error) {
      console.error("Error al guardar historial:", error);
      this.channel.nack(msg); // No confirmar el mensaje en caso de error
    }
  }

  // Guardar datos en la colección de historial
  async saveHistory(message) {
    console.log("Guardando historial:", message);
    try {
      const temperature_actual = message.data?.temperature_actual;
      const humidity_actual = message.data?.humidity_actual;

      // Procesar datos para almacenar en la base de datos
      const mapData = (dataArray, key) =>
        (Array.isArray(dataArray) ? dataArray : [dataArray]).map((item) => ({
          value: item,
          time: message.timestamp || new Date().toISOString(),
        }));

      const temperatures = mapData(message.data?.temperatures, "temperatures");
      const humidities = mapData(message.data?.humidities, "humidities");
      const weights = mapData(message.data?.weights, "weights");

      // Crear y guardar nueva instancia de historial
      const newHistory = new History({
        id: message.device,
        temperatures,
        humidities,
        temperature_actual,
        humidity_actual,
        weights,
        fruit: message.data?.fruit || "",
        automatic: Boolean(message.data?.automatic),
        hours: Number(message.data?.hours) || 0,
        minutes: Number(message.data?.minutes) || 0,
        alerts: this.alerts,
        date: new Date(message.timestamp),
      });

      await newHistory.save();
      console.log("Historial guardado correctamente.");
    } catch (error) {
      console.error("Error al guardar el historial:", error);
    }
  }

  // Manejo de errores en la conexión
  handleConnectionError(error) {
    console.error("Error en la conexión RabbitMQ:", error);
    setTimeout(() => this.connect(), mqttConfig.reconnectTimeout);
  }

  // Manejo de cierre de conexión
  handleConnectionClose() {
    console.log("Conexión RabbitMQ cerrada. Reintentando...");
    setTimeout(() => this.connect(), mqttConfig.reconnectTimeout);
  }

  // Reiniciar alertas
  resetAlerts() {
    this.alerts = [];
    console.log("Alertas reseteadas");
  }
}

export default MqttService;
