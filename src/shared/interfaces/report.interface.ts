import type { UserRole } from "@prisma/client";

export type ReportType =
  | "headcount"
  | "leave-summary"
  | "overtime"
  | "asset-custody"
  | "task-completion";

export type ReportExportFormat = "csv" | "pdf";

export type ReportFilters = {
  startDate?: Date;
  endDate?: Date;
  departmentId?: string;
  userId?: string;
};

export type ReportPreviewFilters = ReportFilters & {
  page: number;
  limit: number;
};

export type ReportTypeDefinition = {
  key: ReportType;
  description: string;
  allowedRoles: UserRole[];
  supportedFilters: Array<"startDate" | "endDate" | "departmentId" | "userId">;
};

export type ReportHistoryItem = {
  type: string;
  generatedBy: string | null;
  generatedAt: string;
  format: string;
  fileName: string;
  downloadUrl: string;
  filters: Record<string, unknown>;
};

export type GeneratedReportExport = {
  fileName: string;
  contentType: string;
  buffer: Buffer;
  cloudinaryUrl: string;
};
