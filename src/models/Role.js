import { Schema, model } from "mongoose";

const roleSchema = new Schema ({
   name: {
    type: String,
    enum: ['User', 'Admin'],
    required: true,
    unique: true
    },

});

export default model("Role", roleSchema);