# Change Request

Change ID: CHANGE-000

Status: COMPLETE (uncommitted — awaiting human commit/push)

Priority: High

## Change Title

Fix pre-existing type errors that break `npm run build`

## Requested Change

Make `npm run build` (`tsc -b && vite build`) pass. It was failing on pre-existing TypeScript errors in `src/components/AccountingFinanceModule.tsx` unrelated to feature work.

## Reason for Change

A broken production build blocks reliable testing (the Tester runs build/type checks) and deployment. Classified as a bug fix — squarely in scope for a bug/stabilization pass.

## Current Behavior (before)

`tsc -b` reported: `'overview' is possibly 'null'` at AccountingFinanceModule.tsx lines 468, 476, 478 — `overview` (typed `FinanceOverview | null`) accessed without optional chaining, while every other usage in the file uses `overview?.`.

## Expected Behavior (after)

`tsc -b` exits clean; `npm run build` no longer blocked by these errors.
