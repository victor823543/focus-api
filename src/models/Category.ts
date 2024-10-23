import { Schema, Types, model } from "mongoose";

export type ICategory = {
  _id: Types.ObjectId;
  user?: Types.ObjectId;
  session?: Types.ObjectId;
  name: string;
  importance: number;
  color: { name: string; main: string; light: string; dark: string };
  timestamp: number;
};

const schema = new Schema<ICategory>({
  user: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: "User",
  },
  session: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: "Session",
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
    type: { name: String, main: String, light: String, dark: String },
    required: true,
    default: { name: "Gray", hex: "#9ca3af" },
  },
  timestamp: {
    type: Number,
    required: false,
    default: () => Math.floor(new Date().getTime() / 1000),
  },
});

export const Category = model<ICategory>("Category", schema);
