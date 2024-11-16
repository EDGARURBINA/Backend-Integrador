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
      console.log(`Mensaje MQTT recibido de ${queueType}:`, receivedMessage);
  
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

  async saveHistory(message) {
    console.log("Guardando historial:", message);
  
    try {
      const alertIds = [];
  
      // Verificar si hay alertas en el mensaje MQTT
      const alerts = message.notification ? [message.notification] : [];
      console.log("Alertas procesadas:", alerts);
  
      if (alerts.length > 0) {
        for (const alert of alerts) {
          const alertId = alert.id || `${alert.type}-${new Date().getTime()}`;
          console.log("ID de alerta:", alertId);  // Verificar el ID
  
          // Verificar si la alerta ya existe en la base de datos
          const existingAlert = await Alert.findOne({ id: alertId });
          if (existingAlert) {
            alertIds.push(existingAlert._id);
            console.log("Alerta existente encontrada:", existingAlert);
          } else {
            // Si no existe, crear una nueva alerta
            const newAlert = new Alert({
              id: alertId,
              description: alert.description || '',
              priority: alert.priority || 'low',
              date: alert.date || new Date()
            });
            console.log(alert.description);
            
  
            const savedAlert = await newAlert.save();
            alertIds.push(savedAlert._id);
            console.log("Nueva alerta guardada:", savedAlert);
          }
        }
      }
  
      // Ahora que tienes los alertIds, proceder con la creación del historial
      const newHistory = new History({
        id: message.device,
        temperatures: Array.isArray(message.data.temperatures) ? message.data.temperatures : [message.data.temperatures],
        humidities: Array.isArray(message.data.humidities) ? message.data.humidities : [message.data.humidities],
        weights: Array.isArray(message.data.weights) ? message.data.weights : [message.data.weights],
        fruit: message.data.fruit || '',
        automatic: Boolean(message.data.automatic),
        hours: Number(message.data.hours) || 0,
        minutes: Number(message.data.minutes) || 0,
        alerts: alertIds, // Asegúrate de que `alertIds` contiene IDs válidos
        notification: message.notification || {},  // Añadir la notificación al historial
        date: new Date(message.timestamp)
      });
  
      await newHistory.save();
      console.log("Historial guardado correctamente con", alertIds.length, "alertas y notificación.");
  
      // Broadcast
      this.socketManager.broadcast('device', newHistory);
      console.log("Evento 'device' emitido a los clientes");
  
    } catch (error) {
      console.error("Error al guardar historial:", error);
      throw error;
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

  // Método para manejar notificaciones si es necesario
  async handleNotification(message) {
    // Implementa la lógica para manejar notificaciones aquí
    console.log('Notificación recibida:', message);
  }
}

export default MqttService;