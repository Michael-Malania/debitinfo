# Debitinfo.GE — NestJS Fastify Backend

High-performance, institutional debt registry and risk analytics engine built with **NestJS**, **Fastify**, and **PostgreSQL** (Prisma ORM).

## Stack & Architecture
- **Framework**: NestJS v10+ with `@nestjs/platform-fastify`
- **Database**: PostgreSQL 16+ via Prisma ORM
- **Authentication**: JWT (Access 15m + Refresh 7d) with Argon2/Bcrypt password hashing & HttpOnly Cookie + Bearer support
- **RS.GE Adapter**: Two-tier architecture (Sandbox/Mock simulation + Live XML/REST protocols)
- **Security**: `@fastify/helmet`, `@fastify/cors`, `@fastify/cookie`, Role-Based Access Control (RBAC)

---

## Getting Started

### 1. Environment Configuration
Ensure `backend/.env` is configured (or copy from `.env.example`):
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:admin@localhost:5432/debitinfo?schema=public"

JWT_ACCESS_SECRET="debitinfo-super-secret-access-token-key-2024"
JWT_REFRESH_SECRET="debitinfo-super-secret-refresh-token-key-2024"

CORS_ORIGIN="http://localhost:3000"
COOKIE_SECRET="debitinfo-fastify-cookie-secure-secret-32-bytes"

# Set to "false" when real RS.GE production credentials arrive
RSGE_SANDBOX_MODE="true"
```

### 2. Database Sync & Seeding
```bash
# Push Prisma schema to PostgreSQL
npx prisma db push

# Seed initial operational accounts
npx prisma db seed
```

### 3. Run Server
```bash
# Development watch mode
npm run start:dev

# Production build & start
npm run build
npm run start:prod
```
Backend listens on: `http://localhost:4000`

---

## Seed Accounts (Ready for Testing)

| Role | Email / Identifier | Password | Portal Route |
| :--- | :--- | :--- | :--- |
| **ADMIN (HR)** | `admin@debitinfo.ge` / `01001011223` | `Debitinfo2024!` | `/hr` |
| **CREDITOR (Lender)** | `creditor@geotrading.ge` / `405123456` | `Debitinfo2024!` | `/creditor` |
| **DEBTOR (Borrower)** | `debtor@beridze.ge` / `01019012345` | `Debitinfo2024!` | `/debtor` |
| **OPERATOR (CRM)** | `operator@debitinfo.ge` / `01022033445` | `Debitinfo2024!` | `/crm` |

---

## Authentication Endpoints

- `POST /api/v1/auth/register` — Registers individual or corporate account with automatic RS.GE status inquiry.
- `POST /api/v1/auth/login` — Accepts Email, 11-digit Personal ID, or 9-digit Company Tax ID + password.
- `POST /api/v1/auth/rs-ge/verify` — RS.GE Single Sign-On verification (auto-provisions or authenticates verified entities).
- `GET /api/v1/auth/rs-ge/taxpayer/:identCode` — Taxpayer status & corporate registry auto-fill.
- `GET /api/v1/auth/rs-ge/status` — Checks RS.GE integration mode (Sandbox vs Live).
- `POST /api/v1/auth/refresh` — Rotates access token via Refresh Token.
- `POST /api/v1/auth/logout` — Revokes session and clears cookies.
- `GET /api/v1/auth/me` — Authenticated user profile and claim counts.
