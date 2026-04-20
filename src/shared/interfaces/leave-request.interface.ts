import { LeaveStatus } from "@prisma/client";

export interface CreateLeaveRequestInput {
  tenantId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  reason?: string | null;
}

export interface ReviewLeaveRequestInput {
  status: LeaveStatus;
  reviewNote?: string | null;
}
