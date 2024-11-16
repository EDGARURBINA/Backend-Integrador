import express from "express";
import morgan from "morgan";
import cors from 'cors';
import http from "http";
import authRoutes from "./routes/auth.routes.js";
import deviceRoutes from "./routes/device.routes.js";
import pre_setRoutes from "./routes/pre_set.routes.js";

import SocketManager from "./services/Socket.js";
import MqttService from "./services/mqtt.service.js";

class App {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.socketManager = null;
    this.mqttService = null;
    this.setupMiddlewares();
    this.setupRoutes();
  }

  setupMiddlewares() {
    // Configuración de CORS más detallada
    this.app.use(cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"]
    }));
    this.app.use(express.json());
    this.app.use(morgan("dev"));
  }

  setupRoutes() {
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/devices", deviceRoutes);
    this.app.use("/api/pre_sets", pre_setRoutes);
    
    // Ruta de health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });

    // Manejo de rutas no encontradas
    this.app.use((req, res) => {
      res.status(404).json({ message: "Ruta no encontrada" });
    });
  }

  async initialize() {
    try {
      // Inicializar SocketManager primero
      this.socketManager = new SocketManager(this.server);
      this.socketManager.initialize();
      console.log('Socket Manager inicializado correctamente');

      // Inicializar MqttService después
      this.mqttService = new MqttService(this.socketManager);
      await this.mqttService.connect(); 
      console.log('MQTT Service conectado correctamente');

      // Manejador de errores no capturados
      process.on('uncaughtException', (error) => {
        console.error('Error no capturado:', error);
      });

      process.on('unhandledRejection', (reason, promise) => {
        console.error('Promesa rechazada no manejada:', reason);
      });

      console.log('Aplicación inicializada correctamente');
    } catch (error) {
      console.error("Error al inicializar la aplicación:", error);
      process.exit(1);
    }
  }

  getServer() {
    return this.server;
  }
}       

// Crear y inicializar la aplicación
const app = new App();
await app.initialize();

export default app.server;