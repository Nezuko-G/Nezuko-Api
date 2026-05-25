import prisma from "@/shared/config/prisma";
import { SchemaType } from "@google/generative-ai";
import type { FunctionDeclaration } from "@google/generative-ai";

export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "getEmployeeProfile",
    description: "Get the employee's own profile information including name, job title, department, hire date, and salary",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        employeeId: { type: SchemaType.STRING, description: "The employee's user ID" },
      },
      required: ["employeeId"],
    },
  },
  {
    name: "getLeaveBalance",
    description: "Get the employee's leave balance showing remaining leave days",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        employeeId: { type: SchemaType.STRING, description: "The employee's user ID" },
      },
      required: ["employeeId"],
    },
  },
  {
    name: "getAttendanceRecords",
    description: "Get attendance records (check-in/check-out times) for an employee within a date range",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        employeeId: { type: SchemaType.STRING, description: "The employee's user ID" },
        startDate: { type: SchemaType.STRING, description: "Start date in ISO format (YYYY-MM-DD)" },
        endDate: { type: SchemaType.STRING, description: "End date in ISO format (YYYY-MM-DD)" },
      },
      required: ["employeeId", "startDate", "endDate"],
    },
  },
  {
    name: "getPayrollInfo",
    description: "Get payroll information for an employee for a specific month and year",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        employeeId: { type: SchemaType.STRING, description: "The employee's user ID" },
        month: { type: SchemaType.NUMBER, description: "Month (1-12)" },
        year: { type: SchemaType.NUMBER, description: "Year (e.g., 2026)" },
      },
      required: ["employeeId", "month", "year"],
    },
  },
  {
    name: "getInsuranceDetails",
    description: "Get the employee's insurance plan enrollment details including plan name, type, coverage, and dependents",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        employeeId: { type: SchemaType.STRING, description: "The employee's user ID" },
      },
      required: ["employeeId"],
    },
  },
  {
    name: "getCompanySettings",
    description: "Get company-wide settings including language, date format, and fiscal year start",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        tenantId: { type: SchemaType.STRING, description: "The tenant/company ID" },
      },
      required: ["tenantId"],
    },
  },
];

interface LeaveRequestRow {
  startDate: Date;
  endDate: Date;
}

async function getEmployeeProfile(employeeId: string) {
  const user = await prisma.user.findUnique({
    where: { id: employeeId },
    include: {
      department: true,
      tenant: { select: { name: true } },
    },
  });
  if (!user) return { error: "Employee not found" };

  return {
    name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
    email: user.email,
    jobTitle: user.jobTitle,
    department: user.department?.name,
    employeeCode: user.employeeCode,
    hireDate: user.hireDate?.toISOString().split("T")[0],
    salary: user.salary,
    status: user.status,
    company: user.tenant.name,
  };
}

async function getLeaveBalance(employeeId: string) {
  const user = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { id: true, tenantId: true },
  });
  if (!user) return { error: "Employee not found" };

  const approvedLeaves: LeaveRequestRow[] = await prisma.leaveRequest.findMany({
    where: { userId: employeeId, status: "APPROVED" },
    select: { startDate: true, endDate: true },
  });

  const totalUsedDays = approvedLeaves.reduce((sum: number, leave: LeaveRequestRow) => {
    const diff = Math.ceil(
      (leave.endDate.getTime() - leave.startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return sum + diff + 1;
  }, 0);

  return {
    totalAllowed: 30,
    usedDays: totalUsedDays,
    remainingDays: Math.max(0, 30 - totalUsedDays),
  };
}

async function getAttendanceRecords(employeeId: string, startDate: string, endDate: string) {
  const records = await prisma.timesheet.findMany({
    where: {
      userId: employeeId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    orderBy: { date: "desc" },
  });

  if (records.length === 0) return { message: "No attendance records found for the given period" };

  return records.map((r: { date: Date; checkIn: Date | null; checkOut: Date | null; totalHours: number | null; overtimeHours: number | null; status: string }) => ({
    date: r.date.toISOString().split("T")[0],
    checkIn: r.checkIn?.toISOString().split("T")[1]?.split(".")[0],
    checkOut: r.checkOut?.toISOString().split("T")[1]?.split(".")[0],
    totalHours: r.totalHours,
    overtimeHours: r.overtimeHours,
    status: r.status,
  }));
}

async function getPayrollInfo(employeeId: string, month: number, year: number) {
  const entries = await prisma.payrollEntry.findMany({
    where: {
      userId: employeeId,
      payrollRun: { month, year },
    },
    include: {
      payrollRun: { select: { month: true, year: true, status: true } },
      incentives: true,
    },
  });

  if (entries.length === 0) return { message: "No payroll records found for the given period" };

  return entries.map((e: { payrollRun: { month: number; year: number; status: string }; baseSalary: number; overtimePay: number; totalIncentives: number; totalDeductions: number; insuranceAmount: number; netSalary: number; incentives: Array<{ type: string; amount: number; description: string | null }> }) => ({
    month: e.payrollRun.month,
    year: e.payrollRun.year,
    status: e.payrollRun.status,
    baseSalary: e.baseSalary,
    overtimePay: e.overtimePay,
    totalIncentives: e.totalIncentives,
    totalDeductions: e.totalDeductions,
    insuranceAmount: e.insuranceAmount,
    netSalary: e.netSalary,
    incentives: e.incentives.map((i: { type: string; amount: number; description: string | null }) => ({
      type: i.type,
      amount: i.amount,
      description: i.description,
    })),
  }));
}

async function getInsuranceDetails(employeeId: string) {
  const enrollments = await prisma.insuranceEnrollment.findMany({
    where: { userId: employeeId, isActive: true },
    include: {
      plan: { select: { name: true, type: true, coverageDetails: true } },
      dependents: { select: { name: true, relation: true } },
    },
  });

  if (enrollments.length === 0) return { message: "No active insurance enrollment found" };

  return enrollments.map((e: { plan: { name: string; type: string; coverageDetails: string | null }; monthlyCost: number; startDate: Date; endDate: Date | null; dependents: Array<{ name: string; relation: string }> }) => ({
    planName: e.plan.name,
    planType: e.plan.type,
    coverageDetails: e.plan.coverageDetails,
    monthlyCost: e.monthlyCost,
    startDate: e.startDate.toISOString().split("T")[0],
    endDate: e.endDate?.toISOString().split("T")[0],
    dependents: e.dependents.map((d: { name: string; relation: string }) => ({
      name: d.name,
      relation: d.relation,
    })),
  }));
}

async function getCompanySettings(tenantId: string) {
  const settings = await prisma.companySettings.findUnique({
    where: { tenantId },
  });
  if (!settings) return { message: "Company settings not found" };

  return settings;
}

export async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  switch (name) {
    case "getEmployeeProfile":
      return { result: await getEmployeeProfile(args.employeeId as string) };
    case "getLeaveBalance":
      return { result: await getLeaveBalance(args.employeeId as string) };
    case "getAttendanceRecords":
      return {
        result: await getAttendanceRecords(
          args.employeeId as string,
          args.startDate as string,
          args.endDate as string,
        ),
      };
    case "getPayrollInfo":
      return {
        result: await getPayrollInfo(
          args.employeeId as string,
          args.month as number,
          args.year as number,
        ),
      };
    case "getInsuranceDetails":
      return { result: await getInsuranceDetails(args.employeeId as string) };
    case "getCompanySettings":
      return { result: await getCompanySettings(args.tenantId as string) };
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
