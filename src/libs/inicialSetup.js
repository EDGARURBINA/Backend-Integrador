import Role from "../models/Role.js";

export const createRoles = async () => {
    try {
        const count = await Role.estimatedDocumentCount();
        console.log("Cantidad de roles existentes:", count);
        if (count > 0) {
            console.log("Roles ya existen. No se crearán roles adicionales.");
            return;
        }
        const values = await Promise.all([
            new Role({ name: "Admin" }).save(),
        ]);
        console.log("Roles creados:", values);
    } catch (error) {
        console.error("Error al crear los roles:", error);
    }
};