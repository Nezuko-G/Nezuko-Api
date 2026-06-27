import { projectRepository } from "./project.repository.js";
import { NotFoundError, BadRequestError, ConflictError } from "@/shared/errors/errors.js";
import { ProjectStatus } from "@prisma/client";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectsFilter,
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
  ListTasksFilter,
  MyTasksFilter,
} from "@/shared/interfaces/project.interface.js";
import prisma from "@/shared/config/prisma.js";
import { notificationService } from "../notification/index.js";

export const projectService = {

  // Projects
  async listProjects(tenantId: string, filter: ListProjectsFilter, t: any) {
    const { data, total, page, limit, totalPages } =
      await projectRepository.listProjects(tenantId, filter);

    return {
      projects: data,
      meta: { total, page, limit, totalPages },
    };
  },

  async getProjectById(tenantId: string, id: string, t: any) {
    const project = await projectRepository.findProjectById(tenantId, id);
    if (!project) throw new NotFoundError(t("project.not_found"));
    return project;
  },

  async createProject(tenantId: string, input: CreateProjectInput, t: any) {
    const existing = await prisma.project.findFirst({
      where: { tenantId, name: input.name.trim() },
      select: { id: true },
    });
    if (existing) throw new ConflictError(t("project.name_already_exists"));

    if (input.ownerId) {
      const owner = await prisma.user.findFirst({
        where: { id: input.ownerId, tenantId },
        select: { id: true },
      });
      if (!owner) throw new BadRequestError(t("project.invalid_owner"));
    }

    return projectRepository.createProject(tenantId, input);
  },

  async updateProject(
    tenantId: string,
    id: string,
    input: UpdateProjectInput,
    t: any
  ) {
    const project = await projectRepository.findProjectById(tenantId, id);
    if (!project) throw new NotFoundError(t("project.not_found"));

    if (input.ownerId) {
      const owner = await prisma.user.findFirst({
        where: { id: input.ownerId, tenantId },
        select: { id: true },
      });
      if (!owner) throw new BadRequestError(t("project.invalid_owner"));
    }

    // If status is CANCELLED, use the dedicated cancel method
    // which also blocks all non-DONE/non-BLOCKED tasks in a transaction
    if (input.status === ProjectStatus.CANCELLED) {
      return projectRepository.cancelProject(tenantId, id);
    }

    return projectRepository.updateProject(tenantId, id, input);
  },

  async getProjectProgress(tenantId: string, id: string, t: any) {
    const project = await projectRepository.findProjectById(tenantId, id);
    if (!project) throw new NotFoundError(t("project.not_found"));
    return projectRepository.getProjectProgress(tenantId, id);
  },

  // Tasks

  /**
   * List tasks under a project with filters, search, and pagination.
   * Supports: status, priority, assigneeId, search, page, limit
   */
  async listTasksByProject(
    tenantId: string,
    projectId: string,
    filter: ListTasksFilter,
    t: any
  ) {
    const project = await projectRepository.findProjectById(tenantId, projectId);
    if (!project) throw new NotFoundError(t("project.not_found"));

    const { data, total, page, limit, totalPages } =
      await projectRepository.listTasksByProject(tenantId, projectId, filter);

    return {
      tasks: data,
      meta: { total, page, limit, totalPages },
    };
  },

  async getTaskById(tenantId: string, id: string, t: any) {
    const task = await projectRepository.findTaskById(tenantId, id);
    if (!task) throw new NotFoundError(t("task.not_found"));
    return task;
  },

  async createTask(tenantId: string, input: CreateTaskInput, t: any) {
    // Verify project exists under this tenant if provided
    if (input.projectId) {
      const project = await projectRepository.findProjectById(tenantId, input.projectId);
      if (!project) throw new NotFoundError(t("project.not_found"));
    }

    if (input.assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: { id: input.assigneeId, tenantId },
        select: { id: true },
      });
      if (!assignee) throw new BadRequestError(t("task.invalid_assignee"));
    }

    const result = await projectRepository.createTask(tenantId, input);

    if (result.assignee?.id) {
      notificationService.triggerTaskAssigned(tenantId, {
        id: result.id,
        title: result.title,
        assigneeId: result.assignee.id,
      }).catch(err => console.error("Notification Error:", err));
    }

    return result;
  },

  async updateTask(
    tenantId: string,
    id: string,
    input: UpdateTaskInput,
    t: any
  ) {
    const task = await projectRepository.findTaskById(tenantId, id);
    if (!task) throw new NotFoundError(t("task.not_found"));

    if (input.assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: { id: input.assigneeId, tenantId },
        select: { id: true },
      });
      if (!assignee) throw new BadRequestError(t("task.invalid_assignee"));
    }

    const result = await projectRepository.updateTask(tenantId, id, input);

    if (result.assignee?.id && result.assignee.id !== task.assignee?.id) {
      notificationService.triggerTaskAssigned(tenantId, {
        id: result.id,
        title: result.title,
        assigneeId: result.assignee.id,
      }).catch(err => console.error("Notification Error:", err));
    }

    return result;
  },

  async updateTaskStatus(
    tenantId: string,
    id: string,
    input: UpdateTaskStatusInput,
    requesterId: string,
    requesterRole: string,
    t: any
  ) {
    const task = await projectRepository.findTaskById(tenantId, id);
    if (!task) throw new NotFoundError(t("task.not_found"));

    // Only the assignee or a manager-level role can move task status
    const isManager = ["MANAGER", "HR_ADMIN", "TENANT_OWNER"].includes(requesterRole);

    try {
      const result = await projectRepository.updateTaskStatus(tenantId, id, input);

      const updater = await prisma.user.findUnique({
        where: { id: requesterId },
        select: { firstName: true, lastName: true, email: true },
      });
      const updaterName = updater ? (updater.firstName && updater.lastName ? `${updater.firstName} ${updater.lastName}` : updater.email) : "Someone";

      notificationService.triggerTaskStatusUpdated(
        tenantId,
        {
          id: result.id,
          title: result.title,
          createdById: result.createdBy.id,
          assigneeId: result.assignee?.id,
        },
        task.status,
        result.status,
        updaterName
      ).catch(err => console.error("Notification Error:", err));

      return result;
    } catch (error: any) {
      if (error.message?.includes("sub-task")) {
        throw new BadRequestError(t("task.open_subtasks_exist"));
      }
      throw error;
    }
  },

  async createSubTask(
    tenantId: string,
    parentTaskId: string,
    input: CreateTaskInput,
    t: any
  ) {
    const parent = await projectRepository.findTaskById(tenantId, parentTaskId);
    if (!parent) throw new NotFoundError(t("task.not_found"));

    if (input.assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: { id: input.assigneeId, tenantId },
        select: { id: true },
      });
      if (!assignee) throw new BadRequestError(t("task.invalid_assignee"));
    }

    try {
      const result = await projectRepository.createSubTask(tenantId, parentTaskId, input);

      if (result.assignee?.id) {
        notificationService.triggerTaskAssigned(tenantId, {
          id: result.id,
          title: result.title,
          assigneeId: result.assignee.id,
        }).catch(err => console.error("Notification Error:", err));
      }

      return result;
    } catch (error: any) {
      if (error.message?.includes("one level")) {
        throw new BadRequestError(t("task.subtask_nesting_not_allowed"));
      }
      throw error;
    }
  },

  /**
   * My assigned tasks with filters and pagination.
   * Supports: status, priority, page, limit
   */
  async getMyTasks(
    tenantId: string,
    userId: string,
    filter: MyTasksFilter,
    t: any
  ) {
    const { data, total, page, limit, totalPages } =
      await projectRepository.getMyTasks(tenantId, userId, filter);

    return {
      tasks: data,
      meta: { total, page, limit, totalPages },
    };
  },

  async getOverdueReport(tenantId: string, t: any) {
    return projectRepository.getOverdueTasksGroupedByAssignee(tenantId);
  },
};