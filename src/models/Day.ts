import { Schema, Types, model } from "mongoose";

export type CategoryScore = {
  category: Types.ObjectId;
  score: number;
  calculatedScore: number;
  importance: number;
};

// CategoryScore subdocument schema
const CategoryScoreSchema = new Schema<CategoryScore>({
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  score: { type: Number, required: true, default: 0 },
  calculatedScore: { type: Number, required: true, default: 0 },
  importance: { type: Number, required: true },
});

export type IDay = {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  session: Types.ObjectId;
  date: Date;
  categories: Array<Types.ObjectId>;
  score: Array<CategoryScore>;
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  timestamp: number;
};

const DaySchema = new Schema<IDay>({
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
  categories: {
    type: [Schema.Types.ObjectId],
    required: true,
    ref: "Category",
    default: [],
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

export const Day = model<IDay>("Day", DaySchema);
