import express from "express";
import morgan from "morgan";
import { createRoles } from "./libs/inicialSetup.js";  
import cors from 'cors';
import authRoutes from "./routes/auth.routes.js";  

const app = express();

app.use(cors({
    origin: '*',
    methods: 'GET,PUT,PATCH,POST,DELETE', 
    allowedHeaders: 'Content-Type, Authorization, token', 
}));

(async () => {
    try {
        await createRoles();
    } catch (error) {
        console.error("Error al crear los roles:", error);
    }
})();

app.use(express.json());
app.use(morgan("dev"));
app.use("/api/auth", authRoutes);

export default app;