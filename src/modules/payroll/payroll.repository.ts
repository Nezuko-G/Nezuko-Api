import prisma from "@/shared/config/prisma.js";
import { PayrollStatus } from "@prisma/client";
import type {
  CreatePayrollRunInput,
  ListPayrollRunsFilter,
  CreateIncentiveInput,
  ListIncentivesFilter,
  PaginatedResult,
} from "@/shared/interfaces/payroll.interface";
import { calcHoursPerDay } from "./payroll.helpers";


const payrollRunSelect = {
  id: true,
  tenantId: true,
  month: true,
  year: true,
  status: true,
  createdBy: true,
  approvedBy: true,
  approvedAt: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  approver: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  _count: { select: { entries: true } },
} as const;

const payrollEntrySelect = {
  id: true,
  payrollRunId: true,
  tenantId: true,
  userId: true,
  baseSalary: true,
  overtimePay: true,
  totalIncentives: true,
  totalDeductions: true,
  insuranceAmount: true,
  netSalary: true,
  overtimeHours: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      employeeCode: true,
      jobTitle: true,
      department: { select: { id: true, name: true } },
    },
  },
  incentives: {
    select: {
      id: true,
      type: true,
      amount: true,
      description: true,
      effectiveDate: true,
    },
  },
} as const;

const incentiveSelect = {
  id: true,
  tenantId: true,
  userId: true,
  payrollEntryId: true,
  type: true,
  amount: true,
  description: true,
  effectiveDate: true,
  createdBy: true,
  createdAt: true,
  user: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  creator: {
    select: { id: true, firstName: true, lastName: true },
  },
  payrollEntry: {
    select: { id: true, payrollRunId: true },
  },
} as const;



