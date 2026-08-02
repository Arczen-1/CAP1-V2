# FinalWalkthrough.docx — Build Plan & Handoff

Rebuilding the 49-page *User Manual* as a scenario-driven **walkthrough** that
follows one contract lifecycle, in the school's sample format, keeping the
existing document's academic formatting.

---

## Current status

| | |
|---|---|
| **Latest file** | docs/FinalWalkthrough.docx (4.58 MB) |
| **Written** | **COMPLETE TEXT** — front matter, all 9 stages, both appendices |
| **Figures embedded** | **43 of 43 — complete** |
| **Figures outstanding** | **none** |
| **Table of contents** | built in — a live Word TOC field, page 2 |
| **Remaining** | open the file in Word once and let the TOC populate |

Verified on the last build: `media: 43 · drawings: 43 · placeholders left: 0 ·
w:p balance 866/866 · TOC field present · outlineLvl 3 · TOC styles 3 ·
all XML parts well-formed`.

**The scenario now runs end to end.** `JC-2608-0001` was driven all the way to
**Closed (2 Aug 2026)** — banquet staffed, both transports booked, dispatched
and completed, all four post-event closeout areas Ready, the *Ready to close*
alert raised to Accounting, and the contract closed. Figure 12.4 previously
carried the caption *"Closed contract"* while showing a contract at 25 % with a
*Close Contract* button still on screen; it has been recaptured and now matches.

### Findings from capturing (corrections already applied)

- **Stage 2 is performed by Sales, not Kitchen.** `canManageTasting = isSales() || isAdmin()`.
  Kitchen's view of a tasting has no action buttons at all.
- **Tasting actions are date-gated.** `Record Feedback` / `Mark No-Show` only appear
  once the tasting date has been reached.
- **Phone format is inconsistent between modules.** The tasting accepts
  `0917-555-0188`; the contract form requires exactly 11 digits and rejects it with
  *"Mobile must be 11 digits"*. Scenario data now uses `09175550188`.
  **This is a real validation gap worth fixing in the app.**
- **The booking form will not accept an event less than 6 months out.** The
  Preferred Event Date field defaults to *today + 6 months* and greys out
  everything earlier, with no on-screen explanation (finding 9). Figure 4.4 is
  therefore framed on the client sections only.
- **Package tiers require an EXACT dish count per course**, not an upper limit.
  Standard = 4 mains / 3 sides / 2 desserts / 2 drinks; saving is rejected until each
  course matches exactly. (Ch. 6 corrected — it originally said "caps".)
- **The contract form's tracker and tab labels differ** — tracker says
  *Client / Event / Menu / Inventory / Summary*, tabs say
  *Client Info / Event Details / Package & Menu / Add-ons / Summary*.

Spacing pass applied (explicit spacing everywhere, `keepNext` on headings and
figures). File naming consolidated — the `-v2` interim build is gone.

---

## How to rebuild

All build tooling lives in the session scratchpad:

```
scratchpad/
  buildwalkthrough.js   # docx generator (clones the manual, swaps the body)
  wtcontent.js          # ALL document content, as a data array
  _setsrc.js            # attaches a captured PNG to a figure entry
  capture.sh            # plain page capture via headless Chrome
  cdp.js                # INTERACTIVE capture — drives the page, then shoots
  steps/*.json          # per-figure interaction scripts for cdp.js
  docx/x/               # the extracted original User Manual package
  shots/                # captured PNGs
  profiles/             # per-role signed-in Chrome profiles
```

Build (run from `scratchpad/`):

```bash
node buildwalkthrough.js docx/x "C:/Users/P12CDA9/Downloads/CAP1-V2/docs/FinalWalkthrough.docx" ./wtcontent.js shots
```

> **Use a `C:/…` path for the output.** A Git-Bash-style `/c/Users/…` path is
> resolved by Node as *current-drive root* — the build silently lands in
> `C:\c\Users\…` and the real document is never touched. The give-away is a
> reported size that doesn't match the file on disk.

Attach a capture to its figure, then rebuild:

```bash
node _setsrc.js "Figure 7.3=fig-7-3-creative-done.png"
```

Capture:

```bash
bash capture.sh init  <role>                       # once per role
bash capture.sh shot  <role> <path> <name> [w] [h] # static pages only
MSYS_NO_PATHCONV=1 node cdp.js <role> <path> <name> <w> <h> steps/x.json [KEY=VALUE…]
```

Roles with profiles: `sales accounting kitchen banquet logistics creative
purchasing stockroom`. Add one with `capture.sh init <role>`.

---

## Key technical facts (hard-won — don't rediscover)

- **Clone, don't generate.** The output copies the original package so fonts,
  `sectPr`, header and footer stay identical. Only `word/document.xml` is rewritten.
