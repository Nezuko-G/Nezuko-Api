import cloudinary from "@/shared/config/cloudinary.js";
import { BadRequestError, ForbiddenError } from "@/shared/errors/errors.js";
import {
  type GeneratedReportExport,
  type ReportExportFormat,
  type ReportFilters,
  type ReportHistoryItem,
  type ReportType,
  type ReportTypeDefinition,
} from "@/shared/interfaces/report.interface.js";
import { UserRole } from "@prisma/client";
import PDFDocument from "pdfkit";
import { reportsRepository } from "./reports.repository.js";

type Translator = (key: string) => string;

type FlatRow = Record<string, string | number | boolean | null>;

type TableColumn = {
  key: string;
  label: string;
  width: number;
};

const reportTypes: ReportTypeDefinition[] = [
  {
    key: "headcount",
    description: "Total active employees per department",
    allowedRoles: [UserRole.TENANT_OWNER, UserRole.HR_ADMIN, UserRole.MANAGER],
    supportedFilters: ["departmentId", "userId"],
  },
  {
    key: "leave-summary",
    description:
      "Approved / rejected / pending leaves per employee in a date range",
    allowedRoles: [UserRole.TENANT_OWNER, UserRole.HR_ADMIN, UserRole.MANAGER],
    supportedFilters: ["startDate", "endDate", "departmentId", "userId"],
  },
  {
    key: "overtime",
    description:
      "Employees with overtime hours in a date range (from timesheets)",
    allowedRoles: [UserRole.TENANT_OWNER, UserRole.HR_ADMIN],
    supportedFilters: ["startDate", "endDate", "departmentId", "userId"],
  },
  {
    key: "asset-custody",
    description: "Assets currently assigned, by employee or category",
    allowedRoles: [UserRole.TENANT_OWNER, UserRole.HR_ADMIN, UserRole.MANAGER],
    supportedFilters: ["departmentId", "userId"],
  },
  {
    key: "task-completion",
    description: "Task status breakdown per project or assignee",
    allowedRoles: [UserRole.TENANT_OWNER, UserRole.HR_ADMIN, UserRole.MANAGER],
    supportedFilters: ["startDate", "endDate", "departmentId", "userId"],
  },
];

const reportTypeSet = new Set(reportTypes.map((item) => item.key));

const normalizeDate = (date: Date) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );

const escapeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  const plain = String(value);
  if (plain.includes(",") || plain.includes("\n") || plain.includes('"')) {
    return `"${plain.replace(/"/g, '""')}"`;
  }

  return plain;
};

const toFileSafeText = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const toHumanLabel = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

const formatDisplayValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (value instanceof Date) {
    return value.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const formatFilterValue = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }

  return formatDisplayValue(value);
};

const collectColumns = (rows: FlatRow[]): TableColumn[] => {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

  if (keys.length === 0) {
    return [];
  }

  const maxColumns = 6;
  const selectedKeys = keys.slice(0, maxColumns);
  const remaining = Math.max(0, keys.length - selectedKeys.length);

  const totalUnits =
    selectedKeys.reduce((sum, key) => {
      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey.endsWith("id") ||
        normalizedKey.includes("code") ||
        normalizedKey.includes("serial") ||
        normalizedKey.includes("name") ||
        normalizedKey.includes("title") ||
        normalizedKey.includes("description") ||
        normalizedKey.includes("email") ||
        normalizedKey.includes("reason")
      ) {
        return sum + 2;
      }

      return sum + 1;
    }, 0) + (remaining > 0 ? 1 : 0);

  const availableWidth = 760;

  return selectedKeys.map((key) => {
    const normalizedKey = key.toLowerCase();
    const units =
      normalizedKey.endsWith("id") ||
      normalizedKey.includes("code") ||
      normalizedKey.includes("serial") ||
      normalizedKey.includes("name") ||
      normalizedKey.includes("title") ||
      normalizedKey.includes("description") ||
      normalizedKey.includes("email") ||
      normalizedKey.includes("reason")
        ? 2
        : 1;
    return {
      key,
      label: toHumanLabel(key),
      width: Math.floor((availableWidth * units) / totalUnits),
    };
  });
};

const getRowHeight = (
  doc: PDFKit.PDFDocument,
  row: FlatRow,
  columns: TableColumn[],
  fontSize = 9,
) => {
  const verticalPadding = 16;
  doc.font("Helvetica").fontSize(fontSize);

  const singleLineHeight = doc.heightOfString("Ag", { width: 100 });
  return Math.max(30, Math.ceil(singleLineHeight + verticalPadding));
};

