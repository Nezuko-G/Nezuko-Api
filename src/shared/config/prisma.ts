import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL environment variable");
}

let prisma: PrismaClient;

if (databaseUrl) {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  prisma = new PrismaClient({ adapter });
} else {
  prisma = new PrismaClient();
  console.warn("DATABASE_URL not set, Prisma initialized without connection pool adapter");
}

export default prisma;
