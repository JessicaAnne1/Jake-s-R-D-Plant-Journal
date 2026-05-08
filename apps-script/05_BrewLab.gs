/**
 * Jake's R&D — Brew Lab module
 * Parallel R&D track for liquid biofertiliser brews. Adds 4 sheet tabs,
 * extends Config, and exposes CRUD via the same API wrapper.
 *
 * Setup:
 *   1. Run setupBrewLab() once. Creates Brews / Sites / Applications /
 *      Observations tabs, seeds the new Config columns, applies dropdowns.
 *      Safe to re-run — only adds what's missing.
 *   2. Re-deploy the Web App so the new API actions become live.
 */

const BREW_SHEETS = {
  BREWS:        'Brews',
  SITES:        'Sites',
  APPLICATIONS: 'Applications',
  OBSERVATIONS: 'Observations',
};

const BREW_HEADERS = {
  [BREW_SHEETS.BREWS]: [
    'Brew ID', 'Name', 'Date Brewed', 'Status',
    'Worm Cast Source', 'Worm Cast Amount',
    'Manure Type', 'Manure State', 'Manure Amount',
    'Fish Water Source', 'Fish Water Amount',
    'Molasses % v/v', 'Other Additives',
    'Aeration Hours', 'Storage Days',
    'DO mg/L', 'pH',
    'Smell / Colour', 'Use-By Date', 'Notes', 'Created Date',
  ],
  [BREW_SHEETS.SITES]: [
    'Site ID', 'Name', 'Owner / Farm', 'Location', 'Crop', 'Soil Type',
    'Site Type', 'Paired Site ID',
    'Baseline Notes', 'Created Date',
  ],
  [BREW_SHEETS.APPLICATIONS]: [
    'Application ID', 'Brew ID', 'Site ID', 'Date Applied',
    'Method', 'Dilution', 'Volume Applied (L)', 'Area Treated (m²)',
    'Weather', 'Notes', 'Created Date',
  ],
  [BREW_SHEETS.OBSERVATIONS]: [
    'Observation ID', 'Site ID', 'Application ID', 'Date',
    'Days Since Application', 'Plant Health 1-10',
    'Growth', 'Disease Incidence', 'Yield',
    'Soil Mineral N', 'Soil Available P', 'Soil Microbial',
    'Photo URLs', 'Notes', 'Created Date',
  ],
};

const BREW_CONFIG_COLUMNS = [
  'Application Methods',
  'Site Types',
  'Crops',
  'Soil Types',
  'Manure States',
  'Brew Statuses',
  'Manure Types',
];

const BREW_SEED_CONFIG = {
  'Application Methods': ['Foliar', 'Soil drench', 'Fertigation', 'In-furrow'],
  'Site Types':          ['Treated', 'Control'],
  'Crops':               ['Tomato', 'Lettuce', 'Pasture', 'Pumpkin', 'Mixed vegetable'],
  'Soil Types':          ['Sandy loam', 'Clay loam', 'Loam', 'Clay', 'Sand'],
  'Manure States':       ['Composted', 'Aged', 'Fresh'],
  'Brew Statuses':       ['Brewing', 'Ready', 'In use', 'Expired', 'Archived'],
  'Manure Types':        ['Horse', 'Cow', 'Chicken', 'Sheep', 'None'],
};

const BREW_PHOTO_FOLDER_NAME = 'Jake\'s R&D — Brew Lab Photos';

// ─── Bootstrap ──────────────────────────────────────────────────────
function setupBrewLab() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Create / verify the 4 data tabs.
  Object.values(BREW_SHEETS).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const headers = BREW_HEADERS[name];
    const existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (existing.every(v => v === '' || v === null)) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
      sheet.setFrozenRows(1);
      sheet.autoResizeColumns(1, headers.length);
    }
  });

  // 2. Extend Config — add the new columns if missing.
  const config = ss.getSheetByName(SHEETS.CONFIG);
  const existingHeaders = config.getRange(1, 1, 1, Math.max(config.getLastColumn(), 1)).getValues()[0];
  let nextCol = existingHeaders.filter(v => v !== '').length + 1;
  BREW_CONFIG_COLUMNS.forEach(header => {
    if (existingHeaders.includes(header)) return;
    config.getRange(1, nextCol).setValue(header).setFontWeight('bold');
    if (BREW_SEED_CONFIG[header]) {
      const values = BREW_SEED_CONFIG[header].map(v => [v]);
      config.getRange(2, nextCol, values.length, 1).setValues(values);
    }
    nextCol++;
  });

  // 3. Apply dropdown validations on the new sheets.
  applyBrewValidation_(ss);

  SpreadsheetApp.getUi().alert(
    'Brew Lab setup complete.\n\n' +
    'Created: Brews, Sites, Applications, Observations.\n' +
    'Seeded: Application Methods, Site Types, Crops, Soil Types, Manure States, Brew Statuses, Manure Types.\n\n' +
    'Now redeploy the Web App so the frontend can hit the new API actions.'
  );
}

