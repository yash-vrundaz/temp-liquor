import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  await prisma.$connect();
  const result = await prisma.$queryRaw`SELECT current_database() AS db, current_user AS user`;
  console.log("Connected:", result);
} catch (error) {
  console.error("Connection failed:", error.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
