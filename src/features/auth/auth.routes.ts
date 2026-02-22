import { Router } from "express";
import { authController } from "./auth.controller";
import limiter from "@/shared/middleware/rateLimiter.middleware";
import { LoginSchema, SignUpSchema } from "./auth.validation";
import { validate } from "@/shared/middleware/validate.middleware";

const router = Router();

router.post(
    "/signup",
    limiter,
    validate(SignUpSchema),
    authController.signUp,
);

router.post(
    "/login",
    limiter,
    validate(LoginSchema),
    authController.login,
);

export default router;
