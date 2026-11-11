import base64
import csv
import hashlib
import hmac
import io
import json
import os
import secrets
import sqlite3
import sys
import time
from datetime import date
from pathlib import Path

import joblib
import pandas as pd
from docx import Document
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fpdf import FPDF
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scoring import (  # noqa: E402
    DIM_NAMES,
    DIMENSION_DETAILS,
    compute_frictions,
    compute_student_scores,
    compute_teacher_scores,
    load_table,
    readiness_score,
    action_plan,
)

SAMPLE_STUDENT = Path("C:/Users/Monika/Downloads/Telegram Desktop/STUDENT QUESTIONNAIRE \u2014 AI in Education (Responses).xlsx")
SAMPLE_TEACHER = Path("C:/Users/Monika/Downloads/Telegram Desktop/_TEACHER QUESTIONNAIRE \u2014 AI in Education (Responses).xlsx")

app = FastAPI(title="IARS 2.0 API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = ROOT / "iars.db"
SECRET = os.environ.get("IARS_SECRET", "dev-secret-change-me")
security = HTTPBearer(auto_error=False)


def _db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = _db()
    conn.execute(
        """CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )"""
    )
    conn.commit()
    conn.close()


init_db()


def _hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
    return salt.hex() + ":" + dk.hex()


def _verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, dk_hex = stored.split(":")
    except ValueError:
        return False
    salt = bytes.fromhex(salt_hex)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
    return hmac.compare_digest(dk.hex(), dk_hex)


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _create_token(email: str) -> str:
    payload = {"sub": email, "exp": int(time.time()) + 86400 * 7}
    raw = json.dumps(payload, separators=(",", ":")).encode()
    sig = hmac.new(SECRET.encode(), raw, hashlib.sha256).digest()
    return _b64url_encode(raw) + "." + _b64url_encode(sig)


def _decode_token(token: str):
    try:
        raw_b64, sig_b64 = token.split(".")
        raw = _b64url_decode(raw_b64)
        sig = _b64url_decode(sig_b64)
        expected = hmac.new(SECRET.encode(), raw, hashlib.sha256).digest()
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(raw)
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


def current_user(creds: HTTPAuthorizationCredentials | None = Depends(security)):
    if not creds:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = _decode_token(creds.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    conn = _db()
    user = conn.execute("SELECT id, email, name, created_at FROM users WHERE email = ?", (payload["sub"],)).fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return dict(user)


class AuthPayload(BaseModel):
    email: str
    password: str
    name: str | None = None


class ManualDims(BaseModel):
    dims: dict[str, float]


@app.post("/register")
def register(payload: AuthPayload):
    email = payload.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    name = (payload.name or email.split("@")[0]).strip()
    conn = _db()
    try:
        conn.execute(
            "INSERT INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)",
            (email, name, _hash_password(payload.password), time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=409, detail="Email already registered")
    conn.close()
    return {"access_token": _create_token(email), "token_type": "bearer", "user": {"email": email, "name": name}}


@app.post("/login")
def login(payload: AuthPayload):
    email = payload.email.strip().lower()
    conn = _db()
    user = conn.execute("SELECT email, name, password_hash FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    if not user or not _verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": _create_token(email), "token_type": "bearer", "user": {"email": user["email"], "name": user["name"]}}


@app.get("/me")
def me(user: dict = Depends(current_user)):
    return {"user": user}


def read_upload(upload: UploadFile) -> pd.DataFrame:
    content = upload.file.read()
    buf = io.BytesIO(content)
    buf.name = upload.filename or "upload.csv"
    try:
        return load_table(buf)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse {upload.filename}: {exc}")


def analyze_frames(student_df, teacher_df):
    student = compute_student_scores(student_df) if student_df is not None else None
    if teacher_df is not None:
        fallback_student = student if student is not None else {"engagement_mean": 3.0, "ethics_mean": 3.0, "freq_daily_pct": 0.0, "awareness": 50.0}
        teacher = compute_teacher_scores(teacher_df, fallback_student)
    else:
        teacher = None

    if student is not None and teacher is not None:
        frictions = compute_frictions(student, teacher)
    else:
        frictions = {
            "reality": {"student_daily_use": student["freq_daily_pct"] if student else 0.0, "teacher_unaware": teacher["teacher_unaware_pct"] if teacher else 0.0, "gap": 0.0, "risk": False},
            "value": {"student_hard_topics": student["hard_topics_pct"] if student else 0.0, "teacher_anxiety": teacher["teacher_anxiety_pct"] if teacher else 0.0, "gap": 0.0, "risk": False},
            "governance": {"student_ethics": student["ethics_know_pct"] if student else 0.0, "teacher_willingness": teacher["teacher_willingness_pct"] if teacher else 0.0, "gap": 0.0, "risk": False},
        }

    if teacher is not None:
        dims = teacher["dims"].copy()
        if student is not None:
            dims["Student AI Awareness"] = student["awareness"]
    elif student is not None:
        dims = {
            "Teacher Training Level": 50.0,
            "Policy Framework Clarity": 50.0,
            "Technical Infrastructure": 50.0,
            "Ethics Education Programs": 50.0,
            "Institutional Support": 50.0,
            "Budget Allocation": 50.0,
            "Student AI Awareness": student["awareness"],
            "Leadership Commitment": 50.0,
        }
    else:
        dims = {d: 50.0 for d in DIM_NAMES}

    score, status, _ = readiness_score(dims)
    plan = action_plan(dims, frictions)

    institution = "Institution"
    if student_df is not None and "College/University" in student_df.columns and len(student_df):
        institution = str(student_df["College/University"].iloc[0])
    elif teacher_df is not None and "College/University" in teacher_df.columns and len(teacher_df):
        institution = str(teacher_df["College/University"].iloc[0])

    model_status = status
    try:
        bundle = joblib.load(ROOT / "models" / "iars_rf.joblib")
        model = bundle["model"]
        features = bundle["features"]
        model_status = str(model.predict([[dims[d] for d in features]])[0])
    except Exception:
        pass

    return {
        "institution": institution,
        "student": {
            "n": student["n"],
            "awareness": student["awareness"],
            "freq_daily_pct": student["freq_daily_pct"],
            "hard_topics_pct": student["hard_topics_pct"],
            "ethics_know_pct": student["ethics_know_pct"],
        } if student else None,
        "teacher": {
            "n": teacher["n"],
            "unaware_pct": teacher["teacher_unaware_pct"],
            "anxiety_pct": teacher["teacher_anxiety_pct"],
            "willingness_pct": teacher["teacher_willingness_pct"],
        } if teacher else None,
        "dims": dims,
        "frictions": frictions,
        "score": score,
        "status": status,
        "model_status": model_status,
        "plan": plan,
        "dimension_details": DIMENSION_DETAILS,
    }

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/dimensions")
def dimensions():
    return DIMENSION_DETAILS


@app.post("/analyze")
async def analyze(student: UploadFile | None = File(None), teacher: UploadFile | None = File(None)):
    if student is None and teacher is None:
        raise HTTPException(status_code=400, detail="At least one file required")
    student_df = read_upload(student) if student else None
    teacher_df = read_upload(teacher) if teacher else None
    return analyze_frames(student_df, teacher_df)


@app.get("/sample")
def sample():
    if not (SAMPLE_STUDENT.exists() and SAMPLE_TEACHER.exists()):
        raise HTTPException(status_code=404, detail="Sample files not found")
    student_df = load_table(str(SAMPLE_STUDENT))
    teacher_df = load_table(str(SAMPLE_TEACHER))
    return analyze_frames(student_df, teacher_df)


@app.post("/manual")
def manual(payload: ManualDims):
    dims = {d: float(payload.dims.get(d, 50.0)) for d in DIM_NAMES}
    for d in dims:
        dims[d] = max(0.0, min(100.0, dims[d]))
    score, status, _ = readiness_score(dims)
    model_status = status
    try:
        bundle = joblib.load(ROOT / "models" / "iars_rf.joblib")
        model = bundle["model"]
        features = bundle["features"]
        model_status = str(model.predict([[dims[d] for d in features]])[0])
    except Exception:
        pass
    dummy_frictions = {
        "reality": {"student_daily_use": 0.0, "teacher_unaware": 0.0, "gap": 0.0, "risk": False},
        "value": {"student_hard_topics": 0.0, "teacher_anxiety": 0.0, "gap": 0.0, "risk": False},
        "governance": {"student_ethics": 0.0, "teacher_willingness": 0.0, "gap": 0.0, "risk": False},
    }
    plan = action_plan(dims, dummy_frictions)
    return {"dims": dims, "score": score, "status": status, "model_status": model_status, "plan": plan, "dimension_details": DIMENSION_DETAILS}


def _make_pdf(data: dict) -> bytes:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "IARS 2.0 - Institutional AI Readiness Report", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"Institution: {data['institution']}", ln=True)
    pdf.cell(0, 6, f"Date: {date.today().isoformat()}", ln=True)
    pdf.cell(0, 6, f"Readiness Score: {data['score']:.1f}/100 ({data['status'].replace('_', ' ')})", ln=True)
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Dimension Scores", ln=True)
    pdf.set_font("Helvetica", "", 10)
    for d in DIM_NAMES:
        pdf.cell(0, 6, f"  {d}: {data['dims'][d]:.1f}", ln=True)
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Dimension Explanations", ln=True)
    pdf.set_font("Helvetica", "", 9)
    for d in DIM_NAMES:
        det = data["dimension_details"][d]
        pdf.set_x(pdf.l_margin)
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, 5, f"{d}: {det['summary']} Low: {det['low']} High: {det['high']}")
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Friction Index", ln=True)
    pdf.set_font("Helvetica", "", 10)
    f = data["frictions"]
    pdf.cell(0, 6, f"  Reality Gap: students daily use {f['reality']['student_daily_use']:.1f}% vs teachers unaware {f['reality']['teacher_unaware']:.1f}% (gap {f['reality']['gap']:+.1f})", ln=True)
    pdf.cell(0, 6, f"  Value Gap: students use AI for hard topics {f['value']['student_hard_topics']:.1f}% vs teachers fear creativity loss {f['value']['teacher_anxiety']:.1f}% (gap {f['value']['gap']:+.1f})", ln=True)
    pdf.cell(0, 6, f"  Governance Gap: students know full-generation is unethical {f['governance']['student_ethics']:.1f}% vs teachers support formal integration {f['governance']['teacher_willingness']:.1f}% (gap {f['governance']['gap']:+.1f})", ln=True)
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Recommended Actions", ln=True)
    pdf.set_font("Helvetica", "", 10)
    for i, a in enumerate(data["plan"], 1):
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, 6, f"{i}. [{a['priority']}] {a['title']} ({a['dimension']})")
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, 5, f"   Why: {a['why']}")
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, 5, f"   Evidence: {a['evidence']}")
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, 5, f"   Action: {a['action']}")
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, 5, f"   Owner: {a['owner']} | Timeline: {a['timeline']}")
        pdf.ln(2)
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "UGC-Ready Syllabus Clause (copy-paste)", ln=True)
    pdf.set_font("Helvetica", "", 10)
    clause = ("Students may use AI tools as a learning aid. Any AI-generated content submitted as "
              "coursework must be clearly cited (tool, prompt, and date). Generating complete "
              "assignments without substantial student effort is prohibited. Faculty will provide "
              "examples of ethical and effective AI use during the first two weeks of the course.")
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(0, 6, clause)
    return bytes(pdf.output(dest="S"))


