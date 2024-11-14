import {Schema , model} from "mongoose";

const alertSchema = new Schema ({

    id:{
        type: String,
        required:true
    },

    desccription:{
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