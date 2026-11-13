"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamSchema = exports.listQuerySchema = exports.createAssessmentSchema = void 0;
const zod_1 = require("zod");
const dimension = zod_1.z.number().int().min(0).max(100);
exports.createAssessmentSchema = zod_1.z.object({
    teacherTraining: dimension,
    policyFramework: dimension,
    technicalInfra: dimension,
    ethicsEducation: dimension,
    institutionalSupport: dimension,
    budgetAllocation: dimension,
    studentAwareness: dimension,
    leadershipCommitment: dimension,
    institutionId: zod_1.z.string().cuid().optional().nullable(),
    notes: zod_1.z.string().max(2000).optional(),
    isPublic: zod_1.z.boolean().optional().default(false),
});
exports.listQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    status: zod_1.z.enum(['NOT_READY', 'EMERGING', 'MODERATE', 'MATURE']).optional(),
    userId: zod_1.z.string().optional(),
});
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
});
//# sourceMappingURL=assessments.schema.js.map