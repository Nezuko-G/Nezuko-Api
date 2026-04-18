import { type Gender } from "@prisma/client";

export interface CreateEmployeeInput {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string | null;
  departmentId?: string | null;
  hireDate?: Date | null;
  gender?: Gender | null;
  dateOfBirth?: Date | null;
  phone?: string | null;
}

export interface UpdateEmployeeInput {
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  jobTitle?: string | null;
  hireDate?: Date | null;
  gender?: Gender | null;
  dateOfBirth?: Date | null;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  emergencyRelation?: string | null;
}