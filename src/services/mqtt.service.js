import amqp from 'amqplib';
import { mqttConfig } from '../config/mqtt.js';
import Temperature from '../models/Temperature.js';

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
      await this.channel.assertQueue(mqttConfig.queue, { durable: true });
      
      this.channel.consume(mqttConfig.queue, this.handleMessage.bind(this));
      console.log(`Escuchando la cola ${mqttConfig.queue}`);
    } catch (error) {
      console.error('Error al configurar el canal:', error);
      throw error;
    }
  }

  async handleMessage(message) {
    if (!message) return;

    try {
      const receivedMessage = JSON.parse(message.content.toString());
      console.log('Mensaje MQTT recibido:', receivedMessage);

      await this.saveTemperature(receivedMessage);
      this.broadcastTemperature(receivedMessage);
      
      this.channel.ack(message);
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      this.channel.ack(message);
    }
  }

  async saveTemperature(message) {
    const newTemperature = new Temperature({
      temperature: message.data.temperature,
      humidity: message.data.humidity,
      date: new Date(),
      id_dispositivos: message.device
    });
    await newTemperature.save();
    console.log("Temperatura guardada en la base de datos");
  }

  broadcastTemperature(message) {
    this.socketManager.broadcast('temperature-update', {
      temperature: message.data.temperature,
      humidity: message.data.humidity
    });
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