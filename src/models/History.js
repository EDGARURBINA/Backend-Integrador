import {Schema , model} from "mongoose";

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
        type: String,
        required: true,
    }],

});


export default model ("History",historySchema)

