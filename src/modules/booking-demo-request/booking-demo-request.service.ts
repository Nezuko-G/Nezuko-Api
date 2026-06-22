import { EmployeeCount, Interest } from "@prisma/client";
import { bookingDemoRequestRepository } from "./booking-demo-request.repository.js";
import { BadRequestError, ConflictError } from "@/shared/errors/errors.js";
import type { CreateBookingDemoRequestInput } from "@/shared/interfaces/booking-demo-request.interface.js";

type Translator = (key: string) => string;

const employeeCountMap: Record<string, EmployeeCount> = {
  FROM_1_TO_25: EmployeeCount.FROM_1_TO_25,
  "1-25": EmployeeCount.FROM_1_TO_25,
  FROM_26_TO_100: EmployeeCount.FROM_26_TO_100,
  "26-100": EmployeeCount.FROM_26_TO_100,
  FROM_101_TO_250: EmployeeCount.FROM_101_TO_250,
  "101-250": EmployeeCount.FROM_101_TO_250,
  MORE_THAN_250: EmployeeCount.MORE_THAN_250,
  "250+": EmployeeCount.MORE_THAN_250,
  "MORE THAN 250": EmployeeCount.MORE_THAN_250,
};

const interestMap: Record<string, Interest> = {
  "CORE HR SUITE": Interest.CORE_HR,
  CORE_HR: Interest.CORE_HR,
  "TALENT SUITE": Interest.TALENT,
  TALENT: Interest.TALENT,
  "SPEND SUITE": Interest.SPEND,
  SPEND: Interest.SPEND,
};

function normalizeKey(value: string): string {
  return value.trim().toUpperCase();
}

function mapEmployeeCount(value: string, t: Translator): EmployeeCount {
  const mapped = employeeCountMap[normalizeKey(value)] ?? employeeCountMap[value.trim()];
  if (!mapped) {
    throw new BadRequestError(t("booking_demo_request.invalid_employee_count"));
  }
  return mapped;
}

function mapInterests(values: string[], t: Translator): Interest[] {
  const mapped = values.map((value) => interestMap[normalizeKey(value)] ?? interestMap[value.trim()]);

  if (mapped.some((value) => !value)) {
    throw new BadRequestError(t("booking_demo_request.invalid_interests"));
  }

  return Array.from(new Set(mapped));
}

export const bookingDemoRequestService = {

  async create(payload: CreateBookingDemoRequestInput, t: Translator) {
    const duplicateRequest = await bookingDemoRequestRepository.findDuplicate(
      payload.email.trim(),
      payload.companyName.trim(),
      payload.phone.trim(),
    );

    if (duplicateRequest) {
      throw new ConflictError(t("booking_demo_request.duplicate_request"));
    }

    const created = await bookingDemoRequestRepository.create({
      fullName: payload.fullName,
      email: payload.email,
      companyName: payload.companyName,
      jobTitle: payload.jobTitle,
      phone: payload.phone,
      employeeCount: mapEmployeeCount(payload.employeeCount, t),
      interests: mapInterests(payload.interests, t),
    });



    return created;
  },
};
