import { Server } from "socket.io";
import Device from "../models/Device.js";
import History from "../models/History.js";

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
      socket.on("toggleProcess", (data) => this.handleToggleProcess(socket, data));
      socket.on("message", (data) => this.handleClientMessage(socket, data));
      socket.on("device", (data) => this.handleDeviceHistory(socket, data)); 
      socket.on("disconnect", () => this.handleDisconnect(socket));
      socket.on("real-time-data", (data) => this.handleRealTimeData(data));

    });
  }

  handleRealTimeData(data) {
    console.log("Datos en tiempo real recibidos:", data);

    // Emitir los datos a todos los clientes conectados
    this.io.emit("real-time", data);
  }

  async handleToggleProcess(socket, data) {
    console.log(`Comando de proceso recibido de ${socket.id}:`, data);
  
    try {
      const device = await Device.findOne({ id: data.id });
  
      if (!device) {
        console.log(`No se encontró el dispositivo con ID: ${data.id}`);
        return;
      }
  
      const newProcessState = data.process !== undefined ? data.process : !device.process;
  
      const result = await Device.findOneAndUpdate(
        { id: data.id },
        { $set: { process: newProcessState } },
        { new: true }
      );
  
      if (result) {
        console.log(`Proceso del dispositivo ${data.id} ${result.process ? 'iniciado' : 'detenido'}`);
  
        // Guardar historial al cambiar el estado del proceso
        const newHistory = new History({
          deviceId: data.id,
          historyData: {
            processState: result.process,
            timestamp: new Date(),
          },
          timestamp: new Date(),
        });
        await newHistory.save();
        console.log("Historial de proceso guardado correctamente.");
  
        // Emitir el estado del proceso al cliente
        this.broadcast("process-control", {
          id: data.id,
          process: result.process,
        });
      }
    } catch (error) {
      console.error("Error al actualizar el dispositivo:", error);
    }
  }

  // Método utilizado por MqttService para broadcast de eventos
  broadcast(event, data) {
    console.log(`Broadcasting event '${event}' with data:`, data);
    this.io.emit(event, data);
  }
  
  sendMessage(socket, message) {
    socket.emit("message", message);
  }


  async handleMessage(queueType, message) {
    if (!message) return;

    try {
        const receivedMessage = JSON.parse(message.content.toString());

        if (queueType === 'history') {
            await this.saveHistory(receivedMessage);
        } else if (queueType === 'notifications') {
            await this.handleNotification(receivedMessage);
        } else if (queueType === 'sensordata') {
            const {
                humidity_actual,
                temperature_actual,
                hours_actual,
                minute_actual,
                weight,
                airPurity,
                
            } = receivedMessage;

            if (
                humidity_actual !== undefined &&
                temperature_actual !== undefined &&
                hours_actual !== undefined &&
                minute_actual !== undefined &&
                weight !== undefined

                
            ) {
                // Transmitir datos a través de WebSocket
                this.socketManager.broadcast('real-time-data', {
                    humidity_actual,
                    temperature_actual,
                    hours_actual,
                    minute_actual,
                    weight,
                    airPurity
                });
            }
        }

        this.channel.ack(message); // Confirmar que se procesó el mensaje
    } catch (error) {
        console.error('Error al procesar mensaje:', error);
        this.channel.ack(message);
    }
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

  async handleDeviceHistory(socket, data) {
    console.log(`Historial de dispositivo recibido de ${socket.id}:`, data);
  
    // Guardar el historial en la base de datos
    try {
      const newHistory = new History({
        deviceId: data.deviceId,
        historyData: data.historyData,
        timestamp: new Date(),
      });
      await newHistory.save();
      console.log("Historial guardado correctamente.");
  
      // Enviar confirmación al cliente
      this.sendMessage(socket, {
        msg: "Historial de dispositivo guardado",
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error al guardar el historial:", error);
    }
  
    // Emitir el historial de vuelta a otros clientes si es necesario
    this.broadcast("deviceHistory", data);
  }
  handleDisconnect(socket) {
    console.log(`Cliente desconectado - ID: ${socket.id}`);
    this.connectedClients.delete(socket.id);
  }
}




export default SocketManager;