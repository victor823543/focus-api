import express from "express";
import categoryController from "../controllers/categoryController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";
import authorization from "../middleware/authorization.js";

const router = express.Router();

router.get("/", authorization, asyncHandler(categoryController.list));
router.get("/global", asyncHandler(categoryController.listGlobal));
router.post("/create", authorization, asyncHandler(categoryController.create));
router.delete("/:id", authorization, asyncHandler(categoryController.remove));
router.put(
  "/update/:id",
  authorization,
  asyncHandler(categoryController.update),
);

export default router;
