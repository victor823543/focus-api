var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../config.js";
import { User } from "../models/User.js";
import { ErrorCode, SuccessCode } from "../utils/constants.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";
function validateToken(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const authorizationHeader = req.headers.authorization;
        const token = authorizationHeader && authorizationHeader.replace(/^Bearer\s/, "");
        // Check if token is defined in authorization headers
        if (token === undefined) {
            throw new ErrorResponse(ErrorCode.UNAUTHORIZED, "No token in authorization header.");
        }
        try {
            // Verify JWT token
            const tokenPayload = jwt.verify(token, ACCESS_TOKEN_SECRET);
            // If all good, return token payload
            return sendValidResponse(res, SuccessCode.OK, tokenPayload);
        }
        catch (_a) {
            throw new ErrorResponse(ErrorCode.UNAUTHORIZED, "Token is not valid.");
        }
    });
}
function signNewToken(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        // Look for the user in the database by id
        const findUser = yield User.findOne({
            _id: user._id,
        });
        // If no result, return an error
        if (findUser === null) {
            throw new ErrorResponse(ErrorCode.NO_RESULT, "Couldn't find a user with that Id.");
        }
        const payload = {
            _id: findUser._id.toString(),
            email: findUser.email,
            username: findUser.username,
        };
        try {
            // Sign a JWT token with user information
            const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "12h" });
            // If all good, return JWT token
            return sendValidResponse(res, SuccessCode.OK, {
                token,
            });
        }
        catch (_a) {
            throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong when signing the token.");
        }
    });
}
function login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const email = req.body.email;
        const password = req.body.password;
        if (email === undefined) {
            throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
        }
        if (password === undefined) {
            throw new ErrorResponse(ErrorCode.PRECONDITION_REQUIRED, "Password is required.");
        }
        const findUser = yield User.findOne({ email });
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
            return sendValidResponse(res, SuccessCode.OK, {
                token,
            });
        }
        catch (err) {
            throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
        }
    });
}
function signup(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const email = req.body.email;
        const username = req.body.username;
        const password = req.body.password;
        if (email === undefined || username === undefined || password === undefined) {
            throw new ErrorResponse(ErrorCode.BAD_REQUEST, "All fields must be filled");
        }
        try {
            const password_hash = crypto
                .createHash("sha256")
                .update(password)
                .digest("hex");
            const result = yield User.create({ email, username, password_hash });
            const payload = {
                _id: result._id.toString(),
                email: result.email,
                username: result.username,
            };
            const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "12h" });
            return sendValidResponse(res, SuccessCode.OK, {
                token,
            });
        }
        catch (error) {
            throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
        }
    });
}
export default { validateToken, signNewToken, login, signup };
