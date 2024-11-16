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
      console.log(`Mensaje MQTT recibido de ${queueType}:`, receivedMessage); // Log del mensaje completo
  
      if (queueType === 'history') {
        console.log("Detalles del mensaje para 'history':", receivedMessage);
        await this.saveHistory(receivedMessage);
      } else if (queueType === 'real_dates') {
        console.log("Detalles del mensaje para 'real_dates':", receivedMessage);
        await this.saveRealDates(receivedMessage);
      }
  
      const { temperature, humidity } = receivedMessage;
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
      const alerts = Array.isArray(message.alert) ? message.alert : [];
      console.log("Procesando alertas:", alerts); 
  
      const alertIds = [];
  
      if (alerts.length > 0) {
        for (const alert of alerts) {
          if (!alert) {
            console.warn('Alerta inválida encontrada, saltando:', alert);
            continue;
          }
  
          const alertId = alert.id || `${alert.type}-${new Date().getTime()}`;
          try {
            const existingAlert = await Alert.findOne({ id: alertId });
            if (existingAlert) {
              alertIds.push(existingAlert._id);
            } else {
              const newAlert = new Alert({
                id: alertId, 
                description: alert.description || '',
                priority: alert.priority || 'low',
                date: alert.date || new Date()
              });
              const savedAlert = await newAlert.save();
              alertIds.push(savedAlert._id);
            }
          } catch (alertError) {
            console.error('Error al procesar alerta individual:', alertError);
          }
        }
      }

      const newHistory = new History({
        id: message.id,
        temperatures: Array.isArray(message.temperatures) ? message.temperatures : [],
        humidities: Array.isArray(message.humidities) ? message.humidities : [],
        weights: Array.isArray(message.weights) ? message.weights : [],
        fruit: message.fruit || '',
        automatic: Boolean(message.automatic),
        hours: Number(message.hours) || 0,
        minutes: Number(message.minutes) || 0,
        alerts: alertIds, 
        date: new Date()
        
      });
  
      await newHistory.save();
      console.log("Historial guardado correctamente con", alertIds.length, "alertas");
      
      // Emitir evento 'device' al cliente
      this.socketManager.broadcastDeviceUpdate(newHistory); 
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
}

export default MqttService;
