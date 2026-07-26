# Architecture Basis

**Source:** Ch1 §1.4.2 (PDF pp.28-31); Ch5 §5.3 & §5.6 (PDF pp.66-71). See [thesis-index.md](thesis-index.md).

## Layered architecture (Ch5 §5.6, PDF pp.70-71)

- **Presentation Layer** (§5.6.1): React.js UI with **role-based dashboards** (e.g., Kitchen sees kitchen tasks; Sales sees contracts/payments); Tailwind CSS for clean, responsive styling.
- **Application Layer** (§5.6.2): Node.js backend logic.
- **Data Layer** (§5.6.3): MongoDB.

## Technology stack

| Concern | Thesis (Ch1 §1.4.2 / Ch5 §5.3) | Current system |
|---|---|---|
| Frontend | React.js + Tailwind CSS | ✅ React + TypeScript + Vite + Tailwind |
| Backend | Node.js (+ Nodemailer.js) | ✅ Node.js + Express (**no Nodemailer** — see note) |
| Database | MongoDB | ✅ MongoDB (Mongoose) + MongoDB Atlas |
| Auth | Role-Based Access Control | ✅ JWT auth + role gating |
| E-signature | Acrobat Sign API / "E-Signature API" | ⚠️ **Workaround:** custom signature (image upload + signature-ready printable PDF) |
| Scheduling/logistics | Google Calendar API + Google Maps API | ⚠️ **Not used:** internal calendar/availability logic + owned fleet models |
| Inventory forecasting | Facebook Prophet (Meta) | ⚠️ **Workaround/omitted:** no ML forecasting; dynamic same-day reservation checks instead |
| Notifications | Push notifications + email (Nodemailer) | ⚠️ **Workaround:** in-app `Notification` model (no email/push) |

> Per the project owner: the external APIs (Nodemailer, forecasting, Google, Acrobat Sign) were **intentionally replaced with in-system workarounds**; they are not pending work. The **thesis** should be updated to describe the actual approach — see [recommended-thesis-updates.md](recommended-thesis-updates.md).

## Dev tools (Ch5 §5.3, PDF p.67)

VS Code, Git/GitHub, MongoDB Compass. Hardware/network: cloud-hosted server, office computers/laptops, stable internet.

## Design artifacts referenced (images, not OCR-read)

- Figure 1.2 Conceptual Framework (PDF p.18)
- Figure 1.10 Design Architecture (PDF p.28)
- BPMNs (Ch5 §5.8): Menu Booking → Contract Creation; Pre-Event Preparation; Post-Event (TOC PDF p.5)

## Repository structure (current)

- `src/` — React/TS frontend (`pages/`, `components/`, `contexts/`, `services/api.ts`, `lib/`, `pages/dashboards/` per-role dashboards).
- `server/` — Express API (`routes/`, `models/`, periodic sweeps: `paymentCompliance.js`, `logisticsStatusSync.js`, `kitchenPrepNotifications.js`), Mongoose models incl. `Contract`, `Logistics` (Driver/Truck), `MenuTasting`, `Notification`, inventory models.
- Single `package.json` runs both (`npm run dev` = server + Vite).
