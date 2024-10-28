import { Request, Response } from "express";
import { Types } from "mongoose";
import { Category, ICategory } from "../models/Category.js";
import { CategoryScore, Day, IDay } from "../models/Day.js";
import { TokenPayload } from "../models/User.js";
import { Politus } from "../types.js";
import {
  calculateCategoryStats,
  CategoryPeriodDateStats,
  CategoryStats,
} from "../utils/calculateStats.js";
import { ErrorCode, SuccessCode } from "../utils/constants.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";

export type CategoryType = Politus<ICategory>;

export type CreateCategoryParams = {
  session: string;
  name: string;
  importance: string;
  color: { name: string; main: string; light: string; dark: string };
};

type CreateCategoryResponse = {
  id: string;
};

type GetCategoryResponse = {
  stats: CategoryStats;
  category: CategoryType;
  dateStats: CategoryPeriodDateStats;
};

type CategoryUpdateParams = Partial<{
  color: { name: string; main: string; light: string; dark: string };
  description: string;
}>;

export type CategoryDateStats = Record<
  string,
  { score: number; calculatedScore: number }
>;

async function get(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: string = req.params.id;
  try {
    const result: ICategory | null = await Category.findOne({
      user: user._id,
      _id: id,
    }).lean();

    if (result === null) {
      throw new ErrorResponse(ErrorCode.NO_RESULT, "Category not found.");
    }

    // Prepare the stats object
    let dateStats: CategoryDateStats = {};

    let periodDateStats: CategoryPeriodDateStats = {
      allTime: {},
      thisWeek: {},
      thisMonth: {},
    };

    let stats: CategoryStats = {
      allTime: {
        totalScore: 0,
        totalCalculatedScore: 0,
        averageScore: 0,
        averageCalculatedScore: 0,
      },
      thisWeek: {
        totalScore: 0,
        totalCalculatedScore: 0,
        averageScore: 0,
        averageCalculatedScore: 0,
      },
      thisMonth: {
        totalScore: 0,
        totalCalculatedScore: 0,
        averageScore: 0,
        averageCalculatedScore: 0,
      },
    };
    try {
      // Fetch days where the category is included
      const days: Array<IDay> = await Day.find({
        user: user._id,
        categories: id,
      }).lean();

      if (days && days.length > 0) {
        // Calculate the score for each day for the given category
        dateStats = days.reduce<CategoryDateStats>((acc, day) => {
          const scoreObj: CategoryScore | undefined = day.score.find(
            (obj) => obj.category.toString() === id,
          );

          // Add the score for this date (or default to 0 if no score exists)
          acc[day.date.toString()] = {
            score: scoreObj?.score || 0,
            calculatedScore: scoreObj?.calculatedScore || 0,
          };
          return acc;
        }, {});

        // Calculate total and average stats for the category
        const { stats: statsResult, dateStats: dateStatsResult } =
          calculateCategoryStats(dateStats);
        stats = statsResult;
        periodDateStats = dateStatsResult;
      }
    } catch (err: unknown) {
      // Log error but continue returning an empty stats object
      console.error("Error fetching days for category:", err);
    }

    const category: CategoryType = {
      ...result,
      id: result._id.toString(),
    };

    const response: GetCategoryResponse = {
      stats,
      dateStats: periodDateStats,
      category,
    };

    return sendValidResponse<GetCategoryResponse>(
      res,
      SuccessCode.OK,
      response,
    );
  } catch (error) {
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

async function list(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const sessionId: string = req.params.sessionId;

  const result: Array<ICategory> = await Category.find({
    user: user._id,
    session: sessionId,
  }).lean();

  const categories: Array<CategoryType> = result.map((category) => ({
    ...category,
    id: category._id.toString(),
  }));

  return sendValidResponse<Array<CategoryType>>(
    res,
    SuccessCode.OK,
    categories,
  );
}

async function all(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;

  const result: Array<ICategory> = await Category.find({
    user: user._id,
  }).lean();

  const categories: Array<CategoryType> = result.map((category) => ({
    ...category,
    id: category._id.toString(),
  }));

  return sendValidResponse<Array<CategoryType>>(
    res,
    SuccessCode.OK,
    categories,
  );
}

async function listGlobal(req: Request, res: Response) {
  const result: Array<ICategory> = await Category.find({
    user: undefined,
  }).lean();

  const categories: Array<CategoryType> = result.map((category) => ({
    ...category,
    id: category._id.toString(),
  }));

  return sendValidResponse<Array<CategoryType>>(
    res,
    SuccessCode.OK,
    categories,
  );
}

async function create(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const params: CreateCategoryParams = req.body;

  const result: ICategory = await Category.create({
    user: user._id,
    session: params.session,
    name: params.name,
    importance: params.importance,
    color: params.color,
  });

  const response: CreateCategoryResponse = {
    id: result._id.toString(),
  };

  return sendValidResponse<CreateCategoryResponse>(
    res,
    SuccessCode.OK,
    response,
  );
}

async function remove(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: string = req.params.id;

  const session = Category.find({ _id: id, user: user._id });

  if (session === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Category not found.");
  }

  try {
    const result = await Category.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      throw new Error();
    }

    return sendValidResponse(res, SuccessCode.NO_CONTENT);
  } catch (err: unknown) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when removing the category.",
    );
  }
}

async function update(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: string = req.params.id;
  const params: CategoryUpdateParams = req.body;

  if (!Types.ObjectId.isValid(id)) {
    throw new ErrorResponse(
      ErrorCode.BAD_REQUEST,
      "The category id is invalid.",
    );
  }

  const updatedValues: Partial<ICategory> = {};

  if (params.color) updatedValues.color = params.color;
  if (params.description) updatedValues.description = params.description;

  if (Object.keys(updatedValues).length === 0) {
    throw new ErrorResponse(
      ErrorCode.BAD_REQUEST,
      "No valid update values provided.",
    );
  }

  const findCategory: ICategory | null = await Category.findOne({
    _id: id,
    user: user._id,
  });

  if (findCategory === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Category not found.");
  }

  try {
    await Category.updateOne({ _id: id }, { $set: updatedValues });

    return sendValidResponse(res, SuccessCode.NO_CONTENT);
  } catch (error) {
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

export default { create, remove, list, update, listGlobal, all, get };
