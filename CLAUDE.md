# Capstone AI Development Rules

## Project Stage

This capstone is in the final revision, testing, documentation, and
stabilization stage.

Changes must be:

- Small and controlled
- Traceable to the thesis or approved requirements
- Independently tested
- Documented with evidence
- Reversible through Git
- Reviewed by a human before merging

## Source of Truth

The following sources must be consulted in this order:

1. Thesis paper and approved capstone documentation
2. Existing functional and nonfunctional requirements
3. Existing source-code behavior
4. Approved change request
5. Research and alignment report
6. Implementation and testing evidence

The thesis paper is the primary source for project scope, objectives,
requirements, methodology, intended users, limitations, and evaluation criteria.

## Required Workflow

Every change must follow this exact sequence:

1. Read the queued change request.
2. Run the capstone-researcher.
3. Produce a thesis-alignment and research report.
4. Check whether the change is aligned, conditionally aligned, conflicting,
   or blocked.
5. Run the capstone-developer only when implementation is permitted.
6. Run the capstone-tester after implementation.
7. Return exact failures to the Developer when testing fails.
8. Repeat implementation and testing for no more than the configured number
   of repair cycles.
9. Run the capstone-panelist only after a PASS or
   PASS WITH MINOR OBSERVATIONS verdict.
10. Commit completed changes to the isolated AI worktree branch.
11. Never merge, deploy, publish, or push automatically.

## Agent Ownership

### Capstone Researcher

- Reads the thesis and existing system
- Checks thesis and requirement alignment
- Researches suitable solutions
- Defines acceptance criteria
- Does not modify application source code

### Capstone Developer

- Implements only approved changes
- Modifies application source code
- Adds or updates tests
- Does not approve its own work
- Does not merge, push, or deploy

### Capstone Tester

- Independently reviews the implementation
- Runs functional, regression, validation, build, and security checks
- Does not modify application source code
- Does not silently fix issues

### Capstone Panelist

- Runs only after testing
- Reviews the thesis basis, change, implementation, and evidence
- Generates defense questions and suggested answers
- Focuses only on completed changes
- Does not invent evidence or unrelated project features

### Team Lead

- Controls the complete workflow
- Saves all reports
- Enforces repair and safety limits
- Maintains the nightly summary
- Commits passed changes
- Never merges into the main branch

## Automatic-Run Rules

During unattended execution:

- Do not ask the user questions.
- Mark unresolved requests as BLOCKED.
- Clearly state what human decision is needed.
- Continue to the next queued request when safe.
- Do not guess missing requirements.
- Do not weaken tests to obtain a passing verdict.
- Do not claim success without executed evidence.
- Do not remove existing working functionality unless explicitly requested.
- Do not expand the approved project scope.

## Prohibited Actions

The agents must never automatically:

- Merge into main, master, production, or release branches
- Push commits to a remote repository
- Deploy the application
- Modify a production database
- Access or expose secrets
- Modify .env files
- Force-push
- Run destructive Git cleanup commands
- Delete branches containing unmerged work
- Purchase or subscribe to services
- Publish packages
- Change the thesis scope
- Fabricate test results
- Mark failed tests as passed

## Stop Conditions

A change must be marked BLOCKED when:

- It conflicts with the approved thesis scope
- A human decision is required
- Required thesis evidence cannot be found
- The request is too vague to produce measurable acceptance criteria
- Production access would be required
- A destructive database migration would be required
- A new paid service would be required
- The configured repair limit has been reached
- The same error occurs repeatedly without meaningful progress
- Required dependencies or services are unavailable
- Testing cannot be performed reliably

## Reporting Standard

Every completed change must have:

- Original request
- Thesis-alignment report
- Research report
- Acceptance criteria
- Implementation report
- Test report
- Git-diff summary
- Panel questions and suggested answers
- Final status
- Commit identifier