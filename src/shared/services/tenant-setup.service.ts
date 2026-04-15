import prisma from "@/shared/config/prisma.js";

type CreateTenantInput = {
  name: string;
  slug: string;
  companyEmail: string;
  emailDomain: string;
  logoUrl?: string | null;
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

export const tenantSetupService = {
  async createTenantWithDefaultSettings(data: CreateTenantInput) {
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data });

      await tx.companySettings.create({
        data: {
          tenantId: tenant.id,
        },
      });

      await tx.attendanceSettings.create({
        data: {
          tenantId: tenant.id,
        },
      });

      return tenant;
    });
  },
};
