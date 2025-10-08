# Next.js Page Refactor Plan

## Overview
- Several dashboard detail pages have ballooned into 600–4000 line files that mix data fetching, domain transforms, global state management, and UI rendering, making maintenance and testing difficult.
- We will progressively extract cohesive feature components, colocated hooks, and shared utilities to shrink each page, improve reuse, and enable targeted tests.
- Refactors should keep existing route structure while moving logic into `components/features`, `hooks`, and `lib` folders per repository guidelines. Each extraction should be paired with refreshed tests that mirror the new file layout under `__tests__`.

## Page Inventory
| Lines | Page |
| ---: | :--- |
| 3985 | `app/dashboard/members/[id]/page.tsx` |
| 1545 | `app/dashboard/employers/[id]/page.tsx` |
| 1162 | `app/dashboard/insurance-plans/[id]/page.tsx` |
| 776 | `app/dashboard/batches/employer-contribution/[batchId]/details/page.tsx` |
| 689 | `app/dashboard/batches/account-contribution/[id]/edit/page.tsx` |
| 616 | `app/dashboard/batches/insurance-premium/[id]/page.tsx` |
| 473 | `app/dashboard/batches/account-contribution/page.tsx` |
| 413 | `app/dashboard/batches/employer-contribution/page.tsx` |
| 364 | `app/dashboard/insurance-plans/page.tsx` |
| 359 | `app/dashboard/batches/account-contribution/[id]/page.tsx` |
| 352 | `app/dashboard/members/page.tsx` |
| 349 | `app/dashboard/employers/page.tsx` |
| 348 | `app/dashboard/batches/insurance-premium/page.tsx` |
| 329 | `app/dashboard/batches/life-insurance/[id]/page.tsx` |
| 319 | `app/dashboard/batches/life-insurance/page.tsx` |
| 309 | `app/dashboard/batches/annuity-interest/page.tsx` |
| 161 | `app/dashboard/batches/[jobId]/page.tsx` |
| 150 | `app/page.tsx` |
| 148 | `app/dashboard/admin/settings/page.tsx` |
| 119 | `app/dashboard/page.tsx` |
| 88 | `app/dashboard/batches/fiscal-year-end/page.tsx` |
| 78 | `app/(auth)/login/page.tsx` |
| 8 | `app/dashboard/admin-settings/page.tsx` |

## Refactor Plans by Page

### `app/dashboard/members/[id]/page.tsx` (3985 lines)
- **Responsibilities:** End-to-end member management (profile editing, dependents, coverage, life insurance, employer relationships, notes, claims/adjustments, annuity payouts, fund ledger) with extensive API transforms and in-tab forms.
- **Pain Points:** Monolithic component, duplicated fetch logic, heavy state coupling across tabs, large inline JSX tables, complex unsaved-change handling, difficult testability.
- **Refactor Plan:**
  - Create a `components/features/members/member-detail-layout` that renders tabs and delegates content to tab-specific components.
  - Extract tab bodies into colocated components: `MemberOverviewTab`, `DependentsTab`, `HealthCoverageTab`, `LifeInsuranceTab`, `EmployersTab`, `NotesTab`, `ClaimsAdjustmentsTab`, `AnnuityPayoutTab`, `FundLedgerTab`.
  - Move ledger table, filters, and row expansion into `components/features/members/ledger/` with reusable `LedgerTable` and `LedgerEntryDetails` components.
  - Introduce hooks in `hooks/` (`useMemberDetails`, `useMemberLedger`, `useMemberNotes`, `useMemberClaims`, etc.) responsible for fetching, caching, and mutations. Use React Query or SWR later if available; otherwise, keep backend client usage inside hooks.
  - Place data mappers and constants (tab arrays, select options) in `lib/members/transformers.ts` and `lib/members/constants.ts`.
  - Wrap shared state (mode, unsaved changes) in a lightweight context provider scoped to the page to remove prop drilling.
