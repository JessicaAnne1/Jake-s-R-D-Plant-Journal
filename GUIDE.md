# Jake's R&D Plant Journal — Quick Guide

A personal field journal for propagation experiments. Mobile-first, installable on your phone like a real app, all data lives in one Google Sheet.

---

## The screens

### Specimens (home)
- Grid of every species you've added, ordered newest first
- Each card: chunky icon, common name, scientific name, category tag, run count
- Search bar — matches name, scientific name, category, region OR conditions
- Category chips below search — tap to filter by Tree / Shrub / Herb / etc.
- Tap any card → goes into Species detail

### Species detail
- Big hero card in the species' category colour
- **Notes** section — append-only living notes (most recent on top)
- **Propagation runs** grid — every run logged for this species
- Tap "+ New run" to log a fresh attempt for this species
- Tap any run card → goes into Run detail

### Run detail
- Every field editable inline — date, method, phase, status, medium, container, light, temp, rainfall, qty started, qty surviving, days to first success, interventions, outcomes
- **Save changes** button to commit edits
- **Duplicate run** clones the record as a new attempt with the same setup, status reset to In progress, parent linked
- **Run notes** at the bottom — append-only observations for this specific run

### Stats
- Totals: how many species, total runs, closed runs
- **Needs attention** — open runs you haven't touched in 30+ days, tap to jump in
- **Strike rate by method** — chunky bars, green = ≥70%, yellow = 40–69%, red = <40%
- **Top species** — same view, grouped by species
- **By season** — seasonal patterns
- Only counts runs marked Success / Partial / Failed / Closed (open runs ignored)

### Setup (top-right yellow pill)
- Manage every dropdown list used across the app
- 8 categories: Species Categories, Propagation Methods, Phases, Statuses, Mediums, Container Types, Light Exposure, Rainfall
- Add new value: type in the box, tap Add
- Remove value: tap × → chip turns red and pulses → tap again to confirm. 4-second auto-cancel if you walk away.

---

## How things work

### Adding new dropdown values on the fly
- Every dropdown ends with **"＋ Add new…"**
- Pick it → quick prompt → new value saved to Setup AND auto-selected in the form
- No need to leave the form to add a missing tag

### The + button (bottom centre)
- Opens a context menu that changes depending on what screen you're on:
  - **On Specimens:** Add new species · New propagation run (with species picker)
  - **On a species:** New propagation run (for this species) · Add new species · Add a note
  - **On a run:** Duplicate this run · Add new species · Add a run note

### Search
- Matches anything: common name, scientific name, category, native region, natural conditions
- Type "shrub" → all your shrubs appear
- Type "Gippsland" → everything from that region
- Combine with category chips for filtered + searched

### Notes (append-only)
- New notes always added at the top, never overwritten
- Past thinking is preserved permanently
- Both species and runs can have their own note streams

### Status lifecycle for runs
- **In progress** — default when you log a run
- **Success** — strike confirmed, counts toward stats
- **Partial** — some survived, some didn't
- **Failed** — total loss
- **Closed** — done, no further updates expected

### Dictation
- Tap any text field → keyboard appears → tap the mic icon on the keyboard
- Works in any field, any screen, including notes
- Works the same whether you opened the app from your home screen or in Chrome

### Search and category filter persistence
- Filters reset when you nav away (Specimens / Stats / Setup)
- Tap the back arrow from a deep screen to return where you were

---

## Where everything lives

- **Data:** Google Sheets (5 tabs — Species, Run Log, Config, Living Notes, Backups Log)
- **App:** GitHub Pages → live at https://jessicaanne1.github.io/Jake-s-R-D-Plant-Journal/
- **API:** Google Apps Script web app (the bridge between the app and the Sheet)
- **Backups:** weekly auto-export to Drive folder "Propagation R&D — Backups" every Sunday ~3am

---

## Install on your phone

1. Open https://jessicaanne1.github.io/Jake-s-R-D-Plant-Journal/ in Chrome
2. Chrome menu (3 dots, top right) → **Install app** (or "Add to Home Screen")
3. Icon appears on home screen — tap to launch full-screen, no browser bar

Works exactly the same as a real app from then on. Dictation, drill-down, everything.

---

## Editing the dropdowns later

Any time you want to add a propagation method, a new species category, a new growing medium — go to **Setup** (yellow pill, top right). Change applies everywhere immediately.

The whole app is built around your lists being editable, so if there's a vibe you want to track that we didn't think of (e.g. "Cloning attempts") — just add it as a Method or Phase and it appears in every relevant dropdown forever.

---

## Manual backup right now

If you want a fresh backup before Sunday:
1. Open the Apps Script editor
2. Pick `runWeeklyBackup` from the function dropdown → Run
3. Go to Drive → "Propagation R&D — Backups" → newest folder → CSVs are there

---

## What's NOT built (yet)

- iOS-friendly PNG icons (currently SVG — Android installs fine, iOS works but icon quality may vary)
- Bulk edit / multi-select
- Photos (intentionally — was out of scope)
- Sharing or multi-user
