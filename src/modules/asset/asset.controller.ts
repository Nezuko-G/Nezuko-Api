import type { Request, Response, NextFunction } from "express";
import { assetService } from "./asset.service";
import { AssetStatus } from "@prisma/client";

export const assetController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const t = (req as any).t;
      const data = await assetService.createAsset({ ...req.body, tenantId: req.user!.tenantId }, t);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.max(Number(req.query.limit) || 10, 1);
      const status = req.query.status as AssetStatus | undefined;

      const result = await assetService.getAssets(req.user!.tenantId, page, limit, status);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const t = (req as any).t;
      
      const data = await assetService.getAssetById(req.user!.tenantId, id, t);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const t = (req as any).t;

      const data = await assetService.updateAsset(req.user!.tenantId, id, req.body, t);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const t = (req as any).t;

      const data = await assetService.assignAsset({
        ...req.body,
        assetId: id,
        tenantId: req.user!.tenantId,
        assignedBy: req.user!.id,
      }, t);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async returnAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const t = (req as any).t;

      const data = await assetService.returnAsset({
        ...req.body,
        assetId: id,
        tenantId: req.user!.tenantId,
      }, t);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async transfer(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const t = (req as any).t;

      const data = await assetService.transferAsset({
        ...req.body,
        assetId: id,
        tenantId: req.user!.tenantId,
        assignedBy: req.user!.id,
      }, t);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async retire(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const t = (req as any).t;

      const data = await assetService.retireAsset(req.user!.tenantId, id, t);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getDepreciationReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await assetService.getDepreciationReport(req.user!.tenantId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const t = (req as any).t;

      const data = await assetService.getAssetHistory(req.user!.tenantId, id, t);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getMyAssets(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await assetService.getEmployeeAssets(req.user!.tenantId, req.user!.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getEmployeeAssets(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const data = await assetService.getEmployeeAssets(req.user!.tenantId, userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
};