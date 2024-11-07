import User from "../models/User.js";
import jwt from "jsonwebtoken";
import Role from "../models/Role.js";

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
    const adminFound = await User.findOne({ email: req.body.email }).populate("roles");
    let token = '';
    if (adminFound) {
        const matchPassword = await User.comparePassword(req.body.password, adminFound.password)
        if (!matchPassword) res.status(403).json({ error: true, message: "Contraseña incorrecta." })
        token = jwt.sign({ id: adminFound._id }, config.SECRET, {
            expiresIn: 86400
        });
        res.status(200).json({ error: false, token: token, path: '/AdminEntrepreneurs' })
    } else {
        res.json({ error: true, message: "Usuario no encontrado." })
    }
};

export const signUp = async (req, res) => {
    const { username, email, password, id_dispositivos, id, key, roles } = req.body;

    try {
        // Crear un nuevo objeto User
        const newUser = new User({
            username,
            email,
            password: await User.encryptPassword(password),
            id_dispositivos,
            id,
            key,
            roles: [] // Rol vacío por defecto
        });

        // Asignación de roles
        if (roles && roles.length > 0) {
            // Busca los roles especificados en la solicitud
            const foundRoles = await Role.find({ name: { $in: roles } });
            newUser.roles = foundRoles.map(role => role._id);
        } else {
            // Si no se especifican roles, asigna el rol predeterminado "User"
            const defaultRole = await Role.findOne({ name: "User" });
            if (defaultRole) {
                newUser.roles = [defaultRole._id];
            }
        }

        // Guarda el usuario en la base de datos
        const savedUser = await newUser.save();

        console.log("Nuevo usuario creado:", savedUser);
        res.status(200).json({ user: savedUser });
    } catch (error) {
        console.error("Error en signUp:", error);
        res.status(500).json({ message: "Error al crear el usuario" });
    }
};