export const payrollRepository = {
  // PayrollRun

  async listRuns(
    tenantId: string,
    filter: ListPayrollRunsFilter = {}
  ): Promise<PaginatedResult<any>> {

    const { status, year, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(status && { status }),
      ...(year && { year }),
    };

    const [data, total] = await Promise.all([
      prisma.payrollRun.findMany({
        where,
        select: payrollRunSelect,
        orderBy: [{ year: "desc" }, { month: "desc" }],
        skip,
        take: limit,
      }),
      prisma.payrollRun.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findRunById(tenantId: string, id: string) {
    return prisma.payrollRun.findFirst({
      where: { id, tenantId },
      select: {
        ...payrollRunSelect,
        entries: { select: payrollEntrySelect },
      },
    });
  },

  async findRunByMonthYear(tenantId: string, month: number, year: number) {
    return prisma.payrollRun.findUnique({
      where: { tenantId_month_year: { tenantId, month, year } },
      select: payrollRunSelect,
    });
  },

  /**
   * Create a payroll run and auto-calculate all employee entries in a
   * single transaction.
   *
   * Calculation per employee:
   *   1. baseSalary          → User.salary
   *   2. overtimeHours       → sum of approved Timesheet.overtimeHours for month/year
   *   3. overtimePay         → overtimeHours × hourlyRate × 1.5
   *   4. totalIncentives     → sum of BONUS/COMMISSION/OTHER incentives for month
   *   5. totalDeductions     → sum of DEDUCTION incentives for month
   *   6. insuranceAmount     → active enrollment salary × salaryPercentage / 100
   *   7. netSalary           → formula from the issue
   */
  async createRun(
    tenantId: string,
    input: CreatePayrollRunInput
  ) {
    return prisma.$transaction(async (tx) => {
      const { month, year, createdBy } = input;

      // Boundaries for the target month
      const periodStart = new Date(year, month - 1, 1);
      const periodEnd = new Date(year, month, 1); // exclusive

      // Fetch attendance settings for hourly-rate calculation
      const attSettings = await tx.attendanceSettings.findUnique({
        where: { tenantId },
      });

      const hoursPerDay = attSettings
        ? calcHoursPerDay(attSettings.workDayStart, attSettings.workDayEnd)
        : 8;

      const workingDaysPerMonth = attSettings
        ? attSettings.workingDays.length * 4 // ~4 weeks
        : 22;

      // All active employees with a salary
      const employees = await tx.user.findMany({
        where: { tenantId, isActive: true, salary: { not: null } },
        select: {
          id: true,
          salary: true,
          insuranceEnrollments: {
            where: { isActive: true },
            select: {
              salaryAtEnrollment: true,
              plan: { select: { salaryPercentage: true } },
            },
            take: 1,
          },
        },
      });

      // Approved timesheets for the month grouped by userId
      const timesheets = await tx.timesheet.findMany({
        where: {
          tenantId,
          status: "APPROVED",
          date: { gte: periodStart, lt: periodEnd },
          overtimeHours: { gt: 0 },
        },
        select: { userId: true, overtimeHours: true },
      });

      const overtimeByUser = new Map<string, number>();
      for (const ts of timesheets) {
        overtimeByUser.set(
          ts.userId,
          (overtimeByUser.get(ts.userId) ?? 0) + (ts.overtimeHours ?? 0)
        );
      }

      // Incentives for the month (not yet linked to a payroll entry)
      const incentives = await tx.incentive.findMany({
        where: {
          tenantId,
          payrollEntryId: null,
          effectiveDate: { gte: periodStart, lt: periodEnd },
        },
        select: { id: true, userId: true, type: true, amount: true },
      });

      const incentivesByUser = new Map<
        string,
        { bonuses: number; deductions: number; ids: string[] }
      >();
      for (const inc of incentives) {
        if (!incentivesByUser.has(inc.userId)) {
          incentivesByUser.set(inc.userId, { bonuses: 0, deductions: 0, ids: [] });
        }
        const entry = incentivesByUser.get(inc.userId)!;
        if (inc.type === "DEDUCTION") {
          entry.deductions += inc.amount;
        } else {
          entry.bonuses += inc.amount;
        }
        entry.ids.push(inc.id);
      }

      // Create the run record
      const run = await tx.payrollRun.create({
        data: { tenantId, month, year, createdBy, status: "DRAFT" },
        select: payrollRunSelect,
      });

      // Build entries
      for (const emp of employees) {
        const baseSalary = emp.salary!;
        const hourlyRate = baseSalary / (workingDaysPerMonth * hoursPerDay);
        const overtimeHours = overtimeByUser.get(emp.id) ?? 0;
        const overtimePay = overtimeHours * hourlyRate * 1.5;

        const userInc = incentivesByUser.get(emp.id);
        const totalIncentives = userInc?.bonuses ?? 0;
        const totalDeductions = userInc?.deductions ?? 0;

        const enrollment = emp.insuranceEnrollments[0];
        const insuranceAmount = enrollment
          ? (enrollment.salaryAtEnrollment * enrollment.plan.salaryPercentage) / 100
          : 0;

        const netSalary =
          baseSalary + overtimePay + totalIncentives - totalDeductions - insuranceAmount;

        const payrollEntry = await tx.payrollEntry.create({
          data: {
            payrollRunId: run.id,
            tenantId,
            userId: emp.id,
            baseSalary,
            overtimePay,
            totalIncentives,
            totalDeductions,
            insuranceAmount,
            netSalary,
            overtimeHours,
          },
        });

        // Link incentives to this payroll entry
        if (userInc?.ids.length) {
          await tx.incentive.updateMany({
            where: { id: { in: userInc.ids } },
            data: { payrollEntryId: payrollEntry.id },
          });
        }
      }

      return run;
    });
  },

  async approveRun(tenantId: string, id: string, approverId: string) {
    return prisma.payrollRun.update({
      where: { id },
      data: {
        status: PayrollStatus.APPROVED,
        approvedBy: approverId,
        approvedAt: new Date(),
      },
      select: payrollRunSelect,
    });
  },

  async markPaid(tenantId: string, id: string) {
    return prisma.payrollRun.update({
      where: { id },
      data: { status: PayrollStatus.PAID, paidAt: new Date() },
      select: payrollRunSelect,
    });
  },

  async findEntry(tenantId: string, runId: string, userId: string) {
    return prisma.payrollEntry.findFirst({
      where: { payrollRunId: runId, tenantId, userId },
      select: payrollEntrySelect,
    });
  },

  // Incentives

  async listIncentives(
    tenantId: string,
    filter: ListIncentivesFilter = {}
  ): Promise<PaginatedResult<any>> {
    const { userId, type, month, year, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    let dateFilter: any = {};
    if (month && year) {
      dateFilter = {
        effectiveDate: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      };
    }

    const where = {
      tenantId,
      ...(userId && { userId }),
      ...(type && { type }),
      ...dateFilter,
    };

    const [data, total] = await Promise.all([
      prisma.incentive.findMany({
        where,
        select: incentiveSelect,
        orderBy: { effectiveDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.incentive.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findIncentiveById(tenantId: string, id: string) {
    return prisma.incentive.findFirst({
      where: { id, tenantId },
      select: incentiveSelect,
    });
  },

  async createIncentive(tenantId: string, data: CreateIncentiveInput) {
    return prisma.incentive.create({
      data: {
        tenantId,
        userId: data.userId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        effectiveDate: new Date(data.effectiveDate),
        createdBy: data.createdBy,
      },
      select: incentiveSelect,
    });
  },

  async deleteIncentive(id: string) {
    return prisma.incentive.delete({ where: { id } });
  },

  // Summary Report

  /**
   * Monthly cost breakdown grouped by department.
   * Returns per-department totals + a grand total row.
   */
  async getSummaryReport(tenantId: string, month: number, year: number) {
    const run = await prisma.payrollRun.findUnique({
      where: { tenantId_month_year: { tenantId, month, year } },
      select: { id: true, status: true },
    });

    if (!run) return null;

    const entries = await prisma.payrollEntry.findMany({
      where: { payrollRunId: run.id, tenantId },
      select: {
        baseSalary: true,
        overtimePay: true,
        totalIncentives: true,
        totalDeductions: true,
        netSalary: true,
        user: {
          select: {
            department: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Group by department
    const deptMap = new Map<
      string,
      {
        departmentId: string;
        departmentName: string;
        totalBaseSalary: number;
        totalOvertimePay: number;
        totalIncentives: number;
        totalDeductions: number;
        totalNet: number;
        headCount: number;
      }
    >();

    for (const e of entries) {
      const dept = e.user.department;
      const key = dept?.id ?? "no_department";
      const dName = dept?.name ?? "No Department";

      if (!deptMap.has(key)) {
        deptMap.set(key, {
          departmentId: key,
          departmentName: dName,
          totalBaseSalary: 0,
          totalOvertimePay: 0,
          totalIncentives: 0,
          totalDeductions: 0,
          totalNet: 0,
          headCount: 0,
        });
      }

      const row = deptMap.get(key)!;
      row.totalBaseSalary += e.baseSalary;
      row.totalOvertimePay += e.overtimePay;
      row.totalIncentives += e.totalIncentives;
      row.totalDeductions += e.totalDeductions;
      row.totalNet += e.netSalary;
      row.headCount += 1;
    }

    const departments = Array.from(deptMap.values());

    const grandTotal = departments.reduce(
      (acc, d) => ({
        totalBaseSalary: acc.totalBaseSalary + d.totalBaseSalary,
        totalOvertimePay: acc.totalOvertimePay + d.totalOvertimePay,
        totalIncentives: acc.totalIncentives + d.totalIncentives,
        totalDeductions: acc.totalDeductions + d.totalDeductions,
        totalNet: acc.totalNet + d.totalNet,
        headCount: acc.headCount + d.headCount,
      }),
      {
        totalBaseSalary: 0, totalOvertimePay: 0, totalIncentives: 0,
        totalDeductions: 0, totalNet: 0, headCount: 0,
      }
    );

    return { runId: run.id, status: run.status, month, year, departments, grandTotal };
  },
};