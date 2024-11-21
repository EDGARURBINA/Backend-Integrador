import Device from "../models/Device.js"
import History from "../models/History.js"
import User from "../models/User.js";

export const createDevice = async (req, res) => {
    try {
        const device = new Device(req.body);
        const savedDevice = await device.save();
        res.status(201).json(savedDevice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};




export const updateDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedDevice = await Device.findOneAndUpdate(
            { id: id }, 
            req.body,
            { new: true }
        );
        
        if (!updatedDevice) {
            return res.status(404).json({ message: "Dispositivo no encontrado" });
        }

        res.json(updatedDevice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedDevice = await Device.findOneAndDelete({ id: id });
        
        if (!deletedDevice) {
            return res.status(404).json({ message: "Dispositivo no encontrado" });
        }

        res.json({ message: "Dispositivo eliminado exitosamente" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getAllDevices = async (req, res) => {
    try {
        const devices = await Device.find();
        res.json(devices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getDeviceById = async (req, res) => {
    try {
        const { id } = req.params;
        const device = await Device.findOne({ id: id });
        
        if (!device) {
            return res.status(404).json({ message: "Dispositivo no encontrado" });
        }

        res.json(device);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getDeviceHistory = async (req, res) => {
    try {
        const { id } = req.params;
        
        
        const device = await Device.findOne({ id: id });
        if (!device) {
            return res.status(404).json({ message: "Dispositivo no encontrado" });
        }

        // Buscar los historiales relacionados con el dispositivo usando el ID
        const histories = await History.find({ id: device.id });
        res.json(histories);
    } catch (error) {
        console.error("Error al obtener el historial del dispositivo:", error);
        res.status(500).json({ message: error.message });
    }
};



export const addManualHistory = async (req, res) => {
    try {
      const { device, timestamp, data } = req.body;
  
      // Verificar que los datos sean válidos
      if (!device || !timestamp || !data) {
        return res.status(400).json({ message: "Datos incompletos." });
      }
  
      // Crear un nuevo historial con los datos completos
      const newHistory = new History({
        id: device,
        temperatures: data.temperatures || [],
        humidities: data.humidities || [],
        weights: data.weights || [],
        fruit: data.fruit || "",
        automatic: data.automatic || false,
        hours: data.hours || 0,
        minutes: data.minutes || 0,
        alerts: [],  // Si no hay alertas, puedes dejarlo vacío
        date: new Date(timestamp || Date.now()), 
      });
  
      // Guardar el historial
      await newHistory.save();
  
      // Actualizar el dispositivo, agregando el historial
      const foundDevice = await Device.findOne({ id: device });
      if (!foundDevice) {
        return res.status(404).json({ message: "Dispositivo no encontrado." });
      }
  
      // Agregar el nuevo historial al dispositivo
      foundDevice.histories.push(newHistory._id);
      await foundDevice.save();
  
      // Enviar el historial completo en la respuesta
      res.status(200).json({
        message: "Historial manual guardado correctamente.",
        history: newHistory,  // Aquí devolvemos el historial completo
      });
    } catch (error) {
      console.error("Error al guardar el historial manualmente:", error);
      res.status(500).json({ error: true, message: error.message || "Error al guardar el historial manualmente." });
    }
  };