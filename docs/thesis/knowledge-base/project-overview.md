# Project Overview

**Source:** `docs/thesis/thesis-draft-current.pdf`. See [thesis-index.md](thesis-index.md).

## What the project is

A centralized **Catering Management System (CMS)** — also called *Catering Event Management System (CEMS)* in Chapter 1 — custom-built for **Juan Carlo Catering Services** to replace manual, paper-based interdepartmental workflows with a single web platform that centralizes event details, automates task distribution, and provides real-time tracking across departments. (Ch1 §1.3.1, PDF p.16; Ch5 §5.1, PDF pp.64-65)

## Intended users (departments/roles)

Admin, Accounting, Sales, Creative, Linen, Logistics, Stockroom, Purchasing, Banquet, Kitchen. (Ch5 §5.4.1, PDF pp.67-68) — see [nonfunctional-requirements.md](nonfunctional-requirements.md) for role details.

## Core lifecycle covered

Full catering lifecycle in three phases (Ch1 §1.5.2 Scope, PDF p.32):
- **Pre-event:** client inquiries, contract creation, event detail encoding, departmental assignment, inventory checks, delivery scheduling, event briefs.
- **During-event:** real-time coordination, task monitoring, incident reporting by the Banquet Supervisor.
- **Post-event:** packing, inventory count, logging returned/damaged/missing items, post-event summaries.

## Key features (as described in Ch5 §5.1, PDF pp.64-65)

Centralized contract entries; automated task distribution; digital approvals; real-time tracking; paperless workflow; inventory management (view/add/edit/delete); contract creation with drafts; **menu tasting booking**; pre-event & contract preparation tracking; **banquet staffing management**; **logistics booking** (third-party truck rental per thesis); **purchasing/procurement** with supplier-based requests for Accounting approval; **post-event checking**; **incident reporting** (with optional image); **printable/exportable forms** per department; **client & staff signature** workflow (send for signature, record signed status, generate signed contract copy).

## Technology (Ch1 §1.4.2, PDF pp.28-31; Ch5 §5.3 & §5.6, PDF pp.66-71)

React.js + Tailwind CSS (frontend), Node.js (backend), MongoDB (database), Role-Based Access Control. Proposed integrations that are **not present in the current build** (see alignment report): Google Calendar/Maps APIs, Acrobat Sign (e-signature), Facebook Prophet (inventory forecasting), Nodemailer (email notifications).

## Current implementation snapshot (repository)

The repository (`REDEF/`, branch CAP2) is a Vite + React + TypeScript frontend with an Express + MongoDB backend (`server/`) sharing one `package.json`. It implements the Contract/Sales, Accounting/Payments, Kitchen, Logistics (with owned fleet + staff transport), Banquet, Creative/Linen/Stockroom inventory, Purchasing/Procurement, Reports, Incidents, and in-app Notifications areas. This is **broader and more granular** than the "four modules" framing of Chapter 1, and matches the Chapter 5 feature list closely. See the [alignment report](../../../agent-artifacts/thesis-system-alignment-report.md).
