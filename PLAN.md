# Propagation R&D Journal — Build Plan

## 1. Purpose
Personal field journal and R&D dataset for propagation work in Gippsland, VIC. Captures every run start-to-finish so that, over years, the dataset can underpin a published methodology book.

## 2. Stack
- **Backend:** Google Sheets (data) + Google Apps Script (logic + web app)
- **Frontend:** HTML / CSS / vanilla JS served via Apps Script HTML Service
- **Source control:** code edited directly in the Apps Script web editor; copy/paste into GitHub manually if desired (clasp skipped — no Node install)
- **Backups:** scheduled Apps Script trigger creates date-stamped CSV exports to a Drive `/backups/` folder weekly

## 3. Data Model

### Sheet 1 — Species
| Field | Type | Notes |
|---|---|---|
| Species ID | auto (SP-0001) | PK |
| Common Name | text | |
| Scientific Name | text | |
| Species Category | dropdown ← Config | |
| Native Climate / Region | text | |
| Natural Conditions | text | temp, rainfall, soil |
| Created Date | auto | |

### Sheet 2 — Run Log
| Field | Type | Notes |
|---|---|---|
| Run ID | auto (RUN-0001) | PK |
| Species ID | dropdown ← Species | FK |
| Parent Run ID | dropdown ← Run Log (optional) | lineage / repeat attempts |
| Date Started | date | |
| Propagation Method | dropdown ← Config | |
| Phase | dropdown ← Config | |
| Season / Year | auto-derived from Date | |
| **Structured conditions** (all optional) | | |
| Medium | dropdown ← Config | e.g. perlite, coir, water |
| Container | dropdown ← Config | e.g. tray, pot, propagator |
| Light Exposure | dropdown ← Config | full sun / part / shade / indoor |
| Temp °C | number | |
| Rainfall | dropdown ← Config | none / light / heavy / N/A |
| **Outcome quantification** | | |
| Quantity Started | number | |
| Quantity Surviving | number | updatable over time |
| Days to First Success | number (optional) | first sign of strike/germ |
| **Free text** | | |
| Human Interventions | text | what you did and when |
| Outcome / Observations | text | what happened |
| Status | dropdown ← Config | in progress / success / partial / failed / closed |
| Last Updated | auto | |

### Sheet 3 — Config
Editable lists, one column each:
- Propagation Methods
- Species Categories
- Phases
- Statuses
- Mediums
- Container Types
- Light Exposure Levels
- Rainfall Levels

### Sheet 4 — Living Notes (append-only)
| Run/Species ID | Date | Note |
Avoids overwriting past thinking. Notes on the Species Detail screen append a new row, never edit existing.

### Sheet 5 — Backups Log (auto)
Records each scheduled backup so you can spot failures.

## 4. Screens

### Screen 1 — Species Grid (home)
- Square card grid, all visible above the fold where possible
- Card: icon, Common Name, Scientific Name, Category badge, run count
- Top bar: search, Category filter, Method filter, **Add Species**, **Reports**, **Settings**

### Screen 2 — Species Detail
- Top: full species card, edit-in-place
- Living Notes panel: append-only stream, newest first, "Add note" inline
- Below: grid of Run cards for this species (Method, Date, Phase, Status, Strike % if closed)
- Buttons: **Add Run**, **Back**

### Screen 3 — Run Detail
- All fields editable
- Quick "Update Surviving Count" action
- **Duplicate Run** (clones as draft, links Parent Run ID automatically)
- **Mark Closed** (locks editing except for notes)
- Append-only run notes panel
- Buttons: **Back to Species**

### Screen 4 — Reports
Built from day one. Default views:
1. **Strike rate by Method** (across all species)
2. **Strike rate by Species** (top performers / problem species)
3. **Strike rate by Season** (when does what work)
4. **Active runs needing attention** (status = in progress, not updated 30+ days)
5. **Quarterly snapshot** — one-click export of current Reports view to a dated Sheet in Drive

### Settings Panel
- List manager per Config category (add / rename / archive)
- Archive instead of delete — preserves historical records
- Manual "Run backup now" button

## 5. Status Lifecycle (decision needed before build)
Proposed:
- **In progress** — default on creation
- **Success** — strike confirmed, still tracking survival
- **Partial** — some survived, some didn't
- **Failed** — total loss
- **Closed** — no further updates expected (locks fields except notes)

A run with Status ≠ Closed and no update in 30 days surfaces in Reports → "needs attention."

## 6. Endurance Strategy
- All data in Sheets — portable, exportable, future-proof
- Apps Script code in git via `clasp` — versioned, recoverable
- Weekly CSV backups to Drive — survives Sheets account loss
- Config-driven dropdowns — no code changes needed for new methods/categories
- Archive (don't delete) Config values — historical runs remain valid
- Front end uses no frameworks — no dependency rot

## 7. Build Order
1. Set up Sheets with all 5 tabs + Config seed values
2. Initialise Apps Script project, link via `clasp`, push to git
3. Backend functions: CRUD for Species, Runs, Notes; Config readers
4. Screen 1 (Species Grid) + Add Species
5. Screen 2 (Species Detail) + Add Run + Living Notes
6. Screen 3 (Run Detail) + Duplicate + Status transitions
7. Screen 4 (Reports) — start with strike rate by Method
8. Settings panel
9. Scheduled backup trigger + Backups Log
10. Visual polish pass (typography, palette, transitions)

## 8. Locked Decisions
- **Status lifecycle:** In progress / Success / Partial / Failed / Closed (extendable via Config)
- **Structured fields:** keep all (medium, container, light, temp, rainfall); extendable via Config
- **Icons:** per-category
- **Seed values (locked):**
  - Propagation Methods: Seed, Softwood Cutting, Hardwood Cutting, Division, Layering, Grafting
  - Species Categories: Tree, Shrub, Herb, Succulent, Grass, Fern, Climber, Conifer
  - Phases: Sourcing, Sown / Struck, Callusing, Rooting, Hardening Off, Potted On, Planted Out
  - Mediums: Perlite, Coir, Seed-raising Mix, Sand, Water
  - Container Types: Seed Tray, Tube, 4" Pot, Propagator
  - Light Exposure: Full Sun, Part Shade, Full Shade, Indoor
  - Rainfall: None, Light, Moderate, Heavy, N/A
  - Statuses: In progress, Success, Partial, Failed, Closed
