import { z } from 'zod';

const dimension = z.number().int().min(0).max(100);

export const createAssessmentSchema = z.object({
  teacherTraining: dimension,
  policyFramework: dimension,
  technicalInfra: dimension,
  ethicsEducation: dimension,
  institutionalSupport: dimension,
  budgetAllocation: dimension,
  studentAwareness: dimension,
  leadershipCommitment: dimension,
  institutionId: z.string().cuid().optional().nullable(),
  notes: z.string().max(2000).optional(),
  isPublic: z.boolean().optional().default(false),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['NOT_READY', 'EMERGING', 'MODERATE', 'MATURE']).optional(),
  userId: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().cuid(),
});
