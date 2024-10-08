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
import { Category } from "../models/Category.js";
import { ErrorCode, SuccessCode } from "../utils/constants.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";
function list(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        const result = yield Category.find({
            user: user._id,
        }).lean();
        const categories = result.map((category) => (Object.assign(Object.assign({}, category), { id: category._id.toString() })));
        return sendValidResponse(res, SuccessCode.OK, categories);
    });
}
function create(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        const params = req.body;
        const result = yield Category.create({
            user: user._id,
            name: params.name,
            importance: params.importance,
            color: params.color,
        });
        const response = {
            id: result._id.toString(),
        };
        return sendValidResponse(res, SuccessCode.OK, response);
    });
}
function remove(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        const id = req.params.id;
        const session = Category.find({ _id: id, user: user._id });
        if (session === null) {
            throw new ErrorResponse(ErrorCode.NO_RESULT, "Category not found.");
        }
        try {
            const result = yield Category.deleteOne({ _id: id });
            if (result.deletedCount === 0) {
                throw new Error();
            }
            return sendValidResponse(res, SuccessCode.NO_CONTENT);
        }
        catch (err) {
            throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong when removing the category.");
        }
    });
}
function update(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        const id = req.params.id;
        const params = req.body;
        if (!Types.ObjectId.isValid(id)) {
            throw new ErrorResponse(ErrorCode.BAD_REQUEST, "The category id is invalid.");
        }
        const findCategory = yield Category.findOne({
            _id: id,
            user: user._id,
        });
        if (findCategory === null) {
            throw new ErrorResponse(ErrorCode.NO_RESULT, "Category not found.");
        }
        try {
            yield Category.updateOne({ _id: id }, { $set: params });
            return sendValidResponse(res, SuccessCode.NO_CONTENT);
        }
        catch (error) {
            throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
        }
    });
}
export default { create, remove, list, update };
