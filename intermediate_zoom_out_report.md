### Stage 8: Intermediate Zoom-Out Review (`full-stack-data-synchronization.md`)

Evaluating [full-stack-data-synchronization.md](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L1-L307) alongside the Stage 6 ([comprehension_report.md](file:///C:/Users/mike/Documents/debitinfo/comprehension_report.md)) and Stage 7 ([critic_report.md](file:///C:/Users/mike/Documents/debitinfo/critic_report.md)) findings against the [Zoom-Out Standard](file:///C:/Users/mike/.gemini/config/plugins/egm/resources/document_standards/zoom-out-standard.md):

---

#### 1. Reject Adding `StagedRegistryItem.metadata` JSON Column — Use Existing First-Class Columns (`matchedUserId`, `personalId`, `agreementNumber`, `creditorName`)
* **Severity**: Blocker
* **Affected Scope**: `Technical Plan (Architecture)` §§ 1–2 ([lines 87–158](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L87-L158)), §§ 4–6 ([lines 189–210](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L189-L210)); `Detailed Implementation Plan` § 1 ([lines 262–276](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L262-L276)); Stage 7 Critic `C-1.1`
* **Simplicity Rationale**:
  * Stage 7 Critic `C-1.1` notes that [`StagedRegistryItem`](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma#L626-L667) has no `metadata` column and offers a choice between using existing columns or adding `metadata Json?` to `schema.prisma`.
  * **Adding `metadata Json?` violates YAGNI and Minimalist Data Flow**: `StagedRegistryItem` already has 30+ typed columns, including [`personalId`](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma#L630), [`taxId`](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma#L631), [`agreementNumber`](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma#L652), [`creditorName`](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma#L653), [`matchedUserId`](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma#L657), and [`supportingDocuments`](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma#L658). Adding an untyped JSON bag requires an unnecessary schema migration and duplicates relational state already stored on [`DebtClaim`](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma#L267-L323).
  * **Zero-Migration Resolution**:
    1. Store the resolved debtor `User.id` in [`StagedRegistryItem.matchedUserId`](file:///C:/Users/mike/Documents/debitinfo/backend/prisma/schema.prisma#L657) (reusing the pattern already in [`AnalystService.annulWrittenOffDebt`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/analyst/analyst.service.ts#L2754)).
    2. Match `StagedRegistryItem` ↔ `DebtClaim` deterministically using `(matchedUserId / personalId, agreementNumber)` and `creditorName`.
    3. Read `initialAmount` and staff assignments directly from the joined `DebtClaim` (`initialAmount`, `assignedOperatorId`, `legalCases`, `fieldVisits`) instead of duplicating them into staging metadata.

---

#### 2. Mount Blog CRUD on `CrmController` (`@Public() @Roles()` on `GET`) Instead of Overloading `AnalystController` or Rewriting `RolesGuard`
* **Severity**: Blocker
* **Affected Scope**: `Technical Plan (Architecture)` § 7 ([lines 212–215](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L212-L215)); `Detailed Implementation Plan` § 1 ([lines 267–269](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L267-L269)) & § 2 ([lines 290–293](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L290-L293)); Stage 6 Finding 5; Stage 7 Critic `C-4.4`
* **Simplicity Rationale**:
  * Placing blog endpoints under `/api/v1/analyst/blog` inside the 2,942-line [`AnalystService`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/analyst/analyst.service.ts) / [`AnalystController`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/analyst/analyst.controller.ts#L9-L12) violates **Right Placement (Architectural Fit)** because the Blog CMS UI lives in [`frontend/src/app/crm/page.tsx`](file:///C:/Users/mike/Documents/debitinfo/frontend/src/app/crm/page.tsx#L444-L627) (the CRM workspace) and [`blogService`](file:///C:/Users/mike/Documents/debitinfo/frontend/src/services/index.ts#L400-L436) already calls `/api/crm/blog`.
  * Furthermore, [`CrmController`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/crm/crm.controller.ts#L17-L20) is **already** decorated with `@Roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.ANALYST)`. Mounting `POST /api/v1/crm/blog`, `DELETE /api/v1/crm/blog/:id`, and `@Public() @Roles() @Get('blog')` on `CrmController` (delegating to [`CrmService`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/crm/crm.service.ts)) works out-of-the-box without modifying global [`RolesGuard`](file:///C:/Users/mike/Documents/debitinfo/backend/src/common/guards/roles.guard.ts#L16-L18) and without bloating `AnalystService`.

---

#### 3. Reuse Existing `annulWrittenOffDebt` Upsert Pattern & Scope Transactions Per-Item to Avoid Bulk Timeout Complexity
* **Severity**: Major
* **Affected Scope**: `Technical Plan (Architecture)` § 2 ([lines 144–156](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L144-L156)), § 3 ([lines 167–169](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L167-L169)); `Detailed Implementation Plan` § 1 ([lines 262–263](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L262-L263)); Stage 6 Findings 1 & 3; Stage 7 Critic `C-2.1–C-2.4`, `C-5`
* **Simplicity Rationale**:
  * **Codebase Reuse Over Reinvention**: Extract and reuse the exact upsert + 12-month `RepaymentSchedule` + `RepaymentInstallment` logic already in [`AnalystService.annulWrittenOffDebt`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/analyst/analyst.service.ts#L2576-L2720) — including its existing role-preservation check (`if (debtorUser.role === UserRole.REGULAR)` at [line 2627](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/analyst/analyst.service.ts#L2627-L2632)), which prevents overwriting `CREDITOR`, `ANALYST`, or `ADMIN` roles.
  * **Per-Item Transactions Over Monolithic Bulk Transactions**: Scope `prisma.$transaction` **per debtor item** wrapped in a `try/catch` inside `onModuleInit` / batch loops rather than wrapping an entire batch import or startup reconciliation loop in one massive interactive transaction.
  * **Remove Non-Existent `importExcel` Reference**: Remove `importExcel` and `verifyAllPending` from [line 263](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L263).

---

#### 4. Eliminate Dual-Source Deduplication in `CreditorDashboardView.tsx` by Filtering `uploadedDebtors` to Unverified Items Only
* **Severity**: Major
* **Affected Scope**: `Technical Plan (Architecture)` § 8 ([lines 218–221](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L218-L221)); `Detailed Implementation Plan` § 1 ([line 276](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L276)) & § 2 ([lines 280–283](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L280-L283)); Stage 6 Finding 2; Stage 7 Critic `C-4.1`
* **Simplicity Rationale**:
  * Have [`ClaimsService.getCreditorUploadedDebtors`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/claims/claims.service.ts#L245-L258) return only unverified staged items (`status: { in: ['PENDING', 'PENDING_VERIFICATION'] }`), and render `claimsData.claims` (all verified/active/litigation/settled claims) + unverified `uploadedDebtors` (pending RS.GE verification) in [`CreditorDashboardView.tsx`](file:///C:/Users/mike/Documents/debitinfo/frontend/src/components/dashboard/CreditorDashboardView.tsx#L699-L784). Every debtor is represented in exactly one list with zero deduplication logic.

---

#### 5. Replace Non-Existent Frontend Target Files with Actual Static Data Sources
* **Severity**: Major
* **Affected Scope**: `Technical Plan (Architecture)` § 8 ([lines 222–230](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L222-L230)); `Detailed Implementation Plan` § 2 ([lines 284–296](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L284-L296)); Stage 7 Critic `C-4.2–C-4.3`
* **Simplicity Rationale**:
  1. Replace `frontend/src/app/blog/page.tsx` and `frontend/src/app/blog/[id]/page.tsx` with [`frontend/src/app/page.tsx`](file:///C:/Users/mike/Documents/debitinfo/frontend/src/app/page.tsx#L518-L637) (`#blog` section).
  2. Add [`backend/src/modules/crm/crm.service.ts`](file:///C:/Users/mike/Documents/debitinfo/backend/src/modules/crm/crm.service.ts#L328-L356) (`formatCallDetail`), which injects the 3 hardcoded fallback documents (`rs_waybill_8841.pdf`, `brunviti_barati_2024.xlsx`, `khelshekruleba_8841.pdf`) on the backend.
  3. Replace non-existent `frontend/src/app/api/claims/route.ts` and `visits/route.ts` with the actual route handlers (`creditor/route.ts`, `debtor/route.ts`, `field-officer/route.ts`, `registry/route.ts`, `hr/route.ts`, `crm/route.ts`, `legal/route.ts`, `analytics/route.ts`).

---

#### 6. Use `receipt.receiptNumber` as Deterministic `PaymentTransaction.transactionRef` and Keep Installment Allocation FIFO
* **Severity**: Nit
* **Affected Scope**: `Technical Plan (Architecture)` § 4 ([lines 180–193](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L180-L193)); `Detailed Implementation Plan` § 1 ([lines 270–273](file:///C:/Users/mike/Documents/debitinfo/docs/designs/full-stack-data-synchronization.md#L270-L273)); Stage 6 Finding 4; Stage 7 Critic `C-1.3`, `C-3.2`
* **Simplicity Rationale**:
  * Set `transactionRef: receipt.receiptNumber` and `provider: 'BANK_TRANSFER'` with `PaymentStatus.COMPLETED` on `PaymentTransaction`.
  * Allocate payments FIFO over `RepaymentInstallment` rows where `isPaid: false` ordered by `installmentNo ASC`.