const getFittedFontSize = (
  doc: PDFKit.PDFDocument,
  text: string,
  maxWidth: number,
  preferredSize = 9,
  minSize = 6,
) => {
  let size = preferredSize;

  while (size > minSize) {
    doc.font("Helvetica").fontSize(size);
    if (doc.widthOfString(text) <= maxWidth) {
      return size;
    }
    size -= 0.5;
  }

  return minSize;
};

const drawKeyValueLine = (
  doc: PDFKit.PDFDocument,
  label: string,
  value: unknown,
  labelWidth = 110,
) => {
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#334155")
    .text(`${label}:`, {
      continued: true,
      width: labelWidth,
    });
  doc
    .font("Helvetica")
    .fillColor("#0f172a")
    .text(` ${formatDisplayValue(value)}`);
};

const drawTableHeader = (
  doc: PDFKit.PDFDocument,
  columns: TableColumn[],
  startX: number,
  y: number,
  rowHeight: number,
) => {
  doc.save();
  doc
    .roundedRect(
      startX,
      y,
      columns.reduce((sum, column) => sum + column.width, 0),
      rowHeight,
      6,
    )
    .fill("#0f172a");

  let currentX = startX;
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);

  columns.forEach((column) => {
    doc.text(column.label, currentX + 10, y + 8, {
      width: column.width - 20,
      align: "left",
    });
    currentX += column.width;
  });

  doc.restore();
};

const drawTableRow = (
  doc: PDFKit.PDFDocument,
  row: FlatRow,
  columns: TableColumn[],
  startX: number,
  y: number,
  rowHeight: number,
  isEven: boolean,
) => {
  const totalWidth = columns.reduce((sum, column) => sum + column.width, 0);

  doc.save();
  doc
    .roundedRect(startX, y, totalWidth, rowHeight, 6)
    .fill(isEven ? "#f8fafc" : "#ffffff");
  doc.restore();

  let currentX = startX;
  columns.forEach((column) => {
    const value = formatDisplayValue(row[column.key]);
    const contentWidth = column.width - 20;
    const fittedFontSize = getFittedFontSize(doc, value, contentWidth, 9, 6);

    doc
      .fillColor("#0f172a")
      .font("Helvetica")
      .fontSize(fittedFontSize)
      .text(value, currentX + 10, y + 8, {
        width: contentWidth,
        height: rowHeight - 12,
        lineBreak: false,
      });
    currentX += column.width;
  });
};

const drawTablePageBreak = (
  doc: PDFKit.PDFDocument,
  title: string,
  summaryEntries: Array<[string, unknown]>,
  startX: number,
  columns: TableColumn[],
): number => {
  doc.addPage();
  drawPdfHeader(doc, title, summaryEntries);
  const headerY = doc.y + 8;
  drawTableHeader(doc, columns, startX, headerY, 28);
  return headerY + 38;
};

const drawPdfHeader = (
  doc: PDFKit.PDFDocument,
  title: string,
  summaryEntries: Array<[string, unknown]>,
) => {
  doc.save();
  doc.rect(0, 0, doc.page.width, 120).fill("#0f172a");
  doc.restore();

  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(22)
    .text(title, 32, 30);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#cbd5e1")
    .text(`Generated at ${new Date().toLocaleString()}`, 32, 60);
  doc.fillColor("#e2e8f0").fontSize(10).text("Read-only report export", 32, 76);

  doc
    .roundedRect(32, 132, doc.page.width - 64, 72, 10)
    .fillAndStroke("#f8fafc", "#cbd5e1");
  doc
    .fillColor("#0f172a")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Filters", 46, 145);

  if (summaryEntries.length === 0) {
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#475569")
      .text("No filters applied", 46, 164);
    doc.moveDown(2);
    return;
  }

  const availableWidth = doc.page.width - 92;
  const columnsPerRow = Math.min(summaryEntries.length, 3);
  const columnWidth = Math.floor(availableWidth / columnsPerRow);

  summaryEntries.forEach(([label, value], index) => {
    const columnIndex = index % columnsPerRow;
    const rowIndex = Math.floor(index / columnsPerRow);
    const x = 46 + columnIndex * columnWidth;
    const y = 164 + rowIndex * 20;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#334155")
      .text(`${label}:`, x, y, {
        continued: true,
        width: 90,
      });
    doc
      .font("Helvetica")
      .fillColor("#0f172a")
      .text(` ${formatFilterValue(value)}`, {
        width: columnWidth - 100,
        lineBreak: true,
      });
  });

  doc.y = 220;
};

