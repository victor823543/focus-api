import express from "express";
import { ACTIVE_DB } from "../config.js";
import testController from "../controllers/testController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";

const router = express.Router();

if (ACTIVE_DB === "test") {
  router.post("/reset-db", asyncHandler(testController.reset));
  router.post("/seed-db", asyncHandler(testController.seed));
}

export default router;
