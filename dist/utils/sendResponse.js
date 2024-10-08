import { SuccessCode } from "./constants.js";
export class ErrorResponse {
    constructor(status, message) {
        this.status = status;
        this.message = message;
    }
}
export const sendValidResponse = (res, status = SuccessCode.NO_CONTENT, data) => {
    res.status(status);
    if (data !== undefined && status !== SuccessCode.NO_CONTENT) {
        res.setHeader("Content-Type", "application/json");
        res.json(data);
    }
    res.end();
};
