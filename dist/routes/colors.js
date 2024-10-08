import express from "express";
import colorController from "../controllers/colorController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";
const router = express.Router();
router.get("/", asyncHandler(colorController.list));
export default router;
