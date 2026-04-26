import type { NextFunction, Request, Response } from "express";
import { BadRequestError } from "@/shared/errors/errors.js";
import { timesheetService } from "./timesheet.service.js";

const toParamString = (value: string | string[] | undefined) => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return "";
};

const toDate = (
  value: string | Date | undefined,
  invalidKey: string,
  t: any,
) => {
  if (!value) {
    return undefined;
  }

  const parsed = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestError(t(invalidKey));
  }

  return parsed;
};

const toDateOnly = (
  value: string | Date | undefined,
  invalidKey: string,
  t: any,
) => {
  const parsed = toDate(value, invalidKey, t);

  if (!parsed) {
    return undefined;
  }

  return new Date(
    Date.UTC(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
};

const toOptionalDateTime = (
  value: string | Date | null | undefined,
  invalidKey: string,
  t: any,
) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return toDate(value, invalidKey, t) ?? null;
};

const toDateOrThrow = (
  value: string | string[] | undefined,
  requiredKey: string,
  invalidKey: string,
  t: any,
) => {
  const selected =
    typeof value === "string"
      ? value
      : Array.isArray(value)
        ? value[0]
        : undefined;

  if (!selected) {
    throw new BadRequestError(t(requiredKey));
  }

  const parsed = new Date(selected);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestError(t(invalidKey));
  }

  return parsed;
};

const toInt = (value: string | string[] | undefined, defaultValue: number) => {
  const selected =
    typeof value === "string"
      ? value
      : Array.isArray(value)
        ? value[0]
        : undefined;
  const parsed = Number(selected);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return defaultValue;
  }

  return Math.floor(parsed);
};

export const timesheetController = {
  async createTimesheets(req: Request, res: Response, next: NextFunction) {
    try {
      const entries = req.body.entries.map((entry: any) => ({
        userId: entry.userId,
        date: toDateOnly(
          entry.date,
          "validation.timesheet.date.invalid",
          req._t,
        )!,
        checkIn: toOptionalDateTime(
          entry.checkIn,
          "validation.timesheet.checkIn.invalid",
          req._t,
        ),
        checkOut: toOptionalDateTime(
          entry.checkOut,
          "validation.timesheet.checkOut.invalid",
          req._t,
        ),
        notes: entry.notes,
      }));

      const data = await timesheetService.createTimesheets(
        {
          tenantId: req.user!.tenantId,
          submittedBy: req.user!.id,
          status: req.body.status,
          entries,
        },
        req._t,
      );

      res.status(201).json({
        message: req._t("timesheet.created_successfully"),
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async listTimesheets(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await timesheetService.listTimesheets(
        req.user!.tenantId,
        {
          userId: toParamString(req.query.userId as any) || undefined,
          status: toParamString(req.query.status as any) as any,
          startDate: toDate(
            toParamString(req.query.startDate as any),
            "validation.timesheet.date.invalid",
            req._t,
          ),
          endDate: toDate(
            toParamString(req.query.endDate as any),
            "validation.timesheet.date.invalid",
            req._t,
          ),
          departmentId:
            toParamString(req.query.departmentId as any) || undefined,
          page: toInt(req.query.page as any, 1),
          limit: toInt(req.query.limit as any, 10),
        },
        req._t,
      );

      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  },

  async getMyTimesheets(req: Request, res: Response, next: NextFunction) {
    try {
      const page = toInt(req.query.page as any, 1);
      const limit = toInt(req.query.limit as any, 10);

      const data = await timesheetService.getMyTimesheets(
        req.user!.tenantId,
        req.user!.id,
        page,
        limit,
      );

      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  },

  async updateTimesheet(req: Request, res: Response, next: NextFunction) {
    try {
      const id = toParamString(req.params.id);
      const data = await timesheetService.updateTimesheet(
        req.user!.tenantId,
        id,
        {
          ...(req.body.date !== undefined && {
            date: toDateOnly(
              req.body.date,
              "validation.timesheet.date.invalid",
              req._t,
            ),
          }),
          ...(req.body.checkIn !== undefined && {
            checkIn: toOptionalDateTime(
              req.body.checkIn,
              "validation.timesheet.checkIn.invalid",
              req._t,
            ),
          }),
          ...(req.body.checkOut !== undefined && {
            checkOut: toOptionalDateTime(
              req.body.checkOut,
              "validation.timesheet.checkOut.invalid",
              req._t,
            ),
          }),
          ...(req.body.notes !== undefined && { notes: req.body.notes }),
          ...(req.body.status !== undefined && { status: req.body.status }),
        },
        req._t,
      );

      res.status(200).json({
        message: req._t("timesheet.updated_successfully"),
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateTimesheetStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = toParamString(req.params.id);
      const data = await timesheetService.updateTimesheetStatus(
        req.user!.tenantId,
        id,
        {
          status: req.body.status,
        },
        req._t,
      );

      res.status(200).json({
        message: req._t("timesheet.status_updated_successfully"),
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async getOvertimeReport(req: Request, res: Response, next: NextFunction) {
    try {
      const startDate = toDateOrThrow(
        req.query.startDate as any,
        "validation.timesheet.dateRange.start_required",
        "validation.timesheet.date.invalid",
        req._t,
      );
      const endDate = toDateOrThrow(
        req.query.endDate as any,
        "validation.timesheet.dateRange.end_required",
        "validation.timesheet.date.invalid",
        req._t,
      );

      const data = await timesheetService.getOvertimeReport(
        req.user!.tenantId,
        {
          startDate,
          endDate,
          departmentId:
            toParamString(req.query.departmentId as any) || undefined,
          page: toInt(req.query.page as any, 1),
          limit: toInt(req.query.limit as any, 10),
        },
        req._t,
      );

      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  },
};
