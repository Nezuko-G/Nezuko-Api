import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from "@/shared/errors/errors.js";
import type {
  CreateLeaveRequestInput,
  ReviewLeaveRequestInput,
} from "@/shared/interfaces/leave-request.interface";
import { leaveRequestRepository } from "./leave-request.repository.js";
import { LeaveStatus } from "@prisma/client";

const MAX_LEAVE_DAYS_PER_REQUEST = 30;

const toUtcDateOnly = (value: Date) =>
  new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );

const countLeaveDays = (startDate: Date, endDate: Date) => {
  let totalDays = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getUTCDay();
    if (day !== 0 && day !== 6) {
      totalDays += 1;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return totalDays;
};

export const leaveRequestService = {
  async createLeaveRequest(input: CreateLeaveRequestInput, t: any) {
    const user = await leaveRequestRepository.getUserByTenantAndId(
      input.tenantId,
      input.userId,
    );

    if (!user) {
      throw new NotFoundError(t("auth.user_not_found"));
    }

    if (!user.isActive || user.role !== "EMPLOYEE") {
      throw new ForbiddenError(t("auth.forbidden"));
    }

    if (input.endDate < input.startDate) {
      throw new BadRequestError(
        t("validation.leaveRequest.endDate.beforeStart"),
      );
    }

    const normalizedReason = input.reason?.trim() || "";

    if (normalizedReason) {
      const sameReasonPendingRequest =
        await leaveRequestRepository.findPendingLeaveRequestByReason(
          input.tenantId,
          input.userId,
          normalizedReason,
        );

      if (sameReasonPendingRequest) {
        throw new ConflictError(t("leave_request.duplicate_reason_pending"));
      }
    }

    const normalizedStartDate = toUtcDateOnly(input.startDate);
    const normalizedEndDate = toUtcDateOnly(input.endDate);

    const leaveDays = countLeaveDays(normalizedStartDate, normalizedEndDate);

    if (leaveDays < 1) {
      throw new BadRequestError(t("validation.leaveRequest.duration.invalid"));
    }

    if (leaveDays > MAX_LEAVE_DAYS_PER_REQUEST) {
      throw new ConflictError(t("leave_request.duration_exceeded"));
    }

    const duplicateRequest = await leaveRequestRepository.findExactLeaveRequest(
      input.tenantId,
      input.userId,
      normalizedStartDate,
      normalizedEndDate,
    );

    if (duplicateRequest) {
      throw new ConflictError(t("leave_request.duplicate_request"));
    }

    return leaveRequestRepository.createLeaveRequest({
      ...input,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      reason: normalizedReason || null,
    });
  },

  async getLeaveRequests(
    tenantId: string,
    page: number,
    limit: number,
    search?: string,
    status?: LeaveStatus,
  ) {
    const { leaveRequests, total } =
      await leaveRequestRepository.getLeaveRequests(tenantId, page, limit, search, status);

    return {
      leaveRequests,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async getMyLeaveRequests(
    tenantId: string,
    userId: string,
    page: number,
    limit: number,
    search?: string,
    status?: LeaveStatus,
  ) {
    const { leaveRequests, total } =
      await leaveRequestRepository.getMyLeaveRequests(tenantId, userId, page, limit, search, status);

    return {
      leaveRequests,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },
  async reviewLeaveRequest(
    tenantId: string,
    reviewerId: string,
    id: string,
    input: ReviewLeaveRequestInput,
    t: any,
  ) {
    const leaveRequest = await leaveRequestRepository.getLeaveRequestById(
      tenantId,
      id,
    );

    if (!leaveRequest) {
      throw new NotFoundError(t("leave_request.not_found"));
    }

    if (leaveRequest.userId === reviewerId) {
      throw new ForbiddenError(t("leave_request.cannot_review_own_request"));
    }

    if (leaveRequest.status !== "PENDING") {
      throw new ConflictError(t("leave_request.not_pending"));
    }

    const updated = await leaveRequestRepository.reviewLeaveRequest(
      id,
      reviewerId,
      input,
    );

    if (!updated) {
      throw new ConflictError(t("leave_request.not_pending"));
    }

    return updated;
  },

  async cancelLeaveRequest(
    tenantId: string,
    userId: string,
    id: string,
    t: any,
  ) {
    const leaveRequest = await leaveRequestRepository.getLeaveRequestById(
      tenantId,
      id,
    );

    if (!leaveRequest || leaveRequest.userId !== userId) {
      throw new NotFoundError(t("leave_request.not_found"));
    }

    if (leaveRequest.status !== "PENDING") {
      throw new ConflictError(t("leave_request.not_pending_cancel"));
    }

    const updated = await leaveRequestRepository.deleteLeaveRequest(id);

    if (!updated) {
      throw new ConflictError(t("leave_request.not_pending_cancel"));
    }

    return updated;
  },
};
