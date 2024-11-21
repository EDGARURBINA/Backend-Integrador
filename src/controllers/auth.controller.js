import User from "../models/User.js";
import jwt from "jsonwebtoken";
import Role from "../models/Role.js";
import config from "../config.js"
import Question from "../models/Question.js";




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


export const singin = async (req, res) => {
    try {
        const adminFound = await User.findOne({ email: req.body.email }).populate("roles");

        if (!adminFound) {
            return res.status(404).json({ error: true, message: "Usuario no encontrado." });
        }

        const matchPassword = await User.comparePassword(req.body.password, adminFound.password);

        if (!matchPassword) {
            return res.status(403).json({ error: true, message: "Contraseña incorrecta." });
        }

        // Generar el token JWT
        const token = jwt.sign({ id: adminFound._id }, config.SECRET, {
            expiresIn: 86400 // 24 horas
        });

        // Enviar la respuesta con los datos del usuario
        res.status(200).json({
            error: false,
            token: token,
            path: '/AdminEntrepreneurs',
            user: {
                id: adminFound._id,
                email: adminFound.email,
                username: adminFound.name, 
                roles: adminFound.roles.map(role => role.name), 
            }
        });
    } catch (error) {
        console.error("Error en el proceso de inicio de sesión:", error);
        res.status(500).json({ error: true, message: "Error interno del servidor." });
    }
};


export const signUp = async (req, res) => {
    const { username, email, password, id_dispositivos, id, key, roles } = req.body;

    try {
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