# Debitinfo (დებიტორთა რეესტრი და საკრედიტო რისკების მართვა)

Unified financial risk management, debtor registry, debt collection tracking, and analytics platform.

## Architecture

This repository is structured as a modular monorepo:

- **`frontend/`**: Production Next.js (App Router, React 19, Tailwind CSS, TypeScript) application with 12 modular portals, mock API endpoints, and a decoupled service client layer ready for backend integration.
- **`backend/`**: High-performance NestJS backend utilizing the Fastify engine (`@nestjs/platform-fastify`), TypeScript, and PostgreSQL 16+ with Prisma ORM. Includes full RS.GE (Revenue Service of Georgia) OAuth v3 SSO and public taxpayer verification API integration.
- **`rs.ge docs/`**: Official documentation and specifications for Revenue Service of Georgia protocols (RS OAuth v3, Taxpayer Public Info, Invoices, Waybills).
- **`design demo/`**: Original Figma & HTML design review prototype (maintained locally and tracked in its dedicated repository).

## Backend Infrastructure Architecture

The complete backend infrastructure plan, PostgreSQL database schema, RS.GE integration workflow, RBAC role matrix, and API contracts are fully documented in:
👉 **[BACKEND_INFRASTRUCTURE_PLAN.md](./BACKEND_INFRASTRUCTURE_PLAN.md)**

## Quick Start

### 1. Backend (NestJS + Fastify + PostgreSQL)
```bash
cd backend
npm install
npx prisma db push
npx prisma db seed
npm run start:dev
```
Backend runs on [http://localhost:4000](http://localhost:4000).

### 2. Frontend (Next.js 16 + React 19)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on [http://localhost:3000](http://localhost:3000).

---

### Seed Testing Accounts
- **კრედიტორი (Creditor)**: `creditor@geotrading.ge` (ს/კ `405123456`) / `Debitinfo2024!` -> `/creditor`
- **დებიტორი (Debtor)**: `debtor@beridze.ge` (პ/ნ `01019012345`) / `Debitinfo2024!` -> `/debtor`
- **ადმინისტრატორი (Admin/HR)**: `admin@debitinfo.ge` / `Debitinfo2024!` -> `/hr`
- **ოპერატორი (Operator/CRM)**: `operator@debitinfo.ge` / `Debitinfo2024!` -> `/crm`
