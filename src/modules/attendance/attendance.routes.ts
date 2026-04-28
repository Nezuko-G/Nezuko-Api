import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth } from "@/shared/middleware/auth.middleware.js";
import { checkRole } from "@/shared/middleware/checkRole.middleware.js";
import { validate } from "@/shared/middleware/validate.middleware.js";
import { attendanceController } from "./attendance.controller.js";
import { markAttendanceSchema } from "./attendance.validation.js";

const router = Router();

const isHROrManager = checkRole([
  UserRole.TENANT_OWNER,
  UserRole.HR_ADMIN,
  UserRole.MANAGER,
]);

const isEmployee = checkRole([UserRole.EMPLOYEE]);

router.use(requireAuth);

router.post(
  "/location/mark",
  isEmployee,
  validate(markAttendanceSchema),
  attendanceController.markAttendance,
);

router.get(
    "/timesheets", 
    isHROrManager, 
    attendanceController.listTimesheets
);

router.get(
    "/timesheets/me", 
    isEmployee, 
    attendanceController.listMyTimesheets
);

export { router as AttendanceRouter };