- **Testing:** Replace the monolithic test with suites per tab component and hook (e.g., `__tests__/components/features/members/member-overview-tab.test.tsx`, `__tests__/hooks/useMemberLedger.test.ts`). Add integration test covering tab switching and context interactions.
- **Progress:** Established `MemberDetailContext` with a provider, moved tab bodies into `components/features/members/member-overview` (overview, dependents, employers, notes, claims/adjustments, annuity payout, fund ledger), introduced the `MemberDetailLayout` shell, and extracted hooks for notes, form handlers, claims/adjustments, ledger, overview state, and the core `useMemberDetails` workflow backed by `lib/members/transformers.ts`. Added focused specs across the tab suite (e.g., `__tests__/components/features/members/MemberOverviewTab.test.tsx`, `MemberDependentsTab.test.tsx`, `MemberNotesTab.test.tsx`).
- **Next Actions:**
  - Replace the remaining inline JSX in `app/dashboard/members/[id]/page.tsx` with the new tab components wired through `MemberDetailLayout` and the context provider, reusing the extracted hooks for fetches and mutations.
  - Add an integration spec that exercises tab switching plus the shared context once layout adoption is complete (hook coverage for `useMemberDetails`, `useMemberLedger`, `useMemberFormHandlers`, and `useMemberClaimsAdjustments` is now in place).
  - Remove obsolete inline handlers/modals (e.g., legacy beneficiary dialog wiring, ledger row logic) after confirming parity with the extracted modules, then retire the legacy Member Detail spec.

### `app/dashboard/employers/[id]/page.tsx` (1545 lines)
- **Responsibilities:** Employer detail editing, rates management, notes, member listing, and ledger/batch interaction.
- **Pain Points:** Similar structure to member detail with tab UI, manual unsaved tracking, API fallbacks, and complex nested forms.
- **Refactor Plan:**
  - Build `EmployerDetailLayout` with tab navigation and lean container page.
  - Extract tabs into `EmployerProfileTab`, `EmployerRatesTab`, `EmployerNotesTab`, `EmployerMembersTab`, `EmployerLedgerTab` under `components/features/employers/`.
  - Create hooks (`useEmployerDetails`, `useEmployerRates`, `useEmployerLedger`) and share form schemas/utilities in `lib/employers/`.
  - Reuse generic address/phone/email form components pulled out to `components/features/shared/contact-methods/`.
  - Encapsulate unsaved-change detection in a hook (`useUnsavedChanges`), reuseable across pages.
- **Testing:** Split tests across tabs and hooks mirroring new structure. Add regression test for fallback API path.
- **Progress:** Created reusable scaffolding (`EmployerDetailHeader`, `EmployerDetailTabs`) in `components/features/employers/employer-detail-layout` with shared tab metadata in `lib/employers/constants.ts`; page still renders legacy tab bodies inline.
- **Next Actions:**
  - Extract tab components (`EmployerProfileTab`, `EmployerRatesTab`, `EmployerNotesTab`, `EmployerMembersTab`, `EmployerLedgerTab`) and compose them through the layout primitives, wiring each to dedicated hooks.
  - Move fetch/transform helpers into `lib/employers` alongside new hooks (`useEmployerDetails`, `useEmployerRates`, `useEmployerLedger`) to remove direct API calls from the page.
  - Add component tests for the layout primitives and first migrated tab, then port the existing employer detail spec to the modular setup.

### `app/dashboard/insurance-plans/[id]/page.tsx` (1162 lines)
- **Responsibilities:** Insurance plan detail editing with contact info, rates, address/phone/email transforms.
- **Pain Points:** Mixed form logic, manual transforms, large JSX tables, unsaved-change effects.
- **Refactor Plan:**
  - Extract `InsurancePlanDetailLayout` and tabs (`PlanProfileTab`, `PremiumRatesTab`).
  - Move form input groups (addresses, phones, emails) into shared components reused with employer page.
  - Centralize API transform helpers in `lib/insurance-plans/` (map API -> form -> payload).
  - Build hooks `useInsurancePlanDetails` and `useInsurancePlanRates` for data access.
  - Factor option lists (plan types) into constants file.
- **Testing:** Component tests for each tab and unit tests for transform helpers.
- **Progress:** Added shared layout primitives (`InsurancePlanDetailHeader`, `InsurancePlanDetailTabs`) under `components/features/insurance-plans/insurance-plan-detail-layout`, driven by tab metadata in `lib/insurance-plans/constants.ts`; the page still hosts the original tab implementations.
- **Next Actions:**
  - Carve tab bodies into `PlanOverviewTab`, `EligibilityTab`, `CoverageTab`, `PremiumRatesTab`, and `DocumentsTab` components powered by dedicated hooks.
  - Centralize transform helpers and enums in `lib/insurance-plans` (add `transformers.ts`, shared formatters) and ensure the page consumes the new hooks (`useInsurancePlanDetails`, `useInsurancePlanRates`, `useInsurancePlanDocuments`).
  - Deliver component tests for the new layout primitives plus the first extracted tab, followed by hook tests covering rate calculations and document workflows.

