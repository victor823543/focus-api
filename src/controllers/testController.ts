import { Request, Response } from "express";
import mongoose from "mongoose";
import { Category } from "../models/Category.js";
import { Day } from "../models/Day.js";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";
import { ErrorCode, SuccessCode } from "../utils/constants.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";

const staticCollections = ["colors"];

async function reset(req: Request, res: Response) {
  const collections = Object.keys(mongoose.connection.collections);

  // Drop all non-static collections
  for (let collectionName of collections) {
    if (staticCollections.includes(collectionName)) {
      continue;
    }
    const collection = mongoose.connection.collections[collectionName];
    try {
      await collection.deleteMany(); // Clear all documents in the collection
    } catch (err) {
      throw new ErrorResponse(
        ErrorCode.SERVER_ERROR,
        "Something went wrong when removing the session.",
      );
    }
  }
  return sendValidResponse(res, SuccessCode.NO_CONTENT);
}

type SeedBody = {
  user: any;
  globalCategories: any[];
  userCategories: any[];
  session: any;
  days: any[];
};

async function seed(req: Request, res: Response) {
  const { user, globalCategories, userCategories, session, days }: SeedBody =
    req.body;
  try {
    if (user) {
      const createdUser = await User.create(user);

      if (userCategories && userCategories.length > 0) {
        const newUserCategories = userCategories.map((category) => ({
          ...category,
          user: createdUser._id,
        }));
        const createdCategories = await Category.insertMany(newUserCategories);
        const categoryIds = createdCategories.map(
          (category: any) => category._id,
        );

        if (session) {
          session.user = createdUser._id;
          session.categories = categoryIds;
          const createdSession = await Session.create(session);

          if (days) {
            const newDays = days.map((day: any) => ({
              ...day,
              user: createdUser._id,
              session: createdSession._id,
            }));
            await Day.insertMany(newDays);
          }
        }
      }
    }

    if (globalCategories && globalCategories.length > 0) {
      await Category.insertMany(globalCategories);
    }

    return sendValidResponse(res, SuccessCode.NO_CONTENT);
  } catch (error) {
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

export default { reset, seed };
