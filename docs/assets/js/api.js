// API client. Configuration lives in config.js — edit USE_MOCK / API_URL
// there after deploying the Apps Script web app.
window.API_CONFIG = window.API_CONFIG || { USE_MOCK: true, API_URL: '', API_TOKEN: '' };

window.api = {
  async getConfig() {
    if (API_CONFIG.USE_MOCK) return clone(window.MOCK_CONFIG);
    return call('getConfig');
  },
  async listSpecies() {
    if (API_CONFIG.USE_MOCK) {
      return clone(window.MOCK_SPECIES).sort(byCreatedDesc);
    }
    return call('listSpecies');
  },
  async getSpecies(id) {
    if (API_CONFIG.USE_MOCK) return clone(window.MOCK_SPECIES.find(s => s['Species ID'] === id));
    return call('getSpecies', { speciesId: id });
  },
  async createSpecies(data) {
    if (API_CONFIG.USE_MOCK) {
      const id = nextMockId('SP-', window.MOCK_SPECIES.map(s => s['Species ID']));
      const created = Object.assign({}, data, { 'Species ID': id, runCount: 0, _created: Date.now() });
      window.MOCK_SPECIES.unshift(created);
      return clone(created);
    }
    return call('createSpecies', data);
  },
  async updateSpecies(id, data) {
    if (API_CONFIG.USE_MOCK) {
      const i = window.MOCK_SPECIES.findIndex(s => s['Species ID'] === id);
      window.MOCK_SPECIES[i] = Object.assign({}, window.MOCK_SPECIES[i], data, { 'Species ID': id });
      return clone(window.MOCK_SPECIES[i]);
    }
    return call('updateSpecies', { speciesId: id, data });
  },
  async listRunsBySpecies(speciesId) {
    if (API_CONFIG.USE_MOCK) {
      return clone((window.MOCK_RUNS || []).filter(r => r['Species ID'] === speciesId));
    }
    return call('listRunsBySpecies', { speciesId });
  },
  async getRun(runId) {
    if (API_CONFIG.USE_MOCK) {
      return clone((window.MOCK_RUNS || []).find(r => r['Run ID'] === runId));
    }
    return call('getRun', { runId });
  },
  async createRun(data) {
    if (API_CONFIG.USE_MOCK) {
      window.MOCK_RUNS = window.MOCK_RUNS || [];
      const id = nextMockId('RUN-', window.MOCK_RUNS.map(r => r['Run ID']));
      const run = Object.assign({}, data, {
        'Run ID': id,
        'Last Updated': new Date().toISOString(),
        'Season / Year': mockSeason(data['Date Started']),
      });
      window.MOCK_RUNS.unshift(run);
      const sp = window.MOCK_SPECIES.find(s => s['Species ID'] === run['Species ID']);
      if (sp) sp.runCount = (sp.runCount || 0) + 1;
      return clone(run);
    }
    return call('createRun', data);
  },
  async updateRun(runId, data) {
    if (API_CONFIG.USE_MOCK) {
      const i = window.MOCK_RUNS.findIndex(r => r['Run ID'] === runId);
      if (i < 0) throw new Error('Run not found');
      window.MOCK_RUNS[i] = Object.assign({}, window.MOCK_RUNS[i], data, {
        'Run ID': runId,
        'Last Updated': new Date().toISOString(),
      });
      if (data['Date Started']) window.MOCK_RUNS[i]['Season / Year'] = mockSeason(data['Date Started']);
      return clone(window.MOCK_RUNS[i]);
    }
    return call('updateRun', { runId, data });
  },
  async duplicateRun(runId) {
    if (API_CONFIG.USE_MOCK) {
      const orig = window.MOCK_RUNS.find(r => r['Run ID'] === runId);
      if (!orig) throw new Error('Run not found');
      const copy = Object.assign({}, orig, {
        'Parent Run ID': runId,
        'Date Started': new Date().toISOString().slice(0, 10),
        'Quantity Surviving': '',
        'Days to First Success': '',
        'Outcome / Observations': '',
        'Status': 'In progress',
      });
      delete copy['Run ID'];
      delete copy['Last Updated'];
      delete copy['Season / Year'];
      return this.createRun(copy);
    }
    return call('duplicateRun', { runId });
  },
  async listNotes(linkedType, linkedId) {
    if (API_CONFIG.USE_MOCK) {
      const key = linkedType + ':' + linkedId;
      return clone((window.MOCK_NOTES[key] || []));
    }
    return call('listNotes', { linkedType, linkedId });
  },
  async addNote(linkedType, linkedId, text) {
    if (API_CONFIG.USE_MOCK) {
      const key = linkedType + ':' + linkedId;
      window.MOCK_NOTES[key] = window.MOCK_NOTES[key] || [];
      const note = { 'Note ID': 'N-' + Date.now(), 'Linked Type': linkedType, 'Linked ID': linkedId, Date: new Date().toISOString(), Note: text };
      window.MOCK_NOTES[key].unshift(note);
      return clone(note);
    }
    return call('addNote', { linkedType, linkedId, text });
  },
};

function clone(o) { return JSON.parse(JSON.stringify(o)); }
function byCreatedDesc(a, b) {
  const ad = a._created || a['Created Date'] || 0;
  const bd = b._created || b['Created Date'] || 0;
  return new Date(bd) - new Date(ad);
}
function mockSeason(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d)) return '';
  const m = d.getMonth() + 1, y = d.getFullYear();
  if (m === 12) return `Summer ${y}/${String(y + 1).slice(-2)}`;
  if (m <= 2)   return `Summer ${y - 1}/${String(y).slice(-2)}`;
  if (m <= 5)   return `Autumn ${y}`;
  if (m <= 8)   return `Winter ${y}`;
  return `Spring ${y}`;
}
function nextMockId(prefix, existing) {
  const nums = existing.map(v => parseInt(String(v).replace(prefix, ''), 10)).filter(n => !isNaN(n));
  const max = nums.length ? Math.max.apply(null, nums) : 0;
  return prefix + String(max + 1).padStart(4, '0');
}

async function call(action, payload = {}) {
  const url = API_CONFIG.API_URL;
  if (!url) throw new Error('API_URL not configured');
  const body = { action, payload };
  if (API_CONFIG.API_TOKEN) body.token = API_CONFIG.API_TOKEN;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // dodges CORS preflight on Apps Script
    body: JSON.stringify(body),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}
