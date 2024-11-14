import {Schema , model} from "mongoose";
import Alert from "../models/Alert.js"

const historySchema = new Schema ({

    id:{
        type: String,
    
    },
    temperatures: [{
        type: Number
    }],
    humidities:[{
        type: Number
    }],
    weights:[{
        type: Number
    }],
    fruit:{
        type: String
    },
    automatic:{
        type:Boolean
    },
    hours:{
        type:Number
    },
    minutes:{
        type:Number
    },
    date:{
        type:Date,
        default: Date.now
    },
    alerts: [{
        type: Schema.Types.ObjectId,
        ref: "Alert",  // Esto indica que 'alerts' es una referencia a documentos de 'Alert'
      }],


});


export default model ("History",historySchema)

