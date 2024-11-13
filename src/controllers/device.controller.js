import Device from "../models/Device.js"
import History from "../models/History.js"

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


export const updateDeviceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { off_on } = req.body;

        // Encuentra y actualiza el estado del dispositivo
        const updatedDevice = await Device.findByIdAndUpdate(
            id,
            { off_on },
            { new: true }
        );

        if (!updatedDevice) {
            return res.status(404).json({ message: "Dispositivo no encontrado" });
        }

        // Si el dispositivo se apaga (off_on = false), registra un historial
        if (off_on === false) {
            const newHistory = new History({
                id: updatedDevice.id,
                temperatures: updatedDevice.temperatures,
                humidities: updatedDevice.humidities,
                weights: updatedDevice.weights,
                fruit: updatedDevice.fruit,
                automatic: updatedDevice.automatic,
                hours: updatedDevice.hours,
                minutes: updatedDevice.minutes,
                date: new Date() 
            });

            await newHistory.save(); 
        }

        res.json(updatedDevice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};