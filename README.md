# IARS — Institutional AI Readiness Scale

> **ML-Based Assessment Tool** • **SDG 4 Aligned** • **Secure by Design — Not Vibecoded**

Institutional AI Adoption Readiness assessment across 8 dimensions with weighted scoring, gap analysis, and actionable recommendations. Production-grade monorepo with hardened security, PostgreSQL (or MongoDB), JWT httpOnly cookies, and full audit trails.

![Stack](https://img.shields.io/badge/Stack-Node_Express_Prisma-667eea) ![Security](https://img.shields.io/badge/Security-Helmet_JWT_Zod RateLimit-green) ![DB](https://img.shields.io/badge/DB-PostgreSQL|MongoDB-blue)

Live reference UI: single-page HTML with 8 sliders → migrated to secure full-stack app.

---

## 8 Dimensions & Weights

| # | Dimension | Weight |
|---|-----------|--------|
|1|Teacher Training Level|0.15|
|2|Policy Framework Clarity|0.15|
|3|Technical Infrastructure|0.10|
|4|Ethics Education Programs|0.12|
|5|Institutional Support|0.15|
|6|Budget Allocation|0.10|
|7|Student AI Awareness|0.12|
|8|Leadership Commitment|0.11|

**Score** = Σ(dimension × weight) rounded. **Status**: Not Ready <25, Emerging <50, Moderate <75, Mature ≥75.

## Architecture

```
IARS/
├── backend/  (Express + TypeScript + Prisma + PostgreSQL/MongoDB)
│   ├── src/config/env.ts      # Zod fail-fast env validation
│   ├── src/middleware/         # auth (JWT), validate (Zod), rateLimiter, error
│   ├── src/modules/auth/       # register/login/refresh with bcrypt12 + lockout
│   ├── src/modules/assessments/ # scoring engine, CRUD, stats, preview
│   ├── src/utils/scoring.ts    # deterministic weighted ML model
│   └── prisma/schema.prisma    # User, Institution, Assessment, RefreshToken, AuditLog
├── frontend/ (Vite + React + Tailwind + Chart.js + Zustand + Axios)
│   ├── src/pages/Assessment.tsx # 8 sliders + Radar + Gap + Recommendations
│   ├── src/lib/api.ts          # withCredentials + 401 refresh queue
│   └── src/store/auth.ts
├── docker-compose.yml
└── .env.example
```

## Security Checklist (Why not vibecoded)

- **Env validation** via Zod at startup — refuses to run with weak/missing secrets
- **Helmet** with CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`
- **CORS** whitelist from `CORS_ORIGIN` (no `*`)
- **Payload limit** 10kb, `hpp`, `xss-clean`, `mongoSanitize`
- **Rate limiting**: global 100/15min, auth 5/15min, assessments 20/min
- **Validation**: Zod schemas on every input, max lengths, int 0-100
- **Passwords**: bcrypt cost 12 + complexity regex (upper/lower/number/special)
- **Auth**: JWT access 15m + refresh 7d, **httpOnly Secure SameSite=Strict cookies**, SHA256 hashed refresh tokens in DB, rotation on refresh, revocation on logout
- **Account lockout**: 5 failed → 15 min lock
- **Prisma ORM** → no SQL injection; no raw queries
- **RBAC**: USER / ADMIN / REVIEWER, owner-or-admin guards
- **Audit logs** for register/login/assessment create/delete
- **Error handler** never leaks stack in production; Prisma & JWT mapped to safe messages
- **Docker**: multi-stage, non-root `appuser`, minimal Alpine
- **Cookies**: httpOnly, Secure in prod, SameSite Strict

## Quick Start

### 1) Prereqs
Node 18+, Docker (for postgres), `openssl rand -hex 32` for secrets.

### 2) Env
```bash
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, COOKIE_SECRET
# Generate: openssl rand -hex 32
```

### 3) DB (PostgreSQL recommended)
```bash
docker compose up -d postgres
# Or local postgres: create db iars_db user iars_user

# Mongo alternative: change prisma/schema.prisma provider to "mongodb", update DATABASE_URL, run:
docker compose --profile mongo up -d mongo
```

### 4) Backend
```bash
cd backend
npm ci
npx prisma generate
npx prisma migrate dev --name init   # creates tables
npm run seed   # admin@iars.local / Admin@12345, demo@iars.local / Demo@12345
npm run dev    # http://localhost:4000
```

### 5) Frontend
```bash
cd frontend
npm ci
# set VITE_API_URL in .env if needed (default http://localhost:4000/api/v1)
npm run dev    # http://localhost:5173
```

### 6) Docker full stack
```bash
docker compose up --build
# frontend http://localhost:5173, backend http://localhost:4000/health
```

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
|GET|/health||Health check|
|POST|/api/v1/auth/register||Register|
|POST|/api/v1/auth/login||Login (sets cookies)|
|POST|/api/v1/auth/refresh||Refresh |
|POST|/api/v1/auth/logout||Logout |
|GET|/api/v1/auth/me|✓|Current user|
|POST|/api/v1/assessments/preview||Preview score (no auth)|
|POST|/api/v1/assessments|✓|Create & save|
|GET|/api/v1/assessments|✓|List (RBAC)|
|GET|/api/v1/assessments/stats|✓|Stats|
|GET|/api/v1/assessments/:id|✓|Get one|
|DELETE|/api/v1/assessments/:id|✓|Delete|
|GET|/api/v1/users|ADMIN|List users|
|GET|/api/v1/institutions|✓|List/create institutions|

Example preview:
```bash
curl -X POST http://localhost:4000/api/v1/assessments/preview \
 -H "Content-Type: application/json" \
 -d '{"teacherTraining":65,"policyFramework":70,"technicalInfra":55,"ethicsEducation":60,"institutionalSupport":75,"budgetAllocation":50,"studentAwareness":68,"leadershipCommitment":80}'
```

## GitHub Repo

Remote: `https://github.com/mnkagh/IARS`

```bash
git remote add origin https://github.com/mnkagh/IARS.git
git branch -M main
git push -u origin main
# Requires GH_PAT or `gh auth login`
```

## Deployment Notes

- Set `NODE_ENV=production`, strong `JWT_*_SECRET` (32+ hex), `DATABASE_URL` to managed Postgres, `CORS_ORIGIN` to frontend URL.
- Run `npx prisma migrate deploy` on deploy.
- Put Postgres behind private network; never expose directly.
- Enable HTTPS (Secure cookies require it); use reverse proxy (nginx) with TLS.
- For Mongo: swap provider, use `mongodb+srv://` Atlas with IP whitelist, still use Prisma.

## License

MIT — SDG 4: Quality Education.
