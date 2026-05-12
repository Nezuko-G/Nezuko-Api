import { dashboardRepository } from "./dashboard.repository.js";
import type { Request } from "express";
import PDFDocument from "pdfkit";
import cloudinary from "@/shared/config/cloudinary.js";


function generatePDFBuffer(data: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Title
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Dashboard Report", { align: "center" });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Generated: ${new Date().toLocaleString()}`, {
        align: "center",
      });
    doc.moveDown(1);

    // Key Metrics Section
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Key Metrics", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica");

    const metrics = data.keyMetrics;
    const metricsData = [
      ["Total Employees", metrics.totalEmployees],
      ["Total Departments", metrics.totalDepartments],
      ["Total Projects", metrics.totalProjects],
      ["Total Tasks", metrics.totalTasks],
      ["Pending Leaves", metrics.pendingLeaves],
      ["Active Assets", metrics.activeAssets],
      ["Average Salary", `$${metrics.averageSalary.toLocaleString()}`],
    ];

    metricsData.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`);
    });

    doc.moveDown(1);

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Key Insights", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica");

    if (data.insights) {
      const insights = data.insights;

      if (insights.topDepartments?.data?.length > 0) {
        doc.text("Top Departments:", { underline: true });
        insights.topDepartments.data.slice(0, 5).forEach((dept: any) => {
          doc.text(`  • ${dept.department}: ${dept.headcount} employees`);
        });
        doc.moveDown(0.3);
      }

      if (insights.topJobPositions?.data?.length > 0) {
        doc.text("Top Job Positions:", { underline: true });
        insights.topJobPositions.data.slice(0, 5).forEach((pos: any) => {
          doc.text(`  • ${pos.jobTitle}: ${pos.count} employees`);
        });
        doc.moveDown(0.3);
      }

      if (insights.employeeTurnover) {
        doc.text(
          `Employee Turnover Rate: ${insights.employeeTurnover.turnoverRate}%`,
        );
        doc.moveDown(0.3);
      }

      if (insights.attendanceOverview) {
        doc.text(
          `Attendance Rate (Last 30 Days): ${insights.attendanceOverview.presentPercentage}%`,
        );
        doc.moveDown(0.3);
      }

      if (insights.insuranceOverview) {
        doc.text(
          `Insurance Enrollment Rate: ${insights.insuranceOverview.enrollmentRate}%`,
        );
        doc.moveDown(0.3);
      }

      if (insights.projectsOverview) {
        doc.text(
          `Projects Overview: ${insights.projectsOverview.totalProjects} projects, ${insights.projectsOverview.totalTasks} tasks, ${insights.projectsOverview.overdueTasksCount} overdue`,
        );
        doc.moveDown(0.3);
      }

      if (insights.payrollOverview) {
        doc.text(
          `Monthly Payroll: $${insights.payrollOverview.totalMonthlyPayroll.toLocaleString()}, Avg Salary: $${insights.payrollOverview.averageSalary.toLocaleString()}`,
        );
      }
    }

    doc.end();
  });
}

function generateCSVString(data: any): string {
  const lines: string[] = [];

  // Add header
  lines.push("Nezuko Dashboard Report");
  lines.push(`Generated,${new Date().toLocaleString()}`);
  lines.push("");

  // Add Key Metrics section
  lines.push("KEY METRICS");
  lines.push("Metric,Value");

  const metrics = data.keyMetrics;
  lines.push(`Total Employees,${metrics.totalEmployees}`);
  lines.push(`Total Departments,${metrics.totalDepartments}`);
  lines.push(`Total Projects,${metrics.totalProjects}`);
  lines.push(`Total Tasks,${metrics.totalTasks}`);
  lines.push(`Pending Leaves,${metrics.pendingLeaves}`);
  lines.push(`Active Assets,${metrics.activeAssets}`);
  lines.push(`Average Salary,${metrics.averageSalary}`);
  lines.push("");

  // Add Insights section
  lines.push("KEY INSIGHTS");
  lines.push("");

  if (data.insights?.topDepartments?.data?.length > 0) {
    lines.push("TOP DEPARTMENTS");
    lines.push("Department,Headcount");
    data.insights.topDepartments.data.slice(0, 5).forEach((dept: any) => {
      lines.push(`"${dept.department}",${dept.headcount}`);
    });
    lines.push("");
  }

  if (data.insights?.topJobPositions?.data?.length > 0) {
    lines.push("TOP JOB POSITIONS");
    lines.push("Position,Count");
    data.insights.topJobPositions.data.slice(0, 5).forEach((pos: any) => {
      lines.push(`"${pos.jobTitle}",${pos.count}`);
    });
    lines.push("");
  }

  if (data.insights?.employeeTurnover) {
    lines.push("EMPLOYEE TURNOVER");
    lines.push(
      `Turnover Rate (Annual),${data.insights.employeeTurnover.turnoverRate}%`,
    );
    lines.push(
      `Terminated Last Year,${data.insights.employeeTurnover.terminatedLastYear}`,
    );
    lines.push("");
  }

  if (data.insights?.attendanceOverview) {
    lines.push("ATTENDANCE OVERVIEW (Last 30 Days)");
    lines.push(
      `Present Percentage,${data.insights.attendanceOverview.presentPercentage}%`,
    );
    lines.push(
      `Absent Percentage,${data.insights.attendanceOverview.absentPercentage}%`,
    );
    lines.push(
      `Total Records,${data.insights.attendanceOverview.totalRecords}`,
    );
    lines.push("");
  }

  if (data.insights?.insuranceOverview) {
    lines.push("INSURANCE ENROLLMENT");
    lines.push(
      `Enrollment Rate,${data.insights.insuranceOverview.enrollmentRate}%`,
    );
    lines.push(
      `Enrolled Employees,${data.insights.insuranceOverview.enrolledEmployees}`,
    );
    lines.push(
      `Total Employees,${data.insights.insuranceOverview.totalEmployees}`,
    );
    lines.push("");
  }

  if (data.insights?.projectsOverview) {
    lines.push("PROJECTS & TASKS OVERVIEW");
    lines.push(
      `Total Projects,${data.insights.projectsOverview.totalProjects}`,
    );
    lines.push(`Total Tasks,${data.insights.projectsOverview.totalTasks}`);
    lines.push(
      `Overdue Tasks,${data.insights.projectsOverview.overdueTasksCount}`,
    );
    lines.push("");
  }

  if (data.insights?.payrollOverview) {
    lines.push("PAYROLL OVERVIEW");
    lines.push(
      `Total Monthly Payroll,${data.insights.payrollOverview.totalMonthlyPayroll}`,
    );
    lines.push(`Average Salary,${data.insights.payrollOverview.averageSalary}`);
    lines.push(
      `Payroll Runs This Year,${data.insights.payrollOverview.payrollRunsThisYear}`,
    );
  }

  return lines.join("\n");
}

/**
 * Upload file to Cloudinary
 */
async function uploadToCloudinary(
  buffer: Buffer,
  fileName: string,
  tenantId: string,
  fileType: "pdf" | "csv",
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `dashboard/${tenantId}`,
        public_id: `${fileName}-${Date.now()}`,
        resource_type: fileType === "pdf" ? "auto" : "raw",
        format: fileType,
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result.secure_url);
      },
    );

    uploadStream.end(buffer);
  });
}

export const dashboardService = {
  /**
   * Get comprehensive dashboard data with all metrics and charts
   */
  async getDashboardData(tenantId: string, t: any) {
    try {
      // Fetch all data in parallel for better performance
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
          // ============ PIE CHARTS ============
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
            data: projectStats.map((p) => ({
              label: p.status,
              value: p.count,
            })),
          },
          assetStatus: {
            type: "pie",
            title: t("dashboard.assets_by_status"),
            data: assetStats.map((a) => ({
              label: a.status,
              value: a.count,
            })),
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
            data: leaveStats.map((l) => ({
              label: l.status,
              value: l.count,
            })),
          },

          // ============ HISTOGRAM/BAR CHARTS ============
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
            data: taskStats.map((t) => ({
              label: t.status,
              value: t.count,
            })),
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

          // ============ LINE CHARTS ============
          hiringTrend: {
            type: "line",
            title: t("dashboard.hiring_trend_12_months"),
            data: hiringTrend.map((h) => ({
              date: h.date,
              newHires: h.count,
            })),
          },
          leaveRequestsTrend: {
            type: "line",
            title: t("dashboard.leave_requests_trend"),
            data: leaveStats.length > 0 ? leaveStats : [],
          },
        },

        // ============ KEY INSIGHTS ============
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

        // ============ RAW DATA FOR CUSTOM DASHBOARDS ============
        rawData: {
          salaryByDepartment,
          attendanceByDepartment,
          overtimeByDepartment,
          leaveByDepartment,
          insuranceStats,
        },
      };
    } catch (error) {
      console.error("Dashboard error:", error);
      throw error;
    }
  },

  /**
   * Get specific chart data by identifier (type or name)
   * Can query by chart type (pie, histogram, line) or specific chart name
   */
  async getChartData(tenantId: string, identifier: string, t: any) {
    try {
      const id = identifier.toLowerCase();

      // Map of chart types to their data sources
      const chartTypeMap: Record<string, string[]> = {
        pie: [
          "employees_by_department",
          "employees_by_status",
          "employees_by_gender",
          "projects",
          "assets",
          "leave_requests",
        ],
        histogram: [
          "employees_by_job_title",
          "attendance_by_department",
          "overtime_by_department",
          "salary_by_department",
          "tasks",
          "assets_by_category",
          "insurance",
        ],
        line: [
          "hiring_trend",
          "leave_requests_trend",
          "attendance_trend",
          "overtime_trend",
        ],
      };

      // If it's a chart type request, return all charts of that type
      if (chartTypeMap[id]) {
        const charts: Record<string, any> = {};
        for (const chartName of chartTypeMap[id]) {
          try {
            charts[chartName] = await this.getChartData(tenantId, chartName, t);
          } catch {
            // Skip charts that fail
          }
        }
        return charts;
      }

      // Otherwise, fetch specific chart by name
      switch (id) {
        case "employees_by_department":
          return await dashboardRepository.getEmployeesByDepartment(tenantId);

        case "employees_by_status":
          return await dashboardRepository.getEmployeesByStatus(tenantId);

        case "employees_by_gender":
          return await dashboardRepository.getEmployeesByGender(tenantId);

        case "employees_by_job_title":
          return await dashboardRepository.getEmployeesByJobTitle(tenantId);

        case "hiring_trend":
          return await dashboardRepository.getHiringTrend(tenantId, 12);

        case "attendance_by_department":
          return await dashboardRepository.getAverageAttendanceByDepartment(
            tenantId,
          );

        case "overtime_by_department":
          return await dashboardRepository.getOvertimeByDepartment(tenantId);

        case "salary_by_department":
          return await dashboardRepository.getSalaryByDepartment(tenantId);

        case "projects":
          return await dashboardRepository.getProjectStats(tenantId);

        case "tasks":
          return await dashboardRepository.getTaskStats(tenantId);

        case "assets":
          return await dashboardRepository.getAssetStats(tenantId);

        case "assets_by_category":
          return await dashboardRepository.getAssetsByCategory(tenantId);

        case "insurance":
          return await dashboardRepository.getInsuranceEnrollmentStats(
            tenantId,
          );

        case "leave_requests":
          return await dashboardRepository.getLeaveRequestStats(tenantId);

        case "leave_requests_trend":
          return await dashboardRepository.getLeaveRequestsTrend(tenantId, 6);

        case "attendance_trend":
          return await dashboardRepository.getAttendanceTrend(tenantId, 30);

        case "overtime_trend":
          return await dashboardRepository.getOvertimeTrend(tenantId, 6);

        default:
          throw new Error(t("dashboard.chart_not_found"));
      }
    } catch (error) {
      console.error("Chart data error:", error);
      throw error;
    }
  },

  /**
   * Get metrics summary
   */
  async getMetricsSummary(tenantId: string) {
    return await dashboardRepository.getKeyMetricsSummary(tenantId);
  },

  /**
   * Export dashboard as PDF and CSV to Cloudinary
   */
  async exportDashboardFiles(tenantId: string, t: any) {
    try {
      const dashboardData = await this.getDashboardData(tenantId, t);
      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = `dashboard-${timestamp}`;

      // Generate PDF and CSV buffers
      const [pdfBuffer, csvString] = await Promise.all([
        generatePDFBuffer(dashboardData),
        Promise.resolve(generateCSVString(dashboardData)),
      ]);

      // Convert CSV string to buffer
      const csvBuffer = Buffer.from(csvString, "utf-8");

      // Upload both files to Cloudinary in parallel
      const [pdfUrl, csvUrl] = await Promise.all([
        uploadToCloudinary(pdfBuffer, `${fileName}-pdf`, tenantId, "pdf"),
        uploadToCloudinary(csvBuffer, `${fileName}-csv`, tenantId, "csv"),
      ]);

      return {
        status: "success",
        message:
          t("dashboard.export_success") || "Dashboard exported successfully",
        files: {
          pdf: {
            url: pdfUrl,
            fileName: `${fileName}.pdf`,
            format: "pdf",
          },
          csv: {
            url: csvUrl,
            fileName: `${fileName}.csv`,
            format: "csv",
          },
        },
        exportedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Export error:", error);
      throw error;
    }
  },
};
