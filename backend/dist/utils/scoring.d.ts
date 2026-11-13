export declare const DIMENSION_LABELS: readonly ["Teacher Training", "Policy Framework", "Technical Infrastructure", "Ethics Education", "Institutional Support", "Budget Allocation", "Student Awareness", "Leadership Commitment"];
export declare const DIMENSION_KEYS: readonly ["teacherTraining", "policyFramework", "technicalInfra", "ethicsEducation", "institutionalSupport", "budgetAllocation", "studentAwareness", "leadershipCommitment"];
export type DimensionKey = typeof DIMENSION_KEYS[number];
export declare const WEIGHTS: Record<DimensionKey, number>;
export type Scores = Record<DimensionKey, number>;
export declare function validateScores(scores: Scores): void;
export declare function computeWeightedScore(scores: Scores): number;
export declare function computeRawAverage(scores: Scores): number;
export type ReadinessStatus = 'NOT_READY' | 'EMERGING' | 'MODERATE' | 'MATURE';
export declare function getStatus(score: number): {
    status: ReadinessStatus;
    label: string;
    description: string;
};
export declare function gapAnalysis(scores: Scores): {
    key: "teacherTraining" | "policyFramework" | "technicalInfra" | "ethicsEducation" | "institutionalSupport" | "budgetAllocation" | "studentAwareness" | "leadershipCommitment";
    label: "Teacher Training" | "Policy Framework" | "Technical Infrastructure" | "Ethics Education" | "Institutional Support" | "Budget Allocation" | "Student Awareness" | "Leadership Commitment";
    score: number;
    gap: number;
}[];
export declare function generateRecommendations(score: number, scores: Scores): string[];
export declare function scoreAssessment(scores: Scores): {
    scores: Scores;
    rawAverage: number;
    weightedScore: number;
    status: ReadinessStatus;
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
//# sourceMappingURL=scoring.d.ts.map