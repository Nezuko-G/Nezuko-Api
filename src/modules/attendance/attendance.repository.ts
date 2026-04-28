import prisma from "@/shared/config/prisma.js";
import type { ListTimesheetsFilter } from "@/shared/interfaces/attendance.interface.js";
import type { Prisma, PrismaClient, TimesheetStatus } from "@prisma/client";

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

export const attendanceRepository = {
  getAttendanceSettings(tenantId: string, client?: DbClient) {
    return db(client).attendanceSettings.findUnique({
      where: { tenantId },
      select: {
        locationAttendanceEnabled: true,
        requireLocation: true,
        geofenceEnabled: true,
        geofenceLat: true,
        geofenceLng: true,
        geofenceRadiusM: true,
        workDayStart: true,
        workDayEnd: true,
      },
    });
  },

  getTodayTimesheet(
    tenantId: string,
    userId: string,
    date: string,
    client?: DbClient,
  ) {
    return db(client).timesheet.findUnique({
      where: {
        tenantId_userId_date: {
          tenantId,
          userId,
          date: new Date(date),
        },
      },
    });
  },

  createTimesheet(
    tenantId: string,
    userId: string,
    date: string,
    checkIn: Date,
    client?: DbClient,
  ) {
    return db(client).timesheet.create({
      data: {
        tenantId,
        userId,
        date: new Date(date),
        checkIn,
        status: "DRAFT",
      },
      select: timesheetSelect,
    });
  },

  updateTimesheet(
    timesheetId: string,
    checkOut: Date,
    totalHours: number,
    overtimeHours: number,
    client?: DbClient,
  ) {
    return db(client).timesheet.update({
      where: { id: timesheetId },
      data: {
        checkOut,
        totalHours,
        overtimeHours,
      },
      select: timesheetSelect,
    });
  },

  listTimesheets(
    tenantId: string,
    filter: ListTimesheetsFilter,
    client?: DbClient,
  ) {
    const where: Prisma.TimesheetWhereInput = {
      tenantId,
      ...(filter.userId && { userId: filter.userId }),
      ...(filter.status && { status: filter.status as TimesheetStatus }),
      ...(filter.from || filter.to
        ? {
            date: {
              ...(filter.from && { gte: new Date(filter.from) }),
              ...(filter.to && { lte: new Date(filter.to) }),
            },
          }
        : {}),
    };

    return db(client).timesheet.findMany({
      where,
      select: timesheetSelect,
      orderBy: { date: "desc" },
    });
  },

  listMyTimesheets(
    tenantId: string,
    userId: string,
    filter: ListTimesheetsFilter,
    client?: DbClient,
  ) {
    const where: Prisma.TimesheetWhereInput = {
      tenantId,
      userId,
      ...(filter.status && { status: filter.status as TimesheetStatus }),
      ...(filter.from || filter.to
        ? {
            date: {
              ...(filter.from && { gte: new Date(filter.from) }),
              ...(filter.to && { lte: new Date(filter.to) }),
            },
          }
        : {}),
    };

    return db(client).timesheet.findMany({
      where,
      select: timesheetMeSelect,
      orderBy: { date: "desc" },
    });
  },
};
