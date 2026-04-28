import type { NextFunction, Request, Response } from "express";
import { attendanceService } from "./attendance.service.js";

const toParamString = (value: string | string[] | undefined) => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return "";
};

export const attendanceController = {
  async markAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { lat, lng } = req.body;

      const result = await attendanceService.markAttendance(
        tenantId,
        userId,
        { lat, lng },
        req._t,
      );

      const statusCode = result.action === "checked_in" ? 201 : 200;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  },

  async listTimesheets(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { userId, from, to, status } = req.query;

      const filter = {
        userId: toParamString(userId as any),
        from: toParamString(from as any),
        to: toParamString(to as any),
        status: toParamString(status as any),
      };

      // Remove empty strings from filter
      Object.keys(filter).forEach((key) => {
        if (!filter[key as keyof typeof filter]) {
          delete filter[key as keyof typeof filter];
        }
      });

      const timesheets = await attendanceService.listTimesheets(
        tenantId,
        filter,
        req._t,
      );

      res.json(timesheets);
    } catch (error) {
      next(error);
    }
  },

  async listMyTimesheets(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { from, to, status } = req.query;

      const filter = {
        from: toParamString(from as any),
        to: toParamString(to as any),
        status: toParamString(status as any),
      };

      // Remove empty strings from filter
      Object.keys(filter).forEach((key) => {
        if (!filter[key as keyof typeof filter]) {
          delete filter[key as keyof typeof filter];
        }
      });

      const timesheets = await attendanceService.listMyTimesheets(
        tenantId,
        userId,
        filter,
        req._t,
      );

      res.json(timesheets);
    } catch (error) {
      next(error);
    }
  },
};
