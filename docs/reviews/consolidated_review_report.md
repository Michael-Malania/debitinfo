# Consolidated Review Report: `full-stack-data-synchronization.md`

* **Target Document**: [full-stack-data-synchronization.md](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md) (and mirror [design_draft.md](file:///C:/Users/mike/Documents/debitinfo/design_draft.md))
* **Semantic Split**: `FeatureRange: 1..256`, `DetailedRange: 257..307`
* **Stage Reports**:
  * Stage 5 (Initial Zoom Out): [zoom_out_report.md](file:///C:/Users/mike/Documents/debitinfo/zoom_out_report.md)
  * Stage 6 (Comprehension Test): [comprehension_report.md](file:///C:/Users/mike/Documents/debitinfo/comprehension_report.md)
  * Stage 7 (Critic Review): [critic_report.md](file:///C:/Users/mike/Documents/debitinfo/critic_report.md)
  * Stage 8 (Intermediate Zoom Out): [intermediate_zoom_out_report.md](file:///C:/Users/mike/Documents/debitinfo/intermediate_zoom_out_report.md)
  * Stage 9 (Implementation Readiness Test): [implementation_readiness_report.md](file:///C:/Users/mike/Documents/debitinfo/implementation_readiness_report.md)

---

## Executive Summary of Consolidated Findings

Across the five Goldfish review stages, reviewers identified **4 Consolidated Blockers**, **5 Consolidated Majors**, and **3 Consolidated Nits**:

1. **Zero-Migration Relational Matching Instead of Non-Existent `StagedRegistryItem.metadata`**: `StagedRegistryItem` in `backend/prisma/schema.prisma` has no `metadata` column, and adding an untyped JSON blob duplicates fields already on `StagedRegistryItem` (`matchedUserId`, `personalId`, `taxId`, `agreementNumber`, `creditorName`, `supportingDocuments`) and `DebtClaim` (`initialAmount`, `remainingAmount`, `assignedOperatorId`). Reusing `matchedUserId` plus composite `(matchedUserId / personalId, agreementNumber, creditorName)` matching eliminates schema migration overhead.
2. **Exact Prisma Model & Enum Calibration**: Several model fields and enums in the draft (`DebtClaim.principalAmount`, `DebtClaim.analystId`, `Role`, `ClaimStatus.CLOSED`, `TransactionStatus.COMPLETED`, `LegalCase.filingStage`, `FieldVisitTask.visitAddress`, `WrittenOffDebt.status = 'ANNULLED'`, and `prisma.legalCase.upsert({ where: { claimId } })`) do not match `schema.prisma` and must use exact Prisma identifiers (`initialAmount`, `UserRole`, `ClaimStatus.SETTLED`, `PaymentStatus.COMPLETED`, `LegalCaseStatus.PRE_TRIAL`, `stage: 'LAWSUIT_PREPARATION'`, `addressSnapshot`, `'REVERSED'`, and `findFirst` + `update`/`create`).
3. **Blog CRUD Placement on `CrmController` & Real Target Files**: Blog CMS endpoints belong on `CrmController` (`/api/v1/crm/blog` with `@Public() @Roles()` on `GET /api/v1/crm/blog`) rather than `AnalystController` (which restricts roles to `ANALYST` and `ADMIN`). In addition, non-existent target files (`frontend/src/app/blog/page.tsx`, `frontend/src/app/api/claims/route.ts`, `frontend/src/app/api/visits/route.ts`) must be replaced with the actual files containing static data: `frontend/src/app/page.tsx` (`#blog`), `backend/src/modules/crm/crm.service.ts` (`formatCallDetail` fallback docs and `getQueue` operator filtering), and the 8 actual `frontend/src/app/api/*/route.ts` files.
4. **Mandatory `Risks & Mitigations` Section, Complete CUJs (CUJ 1–5), and Frontend Table/KPI Binding**: Add `## Risks & Mitigations`, add `CUJ 4` and `CUJ 5`, filter `getCreditorUploadedDebtors` to unverified items (`PENDING`/`PENDING_VERIFICATION`) while rendering `claimsData.claims` in `CreditorDashboardView.tsx` `<tbody>` (removing `defaultSelectedDebtor` and static KPI fallbacks), and bind `primaryClaim.schedules[0].installments` in `DebtorDashboardView.tsx`.

---

## Consolidated Action Items by Priority

### 🔴 Blockers

* **ACTION-B1 (Use Existing `StagedRegistryItem` Columns Instead of Non-Existent `metadata` JSON)**:
  * **Scope**: Technical Plan §§ 1–6, Detailed Implementation Plan § 1, Verification Plan § 3.
  * **Resolution**: Remove all references to `StagedRegistryItem.metadata`. Store the debtor's `User.id` in `StagedRegistryItem.matchedUserId` (reusing the pattern in `AnalystService.annulWrittenOffDebt`), link `StagedRegistryItem` ↔ `DebtClaim` via `(matchedUserId / personalId, agreementNumber, creditorName)`, and read `initialAmount` and staff assignments from the linked `DebtClaim`.
* **ACTION-B2 (Align All Prisma Model Fields, Upsert Queries, and Enum Names with `schema.prisma`)**:
  * **Scope**: Technical Plan §§ 1–6, Detailed Implementation Plan § 1.
  * **Resolution**:
    * Use `UserRole` (`UserRole.DEBTOR`, `UserRole.CREDITOR`, `UserRole.FIELD_OFFICER`, `UserRole.LEGAL`, `UserRole.OPERATOR`), not `Role`.
    * Use `DebtClaim.initialAmount` (not `principalAmount`), generate required `caseNumber: String @unique` (`CLM-${Date.now()}-${ suffix }`), and omit non-existent `DebtClaim.analystId`.
    * Use `ClaimStatus.SETTLED` (not `ClaimStatus.CLOSED`) when a claim reaches 0 via payment or write-off, and `'REVERSED'` (not `'ANNULLED'`) on `WrittenOffDebt.status`.
    * Use `PaymentStatus.COMPLETED` (not `TransactionStatus.COMPLETED`) on `PaymentTransaction` with mandatory `provider: 'BANK_TRANSFER'` and `transactionRef: receipt.receiptNumber`.
    * In `dispatchTask` for `UserRole.LEGAL`, use `prisma.legalCase.findFirst({ where: { claimId } })` followed by `update` or `create` (since `claimId` is not `@unique`), setting `status: LegalCaseStatus.PRE_TRIAL`, `stage: 'LAWSUIT_PREPARATION'`, `caseNumber`, and `courtInstance: 'თბილისის საქალაქო სასამართლო'`.
    * In `dispatchTask` for `UserRole.FIELD_OFFICER`, create `FieldVisitTask` with `addressSnapshot`, `scheduledTime`, `district`, `latitude`, and `longitude`.
* **ACTION-B3 (Mount Blog CRUD on `CrmController` & Fix Target File Paths / Method Names)**:
  * **Scope**: Technical Plan §§ 7–8, Detailed Implementation Plan §§ 1–2.
  * **Resolution**:
    * Mount `GET /api/v1/crm/blog` (`@Public() @Roles()`), `POST /api/v1/crm/blog`, and `DELETE /api/v1/crm/blog/:id` on `CrmController` (`backend/src/modules/crm/crm.controller.ts`) and `CrmService` (`backend/src/modules/crm/crm.service.ts`), where `@Roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.ANALYST)` is already configured.
    * Replace non-existent `frontend/src/app/blog/page.tsx` and `frontend/src/app/blog/[id]/page.tsx` with `frontend/src/app/page.tsx` (`#blog` section).
    * Replace non-existent `frontend/src/app/api/claims/route.ts` and `visits/route.ts` with the actual route files: `creditor/route.ts`, `debtor/route.ts`, `field-officer/route.ts`, `registry/route.ts`, `hr/route.ts`, `crm/route.ts`, `legal/route.ts`, and `analytics/route.ts`.
    * Replace non-existent method names (`verifyAllPending`, `importExcel` in `AnalystService`; `claimsService`, `visitsService` in `frontend/src/services/index.ts`; `getCreditorClaims` for uploaded debtors) with the actual methods (`createDebtorItemForCreditor`, `verifyDebtor`, `getCreditorUploadedDebtors`, `registryService`, `creditorService`, `debtorService`, `fieldOfficerService`, `hrService`).
* **ACTION-B4 (Add Mandatory `## Risks & Mitigations` Section)**:
  * **Scope**: End of `FeatureRange` (before `## Alternatives Considered`).
  * **Resolution**: Add `## Risks & Mitigations` covering: (1) Per-item transaction scoping (`prisma.$transaction` per debtor item with `try/catch`) to prevent 5,000ms interactive transaction timeouts during bulk imports and `onModuleInit` startup reconciliation; (2) Deterministic synthetic email/taxId generation (`debtor_${personalId}@debitinfo.ge`, `'204899001'` for `შპს თეგეტა მოტორსი`, `'204899002'` for `შპს ალფა ფინანსი`) to prevent `@unique` constraint collisions; and (3) Role preservation (`if (debtorUser.role === UserRole.REGULAR)` before setting `UserRole.DEBTOR`) so existing `CREDITOR`, `ANALYST`, or `ADMIN` accounts are never downgraded.

---

### 🟡 Majors

* **ACTION-M1 (Reuse Existing `annulWrittenOffDebt` Upsert & Schedule Logic in `syncDebtorAndClaimFromStagedItem`)**:
  * **Scope**: Technical Plan §§ 2–3, Detailed Implementation Plan § 1.
  * **Resolution**: Extract and reuse the user/profile (`IndividualProfile` / `CompanyProfile`), `DebtClaim`, and 12-month `RepaymentSchedule` + `RepaymentInstallment` creation logic from `AnalystService.annulWrittenOffDebt` inside `syncDebtorAndClaimFromStagedItem`, and set `status: 'VERIFIED'` on analyst-created debtors in `createDebtorItemForCreditor`.
* **ACTION-M2 (Complete `CreditorDashboardView.tsx` & `DebtorDashboardView.tsx` Live Binding and Deduplication)**:
  * **Scope**: Technical Plan § 8, Detailed Implementation Plan §§ 1–2.
  * **Resolution**:
    * In `ClaimsService.getCreditorUploadedDebtors`, filter to unverified items (`status: { in: ['PENDING', 'PENDING_VERIFICATION'] }`) so verified debtors appear exclusively in `claimsData.claims` without duplication.
    * In `CreditorDashboardView.tsx`, render `claimsData.claims` rows alongside pending `uploadedDebtors` in `<tbody>`, initialize `selectedDebtor` from the first real claim/debtor (or `null`), default empty KPIs to `0`, and re-fetch `getMyClaims()` + `getUploadedDebtors()` in `handleConfirmByCreditor`.
    * In `DebtorDashboardView.tsx`, bind documents and installments to `primaryClaim.supportingDocuments` and `primaryClaim.schedules[0].installments` (reading `inst.paidAmount` and `inst.isPaid`), and reset static fallback summary values (`1540`, `890`, `650`, `'შპს ჯეო ტრეიდინგი'`, `'DB-2024-8841'`) to `0` / empty state when no claims exist.
* **ACTION-M3 (Remove Backend Hardcoded Fallback Documents in `CrmService.formatCallDetail` & Connect Operator Dispatch to CRM Queue/Workload)**:
  * **Scope**: Technical Plan §§ 6, 8, Detailed Implementation Plan § 1.
  * **Resolution**: Remove the 3 hardcoded fallback documents (`rs_waybill_8841.pdf`, `brunviti_barati_2024.xlsx`, `khelshekruleba_8841.pdf`) from `CrmService.formatCallDetail` (`backend/src/modules/crm/crm.service.ts` lines 328–356), filter/prioritize `CrmService.getQueue` for `UserRole.OPERATOR` by `assignedOperatorId`, and include assigned active claims in `AnalystService.getStaffOptions` / `getWorkloadStats` for operators.
* **ACTION-M4 (Specify FIFO Installment Allocation & Secondary Receipt Confirmation Behavior)**:
  * **Scope**: Technical Plan § 4, Detailed Implementation Plan § 1.
  * **Resolution**: When confirming a receipt, allocate the paid amount FIFO across `RepaymentInstallment` rows where `isPaid: false` ordered by `installmentNo: 'asc'`, incrementing `paidAmount` and setting `isPaid = true`, `paidAt = new Date()` when `paidAmount >= amount`. If a receipt was already confirmed by one role (`CONFIRMED_BY_CREDITOR` or `CONFIRMED_BY_ACCOUNTANT`) and is subsequently confirmed by the other, record the secondary verifier/order metadata without subtracting `receipt.amount` a second time.
* **ACTION-M5 (Add CUJ 4 & CUJ 5, Partition Implementation into Phases, and Fix Verification API Paths)**:
  * **Scope**: Critical User Journeys, Detailed Implementation Plan § 1–3.
  * **Resolution**: Add `CUJ 4: Write-Off and Annulment Synchronize Registry and Claim Balances` and `CUJ 5: CRM Blog Publishing and Static Data Elimination` to the CUJ section; structure the Detailed Implementation Plan into 3 buildable phases; and use exact API paths in the Verification Plan (`/api/v1/analyst/debtors-registry`, `/api/v1/creditor/my-claims`, `/api/v1/creditor/uploaded-debtors`, `/api/v1/debtor/my-liabilities`, `/api/v1/payments/:id/confirm-creditor`, `/api/v1/crm/blog`).

---

### 🟢 Nits

* **ACTION-N1 (Calibrate Database Enforcement Claim)**:
  * **Scope**: Goals (line 36).
  * **Resolution**: State that mutual creditor-debtor integrity is enforced through **service-layer transactional validation and startup reconciliation** rather than claiming raw PostgreSQL foreign-key enforcement on `StagedRegistryItem`.
* **ACTION-N2 (Calibrate Terminology & Avoid Repeating Literal Sample Lists)**:
  * **Scope**: Overview, The Problem, Technical Plan, Alternatives Considered.
  * **Resolution**: Replace `"Split-Brain Database State"` with `"Desynchronized Staging and Operational Tables"`, replace `"Point A / Point B"` with `"write endpoints / consumer views"`, define `RS.GE` inline on first use (`Revenue Service of Georgia verification step`), and list the 6 hardcoded debtor names and 3 fallback filenames once in `The Problem`.
* **ACTION-N3 (Formatting Consistency in Diagrams & Alternatives)**:
  * **Scope**: Technical Plan §§ 4, 8, Alternatives Considered.
  * **Resolution**: Add `text` language identifier to the fenced ASCII diagram in Technical Plan § 4, replace LaTeX `$\rightarrow$` with `→`, and replace `**Rejected by author:**` with `**Rejection Rationale:**`.

---

## Cross-Stage Traceability Matrix

| Consolidated Action | Priority | Stage 5 (`zoom_out_report.md`) | Stage 6 (`comprehension_report.md`) | Stage 7 (`critic_report.md`) | Stage 8 (`intermediate_zoom_out_report.md`) | Stage 9 (`implementation_readiness_report.md`) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ACTION-B1** (`StagedRegistryItem` existing columns vs `metadata`) | 🔴 Blocker | Finding 1 | — | C-1.1 | Finding 1 | IR-1.1 |
| **ACTION-B2** (Exact Prisma fields, enums, and `LegalCase` query) | 🔴 Blocker | Finding 6 | Finding 7.1 | C-1.2, C-1.3 | Finding 6 | IR-1.2, IR-1.3, IR-1.4 |
| **ACTION-B3** (`CrmController` blog routes, real file paths & method names) | 🔴 Blocker | Findings 2, 3.1 | Findings 3, 5 | C-4.3, C-4.4 | Findings 2, 3, 5 | IR-2.1, IR-3.1, IR-3.2, IR-3.3 |
| **ACTION-B4** (`Risks & Mitigations` section: timeouts, unique keys, roles) | 🔴 Blocker | — | Finding 1 | C-2, C-5 | Finding 3 | IR-3.3 |
| **ACTION-M1** (Reuse `annulWrittenOffDebt` user/claim/schedule upsert) | 🟡 Major | Finding 5 | Finding 1 | C-5 | Finding 3 | IR-3.2, IR-3.3 |
| **ACTION-M2** (`CreditorDashboardView` `claims` table & `DebtorDashboardView` binding) | 🟡 Major | Finding 3.3 | Finding 2 | C-3.3, C-4.1, C-4.2 | Finding 4 | IR-3.5, IR-4.1, IR-4.2 |
| **ACTION-M3** (`CrmService.formatCallDetail` fallback docs & operator queue/load) | 🟡 Major | Findings 3.2, 4 | — | C-4.3, C-8 | Finding 5.2 | IR-2.2 |
| **ACTION-M4** (FIFO `RepaymentInstallment` allocation & secondary confirmation) | 🟡 Major | — | Finding 4 | C-3.1, C-3.2 | Finding 6 | IR-3.4 |
| **ACTION-M5** (Add CUJ 4 & 5, implementation phases, exact verification URLs) | 🟡 Major | — | Finding 6 | C-6 | — | IR-5.1, IR-5.2 |
| **ACTION-N1** (Calibrate service-layer enforcement claim) | 🟢 Nit | — | — | C-7 | — | — |
| **ACTION-N2** (Calibrate terminology, `RS.GE` definition, deduplicate lists) | 🟢 Nit | — | Finding 7.2 | C-9.1, C-9.4 | — | — |
| **ACTION-N3** (Code fence tag, Unicode arrow, `Rejection Rationale` label) | 🟢 Nit | — | — | C-9.2, C-9.3 | — | — |
