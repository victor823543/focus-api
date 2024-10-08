var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../config.js";
import { ErrorCode } from "../utils/constants.js";
function authorization(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const authorizationHeader = req.headers.authorization;
        const token = authorizationHeader && authorizationHeader.replace(/^Bearer\s/, "");
        if (token === undefined) {
            return res
                .status(ErrorCode.UNAUTHORIZED)
                .send({ message: "No token in authorization header." });
        }
        try {
            const user = jwt.verify(token, ACCESS_TOKEN_SECRET);
            res.locals.user = user;
            next();
        }
        catch (_a) {
            return res
                .status(ErrorCode.UNAUTHORIZED)
                .send({ message: "Token is not valid." });
        }
    });
}
export default authorization;
