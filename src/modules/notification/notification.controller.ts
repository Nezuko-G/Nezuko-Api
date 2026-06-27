import type { NextFunction, Request, Response } from "express";
import { notificationService } from "./notification.service.js";

function getUserContext(req: Request) {
  if (req.superAdmin) {
    return { superAdminId: req.superAdmin.id };
  }
  return {
    tenantId: req.user!.tenantId,
    userId: req.user!.id,
  };
}

export const notificationController = {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userContext = getUserContext(req);
      const query = req.query;
      const result = await notificationService.getNotifications(userContext, query);
      res.status(200).json({
        status: "success",
        data: {
          notifications: result.notifications,
        },
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userContext = getUserContext(req);
      const result = await notificationService.getUnreadCount(userContext);
      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async markAsSeen(req: Request, res: Response, next: NextFunction) {
    try {
      const userContext = getUserContext(req);
      const id = req.params.id as string;
      const result = await notificationService.markAsSeen(id, userContext, req._t);
      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async markAllAsSeen(req: Request, res: Response, next: NextFunction) {
    try {
      const userContext = getUserContext(req);
      const result = await notificationService.markAllAsSeen(userContext);
      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

};