def _make_csv(data: dict) -> bytes:
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["IARS 2.0 Detailed Report"])
    writer.writerow(["Institution", data["institution"]])
    writer.writerow(["Readiness Score", f"{data['score']:.1f}"])
    writer.writerow(["Status", data["status"].replace("_", " ")])
    writer.writerow([])
    writer.writerow(["Dimension", "Score", "Summary", "Low", "High"])
    for d in DIM_NAMES:
        det = data["dimension_details"][d]
        writer.writerow([d, f"{data['dims'][d]:.1f}", det["summary"], det["low"], det["high"]])
    writer.writerow([])
    writer.writerow(["Priority", "Title", "Dimension", "Why", "Evidence", "Action", "Owner", "Timeline"])
    for a in data["plan"]:
        writer.writerow([a["priority"], a["title"], a["dimension"], a["why"], a["evidence"], a["action"], a["owner"], a["timeline"]])
    if "frictions" in data:
        f = data["frictions"]
        writer.writerow([])
        writer.writerow(["Friction", "Student", "Teacher", "Gap", "Risk"])
        writer.writerow(["Reality", f["reality"]["student_daily_use"], f["reality"]["teacher_unaware"], f["reality"]["gap"], f["reality"]["risk"]])
        writer.writerow(["Value", f["value"]["student_hard_topics"], f["value"]["teacher_anxiety"], f["value"]["gap"], f["value"]["risk"]])
        writer.writerow(["Governance", f["governance"]["student_ethics"], f["governance"]["teacher_willingness"], f["governance"]["gap"], f["governance"]["risk"]])
    return out.getvalue().encode("utf-8")


