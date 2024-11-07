import Pre_set from "../models/Pre_set.js"

export const createPreset = async (req, res) => {
    try {
        const preset = new Pre_set(req.body);
        const savedPreset = await preset.save();
        res.status(201).json(savedPreset);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


export const getAllPresets = async (req, res) => {
    try {
        const presets = await Pre_set.find();
        res.json(presets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getPresetById = async (req, res) => {
    try {
        const { id } = req.params;
        const preset = await Pre_set.findOne({ id: id });
        
        if (!preset) {
            return res.status(404).json({ message: "Preset no encontrado" });
        }

        res.json(preset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updatePreset = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedPreset = await Pre_set.findOneAndUpdate(
            { id: id },
            req.body,
            { new: true }
        );

        if (!updatedPreset) {
            return res.status(404).json({ message: "Preset no encontrado" });
        }

        res.json(updatedPreset);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deletePreset = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPreset = await Pre_set.findOneAndDelete({ id: id });
        
        if (!deletedPreset) {
            return res.status(404).json({ message: "Preset no encontrado" });
        }

        res.json({ message: "Preset eliminado exitosamente" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
