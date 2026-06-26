import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const phone = "+10000000000";
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    console.log("Seed admin already exists");
    return;
  }
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      phone,
      name: "Jala Ride Admin",
      passwordHash,
      role: UserRole.ADMIN,
      wallet: { create: {} },
    },
  });
  console.log("Created admin:", phone, "/ admin123");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
