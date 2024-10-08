import { Schema, Types, model } from "mongoose";

export type IColor = {
  _id: Types.ObjectId;
  name: string;
  hex: string;
};

const schema = new Schema<IColor>({
  name: {
    type: String,
    required: true,
  },
  hex: {
    type: String,
    required: true,
  },
});

export const Color = model<IColor>("Color", schema);
