# Change Request

Change ID: CHANGE-EXAMPLE

Status: EXAMPLE ONLY

Priority: Medium

## Change Title

Allow draft evaluations to remain editable

## Requested Change

Allow evaluators to edit an evaluation while it is still saved as a draft.

Once finalized, the evaluation must become read-only.

## Reason for Change

Evaluators may notice mistakes before final submission and need a safe way to
correct them.

## Current Behavior

The form becomes difficult or impossible to edit after the initial save.

## Expected Behavior

Draft evaluations remain editable.

Finalized evaluations cannot be modified through the interface or direct API
requests.

## Affected Users

- Evaluators
- Interns whose performance is being evaluated

## Expected Thesis Basis

Existing performance-evaluation module and data-integrity requirements.

## Acceptance Expectations

- Draft records can be edited.
- Finalized records remain immutable.
- Existing scores remain accurate.
- Unauthorized users cannot edit evaluations.

## Restrictions

- Do not alter the scoring formula.
- Do not alter historical finalized records.
- Do not change unrelated evaluation reports.

## Testing Notes

Test draft editing, finalization, direct API modification attempts, user roles,
validation, and regression behavior.