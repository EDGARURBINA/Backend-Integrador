import { Server } from "socket.io";

class SocketManager {
  io;
  connectedClients;

  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*", // Cambia esto según tu frontend
        methods: ["GET", "POST"],
      },
    });
    this.connectedClients = new Map();
  }

  initialize() {
    this.io.on("connection", (socket) => {
      console.log(`Cliente conectado - ID: ${socket.id}`);

      // Registrar cliente en el mapa
      this.connectedClients.set(socket.id, {
        connectionTime: new Date(),
        lastActivity: new Date(),
        reconnections: 0,
      });

      // Enviar mensaje inicial al cliente
      this.sendMessage(socket, {
        msg: "Conectado al servidor"
      });

      // Monitorear actividad del cliente
      socket.on("message", (data) => this.handleClientMessage(socket, data));

      // Manejar desconexión
      socket.on("disconnect", () => this.handleDisconnect(socket));
    });
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

  handleDisconnect(socket) {
    console.log(`Cliente desconectado - ID: ${socket.id}`);
    this.connectedClients.delete(socket.id);
  }
}

export default SocketManager;