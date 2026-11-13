import { Scores } from '../../utils/scoring';
export declare const create: (userId: string, data: Scores & {
    institutionId?: string | null;
    notes?: string;
    isPublic?: boolean;
}) => Promise<{
    assessment: {
        status: import(".prisma/client").$Enums.ReadinessStatus;
        id: string;
        institutionId: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        teacherTraining: number;
        policyFramework: number;
        technicalInfra: number;
        ethicsEducation: number;
        institutionalSupport: number;
        budgetAllocation: number;
        studentAwareness: number;
        leadershipCommitment: number;
        notes: string | null;
        isPublic: boolean;
        rawAverage: number;
        weightedScore: number;
        gapAnalysis: import("@prisma/client/runtime/library").JsonValue;
        recommendations: import("@prisma/client/runtime/library").JsonValue;
    };
    computed: {
        scores: Scores;
        rawAverage: number;
        weightedScore: number;
        status: import("../../utils/scoring").ReadinessStatus;
        statusLabel: string;
        statusDescription: string;
        gaps: {
            key: "teacherTraining" | "policyFramework" | "technicalInfra" | "ethicsEducation" | "institutionalSupport" | "budgetAllocation" | "studentAwareness" | "leadershipCommitment";
            label: "Teacher Training" | "Policy Framework" | "Technical Infrastructure" | "Ethics Education" | "Institutional Support" | "Budget Allocation" | "Student Awareness" | "Leadership Commitment";
            score: number;
            gap: number;
        }[];
        recommendations: string[];
        labels: ("Teacher Training" | "Policy Framework" | "Technical Infrastructure" | "Ethics Education" | "Institutional Support" | "Budget Allocation" | "Student Awareness" | "Leadership Commitment")[];
    };
}>;
export declare const list: (params: {
    page: number;
    limit: number;
    status?: string;
    userId?: string;
    requestingUser: {
        id: string;
        role: string;
    };
}) => Promise<{
    items: ({
        institution: {
            type: string | null;
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            country: string | null;
            city: string | null;
            website: string | null;
            createdById: string | null;
        } | null;
        user: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        status: import(".prisma/client").$Enums.ReadinessStatus;
        id: string;
        institutionId: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        teacherTraining: number;
        policyFramework: number;
        technicalInfra: number;
        ethicsEducation: number;
        institutionalSupport: number;
        budgetAllocation: number;
        studentAwareness: number;
        leadershipCommitment: number;
        notes: string | null;
        isPublic: boolean;
        rawAverage: number;
        weightedScore: number;
        gapAnalysis: import("@prisma/client/runtime/library").JsonValue;
        recommendations: import("@prisma/client/runtime/library").JsonValue;
    })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}>;
export declare const getById: (id: string, requestingUser: {
    id: string;
    role: string;
}) => Promise<{
    institution: {
        type: string | null;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        country: string | null;
        city: string | null;
        website: string | null;
        createdById: string | null;
    } | null;
    user: {
        id: string;
        name: string;
    };
} & {
    status: import(".prisma/client").$Enums.ReadinessStatus;
    id: string;
    institutionId: string | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    teacherTraining: number;
    policyFramework: number;
    technicalInfra: number;
    ethicsEducation: number;
    institutionalSupport: number;
    budgetAllocation: number;
    studentAwareness: number;
    leadershipCommitment: number;
    notes: string | null;
    isPublic: boolean;
    rawAverage: number;
    weightedScore: number;
    gapAnalysis: import("@prisma/client/runtime/library").JsonValue;
    recommendations: import("@prisma/client/runtime/library").JsonValue;
}>;
export declare const remove: (id: string, requestingUser: {
    id: string;
    role: string;
}) => Promise<{
    success: boolean;
}>;
export declare const stats: (requestingUser: {
    id: string;
    role: string;
}) => Promise<{
    count: number;
    avg: import(".prisma/client").Prisma.GetAssessmentAggregateType<{
        where: any;
        _avg: {
            weightedScore: true;
            rawAverage: true;
        };
    }>;
    byStatus: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.AssessmentGroupByOutputType, "status"[]> & {
        _count: {
            status: number;
        };
    })[];
    recent: {
        createdAt: Date;
        weightedScore: number;
    }[];
}>;
export declare const computePreview: (scores: Scores) => {
    scores: Scores;
    rawAverage: number;
    weightedScore: number;
    status: import("../../utils/scoring").ReadinessStatus;
    statusLabel: string;
    statusDescription: string;
    gaps: {
        key: "teacherTraining" | "policyFramework" | "technicalInfra" | "ethicsEducation" | "institutionalSupport" | "budgetAllocation" | "studentAwareness" | "leadershipCommitment";
        label: "Teacher Training" | "Policy Framework" | "Technical Infrastructure" | "Ethics Education" | "Institutional Support" | "Budget Allocation" | "Student Awareness" | "Leadership Commitment";
        score: number;
        gap: number;
    }[];
    recommendations: string[];
    labels: ("Teacher Training" | "Policy Framework" | "Technical Infrastructure" | "Ethics Education" | "Institutional Support" | "Budget Allocation" | "Student Awareness" | "Leadership Commitment")[];
};
//# sourceMappingURL=assessments.service.d.ts.map