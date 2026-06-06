import 'dotenv/config';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/db';

async function main() {
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@vendorbridge.com' },
    update: {},
    create: {
      firstName: 'Super',
      lastName: 'Admin',
      username: 'superadmin',
      email: 'admin@vendorbridge.com',
      passwordHash: hashedPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'officer@vendorbridge.com' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Procurement',
      username: 'john_officer',
      email: 'officer@vendorbridge.com',
      passwordHash: await bcrypt.hash('Officer@123', 12),
      role: Role.PROCUREMENT_OFFICER,
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@vendorbridge.com' },
    update: {},
    create: {
      firstName: 'Sarah',
      lastName: 'Manager',
      username: 'sarah_manager',
      email: 'manager@vendorbridge.com',
      passwordHash: await bcrypt.hash('Manager@123', 12),
      role: Role.MANAGER,
    },
  });

  console.log('✅ Seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());