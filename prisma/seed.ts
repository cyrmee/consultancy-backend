import { Gender, PrismaClient, Role } from '@prisma/client';
import * as argon from 'argon2';

const prisma = new PrismaClient();

async function seedData() {
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      firstName: 'Administrator',
      lastName: 'Admin',
      phoneNumber: '1234567890',
      gender: Gender.Male,
      hash: await argon.hash('Admin@1234'),
      roles: [Role.Admin],
      isEmailVerified: true,
      isPhoneNumberVerified: true,
      employee: {
        create: {
          firstName: 'Administrator',
          lastName: 'Admin',
          gender: Gender.Male,
          dateOfBirth: new Date('1990-01-01'),
        },
      },
    },
  });

  const agent = await prisma.user.create({
    data: {
      email: 'agent@example.com',
      firstName: 'Agent',
      lastName: 'Smith',
      phoneNumber: '9876543210',
      gender: Gender.Female,
      hash: await argon.hash('Agent@1234'),
      roles: [Role.Agent],
      isEmailVerified: true,
      isPhoneNumberVerified: true,
      employee: {
        create: {
          firstName: 'Agent',
          lastName: 'Smith',
          gender: Gender.Female,
          dateOfBirth: new Date('1995-02-15'),
        },
      },
    },
  });

  const finance = await prisma.user.create({
    data: {
      email: 'finance@example.com',
      firstName: 'Finance',
      lastName: 'Smith',
      phoneNumber: '9876543211',
      gender: Gender.Female,
      hash: await argon.hash('Finance@1234'),
      roles: [Role.Finance],
      isEmailVerified: true,
      isPhoneNumberVerified: true,
      employee: {
        create: {
          firstName: 'Finance',
          lastName: 'Smith',
          gender: Gender.Female,
          dateOfBirth: new Date('1995-02-15'),
        },
      },
    },
  });

  const visa = await prisma.user.create({
    data: {
      email: 'visa@example.com',
      firstName: 'Visa',
      lastName: 'Smith',
      phoneNumber: '9876543212',
      gender: Gender.Female,
      hash: await argon.hash('Visa@1234'),
      roles: [Role.Visa],
      isEmailVerified: true,
      isPhoneNumberVerified: true,
      employee: {
        create: {
          firstName: 'Visa',
          lastName: 'Smith',
          gender: Gender.Female,
          dateOfBirth: new Date('1995-02-15'),
        },
      },
    },
  });

  const admission = await prisma.user.create({
    data: {
      email: 'admission@example.com',
      firstName: 'Admission',
      lastName: 'Smith',
      phoneNumber: '9876543213',
      gender: Gender.Female,
      hash: await argon.hash('Admission@1234'),
      roles: [Role.Admission],
      isEmailVerified: true,
      isPhoneNumberVerified: true,
      employee: {
        create: {
          firstName: 'Admission',
          lastName: 'Smith',
          gender: Gender.Female,
          dateOfBirth: new Date('1995-02-15'),
        },
      },
    },
  });

  console.log(`Seeded users: \n${admin.email} 
${agent.email}
${finance.email}
${visa.email}
${admission.email}`);
}

async function main() {
  try {
    await seedData();
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
