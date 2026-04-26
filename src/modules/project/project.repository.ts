import prisma from "@/shared/config/prisma.js";
import { ProjectStatus, TaskStatus } from "@prisma/client";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectsFilter,
  ProjectProgress,
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
  ListTasksFilter,
  MyTasksFilter,
  OverdueTasksByAssignee,
  PaginatedResult,
} from "@/shared/interfaces/project.interface";


const projectSelect = {
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
  _count: { select: { tasks: true } },
} as const;

const taskSelect = {
  id: true,
  tenantId: true,
  projectId: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  assigneeId: true,
  createdById: true,
  dueDate: true,
  completedAt: true,
  estimatedHours: true,
  actualHours: true,
  parentTaskId: true,
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


export const projectRepository = {
  /**
   * List all projects for a tenant with optional status / search / pagination
   */

  async listProjects(
    tenantId: string,
    filter: ListProjectsFilter = {}
  ): Promise<PaginatedResult<any>> {
    const { status, ownerId, search, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(status && { status }),
      ...(ownerId && { ownerId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select: projectSelect,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  /**
   * Find a single project by id scoped to tenant.
  */
  async findProjectById(tenantId: string, id: string) {
    return prisma.project.findFirst({
      where: { id, tenantId },
      select: projectSelect,
    });
  },

  /**
   * Create a new project.
  */

  async createProject(tenantId: string, data: CreateProjectInput) {
    return prisma.project.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        status: data.status,
        ownerId: data.ownerId,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      select: projectSelect,
    });
  },

  /**
   * Update project info or status.
  */
  async updateProject(
    tenantId: string,
    id: string,
    data: UpdateProjectInput
  ) {
    return prisma.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
        ...(data.startDate !== undefined && {
          startDate: data.startDate ? new Date(data.startDate) : null,
        }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
      },
      select: projectSelect,
    });
  },

  /**
   * Cancel a project and block all its non-DONE tasks.
   * Called internally when status is set to CANCELLED.
   */
  async cancelProject(tenantId: string, id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: {
          tenantId,
          projectId: id,
          status: { notIn: [TaskStatus.DONE] },
        },
        data: { status: TaskStatus.BLOCKED },
      });
      return tx.project.update({
        where: { id },
        data: { status: ProjectStatus.CANCELLED },
        select: projectSelect,
      });
    });
  },

  /**
   * Completion % + overdue count + hours variance.
   * GET /projects/:id/progress
   */
  async getProjectProgress(
    tenantId: string,
    projectId: string
  ): Promise<ProjectProgress> {
    const tasks = await prisma.task.findMany({
      where: { tenantId, projectId },
      select: {
        status: true,
        dueDate: true,
        estimatedHours: true,
        actualHours: true,
      },
    });

    const now = new Date();
    const totalCount = tasks.length;
    const completedCount = tasks.filter(
      (t) => t.status === TaskStatus.DONE
    ).length;
    const overdueCount = tasks.filter(
      (t) =>
        t.dueDate &&
        t.dueDate < now &&
        t.status !== TaskStatus.DONE &&
        t.status !== TaskStatus.BLOCKED
    ).length;

    const estimatedHours = tasks.reduce(
      (sum, t) => sum + (t.estimatedHours ?? 0),
      0
    );
    const actualHours = tasks.reduce(
      (sum, t) => sum + (t.actualHours ?? 0),
      0
    );

    return {
      totalCount,
      completedCount,
      completionPercentage:
        totalCount === 0
          ? 0
          : Math.round((completedCount / totalCount) * 100),
      overdueCount,
      estimatedHours,
      actualHours,
      hoursVariance: actualHours - estimatedHours,
    };
  },

  /**
   * List all tasks under a project.
   */
  async listTasksByProject(
    tenantId: string,
    projectId: string,
    filter: ListTasksFilter = {}
  ): Promise<PaginatedResult<any>> {
    const { status, priority, assigneeId, search, page = 1, limit = 20 } =
      filter;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      projectId,
      parentTaskId: null, // top-level tasks only; sub-tasks are nested
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assigneeId && { assigneeId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where,
        select: {
          ...taskSelect,
          subTasks: {
            select: taskSelect,
            orderBy: { priority: "desc" },
          },
        },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  /**
   * Find a single task by id scoped to tenant.
   */
  async findTaskById(tenantId: string, id: string) {
    return prisma.task.findFirst({
      where: { id, tenantId },
      select: {
        ...taskSelect,
        subTasks: { select: taskSelect, orderBy: { priority: "desc" } },
      },
    });
  },

  /**
   * Create a standalone or project-linked task.
  */
  async createTask(tenantId: string, data: CreateTaskInput) {
    return prisma.task.create({
      data: {
        tenantId,
        projectId: data.projectId ?? null,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assigneeId ?? null,
        createdById: data.createdById,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedHours: data.estimatedHours ?? null,
        parentTaskId: data.parentTaskId ?? null,
      },
      select: taskSelect,
    });
  },

  /**
   * Update task details.
   */
  async updateTask(
    tenantId: string,
    id: string,
    data: UpdateTaskInput
  ) {
    return prisma.task.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(data.estimatedHours !== undefined && {
          estimatedHours: data.estimatedHours,
        }),
        ...(data.actualHours !== undefined && {
          actualHours: data.actualHours,
        }),
        ...(data.completedAt !== undefined && {
          completedAt: data.completedAt,
        }),
      },
      select: taskSelect,
    });
  },

  /**
   * Move task status. Blocks DONE if open sub-tasks exist.
   */
  async updateTaskStatus(
    tenantId: string,
    id: string,
    data: UpdateTaskStatusInput
  ) {
    return prisma.$transaction(async (tx) => {
      // Guard: cannot mark DONE when sub-tasks are still open
      if (data.status === TaskStatus.DONE) {
        const openSubTasks = await tx.task.count({
          where: {
            tenantId,
            parentTaskId: id,
            status: { not: TaskStatus.DONE },
          },
        });

        if (openSubTasks > 0) {
          throw new Error(
            `Cannot complete task: ${openSubTasks} sub-task(s) are not done yet.`
          );
        }
      }

      return tx.task.update({
        where: { id },
        data: {
          status: data.status,
          ...(data.actualHours !== undefined && {
            actualHours: data.actualHours,
          }),
          ...(data.status === TaskStatus.DONE && {
            completedAt: new Date(),
          }),
          // Clear completedAt if moved away from DONE
          ...(data.status !== TaskStatus.DONE && {
            completedAt: null,
          }),
        },
        select: taskSelect,
      });
    });
  },

  /**
   * Add a sub-task (one level deep only — sub-tasks cannot have sub-tasks).
   */
  async createSubTask(
    tenantId: string,
    parentTaskId: string,
    data: CreateTaskInput
  ) {
    // Enforce one-level-deep rule
    const parent = await prisma.task.findFirst({
      where: { id: parentTaskId, tenantId },
      select: { parentTaskId: true, projectId: true },
    });

    if (!parent) throw new Error("Parent task not found.");
    if (parent.parentTaskId) {
      throw new Error(
        "Sub-tasks cannot be nested further. Only one level of sub-tasks is allowed."
      );
    }

    return prisma.task.create({
      data: {
        tenantId,
        projectId: parent.projectId,
        parentTaskId,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assigneeId ?? null,
        createdById: data.createdById,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedHours: data.estimatedHours ?? null,
      },
      select: taskSelect,
    });
  },

  /**
   * My assigned tasks sorted by priority desc then due date asc.
   */
  async getMyTasks(
    tenantId: string,
    userId: string,
    filter: MyTasksFilter = {}
  ): Promise<PaginatedResult<any>> {
    const { status, priority, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      assigneeId: userId,
      parentTaskId: null,
      ...(status && { status }),
      ...(priority && { priority }),
    };

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where,
        select: {
          ...taskSelect,
          subTasks: { select: taskSelect, orderBy: { priority: "desc" } },
        },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  /**
   * All overdue tasks grouped by assignee.
   */
  async getOverdueTasksGroupedByAssignee(
    tenantId: string
  ): Promise<OverdueTasksByAssignee[]> {
    const now = new Date();

      console.log("NOW:", now);
  console.log("TENANT:", tenantId);

    const overdueTasks = await prisma.task.findMany({
      where: {
        tenantId,
        dueDate: { lt: now },
        status: { notIn: [TaskStatus.DONE, TaskStatus.BLOCKED] },
      },
      select: {
        id: true,
        title: true,
        priority: true,
        dueDate: true,
        status: true,
        projectId: true,
        assigneeId: true,
        assignee: {
          select: { id: true, firstName: true, lastName: true },
        },
        project: { select: { name: true } },
      },
      orderBy: [{ assigneeId: "asc" }, { dueDate: "asc" }],
    });
    console.log("OVERDUE TASKS:", overdueTasks);


    // Group by assignee
    const grouped = new Map<string | null, OverdueTasksByAssignee>();

    for (const task of overdueTasks) {
      const key = task.assigneeId ?? "unassigned";
      const assigneeName = task.assignee
        ? `${task.assignee.firstName ?? ""} ${task.assignee.lastName ?? ""}`.trim()
        : null;

      if (!grouped.has(key)) {
        grouped.set(key, {
          assigneeId: task.assigneeId,
          assigneeName,
          tasks: [],
        });
      }

      grouped.get(key)!.tasks.push({
        id: task.id,
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate,
        status: task.status,
        projectId: task.projectId,
        projectName: task.project?.name ?? null,
      });
    }

    return Array.from(grouped.values());
  },

};