function applyBrewValidation_(ss) {
  const config = ss.getSheetByName(SHEETS.CONFIG);
  const headersRow = config.getRange(1, 1, 1, config.getLastColumn()).getValues()[0];
  const colByHeader = {};
  headersRow.forEach((h, i) => { if (h) colByHeader[h] = i + 1; });

  const lastRow = 1000;
  const dropdown = (sourceCol) => SpreadsheetApp.newDataValidation()
    .requireValueInRange(config.getRange(2, sourceCol, 500, 1), true)
    .setAllowInvalid(true).build();

  const brews = ss.getSheetByName(BREW_SHEETS.BREWS);
  const sites = ss.getSheetByName(BREW_SHEETS.SITES);
  const apps  = ss.getSheetByName(BREW_SHEETS.APPLICATIONS);

  const setDV = (sheet, fieldName, headers, configHeader) => {
    const col = headers.indexOf(fieldName) + 1;
    const cfgCol = colByHeader[configHeader];
    if (col && cfgCol) sheet.getRange(2, col, lastRow, 1).setDataValidation(dropdown(cfgCol));
  };

  setDV(brews, 'Manure Type',  BREW_HEADERS[BREW_SHEETS.BREWS], 'Manure Types');
  setDV(brews, 'Manure State', BREW_HEADERS[BREW_SHEETS.BREWS], 'Manure States');
  setDV(brews, 'Status',       BREW_HEADERS[BREW_SHEETS.BREWS], 'Brew Statuses');

  setDV(sites, 'Crop',         BREW_HEADERS[BREW_SHEETS.SITES], 'Crops');
  setDV(sites, 'Soil Type',    BREW_HEADERS[BREW_SHEETS.SITES], 'Soil Types');
  setDV(sites, 'Site Type',    BREW_HEADERS[BREW_SHEETS.SITES], 'Site Types');

  setDV(apps,  'Method',       BREW_HEADERS[BREW_SHEETS.APPLICATIONS], 'Application Methods');
}

// ─── Helpers (reuse pattern from 02_Code.gs) ────────────────────────
function readBrewSheet_(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  const headers = BREW_HEADERS[name];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return rows.filter(r => r[0]).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function nextBrewId_(sheetName, idHeader, prefix) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const headers = BREW_HEADERS[sheetName];
  const idCol = headers.indexOf(idHeader) + 1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return prefix + '0001';
  const ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues().flat()
    .filter(v => typeof v === 'string' && v.startsWith(prefix));
  const nums = ids.map(v => parseInt(v.replace(prefix, ''), 10)).filter(n => !isNaN(n));
  const max = nums.length ? Math.max.apply(null, nums) : 0;
  return prefix + String(max + 1).padStart(4, '0');
}

function brewRowToValues_(record, sheetName) {
  return BREW_HEADERS[sheetName].map(h => record[h] === undefined ? '' : record[h]);
}

function findBrewRow_(sheetName, idHeader, idValue) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const headers = BREW_HEADERS[sheetName];
  const idCol = headers.indexOf(idHeader) + 1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === idValue) return i + 2;
  return -1;
}

// ─── Brews CRUD ─────────────────────────────────────────────────────
function listBrews() {
  const brews = readBrewSheet_(BREW_SHEETS.BREWS);
  const apps = readBrewSheet_(BREW_SHEETS.APPLICATIONS);
  const counts = {};
  apps.forEach(a => { counts[a['Brew ID']] = (counts[a['Brew ID']] || 0) + 1; });
  return brews.map(b => Object.assign({}, b, { applicationCount: counts[b['Brew ID']] || 0 }));
}
function getBrew(id) {
  return readBrewSheet_(BREW_SHEETS.BREWS).find(b => b['Brew ID'] === id) || null;
}
function createBrew(data) {
  const id = nextBrewId_(BREW_SHEETS.BREWS, 'Brew ID', 'BR-');
  const record = Object.assign({}, data, {
    'Brew ID': id,
    'Date Brewed': data['Date Brewed'] ? new Date(data['Date Brewed']) : new Date(),
    'Status': data['Status'] || 'Brewing',
    'Created Date': new Date(),
  });
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BREW_SHEETS.BREWS);
  sheet.appendRow(brewRowToValues_(record, BREW_SHEETS.BREWS));
  return record;
}
function updateBrew(id, data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BREW_SHEETS.BREWS);
  const headers = BREW_HEADERS[BREW_SHEETS.BREWS];
  const rowIdx = findBrewRow_(BREW_SHEETS.BREWS, 'Brew ID', id);
  if (rowIdx < 0) throw new Error('Brew not found: ' + id);
  const current = {};
  sheet.getRange(rowIdx, 1, 1, headers.length).getValues()[0].forEach((v, i) => { current[headers[i]] = v; });
  const updated = Object.assign({}, current, data, { 'Brew ID': id });
  if (data['Date Brewed']) updated['Date Brewed'] = new Date(data['Date Brewed']);
  sheet.getRange(rowIdx, 1, 1, headers.length).setValues([brewRowToValues_(updated, BREW_SHEETS.BREWS)]);
  return updated;
}

