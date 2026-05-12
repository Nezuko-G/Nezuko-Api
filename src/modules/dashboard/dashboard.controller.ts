import type { Request, Response, NextFunction } from "express";
import { dashboardService } from "./dashboard.service.js";

export const dashboardController = {
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error("UNAUTHORIZED");

      const tenantId = req.user.tenantId;
      const t = req._t;

      const dashboardData = await dashboardService.getDashboardData(
        tenantId,
        t,
      );

      res.status(200).json({
        status: "success",
        data: dashboardData,
      });
    } catch (error) {
      next(error);
    }
  },
  async getChart(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error("UNAUTHORIZED");

      const tenantId = req.user.tenantId;
      const t = req._t;

      // Support both query parameters
      const chartIdentifier = (req.query.type || req.query.name) as string;

      if (!chartIdentifier) {
        return res.status(400).json({
          status: "error",
          message:
            t("dashboard.chart_identifier_required") ||
            "Please provide 'type' or 'name' query parameter",
        });
      }

      const chartData = await dashboardService.getChartData(
        tenantId,
        chartIdentifier,
        t,
      );

      res.status(200).json({
        status: "success",
        chart: chartIdentifier,
        data: chartData,
      });
    } catch (error) {
      next(error);
    }
  },
  async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error("UNAUTHORIZED");

      const tenantId = req.user.tenantId;
      const t = req._t;

      const exportResult = await dashboardService.exportDashboardFiles(
        tenantId,
        t,
      );

      res.status(200).json(exportResult);
    } catch (error) {
      next(error);
    }
  },
  async getMetricsSummary(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error("UNAUTHORIZED");

      const tenantId = req.user.tenantId;

      const metrics = await (
        await import("./dashboard.repository.js")
      ).dashboardRepository.getKeyMetricsSummary(tenantId);

      res.status(200).json({
        status: "success",
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  },
  async getInsights(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error("UNAUTHORIZED");

      const tenantId = req.user.tenantId;
      const t = req._t;

      const dashboardData = await dashboardService.getDashboardData(
        tenantId,
        t,
      );

      res.status(200).json({
        status: "success",
        data: dashboardData.insights,
      });
    } catch (error) {
      next(error);
    }
  },
};