const normalizeFilters = (filters: ReportFilters): ReportFilters => {
  const normalized: ReportFilters = { ...filters };

  if (normalized.startDate) {
    normalized.startDate = normalizeDate(normalized.startDate);
  }

  if (normalized.endDate) {
    normalized.endDate = normalizeDate(normalized.endDate);
  }

  return normalized;
};

const flattenRows = (rows: unknown[]): FlatRow[] => {
  return rows.map((row) => {
    const data = row as Record<string, unknown>;
    const flat: FlatRow = {};

    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        flat[key] = value.toISOString();
        continue;
      }

      if (typeof value === "object" && value !== null) {
        flat[key] = JSON.stringify(value);
        continue;
      }

      flat[key] = (value as string | number | boolean | null) ?? null;
    }

    return flat;
  });
};

const buildCsvBuffer = (rows: unknown[]): Buffer => {
  const flatRows = flattenRows(rows);

  if (flatRows.length === 0) {
    return Buffer.from("message\nNo data\n", "utf-8");
  }

  const columns = Array.from(
    new Set(flatRows.flatMap((row) => Object.keys(row))),
  );

  const lines = [
    columns.map((column) => escapeCsvValue(column)).join(","),
    ...flatRows.map((row) =>
      columns.map((column) => escapeCsvValue(row[column])).join(","),
    ),
  ];

  return Buffer.from(`${lines.join("\n")}\n`, "utf-8");
};

const buildPdfBuffer = (
  title: string,
  rows: unknown[],
  summaryEntries: Array<[string, unknown]> = [],
): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 32,
    });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const flatRows = flattenRows(rows);
    const columns = collectColumns(flatRows);

    drawPdfHeader(
      doc,
      title,
      summaryEntries.length > 0 ? summaryEntries : [["Rows", flatRows.length]],
    );

    if (flatRows.length === 0) {
      doc
        .fillColor("#475569")
        .font("Helvetica")
        .fontSize(12)
        .text("No data available for the selected filters.", 32, 250);
      doc.end();
      return;
    }

    if (columns.length === 0) {
      doc
        .fillColor("#475569")
        .font("Helvetica")
        .fontSize(12)
        .text("No data available for the selected filters.", 32, 250);
      doc.end();
      return;
    }

    const startX = 32;
    let currentY = 250;
    const headerHeight = 30;

    drawTableHeader(doc, columns, startX, currentY, headerHeight);
    currentY += headerHeight + 8;

    flatRows.forEach((row, index) => {
      const rowHeight = getRowHeight(doc, row, columns);

      if (currentY + rowHeight > doc.page.height - 40) {
        currentY = drawTablePageBreak(
          doc,
          title,
          summaryEntries,
          startX,
          columns,
        );
      }

      drawTableRow(
        doc,
        row,
        columns,
        startX,
        currentY,
        rowHeight,
        index % 2 === 0,
      );
      currentY += rowHeight + 6;
    });

    doc.end();
  });
};

const uploadReportFile = async (params: {
  buffer: Buffer;
  fileName: string;
  tenantId: string;
  reportType: ReportType;
  generatedBy: string;
  filters: ReportFilters;
}) => {
  const { buffer, fileName, tenantId, reportType, generatedBy, filters } =
    params;

  const extension = fileName.split(".").pop()?.toLowerCase() ?? "dat";
  const publicIdBase = fileName.slice(0, -(extension.length + 1)) || fileName;
  const resourceType = extension === "pdf" ? "image" : "raw";

  const uploadResult = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `reports/${tenantId}`,
          public_id: toFileSafeText(publicIdBase),
          resource_type: resourceType,
          format: extension,
          overwrite: true,
          context: {
            reportType,
            generatedBy,
            filters: Buffer.from(
              JSON.stringify({
                startDate: filters.startDate?.toISOString() ?? null,
                endDate: filters.endDate?.toISOString() ?? null,
                departmentId: filters.departmentId ?? null,
                userId: filters.userId ?? null,
              }),
            ).toString("base64"),
          },
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload failed"));
            return;
          }

          resolve(result);
        },
      );

      uploadStream.end(buffer);
    },
  );

  return uploadResult.secure_url;
};

