import { EmployeeCount, Interest } from "@prisma/client";
import { bookingDemoRequestRepository } from "./booking-demo-request.repository.js";
import { ConflictError } from "@/shared/errors/errors.js";
import type { CreateBookingDemoRequestInput, DemoRequestFilters } from "@/shared/interfaces/booking-demo-request.interface.js";

type Translator = (key: string) => string;

export const bookingDemoRequestService = {
  async create(payload: CreateBookingDemoRequestInput, t: Translator) {
    const duplicate = await bookingDemoRequestRepository.findDuplicate(
      payload.email.trim(),
      payload.companyName.trim(),
      payload.phone.trim(),
    );

    if (duplicate) throw new ConflictError(t("booking_demo_request.duplicate_request"));

    return bookingDemoRequestRepository.create({
      fullName: payload.fullName,
      email: payload.email.toLowerCase().trim(),
      companyName: payload.companyName.trim(),
      jobTitle: payload.jobTitle.trim(),
      phone: payload.phone.trim(),
      employeeCount: payload.employeeCount as EmployeeCount,
      interests: [...new Set(payload.interests as Interest[])],
    });
  },

  async getAll(query: Record<string, string>) {
    const page = Math.max(1, parseInt(query.page ?? "1"));
    const limit = Math.min(100, parseInt(query.limit ?? "20"));

    const converted = query.converted === "true" ? true
      : query.converted === "false" ? false
        : undefined;

    const fromDate = query.fromDate ? new Date(query.fromDate) : undefined;
    const toDate = query.toDate ? new Date(query.toDate) : undefined;

    const interests = query.interests
      ? (query.interests.split(",") as Interest[])
      : undefined;

    const sortBy = (["createdAt", "fullName", "companyName"].includes(query.sortBy)
      ? query.sortBy
      : "createdAt") as DemoRequestFilters["sortBy"];

    const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

    const [items, total] = await bookingDemoRequestRepository.findAll({
      page,
      limit,
      converted,
      search: query.search,
      employeeCount: query.employeeCount as EmployeeCount,
      interests,
      fromDate,
      toDate,
      sortBy,
      sortOrder,
    });

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },
};