// ─── Sites CRUD ─────────────────────────────────────────────────────
function listSites() {
  const sites = readBrewSheet_(BREW_SHEETS.SITES);
  const apps = readBrewSheet_(BREW_SHEETS.APPLICATIONS);
  const obs  = readBrewSheet_(BREW_SHEETS.OBSERVATIONS);
  const appCounts = {};
  const obsCounts = {};
  apps.forEach(a => { appCounts[a['Site ID']] = (appCounts[a['Site ID']] || 0) + 1; });
  obs.forEach(o => { obsCounts[o['Site ID']] = (obsCounts[o['Site ID']] || 0) + 1; });
  return sites.map(s => Object.assign({}, s, {
    applicationCount: appCounts[s['Site ID']] || 0,
    observationCount: obsCounts[s['Site ID']] || 0,
  }));
}
function getSite(id) {
  return readBrewSheet_(BREW_SHEETS.SITES).find(s => s['Site ID'] === id) || null;
}
function createSite(data) {
  const id = nextBrewId_(BREW_SHEETS.SITES, 'Site ID', 'ST-');
  const record = Object.assign({}, data, {
    'Site ID': id,
    'Site Type': data['Site Type'] || 'Treated',
    'Created Date': new Date(),
  });
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BREW_SHEETS.SITES);
  sheet.appendRow(brewRowToValues_(record, BREW_SHEETS.SITES));
  return record;
}
function updateSite(id, data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BREW_SHEETS.SITES);
  const headers = BREW_HEADERS[BREW_SHEETS.SITES];
  const rowIdx = findBrewRow_(BREW_SHEETS.SITES, 'Site ID', id);
  if (rowIdx < 0) throw new Error('Site not found: ' + id);
  const current = {};
  sheet.getRange(rowIdx, 1, 1, headers.length).getValues()[0].forEach((v, i) => { current[headers[i]] = v; });
  const updated = Object.assign({}, current, data, { 'Site ID': id });
  sheet.getRange(rowIdx, 1, 1, headers.length).setValues([brewRowToValues_(updated, BREW_SHEETS.SITES)]);
  return updated;
}

// ─── Delete (hard delete the row) ───────────────────────────────────
function deleteSite(siteId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BREW_SHEETS.SITES);
  const rowIdx = findBrewRow_(BREW_SHEETS.SITES, 'Site ID', siteId);
  if (rowIdx < 0) throw new Error('Site not found: ' + siteId);
  const apps = readBrewSheet_(BREW_SHEETS.APPLICATIONS).filter(a => a['Site ID'] === siteId).length;
  const obs  = readBrewSheet_(BREW_SHEETS.OBSERVATIONS).filter(o => o['Site ID'] === siteId).length;
  sheet.deleteRow(rowIdx);
  return { deleted: siteId, orphanedApplications: apps, orphanedObservations: obs };
}

function deleteBrew(brewId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BREW_SHEETS.BREWS);
  const rowIdx = findBrewRow_(BREW_SHEETS.BREWS, 'Brew ID', brewId);
  if (rowIdx < 0) throw new Error('Brew not found: ' + brewId);
  const apps = readBrewSheet_(BREW_SHEETS.APPLICATIONS).filter(a => a['Brew ID'] === brewId).length;
  sheet.deleteRow(rowIdx);
  return { deleted: brewId, orphanedApplications: apps };
}

