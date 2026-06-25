import { EmployeeCount, Interest } from "@prisma/client";

export type CreateBookingDemoRequestInput = {
  fullName: string;
  email: string;
  companyName: string;
  jobTitle: string;
  phone: string;
  employeeCount: string;
  interests: string[];
};

export type CreateDemoRequestInput = {
  fullName: string;
  email: string;
  companyName: string;
  jobTitle: string;
  phone: string;
  employeeCount: EmployeeCount;
  interests: Interest[];
};

export type BookingDemoMailPayload = {
  id: string;
  fullName: string;
  email: string;
  companyName: string;
  jobTitle: string;
  phone: string;
  employeeCount: EmployeeCount;
  interests: Interest[];
  createdAt: Date;
};

export type DemoRequestFilters = {
  page: number;
  limit: number;
  converted?: boolean;
  search?: string;         
  employeeCount?: EmployeeCount;
  interests?: Interest[];
  fromDate?: Date;
  toDate?: Date;
  sortBy?: "createdAt" | "fullName" | "companyName";
  sortOrder?: "asc" | "desc";
};
