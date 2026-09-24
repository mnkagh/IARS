import prisma from '../../lib/prisma';
import { AppError } from '../../middleware/error';
import { scoreAssessment, Scores } from '../../utils/scoring';

export const create = async (userId: string, data: Scores & { institutionId?: string | null; notes?: string; isPublic?: boolean }) => {
  const scores: Scores = {
    teacherTraining: data.teacherTraining,
    policyFramework: data.policyFramework,
    technicalInfra: data.technicalInfra,
    ethicsEducation: data.ethicsEducation,
    institutionalSupport: data.institutionalSupport,
    budgetAllocation: data.budgetAllocation,
    studentAwareness: data.studentAwareness,
    leadershipCommitment: data.leadershipCommitment,
  };

  const result = scoreAssessment(scores);

  // institution ownership check if provided
  let institutionId: string | null | undefined = data.institutionId;
  if (!institutionId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { institutionId: true } });
    institutionId = user?.institutionId ?? null;
  }

  const assessment = await prisma.assessment.create({
    data: {
      userId,
      institutionId: institutionId || null,
      teacherTraining: scores.teacherTraining,
      policyFramework: scores.policyFramework,
      technicalInfra: scores.technicalInfra,
      ethicsEducation: scores.ethicsEducation,
      institutionalSupport: scores.institutionalSupport,
      budgetAllocation: scores.budgetAllocation,
      studentAwareness: scores.studentAwareness,
      leadershipCommitment: scores.leadershipCommitment,
      rawAverage: result.rawAverage,
      weightedScore: result.weightedScore,
      status: result.status,
      gapAnalysis: result.gaps,
      recommendations: result.recommendations,
      notes: data.notes,
      isPublic: data.isPublic ?? false,
    },
  });

  await prisma.auditLog.create({
    data: { userId, action: 'CREATE_ASSESSMENT', resource: `assessment:${assessment.id}`, metadata: { weightedScore: result.weightedScore } },
  });

  return { assessment, computed: result };
};

export const list = async (params: { page: number; limit: number; status?: string; userId?: string; requestingUser: { id: string; role: string } }) => {
  const { page, limit, status, userId, requestingUser } = params;
  const skip = (page - 1) * limit;

  // RBAC: non-admin can only see own OR public OR same institution? Keep simple: own + public unless admin
  const where: any = {};
  if (status) where.status = status;
  if (requestingUser.role !== 'ADMIN') {
    if (userId && userId !== requestingUser.id) throw new AppError('Forbidden', 403);
    where.OR = [{ userId: requestingUser.id }, { isPublic: true }];
    // if filtering by userId specifically, narrow
    if (userId) where.userId = userId;
  } else {
    if (userId) where.userId = userId;
  }

  const [items, total] = await Promise.all([
    prisma.assessment.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, email: true } }, institution: true } }),
    prisma.assessment.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getById = async (id: string, requestingUser: { id: string; role: string }) => {
  const a = await prisma.assessment.findUnique({ where: { id }, include: { user: { select: { id: true, name: true } }, institution: true } });
  if (!a) throw new AppError('Assessment not found', 404);
  if (requestingUser.role !== 'ADMIN' && a.userId !== requestingUser.id && !a.isPublic) throw new AppError('Forbidden', 403);
  return a;
};

export const remove = async (id: string, requestingUser: { id: string; role: string }) => {
  const a = await prisma.assessment.findUnique({ where: { id } });
  if (!a) throw new AppError('Assessment not found', 404);
  if (requestingUser.role !== 'ADMIN' && a.userId !== requestingUser.id) throw new AppError('Forbidden', 403);
  await prisma.assessment.delete({ where: { id } });
  await prisma.auditLog.create({ data: { userId: requestingUser.id, action: 'DELETE_ASSESSMENT', resource: `assessment:${id}` } });
  return { success: true };
};

export const stats = async (requestingUser: { id: string; role: string }) => {
  const where: any = requestingUser.role === 'ADMIN' ? {} : { userId: requestingUser.id };
  const [count, avg, byStatus] = await Promise.all([
    prisma.assessment.count({ where }),
    prisma.assessment.aggregate({ where, _avg: { weightedScore: true, rawAverage: true } }),
    prisma.assessment.groupBy({ by: ['status'], where, _count: { status: true } }),
  ]);
  // recent trend - last 6
  const recent = await prisma.assessment.findMany({ where, orderBy: { createdAt: 'desc' }, take: 6, select: { weightedScore: true, createdAt: true } });
  return { count, avg, byStatus, recent: recent.reverse() };
};

export const computePreview = (scores: Scores) => {
  return scoreAssessment(scores);
};
