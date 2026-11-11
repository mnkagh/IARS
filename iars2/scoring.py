import re
import numpy as np
import pandas as pd

LIKERT_MAP = {
    "strongly disagree": 1,
    "disagree": 2,
    "neutral": 3,
    "agree": 4,
    "strongly agree": 5,
}

WEIGHTS = np.array([0.15, 0.15, 0.10, 0.12, 0.15, 0.10, 0.12, 0.11])
DIM_NAMES = [
    "Teacher Training Level",
    "Policy Framework Clarity",
    "Technical Infrastructure",
    "Ethics Education Programs",
    "Institutional Support",
    "Budget Allocation",
    "Student AI Awareness",
    "Leadership Commitment",
]


def _norm_cols(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out.columns = [str(c).strip() for c in out.columns]
    return out


def _col(df: pd.DataFrame, name: str) -> str | None:
    name = name.strip()
    if name in df.columns:
        return name
    for c in df.columns:
        if c.strip().lower() == name.lower():
            return c
    for c in df.columns:
        if name.lower() in c.strip().lower():
            return c
    return None


def _likert(series: pd.Series) -> pd.Series:
    s = series.astype(str).str.strip().str.lower()
    mapped = s.map(LIKERT_MAP)
    # fall back to numeric coercion for already-numeric scales
    if mapped.isna().all():
        num = pd.to_numeric(series, errors="coerce")
        if num.notna().any():
            mn, mx = num.min(), num.max()
            if mx > mn:
                return ((num - mn) / (mx - mn) * 4 + 1).clip(1, 5)
    return mapped


def _to_0_100(series: pd.Series, fixed: bool = False) -> pd.Series:
    num = pd.to_numeric(series, errors="coerce")
    if num.notna().sum() == 0:
        return pd.Series(50.0, index=series.index)
    if fixed:
        return ((num - 1) / 4 * 100).clip(0, 100)
    mn, mx = num.min(), num.max()
    if mx == mn:
        return pd.Series(50.0, index=series.index)
    return ((num - mn) / (mx - mn) * 100).clip(0, 100)


def _contains(series: pd.Series, needle: str) -> pd.Series:
    return series.astype(str).str.contains(needle, case=False, na=False)


def load_table(uploaded) -> pd.DataFrame:
    name = getattr(uploaded, "name", str(uploaded)).lower()
    if name.endswith(".csv"):
        return _norm_cols(pd.read_csv(uploaded))
    return _norm_cols(pd.read_excel(uploaded))


def _support_counts(series: pd.Series) -> pd.DataFrame:
    labels = [
        "Formal training or workshops",
        "Technical support from the institution",
        "Clear institutional guidelines or policies",
        "Examples of ethical and effective use",
        "Peer support from colleagues",
    ]
    out = {}
    for lab in labels:
        out[lab] = _contains(series, lab).astype(int)
    return pd.DataFrame(out, index=series.index)


def compute_student_scores(df: pd.DataFrame) -> dict:
    df = _norm_cols(df)
    freq_col = _col(df, "Frequency of AI Tool Usage")
    freq_map = {
        "everyday": 5,
        "a few times a week": 4,
        "occasionaly": 3,
        "occasionally": 3,
        "rarely": 2,
        "never": 1,
    }
    freq = df[freq_col].astype(str).str.strip().str.lower().map(freq_map).fillna(1) if freq_col else pd.Series(3, index=df.index)

    utility_names = [
        "AI tools help me understand difficult topics better.",
        "AI based tools provides more customized and personalized learning than textbooks.",
        "AI increases my interest and engagement in learning.",
        "AI improves my motivation to study.",
        "AI tools helps me with my assignments, tests and self-study effectively and efficiently.",
        "My academic performance has improved after using AI tools.",
        "I prefer using AI tools along with traditional study methods.",
        "I feel more confident in exams when I study with AI tools",
        "My grades or performance have improved since using AI tools.",
        "I can learn and revise faster using AI-based tools.",
        "AI tools give me reliable and accurate output/answers.",
        "AI motivates people to keep learning throughout their lives.",
        "AI helps reduce learning gaps for slow learners.",
        "Do you think AI helps everyone get equal learning opportunities?",
        "Overall, how much would you rate the role of AI in education?",
        "AI can improve education if it is used responsibly and ethically?",
    ]
    utility_cols = [c for c in [_col(df, n) for n in utility_names] if c]
    utility = pd.concat([_likert(df[c]) for c in utility_cols], axis=1).mean(axis=1) if utility_cols else pd.Series(3, index=df.index)

    ethics_names = [
        "I know the right way to use AI-generated content.",
        "Using AI to generate complete assignments without effort is unethical.",
        "AI should be used only as a learning aid, not as a replacement for students work.",
        "Students should be taught how to use AI ethically.",
    ]
    ethics_cols = [c for c in [_col(df, n) for n in ethics_names] if c]
    ethics = pd.concat([_likert(df[c]) for c in ethics_cols], axis=1).mean(axis=1) if ethics_cols else pd.Series(3, index=df.index)

    equity_names = [
        "Do you think AI helps everyone get equal learning opportunities?",
        "AI motivates people to keep learning throughout their lives.",
        "AI helps reduce learning gaps for slow learners.",
    ]
    equity_cols = [c for c in [_col(df, n) for n in equity_names] if c]
    equity = pd.concat([_likert(df[c]) for c in equity_cols], axis=1).mean(axis=1) if equity_cols else pd.Series(3, index=df.index)

    overall_col = _col(df, "Overall, how much would you rate the role of AI in education?")
    overall = _likert(df[overall_col]) if overall_col else pd.Series(3, index=df.index)

    freq_norm = ((freq - 1) / 4 * 100).clip(0, 100)
    utility_norm = ((utility - 1) / 4 * 100).clip(0, 100)
    ethics_norm = ((ethics - 1) / 4 * 100).clip(0, 100)
    equity_norm = ((equity - 1) / 4 * 100).clip(0, 100)
    overall_norm = ((overall - 1) / 4 * 100).clip(0, 100)

    awareness = (0.30 * freq_norm + 0.30 * utility_norm + 0.20 * ethics_norm + 0.10 * equity_norm + 0.10 * overall_norm).clip(0, 100)

    _ht_col = _col(df, "AI tools help me understand difficult topics better.")
    _ht = _likert(df[_ht_col]) if _ht_col else pd.Series(dtype=float)
    _ek_col = _col(df, "Using AI to generate complete assignments without effort is unethical.  ")
    _ek = _likert(df[_ek_col]) if _ek_col else pd.Series(dtype=float)
    return {
        "n": len(df),
        "awareness": float(awareness.mean()),
        "freq_daily_pct": float((freq == 5).mean() * 100),
        "utility_mean": float(utility.mean()),
        "ethics_mean": float(ethics.mean()),
    "hard_topics_pct": float((_ht >= 4).sum() / max(_ht.notna().sum(), 1) * 100),
        "ethics_know_pct": float((_ek >= 4).sum() / max(_ek.notna().sum(), 1) * 100),
        "engagement_mean": float(pd.concat([_likert(df[c]) for c in [_col(df, "AI increases my interest and engagement in learning."), _col(df, "AI improves my motivation to study.")] if c], axis=1).mean().mean()) if any(_col(df, c) for c in ["AI increases my interest and engagement in learning.", "AI improves my motivation to study."]) else 3.0,
        "raw": {
            "freq": freq,
            "utility": utility,
            "ethics": ethics,
            "awareness": awareness,
        },
    }


def compute_teacher_scores(df: pd.DataFrame, student: dict) -> dict:
    df = _norm_cols(df)
    aware_col = _col(df, "Are you aware of AI tools used in education?")
    aware_map = {"yes, and i use them": 5, "yes, but i do not use them": 3, "no, i am not aware": 1}
    awareness = df[aware_col].astype(str).str.strip().str.lower().map(aware_map).fillna(1) if aware_col else pd.Series(3, index=df.index)

    freq_col = _col(df, "Frequency of AI Tool Usage")
    tfreq_map = {"everyday": 5, "a few times a week": 4, "occasionaly": 3, "occasionally": 3, "rarely": 2}
    tfreq = df[freq_col].astype(str).str.strip().str.lower().map(tfreq_map).fillna(1) if freq_col else pd.Series(3, index=df.index)

    will_col = _col(df, "Would you consider using AI with proper training?")
    will_map = {"yes": 5, "maybe": 3, "no": 1}
    willingness = df[will_col].astype(str).str.strip().str.lower().map(will_map).fillna(3) if will_col else pd.Series(3, index=df.index)

    support_col = _col(df, "What kind of support would encourage you to use AI tools in teaching?")
    support_df = _support_counts(df[support_col]) if support_col else pd.DataFrame(index=df.index)
    support_count = support_df.sum(axis=1) if not support_df.empty else pd.Series(0, index=df.index)
    support_coverage = (1 - support_count / 5).clip(0, 1) * 100
    training_support = _contains(df[support_col], "Formal training or workshops").astype(int) * 100 if support_col else pd.Series(0, index=df.index)
    technical_support = _contains(df[support_col], "Technical support from the institution").astype(int) * 100 if support_col else pd.Series(0, index=df.index)

    reg_col = _col(df, "Do you think the use of AI in education should be regulated through policies or guidelines?")
    reg_map = {
        "yes, strict regulations and clear policies are required": 5,
        "yes, basic guidelines are sufficient": 4,
        "no, regulation is not necessary": 2,
        "not sure / need more clarity": 3,
    }
    regulation = df[reg_col].astype(str).str.strip().str.lower().map(reg_map).fillna(3) if reg_col else pd.Series(3, index=df.index)

    curr_col = _col(df, "Should AI be integrated ethically into the formal teaching curriculum?")
    curr_map = {
        "yes, ai should be formally integrated with clear ethical guidelines": 5,
        "yes, but only as a supplementary tool, not a core part of the curriculum": 4,
        "no, ai should not be integrated into the formal curriculum": 2,
        "not sure / need more clarity": 3,
    }
    curriculum = df[curr_col].astype(str).str.strip().str.lower().map(curr_map).fillna(3) if curr_col else pd.Series(3, index=df.index)

    informed_col = _col(df, "Students should be clearly informed about ethical AI usage.")
    informed = _likert(df[informed_col]) if informed_col else pd.Series(3, index=df.index)

    plag_col = _col(df, "To what extent do you agree that AI encourages plagiarism among students?")
    plagiarism = pd.to_numeric(df[plag_col], errors="coerce").fillna(3) if plag_col else pd.Series(3, index=df.index)
    plagiarism_risk = ((5 - plagiarism) / 4 * 100).clip(0, 100)

    dep_col = _col(df, "Are you concerned about student dependency on AI?")
    dep_map = {"strongly agree": 1, "agree": 2, "neutral": 3, "disagree": 4, "strongly disagree": 5}
    dependency = df[dep_col].astype(str).str.strip().str.lower().map(dep_map).fillna(3) if dep_col else pd.Series(3, index=df.index)
    dependency_risk = ((dependency - 1) / 4 * 100).clip(0, 100)  # higher score = less concern

    creative_col = _col(df, "Excessive use of AI tools may negatively affect students creative thinking.")
    if not creative_col:
        creative_col = _col(df, "Excessive use of AI tools may negatively affect students")
    creative = df[creative_col].astype(str).str.strip().str.lower().map(dep_map).fillna(3) if creative_col else pd.Series(3, index=df.index)
    creative_risk = ((creative - 1) / 4 * 100).clip(0, 100)

    teacher_ethics = pd.concat(
        [
            _to_0_100(curriculum, fixed=True),
            _to_0_100(informed, fixed=True),
            plagiarism_risk,
            dependency_risk,
            creative_risk,
        ],
        axis=1,
    ).mean(axis=1)

    encourage_col = _col(df, "Do you encourage students to use AI?")
    enc_map = {"yes, without restrictions": 5, "yes, but with clear guidelines": 4, "i am unsure": 3, "no, i discourage it": 1}
    encourage = df[encourage_col].astype(str).str.strip().str.lower().map(enc_map).fillna(3) if encourage_col else pd.Series(3, index=df.index)

    engagement_col = _col(df, "AI improves student engagement.")
    engagement = _likert(df[engagement_col]) if engagement_col else pd.Series(3, index=df.index)

    student_engagement = pd.Series(student["engagement_mean"], index=df.index)

    helpful_col = _col(df, "Do you believe AI tools can be helpful for both students and teachers in education if used ethically?")
    def helpful_score(v):
        v = str(v).strip().lower()
        if v.startswith("yes"):
            return 5
        if "maybe" in v or "may be" in v or "can't say" in v or "not sure" in v:
            return 3
        if v.startswith("no"):
            return 1
        return 3
    helpful = df[helpful_col].map(helpful_score).fillna(3) if helpful_col else pd.Series(3, index=df.index)

    role_col = _col(df, "Do you believe AI will change the role of teachers in the future?")
    def role_score(v):
        v = str(v).strip().lower()
        if v.startswith("yes") or "definitely" in v or "possible" in v:
            return 5
        if "maybe" in v or "may be" in v or "na" == v:
            return 3
        if v.startswith("no") or "not really" in v:
            return 1
        return 3
    role_future = df[role_col].map(role_score).fillna(3) if role_col else pd.Series(3, index=df.index)

    # institution-level means
    teacher_training = (0.30 * _to_0_100(awareness, fixed=True)
                        + 0.20 * _to_0_100(tfreq, fixed=True)
                        + 0.25 * _to_0_100(willingness, fixed=True)
                        + 0.25 * training_support).clip(0, 100)

    policy = (0.60 * _to_0_100(regulation, fixed=True)
              + 0.40 * student["ethics_norm" if "ethics_norm" in student else "ethics_mean"]).clip(0, 100) if False else (0.60 * _to_0_100(regulation, fixed=True) + 0.40 * pd.Series(student["ethics_mean"] * 20, index=df.index).clip(0, 100)).clip(0, 100)

    technical = (0.50 * technical_support + 0.50 * pd.Series(student["freq_daily_pct"], index=df.index).clip(0, 100)).clip(0, 100)

    ethics = (0.50 * pd.Series(student["ethics_mean"] * 20, index=df.index).clip(0, 100)
              + 0.50 * teacher_ethics).clip(0, 100)

    institutional = (0.40 * support_coverage
                      + 0.30 * _to_0_100(encourage, fixed=True)
                      + 0.30 * pd.Series(student["engagement_mean"] * 20, index=df.index).clip(0, 100)).clip(0, 100)

    technical_rate = technical_support.mean() / 100.0
    budget = (0.60 * support_coverage + 0.40 * (100 - technical_rate * 100)).clip(0, 100)

    leadership = (0.40 * _to_0_100(curriculum, fixed=True)
                  + 0.30 * _to_0_100(regulation, fixed=True)
                  + 0.20 * _to_0_100(helpful, fixed=True)
                  + 0.10 * _to_0_100(role_future, fixed=True)).clip(0, 100)

    awareness = pd.Series(student["awareness"], index=df.index).clip(0, 100)

    dims = {
        "Teacher Training Level": float(teacher_training.mean()),
        "Policy Framework Clarity": float(policy.mean()),
        "Technical Infrastructure": float(technical.mean()),
        "Ethics Education Programs": float(ethics.mean()),
        "Institutional Support": float(institutional.mean()),
        "Budget Allocation": float(budget.mean() if hasattr(budget, "mean") else budget),
        "Student AI Awareness": float(awareness.mean()),
        "Leadership Commitment": float(leadership.mean()),
    }

    # institution-level friction inputs
    teacher_unaware_pct = float((df[aware_col].astype(str).str.strip().str.lower() == "no, i am not aware").mean() * 100) if aware_col else 0.0
    _cr = _likert(df[creative_col]) if creative_col else pd.Series(dtype=float)
    teacher_anxiety_pct = float((_cr >= 4).sum() / max(_cr.notna().sum(), 1) * 100)
    teacher_willingness_pct = float((df[curr_col].astype(str).str.strip().str.lower().isin(
        ["yes, ai should be formally integrated with clear ethical guidelines",
         "yes, but only as a supplementary tool, not a core part of the curriculum"])).mean() * 100) if curr_col else 0.0

    return {
        "n": len(df),
        "dims": dims,
        "teacher_unaware_pct": teacher_unaware_pct,
        "teacher_anxiety_pct": teacher_anxiety_pct,
        "teacher_willingness_pct": teacher_willingness_pct,
        "support_counts": support_df.sum().to_dict() if not support_df.empty else {},
    }


def compute_frictions(student: dict, teacher: dict) -> dict:
    student_daily = student["freq_daily_pct"]
    teacher_unaware = teacher["teacher_unaware_pct"]
    reality_gap = student_daily - teacher_unaware

    student_hard = student["hard_topics_pct"]
    teacher_anxiety = teacher["teacher_anxiety_pct"]
    value_gap = student_hard - teacher_anxiety

    student_ethics = student["ethics_know_pct"]
    teacher_willing = teacher["teacher_willingness_pct"]
    governance_gap = teacher_willing - student_ethics

    return {
        "reality": {
            "student_daily_use": student_daily,
            "teacher_unaware": teacher_unaware,
            "gap": reality_gap,
            "risk": student_daily >= 40 and teacher_unaware >= 20,
        },
        "value": {
            "student_hard_topics": student_hard,
            "teacher_anxiety": teacher_anxiety,
            "gap": value_gap,
            "risk": student_hard >= 70 and teacher_anxiety >= 50,
        },
        "governance": {
            "student_ethics": student_ethics,
            "teacher_willingness": teacher_willing,
            "gap": governance_gap,
            "risk": student_ethics >= 60 and teacher_willing >= 70,
        },
    }


def readiness_score(dims: dict) -> tuple[float, str, str]:
    vals = np.array([dims[d] for d in DIM_NAMES])
    score = float(np.dot(vals, WEIGHTS))
    if score < 25:
        status, label = "NOT_READY", "Not Ready"
    elif score < 50:
        status, label = "EMERGING", "Emerging"
    elif score < 75:
        status, label = "MODERATE", "Moderate"
    else:
        status, label = "MATURE", "Mature"
    return score, status, label


DIMENSION_DETAILS = {
    "Teacher Training Level": {
        "summary": "Measures how prepared faculty are to use AI in teaching, assessment, and research.",
        "why": "Teachers are the delivery layer of any AI policy. Without training, tools are either avoided or used unsafely.",
        "low": "Low scores indicate unawareness, irregular use, or lack of formal training. Prioritise basic AI literacy and prompt engineering.",
        "high": "High scores indicate confident, regular, policy-aware use. Move to advanced assessment redesign and peer mentoring.",
        "evidence": "Derived from teacher awareness, frequency of use, willingness to use with training, and demand for formal training.",
    },
    "Policy Framework Clarity": {
        "summary": "Measures whether the institution has clear, usable AI rules for students and faculty.",
        "why": "A policy vacuum creates inconsistent enforcement and shadow AI use.",
        "low": "Low scores indicate missing or unclear guidance. Publish a one-page citation compact and course-level AI policy.",
        "high": "High scores indicate clear, accepted rules. Focus on monitoring, review, and updates.",
        "evidence": "Derived from teacher regulation preferences and student awareness of unethical full-generation use.",
    },
    "Technical Infrastructure": {
        "summary": "Measures whether students and faculty can reliably access and use AI tools.",
        "why": "Access, identity, licensing, and support determine whether tools reach classrooms.",
        "low": "Low scores indicate access or support gaps. Audit licensing, identity, and help-desk workflows.",
        "high": "High scores indicate stable access. Focus on advanced integrations and analytics.",
        "evidence": "Derived from teacher requests for technical support and student frequency of AI use.",
    },
    "Ethics Education Programs": {
        "summary": "Measures whether ethics, integrity, and responsible AI use are taught explicitly.",
        "why": "Ethics education prevents misuse and builds defensible AI practice.",
        "low": "Low scores indicate missing ethics modules. Add a short AI ethics module to first-year courses.",
        "high": "High scores indicate embedded ethics. Expand case studies and discipline-specific guidance.",
        "evidence": "Derived from student ethical awareness and teacher support for ethical integration.",
    },
    "Institutional Support": {
        "summary": "Measures whether the institution actively supports AI adoption through guidance, examples, and encouragement.",
        "why": "Adoption stalls when users are left to figure out tools alone.",
        "low": "Low scores indicate weak support structures. Create guidelines, examples, and peer support channels.",
        "high": "High scores indicate strong support. Scale through communities of practice.",
        "evidence": "Derived from teacher support requests, encouragement of student use, and student engagement.",
    },
    "Budget Allocation": {
        "summary": "Estimates whether funding is sufficient to sustain AI adoption.",
        "why": "Budget constraints shape which interventions are realistic.",
        "low": "Low scores indicate funding pressure. Prioritise low-cost training and student-led initiatives.",
        "high": "High scores indicate capacity to invest. Fund infrastructure, training, and research.",
        "evidence": "Derived as a proxy from institutional support and technical support demand.",
    },
    "Student AI Awareness": {
        "summary": "Measures how actively and effectively students use AI for learning.",
        "why": "Students are often the fastest adopters; their behaviour reveals real institutional readiness.",
        "low": "Low scores indicate low awareness or irregular use. Introduce guided, ethical use in coursework.",
        "high": "High scores indicate strong student capability. Channel it into peer mentoring and research.",
        "evidence": "Derived from student frequency, utility, ethical awareness, equity, and overall rating.",
    },
    "Leadership Commitment": {
        "summary": "Measures whether leadership supports formal, ethical AI integration.",
        "why": "Sustained adoption requires visible institutional commitment.",
        "low": "Low scores indicate hesitation. Start with a pilot policy and clear owner.",
        "high": "High scores indicate strong commitment. Scale policy and publish best practices.",
        "evidence": "Derived from teacher support for formal integration, regulation, and belief in AI's value.",
    },
}


def action_plan(dims: dict, frictions: dict) -> list[dict]:
    plan = []

    def add(priority, title, dimension, why, evidence, action, owner, timeline):
        plan.append({
            "priority": priority,
            "title": title,
            "dimension": dimension,
            "why": why,
            "evidence": evidence,
            "action": action,
            "owner": owner,
            "timeline": timeline,
        })

    if frictions["reality"]["risk"]:
        add(
            "High",
            "Shadow AI Risk",
            "Teacher Training Level",
            "Students are using AI daily while many faculty remain unaware, creating unmanaged risk.",
            f"Students use AI daily: {frictions['reality']['student_daily_use']:.1f}%; teachers unaware: {frictions['reality']['teacher_unaware']:.1f}%.",
            "Run a two-session Basic AI Literacy FDP for all faculty, then a department-level follow-up.",
            "IQAC / HODs",
            "3-4 weeks",
        )
    if frictions["value"]["risk"]:
        add(
            "High",
            "Pedagogical Misalignment",
            "Ethics Education Programs",
            "Students use AI as a tutor for difficult topics, while teachers fear creativity loss. The institution needs a shared pedagogical model.",
            f"Students use AI for hard topics: {frictions['value']['student_hard_topics']:.1f}%; teachers fear creativity loss: {frictions['value']['teacher_anxiety']:.1f}%.",
            "Run Prompt Engineering for Assessment, redesign rubrics, and publish example AI-assisted assignments.",
            "Teaching-Learning Centre",
            "4-6 weeks",
        )
    if frictions["governance"]["risk"]:
        add(
            "High",
            "Policy Vacuum",
            "Policy Framework Clarity",
            "Both students and teachers want clear rules, but the institution has not formalised them.",
            f"Students know full-generation is unethical: {frictions['governance']['student_ethics']:.1f}%; teachers support formal integration: {frictions['governance']['teacher_willingness']:.1f}%.",
            "Publish a one-page citation compact and course-level AI policy, then add it to syllabi.",
            "IQAC / Registrar",
            "2-3 weeks",
        )
    if dims["Budget Allocation"] < 45 and dims["Student AI Awareness"] >= 60:
        add(
            "Medium",
            "Low Budget, High Student Competency",
            "Budget Allocation",
            "Budget is limited, but students already have strong AI capability.",
            f"Budget score: {dims['Budget Allocation']:.1f}; student awareness: {dims['Student AI Awareness']:.1f}.",
            "Create a Student-Led AI Taskforce for peer mentoring, faculty support, and low-cost pilots.",
            "Student Council / IQAC",
            "4 weeks",
        )
    if dims["Teacher Training Level"] < 50:
        add(
            "Medium",
            "Faculty Upskilling Needed",
            "Teacher Training Level",
            "Faculty capability is below the threshold needed for safe, effective AI use.",
            f"Teacher training score: {dims['Teacher Training Level']:.1f}.",
            "Run a mandatory blended FDP on AI pedagogy, assessment, and ethics.",
            "HR / Academic Coordinator",
            "4-6 weeks",
        )
    if dims["Ethics Education Programs"] < 50:
        add(
            "Medium",
            "Ethics Module Missing",
            "Ethics Education Programs",
            "Students lack structured guidance on responsible AI use.",
            f"Ethics score: {dims['Ethics Education Programs']:.1f}.",
            "Add a 2-hour AI ethics module to all first-year courses and publish citation examples.",
            "Curriculum Committee",
            "3-4 weeks",
        )
    if dims["Technical Infrastructure"] < 50:
        add(
            "Medium",
            "Infrastructure and Support Gap",
            "Technical Infrastructure",
            "Access or support gaps are limiting AI use.",
            f"Technical infrastructure score: {dims['Technical Infrastructure']:.1f}.",
            "Audit licensing, identity, device access, and help-desk workflows.",
            "IT Services",
            "3-5 weeks",
        )
    if dims["Leadership Commitment"] < 50:
        add(
            "Medium",
            "Leadership Commitment Needed",
            "Leadership Commitment",
            "Sustained adoption requires visible institutional commitment.",
            f"Leadership score: {dims['Leadership Commitment']:.1f}.",
            "Nominate an AI lead, approve a pilot policy, and set a quarterly review cadence.",
            "Principal / IQAC",
            "2-4 weeks",
        )
    if not plan:
        add(
            "Low",
            "Maintain and Scale",
            "Leadership Commitment",
            "No critical frictions or weak dimensions were detected.",
            "All dimensions and friction checks are within acceptable ranges.",
            "Sustain current practices, publish best practices, and review quarterly.",
            "IQAC",
            "Ongoing",
        )
    return plan
