import amqp from 'amqplib';
import { mqttConfig } from '../config/mqtt.js';
import History from "../models/History.js";

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

      const { temperature, humidity } = receivedMessage;

      if (queueType === 'history') {
        await this.saveHistory(receivedMessage);
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

  async saveHistory(message) {
    console.log("Guardando historial:", message);
    try {
      const newHistory = new History({
        id: message.id,
        temperatures: message.temperatures,
        humidities: message.humidities,
        weights: message.weights,
        fruit: message.fruit,
        automatic: message.automatic,
        hours: message.hours,
        minutes: message.minutes,
        alerts: message.alerts, 
        date: new Date()
      });
      await newHistory.save();
      console.log("Historial guardado correctamente.");
    } catch (error) {
      console.error("Error al guardar historial:", error);
    }
  }

  async saveRealDates(message) {
    console.log("Guardando fechas reales:", message);
    // Aquí iría la lógica para guardar en la base de datos si es necesario
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