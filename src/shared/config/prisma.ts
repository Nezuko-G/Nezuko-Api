import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { setServers, resolve4Sync } from "node:dns";
import * as dotenv from "dotenv";

dotenv.config();

function resolveHostname(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") return urlStr;

    setServers(["8.8.8.8", "1.1.1.1"]);
    const addresses = resolve4Sync(hostname);
    if (addresses.length > 0) {
      url.hostname = addresses[0];
      return url.toString();
    }
  } catch (err) {
    console.error("DNS resolution failed, using original hostname:", err);
  }
  return urlStr;
}

const rawUrl = process.env.DATABASE_URL;

if (!rawUrl) {
  console.error("Missing DATABASE_URL environment variable");
}

const databaseUrl = rawUrl ? resolveHostname(rawUrl) : undefined;

let prisma: PrismaClient;

if (databaseUrl) {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  prisma = new PrismaClient({ adapter });
} else {
  prisma = new PrismaClient();
  console.warn("DATABASE_URL not set — Prisma initialized without connection pool adapter");
}

export default prisma;