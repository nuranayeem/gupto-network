import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: "test@guptonetwork.local",
    },
    update: {},
    create: {
      email: "test@guptonetwork.local",
      username: "guptotest",
      name: "Gupto Test User",
    },
  });

  console.log("Database connection successful ✅");
  console.log(user);
}

main()
  .catch((error) => {
    console.error("Database test failed ❌");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
