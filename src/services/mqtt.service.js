import amqp from 'amqplib';
import { mqttConfig } from '../config/mqtt.js';
import History from "../models/History.js";
import Alert from '../models/Alert.js';
import mongoose from 'mongoose';


class MqttService {
  constructor(socketManager) {
    this.socketManager = socketManager;
    this.connection = null;
    this.channel = null;


    this.alerts = []; // Array donde acumulamos las alertas

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
  
      // Iteramos sobre cada alerta y la agregamos al arreglo `this.alert`
      alerts.forEach(alert => {
        const alertId = {
          _id: new mongoose.Types.ObjectId(),  // Generar un ID único para cada alerta
          ...alert  // Copiar todas las propiedades de la alerta
        };
        
        // Agregar la alerta al array `this.alert`
        this.alerts.push(alertId);
  
        console.log("Añadiendo alerta al array this.alert:", alertId);
      });
  
      console.log("Alertas procesadas y agregadas al array this.alert:", this.alerts);
      return this.alerts;  // Devolver las alertas procesadas
    } else {
      console.error("No se recibió una notificación válida");
      return [];  // Retornamos un array vacío si no hay notificación
    }
  }
  
  

  async saveHistory(message) {
    console.log("Guardando historial:", message);
    try {  

          // Verificar si message.data existe y tiene las propiedades necesarias
    const temperatures = Array.isArray(message.data?.temperatures) ? message.data.temperatures : [message.data?.temperatures];
    const humidities = Array.isArray(message.data?.humidities) ? message.data.humidities : [message.data?.humidities];
    const weights = Array.isArray(message.data?.weights) ? message.data.weights : [message.data?.weights];


      // Ahora que tienes los alertIds, proceder con la creación del historial
      const newHistory = new History({
        id: message.device,
        temperatures: temperatures,
        humidities: humidities,
        weights: weights,
        fruit: message.data?.fruit || '',
        automatic: Boolean(message.data?.automatic),
        hours: Number(message.data?.hours) || 0,
        minutes: Number(message.data?.minutes) || 0,
        alerts: this.alerts,  // Agregar las alertas procesadas al historial
        notification: message.notification || {},  // Añadir la notificación al historial
        date: new Date(message.timestamp)
      });
  
      await newHistory.save();
      console.log("Historial guardado correctamente con", this.alerts.length , "alertas y notificación.");
  
      // Broadcast
      this.socketManager.broadcast('device', newHistory);
      console.log("Evento 'device' emitido a los clientes");
      this.resetAlerts();  // Aquí limpias el array de alertas

    } catch (error) {
      console.error("Error al guardar historial:", error);
      throw error;
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