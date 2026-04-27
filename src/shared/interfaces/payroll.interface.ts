import type { PayrollStatus, IncentiveType } from "@prisma/client";

export interface CreatePayrollRunInput {
    month: number;
    year: number;
    createdBy: string;
}

export interface ListPayrollRunsFilter {
    status?: PayrollStatus;
    year?: number;
    page?: number;
    limit?: number;
}

export interface CreateIncentiveInput {
    userId: string;
    type: IncentiveType;
    amount: number;
    description?: string;
    effectiveDate: string; // ISO date string
    createdBy: string;
}

export interface ListIncentivesFilter {
    userId?: string;
    type?: IncentiveType;
    month?: number;
    year?: number;
    page?: number;
    limit?: number;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}