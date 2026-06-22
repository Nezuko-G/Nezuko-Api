import prisma from "@/shared/config/prisma.js";
import type {
  CreateLeaveRequestInput,
  ReviewLeaveRequestInput,
} from "@/shared/interfaces/leave-request.interface";
import { LeaveStatus } from "@prisma/client";

const leaveRequestSelect = {
  id: true,
  tenantId: true,
  userId: true,
  startDate: true,
  endDate: true,
  reason: true,
  status: true,
  reviewerId: true,
  reviewNote: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      employeeCode: true,
      role: true,
      departmentId: true,
    },
  },
  reviewer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      employeeCode: true,
      role: true,
    },
  },
  reviewedAt: true,
} as const;

export const leaveRequestRepository = {
  async createLeaveRequest(data: CreateLeaveRequestInput) {
    return prisma.leaveRequest.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason ?? null,
      },
      select: leaveRequestSelect,
    });
  },

  async getUserByTenantAndId(tenantId: string, userId: string) {
    return prisma.user.findFirst({
      where: { tenantId, id: userId },
      select: {
        id: true,
        tenantId: true,
        role: true,
        isActive: true,
      },
    });
  },

  async getLeaveRequests(
    tenantId: string,
    page: number,
    limit: number,
    search?: string,
    status?: LeaveStatus,
  ) {
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(status && { status }),
      ...(search && {
        user: {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        },
      }),
    };

    const [leaveRequests, total] = await prisma.$transaction([
      prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: leaveRequestSelect,
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return { leaveRequests, total };
  },

  async getMyLeaveRequests(
    tenantId: string,
    userId: string,
    page: number,
    limit: number,
    search?: string,
    status?: LeaveStatus,
  ) {
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      userId,
      ...(status && { status }),
      ...(search && {
        user: {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        },
      }),
    };

    const [leaveRequests, total] = await prisma.$transaction([
      prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: leaveRequestSelect,
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return { leaveRequests, total };
  },

  async getLeaveRequestById(tenantId: string, id: string) {
    return prisma.leaveRequest.findFirst({
      where: { id, tenantId },
      select: leaveRequestSelect,
    });
  },

  async findExactLeaveRequest(
    tenantId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return prisma.leaveRequest.findFirst({
      where: { tenantId, userId, startDate, endDate },
      select: leaveRequestSelect,
    });
  },

  async findPendingLeaveRequestByReason(
    tenantId: string,
    userId: string,
    reason: string,
  ) {
    return prisma.leaveRequest.findFirst({
      where: {
        tenantId,
        userId,
        status: "PENDING",
        reason: {
          equals: reason,
          mode: "insensitive",
        },
      },
      select: leaveRequestSelect,
    });
  },

  async reviewLeaveRequest(
    id: string,
    reviewerId: string,
    input: ReviewLeaveRequestInput,
  ) {
    const result = await prisma.leaveRequest.updateMany({
      where: { id, status: "PENDING" },
      data: {
        status: input.status,
        reviewerId,
        reviewNote: input.reviewNote,
        reviewedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return null;
    }

    return prisma.leaveRequest.findFirst({
      where: { id },
      select: leaveRequestSelect,
    });
  },

  async deleteLeaveRequest(id: string) {
    const result = await prisma.leaveRequest.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "CANCELLED" },
    });

    if (result.count === 0) {
      return null;
    }

    return prisma.leaveRequest.findFirst({
      where: { id },
      select: leaveRequestSelect,
    });
  },
};
