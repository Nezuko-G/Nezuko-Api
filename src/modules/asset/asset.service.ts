import { assetRepository } from "./asset.repository";
import { ConflictError, NotFoundError } from "@/shared/errors/errors";
import { AssetStatus, AssetCondition } from "@prisma/client";
import type {
  CreateAssetInput,
  UpdateAssetInput,
  AssignAssetInput,
  ReturnAssetInput,
  TransferAssetInput
} from "@/shared/interfaces/asset.interface";
import prisma from "@/shared/config/prisma";
import { notificationService } from "../notification/index.js";

const ConditionRank = {
  NEW: 4,
  GOOD: 3,
  FAIR: 2,
  DAMAGED: 1,
};

export const assetService = {
  async createAsset(input: CreateAssetInput, t: any) {
    if (input.serialNumber) {
      const existing = await prisma.asset.findUnique({
        where: {
          tenantId_serialNumber: {
            tenantId: input.tenantId,
            serialNumber: input.serialNumber,
          },
        },
      });
      if (existing) {
        const msg = typeof t === 'function' ? t("asset.serial_exists") : "Serial number already exists";
        throw new ConflictError(msg);
      }
    }

    if (input.purchaseDate) {
      input.purchaseDate = new Date(input.purchaseDate);
    }

    return assetRepository.createAsset(input);
  },

  async getAssets(tenantId: string, page: number, limit: number, status?: AssetStatus, t?: any) {
    if (status && !Object.values(AssetStatus).includes(status)) {
      const msg = typeof t === 'function' ? t("asset.invalid_status") : "Invalid status provided";
      throw new ConflictError(msg);
    }

    const { assets, total } = await assetRepository.getAssets(tenantId, page, limit, status);
    return {
      data: assets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getAssetById(tenantId: string, id: string, t: any) {
    const asset = await assetRepository.getAssetById(tenantId, id);
    if (!asset) {
      const msg = typeof t === 'function' ? t("asset.not_found") : "Asset not found";
      throw new NotFoundError(msg);
    }
    return asset;
  },

  async updateAsset(tenantId: string, id: string, input: Partial<UpdateAssetInput>, t: any) {
    await this.getAssetById(tenantId, id, t);

    if (input.purchaseDate) {
      input.purchaseDate = new Date(input.purchaseDate);
    }

    return assetRepository.updateAsset(tenantId, id, input);
  },

  async assignAsset(input: AssignAssetInput, t: any) {
    const asset = await this.getAssetById(input.tenantId, input.assetId, t);

    if (asset.status !== AssetStatus.AVAILABLE) {
      const msg = typeof t === 'function' ? t("asset.not_available") : "Asset not available";
      throw new ConflictError(msg);
    }

    try {
      const result = await assetRepository.assignAsset(input);

      notificationService.triggerAssetAssigned(input.tenantId, {
        id: asset.id,
        name: asset.name,
        serialNumber: asset.serialNumber,
      }, input.userId).catch(err => console.error("Notification Error:", err));

      return result;
    } catch (error: any) {
      if (error.message === "RACE_CONDITION") {
        const msg = typeof t === 'function' ? t("asset.not_available") : "Asset not available";
        throw new ConflictError(msg);
      }
      throw error;
    }
  },

  async returnAsset(input: ReturnAssetInput, t: any) {
    const activeCustody = await assetRepository.getActiveCustody(input.tenantId, input.assetId);

    if (!activeCustody) {
      const msg = typeof t === 'function' ? t("asset.no_active_custody") : "No active custody found";
      throw new ConflictError(msg);
    }

    let result;
    try {
      result = await assetRepository.returnAsset(input, activeCustody.id);
    } catch (error: any) {
      if (error.message === "RACE_CONDITION") {
        const msg = typeof t === 'function' ? t("asset.state_changed") : "Asset state changed";
        throw new ConflictError(msg);
      }
      throw error;
    }

    const conditionDegraded = ConditionRank[input.conditionIn] < ConditionRank[activeCustody.conditionOut];

    return {
      ...result,
      warning: conditionDegraded ? (typeof t === 'function' ? t("asset.condition_degraded") : "Condition degraded") : null,
    };
  },

  async transferAsset(input: TransferAssetInput, t: any) {
    const activeCustody = await assetRepository.getActiveCustody(input.tenantId, input.assetId);

    if (!activeCustody) {
      const msg = typeof t === 'function' ? t("asset.no_active_custody") : "No active custody found";
      throw new ConflictError(msg);
    }

    if (activeCustody.userId === input.toUserId) {
      const msg = typeof t === 'function' ? t("asset.already_assigned_to_user") : "Already assigned to this user";
      throw new ConflictError(msg);
    }

    try {
      const result = await assetRepository.transferAsset(input, activeCustody.id);

      const activeCustodyAny = activeCustody as any;
      notificationService.triggerAssetAssigned(input.tenantId, {
        id: activeCustodyAny.asset.id,
        name: activeCustodyAny.asset.name,
        serialNumber: activeCustodyAny.asset.serialNumber,
      }, input.toUserId).catch(err => console.error("Notification Error:", err));

      return result;
    } catch (error: any) {
      if (error.message === "RACE_CONDITION") {
        const msg = typeof t === 'function' ? t("asset.state_changed") : "Asset state changed";
        throw new ConflictError(msg);
      }
      throw error;
    }
  },

  async retireAsset(tenantId: string, id: string, t: any) {
    await this.getAssetById(tenantId, id, t);
    const activeCustody = await assetRepository.getActiveCustody(tenantId, id);

    if (activeCustody) {
      const msg = typeof t === 'function' ? t("asset.active_custody_exists") : "Active custody exists";
      throw new ConflictError(msg);
    }

    return assetRepository.updateAsset(tenantId, id, { status: AssetStatus.RETIRED });
  },

  async getDepreciationReport(tenantId: string) {
    const assets = await prisma.asset.findMany({
      where: { tenantId, purchaseCost: { not: null }, purchaseDate: { not: null } },
    });

    const currentDate = new Date();

    return assets.map((asset) => {
      const elapsedMs = currentDate.getTime() - new Date(asset.purchaseDate!).getTime();
      const elapsedYears = Math.max(0, elapsedMs / (1000 * 60 * 60 * 24 * 365.25));
      const cost = asset.purchaseCost!;

      const depreciationValue = (cost / 5) * elapsedYears;
      const bookValue = Math.max(0, cost - depreciationValue);

      return {
        id: asset.id,
        name: asset.name,
        serialNumber: asset.serialNumber,
        purchaseCost: cost,
        purchaseDate: asset.purchaseDate,
        elapsedYears: Number(elapsedYears.toFixed(2)),
        currentBookValue: Number(bookValue.toFixed(2)),
      };
    });
  },

  async getAssetHistory(tenantId: string, id: string, t: any) {
    await this.getAssetById(tenantId, id, t);
    return assetRepository.getAssetHistory(tenantId, id);
  },

  async getEmployeeAssets(tenantId: string, userId: string) {
    return assetRepository.getEmployeeAssets(tenantId, userId);
  }
};