def _make_docx(data: dict) -> bytes:
    doc = Document()
    doc.add_heading("IARS 2.0 - Institutional AI Readiness Report", 0)
    doc.add_paragraph(f"Institution: {data['institution']}")
    doc.add_paragraph(f"Date: {date.today().isoformat()}")
    doc.add_paragraph(f"Readiness Score: {data['score']:.1f}/100 ({data['status'].replace('_', ' ')})")
    doc.add_heading("Dimension Scores", level=1)
    for d in DIM_NAMES:
        doc.add_paragraph(f"{d}: {data['dims'][d]:.1f}", style="List Bullet")
    doc.add_heading("Dimension Explanations", level=1)
    for d in DIM_NAMES:
        det = data["dimension_details"][d]
        doc.add_paragraph(f"{d}: {det['summary']}", style="List Bullet")
        doc.add_paragraph(f"Low: {det['low']}")
        doc.add_paragraph(f"High: {det['high']}")
    doc.add_heading("Friction Index", level=1)
    f = data["frictions"]
    doc.add_paragraph(f"Reality Gap: students daily use {f['reality']['student_daily_use']:.1f}% vs teachers unaware {f['reality']['teacher_unaware']:.1f}% (gap {f['reality']['gap']:+.1f})")
    doc.add_paragraph(f"Value Gap: students use AI for hard topics {f['value']['student_hard_topics']:.1f}% vs teachers fear creativity loss {f['value']['teacher_anxiety']:.1f}% (gap {f['value']['gap']:+.1f})")
    doc.add_paragraph(f"Governance Gap: students know full-generation is unethical {f['governance']['student_ethics']:.1f}% vs teachers support formal integration {f['governance']['teacher_willingness']:.1f}% (gap {f['governance']['gap']:+.1f})")
    doc.add_heading("Detailed Action Plan", level=1)
    for i, a in enumerate(data["plan"], 1):
        doc.add_paragraph(f"{i}. [{a['priority']}] {a['title']} ({a['dimension']})", style="List Number")
        doc.add_paragraph(f"Why: {a['why']}")
        doc.add_paragraph(f"Evidence: {a['evidence']}")
        doc.add_paragraph(f"Action: {a['action']}")
        doc.add_paragraph(f"Owner: {a['owner']} | Timeline: {a['timeline']}")
    doc.add_heading("UGC-Ready Syllabus Clause", level=1)
    clause = ("Students may use AI tools as a learning aid. Any AI-generated content submitted as "
              "coursework must be clearly cited (tool, prompt, and date). Generating complete "
              "assignments without substantial student effort is prohibited. Faculty will provide "
              "examples of ethical and effective AI use during the first two weeks of the course.")
    doc.add_paragraph(clause)
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.getvalue()


