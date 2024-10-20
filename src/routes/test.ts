import express from "express";
import testController from "../controllers/testController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";

const router = express.Router();

if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "devtest") {
  router.post("/reset-db", asyncHandler(testController.reset));
  router.post("/seed-db", asyncHandler(testController.seed));
}

export default router;
