import { Router } from "express";
import { projectController } from "./project.controller.js";
import { requireAuth } from "@/shared/middleware/auth.middleware.js";
import { checkRole } from "@/shared/middleware/checkRole.middleware.js";
import { validate } from "@/shared/middleware/validate.middleware.js";
import { UserRole } from "@prisma/client";
import {
  createProjectSchema,
  updateProjectSchema,
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  createSubTaskSchema,
} from "./project.validation.js";

const router = Router();

const isManagerOrHR = checkRole([
  UserRole.TENANT_OWNER,
  UserRole.HR_ADMIN,
  UserRole.MANAGER,
]);

const isHROrOwner = checkRole([
  UserRole.TENANT_OWNER,
  UserRole.HR_ADMIN,
]);

router.use(requireAuth);

router.get("/", isManagerOrHR, projectController.listProjects);
router.post("/", isManagerOrHR, validate(createProjectSchema), projectController.createProject);
router.get("/:id", isManagerOrHR, projectController.getProjectById);
router.patch("/:id", isManagerOrHR, validate(updateProjectSchema), projectController.updateProject);
router.get("/:id/progress", isManagerOrHR, projectController.getProjectProgress);
router.get("/:id/tasks", requireAuth, projectController.listTasksByProject);

router.get("/tasks/me", requireAuth, projectController.getMyTasks);
router.get("/tasks/report/overdue", isManagerOrHR, projectController.getOverdueReport);
router.post("/tasks", isManagerOrHR, validate(createTaskSchema), projectController.createTask);
router.patch("/tasks/status/:id", requireAuth, validate(updateTaskStatusSchema), projectController.updateTaskStatus);
router.post("/tasks/subtasks/:id", isManagerOrHR, validate(createSubTaskSchema), projectController.createSubTask);

router.get("/tasks/:id", requireAuth, projectController.getTaskById);
router.patch("/tasks/:id", isManagerOrHR, validate(updateTaskSchema), projectController.updateTask);

export { router as ProjectRouter };