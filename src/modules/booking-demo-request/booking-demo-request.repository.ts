import prisma from "@/shared/config/prisma.js";
import { EmployeeCount, Interest } from "@prisma/client";
import type { CreateDemoRequestInput } from "@/shared/interfaces/booking-demo-request.interface.js";

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
