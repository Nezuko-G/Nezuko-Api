import { Router } from "express";
import { employeeController } from "./employee.controller.js";
import { requireAuth } from "@/shared/middleware/auth.middleware.js";
import { checkRole } from "@/shared/middleware/checkRole.middleware.js";
import { validate } from "@/shared/middleware/validate.middleware.js";
import { UserRole } from "@prisma/client";
import { upload } from "@/shared/middleware/upload.middleware.js";
import { createEmployeeSchema, updateEmployeeSchema, uploadDocumentSchema } from "./employee.validation.js";

const router = Router();

const canMutateEmployees = checkRole([
  UserRole.TENANT_OWNER,
  UserRole.HR_ADMIN,
]);

router.use(requireAuth);

router.post("/", canMutateEmployees, validate(createEmployeeSchema), employeeController.createEmployee);
router.get("/", canMutateEmployees, employeeController.getEmployees);
router.get("/:id", canMutateEmployees, employeeController.getEmployeeById);
router.patch("/:id", canMutateEmployees, validate(updateEmployeeSchema), employeeController.updateEmployee);
router.delete("/:id", canMutateEmployees, employeeController.deleteEmployee);

router.get("/documents/:id", canMutateEmployees, employeeController.getEmployeeDocuments);
router.post("/documents/:id", canMutateEmployees, upload.single("file"), validate(uploadDocumentSchema), employeeController.uploadEmployeeDocument);
router.delete("/documents/:id/:docId", canMutateEmployees, employeeController.deleteEmployeeDocument);

export { router as EmployeeRouter };