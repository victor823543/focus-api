import { Schema, Types, model } from "mongoose";

export type IUser = {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password_hash: string | null;
  timestamp: number;
};

export type TokenPayload = {
  _id: string;
  email: string;
  username: string;
};

const schema = new Schema<IUser>({
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

export const User = model<IUser>("User", schema);
