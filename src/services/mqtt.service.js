import amqp from 'amqplib';
import { mqttConfig } from '../config/mqtt.js';

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

      // Aseguramos que ambas colas estén configuradas
      await this.channel.assertQueue(mqttConfig.queueHistory, { durable: true });
      await this.channel.assertQueue(mqttConfig.queueRealDates, { durable: true });

      // Consumir mensajes de ambas colas
      this.channel.consume(mqttConfig.queueHistory, this.handleMessage.bind(this, 'history'), { noAck: false });
      this.channel.consume(mqttConfig.queueRealDates, this.handleMessage.bind(this, 'real_dates'), { noAck: false });

      console.log(`Escuchando las colas ${mqttConfig.queueHistory} y ${mqttConfig.queueRealDates}`);
    } catch (error) {
      console.error('Error al configurar el canal:', error);
      throw error;
    }
  }

  // Esta función ahora maneja mensajes de ambas colas
  async handleMessage(queueType, message) {
    if (!message) return;

    try {
      const receivedMessage = JSON.parse(message.content.toString());
      console.log(`Mensaje MQTT recibido de ${queueType}:`, receivedMessage);

      if (queueType === 'history') {
        await this.saveHistory(receivedMessage);
      } else if (queueType === 'real_dates') {
        await this.saveRealDates(receivedMessage);
      }
      
      // Confirmamos que el mensaje fue procesado correctamente
      this.channel.ack(message);
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      this.channel.ack(message); // Acknowledging even in case of error to prevent message loss
    }
  }

  // Guardar mensaje en la base de datos para la cola 'history'
  async saveHistory(message) {
    // Aquí puedes implementar la lógica para guardar los datos de historial
    console.log("Guardando historial:", message);
    // Ejemplo de cómo guardar en la base de datos
    // const newHistory = new History({
    //   id: message.id,
    //   temperatures: message.temperatures,
    //   humidities: message.humidities,
    //   weights: message.weights,
    //   fruit: message.fruit,
    //   automatic: message.automatic,
    //   hours: message.hours,
    //   minutes: message.minutes,
    //   alerts: message.alerts
    // });
    // await newHistory.save();
  }

  // Guardar mensaje en la base de datos para la cola 'real_dates'
  async saveRealDates(message) {
    // Aquí puedes implementar la lógica para guardar los datos de fechas reales u otros datos
    console.log("Guardando fechas reales:", message);
    // Ejemplo de cómo guardar en la base de datos
    // const newRealDate = new RealDate({
    //   id: message.id,
    //   date: message.date,
    //   otherFields: message.otherFields // Ajusta según tu esquema
    // });
    // await newRealDate.save();
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
