import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/shared/errors/errors.js";
import type {
  CreateTimesheetsInput,
  ListTimesheetsFilter,
  OvertimeReportFilter,
  UpdateTimesheetInput,
  UpdateTimesheetStatusInput,
} from "@/shared/interfaces/timesheet.interface.js";
import type { TimesheetStatus } from "@prisma/client";
import prisma from "@/shared/config/prisma.js";
import { timesheetRepository } from "./timesheet.repository.js";

type Translator = (key: string) => string;

const DEFAULT_OVERTIME_THRESHOLD_HOURS = 8;

const toUtcDateOnly = (value: Date) =>
  new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );

const buildUtcDateFromTime = (date: Date, time: string) => {
  const [hours, minutes] = time.split(":").map((part) => Number(part));

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      Number.isFinite(hours) ? hours : 0,
      Number.isFinite(minutes) ? minutes : 0,
      0,
      0,
    ),
  );
};

const roundHours = (hours: number) => Number(hours.toFixed(2));

const toOvertimeThresholdHours = (threshold: number) => {
  // Some tenants configure threshold as hours (e.g. 8), others as minutes (e.g. 480).
  return threshold > 24 ? threshold / 60 : threshold;
};

const assertNotFutureDate = (date: Date, t: Translator) => {
  const normalized = toUtcDateOnly(date);
  const today = toUtcDateOnly(new Date());

  if (normalized > today) {
    throw new BadRequestError(t("timesheet.future_date_not_allowed"));
  }
};

const calculateHours = (
  input: {
    date: Date;
    checkIn: Date | null;
    checkOut: Date | null;
  },
  settings: {
    workDayStart: string;
    workDayEnd: string;
    lateGraceMinutes: number;
    earlyLeaveGrace: number;
    overtimeThreshold: number;
  } | null,
  t: Translator,
) => {
  if (!input.checkIn || !input.checkOut) {
    return {
      totalHours: null,
      overtimeHours: null,
    };
  }

  if (input.checkOut <= input.checkIn) {
    throw new BadRequestError(t("validation.timesheet.checkOut.afterCheckIn"));
  }

  const rawHours =
    (input.checkOut.getTime() - input.checkIn.getTime()) / (1000 * 60 * 60);

  let totalHours = rawHours;
  let overtimeThresholdHours = DEFAULT_OVERTIME_THRESHOLD_HOURS;

  if (settings) {
    const scheduledStart = buildUtcDateFromTime(
      input.date,
      settings.workDayStart,
    );
    const scheduledEnd = buildUtcDateFromTime(input.date, settings.workDayEnd);

    const lateMinutes = Math.max(
      0,
      Math.floor((input.checkIn.getTime() - scheduledStart.getTime()) / 60000) -
        settings.lateGraceMinutes,
    );

    const earlyLeaveMinutes = Math.max(
      0,
      Math.floor((scheduledEnd.getTime() - input.checkOut.getTime()) / 60000) -
        settings.earlyLeaveGrace,
    );

    totalHours -= (lateMinutes + earlyLeaveMinutes) / 60;
    overtimeThresholdHours = toOvertimeThresholdHours(
      settings.overtimeThreshold,
    );
  }

  totalHours = roundHours(Math.max(0, totalHours));
  const overtimeHours = roundHours(
    Math.max(0, totalHours - overtimeThresholdHours),
  );

  return {
    totalHours,
    overtimeHours,
  };
};

const assertSubmittedHasTimes = (
  status: TimesheetStatus,
  checkIn: Date | null,
  checkOut: Date | null,
  t: Translator,
) => {
  if (status === "SUBMITTED" && (!checkIn || !checkOut)) {
    throw new BadRequestError(t("timesheet.submitted_requires_check_in_out"));
  }
};

