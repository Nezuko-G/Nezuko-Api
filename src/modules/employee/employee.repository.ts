import prisma from "@/shared/config/prisma.js";
import { EmployeeStatus, type Gender } from "@prisma/client";
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from "@/shared/interfaces/employee.interface";

export const employeeRepository = {
  async findUserByEmail(tenantId: string, email: string) {
    return prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
      select: { id: true },
    });
  },

  async createEmployee(
    data: CreateEmployeeInput & { passwordHash: string; employeeCode: string },
  ) {
    return prisma.user.create({
      data: {
        tenantId: data.tenantId,
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        salary: data.salary ?? null,
        jobTitle: data.jobTitle ?? null,
        hireDate: data.hireDate ?? null,
        employeeCode: data.employeeCode,
        gender: data.gender ?? null,
        dateOfBirth: data.dateOfBirth ?? null,
        phone: data.phone ?? null,
      },
    });
  },
  async getEmployees(tenantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [employees, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: { tenantId },
        skip,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          salary: true,
          role: true,
          jobTitle: true,
          employeeCode: true,
          status: true,
          gender: true,
          phone: true,
          hireDate: true,
          departmentId: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where: { tenantId } }),
    ]);

    return { employees, total };
  },

  async getEmployeeById(tenantId: string, id: string) {
    return prisma.user.findFirst({
      where: { id, tenantId },
      omit: { passwordHash: true, isActive: true },
    });
  },

  async updateEmployee(
    tenantId: string,
    id: string,
    data: Partial<UpdateEmployeeInput>,
  ) {
    return prisma.user.update({
      where: { id, tenantId },
      data,
      omit: { passwordHash: true, isActive: true },
    });
  },

  async softDeleteEmployee(tenantId: string, id: string) {
    return prisma.user.update({
      where: { id, tenantId },
      data: { status: EmployeeStatus.TERMINATED },
      omit: { passwordHash: true, isActive: true },
    });
  },
  async getEmployeeDocuments(tenantId: string, userId: string) {
    return prisma.employeeDocument.findMany({
      where: { userId, tenantId },
    });
  },

  async uploadEmployeeDocument(data: {
    userId: string;
    tenantId: string;
    fileUrl: string;
    fileName: string;
    expiryDate?: Date | null;
  }) {
    return prisma.employeeDocument.create({ data });
  },

  async deleteEmployeeDocument(
    tenantId: string,
    userId: string,
    docId: string,
  ) {
    return prisma.employeeDocument.delete({
      where: { id: docId, userId, tenantId },
    });
  },
};
