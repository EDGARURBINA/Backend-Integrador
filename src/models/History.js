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
    ref: "Alert" 
  }],
  notification: {
    type: Map,
    of: Schema.Types.Mixed,  // Esto permite almacenar el objeto de la notificación
    default: {}
  }

});

historySchema.methods.getAlerts = async function() {
    return await Alert.find({ _id: { $in: this.alerts } });
  };


export default model ("History",historySchema)

