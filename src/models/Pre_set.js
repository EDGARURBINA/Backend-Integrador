import { Schema, model } from "mongoose";


const pre_setSchema = new Schema ({
    id:{
        type: String,
        required:true
    },
    name: {
        type: String,
        required:true
    },
    hour: {
        type: Number,
        required:true
    },

    minutes:{
        type: Number,
        required:true
    },

    temperature:{
        type: Number

    },
    humidity_min:{
        type: Number
    },
    weight_min:{
        type:Number
    }


});

export default model ("Pre_set",pre_setSchema)