### `app/dashboard/batches/employer-contribution/[batchId]/details/page.tsx` (776 lines)
- **Responsibilities:** Manage employer contribution batch details, react-hook-form array, suggestions, batch metadata.
- **Pain Points:** Large form component mixing form control, suggestion logic, API calls, table rendering.
- **Refactor Plan:**
  - Create `EmployerContributionDetailPage` container that delegates to a `ContributionHeader`, `ContributionForm`, and `ContributionTable` components.
  - Move autocomplete logic into `useMemberAutocomplete` hook shared with other pages.
  - Break form row rendering into `ContributionRow` component receiving controlled props.
  - Store schema/validation utils and normalization in `lib/contributions/`.
  - Encapsulate toast + API interactions into service functions to keep component lean.
- **Testing:** Form hook tests for suggestion debounce and mutation, component tests for row rendering and disable states.

### `app/dashboard/batches/account-contribution/[id]/edit/page.tsx` (689 lines)
- **Responsibilities:** Edit account contribution batch with accordion UI, multiple child forms, posting logic.
- **Pain Points:** Deeply nested JSX, stateful modals, inline data transforms, repeated fetch code.
- **Refactor Plan:**
  - Extract read-only header and edit components (`BatchSummaryCard`, `ContributionAdjustments`, `MemberEntriesSection`).
  - Create hooks for fetching batch + rates (`useAccountContributionBatch`, `useContributionRates`) and for post/unpost actions.
  - Move formatting helpers to `lib/contributions/formatters.ts`.
  - Consider context provider to share batch info and editing permission across sections.
- **Testing:** Unit tests for hooks (fetch + mutations) and component tests for each section.

### `app/dashboard/batches/insurance-premium/[id]/page.tsx` (616 lines)
- **Responsibilities:** Detail page for insurance premium batches with toggles, tables, posting/unposting, filtering.
- **Pain Points:** Mixed loading state management and table logic inside page. Filtering logic inline.
- **Refactor Plan:**
  - Extract `InsurancePremiumBatchHeader`, `PremiumLedgerTable`, and `PremiumActionBar` components under `components/features/batches/insurance-premium/`.
  - Hoist fetch/mutation logic into `useInsurancePremiumBatch` hook shared with list page.
  - Separate filter state via `usePremiumFilters` hook for reuse.
  - Move formatting helpers (currency, status) to `lib/batches/insurance-premium.ts`.
- **Testing:** Hook tests for filters + API calls, table component tests verifying row grouping.

### `app/dashboard/batches/account-contribution/page.tsx` (473 lines)
- **Responsibilities:** List account contribution batches with filters, table, pagination, create dialog.
- **Pain Points:** Shared list logic repeated elsewhere, inline formatting, heavy effect code.
- **Refactor Plan:**
  - Extract `AccountContributionFilters`, `AccountContributionTable`, and `ContributionPagination` components.
  - Introduce `useAccountContributionList` hook for fetching and paging, returning metadata.
  - Reuse formatter utilities with edit page via shared library.
  - Promote create batch dialog to `components/features/batches/account-contribution/create-batch-dialog.tsx` (already partially present) and keep page lean.
- **Testing:** Tests for hook (filters + pagination) and table component output.

### `app/dashboard/batches/employer-contribution/page.tsx` (413 lines)
- **Responsibilities:** Employer contribution batch list with filters, summary chips, actions.
- **Pain Points:** Redundant list logic similar to account contributions, inline transforms.
- **Refactor Plan:**
  - Mirror strategy above: components for filters, table, pagination, stats.
  - Hook `useEmployerContributionList` for fetch/pagination.
  - Share utilities in `lib/batches/employer-contribution.ts`.
- **Testing:** Hook and component tests mirroring account contribution list.

### `app/dashboard/insurance-plans/page.tsx` (364 lines)
- **Responsibilities:** Insurance plan list with filters, cards, modals.
- **Pain Points:** Inline filtering, card rendering, state duplication.
- **Refactor Plan:**
  - Split into `InsurancePlanFilters`, `InsurancePlanTable`, `InsurancePlanActions` components.
  - Hook `useInsurancePlanList` to encapsulate API interaction.
  - Reuse contact formatting helpers from detail page.
- **Testing:** Hook tests for filter behavior, component snapshot/interaction tests.

### `app/dashboard/batches/account-contribution/[id]/page.tsx` (359 lines)
- **Responsibilities:** Read-only detail view for account contribution batches including ledger table, posting controls.
- **Pain Points:** Repeats formatting and fetch logic from edit/list pages.
- **Refactor Plan:**
  - Compose from shared components extracted above (`BatchSummaryCard`, `ContributionLedgerTable`).
  - Move fetch into `useAccountContributionBatch` (shared) with read-only mode flag.
  - Align routing params handling via helper utility.
