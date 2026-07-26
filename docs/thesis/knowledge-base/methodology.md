# Methodology

**Source:** Ch3 (PDF pp.~46-53); Ch6 §6.1.1 (PDF p.77). See [thesis-index.md](thesis-index.md).

## Development methodology (Ch3 §3.1, TOC PDF p.3)

**Agile** development with **Scrum** (Ch3 §3.1.1-3.1.2). Iterative delivery with incremental refinement based on feedback.

## Phases (Ch3 §3.2)

The methodology defines five phases, each documented with **Tools** and **Input/Output**:

1. **Planning Phase** (§3.2.1) — requirements gathering, tools, inputs/outputs.
2. **Designing Phase** (§3.2.2) — system/UI/architecture design.
3. **Development Phase** (§3.2.3) — implementation.
4. **Testing Phase** (§3.2.4) — verification.
5. **Finalization Phase** (§3.2.5) — wrap-up/deployment prep.

A **Work Plan / Gantt Chart** is provided in §3.3 (image; not OCR-read).

## Validation methodology (Ch6 §6.1.1, PDF p.77)

- **User Acceptance Testing (UAT)** as the primary validation approach.
- Departmental personnel evaluated the platform by **simulating day-to-day scenarios** rather than strictly following predefined scripts ("experimental testing methodology"), enabling iterative refinement from direct user feedback.
- **Role-based access controls strictly maintained** during testing (each employee interacted only with their department's interfaces/data).
- Assessed the four core modules (Event Management, Inventory, Scheduling, Financial) plus cross-cutting processes: **secure authentication, digital approval workflows, automated distribution of event details**.
- Results recorded per module as tables: Test Case, Procedure, Input Data, Expected Result, Actual Result, Status. (Ch6 §6.1.2, PDF pp.77+)

## Alignment note

The thesis's testing narrative is **UAT-centric** (manual, scenario-based). The repository does **not** appear to contain an automated unit/integration test suite (no test runner config observed), even though objectives O5/O6 and SO7 mention "unit and integration testing." This is a divergence between the *stated* evaluation method (unit/integration in objectives) and the *actual* method (UAT). See [evaluation-criteria.md](evaluation-criteria.md) and the alignment report — recommend reconciling the objective wording with the UAT approach actually used.
