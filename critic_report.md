# Stage 7: Critic Review Report (`FeatureRange`: Lines 1..256)

* **Target Document**: [full-stack-data-synchronization.md](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L1-L256)
* **Reviewers**: `egm-design`, `egm-structural`, `egm-style`
* **Standard**: `feature-spec-standard.md`

---

## 🔴 Blockers

### C-1 (`egm-design`, `egm-style`): Non-Existent `StagedRegistryItem.metadata` Column & Prisma Schema/Enum Mismatches
* **Affected Scope**: [Technical Plan §§ 1–6 (lines 85–211)](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L85-L211), [schema.prisma](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma#L14-L716)
* **Finding**:
  1. **`StagedRegistryItem.metadata` does not exist**: The synchronization design relies on reading and writing `StagedRegistryItem.metadata` (`claimId`, `creditorUserId`, `debtorUserId`, `creditorTaxId`, `initialAmount`, `assignedStaffId`, `assignedRole`), but [`StagedRegistryItem`](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma#L626-L667) has no `metadata` column (only `matchedUserId: String?` and `supportingDocuments: Json?`). Either use existing columns (`matchedUserId`, `agreementNumber`, `creditorName`, `supportingDocuments`) or explicitly add `metadata Json?` to `schema.prisma`.
  2. **`DebtClaim` field mismatches**: `DebtClaim` uses `initialAmount` (not `principalAmount`), has no `analystId` column, and requires a unique `caseNumber` on creation.
  3. **Enum & Model field mismatches**:
     * `UserRole` (not `Role`).
     * `IndividualProfile` uses `actualAddress` and `legalAddress` (not `address`); `CompanyProfile` requires `legalForm`, `actualAddress`, `directorLastName`, `directorPin`, `directorPhone`, and `directorEmail`.
     * `PaymentTransaction` requires `provider` and `transactionRef @unique`, and uses `PaymentStatus.COMPLETED` (not `TransactionStatus.COMPLETED`).
     * `ClaimStatus` uses `SETTLED` (there is no `ClaimStatus.CLOSED`), and `WrittenOffDebt.status` uses `'REVERSED'` (not `'ANNULLED'`).
     * `FieldVisitTask` requires `scheduledTime`, `latitude`, `longitude`, `district`, and `addressSnapshot` (no `assignedById` or `visitAddress`).
     * `LegalCase` uses `status: LegalCaseStatus.PRE_TRIAL`, `stage: 'LAWSUIT_PREPARATION'`, `caseNumber @unique`, and `courtInstance` (no `filingStage` or `LegalDocumentType.PRE_TRIAL_NOTICE`), and `claimId` is not `@unique` (requiring `findFirst` + `update`/`create` instead of `upsert`).

### C-2 (`egm-design`, `egm-structural`): Missing Mandatory `## Risks & Mitigations` Section
* **Affected Scope**: [Lines 231–256](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L231-L256)
* **Finding**: `feature-spec-standard.md` requires a `## Risks & Mitigations` (`Risks & Limits`) section covering failure modes, scalability limits, and security risks:
  1. Interactive Prisma `$transaction` timeout on bulk imports and startup reconciliation.
  2. `@unique` collisions on `User.email`, `User.personalId`, and `CompanyProfile.taxId` during automated user creation.
  3. Role overwrite risk if an existing `CREDITOR`, `ANALYST`, or `ADMIN` user's `personalId`/`taxId` appears in a debtor upload and gets unconditionally updated to `UserRole.DEBTOR`.
  4. `onModuleInit` startup crash risk if reconciliation encounters malformed rows without `try/catch` isolation.

---

## 🟡 Majors

### C-3 (`egm-design`): Incomplete Payment Propagation Specification (Lookup Key, Installment Allocation Math, and Frontend Refetch)
* **Affected Scope**: [Technical Plan § 4 (lines 170–194)](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L170-L194), [Technical Plan § 8 (lines 216–230)](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L216-L230)
* **Finding**:
  1. `PaymentReceipt` only stores `claimId`, `debtorId`, and `creditorId`. The spec must define how `confirmByCreditor` / `confirmByAccountant` locates the exact `StagedRegistryItem` when a debtor has multiple claims (e.g., matching `personalId`/`taxId` + `agreementNumber`).
  2. Installment allocation must specify FIFO order (`installmentNo ASC` where `isPaid: false`), incrementing `paidAmount`, setting `isPaid = paidAmount >= amount`, and updating `DebtorDashboardView.tsx` to read `inst.paidAmount` / `inst.isPaid`.
  3. `CreditorDashboardView.tsx` `handleConfirmByCreditor` must re-fetch `claimsData` and `uploadedDebtors` after confirmation so balances and KPIs update immediately.

### C-4 (`egm-design`): Frontend Static Data Removal Gaps (`CreditorDashboardView.tsx`, `DebtorDashboardView.tsx`, Landing Page `#blog`, and `RolesGuard`)
* **Affected Scope**: [Technical Plan §§ 7–8 (lines 212–230)](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L212-L230)
* **Finding**:
  1. `CreditorDashboardView.tsx` `<tbody>` currently only maps over `uploadedDebtors` followed by the 6 hardcoded rows—it never maps over `claimsData.claims`. Deleting the 6 static rows requires rendering `claimsData.claims` in `<tbody>`, replacing `defaultSelectedDebtor` (`გიორგი გიორგაძე`) with the first real row or `null`, and replacing static fallback KPIs (`1540`, `650`) with `0`.
  2. `DebtorDashboardView.tsx` also contains static fallback summary numbers (`1540`, `890`, `650`), creditor name (`'შპს ჯეო ტრეიდინგი'`), and case number (`'DB-2024-8841'`) at lines 231–242 that must default to empty/zero when no claims exist.
  3. The public blog is rendered inside `frontend/src/app/page.tsx` (`#blog`, lines 518–637), not `/blog`, and `CrmService.formatCallDetail` (`backend/src/modules/crm/crm.service.ts` lines 328–356) also injects the 3 hardcoded fallback documents (`rs_waybill_8841.pdf`, etc.).
  4. `AnalystController` has class-level `@Roles(UserRole.ANALYST, UserRole.ADMIN)` and `RolesGuard` does not check `@Public()`, so `GET /api/v1/analyst/blog` needs `@Public()` + `@Roles()` override (or a dedicated controller/guard update) and `POST`/`DELETE` must allow `UserRole.OPERATOR` for `/crm`.

### C-5 (`egm-design`): Indeterministic Orphan Creditor Synthesis in Startup Reconciliation
* **Affected Scope**: [Technical Plan § 3 (lines 160–169)](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L160-L169)
* **Finding**: Orphaned debtor rows (`შპს თეგეტა მოტორსი`, `შპს ალფა ფინანსი`) only have `creditorName` and no `taxId`. The spec must define deterministic tax IDs (e.g., `'204899001'`, `'204899002'`) and required `CompanyProfile` fields so startup reconciliation is idempotent across server restarts.

### C-6 (`egm-structural`): Incomplete `Critical User Journeys (CUJs)` Section Structure
* **Affected Scope**: [Critical User Journeys (lines 52–80)](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L52-L80)
* **Finding**: The CUJ section defines only CUJ 1, CUJ 2, and CUJ 3, omitting CUJ 4 (Write-Off & Annulment Synchronization) and CUJ 5 (Blog CRUD & Static Data Elimination) that are referenced in line 307.

### C-7 (`egm-style`): Uncalibrated Claim of Database-Layer Enforcement
* **Affected Scope**: [Goals (line 36)](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L36)
* **Finding**: Line 36 claims enforcement "at the database and service layers", whereas the plan implements service-layer write validation and startup reconciliation without adding PostgreSQL foreign key or trigger constraints on `StagedRegistryItem`.

---

## 🟢 Nits

### C-8 (`egm-design`): Operator Workload Counter Mismatch After `dispatchTask`
* **Affected Scope**: [Goals (line 38)](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L38), [Technical Plan § 6 (lines 201–210)](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L201-L210)
* **Finding**: `AnalystService.getStaffOptions` computes `OPERATOR` workload from `crmLogs` created today rather than `DebtClaim` records where `assignedOperatorId === u.id`, and `CrmService.getQueue` does not filter or prioritize by `assignedOperatorId`.

### C-9 (`egm-structural`, `egm-style`): Terminology, Diagram Tagging, and Attribution Formatting
* **Affected Scope**: [Lines 13, 19, 87, 174–194, 221, 246, 253](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L13-L253)
* **Finding**:
  1. Replace `"Split-Brain Database State"` with `"Desynchronized Staging and Operational Tables"` and `"Point A / Point B"` with `"write endpoints / consumer views"`.
  2. Replace `**Rejected by author:**` with `**Rejection Rationale:**` in `Alternatives Considered`.
  3. Add a `text` language identifier to the fenced ASCII diagram at lines 174–194 and replace LaTeX `$\rightarrow$` with Unicode `→` at line 221.
  4. Avoid repeating the literal lists of 6 debtor names and 3 document filenames across three separate sections.