- **Testing:** Component test ensuring proper summary display given query params, hook reuse coverage.

### `app/dashboard/members/page.tsx` (352 lines)
- **Responsibilities:** Members table with search, pagination, actions.
- **Pain Points:** Inline debounce logic, duplicated avatar utilities, direct API usage.
- **Refactor Plan:**
  - Extract `MemberSearchBar`, `MemberTable`, and `PaginationControls` components.
  - Create `useMemberList` hook handling debounced search, pagination, and API transform.
  - Share `getInitials` helper via `lib/members/formatters.ts`.
- **Testing:** Hook test for debounce/pagination, table component test covering action callbacks.

### `app/dashboard/employers/page.tsx` (349 lines)
- **Responsibilities:** Employer list with filters, status badges, actions.
- **Pain Points:** Similar to members page; repeated formatters, inline state.
- **Refactor Plan:**
  - Components for filters/table/action bar, hook `useEmployerList` mirroring pattern.
  - Share formatting utilities and status badge helpers in `lib/employers/formatters.ts`.
- **Testing:** Hook and component tests similar to members list.

### `app/dashboard/batches/insurance-premium/page.tsx` (348 lines)
- **Responsibilities:** Insurance premium batch list with filters and action buttons.
- **Pain Points:** Duplication with other batch list pages, long component.
- **Refactor Plan:**
  - Break into filter + table + pagination components reused across premium detail page.
  - Hook `useInsurancePremiumBatchList` consolidating fetch and parameter mapping.
  - Shared util for status formatting.
- **Testing:** Hook/component tests aligning with other batch lists.

### `app/dashboard/batches/life-insurance/[id]/page.tsx` (329 lines)
- **Responsibilities:** Life insurance batch detail with coverage breakdowns, posting controls.
- **Pain Points:** Inline fetch logic, repeated table rendering, mixed currency formatting.
- **Refactor Plan:**
  - Extract `LifeInsuranceBatchHeader`, `CoverageBreakdown`, `ManualAdjustments` components.
  - Hook `useLifeInsuranceBatch` for data and actions.
  - Share formatting helpers in `lib/batches/life-insurance.ts`.
- **Testing:** Hook tests for posting/unposting, component tests for breakdown rendering.

### `app/dashboard/batches/life-insurance/page.tsx` (319 lines)
- **Responsibilities:** List life insurance batches with filters and status chips.
- **Pain Points:** Similar duplication.
- **Refactor Plan:**
  - Apply list-page extraction pattern (filters/table/pagination, hook, shared utils) parallel to other batch list pages.
- **Testing:** Hook/component tests consistent with list pattern.

### `app/dashboard/batches/annuity-interest/page.tsx` (309 lines)
- **Responsibilities:** Annuity interest batch list with filters, status, totals.
- **Pain Points:** Inline state and formatting, similar to other batch lists.
- **Refactor Plan:**
  - Adopt same list abstraction: components + `useAnnuityInterestList` hook + shared `lib/batches/annuity-interest.ts` helpers.
  - Consider generic list scaffold component to DRY repeated UI.
- **Testing:** Hook/component tests replicating pattern.

### `app/dashboard/batches/[jobId]/page.tsx` (161 lines)
- **Responsibilities:** Job progress detail with polling, logs, CTA.
- **Pain Points:** Polling logic inside component, minimal separation.
- **Refactor Plan:**
  - Create `useBatchJobStatus(jobId)` hook managing polling and state.
  - Move status card UI into `BatchJobStatusCard` component.
  - Keep page as simple container wiring params to hook/component.
- **Testing:** Hook tests using fake timers; component test verifying loading/error states.

### `app/page.tsx` (150 lines)
- **Responsibilities:** Public landing page with hero, updates, documents.
- **Pain Points:** Pure presentational; minor duplication in repeated sections.
- **Refactor Plan:**
  - Optional: extract hero/updates/documents sections into `components/features/public/` for reuse if we add more public routes.
  - Otherwise leave as is; ensure static props remain minimal.
- **Testing:** Snapshot test suffices if we extract sections.

### `app/dashboard/admin/settings/page.tsx` (148 lines)
- **Responsibilities:** Admin settings form with toggles, contact info.
- **Pain Points:** Inline form logic and switch handling; manageable size but could reuse components.
- **Refactor Plan:**
  - Extract `AdminSettingsForm` component; move fetch/save logic into `useAdminSettings` hook.
  - Share input groups with other settings pages if we add more.
