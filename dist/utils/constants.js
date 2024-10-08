export var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    ErrorCode[ErrorCode["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    ErrorCode[ErrorCode["FORBIDDEN"] = 403] = "FORBIDDEN";
    ErrorCode[ErrorCode["NO_RESULT"] = 404] = "NO_RESULT";
    ErrorCode[ErrorCode["CONFLICT"] = 409] = "CONFLICT";
    ErrorCode[ErrorCode["PRECONDITION_REQUIRED"] = 428] = "PRECONDITION_REQUIRED";
    ErrorCode[ErrorCode["SERVER_ERROR"] = 500] = "SERVER_ERROR";
})(ErrorCode || (ErrorCode = {}));
export var SuccessCode;
(function (SuccessCode) {
    SuccessCode[SuccessCode["OK"] = 200] = "OK";
    SuccessCode[SuccessCode["NO_CONTENT"] = 204] = "NO_CONTENT";
})(SuccessCode || (SuccessCode = {}));
