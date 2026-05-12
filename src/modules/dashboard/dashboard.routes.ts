import { Router } from "express";
import { dashboardController } from "./dashboard.controller.js";
import { requireAuth } from "@/shared/middleware/auth.middleware.js";
import { checkRole } from "@/shared/middleware/checkRole.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

const canAccessDashboard = checkRole([
  UserRole.TENANT_OWNER,
  UserRole.HR_ADMIN,
  UserRole.MANAGER,
]);

router.use(requireAuth, canAccessDashboard);

router.get(
    "/overview", 
    dashboardController.getOverview
);


router.get(
    "/metrics/summary", 
    dashboardController.getMetricsSummary
);

router.get(
    "/insights", 
    dashboardController.getInsights
);

router.get(
    "/chart", 
    dashboardController.getChart
);

router.get(
    "/export", 
    dashboardController.exportData
);

export { router as DashboardRouter };