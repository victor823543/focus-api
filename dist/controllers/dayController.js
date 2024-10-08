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
// Helper to get the first day of a month based on the current date and monthOffset
const getStartOfMonth = (monthOffset = 0) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    return startOfMonth;
};
// Helper to get the last day of a month based on the current date and monthOffset
const getEndOfMonth = (monthOffset = 0) => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0);
    return endOfMonth;
};
function updateScores(oldCategories, newCategories, maxScore) {
    var _a;
    let totalScore = 0;
    let returnCategories = [];
    // Loop through the scores array and calculate each calculatedScore and totalScore
    for (const scoreEntry of oldCategories) {
        // Use cached importance to calculate calculatedScore
        const score = ((_a = newCategories.find((instance) => instance.category === scoreEntry.category.toString())) === null || _a === void 0 ? void 0 : _a.score) || scoreEntry.score;
        const calculatedScore = score * scoreEntry.importance;
        const categoryScoreToPush = {
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
function list(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        const sessionId = req.params.sessionId;
        // Get monthOffset from query params, default is 0 (current month)
        const monthOffset = parseInt(req.query.monthOffset) || 0;
        // Calculate the start and end dates for the desired month
        const startOfMonth = getStartOfMonth(monthOffset);
        const endOfMonth = getEndOfMonth(monthOffset);
        // Find days that belong to the user, session, and are within the specified month
        const result = yield Day.find({
            user: user._id,
            session: sessionId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
        }).lean();
        // Convert the result to an object where the key is the date and the value is the day item
        const days = result.reduce((acc, day) => {
            acc[day.date.toString()] = Object.assign(Object.assign({}, day), { id: day._id.toString() });
            return acc;
        }, {});
        // Send the response with the days object
        return sendValidResponse(res, SuccessCode.OK, days);
    });
}
function all(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        const sessionId = req.params.sessionId;
        const result = yield Day.find({
            user: user._id,
            session: sessionId,
        }).lean();
        // Convert the result to an object where the key is the date and the value is the day item
        const days = result.reduce((acc, day) => {
            acc[day.date.toISOString()] = Object.assign(Object.assign({}, day), { id: day._id.toString() });
            return acc;
        }, {});
        // Send the response with the days object
        return sendValidResponse(res, SuccessCode.OK, days);
    });
}
function create(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        const params = req.body;
        const findSession = yield Session.findOne({
            _id: params.session,
            user: user._id,
        })
            .lean()
            .populate("categories");
        if (findSession === null) {
            throw new ErrorResponse(ErrorCode.NO_RESULT, "Session not found.");
        }
        console.log("Params:", params);
        console.log("SessionCategories:", findSession.categories);
        const categoryScore = findSession.categories.map((category) => {
            var _a;
            const score = (_a = params.categories.find((paramCategory) => paramCategory.category === category._id.toString())) === null || _a === void 0 ? void 0 : _a.score;
            const categoryScoreObject = {
                category: category._id.toString(),
                importance: category.importance,
                score: score || 0,
                calculatedScore: (score || 0) * category.importance,
            };
            return categoryScoreObject;
        });
        const maxScore = categoryScore.reduce((value, category) => (value += 10 * category.importance), 0);
        const totalScore = categoryScore.reduce((value, category) => value + category.calculatedScore, 0);
        console.log("CategoryScore:", categoryScore);
        yield Day.create({
            user: user._id,
            session: findSession._id,
            date: params.date,
            score: categoryScore,
            maxScore,
            totalScore,
            percentageScore: (totalScore / maxScore) * 100,
        });
        return sendValidResponse(res, SuccessCode.NO_CONTENT);
    });
}
function update(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        const id = req.params.id;
        const params = req.body;
        if (!Types.ObjectId.isValid(id)) {
            throw new ErrorResponse(ErrorCode.BAD_REQUEST, "The day id is invalid.");
        }
        const findDay = yield Day.findOne({
            _id: id,
            user: user._id,
        });
        if (findDay === null) {
            throw new ErrorResponse(ErrorCode.NO_RESULT, "Day not found.");
        }
        const valuesToUpdate = updateScores(findDay.score, params, findDay.maxScore);
        console.log(valuesToUpdate);
        try {
            const updated = yield Day.updateOne({ _id: id }, {
                $set: {
                    score: valuesToUpdate.score,
                    totalScore: valuesToUpdate.totalScore,
                    percentageScore: valuesToUpdate.percentageScore,
                },
            });
            console.log("Updated:", updated);
            return sendValidResponse(res, SuccessCode.NO_CONTENT);
        }
        catch (error) {
            throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
        }
    });
}
function remove(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        const id = req.params.id;
        const session = Day.find({ _id: id, user: user._id });
        if (session === null) {
            throw new ErrorResponse(ErrorCode.NO_RESULT, "Day not found.");
        }
        try {
            const result = yield Day.deleteOne({ _id: id });
            if (result.deletedCount === 0) {
                throw new Error();
            }
            return sendValidResponse(res, SuccessCode.NO_CONTENT);
        }
        catch (err) {
            throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong when deleting the day.");
        }
    });
}
export default { create, remove, update, list, all };
