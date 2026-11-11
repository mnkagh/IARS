export interface DatasetRecord {
  ref: string;
  cat: string;
  title: string;
  tags: string;
  year: string;
  cite: string;
  abstract: string;
}

export interface TeacherQuestionnaireDataset extends DatasetRecord {
  n: number;
  awareness: { uses: number; abstains: number; unaware: number };
  frequency: Record<string, number>;
  willingness: { formal: number; supplementary: number; no: number };
  support: Record<string, number>;
  ethics: {
    plagiarismScale: Record<string, number>;
    dependency: Record<string, number>;
    ethicalIntegration: Record<string, number>;
  };
}

export const TEACHER_QUESTIONNAIRE: TeacherQuestionnaireDataset = {
  ref: 'DATASET / T-001',
  cat: 'Datasets',
  title: 'Teacher Questionnaire — AI in Education (Responses)',
  tags: 'Survey · Teacher training · n=50',
  year: '2026',
  cite: 'IARS field collection · teacher questionnaire · 50 responses',
  abstract:
    'Institutional field questionnaire on artificial intelligence in education. Captures teacher awareness, adoption behaviour, perceived support needs, ethical stance and willingness to integrate AI into formal teaching.',
  n: 50,
  awareness: { uses: 27, abstains: 10, unaware: 13 },
  frequency: { Everyday: 5, 'A few Times a Week': 11, Occasionally: 9, Rarely: 2 },
  willingness: { formal: 29, supplementary: 16, no: 3 },
  support: {
    'Formal training or workshops': 12,
    'Technical support from the institution': 10,
    'Clear institutional guidelines or policies': 12,
    'Examples of ethical and effective use': 10,
    'Peer support from colleagues': 5,
  },
  ethics: {
    plagiarismScale: { 3: 17, 4: 4, 5: 6 },
    dependency: { Neutral: 20, Agree: 6, 'Strongly agree': 1 },
    ethicalIntegration: {
      formal: 29,
      supplementary: 16,
      no: 3,
      unclear: 2,
    },
  },
};

export const DATASETS: DatasetRecord[] = [
  {
    ref: 'DATASET / T-001',
    cat: 'Datasets',
    title: 'Teacher Questionnaire — AI in Education (Responses)',
    tags: 'Survey · Teacher training · n=50',
    year: '2026',
    cite: 'IARS field collection · teacher questionnaire · 50 responses',
    abstract:
      'Institutional field questionnaire on artificial intelligence in education. Captures teacher awareness, adoption behaviour, perceived support needs, ethical stance and willingness to integrate AI into formal teaching.',
  },
];
