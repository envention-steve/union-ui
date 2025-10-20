# Reporting Feature Implementation Plan (UI)

## 1. Objective

This document outlines the frontend tasks required to build a user interface for selecting, filtering, and downloading reports. The UI will interact with the new reporting endpoints on the Union API and provide a seamless, intuitive user experience.

## 2. Core Technologies

- **Framework:** Next.js / React
- **Styling:** Tailwind CSS
- **Component Library:** shadcn/ui
- **API Communication:** The existing `lib/api-client.ts` and TanStack Query.
- **Testing:** Jest and React Testing Library
- **Linting:** ESLint

## 3. Implementation Steps

### Step 3.1: Project Structure & Scaffolding

1.  Create a new route for the reporting section under the authenticated dashboard: `app/dashboard/reports/page.tsx`.
2.  Create new components in the `components/features/` directory:
    *   `reports/ReportDashboard.tsx`: The main container component for the page.
    *   `reports/ReportFilters.tsx`: A component for user-selectable filters like date ranges.
    *   `reports/ReportCard.tsx`: A component to display a single available report with its description and download buttons.

### Step 3.2: API Integration

1.  **Extend the API Client:** Add new methods to the existing `lib/api-client.ts` for:
    *   Fetching a list of available reports.
    *   Downloading a specific report file.
2.  **Data Fetching:** Use TanStack Query's `useQuery` hook within `ReportDashboard.tsx` to fetch the list of available reports from the API. This will handle caching, loading states, and error states automatically.
3.  **File Downloads:** Use TanStack Query's `useMutation` hook to handle the report download action. The mutation function will call the relevant method in `api-client.ts`.
4.  The download logic inside the API client will:
    *   Construct the correct URL with query parameters (e.g., `/api/reports/membership_summary?format=pdf&start_date=...`).
    *   Make the `GET` request to the backend.
    *   Handle the response as a `blob`.
    *   Create a temporary object URL using `URL.createObjectURL(blob)`.
    *   Create a temporary `<a>` element, set its `href` and `download` attributes, and programmatically click it to trigger the browser download.
    *   Revoke the object URL (`URL.revokeObjectURL`) to free up memory.

### Step 3.3: Component Development & UI

All new components will be built using the project's existing **shadcn/ui** library to ensure visual consistency.

1.  **`ReportDashboard.tsx`**:
    *   Use the `useQuery` hook to fetch the list of available reports.
    *   Manage local UI state (like selected filters) using `useState`.
    *   Render a loading state (e.g., `Skeleton` components) while the report list is fetching.
    *   Map over the fetched data and render a `ReportCard` for each report.
2.  **`ReportFilters.tsx`**:
    *   Use `shadcn/ui` components like `Select` and a date picker for filter controls.
    *   Use a callback function (`onFilterChange`) to lift the state of the selected filters up to the `ReportDashboard`.
3.  **`ReportCard.tsx`**:
    *   Use the `Card` component from `shadcn/ui` for the main structure.
    *   Display the report's title and description.
    *   Include two `Button` components: "Download PDF" and "Download CSV".
    *   The `onClick` handlers will trigger the `useMutation` hook for downloading, passing the correct `format`.
    *   The mutation's loading state will be used to disable the buttons and show a spinner.
    *   Use the `sonner` component to show toast notifications for download success or failure.

### Step 3.4: State Management

1.  **Server State:** All server state (fetching report lists, download status) will be managed by **TanStack Query**.
2.  **UI State:** Component-level state (e.g., the current value of a date filter) will be managed with React hooks (`useState`, `useCallback`).

### Step 3.5: Testing

1.  **Unit Tests:**
    *   In `__tests__/components/features/reports/`, create test files for the new components.
    *   Use React Testing Library to render components and simulate user interactions (e.g., changing a filter, clicking a download button).
    *   Mock the `api-client.ts` methods to isolate the components from network requests.
2.  **Interaction Tests:**
    *   Verify that triggering the download mutation calls the API client with the correct arguments (`reportName`, `filters`, `format`).
    *   Test the loading and error states (including toast notifications) to ensure the UI provides correct feedback.

### Step 3.6: Code Quality

1.  After implementation and testing, run the project's linting script to ensure all new code adheres to project standards.
    ```bash
    npm run lint
    ```
2.  Fix any reported issues.