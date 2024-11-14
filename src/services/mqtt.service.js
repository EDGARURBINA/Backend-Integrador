import amqp from 'amqplib';
import { mqttConfig } from '../config/mqtt.js';
import History from "../models/History.js";
import Alert from '../models/Alert.js';

class MqttService {
  constructor(socketManager) {
    this.socketManager = socketManager;
    this.connection = null;
    this.channel = null;
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
      await this.channel.assertQueue(mqttConfig.queueRealDates, { durable: true });

      this.channel.consume(mqttConfig.queueHistory, this.handleMessage.bind(this, 'history'), { noAck: false });
      this.channel.consume(mqttConfig.queueRealDates, this.handleMessage.bind(this, 'real_dates'), { noAck: false });

      console.log(`Escuchando las colas ${mqttConfig.queueHistory} y ${mqttConfig.queueRealDates}`);
    } catch (error) {
      console.error('Error al configurar el canal:', error);
      throw error;
    }
  }

  async handleMessage(queueType, message) {
    if (!message) return;

    try {
      const receivedMessage = JSON.parse(message.content.toString());
      console.log(`Mensaje MQTT recibido de ${queueType}:`, receivedMessage);

      const { temperature, humidity, alerts } = receivedMessage;

      if (queueType === 'history') {
        await this.saveHistory(receivedMessage, alerts); // Pasamos las alertas como parámetro
      } else if (queueType === 'real_dates') {
        await this.saveRealDates(receivedMessage);
      }

      // Enviar datos de temperatura y humedad al cliente
      this.socketManager.broadcast('sensorData', { temperature, humidity });
      this.channel.ack(message);
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      this.channel.ack(message);
    }
  }

  // Modificar saveHistory para manejar alertas como ObjectId
  async saveHistory(message, alerts) {
    console.log("Guardando historial:", message);
    try {
      // Primero, si las alertas no están en la base de datos, guardarlas
      const alertIds = [];
      for (let alert of alerts) {
        const existingAlert = await Alert.findOne({ id: alert.id });
        if (existingAlert) {
          alertIds.push(existingAlert._id); // Si la alerta ya existe, usamos su _id
        } else {
          const newAlert = new Alert(alert); // Si la alerta no existe, crearla
          const savedAlert = await newAlert.save();
          alertIds.push(savedAlert._id); // Usamos el _id de la nueva alerta
        }
      }

      // Ahora guardar el historial, referenciando las alertas
      const newHistory = new History({
        id: message.id,
        temperatures: message.temperatures,
        humidities: message.humidities,
        weights: message.weights,
        fruit: message.fruit,
        automatic: message.automatic,
        hours: message.hours,
        minutes: message.minutes,
        alerts: alertIds, // Referencias a las alertas
        date: new Date()
      });

      await newHistory.save();
      console.log("Historial guardado correctamente.");
    } catch (error) {
      console.error("Error al guardar historial:", error);
    }
  }

  handleConnectionError(error) {
    console.error('Error en la conexión RabbitMQ:', error);
    setTimeout(() => this.connect(), mqttConfig.reconnectTimeout);
  }

  handleConnectionClose() {
    console.log('Conexión RabbitMQ cerrada. Reintentando...');
    setTimeout(() => this.connect(), mqttConfig.reconnectTimeout);
  }
}

export default MqttService;