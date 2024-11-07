import { Schema, model } from "mongoose";

const temperatureSchema = new Schema({

    temperature:{
        type: Number

    },
      humidity:{
      type: Number
      },

    date:{
        type:Date
    }, 
    id_dispositivos:{
        type: String
    }


});

export default model ("temperature",temperatureSchema)
