import prisma from "@/shared/config/prisma.js";
import { EmployeeCount, Interest } from "@prisma/client";

type CreateDemoRequestInput = {
  fullName: string;
  email: string;
  companyName: string;
  jobTitle: string;
  phone: string;
  employeeCount: EmployeeCount;
  interests: Interest[];
};

export const bookingDemoRequestRepository = {
  findDuplicate(email: string, companyName: string, phone: string) {
    return prisma.demoRequest.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
        companyName: {
          equals: companyName,
          mode: "insensitive",
        },
        phone,
      },
      select: {
        id: true,
      },
    });
  },

  create(data: CreateDemoRequestInput) {
    return prisma.demoRequest.create({
      data,
    });
  },
};
