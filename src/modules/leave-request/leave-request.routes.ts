import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth } from "@/shared/middleware/auth.middleware.js";
import { checkRole } from "@/shared/middleware/checkRole.middleware.js";
import { validate } from "@/shared/middleware/validate.middleware.js";
import { leaveRequestController } from "./leave-request.controller.js";
import {
  createLeaveRequestSchema,
  reviewLeaveRequestSchema,
} from "./leave-request.validation.js";

const router = Router();

const canCreateLeaveRequests = checkRole([UserRole.EMPLOYEE]);
const canReviewLeaveRequests = checkRole([UserRole.HR_ADMIN, UserRole.MANAGER]);
const canCancelLeaveRequests = checkRole([UserRole.EMPLOYEE]);

router.use(requireAuth);

router.get("/me", leaveRequestController.getMyLeaveRequests);

router.get(
  "/",
  canReviewLeaveRequests,
  leaveRequestController.getLeaveRequests,
);

router.post(
  "/",
  canCreateLeaveRequests,
  validate(createLeaveRequestSchema),
  leaveRequestController.createLeaveRequest,
);

router.patch(
  "/:id/review",
  canReviewLeaveRequests,
  validate(reviewLeaveRequestSchema),
  leaveRequestController.reviewLeaveRequest,
);

router.patch(
  "/:id/cancel",
  canCancelLeaveRequests,
  leaveRequestController.cancelLeaveRequest,
);

export { router as LeaveRequestRouter };
