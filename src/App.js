import express from "express";
import morgan from "morgan";
import { createRoles } from "./libs/inicialSetup.js";
import cors from 'cors';
import http from "http";
import amqp from 'amqplib';
import authRoutes from "./routes/auth.routes.js";
import deviceRoutes from "./routes/device.routes.js";
import pre_setRoutes from "./routes/pre_set.routes.js";
import temperatureRoutes from "./routes/temperature.routes.js";
import Temperature from "./models/Temperature.js";
import SocketManager from "./services/Socket.js";

const app = express();
const server = http.createServer(app);

// Configuración de CORS
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));

// Configuración de RabbitMQ
const rabbitSettings = {
  protocol: 'amqp',
  hostname: '54.163.129.164',
  port: 5672,
  username: 'blocksolutions',
  password: 'leedpees'
};
const queue = 'conection';

// Inicializar RabbitMQ, SocketManager y la configuración inicial
(async () => {
  try {
    await setupRabbitMQ();
    await createRoles();
    socketManager.initialize();  // Inicializa el manejador de sockets
  } catch (error) {
    console.error("Error al inicializar:", error);
  }
})();
// Instancia de SocketManager
const socketManager = new SocketManager(server);

// Función para iniciar RabbitMQ
async function setupRabbitMQ() {
  try {
    const connection = await amqp.connect(rabbitSettings);
    console.log('Conectado a RabbitMQ');

    connection.on('error', (err) => {
      console.error('Error en la conexión RabbitMQ:', err);
      setTimeout(setupRabbitMQ, 5000);
    });

    connection.on('close', () => {
      console.log('Conexión RabbitMQ cerrada. Reintentando...');
      setTimeout(setupRabbitMQ, 5000);
    });

    const channel = await connection.createChannel();
    console.log('Canal RabbitMQ creado');

    await channel.assertQueue(queue, { durable: true });
    console.log(`Escuchando la cola ${queue}`);

    channel.consume(queue, async (message) => {
      if (message) {
        try {
          const receivedMessage = JSON.parse(message.content.toString());
          console.log('Mensaje MQTT recibido:', receivedMessage);

          // Guardar en la base de datos
          const newTemperature = new Temperature({
            temperature: receivedMessage.data.temperature,
            humidity: receivedMessage.data.humidity,
            date: new Date(),
            id_dispositivos: receivedMessage.device
          });
          socketManager.sendMessage(socket, {
            temperature: receivedMessage.data.temperature,
            humidity: receivedMessage.data.humidity,
          })
          await newTemperature.save();
          console.log("Registro de temperatura guardado en la base de datos.");

          // Emitir el mensaje a todos los clientes conectados
          socketManager.io.emit('mqtt-message', {
            type: 'mqtt',
            data: receivedMessage,
            timestamp: new Date()
          });

          // Confirmar el mensaje
          channel.ack(message);
        } catch (error) {
          console.error('Error al procesar mensaje MQTT:', error);
          channel.ack(message);
        }
      }
    });

    return { connection, channel };
  } catch (error) {
    console.error('Error al configurar RabbitMQ:', error);
    setTimeout(setupRabbitMQ, 5000);
  }
}


// Rutas de la API
app.use(express.json());
app.use(morgan("dev"));
app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/pre_sets", pre_setRoutes);
app.use("/api/temperatures", temperatureRoutes);

export default server;