const parseHistoryFilters = (value: unknown): Record<string, unknown> => {
  if (typeof value !== "string" || value.trim() === "") {
    return {};
  }

  try {
    return JSON.parse(
      Buffer.from(value, "base64").toString("utf-8"),
    ) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const deriveTypeFromFileName = (resource: {
  public_id: string;
}): string => {
  const fileName = resource.public_id.split("/").pop() ?? "";
  const knownTypes: string[] = [
    "headcount",
    "leave-summary",
    "overtime",
    "asset-custody",
    "task-completion",
  ];
  for (const t of knownTypes) {
    if (fileName.startsWith(t)) return t;
  }
  return "unknown";
};

const getReportTypeDefinition = (type: string): ReportTypeDefinition => {
  if (!reportTypeSet.has(type as ReportType)) {
    throw new BadRequestError("validation.reports.type.invalid");
  }

  return reportTypes.find((item) => item.key === type)!;
};

const enforceRole = (type: ReportType, role: UserRole, t: Translator): void => {
  const definition = reportTypes.find((item) => item.key === type);

  if (!definition) {
    throw new BadRequestError(t("validation.reports.type.invalid"));
  }

  if (!definition.allowedRoles.includes(role)) {
    throw new ForbiddenError(t("reports.forbidden_for_type"));
  }
};

export const reportsService = {
  listTypes(role: UserRole) {
    return reportTypes
      .filter((item) => item.allowedRoles.includes(role))
      .map((item) => ({
        key: item.key,
        description: item.description,
        supportedFilters: item.supportedFilters,
      }));
  },

  async generateReport(
    tenantId: string,
    type: string,
    filters: ReportFilters,
    role: UserRole,
    t: Translator,
  ) {
    const definition = getReportTypeDefinition(type);
    enforceRole(definition.key, role, t);

    const normalizedFilters = normalizeFilters(filters);

    switch (definition.key) {
      case "headcount":
        return reportsRepository.getHeadcountReport(
          tenantId,
          normalizedFilters,
        );
      case "leave-summary":
        return reportsRepository.getLeaveSummaryReport(
          tenantId,
          normalizedFilters,
        );
      case "overtime":
        return reportsRepository.getOvertimeReport(tenantId, normalizedFilters);
      case "asset-custody":
        return reportsRepository.getAssetCustodyReport(
          tenantId,
          normalizedFilters,
        );
      case "task-completion":
        return reportsRepository.getTaskCompletionReport(
          tenantId,
          normalizedFilters,
        );
    }
  },

  async previewReport(
    tenantId: string,
    type: string,
    filters: ReportFilters,
    pagination: { page: number; limit: number },
    role: UserRole,
    t: Translator,
  ) {
    const rows = await this.generateReport(tenantId, type, filters, role, t);
    const page = pagination.page;
    const limit = pagination.limit;
    const start = (page - 1) * limit;
    const end = start + limit;
    const total = rows.length;

    return {
      type,
      data: rows.slice(start, end),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async exportReport(
    tenantId: string,
    type: string,
    filters: ReportFilters,
    format: ReportExportFormat,
    generatedBy: string,
    role: UserRole,
    t: Translator,
  ): Promise<GeneratedReportExport> {
    const rows = await this.generateReport(tenantId, type, filters, role, t);
    const now = new Date();
    const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}-${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}`;
    const fileName = `${type}-${stamp}.${format}`;
    const reportTitle = `${toHumanLabel(type)} Report`;

    const buffer =
      format === "csv"
        ? buildCsvBuffer(rows)
        : await buildPdfBuffer(reportTitle, rows, [
            ["Start date", filters.startDate ?? null],
            ["End date", filters.endDate ?? null],
            ["Department", filters.departmentId ?? null],
            ["Employee", filters.userId ?? null],
            ["Rows", rows.length],
          ]);

    const cloudinaryUrl = await uploadReportFile({
      buffer,
      fileName,
      tenantId,
      reportType: type as ReportType,
      generatedBy,
      filters,
    });

    return {
      fileName,
      buffer,
      cloudinaryUrl,
      contentType:
        format === "csv" ? "text/csv; charset=utf-8" : "application/pdf",
    };
  },

  async getHistory(tenantId: string): Promise<ReportHistoryItem[]> {
    const result = await cloudinary.search
      .expression(`folder=reports/${tenantId}`)
      .sort_by("created_at", "desc")
      .max_results(100)
      .execute();

    const resources = Array.isArray(result.resources) ? result.resources : [];

    return resources.map((resource: any) => {
      const customContext = resource.context?.custom ?? {};

      return {
        type: customContext.reportType ?? deriveTypeFromFileName(resource),
        generatedBy:
          typeof customContext.generatedBy === "string"
            ? customContext.generatedBy
            : null,
        generatedAt: resource.created_at,
        format: resource.format ?? "unknown",
        fileName: resource.public_id.endsWith(`.${resource.format}`)
          ? resource.public_id
          : `${resource.public_id}.${resource.format}`,
        downloadUrl: resource.secure_url,
        filters: parseHistoryFilters(customContext.filters),
      };
    });
  },
};
