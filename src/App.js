import express from "express";
import morgan from "morgan";
import cors from 'cors';
import http from "http";
import authRoutes from "./routes/auth.routes.js";
import deviceRoutes from "./routes/device.routes.js";
import pre_setRoutes from "./routes/pre_set.routes.js";
import temperatureRoutes from "./routes/temperature.routes.js";
import SocketManager from "./services/Socket.js";
import MqttService from "./services/mqtt.service.js";

class App {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.socketManager = new SocketManager(this.server);
    this.mqttService = null;
    this.setupMiddlewares();
    this.setupRoutes();
  }

  setupMiddlewares() {
    this.app.use(cors({
      origin: "*",
      methods: ["GET", "POST"]
    }));
    this.app.use(express.json());
    this.app.use(morgan("dev"));
  }

  setupRoutes() {
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/devices", deviceRoutes);
    this.app.use("/api/pre_sets", pre_setRoutes);
    
  }

  async initialize() {
    try {
      
      this.socketManager.initialize();

      this.mqttService = new MqttService(this.socketManager);
      await this.mqttService.connect(); 

      console.log('Aplicación inicializada correctamente');
    } catch (error) {
      console.error("Error al inicializar la aplicación:", error);
      process.exit(1);
    }
  }
}       
const app = new App();

await app.initialize();

export default app.server;