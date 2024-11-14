import { Server } from "socket.io";

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

      // Notificar al cliente sobre la conexión exitosa
      this.sendMessage(socket, {
        msg: "Conectado al servidor",
      });

      // Escuchar eventos específicos del cliente
      socket.on("togglePower", (data) => this.handleTogglePower(socket, data));
      socket.on("message", (data) => this.handleClientMessage(socket, data));
      socket.on("device", (data) => this.handleDeviceHistory(socket, data)); // Evento para manejar historial de dispositivo
      socket.on("disconnect", () => this.handleDisconnect(socket));
    });
  }

  // Emitir evento a todos los clientes
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  // Enviar mensaje específico a un cliente
  sendMessage(socket, message) {
    socket.emit("message", message);
  }

  // Manejar mensajes enviados por el cliente
  handleClientMessage(socket, data) {
    console.log(`Mensaje recibido de ${socket.id}:`, data);

    // Actualizar la última actividad del cliente
    if (this.connectedClients.has(socket.id)) {
      this.connectedClients.get(socket.id).lastActivity = new Date();
    }

    // Responder al cliente confirmando la recepción del mensaje
    this.sendMessage(socket, {
      msg: "Mensaje recibido correctamente",
      timestamp: new Date(),
    });
  }

  // Emitir comando de encendido/apagado a todos los clientes
  emitPowerControl(action) {
    console.log(`Comando de encendido/apagado emitido desde el servidor: ${action}`);
    this.io.emit("power-control", { action: action === "on" });
  }

  
  handleTogglePower(socket, data) {
    console.log(`Comando de encendido/apagado recibido de ${socket.id}:`, data);
    const action = data.action === "on";
    this.io.emit("power-control", { action });
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
