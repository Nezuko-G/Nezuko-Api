import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth } from "@/shared/middleware/auth.middleware.js";
import { checkRole } from "@/shared/middleware/checkRole.middleware.js";
import { reportsController } from "./reports.controller.js";

const router = Router();

const isHrOrManager = checkRole([
  UserRole.TENANT_OWNER,
  UserRole.HR_ADMIN,
  UserRole.MANAGER,
]);

const isHrOnly = checkRole([UserRole.TENANT_OWNER, UserRole.HR_ADMIN]);

router.use(requireAuth);

router.get("/types", isHrOrManager, reportsController.listTypes);
router.get("/history", isHrOnly, reportsController.getHistory);
router.get("/:type/preview", isHrOrManager, reportsController.previewReport);
router.get("/:type/export/pdf", isHrOrManager, reportsController.exportPdf);
router.get("/:type/export", isHrOrManager, reportsController.exportCsv);
router.get("/:type", isHrOrManager, reportsController.getReport);

export { router as ReportsRouter };
