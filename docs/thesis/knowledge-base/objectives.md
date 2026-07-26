# Objectives

**Source:** Ch1 §1.3 (PDF p.16) and Ch5 §5.2 (PDF pp.65-66). See [thesis-index.md](thesis-index.md).

## General Objective

**Ch1 §1.3.1 (PDF p.16):** Design and develop a centralized Catering Event Management System (CEMS) for Juan Carlo Catering Services with functionalities that address present inefficiencies and limitations in their workflow, particularly internal coordination and communication across departments.

**Ch5 §5.2.1 (PDF p.65):** Design and build a centralized Catering Management System (CMS) that addresses inefficiencies, streamlines coordination, enhances communication, and digitizes operational workflows between departments.

## Specific Objectives — Ch1 §1.3.2 (PDF p.16)

| ID | Objective |
|---|---|
| O1 | Analyze and identify the current workflow of Juan Carlo Catering Services |
| O2 | Identify inefficiencies and coordination gaps in current operations |
| O3 | Develop a centralized management system with **contract relay, departmental dashboards, and real-time inventory tracking** |
| O4 | Develop a system **optimized for both desktop and mobile use** |
| O5 | Evaluate the system through **unit and integration testing** for functionality, reliability, effectiveness |
| O6 | Populate the system with operational data; conduct unit/integration testing to validate dashboards and reports |
| O7 | **Deploy in a live environment** for actual staff use and collect user feedback for refinement |

## Specific Objectives — Ch5 §5.2.2 (PDF pp.65-66)

| ID | Objective |
|---|---|
| SO1 | Develop a unified platform managing departmental tasks, requests, schedules, contracts, and event progress |
| SO2 | Enable real-time task routing, status tracking, and inventory updates for all departments |
| SO3 | Implement a **digital approval feature** for budgets, fabrication, materials, and other department processes |
| SO4 | **Automatic guest-based setup** — auto-suggest quantity of setup items based on expected guest count |
| SO5 | Implement **staff availability suggestions** for Logistics and Banquet based on event date |
| SO6 | Ensure the system functions smoothly on desktop computers/laptops |
| SO7 | Test the system thoroughly for reliability and effectiveness |
| SO8 | Test system accuracy using real operational data (dashboards and reports) |
| SO9 | Improve usability by coordinating with Juan Carlo staff and incorporating feedback |

## Notes for alignment

- **O4 (desktop AND mobile)** vs **SO6 (desktop/laptops)**: the two objective lists differ on mobile. Ch1 §1.4.2.6 (PDF p.31) says the system is *optimized for desktop* with *responsive layouts* for mobile status-checking. Treat mobile as "responsive, not a dedicated mobile app." (Human confirmation recommended — see recommended-thesis-updates.md.)
- **O7 (live deployment + feedback)** is an objective; deployment is out of scope for the AI agents (see CLAUDE.md). Status of live deployment requires human confirmation.
- **SO4/SO5** (guest-based suggestions, staff availability suggestions) map to implemented behavior (guest/pax-driven quantities; recommended driver/truck and banquet availability). See [traceability-matrix.md](traceability-matrix.md).
