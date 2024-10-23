import { Request, Response } from "express";
import { Color } from "../models/Colors.js";
import { SuccessCode } from "../utils/constants.js";
import { sendValidResponse } from "../utils/sendResponse.js";

type ListColorsResponse = {
  name: string;
  main: string;
  light: string;
  dark: string;
}[];

async function list(req: Request, res: Response) {
  const colors = await Color.find().lean();
  const response: ListColorsResponse = colors.map((color) => ({
    name: color.name,
    main: color.main,
    light: color.light,
    dark: color.dark,
  }));

  return sendValidResponse<ListColorsResponse>(res, SuccessCode.OK, response);
}

export default { list };
