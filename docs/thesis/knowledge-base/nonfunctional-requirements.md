# Non-Functional Requirements

**Source:** Ch5 §5.3-§5.4 (PDF pp.66-70); Ch1 §1.4.2.6 (PDF p.31). See [thesis-index.md](thesis-index.md).

## User roles & access (Ch5 §5.4.1, PDF pp.67-68)

RBAC (Ch5 §5.3, PDF p.66). Roles:

| Role | Responsibilities (thesis) | System role key |
|---|---|---|
| **Admin** | Manage all accounts, approve/reject accounts, see all department logs, delete contracts | `admin` |
| **Accounting** | Manage finances, send contract for preparation, approve/reject budget releases, manage payments, follow up late fees, distribute commissions to sales agents | `accounting` |
| **Sales** | Create contracts, fill client contract, send for approval, book tasting | `sales` |
| **Creative** | Manage event look; check props/floral/centerpiece inventory; validate availability; select items; request items from Purchasing | `creative` |
| **Linen** | Manage fabrics (tablecloths, napkins, chair covers); validate availability; request from Purchasing | `linen` |
| **Logistics** | Transportation; schedule trucks & drivers; manage pickup/delivery of items and staff to venue | `logistics` |
| **Stockroom** | Manage cleaning supplies & utensils inventory; request purchases; budget approval from Accounting | `stockroom` |
| **Purchasing** | Receive requests, find suppliers, get estimates, request budget approval, procure items | `purchasing` |
| **Banquet (Staff/Supervisor)** | Manage staff by assigning them to events | `banquet_supervisor` |
| **Kitchen** | (Menu/ingredient prep; role exists in system; not enumerated in §5.4.1 list) | `kitchen` |

> The system implements exactly these role keys (confirmed in `server/seed.js`). Note terminology: thesis says "Banquet Staff"; the system's login role is `banquet_supervisor` (line staff are records without logins — `server/routes/banquetStaff.js`). Kitchen is a full role in the system but is not explicitly listed in §5.4.1; recommend adding it to the thesis role list.

## NFR-1 Usability (Ch5 §5.4.2, PDF p.68)

Must be user-friendly, intuitive layout, clearly labeled buttons, minimal training required. (Supports objective SO9.)

## NFR-2 Institutional policies & compliance (Ch5 §5.4.3, PDF pp.68-69)

Aligns with Juan Carlo's pre-event/post-event phase workflow; digitizes without changing company practices.

## NFR-3 Availability & institutional support (Ch5 §5.4.4, PDF p.69)

Must remain available during peak seasons without lags/downtime. Requires: technical support person, regular automatic **data backups** with quick recovery, minimal downtime (maintenance at night/off-peak).

## NFR-4 User engagement & feedback (Ch5 §5.4.5, PDF p.69)

Collect user feedback on system performance, usability issues, new ideas; feedback is the primary indicator of effectiveness.

## NFR-5 Platform / device support (Ch1 §1.4.2.6, PDF p.31)

Web-based; optimized for desktop/laptop; **responsive layouts via Tailwind CSS** for mobile status-checking; notifications via push + email (Nodemailer).

## NFR-6 Security (Ch5 §5.3, PDF p.66)

Role-Based Access Control for authentication/authorization.

## Implementation status (summary)

- **RBAC / roles:** implemented (JWT auth + role gating).
- **Usability, responsive UI:** implemented (React + Tailwind; responsive).
- **Email/Nodemailer + push notifications:** **not implemented** as described — the system uses an **in-app `Notification` model**, not email or push. → *documented but not implemented* (see alignment report).
- **Data backups / availability SLA / technical-support structure:** operational/infra concerns; **not verifiable in the repo** → human confirmation required.
- **Commission distribution** (Accounting responsibility): **no commission code found** → gap.
