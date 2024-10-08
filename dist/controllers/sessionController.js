var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Types } from "mongoose";
import { Day } from "../models/Day.js";
import { Session } from "../models/Session.js";
import { ErrorCode, SuccessCode } from "../utils/constants.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";
const changeIdFromCategories = (categories) => categories.map((category) => (Object.assign(Object.assign({}, category), { id: category._id.toString(), _id: undefined })));
function list(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        const result = yield Session.find({ user: user._id })
            .lean()
            .populate("categories");
        const sessions = result.map(({ _id, title, start, end, categories }) => {
            return {
                id: _id.toString(),
                title,
                start: new Date(start).toISOString(),
                end: end ? new Date(end).toISOString() : null,
                categories: changeIdFromCategories(categories),
            };
        });
        return sendValidResponse(res, SuccessCode.OK, sessions);
    });
}
function get(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        const id = req.params.id;
        if (!Types.ObjectId.isValid(id)) {
            throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Not a valid ID.");
        }
        const allDays = yield Day.find({
            user: user._id,
            session: id,
        }).lean();
        const result = yield Session.findOne({
            user: user._id,
            _id: id,
        })
            .populate("categories")
            .lean();
        if (result === null) {
            throw new ErrorResponse(ErrorCode.NO_RESULT, "There is no session with that id.");
        }
        // Replace _id with id for both categories and data
        const transformedCategories = result.categories.map((category) => (Object.assign(Object.assign({}, category), { id: category._id.toString(), _id: undefined })));
        const transformedData = allDays.map((data) => (Object.assign(Object.assign({}, data), { id: data._id.toString(), _id: undefined })));
        const sortedData = transformedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const transformedSession = Object.assign(Object.assign({}, result), { id: result._id.toString(), _id: undefined });
        console.log("Was sent");
        // Replace _id with id in the session itself
        const session = Object.assign(Object.assign({}, transformedSession), { categories: transformedCategories, data: sortedData });
        return sendValidResponse(res, SuccessCode.OK, session);
    });
}
function create(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        const result = yield Session.create({
            user: user._id,
        });
        const createdSession = yield Session.findOne({
            session: result._id,
        })
            .lean()
            .populate("categories");
        if (createdSession === null)
            throw new Error();
        const response = {
            id: createdSession._id.toString(),
            title: createdSession.title,
            start: new Date(createdSession.start).toISOString(),
            end: createdSession.end ? new Date(createdSession.end).toISOString() : null,
            categories: changeIdFromCategories(createdSession.categories),
        };
        return sendValidResponse(res, SuccessCode.OK, response);
    });
}
function remove(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        const id = req.params.id;
        const session = Session.find({ _id: id, user: user._id });
        if (session === null) {
            throw new ErrorResponse(ErrorCode.NO_RESULT, "Session not found.");
        }
        try {
            const result = yield Session.deleteOne({ _id: id });
            if (result.deletedCount === 0) {
                throw new Error();
            }
            return sendValidResponse(res, SuccessCode.NO_CONTENT);
        }
        catch (err) {
            throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong when removing the session.");
        }
    });
}
function update(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        const id = req.params.id;
        const params = req.body;
        if (!Types.ObjectId.isValid(id)) {
            throw new ErrorResponse(ErrorCode.BAD_REQUEST, "The session id is invalid.");
        }
        const findSession = yield Session.findOne({
            _id: id,
            user: user._id,
        });
        if (findSession === null) {
            throw new ErrorResponse(ErrorCode.NO_RESULT, "Session not found.");
        }
        try {
            yield Session.updateOne({ _id: id }, { $set: params });
            const result = yield Session.findById(id).lean().populate("categories");
            if (result === null)
                throw new Error();
            const session = {
                id: result._id.toString(),
                title: result.title,
                start: new Date(result.start).toISOString(),
                end: result.end ? new Date(result.end).toISOString() : null,
                categories: changeIdFromCategories(result.categories),
            };
            return sendValidResponse(res, SuccessCode.OK, session);
        }
        catch (error) {
            throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
        }
    });
}
export default { create, remove, list, get, update };