- **Testing:** Hook test for fetch/save; component test for form submission.

### `app/dashboard/page.tsx` (119 lines)
- **Responsibilities:** Dashboard overview cards and quick links.
- **Pain Points:** Presentational; duplicates card layout patterns.
- **Refactor Plan:**
  - Create `DashboardSummaryCards` and `QuickActions` components in `components/features/dashboard/` for reuse and testing.
- **Testing:** Simple component test verifying card titles; no hook needed.

### `app/dashboard/batches/fiscal-year-end/page.tsx` (88 lines)
- **Responsibilities:** Fiscal year end job initiation UI.
- **Pain Points:** Minimal state; code is clear.
- **Refactor Plan:**
  - Optionally extract into `FiscalYearEndCard` component; align API call with new `useBatchJob` hook created earlier.
- **Testing:** Component test verifying button disable states.

### `app/(auth)/login/page.tsx` (78 lines)
- **Responsibilities:** Auth redirect handling and login form wrapper.
- **Pain Points:** Suspense inline fallback; manageable.
- **Refactor Plan:**
  - Leave page mostly as is; optionally move redirect logic into `useLoginRedirect` hook reused by other auth pages.
  - Move Suspense fallback to shared `components/ui/loading-screen.tsx`.
- **Testing:** Hook test for redirect logic if extracted.

### `app/dashboard/admin-settings/page.tsx` (8 lines)
- **Responsibilities:** Likely route alias/redirect to main admin settings.
- **Pain Points:** None.
- **Refactor Plan:** Ensure it simply re-exports or redirects; no further action.
- **Testing:** Not necessary.

## Cross-Cutting Workstreams
- **Shared list scaffolding:** Define a configurable `BatchListLayout` in `components/features/batches/shared/` that wires common filter state, result tables, pagination, and bulk actions. Batch-specific pages should supply columns, filter schema, and action handlers so we only implement the pattern once.
- **Detail layout primitives:** Create composable layout shells (`DetailPageHeader`, `DetailTabs`, `SummaryAside`) to standardize the large `[id]` pages. Place these in `components/features/shared/layouts/` and gradually replace ad-hoc flexbox markup.
- **Form state utilities:** Extract unsaved-change detection, dirty tracking, and confirm dialogs into `lib/forms/dirty-state.ts` with a matching `useDirtyStateGuard` hook. Reuse across member, employer, and batch edit flows.
- **Data layer consolidation:** Introduce thin API clients per domain under `lib/api/{domain}.ts` to hide fetch URL construction and response normalization. Hooks import these clients, reducing duplication and easing future swap to React Query.
- **Accessibility and design tokens:** While extracting components, audit for accessible labels, focus states, and consistent currency/date formatting. Record reusable formatters in `lib/formatters/` and leverage Tailwind config tokens.
- **Testing harness upgrades:** Create `__tests__/setup/renderWithProviders.tsx` to co-locate Providers (theme, query, context) and simplify component tests. Update new specs to use it and migrate legacy tests opportunistically.

## Refactor Sequencing
1. **Members detail page:** Biggest win and unlocks shared detail layout primitives, ledger components, and dirty-state utilities. Complete hook extractions and componentization here first.
2. **Employers detail page:** Reuse member abstractions, validating that shared layouts/hooks cover both personas.
3. **Batch list family:** Implement generic list scaffold, then refactor insurance premium, account contribution (list + detail), employer contribution, life insurance, and annuity interest pages.
4. **Insurance plan flows:** Apply list scaffold and turn detail actions into modular components.
5. **Remaining dashboard shells:** Tidy admin settings, dashboard overview, and batch job status once shared primitives mature.

Milestones should ship incrementally. After each phase, run `npm run lint` and targeted Jest suites; schedule a regression pass on staging before moving to the next block.

## Risk & Mitigation
- **Regression risk in mission-critical flows:** Pair each extraction with Jest component/hook tests and a manual checklist (data load, edit, save, cancel). Maintain snapshots for shared layouts.
- **Context/provider drift:** Document required providers in `docs/testing-plan.md` and enforce via the shared render helper to avoid missing wrappers.
- **Inconsistent formatting:** Gate merges on linting and ensure formatters/utilities centralize currency/date logic.
- **Refactor fatigue:** Time-box extractions (e.g., 2–3 days per tab or list page) and log open tasks in the repo Projects board to maintain momentum.
