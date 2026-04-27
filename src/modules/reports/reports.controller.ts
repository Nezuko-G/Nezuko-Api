import { BadRequestError } from "@/shared/errors/errors.js";
import type { ReportFilters } from "@/shared/interfaces/report.interface.js";
import type { NextFunction, Request, Response } from "express";
import { reportsService } from "./reports.service.js";

const getSingleValue = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === "string"
  ) {
    return value[0];
  }

  return undefined;
};

const parseDate = (
  value: string | undefined,
  messageKey: string,
  t: (key: string) => string,
): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestError(t(messageKey));
  }

  return parsed;
};

const parsePositiveInt = (
  value: string | undefined,
  fallback: number,
  messageKey: string,
  t: (key: string) => string,
): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new BadRequestError(t(messageKey));
  }

  return Math.floor(parsed);
};

const parseFilters = (req: Request): ReportFilters => {
  const startDate = parseDate(
    getSingleValue(req.query.startDate),
    "validation.reports.startDate.invalid",
    req._t,
  );
  const endDate = parseDate(
    getSingleValue(req.query.endDate),
    "validation.reports.endDate.invalid",
    req._t,
  );

  if (startDate && endDate && startDate > endDate) {
    throw new BadRequestError(req._t("validation.reports.dateRange.invalid"));
  }

  return {
    startDate,
    endDate,
    departmentId: getSingleValue(req.query.departmentId),
    userId: getSingleValue(req.query.userId),
  };
};

export const reportsController = {
  async listTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const data = reportsService.listTypes(req.user!.role);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  },

  async getReport(req: Request, res: Response, next: NextFunction) {
    try {
      const type = getSingleValue(req.params.type);
      if (!type) {
        throw new BadRequestError(req._t("validation.reports.type.invalid"));
      }
      const filters = parseFilters(req);

      const data = await reportsService.generateReport(
        req.user!.tenantId,
        type,
        filters,
        req.user!.role,
        req._t,
      );

      res.status(200).json({
        data: {
          type,
          filters,
          rows: data,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async previewReport(req: Request, res: Response, next: NextFunction) {
    try {
      const type = getSingleValue(req.params.type);
      if (!type) {
        throw new BadRequestError(req._t("validation.reports.type.invalid"));
      }
      const filters = parseFilters(req);
      const page = parsePositiveInt(
        getSingleValue(req.query.page),
        1,
        "validation.reports.page.invalid",
        req._t,
      );
      const limit = parsePositiveInt(
        getSingleValue(req.query.limit),
        10,
        "validation.reports.limit.invalid",
        req._t,
      );

      const data = await reportsService.previewReport(
        req.user!.tenantId,
        type,
        filters,
        { page, limit },
        req.user!.role,
        req._t,
      );

      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  },

  async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const type = getSingleValue(req.params.type);
      if (!type) {
        throw new BadRequestError(req._t("validation.reports.type.invalid"));
      }
      const filters = parseFilters(req);

      const file = await reportsService.exportReport(
        req.user!.tenantId,
        type,
        filters,
        "csv",
        req.user!.id,
        req.user!.role,
        req._t,
      );

      res.setHeader("Content-Type", file.contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=\"${file.fileName}\"`,
      );
      res.setHeader("X-Cloudinary-Url", file.cloudinaryUrl);
      res.status(200).send(file.buffer);
    } catch (error) {
      next(error);
    }
  },

  async exportPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const type = getSingleValue(req.params.type);
      if (!type) {
        throw new BadRequestError(req._t("validation.reports.type.invalid"));
      }
      const filters = parseFilters(req);

      const file = await reportsService.exportReport(
        req.user!.tenantId,
        type,
        filters,
        "pdf",
        req.user!.id,
        req.user!.role,
        req._t,
      );

      res.setHeader("Content-Type", file.contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=\"${file.fileName}\"`,
      );
      res.setHeader("X-Cloudinary-Url", file.cloudinaryUrl);
      res.status(200).send(file.buffer);
    } catch (error) {
      next(error);
    }
  },

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportsService.getHistory(req.user!.tenantId);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  },
};
