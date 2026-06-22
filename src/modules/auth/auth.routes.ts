import { Router } from "express";
import { authController } from "./auth.controller.js";
import { requireAuth } from "@/shared/middleware/auth.middleware.js";
import { upload } from "@/shared/middleware/upload.middleware.js";

const router = Router();

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);
router.patch("/avatar", requireAuth, upload.single("avatar"), authController.updateAvatar);

export { router as AuthRouter };