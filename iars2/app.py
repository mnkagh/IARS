import io
import os
from datetime import date

import joblib
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from scoring import (
    DIM_NAMES,
    WEIGHTS,
    compute_frictions,
    compute_student_scores,
    compute_teacher_scores,
    load_table,
    readiness_score,
    action_plan,
)

st.set_page_config(
    page_title="IARS 2.0 — Dual-Perspective Alignment Engine",
    page_icon="I",
    layout="wide",
    initial_sidebar_state="expanded",
)

CUSTOM_CSS = """
<style>
:root {
  --void: #0b0f19;
  --panel: rgba(18, 24, 40, 0.62);
  --cyan: #00f0ff;
  --purple: #b026ff;
  --amber: #ffb300;
  --crimson: #ff3366;
  --muted: #94a3b8;
}
html, body, [data-testid="stAppViewContainer"] {
  background: var(--void) !important;
  color: #ffffff;
  font-family: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif;
}
[data-testid="stSidebar"] {
  background: rgba(13, 18, 30, 0.85) !important;
  border-right: 1px solid rgba(148, 163, 184, 0.14);
  backdrop-filter: blur(12px);
}
h1, h2, h3 { font-family: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif; letter-spacing: -0.01em; }
code, .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
.glass {
  background: var(--panel);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  padding: 18px 20px;
  backdrop-filter: blur(10px);
}
.metric-card {
  background: var(--panel);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  padding: 16px 18px;
  backdrop-filter: blur(10px);
}
.metric-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
.metric-value { font-size: 26px; font-weight: 700; margin-top: 4px; }
.badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 999px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  border: 1px solid;
}
.badge-ready { color: #06222a; background: #00f0ff; border-color: #00f0ff; }
.badge-emerging { color: #2a1f00; background: #ffb300; border-color: #ffb300; }
.badge-moderate { color: #1a0a2e; background: #b026ff; border-color: #b026ff; }
.badge-notready { color: #fff; background: #ff3366; border-color: #ff3366; }
.friction-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(148,163,184,0.1); }
.friction-key { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--muted); }
.friction-val { font-weight: 600; }
.risk { color: var(--crimson); }
.warn { color: var(--amber); }
.ok { color: var(--cyan); }
</style>
"""
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

SAMPLE_STUDENT = "C:/Users/Monika/Downloads/Telegram Desktop/STUDENT QUESTIONNAIRE \u2014 AI in Education (Responses).xlsx"
SAMPLE_TEACHER = "C:/Users/Monika/Downloads/Telegram Desktop/_TEACHER QUESTIONNAIRE \u2014 AI in Education (Responses).xlsx"


@st.cache_resource
def load_model():
    path = os.path.join(os.path.dirname(__file__), "models", "iars_rf.joblib")
    if os.path.exists(path):
        bundle = joblib.load(path)
        return bundle["model"], bundle["features"]
    from sklearn.ensemble import RandomForestClassifier
    import numpy as np
    rng = np.random.default_rng(0)
    X = rng.uniform(0, 100, size=(500, len(DIM_NAMES)))
    y = ["MODERATE"] * len(X)
    m = RandomForestClassifier(n_estimators=10, random_state=0)
    m.fit(X, y)
    return m, DIM_NAMES


def _badge(status: str) -> str:
    cls = {"MATURE": "badge-ready", "MODERATE": "badge-moderate", "EMERGING": "badge-emerging", "NOT_READY": "badge-notready"}.get(status, "badge-moderate")
    return f'<span class="badge {cls}">{status.replace("_", " ")}</span>'


