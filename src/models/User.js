import  { Schema, model } from "mongoose";
import bcrypt from 'bcryptjs';
  
const userSchema = new Schema({

    username:{
        type: String,
        required: true,
    },
    id_dispositivos: [{
        type: String,
        
    }],
    email:{
        type: String,
        required: true,
        unique: true
    },
    id:{
        type: String,
        
    },
    password:{
        type: String,
        required: true,
    },
    
    key: [
        {
            questionId: {
                type: Schema.Types.ObjectId,
                ref: 'Question', 
            
            },
            answer: {
                type: String,
            
            }
        }
    ],

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