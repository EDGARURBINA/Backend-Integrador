import app from './app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createRoles } from './libs/inicialSetup.js';

dotenv.config();

console.log(process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Conectado a MongoDB');
    
    await createRoles(); 
    
    const server = app;
    const PORT = process.env.PORT || 3000;
    
    server.listen(PORT, () => {
      console.log(`Servidor corriendo puerto ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Error de conexión a MongoDB:', error);

  });
