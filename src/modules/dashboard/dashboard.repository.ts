import prisma from "@/shared/config/prisma.js";
import { EmployeeStatus, TaskStatus, LeaveStatus } from "@prisma/client";
import { nMonthsAgo, THIRTY_DAYS_AGO } from "./dashboard.helpers";


export const dashboardRepository = {

  async getTotalEmployees(tenantId: string) {
    return prisma.user.count({
      where: { tenantId, status: EmployeeStatus.ACTIVE },
    });
  },

  async getEmployeesByDepartment(tenantId: string) {
    return prisma.department.findMany({
      where: { tenantId },
      select: {
        name: true,
        _count: { select: { users: true } },
      },
      orderBy: { users: { _count: "desc" } },
    });
  },

  async getEmployeesByStatus(tenantId: string) {
    const results = await prisma.user.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { id: true },
    });
    return results.map((r) => ({ status: r.status, count: r._count.id }));
  },

  async getEmployeesByGender(tenantId: string) {
    const results = await prisma.user.groupBy({
      by: ["gender"],
      where: { tenantId },
      _count: { id: true },
    });
    return results.map((r) => ({
      gender: r.gender ?? "Not Specified",
      count: r._count.id,
    }));
  },

  async getEmployeesByJobTitle(tenantId: string) {
    const results = await prisma.user.groupBy({
      by: ["jobTitle"],
      where: { tenantId, status: EmployeeStatus.ACTIVE, jobTitle: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });
    return results.map((r) => ({
      jobTitle: r.jobTitle ?? "Unassigned",
      count: r._count.id,
    }));
  },

  async getHiringTrend(tenantId: string, monthsBack = 12) {
    const results = await prisma.user.groupBy({
      by: ["hireDate"],
      where: {
        tenantId,
        hireDate: { not: null, gte: nMonthsAgo(monthsBack) },
      },
      _count: { id: true },
      orderBy: { hireDate: "asc" },
    });
    return results.map((r) => ({
      date: r.hireDate ? new Date(r.hireDate).toISOString().split("T")[0] : null,
      count: r._count.id,
    }));
  },

  async getRecentHires(tenantId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return prisma.user.findMany({
      where: { tenantId, createdAt: { gte: since } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
        departmentId: true,
        hireDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  },

  async getTopDepartments(tenantId: string, limit = 5) {
    return prisma.department.findMany({
      where: { tenantId },
      select: {
        name: true,
        _count: { select: { users: true } },
      },
      orderBy: { users: { _count: "desc" } },
      take: limit,
    });
  },

  async getTopJobPositions(tenantId: string, limit = 10) {
    const results = await prisma.user.groupBy({
      by: ["jobTitle"],
      where: { tenantId, status: EmployeeStatus.ACTIVE, jobTitle: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
    });
    return results.map((r) => ({
      jobTitle: r.jobTitle ?? "Unassigned",
      count: r._count.id,
    }));
  },

  async getEmployeeTurnoverRate(tenantId: string) {
    const now = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    const [totalAtYearStart, terminated] = await Promise.all([
      prisma.user.count({ where: { tenantId, createdAt: { lte: lastYear } } }),
      prisma.user.count({
        where: {
          tenantId,
          status: EmployeeStatus.TERMINATED,
          updatedAt: { gte: lastYear, lte: now },
        },
      }),
    ]);

    return {
      terminatedLastYear: terminated,
      employeesAtYearStart: totalAtYearStart,
      turnoverRate:
        totalAtYearStart > 0
          ? parseFloat(((terminated / totalAtYearStart) * 100).toFixed(2))
          : 0,
    };
  },


  async getLeaveRequestStats(tenantId: string) {
    const results = await prisma.leaveRequest.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { id: true },
    });
    return results.map((r) => ({ status: r.status, count: r._count.id }));
  },

  async getLeaveRequestsByDepartment(tenantId: string) {
    // single query via relation filter
    const departments = await prisma.department.findMany({
      where: { tenantId },
      select: {
        name: true,
        users: {
          select: {
            _count: { select: { leaveRequests: true } },
          },
        },
      },
    });

    return departments
      .map((dept) => ({
        department: dept.name,
        leaveRequestCount: dept.users.reduce(
          (sum, u) => sum + u._count.leaveRequests,
          0,
        ),
      }))
      .sort((a, b) => b.leaveRequestCount - a.leaveRequestCount);
  },


  async getAttendanceStats(tenantId: string) {
    const since = THIRTY_DAYS_AGO();

    const [total, present] = await Promise.all([
      prisma.timesheet.count({ where: { tenantId, date: { gte: since } } }),
      prisma.timesheet.count({
        where: { tenantId, date: { gte: since }, checkIn: { not: null } },
      }),
    ]);

    const absent = total - present;
    return {
      total,
      present,
      absent,
      presentPercentage: total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 0,
      absentPercentage: total > 0 ? parseFloat(((absent / total) * 100).toFixed(2)) : 0,
    };
  },

  async getAverageAttendanceByDepartment(tenantId: string) {
    const since = THIRTY_DAYS_AGO();

    // fetch all timesheets with department in one query
    const records = await prisma.timesheet.findMany({
      where: { tenantId, date: { gte: since } },
      select: {
        checkIn: true,
        user: {
          select: { department: { select: { name: true } } },
        },
      },
    });

    const map = new Map<string, { total: number; present: number }>();
    for (const r of records) {
      const dept = r.user.department?.name ?? "Unassigned";
      const entry = map.get(dept) ?? { total: 0, present: 0 };
      entry.total++;
      if (r.checkIn) entry.present++;
      map.set(dept, entry);
    }

    return [...map.entries()]
      .map(([department, { total, present }]) => ({
        department,
        presentPercentage:
          total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 0,
        totalRecords: total,
        presentCount: present,
      }))
      .sort((a, b) => b.presentPercentage - a.presentPercentage);
  },

  async getOvertimeByDepartment(tenantId: string, monthsBack = 3) {
    const since = nMonthsAgo(monthsBack);

    const records = await prisma.timesheet.findMany({
      where: { tenantId, date: { gte: since }, overtimeHours: { gt: 0 } },
      select: {
        overtimeHours: true,
        user: {
          select: { department: { select: { name: true } } },
        },
      },
    });

    const map = new Map<string, { total: number; count: number }>();
    for (const r of records) {
      const dept = r.user.department?.name ?? "Unassigned";
      const entry = map.get(dept) ?? { total: 0, count: 0 };
      entry.total += Number(r.overtimeHours ?? 0);
      entry.count++;
      map.set(dept, entry);
    }

    return [...map.entries()]
      .map(([department, { total, count }]) => ({
        department,
        totalOvertimeHours: parseFloat(total.toFixed(2)),
        averageOvertimeHours: parseFloat((count > 0 ? total / count : 0).toFixed(2)),
        recordsWithOvertime: count,
      }))
      .sort((a, b) => b.totalOvertimeHours - a.totalOvertimeHours);
  },

  async getProjectStats(tenantId: string) {
    const results = await prisma.project.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { id: true },
    });
    return results.map((r) => ({ status: r.status, count: r._count.id }));
  },

  async getTaskStats(tenantId: string) {
    const results = await prisma.task.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { id: true },
    });
    return results.map((r) => ({ status: r.status, count: r._count.id }));
  },

  async getTasksByPriority(tenantId: string) {
    const results = await prisma.task.groupBy({
      by: ["priority"],
      where: { tenantId },
      _count: { id: true },
    });
    return results.map((r) => ({ priority: r.priority, count: r._count.id }));
  },

  async getOverdueTasksCount(tenantId: string) {
    return prisma.task.count({
      where: { tenantId, dueDate: { lt: new Date() }, status: { not: TaskStatus.DONE } },
    });
  },


  async getTotalPayrollCost(tenantId: string) {
    const result = await prisma.user.aggregate({
      where: { tenantId, status: EmployeeStatus.ACTIVE, salary: { not: null } },
      _sum: { salary: true },
    });
    return parseFloat((result._sum.salary ?? 0).toFixed(2));
  },

  async getAverageSalary(tenantId: string) {
    const result = await prisma.user.aggregate({
      where: { tenantId, status: EmployeeStatus.ACTIVE, salary: { not: null } },
      _avg: { salary: true },
    });
    return result._avg.salary ? parseFloat(result._avg.salary.toFixed(2)) : 0;
  },

  async getSalaryByDepartment(tenantId: string) {
    const departments = await prisma.department.findMany({
      where: { tenantId },
      select: {
        name: true,
        users: {
          where: { salary: { not: null } },
          select: { salary: true },
        },
      },
    });

    return departments
      .filter((d) => d.users.length > 0)
      .map((dept) => {
        const salaries = dept.users.map((u) => Number(u.salary ?? 0));
        const total = salaries.reduce((s, v) => s + v, 0);
        const avg = total / salaries.length;
        return {
          department: dept.name,
          totalSalary: parseFloat(total.toFixed(2)),
          averageSalary: parseFloat(avg.toFixed(2)),
          minSalary: parseFloat(Math.min(...salaries).toFixed(2)),
          maxSalary: parseFloat(Math.max(...salaries).toFixed(2)),
          employeeCount: salaries.length,
        };
      })
      .sort((a, b) => b.averageSalary - a.averageSalary);
  },

  async getPayrollRunsThisYear(tenantId: string) {
    return prisma.payrollRun.count({
      where: { tenantId, year: new Date().getFullYear() },
    });
  },

  async getInsuranceEnrollmentStats(tenantId: string) {
    // fetch all active enrollments with plan name in one query
    const enrollments = await prisma.insuranceEnrollment.findMany({
      where: { tenantId, isActive: true },
      select: {
        plan: { select: { name: true, type: true } },
      },
    });

    const map = new Map<string, { planType: string; count: number }>();
    for (const e of enrollments) {
      const key = e.plan.name;
      const entry = map.get(key) ?? { planType: e.plan.type, count: 0 };
      entry.count++;
      map.set(key, entry);
    }

    return [...map.entries()]
      .map(([planName, { planType, count }]) => ({
        planName,
        planType,
        enrolledCount: count,
      }))
      .sort((a, b) => b.enrolledCount - a.enrolledCount);
  },

  async getInsuranceEnrollmentRate(tenantId: string) {
    const [totalActive, enrolled] = await Promise.all([
      prisma.user.count({ where: { tenantId, status: EmployeeStatus.ACTIVE } }),
      prisma.insuranceEnrollment.findMany({
        where: { tenantId, isActive: true },
        distinct: ["userId"],
      }),
    ]);

    return {
      totalEmployees: totalActive,
      enrolledEmployees: enrolled.length,
      enrollmentRate:
        totalActive > 0
          ? parseFloat(((enrolled.length / totalActive) * 100).toFixed(2))
          : 0,
    };
  },

  async getAssetStats(tenantId: string) {
    const results = await prisma.asset.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { id: true },
    });
    return results.map((r) => ({ status: r.status, count: r._count.id }));
  },

  async getAssetConditionStats(tenantId: string) {
    const results = await prisma.asset.groupBy({
      by: ["condition"],
      where: { tenantId },
      _count: { id: true },
    });
    return results.map((r) => ({ condition: r.condition, count: r._count.id }));
  },

  async getAssetsByCategory(tenantId: string) {
    const results = await prisma.asset.groupBy({
      by: ["category"],
      where: { tenantId },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });
    return results.map((r) => ({ category: r.category, count: r._count.id }));
  },

  async getKeyMetricsSummary(tenantId: string) {
    const [
      totalEmployees,
      totalDepartments,
      totalProjects,
      totalTasks,
      pendingLeaves,
      activeAssets,
      averageSalary,
    ] = await Promise.all([
      this.getTotalEmployees(tenantId),
      prisma.department.count({ where: { tenantId } }),
      prisma.project.count({ where: { tenantId } }),
      prisma.task.count({ where: { tenantId } }),
      prisma.leaveRequest.count({ where: { tenantId, status: LeaveStatus.PENDING } }),
      prisma.asset.count({ where: { tenantId, status: "ASSIGNED" } }),
      this.getAverageSalary(tenantId),
    ]);

    return {
      totalEmployees,
      totalDepartments,
      totalProjects,
      totalTasks,
      pendingLeaves,
      activeAssets,
      averageSalary,
    };
  },
};