import { Prisma } from "@prisma/client";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/shared/errors/errors.js";
import type {
  CreateInsuranceDependentInput,
  CreateInsuranceEnrollmentInput,
  CreateInsurancePlanInput,
  UpdateInsurancePlanInput,
} from "@/shared/interfaces/insurance.interface.js";
import { insuranceRepository } from "./insurance.repository.js";
import prisma from "@/shared/config/prisma.js";

type Translator = (key: string) => string;

function calculateMonthlyCost(salary: number, percentage: number) {
  return Number((salary * percentage).toFixed(2));
}

function assertPositiveSalary(value: number | null | undefined, t: Translator) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new BadRequestError(t("insurance.salary_invalid"));
  }
}

function assertSalaryPercentage(value: number, t: Translator) {
  if (!Number.isFinite(value) || value <= 0 || value > 1) {
    throw new BadRequestError(t("insurance.salary_percentage_invalid"));
  }
}

function assertMaxDependents(value: number | undefined, t: Translator) {
  if (value !== undefined && (!Number.isInteger(value) || value < 1)) {
    throw new BadRequestError(t("insurance.max_dependents_invalid"));
  }
}

async function ensureTenantExists(tenantId: string, t: Translator) {
  const tenant = await insuranceRepository.findTenantById(tenantId);

  if (!tenant) {
    throw new NotFoundError(t("insurance.tenant_not_found"));
  }
}

