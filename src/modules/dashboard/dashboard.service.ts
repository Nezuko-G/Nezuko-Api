import { dashboardRepository } from "./dashboard.repository.js";

export const dashboardService = {
  async getDashboardData(tenantId: string, t: any) {
    const [
      keyMetrics,
      employeesByDepartment,
      employeesByStatus,
      employeesByGender,
      employeesByJobTitle,
      hiringTrend,
      leaveStats,
      leaveByDepartment,
      attendanceStats,
      attendanceByDepartment,
      overtimeByDepartment,
      projectStats,
      taskStats,
      tasksByPriority,
      overdueTasksCount,
      salaryByDepartment,
      totalPayrollCost,
      averageSalary,
      payrollRunsThisYear,
      insuranceStats,
      insuranceEnrollmentRate,
      assetStats,
      assetCondition,
      assetsByCategory,
      recentHires,
      topDepartments,
      turnoverRate,
      topJobPositions,
    ] = await Promise.all([
      dashboardRepository.getKeyMetricsSummary(tenantId),
      dashboardRepository.getEmployeesByDepartment(tenantId),
      dashboardRepository.getEmployeesByStatus(tenantId),
      dashboardRepository.getEmployeesByGender(tenantId),
      dashboardRepository.getEmployeesByJobTitle(tenantId),
      dashboardRepository.getHiringTrend(tenantId),
      dashboardRepository.getLeaveRequestStats(tenantId),
      dashboardRepository.getLeaveRequestsByDepartment(tenantId),
      dashboardRepository.getAttendanceStats(tenantId),
      dashboardRepository.getAverageAttendanceByDepartment(tenantId),
      dashboardRepository.getOvertimeByDepartment(tenantId),
      dashboardRepository.getProjectStats(tenantId),
      dashboardRepository.getTaskStats(tenantId),
      dashboardRepository.getTasksByPriority(tenantId),
      dashboardRepository.getOverdueTasksCount(tenantId),
      dashboardRepository.getSalaryByDepartment(tenantId),
      dashboardRepository.getTotalPayrollCost(tenantId),
      dashboardRepository.getAverageSalary(tenantId),
      dashboardRepository.getPayrollRunsThisYear(tenantId),
      dashboardRepository.getInsuranceEnrollmentStats(tenantId),
      dashboardRepository.getInsuranceEnrollmentRate(tenantId),
      dashboardRepository.getAssetStats(tenantId),
      dashboardRepository.getAssetConditionStats(tenantId),
      dashboardRepository.getAssetsByCategory(tenantId),
      dashboardRepository.getRecentHires(tenantId),
      dashboardRepository.getTopDepartments(tenantId),
      dashboardRepository.getEmployeeTurnoverRate(tenantId),
      dashboardRepository.getTopJobPositions(tenantId),
    ]);

    return {
      keyMetrics,

      charts: {
        // Pie
        employeesByDepartment: {
          type: "pie",
          title: t("dashboard.employees_by_department"),
          data: employeesByDepartment.map((d) => ({
            label: d.name,
            value: d._count.users,
          })),
        },
        employeesByStatus: {
          type: "pie",
          title: t("dashboard.employees_by_status"),
          data: employeesByStatus.map((d) => ({
            label: d.status,
            value: d.count,
          })),
        },
        employeesByGender: {
          type: "pie",
          title: t("dashboard.employees_by_gender"),
          data: employeesByGender.map((d) => ({
            label: d.gender,
            value: d.count,
          })),
        },
        projectStatus: {
          type: "pie",
          title: t("dashboard.projects_by_status"),
          data: projectStats.map((p) => ({ label: p.status, value: p.count })),
        },
        assetStatus: {
          type: "pie",
          title: t("dashboard.assets_by_status"),
          data: assetStats.map((a) => ({ label: a.status, value: a.count })),
        },
        assetCondition: {
          type: "pie",
          title: t("dashboard.assets_by_condition"),
          data: assetCondition.map((a) => ({
            label: a.condition,
            value: a.count,
          })),
        },
        leaveRequestStatus: {
          type: "pie",
          title: t("dashboard.leave_requests_by_status"),
          data: leaveStats.map((l) => ({ label: l.status, value: l.count })),
        },

        // Bar
        employeesByJobTitle: {
          type: "histogram",
          title: t("dashboard.employees_by_job_title"),
          data: employeesByJobTitle.map((j) => ({
            label: j.jobTitle,
            value: j.count,
          })),
        },
        attendanceByDepartment: {
          type: "histogram",
          title: t("dashboard.attendance_rate_by_department"),
          data: attendanceByDepartment.map((d) => ({
            label: d.department,
            present: d.presentPercentage,
            absent: 100 - d.presentPercentage,
          })),
        },
        salaryByDepartment: {
          type: "histogram",
          title: t("dashboard.average_salary_by_department"),
          data: salaryByDepartment.map((d) => ({
            label: d.department,
            value: d.averageSalary,
            total: d.totalSalary,
            count: d.employeeCount,
          })),
        },
        leaveRequestsByDepartment: {
          type: "histogram",
          title: t("dashboard.leave_requests_by_department"),
          data: leaveByDepartment.map((d) => ({
            label: d.department,
            value: d.leaveRequestCount,
          })),
        },
        overtimeByDepartment: {
          type: "histogram",
          title: t("dashboard.overtime_hours_by_department"),
          data: overtimeByDepartment.map((d) => ({
            label: d.department,
            value: d.totalOvertimeHours,
          })),
        },
        taskStatus: {
          type: "histogram",
          title: t("dashboard.tasks_by_status"),
          data: taskStats.map((t) => ({ label: t.status, value: t.count })),
        },
        taskPriority: {
          type: "histogram",
          title: t("dashboard.tasks_by_priority"),
          data: tasksByPriority.map((t) => ({
            label: t.priority,
            value: t.count,
          })),
        },
        assetsByCategory: {
          type: "histogram",
          title: t("dashboard.assets_by_category"),
          data: assetsByCategory.map((a) => ({
            label: a.category,
            value: a.count,
          })),
        },
        insuranceEnrollmentByPlan: {
          type: "histogram",
          title: t("dashboard.insurance_enrollment_by_plan"),
          data: insuranceStats.map((i) => ({
            label: i.planName,
            value: i.enrolledCount,
          })),
        },

        // Line
        hiringTrend: {
          type: "line",
          title: t("dashboard.hiring_trend_12_months"),
          data: hiringTrend.map((h) => ({ date: h.date, newHires: h.count })),
        },
        leaveRequestsTrend: {
          type: "line",
          title: t("dashboard.leave_requests_trend"),
          data: leaveStats,
        },
      },

      insights: {
        topDepartments: {
          title: t("dashboard.top_departments"),
          data: topDepartments.map((d) => ({
            department: d.name,
            headcount: d._count.users,
          })),
        },
        topJobPositions: {
          title: t("dashboard.top_job_positions"),
          data: topJobPositions,
        },
        recentHires: {
          title: t("dashboard.recent_hires"),
          count: recentHires.length,
          data: recentHires.map((h) => ({
            name: `${h.firstName} ${h.lastName}`,
            position: h.jobTitle,
            hireDate: h.hireDate,
          })),
        },
        employeeTurnover: {
          title: t("dashboard.employee_turnover"),
          turnoverRate: turnoverRate.turnoverRate,
          terminatedLastYear: turnoverRate.terminatedLastYear,
        },
        attendanceOverview: {
          title: t("dashboard.attendance_overview"),
          presentPercentage: attendanceStats.presentPercentage,
          absentPercentage: attendanceStats.absentPercentage,
          totalRecords: attendanceStats.total,
        },
        insuranceOverview: {
          title: t("dashboard.insurance_overview"),
          enrollmentRate: insuranceEnrollmentRate.enrollmentRate,
          enrolledEmployees: insuranceEnrollmentRate.enrolledEmployees,
          totalEmployees: insuranceEnrollmentRate.totalEmployees,
        },
        projectsOverview: {
          title: t("dashboard.projects_overview"),
          totalProjects: keyMetrics.totalProjects,
          totalTasks: keyMetrics.totalTasks,
          overdueTasksCount,
        },
        payrollOverview: {
          title: t("dashboard.payroll_overview"),
          totalMonthlyPayroll: totalPayrollCost,
          averageSalary,
          payrollRunsThisYear,
        },
      },

      rawData: {
        salaryByDepartment,
        attendanceByDepartment,
        overtimeByDepartment,
        leaveByDepartment,
        insuranceStats,
      },
    };
  },
};