import  { Schema, model } from "mongoose";
import bcrypt from 'bcryptjs';
  
const userSchema = new Schema({

    username:{
        type: String,
        required: true,
    },
    id_dispositivos: [{
        type: String,
        required: true,
    }],
    email:{
        type: String,
        required: true,
        unique: true
    },
    id:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true,
    },
    key:{
        type: String,
        required: true,
    },
    roles: [{
        type: Schema.Types.ObjectId, 
        ref: 'Role', 
    }]
})

userSchema.statics.encryptPassword = async (password) => { 
    const salt = await bcrypt.genSalt(10)
     return await bcrypt.hash(password, salt)
    
    }
    
    userSchema.statics.comparePassword = async (password , receivedPassword) =>{
       return await bcrypt.compare(password , receivedPassword)
    
    }

export default model ('User', userSchema);