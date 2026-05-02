/**
 * Propagation R&D Journal — Backend
 * All data access for the web app. Frontend calls these via google.script.run.
 * Depends on constants from 01_Bootstrap.gs (SHEETS, HEADERS).
 */

// ─── Web app entry ──────────────────────────────────────────────────────────
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Propagation R&D Journal')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

// ─── Generic helpers ────────────────────────────────────────────────────────
function getSheet_(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function readAll_(sheetName) {
  const sheet = getSheet_(sheetName);
  const headers = HEADERS[sheetName];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values
    .filter(row => row[0] !== '' && row[0] !== null)
    .map(row => rowToObject_(row, headers));
}

function rowToObject_(row, headers) {
  const obj = {};
  headers.forEach((h, i) => { obj[h] = row[i]; });
  return obj;
}

function objectToRow_(obj, headers) {
  return headers.map(h => obj[h] === undefined ? '' : obj[h]);
}

function findRowIndex_(sheetName, idColumnHeader, idValue) {
  const sheet = getSheet_(sheetName);
  const headers = HEADERS[sheetName];
  const idCol = headers.indexOf(idColumnHeader) + 1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === idValue) return i + 2;
  }
  return -1;
}

function nextId_(sheetName, idHeader, prefix) {
  const sheet = getSheet_(sheetName);
  const headers = HEADERS[sheetName];
  const idCol = headers.indexOf(idHeader) + 1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return prefix + '0001';
  const ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues().flat()
    .filter(v => typeof v === 'string' && v.startsWith(prefix));
  const nums = ids.map(v => parseInt(v.replace(prefix, ''), 10)).filter(n => !isNaN(n));
  const max = nums.length ? Math.max.apply(null, nums) : 0;
  return prefix + String(max + 1).padStart(4, '0');
}

function seasonFromDate_(date) {
  const d = (date instanceof Date) ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const m = d.getMonth() + 1; // 1-12
  const y = d.getFullYear();
  // Southern hemisphere seasons
  if (m === 12) return `Summer ${y}/${String(y + 1).slice(-2)}`;
  if (m <= 2)   return `Summer ${y - 1}/${String(y).slice(-2)}`;
  if (m <= 5)   return `Autumn ${y}`;
  if (m <= 8)   return `Winter ${y}`;
  return `Spring ${y}`;
}

// ─── Config ─────────────────────────────────────────────────────────────────
function getConfig() {
  const sheet = getSheet_(SHEETS.CONFIG);
  const headers = HEADERS[SHEETS.CONFIG];
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const result = {};
  headers.forEach((header, idx) => {
    if (lastRow < 2) { result[header] = []; return; }
    const values = sheet.getRange(2, idx + 1, lastRow - 1, 1).getValues().flat()
      .filter(v => v !== '' && v !== null);
    result[header] = values;
  });
  return result;
}

function addConfigValue(category, value) {
  const sheet = getSheet_(SHEETS.CONFIG);
  const headers = HEADERS[SHEETS.CONFIG];
  const col = headers.indexOf(category) + 1;
  if (col === 0) throw new Error('Unknown config category: ' + category);
  const lastRow = sheet.getLastRow();
  const existing = lastRow >= 2
    ? sheet.getRange(2, col, lastRow - 1, 1).getValues().flat().filter(v => v !== '')
    : [];
  if (existing.includes(value)) return getConfig();
  sheet.getRange(existing.length + 2, col, 1, 1).setValue(value);
  return getConfig();
}

function removeConfigValue(category, value) {
  const sheet = getSheet_(SHEETS.CONFIG);
  const headers = HEADERS[SHEETS.CONFIG];
  const col = headers.indexOf(category) + 1;
  if (col === 0) throw new Error('Unknown config category: ' + category);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return getConfig();
  const values = sheet.getRange(2, col, lastRow - 1, 1).getValues().flat();
  const filtered = values.filter(v => v !== value && v !== '');
  sheet.getRange(2, col, lastRow - 1, 1).clearContent();
  if (filtered.length) {
    sheet.getRange(2, col, filtered.length, 1).setValues(filtered.map(v => [v]));
  }
  return getConfig();
}

