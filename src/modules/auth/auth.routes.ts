import { Router } from "express";
import { authController } from "./auth.controller.js";
import { requireAuth } from "@/shared/middleware/auth.middleware.js";

const router = Router();

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);



export { router as AuthRouter };