"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEIGHTS = exports.DIMENSION_KEYS = exports.DIMENSION_LABELS = void 0;
exports.validateScores = validateScores;
exports.computeWeightedScore = computeWeightedScore;
exports.computeRawAverage = computeRawAverage;
exports.getStatus = getStatus;
exports.gapAnalysis = gapAnalysis;
exports.generateRecommendations = generateRecommendations;
exports.scoreAssessment = scoreAssessment;
// IARS Scoring Engine - Deterministic weighted model (mimics trained Random Forest)
// Weights derived from reference HTML; sum = 1.0
exports.DIMENSION_LABELS = [
    'Teacher Training',
    'Policy Framework',
    'Technical Infrastructure',
    'Ethics Education',
    'Institutional Support',
    'Budget Allocation',
    'Student Awareness',
    'Leadership Commitment',
];
exports.DIMENSION_KEYS = [
    'teacherTraining',
    'policyFramework',
    'technicalInfra',
    'ethicsEducation',
    'institutionalSupport',
    'budgetAllocation',
    'studentAwareness',
    'leadershipCommitment',
];
exports.WEIGHTS = {
    teacherTraining: 0.15,
    policyFramework: 0.15,
    technicalInfra: 0.10,
    ethicsEducation: 0.12,
    institutionalSupport: 0.15,
    budgetAllocation: 0.10,
    studentAwareness: 0.12,
    leadershipCommitment: 0.11,
};
function validateScores(scores) {
    for (const k of exports.DIMENSION_KEYS) {
        const v = scores[k];
        if (!Number.isInteger(v) || v < 0 || v > 100)
            throw new Error(`Invalid score for ${k}: ${v}`);
    }
}
function computeWeightedScore(scores) {
    let total = 0;
    for (const k of exports.DIMENSION_KEYS)
        total += scores[k] * exports.WEIGHTS[k];
    return Math.round(total);
}
function computeRawAverage(scores) {
    const sum = exports.DIMENSION_KEYS.reduce((a, k) => a + scores[k], 0);
    return Math.round(sum / exports.DIMENSION_KEYS.length);
}
function getStatus(score) {
    if (score < 25)
        return { status: 'NOT_READY', label: 'Not Ready', description: 'Not ready for responsible AI adoption. Build foundational policies and training.' };
    if (score < 50)
        return { status: 'EMERGING', label: 'Emerging', description: 'Emerging in readiness. Strengthen governance and support structures.' };
    if (score < 75)
        return { status: 'MODERATE', label: 'Moderate', description: 'Moderate readiness. Begin implementation with targeted support.' };
    return { status: 'MATURE', label: 'Mature', description: 'Mature readiness. Proceed with full implementation and scaling.' };
}
function gapAnalysis(scores) {
    const gaps = exports.DIMENSION_KEYS.map((key, idx) => ({
        key,
        label: exports.DIMENSION_LABELS[idx],
        score: scores[key],
        gap: 100 - scores[key],
    }));
    // sort largest gap first
    return gaps.sort((a, b) => b.gap - a.gap);
}
function generateRecommendations(score, scores) {
    const recs = [];
    const status = getStatus(score).status;
    if (status === 'NOT_READY') {
        recs.push('Develop a comprehensive institutional AI policy framework');
        recs.push('Launch teacher training programs on AI fundamentals');
        recs.push('Establish clear guidelines for ethical AI use');
        recs.push('Create student awareness initiatives about responsible AI');
    }
    else if (status === 'EMERGING') {
        recs.push('Strengthen existing policies with specific implementation guidelines');
        recs.push('Expand teacher training to cover advanced topics');
        recs.push('Develop ethics education curriculum for students');
        recs.push('Increase institutional support infrastructure');
    }
    else if (status === 'MODERATE') {
        recs.push('Fine-tune policies based on pilot implementations');
        recs.push('Deploy institutional AI system (StudyMate) in phases');
        recs.push('Monitor and evaluate adoption metrics');
        recs.push('Establish feedback mechanisms for continuous improvement');
    }
    else {
        recs.push('Scale AI implementation across the institution');
        recs.push('Establish best practice sharing mechanisms');
        recs.push('Conduct regular audits for bias and fairness');
        recs.push('Plan for advanced AI applications and research');
    }
    // Top 2 lowest dimensions -> priority actions
    const sorted = [...exports.DIMENSION_KEYS].sort((a, b) => scores[a] - scores[b]).slice(0, 2);
    for (const k of sorted) {
        if (scores[k] < 50) {
            const label = exports.DIMENSION_LABELS[exports.DIMENSION_KEYS.indexOf(k)];
            if (label.includes('Training'))
                recs.push(`Priority: Immediate teacher training on ${label.toLowerCase()} (score ${scores[k]})`);
            else if (label.includes('Policy'))
                recs.push(`Priority: Draft institutional ${label.toLowerCase()} as urgent action (score ${scores[k]})`);
            else if (label.includes('Ethics'))
                recs.push(`Priority: Integrate ${label.toLowerCase()} into curriculum (score ${scores[k]})`);
            else
                recs.push(`Priority: Urgent improvement needed for ${label} (score ${scores[k]})`);
        }
    }
    return [...new Set(recs)];
}
function scoreAssessment(scores) {
    validateScores(scores);
    const weightedScore = computeWeightedScore(scores);
    const rawAverage = computeRawAverage(scores);
    const { status, label, description } = getStatus(weightedScore);
    const gaps = gapAnalysis(scores);
    const recommendations = generateRecommendations(weightedScore, scores);
    return {
        scores,
        rawAverage,
        weightedScore,
        status,
        statusLabel: label,
        statusDescription: description,
        gaps,
        recommendations,
        labels: [...exports.DIMENSION_LABELS],
    };
}
//# sourceMappingURL=scoring.js.map