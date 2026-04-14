import type { NextFunction, Request, Response } from "express";
import { companyService } from "./company.service.js";

export const companyController = {
  async getCompanyInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await companyService.getCompanyInfo(req.user!.tenantId);

      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateCompanyInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await companyService.updateCompanyInfo(
        req.user!.tenantId,
        req.body,
      );

      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async uploadCompanyLogo(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await companyService.uploadCompanyLogo(
        req.user!.tenantId,
        req.file as Express.Multer.File,
      );

      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteCompanyLogo(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await companyService.deleteCompanyLogo(req.user!.tenantId);

      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async getCompanySettings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await companyService.getCompanySettings(req.user!.tenantId);

      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateCompanySettings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await companyService.updateCompanySettings(
        req.user!.tenantId,
        req.body,
      );

      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAttendanceSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await companyService.getAttendanceSettings(
        req.user!.tenantId,
      );

      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateAttendanceSettings(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = await companyService.updateAttendanceSettings(
        req.user!.tenantId,
        req.body,
      );

      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
