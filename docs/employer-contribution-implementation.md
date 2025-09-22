# Employer Contribution Batch Feature Design

## 1. Overview

This document outlines the design for the Employer Contribution batch feature. It includes a list page to view all employer contribution batches and a detail page to view and manage the members and contributions within a specific batch. The design will closely mirror the existing Account Contribution feature for UI and UX consistency.

## 2. Data Models

Based on the API endpoints and column requirements, the front-end will expect the following data structures.

### EmployerContributionBatch (List View)

From `GET /api/v1/employer_contribution_batches`

```json
{
    "id": 0,
    "created_at": "2025-09-21T00:37:39.190Z",
    "updated_at": "2025-09-21T00:37:39.190Z",
    "start_date": "2025-09-21T00:37:39.190Z",
    "end_date": "2025-09-21T00:37:39.190Z",
    "received_date": "2025-09-21T00:37:39.190Z",
    "posted": true,
    "suspended": true,
    "amount_received": 0,
    "employer_id": 0,
    "employer": {
      "id": 0,
      "created_at": "2025-09-21T00:37:39.190Z",
      "updated_at": "2025-09-21T00:37:39.190Z",
      "name": "string",
      "ein": "string"
    }
  }
```

### EmployerContributionBatchDetail (Show View)

From `GET /api/v1/employer_contribution_batch/{id}/details`

```json
{
  "batch_id": 0,
  "employer_contributions": [
    {
      "id": 0,
      "amount": "string",
      "hours": "string",
      "member": {
        "id": 0,
        "unique_id": "string",
        "first_name": "string",
        "last_name": "string",
        "full_name": "string"
      },
      "employer_rate": {
        "id": 0,
        "name": "string",
        "contribution_rate": "string"
      }
    }
  ]
}```

## 3. Page Designs

### 3.1. Batch List Page

This page will display a paginated list of all employer contribution batches.

-   **URL:** `/dashboard/batches/employer-contribution`
-   **API Endpoint:** `GET /api/v1/employer_contribution_batches`
-   **UI Layout:** The page will reuse the primary data table component and layout from the Account Contribution list page.
    -   **Header:** "Employer Contributions"
    -   **Primary Action:** A "Create Batch" button will be prominently displayed.
-   **Data Table Columns:**
    -   `Employer`: The name of the employer (`employer.name`).
    -   `Start Time`: Formatted start date of the batch.
    -   `End Time`: Formatted end date of the batch.
    -   `Status`: A badge indicating the batch status (e.g., "Open", "Posted").
    -   `Actions`: Buttons for actions such as:
        -   "View Details"
        -   "Unpost Batch" - If posted
        -   "Post Batch" - If unposted
        -   "Delete Batch" - If unposted

### 3.2. Create Batch Dialog

Clicking the "Create Batch" button will open a dialog for creating a new employer contribution batch.

-   **Trigger:** "Create Batch" button on the list page.
-   **API Endpoint:** `POST /api/v1/employer_contribution_batches`
-   **Form Fields:**
    1.  **Employer:** A searchable dropdown/combobox to select an employer.
    2.  **Start Date:** A date picker for the batch start date.
    3.  **End Date:** A date picker for the batch end date.
-   **Submission:** On successful creation, the user will be redirected to the new batch's detail page: `/dashboard/batches/employer-contribution/[new_batch_id]/details`.

### 3.3. Batch Detail Page

This page displays the line-item details for a single employer contribution batch.

-   **URL:** `/dashboard/batches/employer-contribution/[batchId]/details`
-   **API Endpoint:** `GET /api/v1/employer_contribution_batch/{id}/details`
-   **UI Layout:** The page will be visually similar to the Account Contribution show page.
    -   **Header:** A summary section displaying the Employer, date range, and status of the batch.
    -   **Primary Action:** An "Add Member" button to add new contribution lines to the batch.
-   **Data Table Columns:**
    -   `Member`: The full name of the member (`member.full_name`).
    -   `Hours Worked`: A numeric input field for the hours worked.
    -   `Rate Name`: A dropdown field to select the contribution rate. The options for this dropdown will need to be fetched from a separate API endpoint (e.g., `/api/v1/contribution_rates`).
    -   `Contribution`: The calculated contribution amount. This field may be read-only, automatically calculated from `Hours Worked * Rate`, or an editable field returned by the API.
    -   `Actions`: A dropdown menu for each row with options like "Edit" and "Remove".
