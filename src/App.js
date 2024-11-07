import express from "express";
import morgan from "morgan";
import { createRoles } from "./libs/inicialSetup.js";
import cors from 'cors';
import http from "http";
import { Server } from "socket.io";
import amqp from 'amqplib';
import authRoutes from "./routes/auth.routes.js";
import deviceRoutes from "./routes/device.routes.js";
import pre_setRoutes from "./routes/pre_set.routes.js";
import Temperature from "./models/Temperature.js"
import temperatureRoutes from "./routes/temperature.routes.js"

const app = express();
const server = http.createServer(app);


app.use(cors({
    origin: ["*"],
    methods: ["GET", "POST"],
}));


const rabbitSettings = {
    protocol: 'amqp',
    hostname: '54.163.129.164',
    port: 5672,
    username: 'blocksolutions',
    password: 'leedpees'
};

const queue = 'conection';

// Configuración de Socket.IO
const io = new Server(server, {
    cors: {
        origin: ["*"],
        methods: ["GET", "POST"],
    }
});

// Almacenar clientes conectados
const connectedClients = new Map();

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

                    await newTemperature.save();
                    console.log("Registro de temperatura guardado en la base de datos.");

                    // Emitir el mensaje a todos los clientes WebSocket conectados
                    io.emit('mqtt-message', {
                        type: 'mqtt',
                        data: receivedMessage,
                        timestamp: new Date()
                    });

                    // Acknowledge el mensaje
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


io.on("connection", (socket) => {
    console.log(`Cliente conectado - ID: ${socket.id}`);
    connectedClients.set(socket.id, {
        connectionTime: new Date(),
        lastActivity: new Date(),
        reconnections: 0
    });

    // Enviar información inicial al cliente
    socket.emit('message', { 
        msg: "Conectado al servidor", 
        id: socket.id 
    });

    // Monitorear actividad del cliente
    socket.on('message', (data) => {
        console.log(`Mensaje recibido de ${socket.id}:`, data);
        
        if (connectedClients.has(socket.id)) {
            connectedClients.get(socket.id).lastActivity = new Date();
        }

        socket.emit('message', { 
            msg: "Mensaje recibido correctamente",
            timestamp: new Date()
        });
    });

    // Manejar reconexiones
    socket.on('reconnect', (attemptNumber) => {
        console.log(`Cliente ${socket.id} reconectado - Intento #${attemptNumber}`);
        if (connectedClients.has(socket.id)) {
            connectedClients.get(socket.id).reconnections += 1;
        }
    });

    socket.on('ping', () => {
        if (connectedClients.has(socket.id)) {
            connectedClients.get(socket.id).lastActivity = new Date();
        }
        socket.emit('pong');
    });

    socket.on('disconnect', (reason) => {
        console.log(`Cliente ${socket.id} desconectado - Razón: ${reason}`);
        
        if (reason === 'ping timeout' || reason === 'transport close') {
            setTimeout(() => {
                if (!socket.connected) {
                    connectedClients.delete(socket.id);
                }
            }, 60000);
        } else {
            connectedClients.delete(socket.id);
        }
    });
});

// Monitoreo periódico de conexiones
setInterval(() => {
    const now = new Date();
    connectedClients.forEach((client, socketId) => {
        const inactiveTime = now - client.lastActivity;
        if (inactiveTime > 300000) {
            console.log(`Cliente ${socketId} inactivo por más de 5 minutos`);
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.disconnect(true);
            }
            connectedClients.delete(socketId);
        }
    });
}, 60000);


(async () => {
    try {
        await setupRabbitMQ();
        await createRoles();
    } catch (error) {
        console.error("Error al inicializar:", error);
    }
})();


app.use(express.json());
app.use(morgan("dev"));
app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/pre_sets", pre_setRoutes);
app.use("/api/temperatures", temperatureRoutes)

export default server;