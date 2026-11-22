import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const operatorHash = await bcrypt.hash('operator123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@vms.local' },
    update: {},
    create: {
      email: 'admin@vms.local',
      passwordHash: adminHash,
      name: 'System Admin',
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'operator@vms.local' },
    update: {},
    create: {
      email: 'operator@vms.local',
      passwordHash: operatorHash,
      name: 'Floor Operator',
      role: Role.OPERATOR,
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });