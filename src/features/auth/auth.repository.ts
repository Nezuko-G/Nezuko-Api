import prisma from "@/shared/database/prisma";

export const authRepository = {
  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  },

  async findActiveUserByEmail(email: string) {
    return await prisma.user.findFirst({
      where: {
        email,
        isDeleted: false,
        isActive: true,
      },
    });
  },

  async findDeletedUserByEmail(email: string) {
    return await prisma.user.findFirst({
      where: {
        email,
        isDeleted: true,
      },
    });
  },

  async createUser(data: any) {
    return await prisma.user.create({
      data: {
        ...data,
        isDeleted: false,
        isActive: true,
      },
    });
  },

  async reactivateUserById(id: number) {
    return await prisma.user.update({
      where: { id },
      data: { isDeleted: false, isActive: true },
    });
  },

  async updateUserById(id: number, data: Partial<any>) {
    return await prisma.user.update({
      where: { id },
      data,
    });
  },
};
