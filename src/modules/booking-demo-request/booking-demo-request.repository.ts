import prisma from "@/shared/config/prisma.js";
import type { CreateDemoRequestInput, DemoRequestFilters } from "@/shared/interfaces/booking-demo-request.interface.js";
import type { Prisma } from "@prisma/client";

export const bookingDemoRequestRepository = {
  findDuplicate(email: string, companyName: string, phone: string) {
    return prisma.demoRequest.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        companyName: { equals: companyName, mode: "insensitive" },
        phone,
      },
      select: { id: true },
    });
  },

  create(data: CreateDemoRequestInput) {
    return prisma.demoRequest.create({ data });
  },

  findAll(params: DemoRequestFilters) {
    const {
      page,
      limit,
      converted,
      search,
      employeeCount,
      interests,
      fromDate,
      toDate,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const where: Prisma.DemoRequestWhereInput = {
      // Filter by converted status
      ...(converted !== undefined && { converted }),

      // Filter by employee count
      ...(employeeCount && { employeeCount }),

      // Filter by interests
      ...(interests?.length && {
        interests: { hasEvery: interests },
      }),

      // Filter by date range
      ...(fromDate || toDate
        ? {
          createdAt: {
            ...(fromDate && { gte: fromDate }),
            ...(toDate && { lte: toDate }),
          },
        }
        : {}),

      // Search across fullName, email, companyName, phone
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { companyName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      }),
    };

    return prisma.$transaction([
      prisma.demoRequest.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.demoRequest.count({ where }),
    ]);
  },
};