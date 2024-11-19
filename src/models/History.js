import {Schema , model} from "mongoose";
import Alert from "../models/Alert.js"


const sensorDataSchema = new Schema({
    value: {
      type: Number,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
  });

const historySchema = new Schema({
    id: {
      type: String,
      required: true,
    },
    temperatures: [sensorDataSchema], 
    humidities: [sensorDataSchema],   
    weights: [sensorDataSchema],   
    fruit: {
      type: String,
      required: true,
    },
    automatic: {
      type: Boolean,
      default: false,
    },
    hours: {
      type: Number,
      default: 0,
    },
    minutes: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    alerts: [{
        type: Object,  
    }],
});

historySchema.methods.getAlerts = async function() {
    return await Alert.find({ _id: { $in: this.alerts } });
  };


export default model ("History",historySchema)

