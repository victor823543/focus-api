import express from "express";
import dayController from "../controllers/dayController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";
import authorization from "../middleware/authorization.js";

const router = express.Router();

router.get("/:sessionId", authorization, asyncHandler(dayController.list));
router.get("/all/:sessionId", authorization, asyncHandler(dayController.all));
router.post("/create", authorization, asyncHandler(dayController.create));
router.delete("/:id", authorization, asyncHandler(dayController.remove));
router.put("/update/:id", authorization, asyncHandler(dayController.update));

export default router;