export const insuranceService = {
  async listInsurancePlans(tenantId: string) {
    const plans = await insuranceRepository.getInsurancePlans(tenantId);

    return { plans };
  },

  async createInsurancePlan(input: CreateInsurancePlanInput, t: Translator) {
    await ensureTenantExists(input.tenantId, t);

    assertSalaryPercentage(input.salaryPercentage, t);
    assertMaxDependents(input.maxDependents, t);

    const existingPlan = await insuranceRepository.findInsurancePlanByName(
      input.tenantId,
      input.name,
    );

    if (existingPlan) {
      throw new ConflictError(t("insurance.plan_name_exists"));
    }

    return insuranceRepository.createInsurancePlan(input);
  },

  async updateInsurancePlan(
    tenantId: string,
    id: string,
    input: UpdateInsurancePlanInput,
    t: Translator,
  ) {
    const plan = await insuranceRepository.findInsurancePlanById(tenantId, id);

    if (!plan) {
      throw new NotFoundError(t("insurance.plan_not_found"));
    }

    if (input.salaryPercentage !== undefined) {
      assertSalaryPercentage(input.salaryPercentage, t);
    }

    assertMaxDependents(input.maxDependents, t);

    if (input.name && input.name !== plan.name) {
      const existingPlan = await insuranceRepository.findInsurancePlanByName(
        tenantId,
        input.name,
      );

      if (existingPlan) {
        throw new ConflictError(t("insurance.plan_name_exists"));
      }
    }

    if (input.maxDependents !== undefined) {
      const dependentGroups =
        await insuranceRepository.getMaxDependentCountForPlan(tenantId, id);

      const currentMaxDependents = dependentGroups.reduce(
        (max, group) => Math.max(max, group._count._all),
        0,
      );

      if (input.maxDependents < currentMaxDependents) {
        throw new BadRequestError(t("insurance.max_dependents_too_low"));
      }
    }

    return insuranceRepository.updateInsurancePlan(tenantId, id, input);
  },

  async deactivateInsurancePlan(tenantId: string, id: string, t: Translator) {
    const plan = await insuranceRepository.findInsurancePlanById(tenantId, id);

    if (!plan) {
      throw new NotFoundError(t("insurance.plan_not_found"));
    }

    return insuranceRepository.deactivateInsurancePlan(tenantId, id);
  },

  async enrollEmployee(
    tenantId: string,
    planId: string,
    input: CreateInsuranceEnrollmentInput,
    t: Translator,
  ) {
    await ensureTenantExists(tenantId, t);

    return prisma.$transaction(async (tx) => {
      const [user, plan, activeEnrollment] = await Promise.all([
        insuranceRepository.findUserById(tenantId, input.userId, tx),
        insuranceRepository.findInsurancePlanById(tenantId, planId, tx),
        insuranceRepository.findActiveEnrollmentByUserId(
          tenantId,
          input.userId,
          tx,
        ),
      ]);

      if (!user) {
        throw new NotFoundError(t("insurance.user_not_found"));
      }

      if (!plan) {
        throw new NotFoundError(t("insurance.plan_not_found"));
      }

      if (!plan.isActive) {
        throw new ConflictError(t("insurance.plan_inactive"));
      }

      if (activeEnrollment) {
        throw new ConflictError(t("insurance.active_enrollment_exists"));
      }

      assertPositiveSalary(user.salary, t);

      if (input.endDate && input.endDate < input.startDate) {
        throw new BadRequestError(t("insurance.end_date_before_start"));
      }

      const monthlyCost = calculateMonthlyCost(
        user.salary as number,
        plan.salaryPercentage,
      );

      return insuranceRepository.createInsuranceEnrollment(
        {
          ...input,
          tenantId,
          planId,
          monthlyCost,
          salaryAtEnrollment: user.salary as number,
        },
        tx,
      );
    });
  },

  async getMyEnrollment(tenantId: string, userId: string, t: Translator) {
    const enrollment = await insuranceRepository.findActiveEnrollmentByUserId(
      tenantId,
      userId,
    );

    if (!enrollment) {
      throw new NotFoundError(t("insurance.no_active_enrollment"));
    }

    return enrollment;
  },

  async previewCost(
    tenantId: string,
    planId: string,
    userId: string,
    t: Translator,
  ) {
    const [user, plan] = await Promise.all([
      insuranceRepository.findUserById(tenantId, userId),
      insuranceRepository.findInsurancePlanById(tenantId, planId),
    ]);

    if (!user) {
      throw new NotFoundError(t("insurance.user_not_found"));
    }

    if (!plan) {
      throw new NotFoundError(t("insurance.plan_not_found"));
    }

    if (!plan.isActive) {
      throw new ConflictError(t("insurance.plan_inactive"));
    }

    assertPositiveSalary(user.salary, t);

    return {
      planId,
      userId,
      salary: user.salary,
      salaryPercentage: plan.salaryPercentage,
      monthlyCost: calculateMonthlyCost(
        user.salary as number,
        plan.salaryPercentage,
      ),
    };
  },

  async addDependent(
    tenantId: string,
    userId: string,
    enrollmentId: string,
    input: CreateInsuranceDependentInput,
    t: Translator,
  ) {
    return prisma.$transaction(async (tx) => {
      const enrollment = await insuranceRepository.findEnrollmentById(
        tenantId,
        enrollmentId,
        tx,
      );

      if (!enrollment || enrollment.userId !== userId) {
        throw new NotFoundError(t("insurance.enrollment_not_found"));
      }

      if (!enrollment.isActive) {
        throw new ConflictError(t("insurance.enrollment_inactive"));
      }

      const dependentCount =
        await insuranceRepository.countDependentsForEnrollment(
          enrollmentId,
          tx,
        );

      if (dependentCount >= enrollment.plan.maxDependents) {
        throw new ConflictError(t("insurance.dependent_limit_reached"));
      }

      if (input.nationalId) {
        const existingDependent =
          await insuranceRepository.getDependentByNationalId(
            enrollmentId,
            input.nationalId,
            tx,
          );

        if (existingDependent) {
          throw new ConflictError(t("insurance.duplicate_national_id"));
        }
      }

      return insuranceRepository.createDependent(enrollmentId, input, tx);
    });
  },

  async removeDependent(
    tenantId: string,
    userId: string,
    enrollmentId: string,
    depId: string,
    t: Translator,
  ) {
    return prisma.$transaction(async (tx) => {
      const enrollment = await insuranceRepository.findEnrollmentById(
        tenantId,
        enrollmentId,
        tx,
      );

      if (!enrollment || enrollment.userId !== userId) {
        throw new NotFoundError(t("insurance.enrollment_not_found"));
      }

      const dependent = await insuranceRepository.findDependentById(
        tenantId,
        enrollmentId,
        depId,
        tx,
      );

      if (!dependent) {
        throw new NotFoundError(t("insurance.dependent_not_found"));
      }

      return insuranceRepository.deleteDependent(depId, tx);
    });
  },

  async getCoverageReport(tenantId: string) {
    const [report, plans] = await Promise.all([
      insuranceRepository.getCoverageReport(tenantId),
      insuranceRepository.getInsurancePlans(tenantId),
    ]);

    const planById = new Map(plans.map((plan) => [plan.id, plan]));

    return report.map((item) => {
      const plan = planById.get(item.planId);

      return {
        planId: item.planId,
        planName: plan?.name ?? null,
        type: plan?.type ?? null,
        isActive: plan?.isActive ?? null,
        activeEnrollments: item._count._all,
        totalMonthlyCost: item._sum.monthlyCost ?? 0,
      };
    });
  },
};
