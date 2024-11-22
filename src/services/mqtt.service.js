import amqp from 'amqplib';
import { mqttConfig } from '../config/mqtt.js';
import History from "../models/History.js";
import mongoose from 'mongoose';
import Alert from '../models/Alert.js';

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
      console.log('Conectado a RabbitMQ');
      
      this.connection.on('error', this.handleConnectionError.bind(this));
      this.connection.on('close', this.handleConnectionClose.bind(this));
      
      await this.setupChannel();
    } catch (error) {
      console.error('Error al conectar con RabbitMQ:', error);
      setTimeout(() => this.connect(), mqttConfig.reconnectTimeout);
    }
  }

  async setupChannel() {
    try {
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(mqttConfig.queueHistory, { durable: true });
      await this.channel.assertQueue(mqttConfig.queueNotifications, { durable: true });

      this.channel.consume(mqttConfig.queueHistory, this.handleMessage.bind(this, 'history'), { noAck: false });
      this.channel.consume(mqttConfig.queueNotifications, this.handleMessage.bind(this, 'notifications'), { noAck: false });

      console.log(`Escuchando las colas ${mqttConfig.queueHistory} y ${mqttConfig.queueNotifications}`);
    } catch (error) {
      console.error('Error al configurar el canal:', error);
      throw error;
    }
  }

  async handleMessage(queueType, message) {
    if (!message) return;
  
    try {
      const receivedMessage = JSON.parse(message.content.toString());

      if (queueType === 'history') {
        await this.saveHistory(receivedMessage);
      } else if (queueType === 'notifications') {
        // Asegúrate de tener implementado este método si lo necesitas
        await this.handleNotification(receivedMessage);
      }
  
      const { temperature, humidity } = receivedMessage;
      if (temperature !== undefined && humidity !== undefined) {
        this.socketManager.broadcast('sensorData', { temperature, humidity });
      }
      
      this.channel.ack(message);
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      this.channel.ack(message);
    }
  }


  async handleNotification(message) {
    if (message.notification) {
      // Asegurarse de que el mensaje de notificación sea un array
      const alerts = Array.isArray(message.notification) ? message.notification : [message.notification];
  
      
      for (const alert of alerts) {
        const alertId = {
          _id: new mongoose.Types.ObjectId(),  
          ...alert,  // Copiar todas las propiedades de la alerta
        };
  
        
        try {
          const newAlert = new Alert(alertId);  // Crear un nuevo documento de alerta
          await newAlert.save();  // Guardar la alerta en la base de datos
          console.log("Alerta guardada en la colección Alert:", newAlert);
          
          // Agregar el ID de la alerta al array de alertas procesadas
          this.alerts.push(newAlert._id);
        } catch (error) {
          console.error("Error al guardar la alerta en la colección Alert:", error);
        }
      }
  
      console.log("Alertas procesadas y agregadas al array this.alert:", this.alerts);
      return this.alerts;  // Devolver los IDs de las alertas procesadas
    } else {
      console.error("No se recibió una notificación válida");
      return [];  // Retornamos un array vacío si no hay notificación
    }
  }
  
  
  async saveHistory(message) {
    console.log("Guardando historial:", message);
    try {
          //  valores de temperature_actual y humidity_actual desde el mensaje
    const temperature_actual = message.data?.temperature_actual;
    const humidity_actual = message.data?.humidity_actual;

    
      // Mapear los datos de temperatura, humedad y peso para que incluyan el valor y el tiempo
      const temperatures = (Array.isArray(message.data?.temperatures)
        ? message.data.temperatures
        : [message.data?.temperatures]
      ).map((temp) => ({
        value: temp,
        time: message.timestamp || new Date().toISOString(), l
      }));
  
      const humidities = (Array.isArray(message.data?.humidities)
        ? message.data.humidities
        : [message.data?.humidities]
      ).map((humidity) => ({
        value: humidity,
        time: message.timestamp || new Date().toISOString(),
      }));
  
      const weights = (Array.isArray(message.data?.weights)
        ? message.data.weights
        : [message.data?.weights]
      ).map((weight) => ({
        value: weight,
        time: message.timestamp || new Date().toISOString(),
      }));
  
      // Crear una nueva instancia del historial con los datos procesados
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
        alerts: this.alerts, // Agrega alertas procesadas o un arreglo vacío
        date: new Date(message.timestamp), 
      });
  
      
      await newHistory.save();
      console.log("Historial guardado correctamente.");
    } catch (error) {
      console.error("Error al guardar el historial:", error);
    }
  }

  
  handleConnectionError(error) {
    console.error('Error en la conexión RabbitMQ:', error);
    setTimeout(() => this.connect(), mqttConfig.reconnectTimeout);
  }

  resetAlerts() {
    this.alerts = [];  // Asignamos un nuevo array vacío a this.alerts
    console.log("Alertas reseteadas");
  }

  handleConnectionClose() {
    console.log('Conexión RabbitMQ cerrada. Reintentando...');
    setTimeout(() => this.connect(), mqttConfig.reconnectTimeout);
  }


}

export default MqttService;