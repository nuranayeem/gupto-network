import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

function isLocalPrismaDevDatabase(url: string) {
  try {
    const parsed = new URL(url);
    const isLocalHost =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

    return isLocalHost && parsed.port === "51214";
  } catch {
    return false;
  }
}

const adapter = new PrismaPg({
  connectionString,
  ...(isLocalPrismaDevDatabase(connectionString) ? { max: 1 } : {}),
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
