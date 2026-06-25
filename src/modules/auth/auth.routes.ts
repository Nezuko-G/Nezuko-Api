import { Router } from "express";
import { authController } from "./auth.controller.js";
import { requireAuth } from "@/shared/middleware/auth.middleware.js";
import { upload } from "@/shared/middleware/upload.middleware.js";
import { validate } from "@/shared/middleware/validate.middleware.js";
import { loginSchema } from "./auth.validation.js";


const router = Router();

router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);
router.patch("/avatar", requireAuth, upload.single("avatar"), authController.updateAvatar);

export { router as AuthRouter };