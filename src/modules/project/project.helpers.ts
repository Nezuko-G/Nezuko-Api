import prisma from "@/shared/config/prisma.js";
import { TaskStatus } from "@prisma/client";

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