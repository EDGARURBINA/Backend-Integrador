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

      this.connectedClients.set(socket.id, {
        connectionTime: new Date(),
        lastActivity: new Date(),
        reconnections: 0,
      });

      this.sendMessage(socket, {
        msg: "Conectado al servidor"
      });

      // Escucha el evento `togglePower` desde el cliente
      socket.on("togglePower", (data) => this.handleTogglePower(socket, data));

      socket.on("message", (data) => this.handleClientMessage(socket, data));
      socket.on("disconnect", () => this.handleDisconnect(socket));
    });

    // Aquí emito un evento manualmente (por ejemplo, después de 5 segundos)
    setTimeout(() => {
      this.emitPowerControl("on"); 
    }, 5000); 
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

    
    this.io.emit("power-control", {
      action: action === "on", // Si es "on", se envía true, si no, false
    });
  }

  handleTogglePower(socket, data) {
    console.log(`Comando de encendido/apagado recibido de ${socket.id}:`, data);

    
    const action = data.action === "on" ? true : false;

    // Emite el comando al cliente de la Raspberry Pi
    this.io.emit("power-control", {
      action: action,
    });
  }

  handleDisconnect(socket) {
    console.log(`Cliente desconectado - ID: ${socket.id}`);
    this.connectedClients.delete(socket.id);
  }
}

export default SocketManager;