// ─── Species CRUD ───────────────────────────────────────────────────────────
function listSpecies() {
  const species = readAll_(SHEETS.SPECIES);
  const runs = readAll_(SHEETS.RUNS);
  const counts = {};
  runs.forEach(r => {
    const id = r['Species ID'];
    counts[id] = (counts[id] || 0) + 1;
  });
  return species.map(s => Object.assign({}, s, { runCount: counts[s['Species ID']] || 0 }));
}

function getSpecies(speciesId) {
  const all = readAll_(SHEETS.SPECIES);
  return all.find(s => s['Species ID'] === speciesId) || null;
}

function createSpecies(data) {
  const id = nextId_(SHEETS.SPECIES, 'Species ID', 'SP-');
  const record = {
    'Species ID': id,
    'Common Name': data['Common Name'] || '',
    'Scientific Name': data['Scientific Name'] || '',
    'Species Category': data['Species Category'] || '',
    'Native Climate / Region': data['Native Climate / Region'] || '',
    'Natural Conditions': data['Natural Conditions'] || '',
    'Created Date': new Date(),
  };
  const sheet = getSheet_(SHEETS.SPECIES);
  sheet.appendRow(objectToRow_(record, HEADERS[SHEETS.SPECIES]));
  return record;
}

function updateSpecies(speciesId, data) {
  const sheet = getSheet_(SHEETS.SPECIES);
  const headers = HEADERS[SHEETS.SPECIES];
  const rowIdx = findRowIndex_(SHEETS.SPECIES, 'Species ID', speciesId);
  if (rowIdx < 0) throw new Error('Species not found: ' + speciesId);
  const current = rowToObject_(sheet.getRange(rowIdx, 1, 1, headers.length).getValues()[0], headers);
  const updated = Object.assign({}, current, data, { 'Species ID': speciesId });
  sheet.getRange(rowIdx, 1, 1, headers.length).setValues([objectToRow_(updated, headers)]);
  return updated;
}

// ─── Run CRUD ───────────────────────────────────────────────────────────────
function listRunsBySpecies(speciesId) {
  return readAll_(SHEETS.RUNS).filter(r => r['Species ID'] === speciesId);
}

function getRun(runId) {
  const all = readAll_(SHEETS.RUNS);
  return all.find(r => r['Run ID'] === runId) || null;
}

function createRun(data) {
  const id = nextId_(SHEETS.RUNS, 'Run ID', 'RUN-');
  const dateStarted = data['Date Started'] ? new Date(data['Date Started']) : new Date();
  const record = {
    'Run ID': id,
    'Species ID': data['Species ID'] || '',
    'Parent Run ID': data['Parent Run ID'] || '',
    'Date Started': dateStarted,
    'Propagation Method': data['Propagation Method'] || '',
    'Phase': data['Phase'] || '',
    'Season / Year': seasonFromDate_(dateStarted),
    'Medium': data['Medium'] || '',
    'Container': data['Container'] || '',
    'Light Exposure': data['Light Exposure'] || '',
    'Temp °C': data['Temp °C'] || '',
    'Rainfall': data['Rainfall'] || '',
    'Quantity Started': data['Quantity Started'] || '',
    'Quantity Surviving': data['Quantity Surviving'] || '',
    'Days to First Success': data['Days to First Success'] || '',
    'Human Interventions': data['Human Interventions'] || '',
    'Outcome / Observations': data['Outcome / Observations'] || '',
    'Status': data['Status'] || 'In progress',
    'Last Updated': new Date(),
  };
  getSheet_(SHEETS.RUNS).appendRow(objectToRow_(record, HEADERS[SHEETS.RUNS]));
  return record;
}

