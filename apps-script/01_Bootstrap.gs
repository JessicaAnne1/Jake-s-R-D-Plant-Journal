/**
 * Propagation R&D Journal — Bootstrap
 * Run setupWorkbook() ONCE on a fresh Google Sheet.
 * It creates all required tabs, headers, seed Config values, and dropdown validation.
 * Safe to re-run: it will not overwrite existing data, only add what's missing.
 */

const SHEETS = {
  SPECIES: 'Species',
  RUNS: 'Run Log',
  CONFIG: 'Config',
  NOTES: 'Living Notes',
  BACKUPS: 'Backups Log',
};

const HEADERS = {
  [SHEETS.SPECIES]: [
    'Species ID', 'Common Name', 'Scientific Name', 'Species Category',
    'Native Climate / Region', 'Natural Conditions', 'Created Date',
  ],
  [SHEETS.RUNS]: [
    'Run ID', 'Species ID', 'Parent Run ID', 'Date Started',
    'Propagation Method', 'Phase', 'Season / Year',
    'Medium', 'Container', 'Light Exposure', 'Temp °C', 'Rainfall',
    'Quantity Started', 'Quantity Surviving', 'Days to First Success',
    'Human Interventions', 'Outcome / Observations', 'Status', 'Last Updated',
  ],
  [SHEETS.CONFIG]: [
    'Propagation Methods', 'Species Categories', 'Phases', 'Statuses',
    'Mediums', 'Container Types', 'Light Exposure', 'Rainfall',
  ],
  [SHEETS.NOTES]: [
    'Note ID', 'Linked Type', 'Linked ID', 'Date', 'Note',
  ],
  [SHEETS.BACKUPS]: [
    'Date', 'Status', 'File URL', 'Notes',
  ],
};

const SEED_CONFIG = {
  'Propagation Methods': ['Seed', 'Softwood Cutting', 'Hardwood Cutting', 'Division', 'Layering', 'Grafting'],
  'Species Categories': ['Tree', 'Shrub', 'Herb', 'Succulent', 'Grass', 'Fern', 'Climber', 'Conifer'],
  'Phases': ['Sourcing', 'Sown / Struck', 'Callusing', 'Rooting', 'Hardening Off', 'Potted On', 'Planted Out'],
  'Statuses': ['In progress', 'Success', 'Partial', 'Failed', 'Closed'],
  'Mediums': ['Perlite', 'Coir', 'Seed-raising Mix', 'Sand', 'Water'],
  'Container Types': ['Seed Tray', 'Tube', '4" Pot', 'Propagator'],
  'Light Exposure': ['Full Sun', 'Part Shade', 'Full Shade', 'Indoor'],
  'Rainfall': ['None', 'Light', 'Moderate', 'Heavy', 'N/A'],
};

function setupWorkbook() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.values(SHEETS).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const headers = HEADERS[name];
    const existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    const empty = existing.every(v => v === '' || v === null);
    if (empty) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
      sheet.setFrozenRows(1);
      sheet.autoResizeColumns(1, headers.length);
    }
  });

  seedConfig_(ss);
  applyValidation_(ss);
  cleanupDefaultSheet_(ss);

  SpreadsheetApp.getUi().alert('Setup complete — sheets created, seeds loaded, dropdowns applied.');
}

function seedConfig_(ss) {
  const sheet = ss.getSheetByName(SHEETS.CONFIG);
  const headers = HEADERS[SHEETS.CONFIG];
  headers.forEach((header, colIdx) => {
    const col = colIdx + 1;
    const existing = sheet.getRange(2, col, Math.max(sheet.getLastRow() - 1, 1), 1)
      .getValues().flat().filter(v => v !== '');
    if (existing.length === 0 && SEED_CONFIG[header]) {
      const values = SEED_CONFIG[header].map(v => [v]);
      sheet.getRange(2, col, values.length, 1).setValues(values);
    }
  });
}

function applyValidation_(ss) {
  const config = ss.getSheetByName(SHEETS.CONFIG);
  const species = ss.getSheetByName(SHEETS.SPECIES);
  const runs = ss.getSheetByName(SHEETS.RUNS);

  const lastRow = 1000;
  const configCol = (header) => HEADERS[SHEETS.CONFIG].indexOf(header) + 1;

  const dropdown = (sourceCol) => SpreadsheetApp.newDataValidation()
    .requireValueInRange(config.getRange(2, sourceCol, 500, 1), true)
    .setAllowInvalid(false).build();

  // Species sheet — Species Category
  species.getRange(2, HEADERS[SHEETS.SPECIES].indexOf('Species Category') + 1, lastRow, 1)
    .setDataValidation(dropdown(configCol('Species Categories')));

  // Run Log dropdowns
  const runValidations = {
    'Propagation Method': 'Propagation Methods',
    'Phase': 'Phases',
    'Status': 'Statuses',
    'Medium': 'Mediums',
    'Container': 'Container Types',
    'Light Exposure': 'Light Exposure',
    'Rainfall': 'Rainfall',
  };
  Object.entries(runValidations).forEach(([field, configHeader]) => {
    const col = HEADERS[SHEETS.RUNS].indexOf(field) + 1;
    runs.getRange(2, col, lastRow, 1).setDataValidation(dropdown(configCol(configHeader)));
  });
}

function cleanupDefaultSheet_(ss) {
  const def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
}
