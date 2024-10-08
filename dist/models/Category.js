import { Schema, model } from "mongoose";
const schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    name: {
        type: String,
        required: true,
    },
    importance: {
        type: Number,
        required: true,
        default: () => 1,
    },
    color: {
        type: { name: String, hex: String },
        required: true,
        default: { name: "Gray", hex: "#9ca3af" },
    },
    timestamp: {
        type: Number,
        required: false,
        default: () => Math.floor(new Date().getTime() / 1000),
    },
});
export const Category = model("Category", schema);
