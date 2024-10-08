import { ErrorResponse } from "../utils/sendResponse.js";
export const errorHandler = (error, req, res, next) => {
    console.log(error);
    if (error instanceof ErrorResponse) {
        return res.status(error.status).send({ message: error.message });
    }
    // Unhandled errors
    console.error(JSON.stringify(error, null, 2));
    return res.status(500).send({ message: "Something went wrong" });
};