- **`TableGrid` style does not exist** in the source. Tables declare borders explicitly.
- **Namespaces `a:` and `pic:` are not on the root** element — they are declared
  inline on `<a:graphic>` / `<pic:pic>`, as Word itself does.
- **Page geometry:** Letter, 1″ margins → content width 9360 twips = **5,943,600 EMU**.
  Images scale to this width and never upscale.
- **Image relationship ids start at `rIdImg9001`** to avoid colliding with the
  ~50 relationships already in the package.
- **`[Content_Types].xml` must declare `png`** — the builder adds it if missing.
- **Screenshots need a persistent Chrome profile.** A bootstrap page that logs in
  then redirects does *not* work with `--virtual-time-budget` (it expires mid-login).
  Instead: `capture.sh init <role>` writes the auth token into a profile's
  localStorage, and later captures load the target URL directly with that profile.
- **Close the .docx in Word before rebuilding**, or the write fails with EPERM.
- **If a build fails part-way it leaves no .docx behind** and a stale
  `docs/_wtbuild/` holding a locked `word/media/figure*.png`. Delete `_wtbuild`
  and run again — the output is fully regenerated from `wtcontent.js` + `shots/`,
  so nothing is lost.

### cdp.js — driving the page before the shot

`capture.sh` can only load a URL and shoot it. Anything behind a dialog, a tab
click or a filled-in form needs `cdp.js`, which launches the same persistent
Chrome profile with `--remote-debugging-port` and talks CDP over Node 24's
built-in `WebSocket` (no puppeteer, nothing to install).

`steps/*.json` is an array of:

| Step | Effect |
|---|---|
| `"js expression"` | evaluated in the page |
| `{ "clickJs": "<expr → element>" }` | **real** mouse click at the element's centre |
| `{ "shot": "name", "clip": "sel\|js:expr", "pad": 0 }` | capture; `"@"` uses the CLI name |
| `{ "wait": ms }` / `{ "waitFor": "sel" }` / `{ "scrollTo": "sel" }` | timing |

Page helpers in scope: `norm all $t $c click clickSel fire setNative byId setId
fill fillLabel byLabel scroller toTop pickOption pickDate nap`. Trailing
`KEY=VALUE` CLI arguments become page constants, so one steps file serves
several figures (used by `steps/notif-one.json`).

**Hard-won details:**

- **`MSYS_NO_PATHCONV=1` is mandatory.** Git Bash rewrites a leading-slash route
  like `/menu-tastings/x` into `C:/Program Files/Git/menu-tastings/x`, and Chrome
  then reports *"Cannot navigate to invalid URL"*.
- **Don't pass the URL on Chrome's command line** when using a debugging port —
  `/json/list` hands back the new-tab target. Launch `about:blank`, attach, then
  `Page.navigate`.
- **`element.click()` is not enough.** Radix menus/selects and react-day-picker
  need real pointer events; day-cell buttons even carry `pointer-events: none`
  when disabled. `clickJs` dispatches `Input.dispatchMouseEvent`.
- **Scroll, settle, *then* measure.** Floating menus reposition on scroll, so a
  rect read in the same tick is stale by the time the click lands.
- **The app scrolls an inner container**, so `window.scrollTo` and
  `captureBeyondViewport` do nothing. Use `toTop()` / `scrollIntoView`, keep
  clips in viewport coordinates, and make the window tall enough.
- **shadcn `Select` renders a hidden native `<select>`** (`aria-hidden`,
  1×1 px). Setting its value does nothing — click the trigger, then `[role=option]`.
- **Dish note fields are `<input>`, not `<textarea>`.** Only the overall comment
  is a textarea; indexing `all('textarea')` skips five of six fields.
