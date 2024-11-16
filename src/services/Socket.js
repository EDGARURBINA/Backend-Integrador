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

      // Almacenar información del cliente conectado
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

  
  broadcast(event, data) {
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
    console.log(`Comando de encendido/apagado recibido de ${socket.id}:`, data);
  
    const action = data.off_on;  // Determina si es "on" (true) o "off" (false)
  
    try {
      
      const result = await Device.updateOne(
        { id: data.id },  // Filtra por el id del dispositivo
        { $set: { off_on: action } }  // Guarda la acción en el campo 'off_on'
      );
  
      if (result.nModified === 1) {
        console.log("Acción guardada correctamente en el dispositivo");
  
        // Aquí puedes emitir el evento a los clientes si deseas notificar el cambio
        this.io.emit("power-control", { action });
      } else {
        console.log("No se encontró el dispositivo o no hubo cambios");
      }
    } catch (error) {
      console.error("Error al guardar la acción en el dispositivo:", error);
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

    // También puedes broadcast a todos los clientes si quieres compartir el historial
    this.broadcast("deviceHistory", deviceHistory);
  }

  // Manejar la desconexión del cliente
  handleDisconnect(socket) {
    console.log(`Cliente desconectado - ID: ${socket.id}`);
    this.connectedClients.delete(socket.id);
  }
}

export default SocketManager;
