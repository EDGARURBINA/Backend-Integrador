import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config.js";


export const verifyToken = async (req, res, next) => {
    try {
       const token = req.headers["token"];
 
       if (!token) return res.status(403).json({ message: "No token provided" })
 
       const decoded = jwt.verify(token, config.SECRET)
       req.userId = decoded.id;
 
       const user = await User.findById(req.userId, { password: 0 })
       if (!user) return res.status(404).json({ mesasage: "no existe el usuario" })
 
       next()
    } catch (error) {
       return res.status(401).json({ mesasage: "no autorizado" })
 
    }
 }
 
 export const isAdmin = async (req, res, next) => {
   try {
       const user = await User.findById(req.userId).populate("roles");
       if (!user) {
           return res.status(404).json({ message: "Usuario no encontrado" });
       }

       const hasAdminRole = user.roles.some(role => role.name === "Admin");
       if (hasAdminRole) {
           return next(); 
       }

       return res.status(403).json({ message: "requiere rol de administrador" });
   } catch (error) {
       console.error("Error en el middleware isAdmin:", error);
       return res.status(500).json({ message: "Error en la validación del rol" });
   }
};