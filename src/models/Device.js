import { Schema, model } from "mongoose";

const deviceSchema = new Schema ({
    id:{
        type: String,
        required:true
    },
    off_on:{
        type: Boolean,
        required: true
    },
    automatization:{
        type:Boolean

    } ,
    temperatures:{
        type: Number
    } ,
    pre_set:{
        type: String,
    },
    humidity_min:{
        type: Number

    },
    weight_min:{
        type: Number
    },
    hour_final:{
        type: Number
    },
    minute_final:{
        type: Number
    },
    hour_now:{
        type: Number
    },
    minute_now:{
        type: Number
    },
    
    histories: [
        {
            type: Object
        }
    ],

    pause:{
        type:Boolean,
 }
});


 export default model ("Device",deviceSchema)


 //crear un evento de notificaciones 