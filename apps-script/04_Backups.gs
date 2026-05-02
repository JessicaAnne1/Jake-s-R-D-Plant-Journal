/**
 * Propagation R&D Journal — Weekly CSV backup
 *
 * Creates a date-stamped folder in your Drive containing one .csv per data
 * tab (Species, Run Log, Living Notes — Config and Backups Log are skipped).
 * Logs the result to the Backups Log tab.
 *
 * One-time setup:
 *   1. Run installWeeklyBackupTrigger() once (Run dropdown → Run → approve perms).
 *      This installs a weekly time-based trigger that fires runWeeklyBackup()
 *      every Sunday around 3am.
 *   2. Done — no further interaction needed.
 *
 * To run manually any time: select runWeeklyBackup → Run.
 * To remove the schedule:  select removeWeeklyBackupTrigger → Run.
 */

const BACKUP_FOLDER_NAME = 'Propagation R&D — Backups';
const BACKUP_TABS = ['Species', 'Run Log', 'Living Notes'];

function installWeeklyBackupTrigger() {
  removeWeeklyBackupTrigger();
  ScriptApp.newTrigger('runWeeklyBackup')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(3)
    .create();
  SpreadsheetApp.getUi().alert('Weekly backup scheduled for Sundays ~3am.\n\nFirst backup will run at the next Sunday 3am window. Run runWeeklyBackup manually now if you want one immediately.');
}

function removeWeeklyBackupTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'runWeeklyBackup')
    .forEach(t => ScriptApp.deleteTrigger(t));
}

function runWeeklyBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(SHEETS.BACKUPS);
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH-mm');
  let folderUrl = '';
  let status = 'Success';
  let notes = '';
  const filenames = [];

  try {
    const root = getOrCreateFolder_(BACKUP_FOLDER_NAME);
    const folder = root.createFolder(stamp);
    folderUrl = folder.getUrl();

    BACKUP_TABS.forEach(name => {
      const sheet = ss.getSheetByName(name);
      if (!sheet) { notes += `(skipped ${name}: not found) `; return; }
      const csv = sheetToCsv_(sheet);
      const safeName = name.replace(/[^a-z0-9]+/gi, '-');
      const filename = `${safeName}-${stamp}.csv`;
      folder.createFile(filename, csv, MimeType.CSV);
      filenames.push(filename);
    });

    notes = (notes + `Wrote ${filenames.length} file(s): ${filenames.join(', ')}`).trim();
  } catch (err) {
    status = 'Failed';
    notes = String(err && err.message || err);
  }

  if (logSheet) {
    logSheet.appendRow([new Date(), status, folderUrl, notes]);
  }
}

function getOrCreateFolder_(name) {
  const it = DriveApp.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(name);
}

function sheetToCsv_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow === 0 || lastCol === 0) return '';
  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  return values.map(row => row.map(cell => {
    if (cell == null) return '';
    let s = (cell instanceof Date)
      ? Utilities.formatDate(cell, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss")
      : String(cell);
    if (s.indexOf('"') >= 0) s = s.replace(/"/g, '""');
    if (/[",\n\r]/.test(s)) s = `"${s}"`;
    return s;
  }).join(',')).join('\n');
}
