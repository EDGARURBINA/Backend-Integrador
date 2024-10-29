import mongoose from "mongoose";

mongoose.connect("mongodb://localhost:27017",{
   
})
.then (db => console.log (" Esta conectado a la base de datos"))
.catch(error => console.log(error))