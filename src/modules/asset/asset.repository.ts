import prisma from "@/shared/config/prisma";
import { AssetCondition, AssetStatus } from "@prisma/client";
import type {
  CreateAssetInput,
  UpdateAssetInput,
  AssignAssetInput,
  ReturnAssetInput,
  TransferAssetInput
} from "@/shared/interfaces/asset.interface";

export const assetRepository = {
  async createAsset(data: CreateAssetInput) {
    return prisma.asset.create({ data });
  },

  async getAssets(tenantId: string, page: number, limit: number, status?: AssetStatus) {
    const skip = (page - 1) * limit;
    const where = { tenantId, ...(status && { status }) };

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.asset.count({ where })
    ]);

    return { assets, total };
  },

  async getAssetById(tenantId: string, id: string) {
    return prisma.asset.findFirst({
      where: { id, tenantId },
      include: {
        custodies: {
          orderBy: { assignedAt: 'desc' }
        }
      }
    });
  },

  async updateAsset(tenantId: string, id: string, data: UpdateAssetInput) {
    await prisma.asset.updateMany({
      where: { id, tenantId },
      data
    });
    return this.getAssetById(tenantId, id);
  },

  async getActiveCustody(tenantId: string, assetId: string) {
    return prisma.assetCustody.findFirst({
      where: { tenantId, assetId, returnedAt: null },
      orderBy: { assignedAt: 'desc' } 
    });
  },

  async assignAsset(data: AssignAssetInput) {
    return prisma.$transaction(async (tx) => {
      const updateResult = await tx.asset.updateMany({
        where: { id: data.assetId, tenantId: data.tenantId, status: AssetStatus.AVAILABLE },
        data: { status: AssetStatus.ASSIGNED, condition: data.conditionOut }
      });

      if (updateResult.count === 0) throw new Error("A race condition occurred while processing this asset. Please try again.");

      return tx.assetCustody.create({
        data: {
          tenantId: data.tenantId,
          assetId: data.assetId,
          userId: data.userId,
          assignedBy: data.assignedBy,
          conditionOut: data.conditionOut,
          notes: data.notes
        }
      });
    });
  },

  async returnAsset(data: ReturnAssetInput, custodyId: string) {
    return prisma.$transaction(async (tx) => {
      const updateResult = await tx.asset.updateMany({
        where: { id: data.assetId, tenantId: data.tenantId, status: AssetStatus.ASSIGNED },
        data: { status: AssetStatus.AVAILABLE, condition: data.conditionIn }
      });

      if (updateResult.count === 0) throw new Error("A race condition occurred while processing this asset. Please try again.");

      return tx.assetCustody.updateMany({
        where: { id: custodyId, tenantId: data.tenantId, returnedAt: null },
        data: { returnedAt: new Date(), conditionIn: data.conditionIn, notes: data.notes }
      });
    });
  },

  async transferAsset(data: TransferAssetInput, currentCustodyId: string) {
    return prisma.$transaction(async (tx) => {
      const updateResult = await tx.asset.updateMany({
        where: { id: data.assetId, tenantId: data.tenantId, status: AssetStatus.ASSIGNED },
        data: { condition: data.conditionOut }
      });

      if (updateResult.count === 0) throw new Error("A race condition occurred while processing this asset. Please try again.");

      await tx.assetCustody.updateMany({
        where: { id: currentCustodyId, tenantId: data.tenantId, returnedAt: null },
        data: { returnedAt: new Date(), conditionIn: data.conditionOut }
      });

      return tx.assetCustody.create({
        data: {
          tenantId: data.tenantId,
          assetId: data.assetId,
          userId: data.toUserId,
          assignedBy: data.assignedBy,
          conditionOut: data.conditionOut,
          notes: data.notes
        }
      });
    });
  },

  async getAssetHistory(tenantId: string, id: string) {
    return prisma.assetCustody.findMany({
      where: { tenantId, assetId: id },
      orderBy: { assignedAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedByUser: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });
  },

  async getEmployeeAssets(tenantId: string, userId: string) {
    const custodies = await prisma.assetCustody.findMany({
      where: { tenantId, userId, returnedAt: null },
      include: { asset: true },
      orderBy: { assignedAt: 'desc' }
    });

    return custodies.map((c) => {
      const { asset, ...custodyDetails } = c;
      return {
        ...asset,
        custodyInfo: custodyDetails
      };
    });
  }
};