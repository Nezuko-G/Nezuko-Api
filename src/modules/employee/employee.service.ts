import { employeeRepository } from "./employee.repository.js";
import { generateEmployeeCode } from "@/shared/utils/employeeCode.js";
import { hashPassword } from "@/shared/utils/hash.js";
import { emailService } from "@/shared/services/email.service.js";
import { ConflictError, NotFoundError } from "@/shared/errors/errors.js";
import { randomUUID } from "node:crypto";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "@/shared/interfaces/employee.interface.js";
import type { Request, Response } from "express";
import cloudinary from "@/shared/config/cloudinary.js";
import prisma from "@/shared/config/prisma.js";


export const employeeService = {

  async createEmployee(input: CreateEmployeeInput, t: any, req: Request, res: Response) {

    const existingUser = await employeeRepository.findUserByEmail(input.tenantId, input.email);

    if (existingUser) throw new ConflictError(t("employee.email_already_exists"));

    const employeeCode = await generateEmployeeCode();
    const tempPassword = randomUUID().slice(0, 8);
    const hashedPassword = await hashPassword(tempPassword);



    const { passwordHash, isActive, ...employee } = await employeeRepository.createEmployee({
      ...input,
      passwordHash: hashedPassword,
      employeeCode,
      jobTitle: input.jobTitle ?? null,
      hireDate: input.hireDate ? new Date(input.hireDate) : null,
      gender: input.gender ?? null,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      phone: input.phone ?? null,
    });

    await emailService.sendEmployeeWelcome({
      to: employee.email,
      name: `${employee.firstName} ${employee.lastName}`,
      employeeCode: employee.employeeCode!,
      tempPassword,
    });

    return {
      ...employee,
      tempPassword,
    }
  },
  async getEmployees(tenantId: string, page: number, limit: number) {
    const { employees, total } = await employeeRepository.getEmployees(tenantId, page, limit);

    return {
      employees,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
  async getEmployeeById(tenantId: string, id: string, t: any) {
    const employee = await employeeRepository.getEmployeeById(tenantId, id);

    if (!employee) throw new NotFoundError(t("employee.not_found"));

    return employee;
  },

  async updateEmployee(tenantId: string, id: string, input: Partial<UpdateEmployeeInput>, t: any) {
    const employee = await employeeRepository.getEmployeeById(tenantId, id);

    if (!employee) throw new NotFoundError(t("employee.not_found"));

    return employeeRepository.updateEmployee(tenantId, id, {
      ...input,
      hireDate: input.hireDate ? new Date(input.hireDate) : undefined,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
    });
  },

  async deleteEmployee(tenantId: string, id: string, t: any) {
    const employee = await employeeRepository.getEmployeeById(tenantId, id);

    if (!employee) throw new NotFoundError(t("employee.not_found"));

    return employeeRepository.softDeleteEmployee(tenantId, id);
  },

  async getEmployeeDocuments(tenantId: string, userId: string, t: any) {
    const employee = await employeeRepository.getEmployeeById(tenantId, userId);

    if (!employee) throw new NotFoundError(t("employee.not_found"));

    return employeeRepository.getEmployeeDocuments(tenantId, userId);
  },

  async uploadEmployeeDocument(
    tenantId: string,
    userId: string,
    file: Express.Multer.File,
    fileName: string,
    expiryDate: string | undefined,
    t: any
  ) {
    const employee = await employeeRepository.getEmployeeById(tenantId, userId);

    if (!employee) throw new NotFoundError(t("employee.not_found"));
    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `employees/${userId}/documents`,
          resource_type: "auto",
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result);
        }
      );
      stream.end(file.buffer);
    });

    return employeeRepository.uploadEmployeeDocument({
      userId,
      tenantId,
      fileUrl: uploadResult.secure_url,
      fileName,
      expiryDate: expiryDate && !isNaN(new Date(expiryDate).getTime())
        ? new Date(expiryDate)
        : null,
    });
  },

  async deleteEmployeeDocument(tenantId: string, userId: string, docId: string, t: any) {

    const employee = await employeeRepository.getEmployeeById(tenantId, userId);

    if (!employee) throw new NotFoundError(t("employee.not_found"));

    const doc = await prisma.employeeDocument.findFirst({
      where: { id: docId, userId, tenantId },
    });

    if (!doc) throw new NotFoundError(t("employee.document_not_found"));

    // extract public_id from url and delete from cloudinary
    const publicId = doc.fileUrl.split("/").slice(-3).join("/").replace(/\.[^.]+$/, "");

    await cloudinary.uploader.destroy(publicId);

    return employeeRepository.deleteEmployeeDocument(tenantId, userId, docId);
  },

};