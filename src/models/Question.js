import { Schema, model } from "mongoose";

const questionSchema = new Schema({
    question: {
        type: String,
        required: true,
    },
  
    category: {
        type: String,
        default: "general",
    },
});

export default model ("Question",questionSchema)