export const timesheetService = {
  async createTimesheets(input: CreateTimesheetsInput, t: Translator) {
    const status = input.status ?? "SUBMITTED";

    const uniqueUserIds = [
      ...new Set(input.entries.map((entry) => entry.userId)),
    ];
    const users = await timesheetRepository.findUsersByIds(
      input.tenantId,
      uniqueUserIds,
    );

    const userMap = new Map(users.map((user) => [user.id, user]));

    for (const entry of input.entries) {
      const dateOnly = toUtcDateOnly(entry.date);
      assertNotFutureDate(dateOnly, t);

      const user = userMap.get(entry.userId);

      if (!user || !user.isActive) {
        throw new NotFoundError(t("timesheet.employee_not_found"));
      }

      if (user.role !== "EMPLOYEE") {
        throw new BadRequestError(t("timesheet.only_employee_allowed"));
      }

      assertSubmittedHasTimes(
        status,
        entry.checkIn ?? null,
        entry.checkOut ?? null,
        t,
      );
    }

    const settings = await timesheetRepository.getAttendanceSettings(
      input.tenantId,
    );

    return prisma.$transaction(async (tx) => {
      const created = [];

      for (const entry of input.entries) {
        const normalizedDate = toUtcDateOnly(entry.date);
        const existing =
          await timesheetRepository.findTimesheetByTenantUserDate(
            input.tenantId,
            entry.userId,
            normalizedDate,
            tx,
          );

        if (existing) {
          throw new ConflictError(t("timesheet.duplicate_for_day"));
        }

        const computed = calculateHours(
          {
            date: normalizedDate,
            checkIn: entry.checkIn ?? null,
            checkOut: entry.checkOut ?? null,
          },
          settings,
          t,
        );

        const record = await timesheetRepository.createTimesheet(
          input.tenantId,
          input.submittedBy,
          status,
          {
            ...entry,
            date: normalizedDate,
            checkIn: entry.checkIn ?? null,
            checkOut: entry.checkOut ?? null,
            notes: entry.notes?.trim() || null,
          },
          computed,
          tx,
        );

        created.push(record);
      }

      return created;
    });
  },

  async listTimesheets(
    tenantId: string,
    filter: ListTimesheetsFilter,
    t: Translator,
  ) {
    if (
      filter.startDate &&
      filter.endDate &&
      filter.endDate < filter.startDate
    ) {
      throw new BadRequestError(t("validation.timesheet.dateRange.invalid"));
    }

    const [timesheets, total] = await timesheetRepository.getTimesheets(
      tenantId,
      {
        ...filter,
        startDate: filter.startDate
          ? toUtcDateOnly(filter.startDate)
          : undefined,
        endDate: filter.endDate ? toUtcDateOnly(filter.endDate) : undefined,
      },
    );

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 10;

    return {
      timesheets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getMyTimesheets(
    tenantId: string,
    userId: string,
    page: number,
    limit: number,
  ) {
    const [timesheets, total] = await timesheetRepository.getMyTimesheets(
      tenantId,
      userId,
      page,
      limit,
    );

    return {
      timesheets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async updateTimesheet(
    tenantId: string,
    id: string,
    input: UpdateTimesheetInput,
    t: Translator,
  ) {
    const current = await timesheetRepository.getTimesheetById(tenantId, id);

    if (!current) {
      throw new NotFoundError(t("timesheet.not_found"));
    }

    if (
      !(["DRAFT", "REJECTED"] as TimesheetStatus[]).includes(current.status)
    ) {
      throw new ConflictError(t("timesheet.edit_locked"));
    }

    const nextDate = input.date ? toUtcDateOnly(input.date) : current.date;
    const nextStatus = input.status ?? current.status;
    const nextCheckIn =
      input.checkIn !== undefined ? input.checkIn : (current.checkIn ?? null);
    const nextCheckOut =
      input.checkOut !== undefined
        ? input.checkOut
        : (current.checkOut ?? null);

    assertNotFutureDate(nextDate, t);
    assertSubmittedHasTimes(nextStatus, nextCheckIn, nextCheckOut, t);

    const existing = await timesheetRepository.findTimesheetByTenantUserDate(
      tenantId,
      current.userId,
      nextDate,
    );

    if (existing && existing.id !== current.id) {
      throw new ConflictError(t("timesheet.duplicate_for_day"));
    }

    const settings = await timesheetRepository.getAttendanceSettings(tenantId);
    const computed = calculateHours(
      {
        date: nextDate,
        checkIn: nextCheckIn,
        checkOut: nextCheckOut,
      },
      settings,
      t,
    );

    const updated = await timesheetRepository.updateTimesheet(
      id,
      {
        ...input,
        date: nextDate,
        checkIn: nextCheckIn,
        checkOut: nextCheckOut,
        notes:
          input.notes !== undefined ? input.notes?.trim() || null : undefined,
        status: nextStatus,
      },
      computed,
    );

    if (!updated) {
      throw new ConflictError(t("timesheet.edit_locked"));
    }

    return updated;
  },

  async updateTimesheetStatus(
    tenantId: string,
    id: string,
    input: UpdateTimesheetStatusInput,
    t: Translator,
  ) {
    const timesheet = await timesheetRepository.getTimesheetById(tenantId, id);

    if (!timesheet) {
      throw new NotFoundError(t("timesheet.not_found"));
    }

    if (timesheet.status !== "SUBMITTED") {
      throw new ConflictError(t("timesheet.status_requires_submitted"));
    }

    await timesheetRepository.updateTimesheetStatus(
      id,
      "SUBMITTED",
      input.status,
    );

    return timesheetRepository.getTimesheetById(tenantId, id);
  },

  async getOvertimeReport(
    tenantId: string,
    filter: OvertimeReportFilter,
    t: Translator,
  ) {
    if (filter.endDate < filter.startDate) {
      throw new BadRequestError(t("validation.timesheet.dateRange.invalid"));
    }

    const startDate = toUtcDateOnly(filter.startDate);
    const endDate = toUtcDateOnly(filter.endDate);

    const attendanceSettings =
      await timesheetRepository.getAttendanceSettings(tenantId);
    const overtimeThresholdHours = attendanceSettings
      ? toOvertimeThresholdHours(attendanceSettings.overtimeThreshold)
      : DEFAULT_OVERTIME_THRESHOLD_HOURS;

    const [rawTimesheets, total] = await timesheetRepository.getOvertimeReport(
      tenantId,
      {
        ...filter,
        startDate,
        endDate,
      },
      overtimeThresholdHours,
    );

    const timesheets = rawTimesheets.map((timesheet) => ({
      ...timesheet,
      overtimeHours:
        typeof timesheet.totalHours === "number"
          ? roundHours(
              Math.max(0, timesheet.totalHours - overtimeThresholdHours),
            )
          : null,
    }));

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 10;

    return {
      timesheets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