// ─── Applications ───────────────────────────────────────────────────
function listApplicationsBySite(siteId) {
  return readBrewSheet_(BREW_SHEETS.APPLICATIONS).filter(a => a['Site ID'] === siteId)
    .sort((a, b) => new Date(b['Date Applied'] || 0) - new Date(a['Date Applied'] || 0));
}
function listApplicationsByBrew(brewId) {
  return readBrewSheet_(BREW_SHEETS.APPLICATIONS).filter(a => a['Brew ID'] === brewId)
    .sort((a, b) => new Date(b['Date Applied'] || 0) - new Date(a['Date Applied'] || 0));
}
function createApplication(data) {
  const id = nextBrewId_(BREW_SHEETS.APPLICATIONS, 'Application ID', 'AP-');
  const record = Object.assign({}, data, {
    'Application ID': id,
    'Date Applied': data['Date Applied'] ? new Date(data['Date Applied']) : new Date(),
    'Created Date': new Date(),
  });
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BREW_SHEETS.APPLICATIONS);
  sheet.appendRow(brewRowToValues_(record, BREW_SHEETS.APPLICATIONS));
  return record;
}

// ─── Observations ───────────────────────────────────────────────────
function listObservationsBySite(siteId) {
  return readBrewSheet_(BREW_SHEETS.OBSERVATIONS).filter(o => o['Site ID'] === siteId)
    .sort((a, b) => new Date(b['Date'] || 0) - new Date(a['Date'] || 0));
}
function createObservation(data) {
  const id = nextBrewId_(BREW_SHEETS.OBSERVATIONS, 'Observation ID', 'OB-');
  const record = Object.assign({}, data, {
    'Observation ID': id,
    'Date': data['Date'] ? new Date(data['Date']) : new Date(),
    'Created Date': new Date(),
  });
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BREW_SHEETS.OBSERVATIONS);
  sheet.appendRow(brewRowToValues_(record, BREW_SHEETS.OBSERVATIONS));
  return record;
}

// ─── Photo upload ───────────────────────────────────────────────────
function uploadBrewPhoto(payload) {
  // payload: { filename, base64, mimeType, siteId? }
  const folder = getOrCreateBrewPhotoFolder_();
  const subfolder = payload.siteId ? getOrCreateSubfolder_(folder, payload.siteId) : folder;
  const bytes = Utilities.base64Decode(payload.base64);
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
  const safe = (payload.filename || 'photo.jpg').replace(/[^a-z0-9.\-_]/gi, '_');
  const blob = Utilities.newBlob(bytes, payload.mimeType || 'image/jpeg', `${stamp}-${safe}`);
  const file = subfolder.createFile(blob);
  // Make link shareable as anyone-with-link viewer.
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) { /* best effort */ }
  return { url: file.getUrl(), id: file.getId(), name: file.getName() };
}

function getOrCreateBrewPhotoFolder_() {
  const it = DriveApp.getFoldersByName(BREW_PHOTO_FOLDER_NAME);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(BREW_PHOTO_FOLDER_NAME);
}
function getOrCreateSubfolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent.createFolder(name);
}

// ─── Brew Lab reports ───────────────────────────────────────────────
function getBrewReports() {
  const sites = readBrewSheet_(BREW_SHEETS.SITES);
  const brews = readBrewSheet_(BREW_SHEETS.BREWS);
  const apps  = readBrewSheet_(BREW_SHEETS.APPLICATIONS);
  const obs   = readBrewSheet_(BREW_SHEETS.OBSERVATIONS);

  const treated = sites.filter(s => s['Site Type'] === 'Treated');
  const control = sites.filter(s => s['Site Type'] === 'Control');

  // Average plant health by site type (using latest observation per site)
  const latestObsBySite = {};
  obs.forEach(o => {
    const sid = o['Site ID'];
    if (!sid) return;
    const dt = new Date(o['Date'] || 0);
    if (!latestObsBySite[sid] || dt > new Date(latestObsBySite[sid]['Date'] || 0)) {
      latestObsBySite[sid] = o;
    }
  });
  const avgHealth = (siteList) => {
    const vals = siteList.map(s => Number(latestObsBySite[s['Site ID']] && latestObsBySite[s['Site ID']]['Plant Health 1-10']))
      .filter(v => !isNaN(v) && v > 0);
    if (!vals.length) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  };

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const expiringBrews = brews.filter(b => {
    if (b['Status'] === 'Expired' || b['Status'] === 'Archived') return false;
    if (!b['Use-By Date']) return false;
    return new Date(b['Use-By Date']) <= sevenDaysAgo;
  });

  return {
    totals: {
      sites: sites.length,
      brews: brews.length,
      applications: apps.length,
      observations: obs.length,
    },
    treatedVsControl: {
      treated: { count: treated.length, avgHealth: avgHealth(treated) },
      control: { count: control.length, avgHealth: avgHealth(control) },
    },
    expiringBrews: expiringBrews,
  };
}
