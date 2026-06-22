export type InsurancePlanType = "BASIC" | "STANDARD" | "PREMIUM";

export type DependentRelation = "SPOUSE" | "CHILD" | "PARENT";

export interface CreateInsurancePlanInput {
  tenantId: string;
  name: string;
  type: InsurancePlanType;
  coverageDetails?: string | null;
  salaryPercentage: number;
  maxDependents?: number;
}

export interface UpdateInsurancePlanInput {
  name?: string;
  type?: InsurancePlanType;
  coverageDetails?: string | null;
  salaryPercentage?: number;
  maxDependents?: number;
}

export interface CreateInsuranceEnrollmentInput {
  tenantId: string;
  userId: string;
  planId: string;
  startDate: Date;
  endDate?: Date | null;
}

export interface CreateInsuranceDependentInput {
  name: string;
  relation: DependentRelation;
  dateOfBirth: Date;
  nationalId?: string | null;
}

export interface InsurancePlanFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: InsurancePlanType; // enum: BASIC | STANDARD | PREMIUM
  status?: 'active' | 'inactive';
}
