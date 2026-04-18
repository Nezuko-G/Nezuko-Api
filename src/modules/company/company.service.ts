import { BadRequestError, NotFoundError } from "@/shared/errors/errors.js";
import { companyRepository } from "./company.repository.js";
import { generateSlug } from "@/shared/utils/helpers.js";
import cloudinary from "@/shared/config/cloudinary.js";
import type {
  AttendanceSettingsUpdatePersistenceInput,
  UpdateAttendanceSettingsInput,
  UpdateCompanyInfoInput,
  UpdateCompanySettingsInput,
} from "@/shared/interfaces/company.interface.js";

type Translator = (key: string) => string;

type NullableCompanyInfoField = Exclude<
  keyof UpdateCompanyInfoInput,
  "name" | "slug"
>;

const nullableCompanyInfoFields: NullableCompanyInfoField[] = [
  "industry",
  "country",
  "city",
  "address",
  "phone",
  "website",
  "taxNumber",
  "commercialReg",
  "currency",
  "timezone",
];

function normalizeNullableStrings(
  payload: UpdateCompanyInfoInput,
): UpdateCompanyInfoInput {
  const normalized: UpdateCompanyInfoInput = { ...payload };

  for (const key of nullableCompanyInfoFields) {
    const value = normalized[key];
    if (typeof value === "string" && value.trim() === "") {
      normalized[key] = null;
    }
  }

  return normalized;
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function isWorkdayRangeValid(start: string, end: string): boolean {
  return toMinutes(start) < toMinutes(end);
}

const dayNamesByIndex = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function mapWorkingDaysToNames(workingDays: number[]): string[] {
  return workingDays.map((dayIndex) => dayNamesByIndex[dayIndex] ?? "Unknown");
}

function mapAttendanceSettingsDaysToNames<T extends { workingDays: number[] }>(
  attendanceSettings: T,
) {
  return {
    ...attendanceSettings,
    workingDays: mapWorkingDaysToNames(attendanceSettings.workingDays),
  };
}

function getCloudinaryPublicId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const marker = "/upload/";
    const uploadIndex = parsedUrl.pathname.indexOf(marker);

    if (uploadIndex === -1) {
      return null;
    }

    const afterUpload = parsedUrl.pathname.slice(uploadIndex + marker.length);
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");

    return withoutVersion.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
}

async function destroyCloudinaryAsset(
  url: string | null | undefined,
): Promise<void> {
  if (!url) {
    return;
  }

  const publicId = getCloudinaryPublicId(url);

  if (!publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId);
}

export const companyService = {
  async getCompanyInfo(tenantId: string) {
    const tenant = await companyRepository.findTenantById(tenantId);

    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    return tenant;
  },

  async updateCompanyInfo(tenantId: string, payload: UpdateCompanyInfoInput) {
    const tenant = await companyRepository.findTenantById(tenantId);

    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    const normalizedPayload = normalizeNullableStrings(payload);

    // Generate slug if name is being updated
    if (normalizedPayload.name) {
      normalizedPayload.slug = generateSlug(normalizedPayload.name);
    }

    return companyRepository.updateTenantInfo(tenantId, normalizedPayload);
  },

  async uploadCompanyLogo(
    tenantId: string,
    file: Express.Multer.File,
    t: Translator,
  ) {
    if (!file) {
      throw new BadRequestError(t("company.logo_required"));
    }

    const tenant = await companyRepository.findTenantById(tenantId);

    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: "tenants/company-logos",
      resource_type: "image",
    });

    if (tenant.logoUrl) {
      await destroyCloudinaryAsset(tenant.logoUrl);
    }

    return companyRepository.updateTenantLogo(
      tenantId,
      uploadResult.secure_url,
    );
  },

  async deleteCompanyLogo(tenantId: string) {
    const tenant = await companyRepository.findTenantById(tenantId);

    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    if (tenant.logoUrl) {
      await destroyCloudinaryAsset(tenant.logoUrl);
    }

    return companyRepository.updateTenantLogo(tenantId, null);
  },

  async getCompanySettings(tenantId: string) {
    const tenant = await companyRepository.findTenantById(tenantId);

    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    return companyRepository.upsertCompanySettingsDefaults(tenantId);
  },

  async updateCompanySettings(
    tenantId: string,
    payload: UpdateCompanySettingsInput,
  ) {
    const tenant = await companyRepository.findTenantById(tenantId);

    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    await companyRepository.upsertCompanySettingsDefaults(tenantId);

    return companyRepository.updateCompanySettings(tenantId, payload);
  },

  async getAttendanceSettings(tenantId: string) {
    const tenant = await companyRepository.findTenantById(tenantId);

    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    const attendanceSettings =
      await companyRepository.upsertAttendanceSettingsDefaults(tenantId);

    return mapAttendanceSettingsDaysToNames(attendanceSettings);
  },

  async updateAttendanceSettings(
    tenantId: string,
    payload: UpdateAttendanceSettingsInput,
    t: Translator,
  ) {
    const tenant = await companyRepository.findTenantById(tenantId);

    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    const current =
      await companyRepository.upsertAttendanceSettingsDefaults(tenantId);
    const merged = { ...current, ...payload };

    if (!isWorkdayRangeValid(merged.workDayStart, merged.workDayEnd)) {
      throw new BadRequestError(t("company.attendance.workday_range_invalid"));
    }

    if (merged.roundingEnabled && !merged.roundingMinutes) {
      throw new BadRequestError(
        t("company.attendance.rounding_minutes_required"),
      );
    }

    if (
      merged.geofenceEnabled &&
      (merged.geofenceLat == null ||
        merged.geofenceLng == null ||
        merged.geofenceRadiusM == null)
    ) {
      throw new BadRequestError(t("company.attendance.geofence_required"));
    }

    const updatePayload: AttendanceSettingsUpdatePersistenceInput = {
      ...payload,
    };

    if (payload.roundingEnabled === false) {
      updatePayload.roundingMinutes = null;
    }

    if (payload.geofenceEnabled === false) {
      updatePayload.geofenceLat = null;
      updatePayload.geofenceLng = null;
      updatePayload.geofenceRadiusM = null;
    }

    const updatedAttendanceSettings =
      await companyRepository.updateAttendanceSettings(tenantId, updatePayload);

    return mapAttendanceSettingsDaysToNames(updatedAttendanceSettings);
  },
};
