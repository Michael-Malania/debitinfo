# Stage 9: Implementation Readiness Report (`DetailedRange`: Lines 257..307)

* **Target Document**: [full-stack-data-synchronization.md](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L257-L307)
* **Reviewers**: `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Standard**: `implementation-readiness-standard.md`

---

## 🔴 Blockers

### IR-1 (`egm-implementation-readiness`, `egm-codebase-details`, `egm-style`): Non-Existent Prisma Columns, Unindexed Upsert Keys, and Wrong Enum Names
* **Affected Scope**: [Detailed Implementation Plan § 1 (lines 261–276)](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L261-L276), [Verification Plan § 3 (line 303)](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L303)
* **Finding**:
  1. **`StagedRegistryItem.metadata`**: `StagedRegistryItem` in `backend/prisma/schema.prisma` has no `metadata` column (only `matchedUserId: String?` and `supportingDocuments: Json?`). Either use `matchedUserId` + `agreementNumber` + `creditorName` + `supportingDocuments` or add `backend/prisma/schema.prisma` to the modified file list to add `metadata Json?`.
  2. **`LegalCase` Upsert & Fields (Line 265)**: `LegalCase` has no `filingStage` field or `PRE_TRIAL_NOTICE` enum; actual fields are `status: LegalCaseStatus.PRE_TRIAL`, `stage: 'LAWSUIT_PREPARATION'`, `caseNumber: String @unique`, and `courtInstance: String`. Furthermore, `LegalCase.claimId` is not `@unique`, so `findFirst({ where: { claimId } })` + `update`/`create` must be used instead of `upsert`.
  3. **`PaymentTransaction` Enum & Required Fields (Line 273)**: Status enum is `PaymentStatus.COMPLETED` (not `TransactionStatus.COMPLETED`), and creation requires `provider: String` and `transactionRef: String @unique`.
  4. **`DebtClaim` & `WrittenOffDebt` Fields/Statuses (Lines 263, 266)**: `DebtClaim` uses `initialAmount` (not `principalAmount`), has no `analystId` field, requires `caseNumber @unique`, uses `ClaimStatus.SETTLED` (not `CLOSED`), and `WrittenOffDebt.status` uses `'REVERSED'` (not `'ANNULLED'`).

### IR-2 (`egm-implementation-readiness`, `egm-codebase-details`): Non-Existent Target File Paths and Omitted Required Files
* **Affected Scope**: [Detailed Implementation Plan §§ 1–2 (lines 259–297)](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L259-L297)
* **Finding**:
  1. **Four non-existent files listed as `Modify`**:
     * `frontend/src/app/blog/page.tsx` and `frontend/src/app/blog/[id]/page.tsx` do not exist; the public blog is rendered inside `frontend/src/app/page.tsx` (`#blog`, lines 517–637).
     * `frontend/src/app/api/claims/route.ts` and `frontend/src/app/api/visits/route.ts` do not exist; the actual Next.js API route handlers are `frontend/src/app/api/creditor/route.ts`, `frontend/src/app/api/debtor/route.ts`, `frontend/src/app/api/field-officer/route.ts`, `frontend/src/app/api/registry/route.ts`, `frontend/src/app/api/hr/route.ts`, `frontend/src/app/api/crm/route.ts`, `frontend/src/app/api/legal/route.ts`, and `frontend/src/app/api/analytics/route.ts`.
  2. **Omitted backend file with static fallback documents**:
     * `backend/src/modules/crm/crm.service.ts` (`formatCallDetail`, lines 328–356) injects the 3 hardcoded fallback documents (`rs_waybill_8841.pdf`, `brunviti_barati_2024.xlsx`, `khelshekruleba_8841.pdf`) when `c.supportingDocuments` is null, and `getQueue` (lines 22–80) must respect or surface `assignedOperatorId`.
     * `backend/src/common/guards/roles.guard.ts`: `RolesGuard` must respect `@Public()` (`IS_PUBLIC_KEY`) so public endpoints on guarded controllers (`GET /api/v1/analyst/blog`) do not fail with `403 Forbidden`.

### IR-3 (`egm-implementation-readiness`, `egm-codebase-details`): Non-Existent Methods & Service Names Referenced
* **Affected Scope**: [Lines 263, 276, 294](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L263-L294)
* **Finding**:
  1. `verifyAllPending` and `importExcel` do not exist in `AnalystService`; debtor staging creation is handled by `createDebtorItemForCreditor` (invoked by `registerCreditor` and `addDebtorsToCreditor`), and verification is handled by `verifyDebtor`.
  2. `uploadedDebtors` is queried in `ClaimsService.getCreditorUploadedDebtors(creditorUserId)` (lines 245–258), not `getCreditorClaims`.
  3. `claimsService` and `visitsService` do not exist in `frontend/src/services/index.ts`; the actual services with `MOCK_*` fallbacks are `registryService`, `creditorService`, `debtorService`, `analyticsService`, `legalService`, `crmService`, `fieldOfficerService`, `hrService`, and `blogService`.

---

## 🟡 Majors

### IR-4 (`egm-implementation-readiness`, `egm-codebase-details`): Incomplete Frontend Binding Instructions (`CreditorDashboardView.tsx` & `DebtorDashboardView.tsx`)
* **Affected Scope**: [Detailed Implementation Plan § 2 (lines 280–286)](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L280-L286)
* **Finding**:
  1. `CreditorDashboardView.tsx` `<tbody>` currently only maps over `uploadedDebtors` and never maps over `claimsData?.claims`. The plan must specify mapping `claimsData?.claims` into table rows alongside unverified `uploadedDebtors`, replacing `defaultSelectedDebtor` (`გიორგი გიორგაძე`) with the first real row or `null`, and replacing static fallback KPIs (`1540`, `650`) with `0`.
  2. In `DebtorDashboardView.tsx`, the active claim variable is `primaryClaim = liabilities?.claims?.[0]` and installments are at `primaryClaim?.schedules?.[0]?.installments` (`schedule?.installments`), not `activeLiability`. Also remove hardcoded fallback `summary` values (`1540`, `890`, `650`), `creditorCompanyName` (`'შპს ჯეო ტრეიდინგი'`), and `caseNumber` (`'DB-2024-8841'`).

### IR-5 (`egm-implementation-readiness`, `egm-codebase-details`, `egm-style`): Verification Plan Endpoint Routes & Phasing
* **Affected Scope**: [Verification Plan § 3 (lines 298–307)](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L298-L307)
* **Finding**:
  1. Replace non-existent verification routes (`/api/v1/analyst/excel-debtors`, `/api/v1/claims/creditor`, `/api/v1/claims/debtor`) with the actual routes: `/api/v1/analyst/debtors-registry`, `/api/v1/creditor/my-claims`, `/api/v1/creditor/uploaded-debtors`, and `/api/v1/debtor/my-liabilities`.
  2. Partition the Detailed Implementation Plan into explicit incremental phases with buildable checkpoints.
