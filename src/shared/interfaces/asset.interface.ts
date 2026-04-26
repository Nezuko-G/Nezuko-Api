import { AssetStatus, AssetCondition } from "@prisma/client";

export interface CreateAssetInput {
  tenantId: string;
  name: string;
  category: string;
  serialNumber?: string | null;
  brand?: string | null;
  model?: string | null;
  purchaseDate?: Date | null;
  purchaseCost?: number | null;
  status?: AssetStatus;
  condition?: AssetCondition;
  notes?: string | null;
}

export interface UpdateAssetInput {
  name?: string;
  category?: string;
  serialNumber?: string | null;
  brand?: string | null;
  model?: string | null;
  purchaseDate?: Date | null;
  purchaseCost?: number | null;
  status?: AssetStatus;
  condition?: AssetCondition;
  notes?: string | null;
}

export interface AssignAssetInput {
  tenantId: string;
  assetId: string;
  userId: string;
  assignedBy: string;
  conditionOut: AssetCondition;
  notes?: string | null;
}

export interface ReturnAssetInput {
  tenantId: string;
  assetId: string;
  conditionIn: AssetCondition;
  notes?: string | null;
}

export interface TransferAssetInput {
  tenantId: string;
  assetId: string;
  toUserId: string;
  assignedBy: string;
  conditionOut: AssetCondition;
  notes?: string | null;
}