var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Color } from "../models/Colors.js";
import { SuccessCode } from "../utils/constants.js";
import { sendValidResponse } from "../utils/sendResponse.js";
function list(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const colors = yield Color.find().lean();
        const response = colors.map((color) => ({
            name: color.name,
            hex: color.hex,
        }));
        return sendValidResponse(res, SuccessCode.OK, response);
    });
}
export default { list };
