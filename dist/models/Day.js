import { Schema, model } from "mongoose";
// CategoryScore subdocument schema
const CategoryScoreSchema = new Schema({
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    score: { type: Number, required: true, default: 0 },
    calculatedScore: { type: Number, required: true, default: 0 },
    importance: { type: Number, required: true },
});
const DaySchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    session: {
        type: Schema.Types.ObjectId,
        ref: "Session",
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    score: {
        type: [CategoryScoreSchema],
        required: true,
        default: [],
    },
    totalScore: {
        type: Number,
        required: true,
        default: 0,
    },
    maxScore: {
        type: Number,
        required: true,
        default: 0,
    },
    percentageScore: {
        type: Number,
        required: true,
        default: 0,
    },
    timestamp: {
        type: Number,
        required: false,
        default: () => Math.floor(new Date().getTime() / 1000),
    },
});
export const Day = model("Day", DaySchema);
