import  { Schema, model } from "mongoose";
import bcrypt from 'bcryptjs';

const userSchema = new Schema({

    username:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    id:{
        type: ObjectId,
        required: true
    },
    password:{
        type: String,
        required: true,
    },
    role:{
        type: String,
    },
    createdAt:{
        type:Date,
    },
    updatedA:{
        type:Date,
    }
})

userSchema.statics.encryptPassword = async (password) => { 
    const salt = await bcrypt.genSalt(10)
     return await bcrypt.hash(password, salt)
    
    }
    
    userSchema.statics.comparePassword = async (password , receivedPassword) =>{
       return await bcrypt.compare(password , receivedPassword)
    
    }

export default model ('User', userSchema);