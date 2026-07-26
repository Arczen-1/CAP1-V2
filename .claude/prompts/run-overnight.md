Run the complete unattended capstone workflow.

Read CLAUDE.md and agent-config.json first.

Then:

1. Locate and analyze the thesis files inside docs/thesis/.
2. Build or update the structured thesis knowledge base.
3. Locate pending Markdown change requests inside agent-queue/.
4. Ignore files beginning with an underscore.
5. Process requests one at a time.
6. Use the capstone-researcher before implementation.
7. Block changes that conflict with the thesis or require a human decision.
8. Use the capstone-developer for approved implementations.
9. Use the capstone-tester for independent verification.
10. Permit no more than the configured number of repair cycles.
11. Run the capstone-panelist only after an acceptable test verdict.
12. Save all reports under agent-artifacts/changes/<CHANGE-ID>/.
13. Commit each passing change separately.
14. Update the queue status.
15. Produce agent-artifacts/nightly-summary.md.

Do not ask the user questions during this run.

When information is missing, mark the relevant request BLOCKED and continue
when it is safe to do so.

Never merge.
Never push.
Never deploy.
Never access production systems.
Never modify production data.
Never modify secrets.
Never weaken tests to obtain a passing result.