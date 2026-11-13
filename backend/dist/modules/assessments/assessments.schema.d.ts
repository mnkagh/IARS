import { z } from 'zod';
export declare const createAssessmentSchema: z.ZodObject<{
    teacherTraining: z.ZodNumber;
    policyFramework: z.ZodNumber;
    technicalInfra: z.ZodNumber;
    ethicsEducation: z.ZodNumber;
    institutionalSupport: z.ZodNumber;
    budgetAllocation: z.ZodNumber;
    studentAwareness: z.ZodNumber;
    leadershipCommitment: z.ZodNumber;
    institutionId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodOptional<z.ZodString>;
    isPublic: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    teacherTraining: number;
    policyFramework: number;
    technicalInfra: number;
    ethicsEducation: number;
    institutionalSupport: number;
    budgetAllocation: number;
    studentAwareness: number;
    leadershipCommitment: number;
    isPublic: boolean;
    institutionId?: string | null | undefined;
    notes?: string | undefined;
}, {
    teacherTraining: number;
    policyFramework: number;
    technicalInfra: number;
    ethicsEducation: number;
    institutionalSupport: number;
    budgetAllocation: number;
    studentAwareness: number;
    leadershipCommitment: number;
    institutionId?: string | null | undefined;
    notes?: string | undefined;
    isPublic?: boolean | undefined;
}>;
export declare const listQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["NOT_READY", "EMERGING", "MODERATE", "MATURE"]>>;
    userId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    status?: "NOT_READY" | "EMERGING" | "MODERATE" | "MATURE" | undefined;
    userId?: string | undefined;
}, {
    status?: "NOT_READY" | "EMERGING" | "MODERATE" | "MATURE" | undefined;
    limit?: number | undefined;
    userId?: string | undefined;
    page?: number | undefined;
}>;
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
//# sourceMappingURL=assessments.schema.d.ts.map