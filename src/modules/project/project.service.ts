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

export const projectService = {

  // Projects

  async listProjects(tenantId: string, filter: ListProjectsFilter, t: any) {
    const { data, total, page, limit, totalPages } =
      await projectRepository.listProjects(tenantId, filter);

    return {
      data,
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

    // If status is being set to CANCELLED, use the dedicated cancel method
    // which also blocks all non-DONE tasks in a transaction
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
    // If task belongs to a project, verify project exists under this tenant
    if (input.projectId) {
      const project = await projectRepository.findProjectById(
        tenantId,
        input.projectId
      );
      if (!project) throw new NotFoundError(t("project.not_found"));
    }

    return projectRepository.createTask(tenantId, input);
  },

  async updateTask(
    tenantId: string,
    id: string,
    input: UpdateTaskInput,
    t: any
  ) {
    const task = await projectRepository.findTaskById(tenantId, id);

    if (!task) throw new NotFoundError(t("task.not_found"));

    return projectRepository.updateTask(tenantId, id, input);
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

    // Only the assignee or a Manager / HR_ADMIN can move task status
    const isAssignee = task.assigneeId === requesterId;
    const isManager = ["MANAGER", "HR_ADMIN", "TENANT_OWNER"].includes(requesterRole);

    if (!isAssignee && !isManager) {
      throw new BadRequestError(t("task.status_change_not_allowed"));
    }

    try {
      return await projectRepository.updateTaskStatus(tenantId, id, input);
    } catch (error: any) {
      // Re-throw the open sub-tasks guard as a BadRequestError
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

    try {
      return await projectRepository.createSubTask(tenantId, parentTaskId, input);
    } catch (error: any) {
      // Re-throw the one-level-deep guard as a BadRequestError
      if (error.message?.includes("one level")) {
        throw new BadRequestError(t("task.subtask_nesting_not_allowed"));
      }
      throw error;
    }
  },

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