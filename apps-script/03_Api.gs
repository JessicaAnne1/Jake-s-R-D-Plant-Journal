/**
 * Propagation R&D Journal — JSON API
 * Routes incoming HTTP requests from the static frontend to the CRUD
 * functions defined in Code.gs. Single endpoint via doPost().
 *
 * Deploy:  Deploy → New deployment → Web app
 *          Execute as: Me
 *          Who has access: Anyone   (URL is public — keep it private)
 *          Copy the /exec URL into web/assets/js/api.js (API_URL).
 *
 * Optional shared-secret token: set API_TOKEN below to a long random string,
 * and set the same value in web/assets/js/api.js (API_TOKEN). Empty = no check.
 */

const API_TOKEN = ''; // e.g. 'set-a-long-random-string-here'

const API_ROUTES = {
  getConfig:          () => getConfig(),
  addConfigValue:     (p) => addConfigValue(p.category, p.value),
  removeConfigValue:  (p) => removeConfigValue(p.category, p.value),

  listSpecies:        () => listSpecies(),
  getSpecies:         (p) => getSpecies(p.speciesId),
  createSpecies:      (p) => createSpecies(p),
  updateSpecies:      (p) => updateSpecies(p.speciesId, p.data),

  listRunsBySpecies:  (p) => listRunsBySpecies(p.speciesId),
  getRun:             (p) => getRun(p.runId),
  createRun:          (p) => createRun(p),
  updateRun:          (p) => updateRun(p.runId, p.data),
  duplicateRun:       (p) => duplicateRun(p.runId),

  listNotes:          (p) => listNotes(p.linkedType, p.linkedId),
  addNote:            (p) => addNote(p.linkedType, p.linkedId, p.text),

  getReports:         () => getReports(),
};

function doPost(e) {
  return handle_(e);
}

function doGet(e) {
  // Useful so visiting the URL in a browser confirms it's deployed.
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: 'Propagation R&D API. Use POST.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handle_(e) {
  try {
    const body = e && e.postData && e.postData.contents
      ? JSON.parse(e.postData.contents)
      : {};

    if (API_TOKEN && body.token !== API_TOKEN) {
      return jsonOut_({ error: 'Unauthorized' });
    }

    const action = body.action;
    const payload = body.payload || {};
    const fn = API_ROUTES[action];
    if (!fn) return jsonOut_({ error: 'Unknown action: ' + action });

    const result = fn(payload);
    return jsonOut_({ result });
  } catch (err) {
    return jsonOut_({ error: String(err && err.message || err) });
  }
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
