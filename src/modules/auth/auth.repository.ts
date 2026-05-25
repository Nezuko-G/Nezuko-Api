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

    findUserById: (id: string) => {
        return prisma.user.findUnique({
            where: { id, isActive: true },
            select: {
                id: true,
                tenantId: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                firstName: true,
                lastName: true,
                phone: true,
                dateOfBirth: true,
                gender: true,
                hireDate: true,
                jobTitle: true,
                employeeCode: true,
                status: true,
                departmentId: true,
                salary: true,
                country: true,
                city: true,
                address: true,
                emergencyName: true,
                emergencyPhone: true,
                emergencyRelation: true,
            },
        });
    },
};