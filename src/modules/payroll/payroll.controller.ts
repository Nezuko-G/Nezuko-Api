import type { NextFunction, Request, Response } from "express";
import { payrollService } from "./payroll.service.js";

export const payrollController = {

  async listRuns(req: Request, res: Response, next: NextFunction) {
    try {
      const filter = {
        status: req.query.status as any,
        year: req.query.year ? Number(req.query.year) : undefined,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      };

      const result = await payrollService.listRuns(
        req.user!.tenantId,
        filter,
        req._t
      );

      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async getRunById(req: Request, res: Response, next: NextFunction) {
    try {
      const run = await payrollService.getRunById(
        req.user!.tenantId,
        req.params.id as string,
        req._t
      );

      res.status(200).json({ data: run });
    } catch (error) {
      next(error);
    }
  },

  async createRun(req: Request, res: Response, next: NextFunction) {
    try {
      const run = await payrollService.createRun(
        req.user!.tenantId,
        { ...req.body, createdBy: req.user!.id },
        req._t
      );

      res.status(201).json({
        message: req._t("payroll.run_created_successfully"),
        data: run,
      });
    } catch (error) {
      next(error);
    }
  },

  async approveRun(req: Request, res: Response, next: NextFunction) {
    try {
      const run = await payrollService.approveRun(
        req.user!.tenantId,
        req.params.id as string,
        req.user!.id,
        req._t
      );

      res.status(200).json({
        message: req._t("payroll.run_approved_successfully"),
        data: run,
      });
    } catch (error) {
      next(error);
    }
  },

  async markPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const run = await payrollService.markPaid(
        req.user!.tenantId,
        req.params.id as string,
        req._t
      );

      res.status(200).json({
        message: req._t("payroll.run_marked_paid_successfully"),
        data: run,
      });
    } catch (error) {
      next(error);
    }
  },

  async getPayslip(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = await payrollService.getPayslip(
        req.user!.tenantId,
        req.params.id as string,
        req.params.userId as string,
        req.user!.id,
        req.user!.role,
        req._t
      );

      res.status(200).json({ data: entry });
    } catch (error) {
      next(error);
    }
  },


  async listIncentives(req: Request, res: Response, next: NextFunction) {
    try {
      const filter = {
        userId: req.query.userId as string | undefined,
        type: req.query.type as any,
        month: req.query.month ? Number(req.query.month) : undefined,
        year: req.query.year ? Number(req.query.year) : undefined,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      };

      const result = await payrollService.listIncentives(
        req.user!.tenantId,
        filter,
        req._t
      );

      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async createIncentive(req: Request, res: Response, next: NextFunction) {
    try {
      const incentive = await payrollService.createIncentive(
        req.user!.tenantId,
        { ...req.body, createdBy: req.user!.id },
        req._t
      );

      res.status(201).json({
        message: req._t("payroll.incentive_created_successfully"),
        data: incentive,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteIncentive(req: Request, res: Response, next: NextFunction) {
    try {
      await payrollService.deleteIncentive(
        req.user!.tenantId,
        req.params.id as string,
        req._t
      );

      res.status(200).json({
        message: req._t("payroll.incentive_deleted_successfully"),
      });
    } catch (error) {
      next(error);
    }
  },


  async getSummaryReport(req: Request, res: Response, next: NextFunction) {
    try {
      const month = Number(req.query.month);
      const year = Number(req.query.year);

      const report = await payrollService.getSummaryReport(
        req.user!.tenantId,
        month,
        year,
        req._t
      );

      res.status(200).json({ data: report });
    } catch (error) {
      next(error);
    }
  },
};