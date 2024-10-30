import express from "express";
import dashboardController from "../controllers/dashboardController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";
import authorization from "../middleware/authorization.js";

const router = express.Router();

router.get(
  "/:sessionId",
  authorization,
  asyncHandler(dashboardController.getDashboardData),
);

export default router;