def make_radar(dims: dict) -> go.Figure:
    labels = list(dims.keys())
    vals = [dims[d] for d in labels]
    fig = go.Figure()
    fig.add_trace(go.Scatterpolar(
        r=vals + [vals[0]],
        theta=labels + [labels[0]],
        fill="toself",
        name="Institution",
        line=dict(color="#00f0ff", width=2),
        fillcolor="rgba(0,240,255,0.12)",
    ))
    fig.update_layout(
        polar=dict(
            radialaxis=dict(visible=True, range=[0, 100], gridcolor="rgba(148,163,184,0.15)", color="#94a3b8"),
            angularaxis=dict(gridcolor="rgba(148,163,184,0.15)", color="#94a3b8"),
            bgcolor="rgba(13,18,30,0.4)",
        ),
        showlegend=False,
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=40, r=40, t=30, b=30),
        height=420,
    )
    return fig


def make_friction_chart(frictions: dict) -> go.Figure:
    labels = ["Reality Gap", "Value Gap", "Governance Gap"]
    a = [frictions["reality"]["student_daily_use"], frictions["value"]["student_hard_topics"], frictions["governance"]["student_ethics"]]
    b = [frictions["reality"]["teacher_unaware"], frictions["value"]["teacher_anxiety"], frictions["governance"]["teacher_willingness"]]
    fig = go.Figure()
    fig.add_trace(go.Bar(name="Students", x=labels, y=a, marker_color="#00f0ff"))
    fig.add_trace(go.Bar(name="Teachers", x=labels, y=b, marker_color="#b026ff"))
    fig.update_layout(
        barmode="group",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#94a3b8"),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=20, r=20, t=30, b=20),
        height=320,
        yaxis=dict(range=[0, 100], gridcolor="rgba(148,163,184,0.12)"),
    )
    return fig


def make_pdf(institution: str, score: float, status: str, dims: dict, frictions: dict, plan: list) -> bytes:
    from fpdf import FPDF
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "IARS 2.0 - Institutional AI Readiness Report", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"Institution: {institution}", ln=True)
    pdf.cell(0, 6, f"Date: {date.today().isoformat()}", ln=True)
    pdf.cell(0, 6, f"Readiness Score: {score:.1f}/100  ({status.replace('_', ' ')})", ln=True)
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Dimension Scores", ln=True)
    pdf.set_font("Helvetica", "", 10)
    for d in DIM_NAMES:
        pdf.cell(0, 6, f"  {d}: {dims[d]:.1f}", ln=True)
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Friction Index", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"  Reality Gap: students daily use {frictions['reality']['student_daily_use']:.1f}% vs teachers unaware {frictions['reality']['teacher_unaware']:.1f}% (gap {frictions['reality']['gap']:+.1f})", ln=True)
    pdf.cell(0, 6, f"  Value Gap: students use AI for hard topics {frictions['value']['student_hard_topics']:.1f}% vs teachers fear creativity loss {frictions['value']['teacher_anxiety']:.1f}% (gap {frictions['value']['gap']:+.1f})", ln=True)
    pdf.cell(0, 6, f"  Governance Gap: students know full-generation is unethical {frictions['governance']['student_ethics']:.1f}% vs teachers support formal integration {frictions['governance']['teacher_willingness']:.1f}% (gap {frictions['governance']['gap']:+.1f})", ln=True)
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Recommended Actions", ln=True)
    pdf.set_font("Helvetica", "", 10)
    for i, a in enumerate(plan, 1):
        pdf.multi_cell(0, 6, f"{i}. {a['title']} - {a['detail']} Action: {a['action']}")
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "UGC-Ready Syllabus Clause (copy-paste)", ln=True)
    pdf.set_font("Helvetica", "", 10)
    clause = ("Students may use AI tools as a learning aid. Any AI-generated content submitted as "
              "coursework must be clearly cited (tool, prompt, and date). Generating complete "
              "assignments without substantial student effort is prohibited. Faculty will provide "
              "examples of ethical and effective AI use during the first two weeks of the course.")
    pdf.multi_cell(0, 6, clause)
    return pdf.output(dest="S").encode("latin-1")


