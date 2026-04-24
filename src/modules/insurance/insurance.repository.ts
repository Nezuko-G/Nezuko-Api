import prisma from "@/shared/config/prisma.js";
import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  CreateInsuranceDependentInput,
  CreateInsuranceEnrollmentInput,
  CreateInsurancePlanInput,
  UpdateInsurancePlanInput,
} from "@/shared/interfaces/insurance.interface.js";

type DbClient = PrismaClient | Prisma.TransactionClient;

const db = (client?: DbClient) => client ?? prisma;

export const insuranceRepository = {
  findTenantById(tenantId: string, client?: DbClient) {
    return db(client).tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
  },

  getInsurancePlans(tenantId: string, client?: DbClient) {
    return db(client).insurancePlan.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });
  },

  findInsurancePlanById(tenantId: string, id: string, client?: DbClient) {
    return db(client).insurancePlan.findFirst({
      where: { tenantId, id },
    });
  },

  findInsurancePlanByName(tenantId: string, name: string, client?: DbClient) {
    return db(client).insurancePlan.findFirst({
      where: { tenantId, name },
      select: { id: true },
    });
  },

  createInsurancePlan(input: CreateInsurancePlanInput, client?: DbClient) {
    return db(client).insurancePlan.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        type: input.type,
        coverageDetails: input.coverageDetails ?? null,
        salaryPercentage: input.salaryPercentage,
        maxDependents: input.maxDependents ?? 4,
      },
    });
  },

  updateInsurancePlan(
    tenantId: string,
    id: string,
    input: UpdateInsurancePlanInput,
    client?: DbClient,
  ) {
    return db(client).insurancePlan.update({
      where: { id },
      data: {
        tenantId,
        ...input,
      },
    });
  },

  deactivateInsurancePlan(tenantId: string, id: string, client?: DbClient) {
    return db(client).insurancePlan.update({
      where: { id },
      data: {
        tenantId,
        isActive: false,
      },
    });
  },

  findUserById(tenantId: string, userId: string, client?: DbClient) {
    return db(client).user.findFirst({
      where: { tenantId, id: userId },
      select: {
        id: true,
        salary: true,
        isActive: true,
        role: true,
      },
    });
  },

  findActiveEnrollmentByUserId(
    tenantId: string,
    userId: string,
    client?: DbClient,
  ) {
    return db(client).insuranceEnrollment.findFirst({
      where: { tenantId, userId, isActive: true },
      include: {
        plan: true,
        dependents: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  findEnrollmentById(tenantId: string, id: string, client?: DbClient) {
    return db(client).insuranceEnrollment.findFirst({
      where: { tenantId, id },
      include: {
        plan: true,
        dependents: true,
        user: {
          select: {
            id: true,
            salary: true,
            role: true,
          },
        },
      },
    });
  },

  findActiveEnrollmentByUserAndPlan(
    tenantId: string,
    userId: string,
    planId: string,
    client?: DbClient,
  ) {
    return db(client).insuranceEnrollment.findFirst({
      where: { tenantId, userId, planId, isActive: true },
      select: { id: true },
    });
  },

  createInsuranceEnrollment(
    input: CreateInsuranceEnrollmentInput & {
      monthlyCost: number;
      salaryAtEnrollment: number;
    },
    client?: DbClient,
  ) {
    return db(client).insuranceEnrollment.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        planId: input.planId,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        monthlyCost: input.monthlyCost,
        salaryAtEnrollment: input.salaryAtEnrollment,
      },
      include: {
        plan: true,
        dependents: true,
      },
    });
  },

  getDependentByNationalId(
    enrollmentId: string,
    nationalId: string,
    client?: DbClient,
  ) {
    return db(client).insuranceDependent.findFirst({
      where: {
        enrollmentId,
        nationalId,
      },
      select: { id: true },
    });
  },

  countDependentsForEnrollment(enrollmentId: string, client?: DbClient) {
    return db(client).insuranceDependent.count({
      where: { enrollmentId },
    });
  },

  createDependent(
    enrollmentId: string,
    input: CreateInsuranceDependentInput,
    client?: DbClient,
  ) {
    return db(client).insuranceDependent.create({
      data: {
        enrollmentId,
        name: input.name,
        relation: input.relation,
        dateOfBirth: input.dateOfBirth,
        nationalId: input.nationalId ?? null,
      },
    });
  },

  findDependentById(
    tenantId: string,
    enrollmentId: string,
    depId: string,
    client?: DbClient,
  ) {
    return db(client).insuranceDependent.findFirst({
      where: {
        id: depId,
        enrollmentId,
        enrollment: {
          tenantId,
        },
      },
    });
  },

  deleteDependent(depId: string, client?: DbClient) {
    return db(client).insuranceDependent.delete({
      where: { id: depId },
    });
  },

  getMaxDependentCountForPlan(
    tenantId: string,
    planId: string,
    client?: DbClient,
  ) {
    return db(client).insuranceDependent.groupBy({
      by: ["enrollmentId"],
      where: {
        enrollment: {
          tenantId,
          planId,
        },
      },
      _count: {
        _all: true,
      },
    });
  },

  getCoverageReport(tenantId: string, client?: DbClient) {
    return db(client).insuranceEnrollment.groupBy({
      by: ["planId"],
      where: {
        tenantId,
        isActive: true,
      },
      _sum: {
        monthlyCost: true,
      },
      _count: {
        _all: true,
      },
    });
  },
};
