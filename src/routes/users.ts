import express from "express";
import userController from "../controllers/userController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";
import authorization from "../middleware/authorization.js";

const router = express.Router();

router.post("/validate-token", asyncHandler(userController.validateToken));
router.post(
  "/sign-new-token",
  authorization,
  asyncHandler(userController.signNewToken),
);
router.post("/login", asyncHandler(userController.login));
router.post("/signup", asyncHandler(userController.signup));

export default router;
