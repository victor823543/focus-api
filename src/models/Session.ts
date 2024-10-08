import { model, Schema, Types } from "mongoose";

export type ISession = {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  categories: Array<Types.ObjectId>;
  data: Array<Types.ObjectId>;
  activeDays: Array<number>;
  start: Date;
  end: Date | null;
  timestamp: number;
};

const schema = new Schema<ISession>({
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

schema.pre<ISession>("save", function (next) {
  if (this.start) {
    // Set the date to midnight (00:00:00) to remove time information
    this.start.setHours(0, 0, 0, 0);
  }
  next();
});

export const Session = model<ISession>("Session", schema);
