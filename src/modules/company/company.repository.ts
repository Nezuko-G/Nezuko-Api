import prisma from "@/shared/config/prisma.js";
import { randomUUID } from "node:crypto";

type CompanyInfoUpdateInput = {
  name?: string;
  slug?: string;
  industry?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  taxNumber?: string | null;
  commercialReg?: string | null;
  currency?: string | null;
  timezone?: string | null;
};

type CompanySettingsUpdateInput = {
  language?: "ar" | "en";
  dateFormat?: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  fiscalYearStart?: number;
};

type AttendanceSettingsUpdateInput = {
  workDayStart?: string;
  workDayEnd?: string;
  workingDays?: number[];
  lateGraceMinutes?: number;
  earlyLeaveGrace?: number;
  overtimeThreshold?: number;
  roundingEnabled?: boolean;
  roundingMinutes?: number | null;
  requireBiometric?: boolean;
  geofenceEnabled?: boolean;
  geofenceLat?: number | null;
  geofenceLng?: number | null;
  geofenceRadiusM?: number | null;
};

export const companyRepository = {
  findTenantById(tenantId: string) {
    return prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        companyEmail: true,
        emailDomain: true,
        logoUrl: true,
        industry: true,
        country: true,
        city: true,
        address: true,
        phone: true,
        website: true,
        taxNumber: true,
        commercialReg: true,
        currency: true,
        timezone: true,
      },
    });
  },

  updateTenantInfo(tenantId: string, data: CompanyInfoUpdateInput) {
    return prisma.tenant.update({
      where: { id: tenantId },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        companyEmail: true,
        emailDomain: true,
        logoUrl: true,
        industry: true,
        country: true,
        city: true,
        address: true,
        phone: true,
        website: true,
        taxNumber: true,
        commercialReg: true,
        currency: true,
        timezone: true,
      },
    });
  },

  updateTenantLogo(tenantId: string, logoUrl: string | null) {
    return prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl },
      select: {
        id: true,
        logoUrl: true,
      },
    });
  },

  upsertCompanySettingsDefaults(tenantId: string) {
    return prisma.companySettings.upsert({
      where: { tenantId },
      create: {
        id: randomUUID(),
        tenantId,
        language: "ar",
        dateFormat: "DD/MM/YYYY",
        fiscalYearStart: 1,
      },
      update: {},
      select: {
        id: true,
        tenantId: true,
        language: true,
        dateFormat: true,
        fiscalYearStart: true,
      },
    });
  },

  updateCompanySettings(tenantId: string, data: CompanySettingsUpdateInput) {
    return prisma.companySettings.update({
      where: { tenantId },
      data,
      select: {
        id: true,
        tenantId: true,
        language: true,
        dateFormat: true,
        fiscalYearStart: true,
      },
    });
  },

  upsertAttendanceSettingsDefaults(tenantId: string) {
    return prisma.attendanceSettings.upsert({
      where: { tenantId },
      create: {
        id: randomUUID(),
        tenantId,
        workDayStart: "09:00",
        workDayEnd: "17:00",
        workingDays: [0, 1, 2, 3, 4],
        lateGraceMinutes: 0,
        earlyLeaveGrace: 0,
        overtimeThreshold: 0,
        roundingEnabled: false,
        requireBiometric: false,
        geofenceEnabled: false,
      },
      update: {},
      select: {
        id: true,
        tenantId: true,
        workDayStart: true,
        workDayEnd: true,
        workingDays: true,
        lateGraceMinutes: true,
        earlyLeaveGrace: true,
        overtimeThreshold: true,
        roundingEnabled: true,
        roundingMinutes: true,
        requireBiometric: true,
        geofenceEnabled: true,
        geofenceLat: true,
        geofenceLng: true,
        geofenceRadiusM: true,
      },
    });
  },

  updateAttendanceSettings(
    tenantId: string,
    data: AttendanceSettingsUpdateInput,
  ) {
    return prisma.attendanceSettings.update({
      where: { tenantId },
      data,
      select: {
        id: true,
        tenantId: true,
        workDayStart: true,
        workDayEnd: true,
        workingDays: true,
        lateGraceMinutes: true,
        earlyLeaveGrace: true,
        overtimeThreshold: true,
        roundingEnabled: true,
        roundingMinutes: true,
        requireBiometric: true,
        geofenceEnabled: true,
        geofenceLat: true,
        geofenceLng: true,
        geofenceRadiusM: true,
      },
    });
  },
};
