import { Schema, model } from "mongoose";
const schema = new Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password_hash: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Number,
        required: false,
        default: () => Math.floor(new Date().getTime() / 1000),
    },
});
export const User = model("User", schema);