function updateRun(runId, data) {
  const sheet = getSheet_(SHEETS.RUNS);
  const headers = HEADERS[SHEETS.RUNS];
  const rowIdx = findRowIndex_(SHEETS.RUNS, 'Run ID', runId);
  if (rowIdx < 0) throw new Error('Run not found: ' + runId);
  const current = rowToObject_(sheet.getRange(rowIdx, 1, 1, headers.length).getValues()[0], headers);
  const updated = Object.assign({}, current, data, {
    'Run ID': runId,
    'Last Updated': new Date(),
  });
  if (data['Date Started']) {
    updated['Date Started'] = new Date(data['Date Started']);
    updated['Season / Year'] = seasonFromDate_(updated['Date Started']);
  }
  sheet.getRange(rowIdx, 1, 1, headers.length).setValues([objectToRow_(updated, headers)]);
  return updated;
}

function duplicateRun(runId) {
  const original = getRun(runId);
  if (!original) throw new Error('Run not found: ' + runId);
  const copy = Object.assign({}, original, {
    'Parent Run ID': runId,
    'Date Started': new Date(),
    'Quantity Surviving': '',
    'Days to First Success': '',
    'Outcome / Observations': '',
    'Status': 'In progress',
  });
  delete copy['Run ID'];
  delete copy['Last Updated'];
  delete copy['Season / Year'];
  return createRun(copy);
}

// ─── Living Notes (append-only) ─────────────────────────────────────────────
function listNotes(linkedType, linkedId) {
  return readAll_(SHEETS.NOTES)
    .filter(n => n['Linked Type'] === linkedType && n['Linked ID'] === linkedId)
    .sort((a, b) => new Date(b['Date']) - new Date(a['Date']));
}

function addNote(linkedType, linkedId, text) {
  if (!text || !text.toString().trim()) throw new Error('Note text required');
  const id = nextId_(SHEETS.NOTES, 'Note ID', 'N-');
  const record = {
    'Note ID': id,
    'Linked Type': linkedType,   // 'Species' or 'Run'
    'Linked ID': linkedId,
    'Date': new Date(),
    'Note': text.toString().trim(),
  };
  getSheet_(SHEETS.NOTES).appendRow(objectToRow_(record, HEADERS[SHEETS.NOTES]));
  return record;
}

// ─── Reports ────────────────────────────────────────────────────────────────
function getReports() {
  const runs = readAll_(SHEETS.RUNS);
  const species = readAll_(SHEETS.SPECIES);
  const speciesNameById = {};
  species.forEach(s => { speciesNameById[s['Species ID']] = s['Common Name']; });

  const closed = runs.filter(r => r['Status'] === 'Success' || r['Status'] === 'Partial' || r['Status'] === 'Failed' || r['Status'] === 'Closed');

  const byKey = (rows, keyFn) => {
    const map = {};
    rows.forEach(r => {
      const k = keyFn(r) || '(unspecified)';
      if (!map[k]) map[k] = { key: k, total: 0, started: 0, surviving: 0, success: 0 };
      map[k].total += 1;
      const started = Number(r['Quantity Started']) || 0;
      const surviving = Number(r['Quantity Surviving']) || 0;
      map[k].started += started;
      map[k].surviving += surviving;
      if (r['Status'] === 'Success') map[k].success += 1;
    });
    return Object.values(map).map(g => Object.assign(g, {
      strikeRate: g.started > 0 ? Math.round((g.surviving / g.started) * 100) : null,
      successRate: g.total > 0 ? Math.round((g.success / g.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);
  };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const needsAttention = runs.filter(r => {
    if (r['Status'] === 'Closed' || r['Status'] === 'Success' || r['Status'] === 'Failed') return false;
    const updated = r['Last Updated'] ? new Date(r['Last Updated']) : null;
    return !updated || updated < thirtyDaysAgo;
  }).map(r => Object.assign({}, r, { speciesName: speciesNameById[r['Species ID']] || '(unknown)' }));

  return {
    byMethod: byKey(closed, r => r['Propagation Method']),
    bySpecies: byKey(closed, r => speciesNameById[r['Species ID']]),
    bySeason: byKey(closed, r => r['Season / Year']),
    needsAttention: needsAttention,
    totals: {
      species: species.length,
      runs: runs.length,
      closedRuns: closed.length,
    },
  };
}
