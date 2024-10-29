import express from "express";
import morgan from "morgan";
import { createRoles } from "./libs/inicialSetup";
import cors from 'cors';
import  authRoutes from "./routes/auth.routes"



const app = express()
app.use(cors({
    origin: '*',
    methods: 'GET,PUT,PATCH,POST,DELETE', 
    allowedHeaders: 'Content-Type, Authorization, token', 
  }));

  createRoles();
  app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes)

export default app;
