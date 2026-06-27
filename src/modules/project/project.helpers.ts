import prisma from "@/shared/config/prisma.js";
import { ProjectStatus, TaskStatus, TaskPriority } from "@prisma/client";
import type { Request } from "express";


/**
 * Check whether a task belongs to a given tenant.
 */
export async function taskBelongsToTenant(
    tenantId: string,
    taskId: string
): Promise<boolean> {
    const task = await prisma.task.findFirst({
        where: { id: taskId, tenantId },
        select: { id: true },
    });
    return !!task;
}

/**
 * Check whether a project belongs to a given tenant.
 */
export async function projectBelongsToTenant(
    tenantId: string,
    projectId: string
): Promise<boolean> {
    const project = await prisma.project.findFirst({
        where: { id: projectId, tenantId },
        select: { id: true },
    });
    return !!project;
}

/**
 * Count open sub-tasks for a parent task.
 */
export async function countOpenSubTasks(
    tenantId: string,
    parentTaskId: string
): Promise<number> {
    return prisma.task.count({
        where: {
            tenantId,
            parentTaskId,
            status: { not: TaskStatus.DONE },
        },
    });
}


const PROJECT_STATUSES = Object.values(ProjectStatus);
const TASK_STATUSES = Object.values(TaskStatus);
const TASK_PRIORITIES = Object.values(TaskPriority);

function str(val: unknown): string | undefined {
    if (typeof val === "string" && val.trim()) return val.trim();
    return undefined;
}

function clampLimit(val: unknown, def = 10): number {
    const n = Number(val);
    if (!n || n < 1) return def;
    return Math.min(n, 100);
}

export function parseProjectFilter(query: Request["query"]) {
    const status = str(query.status);
    return {
        status: status && PROJECT_STATUSES.includes(status as ProjectStatus)
            ? (status as ProjectStatus)
            : undefined,
        ownerId: str(query.ownerId),
        search: str(query.search),
        page: Math.max(1, Number(query.page) || 1),
        limit: clampLimit(query.limit),
    };
}

export function parseTaskFilter(query: Request["query"]) {
    const status = str(query.status);
    const priority = str(query.priority);
    return {
        status: status && TASK_STATUSES.includes(status as TaskStatus)
            ? (status as TaskStatus)
            : undefined,
        priority: priority && TASK_PRIORITIES.includes(priority as TaskPriority)
            ? (priority as TaskPriority)
            : undefined,
        assigneeId: str(query.assigneeId),
        search: str(query.search),
        page: Math.max(1, Number(query.page) || 1),
        limit: clampLimit(query.limit),
    };
}

export function parseMyTasksFilter(query: Request["query"]) {
    const status = str(query.status);
    const priority = str(query.priority);
    return {
        status: status && TASK_STATUSES.includes(status as TaskStatus)
            ? (status as TaskStatus)
            : undefined,
        priority: priority && TASK_PRIORITIES.includes(priority as TaskPriority)
            ? (priority as TaskPriority)
            : undefined,
        page: Math.max(1, Number(query.page) || 1),
        limit: clampLimit(query.limit),
    };
}



export const projectSelect = {
  id: true,
  tenantId: true,
  name: true,
  description: true,
  status: true,
  ownerId: true,
  startDate: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  owner: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  _count: {
    select: {
      tasks: { where: { parentTaskId: null } },
    },
  },
} as const;

export const taskSelect = {
  id: true,
  projectId: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  completedAt: true,
  estimatedHours: true,
  actualHours: true,
  createdAt: true,
  updatedAt: true,
  assignee: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  project: { select: { id: true, name: true } },
  _count: { select: { subTasks: true } },
} as const;


export const subTaskSelect = {
  id: true,
  projectId: true,
  parentTaskId: true,  
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  completedAt: true,
  estimatedHours: true,
  actualHours: true,
  createdAt: true,
  updatedAt: true,
  assignee: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
} as const;
