"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computePreview = exports.stats = exports.remove = exports.getById = exports.list = exports.create = void 0;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const error_1 = require("../../middleware/error");
const scoring_1 = require("../../utils/scoring");
const create = async (userId, data) => {
    const scores = {
        teacherTraining: data.teacherTraining,
        policyFramework: data.policyFramework,
        technicalInfra: data.technicalInfra,
        ethicsEducation: data.ethicsEducation,
        institutionalSupport: data.institutionalSupport,
        budgetAllocation: data.budgetAllocation,
        studentAwareness: data.studentAwareness,
        leadershipCommitment: data.leadershipCommitment,
    };
    const result = (0, scoring_1.scoreAssessment)(scores);
    // institution ownership check if provided
    let institutionId = data.institutionId;
    if (!institutionId) {
        const user = await prisma_1.default.user.findUnique({ where: { id: userId }, select: { institutionId: true } });
        institutionId = user?.institutionId ?? null;
    }
    const assessment = await prisma_1.default.assessment.create({
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
    await prisma_1.default.auditLog.create({
        data: { userId, action: 'CREATE_ASSESSMENT', resource: `assessment:${assessment.id}`, metadata: { weightedScore: result.weightedScore } },
    });
    return { assessment, computed: result };
};
exports.create = create;
const list = async (params) => {
    const { page, limit, status, userId, requestingUser } = params;
    const skip = (page - 1) * limit;
    // RBAC: non-admin can only see own OR public OR same institution? Keep simple: own + public unless admin
    const where = {};
    if (status)
        where.status = status;
    if (requestingUser.role !== 'ADMIN') {
        if (userId && userId !== requestingUser.id)
            throw new error_1.AppError('Forbidden', 403);
        where.OR = [{ userId: requestingUser.id }, { isPublic: true }];
        // if filtering by userId specifically, narrow
        if (userId)
            where.userId = userId;
    }
    else {
        if (userId)
            where.userId = userId;
    }
    const [items, total] = await Promise.all([
        prisma_1.default.assessment.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, email: true } }, institution: true } }),
        prisma_1.default.assessment.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};
exports.list = list;
const getById = async (id, requestingUser) => {
    const a = await prisma_1.default.assessment.findUnique({ where: { id }, include: { user: { select: { id: true, name: true } }, institution: true } });
    if (!a)
        throw new error_1.AppError('Assessment not found', 404);
    if (requestingUser.role !== 'ADMIN' && a.userId !== requestingUser.id && !a.isPublic)
        throw new error_1.AppError('Forbidden', 403);
    return a;
};
exports.getById = getById;
const remove = async (id, requestingUser) => {
    const a = await prisma_1.default.assessment.findUnique({ where: { id } });
    if (!a)
        throw new error_1.AppError('Assessment not found', 404);
    if (requestingUser.role !== 'ADMIN' && a.userId !== requestingUser.id)
        throw new error_1.AppError('Forbidden', 403);
    await prisma_1.default.assessment.delete({ where: { id } });
    await prisma_1.default.auditLog.create({ data: { userId: requestingUser.id, action: 'DELETE_ASSESSMENT', resource: `assessment:${id}` } });
    return { success: true };
};
exports.remove = remove;
const stats = async (requestingUser) => {
    const where = requestingUser.role === 'ADMIN' ? {} : { userId: requestingUser.id };
    const [count, avg, byStatus] = await Promise.all([
        prisma_1.default.assessment.count({ where }),
        prisma_1.default.assessment.aggregate({ where, _avg: { weightedScore: true, rawAverage: true } }),
        prisma_1.default.assessment.groupBy({ by: ['status'], where, _count: { status: true } }),
    ]);
    // recent trend - last 6
    const recent = await prisma_1.default.assessment.findMany({ where, orderBy: { createdAt: 'desc' }, take: 6, select: { weightedScore: true, createdAt: true } });
    return { count, avg, byStatus, recent: recent.reverse() };
};
exports.stats = stats;
const computePreview = (scores) => {
    return (0, scoring_1.scoreAssessment)(scores);
};
exports.computePreview = computePreview;
//# sourceMappingURL=assessments.service.js.map