import { Router } from "express";
import { superAdminAuthController } from "./super-admin.controller.js";
import { validate } from "@/shared/middleware/validate.middleware.js";
import { superAdminLoginSchema } from "./super-admin.validation.js";
import { requireSuperAdmin } from "@/shared/middleware/super-admin.middleware.js";

const router = Router();

router.post("/super-admin/login", superAdminAuthController.login);
router.post("/super-admin/logout", superAdminAuthController.logout);

export { router as SuperAdminAuthRouter };