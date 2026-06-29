import { Router } from "express";
import { dashboardController } from "./dashboard.controller.js";
import { requireAuth } from "@/shared/middleware/auth.middleware.js";
import { checkRole } from "@/shared/middleware/checkRole.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

const DASHBOARD_ROLES: UserRole[] = [
    UserRole.TENANT_OWNER,
    UserRole.HR_ADMIN,
    UserRole.MANAGER,
];

router.use(requireAuth, checkRole(DASHBOARD_ROLES));

router.get("/overview", dashboardController.getOverview);

export { router as DashboardRouter };