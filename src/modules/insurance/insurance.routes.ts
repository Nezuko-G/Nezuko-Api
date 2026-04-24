import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth } from "@/shared/middleware/auth.middleware.js";
import { checkRole } from "@/shared/middleware/checkRole.middleware.js";
import { validate } from "@/shared/middleware/validate.middleware.js";
import { insuranceController } from "./insurance.controller.js";
import {
  createInsuranceDependentSchema,
  createInsuranceEnrollmentSchema,
  createInsurancePlanSchema,
  updateInsurancePlanSchema,
} from "./insurance.validation.js";

const router = Router();

const canManageInsurance = checkRole([
  UserRole.TENANT_OWNER,
  UserRole.HR_ADMIN,
]);
const canAccessEmployeeInsurance = checkRole([UserRole.EMPLOYEE]);
const canPreviewInsurance = checkRole([
  UserRole.TENANT_OWNER,
  UserRole.HR_ADMIN,
  UserRole.EMPLOYEE,
]);

router.use(requireAuth);

router.get(
  "/insurance-plans",
  canManageInsurance,
  insuranceController.listInsurancePlans,
);
router.get(
  "/insurance-plans/coverage-report",
  canManageInsurance,
  insuranceController.getCoverageReport,
);
router.post(
  "/insurance-plans",
  canManageInsurance,
  validate(createInsurancePlanSchema),
  insuranceController.createInsurancePlan,
);
router.patch(
  "/insurance-plans/:id",
  canManageInsurance,
  validate(updateInsurancePlanSchema),
  insuranceController.updateInsurancePlan,
);
router.delete(
  "/insurance-plans/:id",
  canManageInsurance,
  insuranceController.deactivateInsurancePlan,
);
router.post(
  "/insurance-plans/:id/enroll",
  canManageInsurance,
  validate(createInsuranceEnrollmentSchema),
  insuranceController.enrollEmployee,
);

router.get(
  "/insurance-enrollments/me",
  canAccessEmployeeInsurance,
  insuranceController.getMyEnrollment,
);
router.get(
  "/insurance-enrollments/:id/cost-preview",
  canPreviewInsurance,
  insuranceController.previewCost,
);
router.post(
  "/insurance-enrollments/:id/dependents",
  canAccessEmployeeInsurance,
  validate(createInsuranceDependentSchema),
  insuranceController.addDependent,
);
router.delete(
  "/insurance-enrollments/:id/dependents/:depId",
  canAccessEmployeeInsurance,
  insuranceController.removeDependent,
);

export { router as InsuranceRouter };
