import { Request, Response } from "express";
import { Types } from "mongoose";
import { Category, ICategory } from "../models/Category.js";
import { Day, IDay } from "../models/Day.js";
import { ISession, Session } from "../models/Session.js";
import { TokenPayload } from "../models/User";
import { Politus } from "../types.js";
import { ErrorCode, SuccessCode } from "../utils/constants.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";
import { CreateCategoryParams } from "./categoryController.js";

type SessionType = Politus<ISession>;
type CategoryType = Politus<ICategory>;
type DayType = Politus<IDay>;

type CreateSessionResponse = {
  id: string;
  title: string;
  start: string;
  end: string | null;
  categories: Array<CategoryType>;
  maxScore: number;
};

type ListSessionsResponse = CreateSessionResponse[];

type UpdateSessionResponse = CreateSessionResponse;

type SessionUpdateParams = Partial<{
  title: string;
  categories: Array<string>;
  start: string;
  end: string | null;
  activeDays: Array<number>;
  maxScore: number;
}>;

type SessionConfigureParams = {
  title: string;
  categories: Array<CreateCategoryParams>;
  start: string;
  end?: string | null;
  activeDays?: Array<number>;
};

const changeIdFromCategories = (categories: any[]) =>
  categories.map((category) => ({
    ...category,
    id: category._id.toString(),
    _id: undefined,
  }));

async function list(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;

  const result: Array<ISession> = await Session.find({ user: user._id })
    .lean()
    .populate("categories");

  const sessions: ListSessionsResponse = result.map(
    ({ _id, title, start, end, categories, maxScore }) => {
      return {
        id: _id.toString(),
        title,
        start: new Date(start).toISOString(),
        end: end ? new Date(end).toISOString() : null,
        categories: changeIdFromCategories(categories),
        maxScore,
      };
    },
  );

  return sendValidResponse<ListSessionsResponse>(res, SuccessCode.OK, sessions);
}

async function get(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: string = req.params.id;

  if (!Types.ObjectId.isValid(id)) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Not a valid ID.");
  }

  const allDays: Array<IDay> = await Day.find({
    user: user._id,
    session: id,
  }).lean();

  const result: ISession | null = await Session.findOne({
    user: user._id,
    _id: id,
  })
    .populate("categories")
    .lean();

  if (result === null) {
    throw new ErrorResponse(
      ErrorCode.NO_RESULT,
      "There is no session with that id.",
    );
  }

  // Replace _id with id for both categories and data
  const transformedCategories = result.categories.map((category: any) => ({
    ...category,
    id: category._id.toString(),
    _id: undefined, // Remove _id
  }));

  const transformedData: IDay[] = allDays.map((data: any) => ({
    ...data,
    id: data._id.toString(),
    _id: undefined, // Remove _id
  }));

  const sortedData: any[] = transformedData.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const transformedSession = {
    ...result,
    id: result._id.toString(),
    _id: undefined,
  };

  console.log("Was sent");

  // Replace _id with id in the session itself
  const session: SessionType = {
    ...transformedSession,
    categories: transformedCategories, // Use transformed categories
    data: sortedData, // Use transformed data
  };

  return sendValidResponse<SessionType>(res, SuccessCode.OK, session);
}

async function create(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;

  const result: ISession = await Session.create({
    user: user._id,
  });

  const createdSession: ISession | null = await Session.findOne({
    session: result._id,
  })
    .lean()
    .populate("categories");
  if (createdSession === null) throw new Error();

  const response: CreateSessionResponse = {
    id: createdSession._id.toString(),
    title: createdSession.title,
    start: new Date(createdSession.start).toISOString(),
    end: createdSession.end ? new Date(createdSession.end).toISOString() : null,
    categories: changeIdFromCategories(createdSession.categories),
    maxScore: createdSession.maxScore,
  };

  return sendValidResponse<CreateSessionResponse>(
    res,
    SuccessCode.OK,
    response,
  );
}

async function configure(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const params: SessionConfigureParams = req.body;

  const createCategory = async (
    category: CreateCategoryParams,
  ): Promise<string> => {
    const createdCategory: ICategory = await Category.create({
      user: user._id,
      ...category,
    });
    return createdCategory._id.toString();
  };

  const categoryIds: string[] = await Promise.all(
    params.categories.map(async (category) => {
      const categoryId = await createCategory(category);
      return categoryId;
    }),
  );

  const maxScore = params.categories.reduce(
    (value, category) => (value += 10 * Number(category.importance)),
    0,
  );

  const result: ISession = await Session.create({
    user: user._id,
    ...params,
    maxScore: maxScore,
    categories: categoryIds,
  });

  const createdSession: ISession | null = await Session.findOne({
    _id: result._id,
  }).lean();

  if (createdSession === null) throw new Error("Session creation failed.");

  const response: CreateSessionResponse = {
    id: createdSession._id.toString(),
    title: createdSession.title,
    start: new Date(createdSession.start).toISOString(),
    end: createdSession.end ? new Date(createdSession.end).toISOString() : null,
    categories: changeIdFromCategories(createdSession.categories),
    maxScore: maxScore,
  };

  return sendValidResponse<CreateSessionResponse>(
    res,
    SuccessCode.OK,
    response,
  );
}

async function remove(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: string = req.params.id;

  const session = Session.find({ _id: id, user: user._id });

  if (session === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Session not found.");
  }

  try {
    const result = await Session.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      throw new Error();
    }

    return sendValidResponse(res, SuccessCode.NO_CONTENT);
  } catch (err: unknown) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when removing the session.",
    );
  }
}

async function update(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: string = req.params.id;
  const params: SessionUpdateParams = req.body;

  if (!Types.ObjectId.isValid(id)) {
    throw new ErrorResponse(
      ErrorCode.BAD_REQUEST,
      "The session id is invalid.",
    );
  }

  const findSession: ISession | null = await Session.findOne({
    _id: id,
    user: user._id,
  });

  if (findSession === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Session not found.");
  }

  try {
    let maxScore: number = 0;

    // If categories are included in params, calculate maxScore
    if (params.categories && params.categories.length > 0) {
      // Fetch the categories from the database
      const categories = await Category.find({
        _id: { $in: params.categories },
      });

      // Calculate maxScore based on the importance of the fetched categories
      maxScore = categories.reduce(
        (value, category) => (value += 10 * Number(category.importance)),
        0,
      );

      // Include the calculated maxScore in params for the update
      params.maxScore = maxScore;
    }

    await Session.updateOne({ _id: id }, { $set: params });

    const result = await Session.findById(id).lean().populate("categories");
    if (result === null) throw new Error();

    const session: UpdateSessionResponse = {
      id: result._id.toString(),
      title: result.title,
      start: new Date(result.start).toISOString(),
      end: result.end ? new Date(result.end).toISOString() : null,
      categories: changeIdFromCategories(result.categories),
      maxScore: maxScore,
    };

    return sendValidResponse<UpdateSessionResponse>(
      res,
      SuccessCode.OK,
      session,
    );
  } catch (error) {
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

export default { create, remove, list, get, update, configure };
