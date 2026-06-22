import type { NextFunction, Request, Response } from "express";
import { leaveRequestService } from "./leave-request.service.js";
import { LeaveStatus } from "@prisma/client";

export const leaveRequestController = {
  async createLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await leaveRequestService.createLeaveRequest(
        {
          tenantId: req.user!.tenantId,
          userId: req.user!.id,
          startDate: new Date(`${req.body.startDate}`),
          endDate: new Date(`${req.body.endDate}`),
          reason: req.body.reason,
        },
        req._t,
      );

      res.status(201).json({
        message: req._t("leave_request.created_successfully"),
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async getLeaveRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = req.query.search as string | undefined;
      const status = req.query.status as LeaveStatus | undefined;

      const result = await leaveRequestService.getLeaveRequests(
        tenantId, page, limit, search, status,
      );

      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  },
  async getMyLeaveRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = req.query.search as string | undefined;
      const status = req.query.status as LeaveStatus | undefined;

      const result = await leaveRequestService.getMyLeaveRequests(
        tenantId, userId, page, limit, search, status,
      );

      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async reviewLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      const data = await leaveRequestService.reviewLeaveRequest(
        req.user!.tenantId,
        req.user!.id,
        id,
        req.body,
        req._t,
      );

      res.status(200).json({
        message: req._t("leave_request.reviewed_successfully"),
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async cancelLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      await leaveRequestService.cancelLeaveRequest(
        req.user!.tenantId,
        req.user!.id,
        id,
        req._t,
      );

      res.status(200).json({
        message: req._t("leave_request.cancelled_successfully"),
      });
    } catch (error) {
      next(error);
    }
  },
};
