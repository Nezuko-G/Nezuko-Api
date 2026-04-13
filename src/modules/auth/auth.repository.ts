import prisma from "@/shared/config/prisma.js";

export const authRepository = {
    findTenantByCompanyEmail: (companyEmail: string) => {
        return prisma.tenant.findUnique({
            where: { companyEmail, isActive: true },
        });
    },

    findTenantByDomain: (emailDomain: string) => {
        return prisma.tenant.findUnique({
            where: { emailDomain, isActive: true },
        });
    },

    findUserByEmailAndTenant: (email: string, tenantId: string) => {
        return prisma.user.findFirst({
            where: {
                tenantId,
                email,
                isActive: true,
            },
        });
    },

};