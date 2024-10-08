import express from "express";
import sessionController from "../controllers/sessionController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";
import authorization from "../middleware/authorization.js";

const router = express.Router();

router.get("/", authorization, asyncHandler(sessionController.list));
router.get("/:id", authorization, asyncHandler(sessionController.get));
router.post("/create", authorization, asyncHandler(sessionController.create));
router.delete("/:id", authorization, asyncHandler(sessionController.remove));
router.put(
  "/update/:id",
  authorization,
  asyncHandler(sessionController.update),
);

export default router;
