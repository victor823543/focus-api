import { Request, Response } from "express";
import { Types } from "mongoose";
import { CategoryScore, Day, IDay } from "../models/Day.js";
import { ISession, Session } from "../models/Session.js";
import { TokenPayload } from "../models/User.js";
import { Politus } from "../types.js";
import { ErrorCode, SuccessCode } from "../utils/constants.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";
import { changeIdFromCategories } from "./sessionController.js";

export type DayType = Politus<IDay>;

type CreateDayParams = {
  session: string;
  date: string;
  categories: CreateCateforyScoreParams[];
};

type CreateCateforyScoreParams = {
  category: string;
  score: number;
};

type UpdateDayParams = CreateCateforyScoreParams[];

// Helper to get the first day of a month based on the current date and monthOffset
const getStartOfMonth = (monthOffset: number = 0) => {
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + monthOffset,
    1,
  );
  return startOfMonth;
};

// Helper to get the last day of a month based on the current date and monthOffset
const getEndOfMonth = (monthOffset: number = 0) => {
  const now = new Date();
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + monthOffset + 1,
    0,
  );
  return endOfMonth;
};

// Helper tp calculate scores
type UpdateScoresReturn = {
  score: CategoryScore[];
  totalScore: number;
  percentageScore: number;
};

function updateScores(
  oldCategories: CategoryScore[],
  newCategories: UpdateDayParams,
  maxScore: number,
): UpdateScoresReturn {
  let totalScore = 0;
  let returnCategories: CategoryScore[] = [];
  // Loop through the scores array and calculate each calculatedScore and totalScore
  for (const scoreEntry of oldCategories) {
    // Use cached importance to calculate calculatedScore
    const score: number =
      newCategories.find(
        (instance) => instance.category === scoreEntry.category.toString(),
      )?.score || scoreEntry.score;

    const calculatedScore: number = score * scoreEntry.importance;

    const categoryScoreToPush: CategoryScore = {
      category: scoreEntry.category,
      importance: scoreEntry.importance,
      score,
      calculatedScore,
    };
    returnCategories.push(categoryScoreToPush);

    // Sum totalScore
    totalScore += calculatedScore;
  }

  const percentageScore = (totalScore / maxScore) * 100;

  return {
    score: returnCategories,
    totalScore,
    percentageScore,
  };
}

async function list(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const sessionId: string = req.params.sessionId;

  // Get monthOffset from query params, default is 0 (current month)
  const monthOffset = parseInt(req.query.monthOffset as string) || 0;

  // Calculate the start and end dates for the desired month
  const startOfMonth = getStartOfMonth(monthOffset);
  const endOfMonth = getEndOfMonth(monthOffset);

  // Find days that belong to the user, session, and are within the specified month
  const result: Array<IDay> = await Day.find({
    user: user._id,
    session: sessionId,
    date: { $gte: startOfMonth, $lte: endOfMonth },
  })
    .populate("categories")
    .lean();

  // Convert the result to an object where the key is the date and the value is the day item
  const days = result.reduce<Record<string, DayType>>((acc, day) => {
    acc[day.date.toString()] = {
      ...day,
      id: day._id.toString(),
      categories: changeIdFromCategories(day.categories),
    };
    return acc;
  }, {});

  // Send the response with the days object
  return sendValidResponse<Record<string, DayType>>(res, SuccessCode.OK, days);
}

async function all(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const sessionId: string = req.params.sessionId;

  const result: Array<IDay> = await Day.find({
    user: user._id,
    session: sessionId,
  })
    .populate("categories")
    .lean();

  // Convert the result to an object where the key is the date and the value is the day item
  const days = result.reduce<Record<string, DayType>>((acc, day) => {
    acc[day.date.toISOString()] = {
      ...day,
      id: day._id.toString(),
      categories: changeIdFromCategories(day.categories),
    };
    return acc;
  }, {});

  // Send the response with the days object
  return sendValidResponse<Record<string, DayType>>(res, SuccessCode.OK, days);
}

async function create(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const params: CreateDayParams = req.body;

  const findSession: ISession | null = await Session.findOne({
    _id: params.session,
    user: user._id,
  })
    .populate("categories")
    .lean();

  if (findSession === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Session not found.");
  }

  const categoryScore: CategoryScore[] = findSession.categories.map(
    (category: any) => {
      const score = params.categories.find(
        (paramCategory) => paramCategory.category === category.name.toString(),
      )?.score;
      const categoryScoreObject = {
        category: category._id.toString(),
        importance: category.importance,
        score: score || 0,
        calculatedScore: (score || 0) * category.importance,
      };
      return categoryScoreObject;
    },
  );

  const maxScore = categoryScore.reduce(
    (value, category) => (value += 10 * category.importance),
    0,
  );

  const totalScore = categoryScore.reduce(
    (value, category) => value + category.calculatedScore,
    0,
  );

  await Day.create({
    user: user._id,
    session: findSession._id,
    date: params.date,
    categories: findSession.categories.map((category) => category._id),
    score: categoryScore,
    maxScore,
    totalScore,
    percentageScore: (totalScore / maxScore) * 100,
  });

  return sendValidResponse(res, SuccessCode.NO_CONTENT);
}

async function update(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: string = req.params.id;
  const params: UpdateDayParams = req.body;

  if (!Types.ObjectId.isValid(id)) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "The day id is invalid.");
  }

  const findDay: IDay | null = await Day.findOne({
    _id: id,
    user: user._id,
  });

  if (findDay === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Day not found.");
  }

  const valuesToUpdate: UpdateScoresReturn = updateScores(
    findDay.score,
    params,
    findDay.maxScore,
  );

  try {
    const updated = await Day.updateOne(
      { _id: id },
      {
        $set: {
          score: valuesToUpdate.score,
          totalScore: valuesToUpdate.totalScore,
          percentageScore: valuesToUpdate.percentageScore,
        },
      },
    );
    console.log("Updated:", updated);
    return sendValidResponse(res, SuccessCode.NO_CONTENT);
  } catch (error) {
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

async function remove(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: string = req.params.id;

  const session = Day.find({ _id: id, user: user._id });

  if (session === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Day not found.");
  }

  try {
    const result = await Day.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      throw new Error();
    }

    return sendValidResponse(res, SuccessCode.NO_CONTENT);
  } catch (err: unknown) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when deleting the day.",
    );
  }
}

export default { create, remove, update, list, all };
