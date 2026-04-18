import { Router } from "express";
import { companyController } from "./company.controller.js";
import { requireAuth } from "@/shared/middleware/auth.middleware.js";
import { checkRole } from "@/shared/middleware/checkRole.middleware.js";
import { validate } from "@/shared/middleware/validate.middleware.js";
import { upload } from "@/shared/middleware/upload.middleware.js";
import { UserRole } from "@prisma/client";
import {
  updateAttendanceSettingsSchema,
  updateCompanyInfoSchema,
  updateCompanySettingsSchema,
} from "./company.validation.js";

const router = Router();

const canMutateCompanySetup = checkRole([
  UserRole.TENANT_OWNER,
  UserRole.HR_ADMIN,
]);

router.use(requireAuth);

router.get(
  "/info", 
  companyController.getCompanyInfo
);

router.patch(
  "/info",
  canMutateCompanySetup,
  validate(updateCompanyInfoSchema),
  companyController.updateCompanyInfo,
);

router.post(
  "/logo",
  canMutateCompanySetup,
  upload.single("logo"),
  companyController.uploadCompanyLogo,
);

router.delete(
  "/logo",
  canMutateCompanySetup,
  companyController.deleteCompanyLogo,
);

router.get(
  "/settings", 
  companyController.getCompanySettings
);

router.patch(
  "/settings",
  canMutateCompanySetup,
  validate(updateCompanySettingsSchema),
  companyController.updateCompanySettings,
);

router.get(
  "/attendance-settings", 
  companyController.getAttendanceSettings
);

router.patch(
  "/attendance-settings",
  canMutateCompanySetup,
  validate(updateAttendanceSettingsSchema),
  companyController.updateAttendanceSettings,
);

export { router as CompanyRouter };