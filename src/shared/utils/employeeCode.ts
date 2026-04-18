import { randomUUID } from "node:crypto";
import prisma from "@/shared/config/prisma.js";

async function generateEmployeeCode(): Promise<string> {
  const MAX_ATTEMPTS = 10;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const suffix = randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
    const code = `EMP-${yyyymm}-${suffix}`;

    const existing = await prisma.user.findFirst({
      where: { employeeCode: code },
      select: { id: true },
    });

    if (!existing) return code;
  }

  return `EMP-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

export { generateEmployeeCode };