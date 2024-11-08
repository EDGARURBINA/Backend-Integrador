import {Schema , model} from "mongoose";

const historySchema = new Schema ({

    id:{
        type: String,
        required:true
    },
    temperatures:{
        type: Number
    },
    humidities:{
        type: Number
    },
    weights:{
        type: Number
    },
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
    }

});


export default model ("History",historySchema)