@app.post("/report/pdf")
async def report_pdf(student: UploadFile | None = File(None), teacher: UploadFile | None = File(None), user: dict = Depends(current_user)):
    data = analyze_frames(read_upload(student) if student else None, read_upload(teacher) if teacher else None)
    return StreamingResponse(io.BytesIO(_make_pdf(data)), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=IARS_detailed_report.pdf"})


@app.post("/report/csv")
async def report_csv(student: UploadFile | None = File(None), teacher: UploadFile | None = File(None), user: dict = Depends(current_user)):
    data = analyze_frames(read_upload(student) if student else None, read_upload(teacher) if teacher else None)
    return StreamingResponse(io.BytesIO(_make_csv(data)), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=IARS_detailed_report.csv"})


@app.post("/report/docx")
async def report_docx(student: UploadFile | None = File(None), teacher: UploadFile | None = File(None), user: dict = Depends(current_user)):
    data = analyze_frames(read_upload(student) if student else None, read_upload(teacher) if teacher else None)
    return StreamingResponse(io.BytesIO(_make_docx(data)), media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={"Content-Disposition": "attachment; filename=IARS_detailed_report.docx"})



@app.post("/report/manual/pdf")
def report_manual_pdf(payload: ManualDims, user: dict = Depends(current_user)):
    dims = {d: float(payload.dims.get(d, 50.0)) for d in DIM_NAMES}
    for d in dims:
        dims[d] = max(0.0, min(100.0, dims[d]))
    score, status, _ = readiness_score(dims)
    model_status = status
    try:
        bundle = joblib.load(ROOT / "models" / "iars_rf.joblib")
        model = bundle["model"]
        features = bundle["features"]
        model_status = str(model.predict([[dims[d] for d in features]])[0])
    except Exception:
        pass
    dummy_frictions = {
        "reality": {"student_daily_use": 0.0, "teacher_unaware": 0.0, "gap": 0.0, "risk": False},
        "value": {"student_hard_topics": 0.0, "teacher_anxiety": 0.0, "gap": 0.0, "risk": False},
        "governance": {"student_ethics": 0.0, "teacher_willingness": 0.0, "gap": 0.0, "risk": False},
    }
    data = {
        "institution": "Manual entry",
        "dims": dims,
        "score": score,
        "status": status,
        "model_status": model_status,
        "plan": action_plan(dims, dummy_frictions),
        "dimension_details": DIMENSION_DETAILS,
        "frictions": dummy_frictions,
    }
    return StreamingResponse(io.BytesIO(_make_pdf(data)), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=IARS_manual_report.pdf"})


@app.post("/report/manual/csv")
def report_manual_csv(payload: ManualDims, user: dict = Depends(current_user)):
    dims = {d: float(payload.dims.get(d, 50.0)) for d in DIM_NAMES}
    for d in dims:
        dims[d] = max(0.0, min(100.0, dims[d]))
    score, status, _ = readiness_score(dims)
    dummy_frictions = {
        "reality": {"student_daily_use": 0.0, "teacher_unaware": 0.0, "gap": 0.0, "risk": False},
        "value": {"student_hard_topics": 0.0, "teacher_anxiety": 0.0, "gap": 0.0, "risk": False},
        "governance": {"student_ethics": 0.0, "teacher_willingness": 0.0, "gap": 0.0, "risk": False},
    }
    data = {
        "institution": "Manual entry",
        "dims": dims,
        "score": score,
        "status": status,
        "model_status": status,
        "plan": action_plan(dims, dummy_frictions),
        "dimension_details": DIMENSION_DETAILS,
        "frictions": dummy_frictions,
    }
    return StreamingResponse(io.BytesIO(_make_csv(data)), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=IARS_manual_report.csv"})


@app.post("/report/manual/docx")
def report_manual_docx(payload: ManualDims, user: dict = Depends(current_user)):
    dims = {d: float(payload.dims.get(d, 50.0)) for d in DIM_NAMES}
    for d in dims:
        dims[d] = max(0.0, min(100.0, dims[d]))
    score, status, _ = readiness_score(dims)
    dummy_frictions = {
        "reality": {"student_daily_use": 0.0, "teacher_unaware": 0.0, "gap": 0.0, "risk": False},
        "value": {"student_hard_topics": 0.0, "teacher_anxiety": 0.0, "gap": 0.0, "risk": False},
        "governance": {"student_ethics": 0.0, "teacher_willingness": 0.0, "gap": 0.0, "risk": False},
    }
    data = {
        "institution": "Manual entry",
        "dims": dims,
        "score": score,
        "status": status,
        "model_status": status,
        "plan": action_plan(dims, dummy_frictions),
        "dimension_details": DIMENSION_DETAILS,
        "frictions": dummy_frictions,
    }
    return StreamingResponse(io.BytesIO(_make_docx(data)), media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={"Content-Disposition": "attachment; filename=IARS_manual_report.docx"})
    student_df = read_upload(student) if student else None

