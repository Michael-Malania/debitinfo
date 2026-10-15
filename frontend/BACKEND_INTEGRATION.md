# Backend Integration Guide for Debitinfo.GE

This frontend application is designed with a **decoupled service client layer** (`src/services/` and `src/types/`). All static mock data currently active across the 12 portals can be swapped for a live backend (FastAPI, Express, NestJS, Go, Django, etc.) by setting a single environment variable.

---

## 1. Quick Switch to Real Backend

1. In the `frontend/` folder, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Configure your backend URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
3. Restart Next.js (`npm run dev`). All requests made via `apiFetch()` in `src/services/` will immediately route to your external backend.

---

## 2. API Endpoints Specification

Your separate backend should implement the following RESTful routes matching the existing data schemas in `src/types/index.ts`:

### A. Debtor Registry
- **`GET /api/registry?q={query}`**
  - Searches companies and individuals by 11-digit PIN, 9-digit Tax ID, or Name.
  - Returns `DebtorRecord[]`.
- **`GET /api/registry/:id`**
  - Returns full profile for a single debtor.

### B. Creditor Cabinet
- **`GET /api/creditor/kpis`**
  - Returns `CreditorKPIs` (total portfolio, active claims count, recovery rates).
- **`GET /api/creditor/claims`**
  - Returns `CreditorClaim[]` for the authenticated creditor.
- **`POST /api/creditor/claims`**
  - Registers a new debt claim or batch upload.

### C. Debtor Self-Service & Dispute Center
- **`GET /api/debtor/profile`**
  - Returns active debtor's profile and credit score rating.
- **`GET /api/debtor/liabilities`**
  - Returns `DebtorLiabilityItem[]` (all creditors, balances, due dates).
- **`POST /api/debtor/pay`**
  - Payload: `{ liabilityId: string, amount: number, cardDetails?: object }`
  - Returns: `{ success: boolean, transactionId: string }`
- **`POST /api/debtor/dispute`**
  - Payload: `{ liabilityId: string, reason: string, attachmentUrl?: string }`
  - Returns: `{ success: boolean, disputeId: string }`

### D. Risk Analytics & Macro Metrics
- **`GET /api/analytics/macro`**
  - Returns `MacroIndicator[]` (National default index, DSO, systemic credit risk).
- **`GET /api/analytics/aging`**
  - Returns `DebtAgingBucket[]` (0-30, 31-60, 61-90, 90+ days).
- **`GET /api/analytics/sectors`**
  - Returns `SectorRisk[]` (Banking, telecom, retail, construction).

### E. Legal & Enforcement Workspace
- **`GET /api/legal/cases`**
  - Returns `LegalCase[]` (court instance, claim amount, judge, enforcement sheet).
- **`POST /api/legal/notice`**
  - Generates pre-trial warning notice letter for execution.

### F. CRM Operator Console
- **`GET /api/crm/queue`**
  - Returns `CallQueueItem[]` with priority and debtor contact details.
- **`POST /api/crm/logs`**
  - Payload: `{ disposition: string, promisedDate?: string, promisedAmount?: number, notes: string }`

### G. Field Officer Geolocation
- **`GET /api/field-officer/tasks`**
  - Returns `FieldVisitTask[]` with GPS coordinates and debtor address.
- **`POST /api/field-officer/tasks/:id`**
  - Payload: `{ notes: string, signature: string, photos?: string[] }`

### H. HR & Administrator
- **`GET /api/hr/employees`**
  - Returns `Employee[]` roster and access permissions.
- **`POST /api/hr/employees`**
  - Adds new employee or curator.

### I. Contact Inquiries
- **`POST /api/contact`**
  - Payload: `{ fullName, email, phone, department, subject, message, caseNumber }`
  - Returns: `{ success: boolean, ticketId: string }`

---

## 3. Graceful Fallback
If `NEXT_PUBLIC_API_URL` is omitted or a backend endpoint returns an error during development, the frontend services automatically fall back to the built-in mock datasets in `src/data/mockData.ts`, ensuring zero disruption during frontend testing.
