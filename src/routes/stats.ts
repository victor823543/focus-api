import express from "express";
import statsController from "../controllers/statsController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";
import authorization from "../middleware/authorization.js";

const router = express.Router();

router.get(
  "/day/:sessionId/:date",
  authorization,
  asyncHandler(statsController.getDayStats),
);

export default router;
