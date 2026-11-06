### Zoom-Out Architecture & Simplicity Review: `full-stack-data-synchronization.md`

#### 1. Non-Existent `StagedRegistryItem.metadata` JSON Layer & Redundant Dual-Key Design
* **Severity**: Blocker
* **Affected Scope**: `Technical Plan (Architecture)` §1–§2 (lines 87, 107, 148–158), §4–§6 (lines 192, 198, 210); `Detailed Implementation Plan` §1 (lines 263–265, 273, 275–276)
* **Simplicity Rationale**:
  1. **Relies on a column that does not exist in Prisma**: The design's synchronization strategy is built around reading and writing `StagedRegistryItem.metadata` (`metadata.claimId`, `metadata.creditorUserId`, `metadata.debtorUserId`, `metadata.creditorTaxId`, `metadata.initialAmount`, `metadata.debtorType`, `metadata.assignedStaffId`), without proposing any schema migration. In [`schema.prisma`](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma#L626-L667), [`StagedRegistryItem`](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma#L626) has **no `metadata` column**.
  2. **Reinventing relational links already supported by existing columns**: `StagedRegistryItem` already defines first-class columns for `entityType`, `personalId`, `taxId`, `agreementNumber`, `creditorName`, and `matchedUserId`. Furthermore, [`AnalystService.getExcelDebtors`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/analyst/analyst.service.ts#L198-L237) already cross-matches `StagedRegistryItem` with `User` and `DebtClaim` using `personalId` and `agreementNumber`. Stuffing shadow foreign keys and duplicate state (`assignedStaffId`, `initialAmount`, `debtorType`) into an untyped JSON blob on a staging table is over-engineered and unnecessary. Updating `StagedRegistryItem.amount`, `status`, and `matchedUserId` (as [`annulWrittenOffDebt`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/analyst/analyst.service.ts#L2740-L2775) already does) plus matching on `(debtorId, agreementNumber)` or `creditorName` solves the problem with zero new schema or JSON metadata complexity.

---

#### 2. Misplaced Blog CMS Endpoints on `AnalystController` & Global Auth Guard Conflict
* **Severity**: Blocker
* **Affected Scope**: `Technical Plan (Architecture)` §7 (lines 212–215); `Detailed Implementation Plan` §1 (lines 267–269) & §2 (lines 290–293)
* **Simplicity Rationale**:
  1. **Separation of Concerns & Role Guard Conflict**: The design places `GET /api/v1/analyst/blog`, `POST /api/v1/analyst/blog`, and `DELETE /api/v1/analyst/blog/:id` inside [`AnalystController`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/analyst/analyst.controller.ts#L9-L12) and [`AnalystService`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/analyst/analyst.service.ts#L52) (which is already a 2,942-line monolith). However, `AnalystController` is locked down at the class level with `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(UserRole.ANALYST, UserRole.ADMIN)`, and [`AppModule`](file:///C:/Users/mike/Documents/debitinfo/backend/src/app.module.ts#L36-L44) registers `JwtAuthGuard` globally.
     * Unauthenticated visitors reading the public blog will receive `401 Unauthorized` unless `@Public()` is explicitly applied.
     * In [`CrmPage`](file:///C:/Users/mike/Documents/debitinfo/frontend/src/app/crm/page.tsx#L444-L627), the Blog CMS lives in the `/crm` portal (accessible to `OPERATOR` and `ADMIN`), and [`blogService`](file:///C:/Users/mike/Documents/debitinfo/frontend/src/services/index.ts#L400-L436) already targets `/api/blog` and `/api/crm/blog`. Routing CRM/public blog operations through `/api/v1/analyst/blog` violates architectural boundaries.

---

#### 3. Non-Existent Frontend Target Files vs. Missed Actual Static Data Sources
* **Severity**: Major
* **Affected Scope**: `The Problem` §2 (lines 25, 28–31); `Technical Plan (Architecture)` §8 (lines 218–230); `Detailed Implementation Plan` §2 (lines 280–296)
* **Simplicity Rationale**:
  1. **Target files in the plan do not exist**:
     * Line 290 targets `frontend/src/app/blog/page.tsx` and `frontend/src/app/blog/[id]/page.tsx`. Neither file exists in the repository; the public blog is rendered inside [`frontend/src/app/page.tsx`](file:///C:/Users/mike/Documents/debitinfo/frontend/src/app/page.tsx#L518-L637) (`#blog`), which currently renders 3 hardcoded `<article>` cards that the design completely overlooks.
     * Line 295 targets `frontend/src/app/api/claims/route.ts`, which does not exist.
  2. **Missed backend source of hardcoded CRM fallback documents**: Line 226 and line 288 propose removing the 3 hardcoded fallback documents (`rs_waybill_8841.pdf`, `brunviti_barati_2024.xlsx`, `khelshekruleba_8841.pdf`) only from [`frontend/src/app/crm/page.tsx`](file:///C:/Users/mike/Documents/debitinfo/frontend/src/app/crm/page.tsx#L953-L978). However, [`CrmService.formatCallDetail`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/crm/crm.service.ts#L328-L356) in the backend **also** injects those exact 3 hardcoded fallback documents whenever `c.supportingDocuments` is null. Removing the fallback only in `crm/page.tsx` will not eliminate the static documents.
  3. **Incomplete `CreditorDashboardView.tsx` binding**: In [`CreditorDashboardView.tsx`](file:///C:/Users/mike/Documents/debitinfo/frontend/src/components/dashboard/CreditorDashboardView.tsx#L699-L1254), the `<tbody>` only iterates over `uploadedDebtors` (lines 701–783) followed by the 6 hardcoded sample `<tr>` rows (lines 785–1253)—it never iterates over `claimsData.claims`! Simply deleting the 6 hardcoded rows (and excluding promoted claims from `uploadedDebtors`, as proposed in line 276) will cause verified `DebtClaim` records to disappear from the Creditor's table unless `claimsData.claims` is rendered in `<tbody>`. Additionally, `defaultSelectedDebtor` ([`CreditorDashboardView.tsx`](file:///C:/Users/mike/Documents/debitinfo/frontend/src/components/dashboard/CreditorDashboardView.tsx#L64-L83)) and fallback `kpis` (lines 419–425) are hardcoded static objects that must be initialized from live data.

---

#### 4. Operator Dispatch (`assignedOperatorId`) Does Not Connect to `CrmService.getQueue` or Workload Counters
* **Severity**: Major
* **Affected Scope**: `The Problem` §1 (line 23); `CUJ 3` (line 78); `Technical Plan (Architecture)` §6 (line 209); `Detailed Implementation Plan` §1 (line 265)
* **Simplicity Rationale**:
  * The design claims that setting `DebtClaim.assignedOperatorId = staffUser.id` in `dispatchTask` will cause the claim to appear in `/crm` for that operator and increment their workload counter.
  * In reality, [`CrmService.getQueue`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/crm/crm.service.ts#L22-L80) queries all active claims regardless of `assignedOperatorId`, and [`AnalystService.getStaffOptions`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/analyst/analyst.service.ts#L461-L480) / [`getWorkloadStats`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/analyst/analyst.service.ts#L698-L700) calculate operator load from `crmLogs` created today rather than assigned claims. Setting `assignedOperatorId` on write without updating the read queries in `CrmService` and `AnalystService` is a half-measure that will not satisfy Goal 4 or CUJ 3.

---

#### 5. Codebase Reuse Opportunity: Consolidate Duplicate Entity/Claim Upsert Logic in `AnalystService`
* **Severity**: Major
* **Affected Scope**: `Technical Plan (Architecture)` §2 (lines 144–156); `Detailed Implementation Plan` §1 (lines 262–263)
* **Simplicity Rationale**:
  * [`AnalystService`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/analyst/analyst.service.ts) already contains two separate implementations that resolve/create a `CREDITOR` `User`, `DEBTOR` `User` (`IndividualProfile`/`CompanyProfile`), `DebtClaim`, `RepaymentSchedule`, and `StagedRegistryItem`:
    1. [`registerCreditor` & `createDebtorItemForCreditor`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/analyst/analyst.service.ts#L846-L1228)
    2. [`annulWrittenOffDebt`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/analyst/analyst.service.ts#L2558-L2775)
  * Rather than adding `syncDebtorAndClaimFromStagedItem` as a third parallel implementation, extract and reuse the existing user/profile/claim/schedule upsert logic from [`annulWrittenOffDebt`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/analyst/analyst.service.ts#L2576-L2720) so `createDebtorItemForCreditor`, `verifyDebtor`, and `annulWrittenOffDebt` share one canonical path.

---

#### 6. Premature Low-Level Field Specifications Contradicting `schema.prisma`
* **Severity**: Nit
* **Affected Scope**: `Technical Plan (Architecture)` §2 (lines 151, 154), §5 (lines 198–199), §6 (lines 207–209)
* **Simplicity Rationale**:
  * High-level architectural sections drop into concrete Prisma field/enum names that do not match [`schema.prisma`](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma):
    * Uses `Role` instead of [`UserRole`](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma#L14-L24).
    * References `principalAmount` and `analystId` on [`DebtClaim`](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma#L267-L323) (actual field is `initialAmount`; `analystId` does not exist on `DebtClaim`).
    * References `ClaimStatus.CLOSED` and `WrittenOffDebt.status = 'ANNULLED'` (actual values are [`ClaimStatus.SETTLED`](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma#L37-L45) and `'REVERSED'` in [`analyst.service.ts`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/analyst/analyst.service.ts#L2781)).
    * References `assignedById` and `visitAddress` on [`FieldVisitTask`](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma#L555-L578) (actual fields are `addressSnapshot`, `scheduledTime`, `district`, `latitude`, `longitude`) and `filingStage: LegalDocumentType.PRE_TRIAL_NOTICE` on [`LegalCase`](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma#L444-L495) (actual fields are `status: LegalCaseStatus.PRE_TRIAL`, `stage: 'LAWSUIT_PREPARATION'`, `courtInstance`).
