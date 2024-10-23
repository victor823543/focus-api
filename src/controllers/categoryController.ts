import { Request, Response } from "express";
import { Types } from "mongoose";
import { Category, ICategory } from "../models/Category.js";
import { TokenPayload } from "../models/User.js";
import { Politus } from "../types.js";
import { ErrorCode, SuccessCode } from "../utils/constants.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";

type CategoryType = Politus<ICategory>;

export type CreateCategoryParams = {
  session: string;
  name: string;
  importance: string;
  color: { name: string; hex: string };
};

type CreateCategoryResponse = {
  id: string;
};

type CategoryUpdateParams = Partial<CreateCategoryParams>;

async function get(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: string = req.params.id;

  const result: ICategory | null = await Category.findOne({
    user: user._id,
    _id: id,
  }).lean();

  if (result === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Category not found.");
  }

  const category: CategoryType = {
    ...result,
    id: result._id.toString(),
  };

  return sendValidResponse<CategoryType>(res, SuccessCode.OK, category);
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

  const findCategory: ICategory | null = await Category.findOne({
    _id: id,
    user: user._id,
  });

  if (findCategory === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Category not found.");
  }

  try {
    await Category.updateOne({ _id: id }, { $set: params });

    return sendValidResponse(res, SuccessCode.NO_CONTENT);
  } catch (error) {
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

export default { create, remove, list, update, listGlobal, all, get };
