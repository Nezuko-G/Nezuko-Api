import type { TimesheetStatus } from "@prisma/client";

export interface TimesheetEntryInput {
  userId: string;
  date: Date;
  checkIn?: Date | null;
  checkOut?: Date | null;
  notes?: string | null;
}

export interface CreateTimesheetsInput {
  tenantId: string;
  submittedBy: string;
  status?: TimesheetStatus;
  entries: TimesheetEntryInput[];
}

export interface UpdateTimesheetInput {
  date?: Date;
  checkIn?: Date | null;
  checkOut?: Date | null;
  notes?: string | null;
  status?: TimesheetStatus;
}

export interface UpdateTimesheetStatusInput {
  status: Extract<TimesheetStatus, "APPROVED" | "REJECTED">;
}

export interface ListTimesheetsFilter {
  userId?: string;
  status?: TimesheetStatus;
  startDate?: Date;
  endDate?: Date;
  departmentId?: string;
  page?: number;
  limit?: number;
}

export interface OvertimeReportFilter {
  startDate: Date;
  endDate: Date;
  departmentId?: string;
  page?: number;
  limit?: number;
}
