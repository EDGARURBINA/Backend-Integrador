import User from "../models/User.js";
import jwt from "jsonwebtoken";
import Role from "../models/Role.js";
import config from "../config.js"
import Device from "../models/Device.js";



export const validatePassword = async (req, res) => {
    const { password } = req.body;
    try {

        if (await User.findOne({ password: await User.comparePassword(password) })) {
            res.status(200).json({ message: "Contraseña correcta." });
        } else {
            res.status(401).json({ message: "Contraseña incorrecta." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Hubo un error.", error: error });
    }
};

export const updateAdmin = async (req, res) => {
    const { oldUsername, newUsername, newPassword } = req.body;

    try {
        await User.findOneAndUpdate(
            { username: oldUsername },
            {
                $set: {
                    username: newUsername,
                    password: await User.encryptPassword(newPassword)
                }
            }
        )
        res.status(200).json({ message: "Datos actualizados con exito." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Hubo un error.", error: error });
    }
};


export const signin = async (req, res) => {
    try {
        // Buscar al usuario por email
        const userFound = await User.findOne({ email: req.body.email }).populate("roles");

        if (!userFound) {
            return res.status(404).json({ error: true, message: "Usuario no encontrado." });
        }

        // Comparar la contraseña proporcionada
        const matchPassword = await User.comparePassword(req.body.password, userFound.password);
        if (!matchPassword) {
            return res.status(403).json({ error: true, message: "Contraseña incorrecta." });
        }

        // Generar el token JWT
        const token = jwt.sign({ id: userFound._id }, config.SECRET, {
            expiresIn: 86400, // 24 horas
        });

        // Buscar los dispositivos asociados al usuario
        const devices = await Device.find({ id: { $in: userFound.id_dispositivos } }).populate("histories");

        // Construir el objeto de dispositivos para la respuesta
        const deviceData = devices.map(device => ({
            id: device.id,
            automatization: device.automatization,
            temperature: device.temperature,
            humidity: device.humidity,
            temperature_actual: device.temperature_actual,
            humidity_actual: device.humidity_actual,
            pre_set: device.pre_set,
            weight: device.weight,
            airPurity: device.airPurity,
            hours_actual: device.hours_actual,
            minute_actual: device.minute_actual,
            hours: device.hours,
            minutes: device.minutes,
            pause: device.pause,
            histories: device.histories,  
        }));

        // Construir el objeto de usuario para la respuesta
        const userData = {
            username: userFound.username,
            email: userFound.email,
            id_dispositivos: userFound.id_dispositivos,
        };

        // Responder con el token, los datos del usuario y los dispositivos
        res.status(200).json({
            error: false,
            token: token,
            path: '/AdminEntrepreneurs',  // Redirige a la ruta deseada en tu frontend
            user: userData,
            devices: deviceData,  // Dispositivos con sus historiales
        });
    } catch (error) {
        console.error("Error en el proceso de inicio de sesión:", error);
        res.status(500).json({ error: true, message: "Error interno del servidor." });
    }
};
export const signUp = async (req, res) => {
    const { username, email, password, id_dispositivos, id, key, roles } = req.body;

    try {
        // Validar longitud mínima para password y key
        const MIN_PASSWORD_LENGTH = 8;
        const MIN_KEY_LENGTH = 6;

        // Validación de contraseña
        if (!password || password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({ 
                message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` 
            });
        }

        // Validación de key (palabra clave)
        if (!key || key.length < MIN_KEY_LENGTH) {
            return res.status(400).json({ 
                message: `La palabra clave debe tener al menos ${MIN_KEY_LENGTH} caracteres.` 
            });
        }

        const newUser = new User({
            username,
            email,
            password: await User.encryptPassword(password),
            id_dispositivos,
            id,
            key,
            roles: []
        });

        if (roles && roles.length > 0) {
            const foundRoles = await Role.find({ name: { $in: roles } });

            if (foundRoles.length !== roles.length) {
                return res.status(400).json({ message: "Uno o más roles no existen." });
            }

            newUser.roles = foundRoles.map(role => role._id);
        } else {
            const defaultRole = await Role.findOne({ name: "User" });
            if (defaultRole) {
                newUser.roles = [defaultRole._id];
            }
        }

        const savedUser = await newUser.save();

        // Generar el token
        const token = jwt.sign(
            { id: savedUser._id, username: savedUser.username }, 
            config.SECRET, 
            { expiresIn: 86400 } 
        );

        // Enviar solo el token como respuesta
        res.status(201).json({ token });

        console.log("Nuevo usuario creado:", savedUser);
    } catch (error) {
        console.error("Error en signUp:", error);
        res.status(500).json({ message: "Error al crear el usuario" });
    }
};




export const recoverPassword = async (req, res) => {
    const { email, questionId, answer, newPassword } = req.body;

    try {
        // Buscar al usuario por su correo y poblar las preguntas asociadas en 'key'
        const user = await User.findOne({ email }).populate('key.questionId');

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        // Buscar la pregunta y respuesta del usuario
        const questionAnswer = user.key.find(item => item.questionId._id.toString() === questionId);

        if (!questionAnswer) {
            return res.status(404).json({ message: "Pregunta no encontrada." });
        }

        // Comparar la respuesta
        if (questionAnswer.answer !== answer) {
            return res.status(401).json({ message: "Respuesta incorrecta." });
        }

        // Si la respuesta es correcta, actualizar la contraseña
        user.password = await User.encryptPassword(newPassword);
        await user.save();

        res.status(200).json({ message: "Contraseña actualizada exitosamente." });

    } catch (error) {
        console.error("Error en recoverPassword:", error);
        res.status(500).json({ message: "Error al recuperar la contraseña." });
    }
};



export const updateUserDevice = async (req, res) => {
    const { id } = req.params; // Obtén el ID del usuario desde los parámetros de la URL
    const { id_dispositivos } = req.body; // Obtén el nuevo dispositivo desde el body

    try {
        // Busca el usuario por su ID
        const userFound = await User.findOne({ id: id });

        if (!userFound) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Actualiza el ID del dispositivo
        userFound.id_dispositivos = id_dispositivos;

        // Guarda los cambios
        await userFound.save();

        res.status(200).json({
            message: "Dispositivo actualizado correctamente",
            user: userFound
        });
    } catch (error) {
        res.status(500).json({ message: "Hubo un error al actualizar el dispositivo", error: error.message });
    }
};