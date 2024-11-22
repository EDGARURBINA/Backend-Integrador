import { Schema, model } from "mongoose";

const deviceSchema = new Schema({
    id: {
        type: String,
        required: true
    },
   
    automatization: {
        type: Boolean
    },
    temperature_actual:{
        type: Number

    },
    humidity_actual:{
        type: Number

    },
    process: {
        type: Boolean,
        default: false,
      },
    temperature: {
        type: Number, 
    },
    pre_set: {
        type: String, 
    },
    humidity: {
        type: Number,
    },
    weight: {
        type: Number,
    },
    airPurity: {
        type: Number, 
    },
    hours_actual: {
        type: Number, 
    },
    minute_actual: {
        type: Number, 
    },
    hours: {
        type: Number, 
    },
    minutes: {
        type: Number, 
    },
    histories: [
        {
          type: Schema.Types.ObjectId,
          ref: "History",
        },
      ],
    pause: {
        type: Boolean,
    }
});

export default model("Device", deviceSchema);
