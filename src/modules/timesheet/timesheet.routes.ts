import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth } from "@/shared/middleware/auth.middleware.js";
import { checkRole } from "@/shared/middleware/checkRole.middleware.js";
import { validate } from "@/shared/middleware/validate.middleware.js";
import { timesheetController } from "./timesheet.controller.js";
import {
  createTimesheetsSchema,
  updateTimesheetSchema,
  updateTimesheetStatusSchema,
} from "./timesheet.validation.js";

const router = Router();

const isHR = checkRole([UserRole.TENANT_OWNER, UserRole.HR_ADMIN]);

const isHROrManager = checkRole([
  UserRole.TENANT_OWNER,
  UserRole.HR_ADMIN,
  UserRole.MANAGER,
]);

const isEmployee = checkRole([UserRole.EMPLOYEE]);

router.use(requireAuth);

router.post(
  "/",
  isHR,
  validate(createTimesheetsSchema),
  timesheetController.createTimesheets,
);

router.get(
    "/", 
    isHROrManager, 
    timesheetController.listTimesheets
);

router.get(
    "/me", 
    isEmployee, 
    timesheetController.getMyTimesheets
);

router.patch(
  "/:id",
  isHR,
  validate(updateTimesheetSchema),
  timesheetController.updateTimesheet,
);

router.patch(
  "/:id/status",
  isHROrManager,
  validate(updateTimesheetStatusSchema),
  timesheetController.updateTimesheetStatus,
);

router.get(
    "/report/overtime", 
    isHR, 
    timesheetController.getOvertimeReport
);

export { router as TimesheetRouter };