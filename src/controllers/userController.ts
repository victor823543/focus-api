import crypto from "crypto";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../config.js";
import { TokenPayload, User } from "../models/User.js";
import { Indef } from "../types.js";
import { ErrorCode, SuccessCode } from "../utils/constants.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";

type SignNewTokenResponse = {
  token: string;
};

type LoginResponse = {
  token: string;
};

async function validateToken(req: Request, res: Response) {
  const authorizationHeader = req.headers.authorization;
  const token =
    authorizationHeader && authorizationHeader.replace(/^Bearer\s/, "");

  // Check if token is defined in authorization headers

  if (token === undefined) {
    throw new ErrorResponse(
      ErrorCode.UNAUTHORIZED,
      "No token in authorization header.",
    );
  }

  try {
    // Verify JWT token
    const tokenPayload = jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    // If all good, return token payload
    return sendValidResponse<TokenPayload>(res, SuccessCode.OK, tokenPayload);
  } catch {
    throw new ErrorResponse(ErrorCode.UNAUTHORIZED, "Token is not valid.");
  }
}

async function signNewToken(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;

  // Look for the user in the database by id
  const findUser = await User.findOne({
    _id: user._id,
  });

  // If no result, return an error
  if (findUser === null) {
    throw new ErrorResponse(
      ErrorCode.NO_RESULT,
      "Couldn't find a user with that Id.",
    );
  }

  const payload: TokenPayload = {
    _id: findUser._id.toString(),
    email: findUser.email,
    username: findUser.username,
  };

  try {
    // Sign a JWT token with user information
    const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "12h" });
    // If all good, return JWT token
    return sendValidResponse<SignNewTokenResponse>(res, SuccessCode.OK, {
      token,
    });
  } catch {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when signing the token.",
    );
  }
}

async function login(req: Request, res: Response) {
  const email: Indef<string> = req.body.email;
  const password: Indef<string> = req.body.password;

  if (email === undefined) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  if (password === undefined) {
    throw new ErrorResponse(
      ErrorCode.PRECONDITION_REQUIRED,
      "Password is required.",
    );
  }

  const findUser = await User.findOne({ email });

  if (findUser === null) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  const password_hash = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");

  if (findUser.password_hash !== password_hash) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Wrong email or password.");
  }

  try {
    const payload = {
      _id: findUser._id.toString(),
      email: findUser.email,
      username: findUser.username,
    };

    const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "12h" });

    return sendValidResponse<LoginResponse>(res, SuccessCode.OK, {
      token,
    });
  } catch (err: unknown) {
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

async function signup(req: Request, res: Response) {
  const email: Indef<string> = req.body.email;
  const username: Indef<string> = req.body.username;
  const password: Indef<string> = req.body.password;

  if (email === undefined || username === undefined || password === undefined) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "All fields must be filled");
  }

  try {
    const password_hash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const result = await User.create({ email, username, password_hash });

    const payload = {
      _id: result._id.toString(),
      email: result.email,
      username: result.username,
    };

    const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "12h" });

    return sendValidResponse<LoginResponse>(res, SuccessCode.OK, {
      token,
    });
  } catch (error) {
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

export default { validateToken, signNewToken, login, signup };
