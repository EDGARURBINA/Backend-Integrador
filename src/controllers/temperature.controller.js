import Temperature from "../models/Temperature.js"


export const createTemperature = async (req, res) => {
    try {
        const { temperature, humidity, date, id_dispositivos } = req.body;

        const newTemperature = new Temperature({
            temperature,
            humidity,
            date: date || new Date(), 
            id_dispositivos
        });

        const savedTemperature = await newTemperature.save();
        res.status(201).json({ message: "Registro de temperatura creado", data: savedTemperature });
    } catch (error) {
        console.error("Error al crear el registro de temperatura:", error);
        res.status(500).json({ message: "Error al crear el registro de temperatura" });
    }
};


export const getTemperatures = async (req, res) => {
    try {
        const temperatures = await Temperature.find();  // Obtiene todos los registros de temperatura
        res.status(200).json({ message: "Registros de temperatura obtenidos", data: temperatures });
    } catch (error) {
        console.error("Error al obtener los registros de temperatura:", error);
        res.status(500).json({ message: "Error al obtener los registros de temperatura" });
    }
};

// Eliminar un registro de temperatura por ID
export const deleteTemperature = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTemperature = await Temperature.findByIdAndDelete(id);

        if (!deletedTemperature) {
            return res.status(404).json({ message: "Registro de temperatura no encontrado" });
        }

        res.status(200).json({ message: "Registro de temperatura eliminado", data: deletedTemperature });
    } catch (error) {
        console.error("Error al eliminar el registro de temperatura:", error);
        res.status(500).json({ message: "Error al eliminar el registro de temperatura" });
    }
};