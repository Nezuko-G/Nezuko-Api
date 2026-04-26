import prisma from "@/shared/config/prisma.js";
import type {
  ListTimesheetsFilter,
  OvertimeReportFilter,
  TimesheetEntryInput,
  UpdateTimesheetInput,
} from "@/shared/interfaces/timesheet.interface.js";
import {
  Prisma,
  type PrismaClient,
  type TimesheetStatus,
} from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

const db = (client?: DbClient) => client ?? prisma;

const timesheetSelect = {
  id: true,
  tenantId: true,
  userId: true,
  date: true,
  checkIn: true,
  checkOut: true,
  totalHours: true,
  overtimeHours: true,
  status: true,
  notes: true,
  submittedBy: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      employeeCode: true,
      departmentId: true,
      role: true,
    },
  },
  submitter: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      employeeCode: true,
      role: true,
    },
  },
} as const;

const timesheetMeSelect = {
  id: true,
  tenantId: true,
  userId: true,
  date: true,
  checkIn: true,
  checkOut: true,
  totalHours: true,
  overtimeHours: true,
  status: true,
  notes: true,
  submittedBy: true,
  createdAt: true,
  updatedAt: true,
  submitter: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      employeeCode: true,
      role: true,
    },
  },
} as const;

export const timesheetRepository = {
  getAttendanceSettings(tenantId: string, client?: DbClient) {
    return db(client).attendanceSettings.findUnique({
      where: { tenantId },
      select: {
        workDayStart: true,
        workDayEnd: true,
        lateGraceMinutes: true,
        earlyLeaveGrace: true,
        overtimeThreshold: true,
      },
    });
  },

  findUsersByIds(tenantId: string, userIds: string[], client?: DbClient) {
    return db(client).user.findMany({
      where: {
        tenantId,
        id: { in: userIds },
      },
      select: {
        id: true,
        role: true,
        isActive: true,
        departmentId: true,
      },
    });
  },

  findTimesheetByTenantUserDate(
    tenantId: string,
    userId: string,
    date: Date,
    client?: DbClient,
  ) {
    return db(client).timesheet.findFirst({
      where: {
        tenantId,
        userId,
        date,
      },
      select: timesheetSelect,
    });
  },

  createTimesheet(
    tenantId: string,
    submittedBy: string,
    status: TimesheetStatus,
    entry: TimesheetEntryInput,
    computed: { totalHours: number | null; overtimeHours: number | null },
    client?: DbClient,
  ) {
    return db(client).timesheet.create({
      data: {
        tenantId,
        userId: entry.userId,
        date: entry.date,
        checkIn: entry.checkIn ?? null,
        checkOut: entry.checkOut ?? null,
        notes: entry.notes ?? null,
        totalHours: computed.totalHours,
        overtimeHours: computed.overtimeHours,
        status,
        submittedBy,
      },
      select: timesheetSelect,
    });
  },

  getTimesheetById(tenantId: string, id: string, client?: DbClient) {
    return db(client).timesheet.findFirst({
      where: { tenantId, id },
      select: timesheetSelect,
    });
  },

  updateTimesheet(
    id: string,
    data: UpdateTimesheetInput,
    computed: { totalHours: number | null; overtimeHours: number | null },
    client?: DbClient,
  ) {
    return db(client)
      .timesheet.updateMany({
        where: {
          id,
          status: { in: ["DRAFT", "REJECTED"] },
        },
        data: {
          ...(data.date !== undefined && { date: data.date }),
          ...(data.checkIn !== undefined && { checkIn: data.checkIn }),
          ...(data.checkOut !== undefined && { checkOut: data.checkOut }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.status !== undefined && { status: data.status }),
          totalHours: computed.totalHours,
          overtimeHours: computed.overtimeHours,
        },
      })
      .then((result) => {
        if (result.count === 0) {
          return null;
        }

        return db(client).timesheet.findFirst({
          where: { id },
          select: timesheetSelect,
        });
      });
  },

  updateTimesheetStatus(
    id: string,
    fromStatus: TimesheetStatus,
    toStatus: TimesheetStatus,
  ) {
    return db().timesheet.updateMany({
      where: { id, status: fromStatus },
      data: { status: toStatus },
    });
  },

  getTimesheets(
    tenantId: string,
    filter: ListTimesheetsFilter,
    client?: DbClient,
  ) {
    const {
      userId,
      status,
      startDate,
      endDate,
      departmentId,
      page = 1,
      limit = 10,
    } = filter;

    const skip = (page - 1) * limit;

    const where: Prisma.TimesheetWhereInput = {
      tenantId,
      ...(userId && { userId }),
      ...(status && { status }),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
      ...(departmentId
        ? {
            user: {
              departmentId,
            },
          }
        : {}),
    };

    return db(client).$transaction([
      db(client).timesheet.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        select: timesheetSelect,
      }),
      db(client).timesheet.count({ where }),
    ]);
  },

  getMyTimesheets(
    tenantId: string,
    userId: string,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    return db().$transaction([
      db().timesheet.findMany({
        where: { tenantId, userId },
        skip,
        take: limit,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        select: timesheetMeSelect,
      }),
      db().timesheet.count({ where: { tenantId, userId } }),
    ]);
  },

  getOvertimeReport(
    tenantId: string,
    filter: OvertimeReportFilter,
    overtimeThresholdHours: number,
    client?: DbClient,
  ) {
    const { startDate, endDate, departmentId, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.TimesheetWhereInput = {
      tenantId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      totalHours: {
        gt: overtimeThresholdHours,
      },
      status: {
        in: ["SUBMITTED", "APPROVED"],
      },
      ...(departmentId
        ? {
            user: {
              departmentId,
            },
          }
        : {}),
    };

    return db(client).$transaction([
      db(client).timesheet.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ totalHours: "desc" }, { date: "desc" }],
        select: timesheetSelect,
      }),
      db(client).timesheet.count({ where }),
    ]);
  },
};