- **The first `[role=option]` is usually the placeholder** ("Choose staff
  member"). Filter it out or every pick is a no-op.
- **Checklist rows label their checkbox without associating it**, so clicking the
  dish name does nothing. Use the `box('Beef Caldereta')` helper, which walks up
  from the label to the row's real `[role=checkbox]`.
- **Print buttons call `window.open('', '_blank')` then `document.write`.**
  Override `window.open` to create a full-viewport iframe and return its
  `contentWindow`, stubbing `print()` and `focus()` so headless doesn't hang —
  then capture the page. See `steps/print-capture.json`; it is parameterised by
  `TAB` and `BTN`, so it serves any print output in the app.
- **Step strings must not end in `;`** — they are wrapped in `return (…)`. The
  runner strips a trailing semicolon, but avoid statement-style steps.

---

## Spacing scale (applied in `render()`)

All spacing is written explicitly so style defaults can never double up.
Space is carried by the element *following* a gap.

| Element | before | after |
|---|---|---|
| Heading 1 | 0 | 240 |
| Heading 2 | 360 | 160 |
| Heading 3 | 280 | 140 |
| Paragraph | 0 | 180 |
| Step | 200 | 100 |
| Input line | 0 | 60 |
| Bullet | 0 | 100 |
| Note / rule | 200 | 200 |
| Figure image | 280 | 80 |
| Figure caption | 0 | 360 |
| Table trailer | 0 | 240 |

Body text uses `w:line="276"` (1.15). Headings, figures and their captions carry
`keepNext` so nothing is orphaned at a page break (24 in the current build).

---

## The scenario (live records — already created)

**Menu tasting `TASTE-2608-0001` — Amanda Robles, 60th Birthday**

| Field | Value |
|---|---|
| Email / phone | amanda.robles@example.com · 09175550188 |
| Address | 24 Mabini Street, Barangay Poblacion, Lipa City, Batangas 4217 |
| Guests | 180 |
| Tasting | moved to the demo date, status Confirmed, 2:00 PM, 4 pax |
| Event date | 22 Aug 2026 |
| Dishes | Beef Caldereta · Chicken Cordon Bleu · Lechon Kawali · Baked Macaroni · Buko Pandan |
| Notes | Mildly spiced; two guests lactose intolerant |
| Venue (Stage 3) | Lima Park Hotel – Grand Ballroom, Malvar, Batangas |

**Contract `JC-2608-0001`** was created from this tasting (draft, event +20 days,
180 pax, Standard package, PHP 261,000). It carries a deliberate shortage —
Chafing Dish Oval, need 30 / 25 free — which produced procurement request
**PR-26-0035** (5 units, rental, 13 days lead, SLA On Track).

> `MenuTasting.menuItems` uses **`itemName`**, not `name`. The sanitiser silently
> drops entries with the wrong shape.

---

## Remaining work

### Figures captured against a different record

Four figures could not be shot on `JC-2608-0001`, because the walkthrough's own
contract is closed and its event has passed. **Each caption says so on the page.**
Keep them honest if these are ever recaptured.

| Figure | Record | Why |
|---|---|---|
| 7.2 | `DEMO-R11-SAMEDAY-B` | Needs a **draft** contract with a live shortage. Conveniently short by 2 *Chafing Dish Oval* — the same item as the walkthrough's shortfall. |
| 8.2 | `PR-26-0034` | `PR-26-0035` is fulfilled and long past this stage. PR-26-0034 is also a *Chafing Dish Oval* requisition still awaiting a budget request. |
| 10.8 | `DEMO-R7-WAITER-RATIO` | The walkthrough's venue is Malvar, Batangas — number coding only applies inside Metro Manila. Pasay + Friday gives coded digits 9 and 0. |
| 11.2 | `DEMO-R5-FREEZE` | The freeze needs an event **inside** the next 7 days; the walkthrough's event has passed. |

### One caption corrected during capture

**Figure 10.3** was written as *"Printed kitchen checklist showing the
carried-over preparation notes"*. The contract's Menu tab offers **Print Menu
Summary**, and that output lists each dish with its contracted quantity but
**not** the per-dish notes. The dedicated kitchen checklist lives on the Kitchen
page's *This Week* view, which the walkthrough's contract can no longer appear in.
The caption now describes what the figure actually shows. The carry-over itself
is still evidenced — Figure 6.4 shows Buko Pandan tagged *"Dessert · from
tasting"* with the note auto-filled from the tasting feedback.

### Also outstanding

- **Fix finding 8** (notification deep-links landing on Details) before the
  defense — it undercuts the "notifications take you to the work" claim.

---

## Table of contents

The document ships with a **real Word TOC field** (`TOC \o "1-3" \h \z \u`) on
page 2, not a typed-out list, so it stays correct as content moves. Three things
had to be in place for it to work, all now done by the builder:

1. **Outline levels.** A TOC field collects paragraphs by outline level, and the
   source package's `Heading1/2/3` styles had **no `w:pPr` at all** — only a
   `w:rPr`. The builder now inserts `<w:pPr><w:outlineLvl w:val="N"/></w:pPr>`
   into each, before the `w:rPr` (order matters in a style definition).
   *An earlier attempt anchored the insert on `<w:pPr>`; because the headings
   have none, the non-greedy match ran past `</w:style>` and stamped an outline
   level onto an unrelated style. Always bound the match with `</w:style>`.*
2. **Entry styles.** `TOC1`–`TOC3` did not exist. The builder adds them with a
   right tab stop at 9360 twips and a dot leader, so the refreshed TOC lines up
   with the right margin.
3. **`<w:updateFields w:val="true"/>`** in `settings.xml`, so Word resolves the
   field when the document opens.

**On opening in Word**, accept the "update fields" prompt if it appears. If the
page still shows the grey placeholder line, click it and press **F9** (or
References → Update Table). Page numbers can only be produced by Word's layout
engine — no generator can precompute them.

The contents heading is a plain centred bold paragraph, *not* `Heading1`, so the
contents page does not list itself.

> Not included: a **List of Figures**. That needs each caption to carry an `SEQ
> Figure` field; the captions are currently plain italic paragraphs. Adding it
> means emitting `SEQ` fields in the `fig` renderer and a second
> `TOC \h \z \c "Figure"` field.

| Stage | Actor | Content |
|---|---|---|
| 1 ✅ | Sales | Menu tasting booking, dish selection |
| 2 ✅ | **Sales** (not Kitchen) | Confirm booking, dish-by-dish tasting feedback |
| 3 ✅ | Sales | Contract creation, menu, per-dish comments, add-ons |
| 4 ✅ | Creative/Linen/Stockroom | Draft inventory validation, shortages |
| 5 ✅ | Purchasing → Accounting | Procurement, budget approval, expense confirmation |
| 6 ✅ | Sales → Accounting | Payment term, signature, payment, approval |
| 7 ✅ | Kitchen/Banquet/Logistics | Prep, 1:25 staffing, split transport, number coding |
| 8 ✅ | All | Event week, material freeze |
| 9 ✅ | Depts → Accounting | Post-event checks, closure |

---

## Scenario state (live, as of last session)

| Record | State |
|---|---|
| TASTE-2608-0001 | **Completed** — feedback saved 2 Aug 2026: 4★, 3 liked (Caldereta, Lechon Kawali, Baked Macaroni), 2 to change (Cordon Bleu, Buko Pandan) |
| JC-2608-0001 | **CLOSED 2 Aug 2026** — fully paid ₱261,000, event 31 Jul 2026 |
| — banquet plan | **15 of 15 crew assigned, 100% coverage** (assigned via `steps/banquet-fill.json`) |
| — inventory transport | truck `JCS-4104` (mini truck, 10 m³), driver Marvin Serrano — dispatched, then **completed** |
| — staff transport | auto-assign picked `NEP 5513` (18-seat van) for 16 staff, driver Felix Manalo |
| — post-event checks | **4 of 4 areas Ready** — Logistics, Creative, Linen, Stockroom |
| PR-26-0035 | **fulfilled** — 5 chafing dishes, rental, PHP 2,250 |
| Finance budget 2026-08 | active, PHP 150,000 allocated |
| DEMO-R7-WAITER-RATIO | the Metro Manila reference case — Pasay City, **Friday 14 Aug 2026**, coded digits 9 and 0 (`_id 6a6bde091b518fdd102a1cb6`) |

Stages 7 and 9 are fully captured. Two dependencies are worth knowing, because
both look like empty screens rather than errors:

- **Staff Transport reads its headcount from the banquet plan.** With no crew
  assigned it just says *"Assign the banquet team first"*, so the plan had to be
  filled before 10.7 could be shot.
- **`arePostEventChecksComplete()` also requires `logisticsAssignment.assignmentStatus === 'completed'`.**
  Marking every department's items *Checked And Returned* is not enough — the
  *Ready to close* alert stays silent until Logistics dispatches **and** marks
  the booking completed (*Mark Dispatched* → *Mark Completed*, both on the
  Inventory Transport sub-tab; the status combobox on *Load & Dispatch* does not
  open).

> `steps/banquet-fill.json` adds staff one at a time. **The combobox keeps its
> selection after *Add Staff***, so re-picking the first option is a silent
> no-op — the generator therefore walks the option index (`i + 1`) per
> iteration. That is why the first attempt added exactly one person per role.

---

## Bugs found

See **`docs/FinalWalkthrough-FINDINGS.md`** — kept as a separate file so it
survives context compaction. Currently **9 open issues** (incl. a prerequisites
note) and 8 fixed.

- **Finding 9** (upgraded): *both* the tasting form and the contract form refuse
  any event less than **6 months** away. There is no way into the system for a
  nearer event. This is why Figure 4.4 shows the client sections only and Figure
  6.2 shows the enforced default of February 2027.
- **Finding 10** (new): choosing *OTHERS / Manual venue* gives an address and a
  capacity but **no venue name**, so any venue outside the catalogue is recorded
  as "OTHERS".

---

## Housekeeping

- **`public/_shot.html`** contains dev seed passwords. It is now in `.gitignore`.
  **Delete it once capture is finished.**
- `docs/~$nalWalkthrough.docx` is a Word lock file — delete it after closing Word.
