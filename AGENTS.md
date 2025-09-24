# Repository Guidelines

## Project Structure & Module Organization
- Next.js App Router lives in `app/`, grouped by route segments like `(auth)` and `(dashboard)`; keep new pages colocated with supporting layouts.
- Shared UI sits in `components/` (`ui/` for shadcn primitives, `features/` for business flows) while logic helpers belong in `lib/`, global state in `store/`, and reusable hooks in `hooks/`.
- Tests mirror the runtime code under `__tests__/` with `unit/`, `integration/`, and `e2e/` subfolders; docs and design references stay in `docs/`.

## Build, Test, and Development Commands
- `npm run dev` starts the local Next.js server (Turbopack); only run when coordinating with the user.
- `npm run build` produces the production bundle; use for release validation.
- `npm run lint` enforces project formatting and catches TypeScript issues.
- `npm run test`, `npm run test:watch`, and `npm run test:coverage` run Jest once, in watch mode, and with coverage output respectively.

## Coding Style & Naming Conventions
- TypeScript and React components use PascalCase filenames (`AccountSummaryCard.tsx`), hooks use the `use*` camelCase pattern, and utilities remain lowercase camelCase.
- Follow the default 2-space indentation from the existing codebase, keep Tailwind classes ordered contextually, and prefer functional components with explicit props typing.
- Linting is powered by `eslint.config.mjs` (Next.js + TypeScript rules); run lint before opening a PR.

## Testing Guidelines
- Jest with Testing Library drives all unit and integration specs; place UI-focused tests under `__tests__/components/` or `__tests__/app/`.
- Name files `*.test.ts` or `*.test.tsx` and mirror the directory structure of the code under test to keep paths intuitive.
- Maintain or improve current coverage when touching core flows (auth, dashboard, benefits); use `npm run test:coverage` to confirm before review.

## Commit & Pull Request Guidelines
- Recent history favors short, descriptive messages in sentence case (e.g., `Improve claims summary totals`); keep them focused on one change set.
- Draft PRs should summarize the change, link related Jira or GitHub issues, and include screenshots or GIFs for UI updates.
- Call out new environment variables or migrations in the PR body and note any manual verification steps reviewers should run.

## Environment & Configuration Notes
- Duplicate `.env.example` to `.env.local` and update API endpoints (`NEXT_PUBLIC_API_URL`) before running locally.
- Never commit secrets or local logs; add new config keys to `.env.example` and document usage in `docs/` when relevant.

### When stuck
- ask a question
- propose a short plan