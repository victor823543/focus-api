import { Request, Response } from "express";
import mongoose from "mongoose";
import { Category } from "../models/Category.js";
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

async function seed(req: Request, res: Response) {
  const { users, categories } = req.body;
  console.log(categories);
  try {
    // Clear relevant collections before seeding (optional)
    await User.deleteMany();
    await Category.deleteMany();

    // Insert seed data
    if (users && users.length > 0) {
      await User.insertMany(users);
    }
    if (categories && categories.length > 0) {
      await Category.insertMany(categories);
    }

    return sendValidResponse(res, SuccessCode.NO_CONTENT);
  } catch (error) {
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

export default { reset, seed };