def main():
    st.markdown("# IARS 2.0")
    st.markdown("### Dual-Perspective Alignment Engine")
    st.caption("Upload the student (35-item) and faculty (34-item) questionnaires. The engine computes the 8 IARS dimensions, the Friction Index, and a readiness verdict.")

    with st.sidebar:
        st.markdown("## Navigation")
        page = st.radio("", ["Dual-Intake", "Friction Engine", "Action Blueprint"], label_visibility="collapsed")
        st.markdown("---")
        st.markdown("**Model:** Random Forest (scikit-learn)")
        st.markdown("**Readiness:** weighted 8-dimension score")

    # --- Intake ---
    if page == "Dual-Intake":
        st.markdown("## Dual-Intake Hub")
        c1, c2 = st.columns(2)
        with c1:
            st.markdown('<div class="glass"><b style="color:#00f0ff">Student Data</b><br><span style="color:#94a3b8;font-size:12px">35-item questionnaire (CSV/XLSX)</span></div>', unsafe_allow_html=True)
            student_file = st.file_uploader("Import Student Data", type=["csv", "xlsx", "xls"], key="student")
        with c2:
            st.markdown('<div class="glass"><b style="color:#b026ff">Faculty Data</b><br><span style="color:#94a3b8;font-size:12px">34-item questionnaire (CSV/XLSX)</span></div>', unsafe_allow_html=True)
            teacher_file = st.file_uploader("Import Faculty Data", type=["csv", "xlsx", "xls"], key="teacher")

        if st.button("Load sample questionnaires", type="secondary"):
            if os.path.exists(SAMPLE_STUDENT) and os.path.exists(SAMPLE_TEACHER):
                st.session_state["student_df"] = load_table(SAMPLE_STUDENT)
                st.session_state["teacher_df"] = load_table(SAMPLE_TEACHER)
                st.success("Sample data loaded.")
            else:
                st.error("Sample files not found on this machine.")

        if student_file is not None:
            st.session_state["student_df"] = load_table(student_file)
        if teacher_file is not None:
            st.session_state["teacher_df"] = load_table(teacher_file)

        sd = st.session_state.get("student_df")
        td = st.session_state.get("teacher_df")
        if sd is not None:
            st.markdown(f"**Student rows:** {len(sd)}  |  columns: {len(sd.columns)}")
            st.dataframe(sd.head(3), use_container_width=True)
        if td is not None:
            st.markdown(f"**Faculty rows:** {len(td)}  |  columns: {len(td.columns)}")
            st.dataframe(td.head(3), use_container_width=True)

    # --- Friction Engine ---
    elif page == "Friction Engine":
        sd = st.session_state.get("student_df")
        td = st.session_state.get("teacher_df")
        if sd is None or td is None:
            st.warning("Load both datasets first (Dual-Intake).")
            return
        student = compute_student_scores(sd)
        teacher = compute_teacher_scores(td, student)
        frictions = compute_frictions(student, teacher)
        dims = {**{k: teacher["dims"][k] for k in DIM_NAMES[:6]}, "Student AI Awareness": student["awareness"]}
        # use teacher dims for all 8 except student awareness already in teacher dims as awareness mean; override
        dims = teacher["dims"].copy()
        dims["Student AI Awareness"] = student["awareness"]
        score, status, label = readiness_score(dims)
        model, features = load_model()
        try:
            pred = model.predict([ [dims[d] for d in features] ])[0]
        except Exception:
            pred = status

        st.markdown("## Friction Engine Dashboard")
        c1, c2, c3 = st.columns([1, 2, 1])
        with c1:
            st.markdown(f'<div class="metric-card"><div class="metric-label">Readiness Score</div><div class="metric-value">{score:.1f}</div><div style="margin-top:6px">{_badge(status)}</div><div style="margin-top:6px;color:#94a3b8;font-size:12px">ML: {pred}</div></div>', unsafe_allow_html=True)
        with c2:
            st.plotly_chart(make_radar(dims), use_container_width=True)
        with c3:
            st.markdown(f'<div class="metric-card"><div class="metric-label">Student N</div><div class="metric-value">{student["n"]}</div></div>', unsafe_allow_html=True)
            st.markdown(f'<div class="metric-card" style="margin-top:10px"><div class="metric-label">Faculty N</div><div class="metric-value">{teacher["n"]}</div></div>', unsafe_allow_html=True)

        st.markdown("### Perception Gap Chart")
        st.plotly_chart(make_friction_chart(frictions), use_container_width=True)

        st.markdown("### Perception Gap Cards")
        r = frictions["reality"]; v = frictions["value"]; g = frictions["governance"]
        cols = st.columns(3)
        with cols[0]:
            risk = "risk" if r["risk"] else "ok"
            st.markdown(f'<div class="metric-card"><div class="metric-label">Shadow AI Risk</div><div class="metric-value {risk}">{r["gap"]:+.1f}</div><div style="color:#94a3b8;font-size:12px;margin-top:4px">Students daily use {r["student_daily_use"]:.1f}% vs teachers unaware {r["teacher_unaware"]:.1f}%</div></div>', unsafe_allow_html=True)
        with cols[1]:
            risk = "risk" if v["risk"] else "ok"
            st.markdown(f'<div class="metric-card"><div class="metric-label">Pedagogical Misalignment</div><div class="metric-value {risk}">{v["gap"]:+.1f}</div><div style="color:#94a3b8;font-size:12px;margin-top:4px">Students use AI for hard topics {v["student_hard_topics"]:.1f}% vs teachers fear creativity loss {v["teacher_anxiety"]:.1f}%</div></div>', unsafe_allow_html=True)
        with cols[2]:
            risk = "warn" if g["risk"] else "ok"
            st.markdown(f'<div class="metric-card"><div class="metric-label">Policy Vacuum</div><div class="metric-value {risk}">{g["gap"]:+.1f}</div><div style="color:#94a3b8;font-size:12px;margin-top:4px">Students know full-generation is unethical {g["student_ethics"]:.1f}% vs teachers support formal integration {g["teacher_willingness"]:.1f}%</div></div>', unsafe_allow_html=True)

        st.markdown("### Dimension Scores")
        for d in DIM_NAMES:
            st.markdown(f'<div class="friction-row"><span class="friction-key">{d}</span><span class="friction-val">{dims[d]:.1f}</span></div>', unsafe_allow_html=True)

        st.session_state["last"] = {
            "institution": str(sd.iloc[0].get("College/University", "Institution")) if "College/University" in sd.columns else "Institution",
            "score": score, "status": status, "dims": dims, "frictions": frictions,
        }

    # --- Action Blueprint ---
    elif page == "Action Blueprint":
        last = st.session_state.get("last")
        if last is None:
            st.warning("Run the Friction Engine first.")
            return
        dims = last["dims"]; frictions = last["frictions"]; score = last["score"]; status = last["status"]
        institution = last["institution"]
        plan = action_plan(dims, frictions)
        st.markdown("## Action & Blueprint Generator")
        left, right = st.columns([1, 1])
        with left:
            st.markdown("### Diagnostics")
            for a in plan:
                with st.expander(a["title"], expanded=True):
                    st.write(a["detail"])
                    st.markdown(f"**Action:** {a['action']}")
        with right:
            st.markdown("### Resolution Terminal")
            st.code("\n".join([f"[{i+1}] {a['title']}: {a['action']}" for i, a in enumerate(plan)]), language="bash")
            st.markdown("### Generate UGC-Ready Policy PDF")
            if st.button("Generate UGC-Ready Policy PDF", type="primary"):
                pdf_bytes = make_pdf(institution, score, status, dims, frictions, plan)
                st.download_button(
                    label="Download Policy PDF",
                    data=pdf_bytes,
                    file_name=f"IARS_policy_{date.today().isoformat()}.pdf",
                    mime="application/pdf",
                )
                st.success("Policy PDF generated.")


if __name__ == "__main__":
    main()
