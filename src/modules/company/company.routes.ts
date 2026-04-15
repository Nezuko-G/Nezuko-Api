import { Router } from "express";
import multer from "multer";
import { companyController } from "./company.controller.js";
import { requireAuth } from "@/shared/middleware/auth.middleware.js";
import { checkRole } from "@/shared/middleware/checkRole.middleware.js";
import { validate } from "@/shared/middleware/validate.middleware.js";
import {
  updateAttendanceSettingsSchema,
  updateCompanyInfoSchema,
  updateCompanySettingsSchema,
} from "./company.validation.js";
import { UserRole } from "@prisma/client";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
});
const canMutateCompanySetup = checkRole([
  UserRole.TENANT_OWNER,
  UserRole.HR_ADMIN,
]);

router.use(requireAuth);

router.get("/info", companyController.getCompanyInfo);
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

router.get("/settings", companyController.getCompanySettings);
router.patch(
  "/settings",
  canMutateCompanySetup,
  validate(updateCompanySettingsSchema),
  companyController.updateCompanySettings,
);

router.get("/attendance-settings", companyController.getAttendanceSettings);
router.patch(
  "/attendance-settings",
  canMutateCompanySetup,
  validate(updateAttendanceSettingsSchema),
  companyController.updateAttendanceSettings,
);

export { router as CompanyRouter };
