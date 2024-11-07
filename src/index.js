import app from './app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/Deshidratadordb")
  .then(() => console.log('Conectado a MongoDB'))
  .catch(error => console.error('Error de conexión a MongoDB:', error));


const server = app; 

const PORT = process.env.PORT || 3000;


server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
