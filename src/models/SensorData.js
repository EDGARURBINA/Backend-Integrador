import {Schema , model} from "mongoose";

const sensorDataSchema = new Schema ({
    value :{
        type: Number,

    },
    time :{
        type: String,
    }

})

export default model ("SensorData",sensorDataSchema)