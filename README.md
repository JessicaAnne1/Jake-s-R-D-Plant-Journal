# Jake's R&D Plant Journal

Field journal and propagation R&D tool. Mobile-first PWA frontend, Google Sheets backend.

```
Plantprop/
├── apps-script/      # Backend — paste into Google Apps Script editor
│   ├── 01_Bootstrap.gs   creates the sheet structure + seeds Config
│   ├── 02_Code.gs        CRUD for Species, Runs, Notes, Reports
│   └── 03_Api.gs         JSON API wrapper exposed as a Web App
└── docs/              # Frontend — deployed via GitHub Pages
    ├── index.html
    ├── manifest.webmanifest
    ├── sw.js               service worker (PWA install + offline)
    └── assets/{css,js,icons}
```

## Setup

### 1. Backend (Google Sheets + Apps Script)

1. Create a new blank Google Sheet. Name it whatever you like.
2. **Extensions → Apps Script** to open the script editor in a new tab.
3. Add three script files (the **+** next to "Files" → **Script**), naming them `Bootstrap`, `Code`, `Api`. Paste the matching `apps-script/0X_*.gs` file into each. Save.
4. In the function dropdown choose `setupWorkbook` and click **Run**. Approve permissions when prompted. You'll see "Setup complete".
5. Verify the Sheet now has tabs: `Species`, `Run Log`, `Config`, `Living Notes`, `Backups Log`.

### 2. Deploy the API

1. In the Apps Script editor: **Deploy → New deployment**.
2. **Type: Web app**.
3. Settings:
   - **Execute as: Me** (so it can read/write your Sheet)
   - **Who has access: Anyone** (the URL is public — keep it private)
4. Click **Deploy**. Copy the **/exec** URL.
5. *(Optional)* In `apps-script/03_Api.gs`, set `API_TOKEN` to a long random string and re-deploy. Then set the same value in `docs/assets/js/config.js`.

### 3. Wire the frontend to the API

Edit `docs/assets/js/config.js`:

```js
window.API_CONFIG = {
  USE_MOCK: false,
  API_URL: 'https://script.google.com/macros/s/AKfyc..../exec',
  API_TOKEN: '',  // optional, must match apps-script/03_Api.gs
};
```

To preview locally before deploying:
```bash
cd web && python3 -m http.server 8765
# open http://localhost:8765
```

### 4. Deploy frontend to GitHub Pages

1. Create a new GitHub repo (private or public, doesn't matter).
2. From `Plantprop/`:
   ```bash
   git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages**.
   - Source: **Deploy from a branch**
   - Branch: `main`, folder: `/docs`
   - Save. After ~1 min the site is live at `https://YOUR_USERNAME.github.io/YOUR_REPO/`.

### 5. Install as an app on Jake's phone

Send Jake the GitHub Pages URL.
- **Android (Chrome):** menu → **Install app** → an icon appears on the home screen, opens full-screen.
- **iOS (Safari):** share → **Add to Home Screen**.

Once installed, the app behaves like a native app — full screen, no browser bar, dictation works in any text field via the keyboard's mic icon.

## Updating

- **Frontend changes:** push to `main`. GitHub Pages redeploys automatically. The service worker version (`CACHE` in `docs/sw.js`) needs bumping if you want users to pull updates immediately.
- **Backend changes:** in Apps Script editor, **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. The `/exec` URL stays the same.

## Backups

Sheets is the source of truth. The `Backups Log` tab is wired up but the scheduled trigger isn't installed yet — that's a TODO. For now, periodically download the Sheet (`File → Download → CSV` per tab, or `.xlsx` for the whole workbook) to a safe location.

## Pending

- Reports screen (strike rate by method/species/season)
- Settings panel (manage Config dropdowns from the app)
- Scheduled weekly CSV backup to Drive
- Real PNG icons for iOS support (currently SVG-only — Android Chrome installs fine)
