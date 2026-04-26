import type {
  ProjectStatus,
  TaskStatus,
  TaskPriority,
} from "@prisma/client";


export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: ProjectStatus;
  ownerId: string;
  startDate?: Date | string;
  dueDate?: Date | string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  ownerId?: string;
  startDate?: Date | string | null;
  dueDate?: Date | string | null;
}

export interface ListProjectsFilter {
  status?: ProjectStatus;
  ownerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProjectProgress {
  totalCount: number;
  completedCount: number;
  completionPercentage: number;
  overdueCount: number;
  estimatedHours: number;
  actualHours: number;
  hoursVariance: number; // actualHours - estimatedHours
}


export interface CreateTaskInput {
  projectId?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  createdById: string;
  dueDate?: Date | string;
  estimatedHours?: number;
  parentTaskId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: Date | string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  completedAt?: Date | null;
}

export interface UpdateTaskStatusInput {
  status: TaskStatus;
  actualHours?: number;
}

export interface ListTasksFilter {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface OverdueTasksByAssignee {
  assigneeId: string | null;
  assigneeName: string | null;
  tasks: OverdueTask[];
}

export interface OverdueTask {
  id: string;
  title: string;
  priority: TaskPriority;
  dueDate: Date | null;
  status: TaskStatus;
  projectId: string | null;
  projectName: string | null;
}

export interface MyTasksFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  page?: number;
  limit?: number;
}


export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}