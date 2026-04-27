import { Router } from "express";
import { payrollController } from "./payroll.controller.js";
import { requireAuth } from "@/shared/middleware/auth.middleware.js";
import { checkRole } from "@/shared/middleware/checkRole.middleware.js";
import { validate } from "@/shared/middleware/validate.middleware.js";
import { UserRole } from "@prisma/client";
import {
  createPayrollRunSchema,
  createIncentiveSchema,
  listRunsQuerySchema,
  listIncentivesQuerySchema,
  summaryReportQuerySchema,
} from "./payroll.validation.js";

const router = Router();

router.use(requireAuth);

const isHROrOwner = checkRole([UserRole.TENANT_OWNER, UserRole.HR_ADMIN]);

router.get("/runs", isHROrOwner, validate(listRunsQuerySchema), payrollController.listRuns);
router.post("/runs", isHROrOwner, validate(createPayrollRunSchema), payrollController.createRun);
router.patch("/runs/approve/:id", isHROrOwner, payrollController.approveRun);
router.patch("/runs/mark-paid/:id", isHROrOwner, payrollController.markPaid);
router.get("/runs/entries/:id/:userId", requireAuth, payrollController.getPayslip);
router.get("/runs/:id", isHROrOwner, payrollController.getRunById);

router.get("/incentives", isHROrOwner, validate(listIncentivesQuerySchema), payrollController.listIncentives);
router.post("/incentives", isHROrOwner, validate(createIncentiveSchema), payrollController.createIncentive);
router.delete("/incentives/:id", isHROrOwner, payrollController.deleteIncentive);

router.get("/report/summary", isHROrOwner, validate(summaryReportQuerySchema), payrollController.getSummaryReport);

export { router as PayrollRouter };