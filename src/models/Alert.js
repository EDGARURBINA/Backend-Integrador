import {Schema , model} from "mongoose";

const alertSchema = new Schema ({

    description:{
        type: String,   
        required:true
    },

    date:{
        type:Date,
        default: Date.now
    },
    priority:{
        type: String,
        required:true
    },
}
)

export default model ("Alert",alertSchema)