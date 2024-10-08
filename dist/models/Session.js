import { model, Schema } from "mongoose";
const schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    title: {
        type: String,
        required: true,
        default: "Unnamed Session",
    },
    categories: {
        type: [Schema.Types.ObjectId],
        required: true,
        ref: "Category",
        default: [],
    },
    data: {
        type: [Schema.Types.ObjectId],
        required: true,
        ref: "Day",
        default: [],
    },
    activeDays: {
        type: [Number],
        required: true,
        default: [0, 1, 2, 3, 4],
    },
    start: {
        type: Date,
        required: true,
        default: Date.now,
    },
    end: {
        type: Date,
        required: false,
        default: null,
    },
});
schema.pre("save", function (next) {
    if (this.start) {
        // Set the date to midnight (00:00:00) to remove time information
        this.start.setHours(0, 0, 0, 0);
    }
    next();
});
export const Session = model("Session", schema);
