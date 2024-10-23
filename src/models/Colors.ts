import { Schema, Types, model } from "mongoose";

export type IColor = {
  _id: Types.ObjectId;
  name: string;
  main: string;
  light: string;
  dark: string;
};

const schema = new Schema<IColor>({
  name: {
    type: String,
    required: true,
  },
  main: {
    type: String,
    required: true,
  },
  light: {
    type: String,
    required: true,
  },
  dark: {
    type: String,
    required: true,
  },
});

export const Color = model<IColor>("Color", schema);
