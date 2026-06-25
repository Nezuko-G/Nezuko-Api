import prisma from "@/shared/config/prisma.js";

export const superAdminRepository = {
    findByEmail(email: string) {
        return prisma.superAdmin.findUnique({ where: { email } });
    },
};