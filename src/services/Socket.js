import { Server } from "socket.io";

class SocketManager {
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
      this.socket = socket;
      // Registrar cliente en el mapa
      this.connectedClients.set(socket.id, {
        connectionTime: new Date(),
        lastActivity: new Date(),
        reconnections: 0,
      });

      // Enviar mensaje inicial al cliente
      this.sendMessage({
        msg: "Conectado al servidor",
        id: socket.id,
      });

      // Monitorear actividad del cliente
      socket.on("message", (data) => this.handleClientMessage(socket, data));

      // Manejar desconexión
      socket.on("disconnect", () => this.handleDisconnect(socket));
    });
  }

  sendMessage( message) {
    this.socket.emit("message", message);
  }

  handleClientMessage( data) {
    console.log(`Mensaje recibido de ${this.socket.id}:`, data);

    if (this.connectedClients.has(this.socket.id)) {
      this.connectedClients.get(this.socket.id).lastActivity = new Date();
    }

    this.sendMessage({
      msg: "Mensaje recibido correctamente",
      timestamp: new Date(),
    });
  }

  handleDisconnect() {
    console.log(`Cliente desconectado - ID: ${this.socket.id}`);
    this.connectedClients.delete(this.socket.id);
  }
}

export default SocketManager;
