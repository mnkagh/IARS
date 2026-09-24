import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@iars.local';
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminExists) {
    const hash = await bcrypt.hash('Admin@12345', 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'IARS Admin',
        password: hash,
        role: 'ADMIN',
        emailVerified: true,
      },
    });
    console.log('Admin created: admin@iars.local / Admin@12345');
  }

  const demoEmail = 'demo@iars.local';
  if (!(await prisma.user.findUnique({ where: { email: demoEmail } }))) {
    const hash = await bcrypt.hash('Demo@12345', 12);
    const inst = await prisma.institution.create({ data: { name: 'Demo University', type: 'University', country: 'India' } });
    const user = await prisma.user.create({
      data: { email: demoEmail, name: 'Demo User', password: hash, role: 'USER', institutionId: inst.id, emailVerified: true },
    });
    // sample assessment
    await prisma.assessment.create({
      data: {
        userId: user.id,
        institutionId: inst.id,
        teacherTraining: 65,
        policyFramework: 70,
        technicalInfra: 55,
        ethicsEducation: 60,
        institutionalSupport: 75,
        budgetAllocation: 50,
        studentAwareness: 68,
        leadershipCommitment: 80,
        rawAverage: 65,
        weightedScore: 66,
        status: 'MODERATE',
        gapAnalysis: [],
        recommendations: ['Strengthen technical infra'],
      },
    });
    console.log('Demo created: demo@iars.local / Demo@12345');
  }
  console.log('Seed done');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
