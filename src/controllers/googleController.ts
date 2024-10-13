import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../config.js";
import { User, UserProvider } from "../models/User.js";
import { ErrorCode, SuccessCode } from "../utils/constants.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function googleLogin(req: Request, res: Response) {
  const { token } = req.body;

  try {
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new ErrorResponse(ErrorCode.UNAUTHORIZED, "Invalid Google token");
    }

    const { sub: googleId, email, name: username } = payload;

    // Check if the user already exists in the database
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.create({
        googleId,
        email,
        username,
        provider: UserProvider.GOOGLE,
      });
    }

    // Create a JWT token
    const appToken = jwt.sign(
      { _id: user._id, email: user.email, username: user.username },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "12h" },
    );

    // Send back the JWT token
    sendValidResponse(res, SuccessCode.OK, { token: appToken });
  } catch (error) {
    console.error(error);
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Internal Server Error");
  }
}

export default { googleLogin };
