import app from './App.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createRoles } from './libs/inicialSetup.js';
import addPredefinedQuestions from "./libs/addPredefinedQuestions.js"



dotenv.config();

console.log(process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Conectado a MongoDB');
    
    addPredefinedQuestions();

    await createRoles(); 
    
    
    const server = app;
    const PORT = process.env.PORT || 3000;
    
    server.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Error de conexión a MongoDB:', error);

  });
