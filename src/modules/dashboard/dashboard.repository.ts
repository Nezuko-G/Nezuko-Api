import prisma from "@/shared/config/prisma.js";
import {
  EmployeeStatus,
  ProjectStatus,
  TaskStatus,
  LeaveStatus,
} from "@prisma/client";

export const dashboardRepository = {
  async getTotalEmployees(tenantId: string) {
    return prisma.user.count({
      where: {
        tenantId,
        status: EmployeeStatus.ACTIVE,
      },
    });
  },

  async getTotalInactiveEmployees(tenantId: string) {
    return prisma.user.count({
      where: {
        tenantId,
        status: EmployeeStatus.INACTIVE,
      },
    });
  },

  async getTotalTerminatedEmployees(tenantId: string) {
    return prisma.user.count({
      where: {
        tenantId,
        status: EmployeeStatus.TERMINATED,
      },
    });
  },

  async getTotalDepartments(tenantId: string) {
    return prisma.department.count({
      where: { tenantId },
    });
  },

  async getUniqueDepartments(tenantId: string) {
    return prisma.department.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        _count: {
          select: { users: true },
        },
      },
    });
  },

  async getUniqueJobTitles(tenantId: string) {
    const results = await prisma.user.groupBy({
      by: ["jobTitle"],
      where: {
        tenantId,
        status: EmployeeStatus.ACTIVE,
        jobTitle: { not: null },
      },
      _count: {
        id: true,
      },
    });

    return results.map((r) => ({
      jobTitle: r.jobTitle || "Unassigned",
      count: r._count.id,
    }));
  },

  async getTotalJobPositions(tenantId: string) {
    const results = await prisma.user.findMany({
      where: {
        tenantId,
        status: EmployeeStatus.ACTIVE,
        jobTitle: { not: null },
      },
      select: { jobTitle: true },
      distinct: ["jobTitle"],
    });

    return results.length;
  },

  async getEmployeesByDepartment(tenantId: string) {
    return prisma.department.findMany({
      where: { tenantId },
      select: {
        name: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: {
        users: {
          _count: "desc",
        },
      },
    });
  },

  async getEmployeesByStatus(tenantId: string) {
    const results = await prisma.user.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: {
        id: true,
      },
    });

    return results.map((r) => ({
      status: r.status,
      count: r._count.id,
    }));
  },

  async getEmployeesByGender(tenantId: string) {
    const results = await prisma.user.groupBy({
      by: ["gender"],
      where: { tenantId },
      _count: {
        id: true,
      },
    });

    return results.map((r) => ({
      gender: r.gender || "Not Specified",
      count: r._count.id,
    }));
  },

  async getEmployeesByJobTitle(tenantId: string) {
    const results = await prisma.user.groupBy({
      by: ["jobTitle"],
      where: {
        tenantId,
        status: EmployeeStatus.ACTIVE,
        jobTitle: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    return results.map((r) => ({
      jobTitle: r.jobTitle || "Unassigned",
      count: r._count.id,
    }));
  },

  async getHiringTrend(tenantId: string, monthsBack: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    const results = await prisma.user.groupBy({
      by: ["hireDate"],
      where: {
        tenantId,
        hireDate: {
          not: null,
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        hireDate: "asc",
      },
    });

    return results.map((r) => ({
      date: r.hireDate
        ? new Date(r.hireDate).toISOString().split("T")[0]
        : null,
      count: r._count.id,
    }));
  },

  async getLeaveRequestsTrend(tenantId: string, monthsBack: number = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    const results = await prisma.leaveRequest.groupBy({
      by: ["createdAt"],
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return results.map((r) => ({
      date: new Date(r.createdAt).toISOString().split("T")[0],
      count: r._count.id,
    }));
  },

  async getAttendanceTrend(tenantId: string, daysBack: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const results = await prisma.timesheet.groupBy({
      by: ["date"],
      where: {
        tenantId,
        date: { gte: startDate },
      },
      _count: {
        id: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    return results.map((r) => ({
      date: new Date(r.date).toISOString().split("T")[0],
      recordsCount: r._count.id,
    }));
  },

  async getOvertimeTrend(tenantId: string, monthsBack: number = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    const results = await prisma.timesheet.groupBy({
      by: ["date"],
      where: {
        tenantId,
        date: { gte: startDate },
        overtimeHours: { gt: 0 },
      },
      _sum: {
        overtimeHours: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    return results.map((r) => ({
      date: new Date(r.date).toISOString().split("T")[0],
      totalOvertimeHours: parseFloat((r._sum.overtimeHours || 0).toFixed(2)),
    }));
  },

  async getLeaveRequestStats(tenantId: string) {
    const results = await prisma.leaveRequest.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: {
        id: true,
      },
    });

    return results.map((r) => ({
      status: r.status,
      count: r._count.id,
    }));
  },

  async getLeaveRequestsByDepartment(tenantId: string) {
    const departments = await prisma.department.findMany({
      where: { tenantId },
      select: {
        name: true,
        users: {
          select: { id: true },
        },
      },
    });

    const result = [];
    for (const dept of departments) {
      const userIds = dept.users.map((u) => u.id);
      const count = await prisma.leaveRequest.count({
        where: {
          tenantId,
          userId: { in: userIds },
        },
      });

      result.push({
        department: dept.name,
        leaveRequestCount: count,
      });
    }

    return result.sort((a, b) => b.leaveRequestCount - a.leaveRequestCount);
  },

  async getAttendanceStats(tenantId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const total = await prisma.timesheet.count({
      where: {
        tenantId,
        date: { gte: thirtyDaysAgo },
      },
    });

    const present = await prisma.timesheet.count({
      where: {
        tenantId,
        date: { gte: thirtyDaysAgo },
        checkIn: { not: null },
      },
    });

    const absent = total - present;

    return {
      total,
      present,
      absent,
      presentPercentage:
        total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 0,
      absentPercentage:
        total > 0 ? parseFloat(((absent / total) * 100).toFixed(2)) : 0,
    };
  },

  async getAverageAttendanceByDepartment(tenantId: string) {
    const departments = await prisma.department.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        users: {
          select: {
            id: true,
          },
        },
      },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = [];
    for (const dept of departments) {
      const userIds = dept.users.map((u) => u.id);

      const presentCount = await prisma.timesheet.count({
        where: {
          tenantId,
          userId: { in: userIds },
          date: { gte: thirtyDaysAgo },
          checkIn: { not: null },
        },
      });

      const totalCount = await prisma.timesheet.count({
        where: {
          tenantId,
          userId: { in: userIds },
          date: { gte: thirtyDaysAgo },
        },
      });

      const presentPercentage =
        totalCount > 0
          ? parseFloat(((presentCount / totalCount) * 100).toFixed(2))
          : 0;

      result.push({
        department: dept.name,
        presentPercentage,
        totalRecords: totalCount,
        presentCount,
      });
    }

    return result.sort((a, b) => b.presentPercentage - a.presentPercentage);
  },

  async getOvertimeByDepartment(tenantId: string, monthsBack: number = 3) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    const departments = await prisma.department.findMany({
      where: { tenantId },
      select: {
        name: true,
        users: {
          select: { id: true },
        },
      },
    });

    const result = [];
    for (const dept of departments) {
      const userIds = dept.users.map((u) => u.id);

      const overtimeData = await prisma.timesheet.aggregate({
        where: {
          tenantId,
          userId: { in: userIds },
          date: { gte: startDate },
          overtimeHours: { gt: 0 },
        },
        _sum: {
          overtimeHours: true,
        },
        _avg: {
          overtimeHours: true,
        },
        _count: true,
      });

      result.push({
        department: dept.name,
        totalOvertimeHours: parseFloat(
          (overtimeData._sum.overtimeHours || 0).toFixed(2),
        ),
        averageOvertimeHours: parseFloat(
          (overtimeData._avg.overtimeHours || 0).toFixed(2),
        ),
        recordsWithOvertime: overtimeData._count,
      });
    }

    return result.sort((a, b) => b.totalOvertimeHours - a.totalOvertimeHours);
  },
  
  async getProjectStats(tenantId: string) {
    const results = await prisma.project.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: {
        id: true,
      },
    });

    return results.map((r) => ({
      status: r.status,
      count: r._count.id,
    }));
  },

  async getTaskStats(tenantId: string) {
    const results = await prisma.task.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: {
        id: true,
      },
    });

    return results.map((r) => ({
      status: r.status,
      count: r._count.id,
    }));
  },

  async getTasksByPriority(tenantId: string) {
    const results = await prisma.task.groupBy({
      by: ["priority"],
      where: { tenantId },
      _count: {
        id: true,
      },
    });

    return results.map((r) => ({
      priority: r.priority,
      count: r._count.id,
    }));
  },

  async getOverdueTasksCount(tenantId: string) {
    return prisma.task.count({
      where: {
        tenantId,
        dueDate: { lt: new Date() },
        status: { not: TaskStatus.DONE },
      },
    });
  },

  async getTotalPayrollCost(tenantId: string) {
    const result = await prisma.user.aggregate({
      where: {
        tenantId,
        status: EmployeeStatus.ACTIVE,
        salary: { not: null },
      },
      _sum: {
        salary: true,
      },
    });

    return parseFloat((result._sum.salary || 0).toFixed(2));
  },

  async getAverageSalary(tenantId: string) {
    const result = await prisma.user.aggregate({
      where: {
        tenantId,
        status: EmployeeStatus.ACTIVE,
        salary: { not: null },
      },
      _avg: {
        salary: true,
      },
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
      .map((dept) => {
        const salaries = dept.users.map((u) => u.salary || 0);
        const totalSalary = salaries.reduce((sum, s) => sum + s, 0);
        const avgSalary =
          salaries.length > 0 ? totalSalary / salaries.length : 0;
        const minSalary = salaries.length > 0 ? Math.min(...salaries) : 0;
        const maxSalary = salaries.length > 0 ? Math.max(...salaries) : 0;

        return {
          department: dept.name,
          totalSalary: parseFloat(totalSalary.toFixed(2)),
          averageSalary: parseFloat(avgSalary.toFixed(2)),
          minSalary: parseFloat(minSalary.toFixed(2)),
          maxSalary: parseFloat(maxSalary.toFixed(2)),
          employeeCount: dept.users.length,
        };
      })
      .filter((d) => d.employeeCount > 0)
      .sort((a, b) => b.averageSalary - a.averageSalary);
  },

  async getPayrollRunsThisYear(tenantId: string) {
    const currentYear = new Date().getFullYear();
    return prisma.payrollRun.count({
      where: {
        tenantId,
        year: currentYear,
      },
    });
  },

  async getInsuranceEnrollmentStats(tenantId: string) {
    const enrollments = await prisma.insuranceEnrollment.groupBy({
      by: ["planId"],
      where: { tenantId, isActive: true },
      _count: {
        id: true,
      },
    });

    const result = [];
    for (const enrollment of enrollments) {
      const plan = await prisma.insurancePlan.findUnique({
        where: { id: enrollment.planId },
        select: { name: true, type: true },
      });

      if (plan) {
        result.push({
          planName: plan.name,
          planType: plan.type,
          enrolledCount: enrollment._count.id,
        });
      }
    }

    return result.sort((a, b) => b.enrolledCount - a.enrolledCount);
  },

  async getInsuranceEnrollmentRate(tenantId: string) {
    const totalActive = await prisma.user.count({
      where: {
        tenantId,
        status: EmployeeStatus.ACTIVE,
      },
    });

    const enrolled = await prisma.insuranceEnrollment.findMany({
      where: { tenantId, isActive: true },
      distinct: ["userId"],
    });

    const enrollmentRate =
      totalActive > 0
        ? parseFloat(((enrolled.length / totalActive) * 100).toFixed(2))
        : 0;

    return {
      totalEmployees: totalActive,
      enrolledEmployees: enrolled.length,
      enrollmentRate,
    };
  },

  async getAssetStats(tenantId: string) {
    const results = await prisma.asset.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: {
        id: true,
      },
    });

    return results.map((r) => ({
      status: r.status,
      count: r._count.id,
    }));
  },

  async getAssetConditionStats(tenantId: string) {
    const results = await prisma.asset.groupBy({
      by: ["condition"],
      where: { tenantId },
      _count: {
        id: true,
      },
    });

    return results.map((r) => ({
      condition: r.condition,
      count: r._count.id,
    }));
  },

  async getAssetsByCategory(tenantId: string) {
    const results = await prisma.asset.groupBy({
      by: ["category"],
      where: { tenantId },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    return results.map((r) => ({
      category: r.category,
      count: r._count.id,
    }));
  },

  async getRecentHires(tenantId: string, days: number = 30) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return prisma.user.findMany({
      where: {
        tenantId,
        createdAt: { gte: date },
      },
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

  async getTopDepartments(tenantId: string, limit: number = 5) {
    return prisma.department.findMany({
      where: { tenantId },
      select: {
        name: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: {
        users: {
          _count: "desc",
        },
      },
      take: limit,
    });
  },

  async getEmployeeTurnoverRate(tenantId: string) {
    const current = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    const totalAtYearStart = await prisma.user.count({
      where: {
        tenantId,
        createdAt: { lte: lastYear },
      },
    });

    const terminated = await prisma.user.count({
      where: {
        tenantId,
        status: EmployeeStatus.TERMINATED,
        updatedAt: {
          gte: lastYear,
          lte: current,
        },
      },
    });

    const turnoverRate =
      totalAtYearStart > 0
        ? parseFloat(((terminated / totalAtYearStart) * 100).toFixed(2))
        : 0;

    return {
      terminatedLastYear: terminated,
      employeesAtYearStart: totalAtYearStart,
      turnoverRate,
    };
  },

  async getDepartmentWithHighestHeadcount(tenantId: string) {
    const result = await prisma.department.findFirst({
      where: { tenantId },
      select: {
        name: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: {
        users: {
          _count: "desc",
        },
      },
    });

    return result
      ? { department: result.name, headcount: result._count.users }
      : null;
  },

  async getTopJobPositions(tenantId: string, limit: number = 10) {
    const results = await prisma.user.groupBy({
      by: ["jobTitle"],
      where: {
        tenantId,
        status: EmployeeStatus.ACTIVE,
        jobTitle: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: limit,
    });

    return results.map((r) => ({
      jobTitle: r.jobTitle || "Unassigned",
      count: r._count.id,
    }));
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
      this.getTotalDepartments(tenantId),
      prisma.project.count({ where: { tenantId } }),
      prisma.task.count({ where: { tenantId } }),
      prisma.leaveRequest.count({
        where: { tenantId, status: LeaveStatus.PENDING },
      }),
      prisma.asset.count({
        where: { tenantId, status: "ASSIGNED" },
      }),
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
