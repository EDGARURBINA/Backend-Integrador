
import app from './app.js';   
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/Deshidratadordb")
  .then(() => console.log('Connectado a MongoDB'))
  .catch(error => console.error('MongoDB connection error:', error));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});