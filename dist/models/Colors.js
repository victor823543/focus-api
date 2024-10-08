import { Schema, model } from "mongoose";
const schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    hex: {
        type: String,
        required: true,
    },
});
export const Color = model("Color", schema);
