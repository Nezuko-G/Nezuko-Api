export interface MarkAttendanceInput {
  lat?: number;
  lng?: number;
}

export interface TimesheetData {
  id: string;
  tenantId: string;
  userId: string;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  totalHours: number | null;
  overtimeHours: number | null;
  status: string;
  notes: string | null;
  submittedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    employeeCode: string | null;
    departmentId: string | null;
    role: string;
  };
}

export interface MarkAttendanceResponse {
  action: "checked_in" | "checked_out";
  checkIn?: Date;
  checkOut?: Date;
  totalHours?: number;
  overtimeHours?: number;
  message: string;
}

export interface ListTimesheetsFilter {
  userId?: string;
  from?: string;
  to?: string;
  status?: string;
}
