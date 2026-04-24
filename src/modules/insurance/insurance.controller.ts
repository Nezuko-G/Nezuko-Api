import type { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { BadRequestError } from "@/shared/errors/errors.js";
import { insuranceService } from "./insurance.service.js";

const toParamString = (value: string | string[] | undefined) => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return "";
};

export const insuranceController = {
  async listInsurancePlans(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await insuranceService.listInsurancePlans(
        req.user!.tenantId,
      );

      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async createInsurancePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await insuranceService.createInsurancePlan(
        {
          ...req.body,
          tenantId: req.user!.tenantId,
        },
        req._t,
      );

      res.status(201).json({
        message: req._t("insurance.plan_created"),
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateInsurancePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await insuranceService.updateInsurancePlan(
        req.user!.tenantId,
        toParamString(req.params.id),
        req.body,
        req._t,
      );

      res.status(200).json({
        message: req._t("insurance.plan_updated"),
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  },

  async deactivateInsurancePlan(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const plan = await insuranceService.deactivateInsurancePlan(
        req.user!.tenantId,
        toParamString(req.params.id),
        req._t,
      );

      res.status(200).json({
        message: req._t("insurance.plan_deactivated"),
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  },

  async enrollEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const enrollment = await insuranceService.enrollEmployee(
        req.user!.tenantId,
        toParamString(req.params.id),
        {
          ...req.body,
          tenantId: req.user!.tenantId,
          planId: toParamString(req.params.id),
        },
        req._t,
      );

      res.status(201).json({
        message: req._t("insurance.enrolled_successfully"),
        data: enrollment,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMyEnrollment(req: Request, res: Response, next: NextFunction) {
    try {
      const enrollment = await insuranceService.getMyEnrollment(
        req.user!.tenantId,
        req.user!.id,
        req._t,
      );

      res.status(200).json({ data: enrollment });
    } catch (error) {
      next(error);
    }
  },

  async previewCost(req: Request, res: Response, next: NextFunction) {
    try {
      const userId =
        typeof req.query.userId === "string" ? req.query.userId : undefined;

      if (req.user!.role !== UserRole.EMPLOYEE && !userId) {
        throw new BadRequestError(
          req._t("validation.insurance.userId.required"),
        );
      }

      const preview = await insuranceService.previewCost(
        req.user!.tenantId,
        toParamString(req.params.id),
        userId ?? req.user!.id,
        req._t,
      );

      res.status(200).json({ data: preview });
    } catch (error) {
      next(error);
    }
  },

  async addDependent(req: Request, res: Response, next: NextFunction) {
    try {
      const dependent = await insuranceService.addDependent(
        req.user!.tenantId,
        req.user!.id,
        toParamString(req.params.id),
        req.body,
        req._t,
      );

      res.status(201).json({
        message: req._t("insurance.dependent_added"),
        data: dependent,
      });
    } catch (error) {
      next(error);
    }
  },

  async removeDependent(req: Request, res: Response, next: NextFunction) {
    try {
      await insuranceService.removeDependent(
        req.user!.tenantId,
        req.user!.id,
        toParamString(req.params.id),
        toParamString(req.params.depId),
        req._t,
      );

      res.status(200).json({
        message: req._t("insurance.dependent_removed"),
      });
    } catch (error) {
      next(error);
    }
  },

  async getCoverageReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await insuranceService.getCoverageReport(
        req.user!.tenantId,
      );

      res.status(200).json({ data: report });
    } catch (error) {
      next(error);
    }
  },
};
