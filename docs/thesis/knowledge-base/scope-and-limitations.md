# Scope, Assumptions, and Limitations

**Source:** Ch1 §1.5 (PDF pp.31-34). See [thesis-index.md](thesis-index.md).

## Assumptions (§1.5.1, PDF pp.31-32)

- Departments consistently follow pre-event / during-event / post-event phases.
- Staff are willing to adopt a digital solution and be trained.
- The organization has the infrastructure (computers, internet) to deploy and use the system.
- Key problems (inventory delays, document misplacement, scheduling conflicts, verification bottlenecks) are recurring, not isolated.
- The system is based on current organizational practices assumed representative of operations.

## Scope (§1.5.2, PDF p.32)

Supports the **full catering lifecycle**:

- **Pre-event:** client inquiries, contract creation, event-detail encoding, internal coordination; assigning responsibilities to Kitchen, Logistics, Creative, Warehouse; checking inventory availability; scheduling deliveries; preparing event briefs.
- **During-event:** real-time coordination and task monitoring; Banquet Supervisor issue reporting; food prep & dispatch, logistics coordination, on-site setup & styling.
- **Post-event:** packing, inventory count, reporting; logging returned items, updating inventory counts, noting damaged/missing equipment, generating post-event summaries.
- **Basic inventory forecasting** using historical data via **Facebook Prophet** to assist procurement planning.

**Explicitly excluded by scope:** third-party integrations such as e-commerce platforms; advanced analytics like trend prediction (beyond basic inventory demand forecasting).

## Limitations (§1.5.3, PDF pp.33-34)

- Tailored to Juan Carlo; limited applicability to other caterers without customization.
- Effectiveness depends on staff technological readiness and willingness to adopt.
- Cannot control external factors: traffic, weather, vehicle breakdowns.
- Cannot override human decision-making; approval delays may persist if heads are unavailable (alerts/notifications only).
- Does not manage human-resource availability; manpower shortages may persist.
- Forecasting limited to inventory demand; cannot account for supplier delays or stock unavailability.
- Cannot eliminate human error or hardware disruptions (power outages, crashes).

## Alignment flags (see alignment report)

- **Facebook Prophet forecasting** is in scope per the thesis but is **not implemented** in the current system → *documented but not implemented*.
- Scope says "third-party integrations … will not be included," yet the thesis elsewhere proposes **Google Calendar/Maps APIs** and **Acrobat Sign** (Ch1 §1.4.2). These are third-party integrations and are also **not implemented**. This is an internal thesis tension worth a human decision (see [recommended-thesis-updates.md](recommended-thesis-updates.md)).
- The current system's **Logistics uses an owned/rented internal fleet** (Driver/Truck models) plus **staff transportation**, which is broader than the pre-event "scheduling deliveries" wording. Approved-change territory — confirm with the team.
