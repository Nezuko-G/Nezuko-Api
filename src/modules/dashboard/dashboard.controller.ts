import type { Request, Response, NextFunction } from "express";
import { dashboardService } from "./dashboard.service.js";
import { UnauthorizedError } from "@/shared/errors/errors.js";

export const dashboardController = {

  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {

      if (!req.user) throw new UnauthorizedError("Authentication required");

      const { tenantId } = req.user;

      const dashboardData = await dashboardService.getDashboardData(
        tenantId,
        req._t,
      );

      res.status(200).json({
        status: "success",
        data: dashboardData,
      });
    } catch (error) {
      next(error);
    }
  },
};