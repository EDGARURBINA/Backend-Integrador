import { Server } from "socket.io";
import Device from "../models/Device.js";

class SocketManager {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    this.connectedClients = new Map();
  }

  initialize() {
    this.io.on("connection", (socket) => {
      console.log(`Cliente conectado - ID: ${socket.id}`);
   
      this.connectedClients.set(socket.id, {
        connectionTime: new Date(),
        lastActivity: new Date(),
        reconnections: 0,
      });

      this.sendMessage(socket, {
        msg: "Conectado al servidor",
      });
      
      socket.on("togglePower", (data) => this.handleTogglePower(socket, data));
      socket.on("message", (data) => this.handleClientMessage(socket, data));
      socket.on("device", (data) => this.handleDeviceHistory(socket, data)); 
      socket.on("disconnect", () => this.handleDisconnect(socket));
    });
  }

  // Método utilizado por MqttService para broadcast de eventos
  broadcast(event, data) {
    console.log(`Broadcasting event '${event}' with data:`, data);
    this.io.emit(event, data);
  }
  
  sendMessage(socket, message) {
    socket.emit("message", message);
  }

  handleClientMessage(socket, data) {
    console.log(`Mensaje recibido de ${socket.id}:`, data);
    
    if (this.connectedClients.has(socket.id)) {
      this.connectedClients.get(socket.id).lastActivity = new Date();
    }
  
    this.sendMessage(socket, {
      msg: "Mensaje recibido correctamente",
      timestamp: new Date(),
    });
  }
  
  emitPowerControl(action) {
    console.log(`Comando de encendido/apagado emitido desde el servidor: ${action}`);
    this.io.emit("power-control", { action: action === "on" });    
  }

  async handleTogglePower(socket, data) {
    console.log(`Comando de pause recibido de ${socket.id}:`, data);

    try {
      const device = await Device.findOne({ id: data.id });

      if (!device) {
        console.log(`No se encontró el dispositivo con ID: ${data.id}`);
        return;
      }

      const newPauseState = data.pause !== undefined ? data.pause : !device.pause;

      const result = await Device.findOneAndUpdate(
        { id: data.id },
        { $set: { pause: newPauseState } },
        { new: true }
      );

      if (result) {
        console.log(`Dispositivo ${data.id} ${result.pause ? 'pausado' : 'activado'}`);
        
        this.broadcast("power-control", {
          id: data.id,
          pause: result.pause
        });
      }
    } catch (error) {
      console.error("Error al actualizar el dispositivo:", error);
    }
  }

  handleDeviceHistory(socket, data) {
    console.log(`Historial de dispositivo recibido de ${socket.id}:`, data);
    
    const deviceHistory = {
      deviceId: data.deviceId,
      historyData: data.historyData, 
    };
    
    this.sendMessage(socket, {
      msg: "Historial de dispositivo recibido",
      deviceHistory: deviceHistory,
      timestamp: new Date(),
    });

    this.broadcast("deviceHistory", deviceHistory);
  }

  handleDisconnect(socket) {
    console.log(`Cliente desconectado - ID: ${socket.id}`);
    this.connectedClients.delete(socket.id);
  }
}

export default SocketManager;