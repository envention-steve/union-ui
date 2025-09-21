# Account Contribution Batch Creation Implementation Plan

## 1. Overview

This document outlines the plan to implement the "Create Account Contribution Batch" feature. The goal is to allow users to create a new batch from the existing Account Contributions list page. This involves adding a "Create" button that opens a dialog, collecting user input, calling a backend API to create the batch, and then redirecting the user to the new batch's edit page.

## 2. Proposed File Modifications

### 1. `lib/api-client.ts`

A new function, `createAccountContributionBatch`, will be added to handle the API request to the FastAPI backend.

- **Function:** `createAccountContributionBatch(data: AccountContributionBatchCreate): Promise<any>`
- **Action:** It will send a `POST` request to `/api/v1/account_contribution_batches`.
- **Payload:** The `data` argument will conform to the `AccountContributionBatchCreate` type defined in `types/index.ts`.

### 2. `components/features/batches/CreateBatchDialog.tsx` (New Component)

This new component will render the creation dialog form.

- **Framework:** It will use `react-hook-form` for robust form state management and validation.
- **UI Components:** It will be built using existing `shadcn/ui` components:
    - `Dialog` for the popup shell.
    - `Select` for "Account Type" and "Contribution Type" dropdowns.
    - The existing date picker component used for filtering on the list page will be reused for "Start Date" and "End Date".
    - `Button` for the "Create" and "Cancel" actions.
- **Data:**
    - **Account Types:** Hardcoded as `[{ value: 'HEALTH', label: 'Health' }, { value: 'ANNUITY', label: 'Annuity' }]`.
    - **Contribution Types:** The options will be passed in as a prop from the parent page, reusing the same data source as the list's filter dropdown.
- **Logic:**
    - The `onSubmit` handler will call the `createAccountContributionBatch` API function.
    - Upon successful creation, it will use Next.js's `useRouter` to redirect to the new batch's detail page (e.g., `/dashboard/batches/[new_id]`).

### 3. `app/dashboard/batches/page.tsx`

The existing list page will be modified to integrate the new creation workflow.

- **Wire "Add Contribution" Button:** Wire up the "Add Contribution" button to open the `CreateBatchDialog`.
- **State Management:** `useState` will be used to manage the open/closed state of the `CreateBatchDialog`.
- **Data Passing:** The component will pass the required `contributionTypes` data to the `CreateBatchDialog` component.

### 4. `types/index.ts`

A new type will be added to define the shape of the batch creation payload.

```typescript
export interface AccountContributionBatchCreate {
  start_date: string; // ISO 8601 format
  end_date: string;   // ISO 8601 format
  received_date: string; // ISO 8601 format
  contribution_type: string;
  account_type: string;
  posted: boolean;
  suspended: boolean;
  amount_received: number;
  account_contributions: any[];
}
```

## 3. API Interaction

- **Endpoint:** `POST /api/v1/account_contribution_batches`
- **Payload Sent:**
  ```json
  {
    "start_date": "...",
    "end_date": "...",
    "received_date": "...",
    "contribution_type": "...",
    "account_type": "...",
    "posted": false,
    "suspended": false,
    "amount_received": 0,
    "account_contributions": []
  }
  ```

## 4. User Flow

1.  User navigates to the `/dashboard/batches/account-contribution` page.
2.  User clicks the "Create Batch" button.
3.  The `CreateBatchDialog` appears.
4.  User selects an Account Type, Contribution Type, Start Date, and End Date.
5.  User clicks "Create".
6.  The application sends the `POST` request to the API.
7.  Upon receiving a successful response, the application redirects the user to the edit page for the newly created batch.

## 5. Assumptions & Clarifications

- **`received_date`:** The API schema requires a `received_date`. This field is not included in the popup form. The implementation will default to sending the current date and time in ISO 8601 format (`new Date().toISOString()`) upon creation.
- **Initial State:** The new batch will be created with `posted: false`, `suspended: false`, `amount_received: 0`, and `account_contributions: []` to match the requirement for an "unposted" batch with 0 totals.
- **Redirection:** The API response for a successful creation is expected to contain the `id` of the new batch to facilitate redirection to its edit page.

## 6. Testing & Validation
- **Unit Tests:** Each new function and component will have associated unit tests to ensure correct functionality.
- **Integration Tests:** End-to-end tests will be conducted to validate the entire user flow from batch creation to redirection.