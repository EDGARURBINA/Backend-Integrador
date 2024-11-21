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
        // Extraer los datos del cuerpo de la solicitud
        const { device, data, timestamp } = req.body;

        // Validar si los datos esenciales están presentes
        if (!device || !data || !timestamp) {
            return res.status(400).json({ error: true, message: "Faltan datos en la solicitud." });
        }

        // Mapear los datos de temperatura, humedad y peso
        const temperatures = (Array.isArray(data?.temperatures) ? data.temperatures : [data?.temperatures]).map((temp) => ({
            value: temp,
            time: timestamp || new Date().toISOString(),
        }));

        const humidities = (Array.isArray(data?.humidities) ? data.humidities : [data?.humidities]).map((humidity) => ({
            value: humidity,
            time: timestamp || new Date().toISOString(),
        }));

        const weights = (Array.isArray(data?.weights) ? data.weights : [data?.weights]).map((weight) => ({
            value: weight,
            time: timestamp || new Date().toISOString(),
        }));

        // Crear una nueva instancia del historial
        const newHistory = new History({
            id: device,
            temperatures,
            humidities,
            weights,
            fruit: data?.fruit || "",
            automatic: Boolean(data?.automatic),
            hours: Number(data?.hours) || 0,
            minutes: Number(data?.minutes) || 0,
            alerts: [], // Aquí puedes agregar alertas si es necesario
            date: new Date(timestamp),
        });

        // Guardar el historial en la base de datos
        await newHistory.save();

        // Buscar el dispositivo por su ID
        const deviceRecord = await Device.findOne({ id: device });

        if (deviceRecord) {
            // Asociar el historial al dispositivo
            deviceRecord.histories.push(newHistory._id);
            await deviceRecord.save();
        } else {
            return res.status(404).json({ error: true, message: "Dispositivo no encontrado." });
        }

        // Buscar al usuario que tenga este dispositivo
        const user = await User.findOne({ id_dispositivos: device });

        if (user) {
            // Agregar el historial al usuario
            user.histories.push(newHistory._id);
            await user.save();
        }

        return res.status(201).json({
            error: false,
            message: "Historial guardado exitosamente",
            history: newHistory,
        });
    } catch (error) {
        console.error("Error al guardar el historial manualmente:", error);
        return res.status(500).json({ error: true, message: "Error interno del servidor." });
    }
};