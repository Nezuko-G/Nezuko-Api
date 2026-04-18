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
