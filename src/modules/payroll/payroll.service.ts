import { payrollRepository } from "./payroll.repository.js";
import { notificationService } from "../notification/index.js";
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from "@/shared/errors/errors.js";
import { PayrollStatus } from "@prisma/client";
import type {
  CreatePayrollRunInput,
  ListPayrollRunsFilter,
  CreateIncentiveInput,
  ListIncentivesFilter,
} from "@/shared/interfaces/payroll.interface.js";

export const payrollService = {

  async listRuns(tenantId: string, filter: ListPayrollRunsFilter, t: any) {
    const { data, total, page, limit, totalPages } =
      await payrollRepository.listRuns(tenantId, filter);

    return {
      payrollRuns: data,
      meta: { total, page, limit, totalPages },
    };
  },

  async getRunById(tenantId: string, id: string, t: any) {
    const run = await payrollRepository.findRunById(tenantId, id);
    if (!run) throw new NotFoundError(t("payroll.run_not_found"));
    return run;
  },

  async createRun(tenantId: string, input: CreatePayrollRunInput, t: any) {
    // Enforce one run per month/year
    const existing = await payrollRepository.findRunByMonthYear(
      tenantId,
      input.month,
      input.year
    );
    if (existing) throw new ConflictError(t("payroll.run_already_exists"));

    const result = await payrollRepository.createRun(tenantId, input);

    notificationService.triggerPayrollCreated(tenantId, input.month, input.year)
      .catch(err => console.error("Notification Error:", err));

    return result;
  },

  async approveRun(tenantId: string, id: string, approverId: string, t: any) {
    const run = await payrollRepository.findRunById(tenantId, id);
    if (!run) throw new NotFoundError(t("payroll.run_not_found"));

    if (run.status !== PayrollStatus.DRAFT) {
      throw new BadRequestError(t("payroll.run_not_draft"));
    }

    const result = await payrollRepository.approveRun(tenantId, id, approverId);

    notificationService.triggerPayrollApproved(tenantId, id, run.month, run.year)
      .catch(err => console.error("Notification Error:", err));

    return result;
  },

  async markPaid(tenantId: string, id: string, t: any) {
    const run = await payrollRepository.findRunById(tenantId, id);
    if (!run) throw new NotFoundError(t("payroll.run_not_found"));

    if (run.status !== PayrollStatus.APPROVED) {
      throw new BadRequestError(t("payroll.run_not_approved"));
    }

    return payrollRepository.markPaid(tenantId, id);
  },

  /**
   * Get a single employee payslip.
   * An employee can only view their own payslip.
   * HR / MANAGER / TENANT_OWNER can view any.
   */
  async getPayslip(
    tenantId: string,
    runId: string,
    userId: string,
    requesterId: string,
    requesterRole: string,
    t: any
  ) {
    const run = await payrollRepository.findRunById(tenantId, runId);
    if (!run) throw new NotFoundError(t("payroll.run_not_found"));

    const isSelf = requesterId === userId;
    const isPrivileged = ["TENANT_OWNER", "HR_ADMIN", "MANAGER"].includes(requesterRole);

    if (!isSelf && !isPrivileged) {
      throw new ForbiddenError(t("payroll.payslip_forbidden"));
    }

    const entry = await payrollRepository.findEntry(tenantId, runId, userId);
    if (!entry) throw new NotFoundError(t("payroll.entry_not_found"));

    return entry;
  },


  async listIncentives(tenantId: string, filter: ListIncentivesFilter, t: any) {
    const { data, total, page, limit, totalPages } =
      await payrollRepository.listIncentives(tenantId, filter);

    return {
      incentives: data,
      meta: { total, page, limit, totalPages },
    };
  },

  async createIncentive(tenantId: string, input: CreateIncentiveInput, t: any) {
    return payrollRepository.createIncentive(tenantId, input);
  },

  async deleteIncentive(tenantId: string, id: string, t: any) {
    const incentive = await payrollRepository.findIncentiveById(tenantId, id);
    if (!incentive) throw new NotFoundError(t("payroll.incentive_not_found"));

    // Cannot delete if linked to a PAID payroll entry
    if (incentive.payrollEntry) {
      const runId = incentive.payrollEntry.payrollRunId;
      const run = await payrollRepository.findRunById(tenantId, runId);
      if (run?.status === PayrollStatus.PAID) {
        throw new BadRequestError(t("payroll.incentive_linked_to_paid"));
      }
    }

    return payrollRepository.deleteIncentive(id);
  },


  async getSummaryReport(
    tenantId: string,
    month: number,
    year: number,
    t: any
  ) {
    const report = await payrollRepository.getSummaryReport(tenantId, month, year);
    if (!report) throw new NotFoundError(t("payroll.run_not_found"));
    return report;
  },
};