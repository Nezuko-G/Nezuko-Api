import prisma from "@/shared/config/prisma.js";
import type { ReportFilters } from "@/shared/interfaces/report.interface.js";
import type { LeaveStatus, TaskStatus } from "@prisma/client";

const DEFAULT_OVERTIME_THRESHOLD_HOURS = 8;

const toOvertimeThresholdHours = (threshold: number) => {
  return threshold > 24 ? threshold / 60 : threshold;
};

const toDateRangeFilter = (
  startDate?: Date,
  endDate?: Date,
): { gte?: Date; lte?: Date } | undefined => {
  if (!startDate && !endDate) {
    return undefined;
  }

  return {
    ...(startDate && { gte: startDate }),
    ...(endDate && { lte: endDate }),
  };
};

const leaveStatusOrder: LeaveStatus[] = [
  "APPROVED",
  "REJECTED",
  "PENDING",
  "CANCELLED",
];

const taskStatusOrder: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "BLOCKED",
];

export const reportsRepository = {
  async getHeadcountReport(tenantId: string, filters: ReportFilters) {
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        role: "EMPLOYEE",
        isActive: true,
        status: "ACTIVE",
        ...(filters.departmentId && { departmentId: filters.departmentId }),
        ...(filters.userId && { id: filters.userId }),
      },
      select: {
        id: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const counts = new Map<
      string,
      {
        departmentId: string | null;
        departmentName: string;
        activeEmployees: number;
      }
    >();

    for (const user of users) {
      const key = user.departmentId ?? "unassigned";
      const existing = counts.get(key);

      if (existing) {
        existing.activeEmployees += 1;
        continue;
      }

      counts.set(key, {
        departmentId: user.departmentId,
        departmentName: user.department?.name ?? "Unassigned",
        activeEmployees: 1,
      });
    }

    return Array.from(counts.values()).sort((a, b) =>
      a.departmentName.localeCompare(b.departmentName),
    );
  },

  async getLeaveSummaryReport(tenantId: string, filters: ReportFilters) {
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        tenantId,
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.departmentId && {
          user: {
            departmentId: filters.departmentId,
          },
        }),
        ...(filters.startDate || filters.endDate
          ? {
              startDate: toDateRangeFilter(filters.startDate, filters.endDate),
            }
          : {}),
      },
      select: {
        status: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeCode: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    type Row = {
      userId: string;
      employeeName: string;
      employeeEmail: string;
      employeeCode: string | null;
      departmentId: string | null;
      departmentName: string | null;
      approved: number;
      rejected: number;
      pending: number;
      cancelled: number;
      total: number;
    };

    const perEmployee = new Map<string, Row>();

    for (const leave of leaves) {
      const existing = perEmployee.get(leave.user.id) ?? {
        userId: leave.user.id,
        employeeName:
          `${leave.user.firstName ?? ""} ${leave.user.lastName ?? ""}`.trim() ||
          leave.user.email,
        employeeEmail: leave.user.email,
        employeeCode: leave.user.employeeCode,
        departmentId: leave.user.department?.id ?? null,
        departmentName: leave.user.department?.name ?? null,
        approved: 0,
        rejected: 0,
        pending: 0,
        cancelled: 0,
        total: 0,
      };

      switch (leave.status) {
        case "APPROVED":
          existing.approved += 1;
          break;
        case "REJECTED":
          existing.rejected += 1;
          break;
        case "PENDING":
          existing.pending += 1;
          break;
        case "CANCELLED":
          existing.cancelled += 1;
          break;
      }

      existing.total += 1;
      perEmployee.set(leave.user.id, existing);
    }

    return Array.from(perEmployee.values()).sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName),
    );
  },

  async getOvertimeReport(tenantId: string, filters: ReportFilters) {
    const attendanceSettings = await prisma.attendanceSettings.findUnique({
      where: { tenantId },
      select: { overtimeThreshold: true },
    });

    const overtimeThresholdHours = attendanceSettings
      ? toOvertimeThresholdHours(attendanceSettings.overtimeThreshold)
      : DEFAULT_OVERTIME_THRESHOLD_HOURS;

    const timesheets = await prisma.timesheet.findMany({
      where: {
        tenantId,
        totalHours: {
          gt: overtimeThresholdHours,
        },
        status: {
          in: ["SUBMITTED", "APPROVED"],
        },
        ...(filters.startDate || filters.endDate
          ? {
              date: toDateRangeFilter(filters.startDate, filters.endDate),
            }
          : {}),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.departmentId && {
          user: {
            departmentId: filters.departmentId,
          },
        }),
      },
      select: {
        totalHours: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeCode: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    type Row = {
      userId: string;
      employeeName: string;
      employeeEmail: string;
      employeeCode: string | null;
      departmentId: string | null;
      departmentName: string | null;
      overtimeHours: number;
      entries: number;
    };

    const perEmployee = new Map<string, Row>();

    for (const item of timesheets) {
      const existing = perEmployee.get(item.user.id) ?? {
        userId: item.user.id,
        employeeName:
          `${item.user.firstName ?? ""} ${item.user.lastName ?? ""}`.trim() ||
          item.user.email,
        employeeEmail: item.user.email,
        employeeCode: item.user.employeeCode,
        departmentId: item.user.department?.id ?? null,
        departmentName: item.user.department?.name ?? null,
        overtimeHours: 0,
        entries: 0,
      };

      existing.overtimeHours += Math.max(
        0,
        (item.totalHours ?? 0) - overtimeThresholdHours,
      );
      existing.entries += 1;

      perEmployee.set(item.user.id, existing);
    }

    return Array.from(perEmployee.values())
      .map((row) => ({
        ...row,
        overtimeHours: Number(row.overtimeHours.toFixed(2)),
      }))
      .sort((a, b) => b.overtimeHours - a.overtimeHours);
  },

  async getAssetCustodyReport(tenantId: string, filters: ReportFilters) {
    const custodies = await prisma.assetCustody.findMany({
      where: {
        tenantId,
        returnedAt: null,
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.departmentId && {
          user: {
            departmentId: filters.departmentId,
          },
        }),
      },
      select: {
        id: true,
        assignedAt: true,
        conditionOut: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeCode: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        asset: {
          select: {
            id: true,
            name: true,
            category: true,
            serialNumber: true,
            status: true,
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    return custodies.map((entry) => ({
      custodyId: entry.id,
      assetId: entry.asset.id,
      assetName: entry.asset.name,
      category: entry.asset.category,
      serialNumber: entry.asset.serialNumber,
      assetStatus: entry.asset.status,
      assignedAt: entry.assignedAt,
      conditionOut: entry.conditionOut,
      userId: entry.user.id,
      employeeName:
        `${entry.user.firstName ?? ""} ${entry.user.lastName ?? ""}`.trim() ||
        entry.user.email,
      employeeEmail: entry.user.email,
      employeeCode: entry.user.employeeCode,
      departmentId: entry.user.department?.id ?? null,
      departmentName: entry.user.department?.name ?? null,
    }));
  },

  async getTaskCompletionReport(tenantId: string, filters: ReportFilters) {
    const tasks = await prisma.task.findMany({
      where: {
        tenantId,
        ...(filters.startDate || filters.endDate
          ? {
              createdAt: toDateRangeFilter(filters.startDate, filters.endDate),
            }
          : {}),
        ...(filters.userId && { assigneeId: filters.userId }),
        ...(filters.departmentId && {
          assignee: {
            departmentId: filters.departmentId,
          },
        }),
      },
      select: {
        status: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeCode: true,
          },
        },
      },
    });

    type Row = {
      projectId: string | null;
      projectName: string;
      assigneeId: string | null;
      assigneeName: string;
      assigneeEmail: string | null;
      assigneeCode: string | null;
      total: number;
      TODO: number;
      IN_PROGRESS: number;
      IN_REVIEW: number;
      DONE: number;
      BLOCKED: number;
    };

    const grouped = new Map<string, Row>();

    for (const task of tasks) {
      const projectId = task.project?.id ?? null;
      const assigneeId = task.assignee?.id ?? null;
      const key = `${projectId ?? "none"}:${assigneeId ?? "unassigned"}`;

      const existing = grouped.get(key) ?? {
        projectId,
        projectName: task.project?.name ?? "No Project",
        assigneeId,
        assigneeName: task.assignee
          ? `${task.assignee.firstName ?? ""} ${task.assignee.lastName ?? ""}`.trim() ||
            task.assignee.email
          : "Unassigned",
        assigneeEmail: task.assignee?.email ?? null,
        assigneeCode: task.assignee?.employeeCode ?? null,
        total: 0,
        TODO: 0,
        IN_PROGRESS: 0,
        IN_REVIEW: 0,
        DONE: 0,
        BLOCKED: 0,
      };

      existing.total += 1;
      existing[task.status] += 1;

      grouped.set(key, existing);
    }

    return Array.from(grouped.values()).sort((a, b) => {
      if (a.projectName === b.projectName) {
        return a.assigneeName.localeCompare(b.assigneeName);
      }

      return a.projectName.localeCompare(b.projectName);
    });
  },

  async getDistinctLeaveStatuses(_tenantId: string) {
    return leaveStatusOrder;
  },

  async getDistinctTaskStatuses(_tenantId: string) {
    return taskStatusOrder;
  },
};
