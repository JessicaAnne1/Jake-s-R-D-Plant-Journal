// API client. Configuration lives in config.js — edit USE_MOCK / API_URL
// there after deploying the Apps Script web app.
window.API_CONFIG = window.API_CONFIG || { USE_MOCK: true, API_URL: '', API_TOKEN: '' };

window.api = {
  async getConfig() {
    if (API_CONFIG.USE_MOCK) return clone(window.MOCK_CONFIG);
    return call('getConfig');
  },
  async addConfigValue(category, value) {
    if (API_CONFIG.USE_MOCK) {
      window.MOCK_CONFIG[category] = window.MOCK_CONFIG[category] || [];
      if (!window.MOCK_CONFIG[category].includes(value)) window.MOCK_CONFIG[category].push(value);
      return clone(window.MOCK_CONFIG);
    }
    return call('addConfigValue', { category, value });
  },
  async removeConfigValue(category, value) {
    if (API_CONFIG.USE_MOCK) {
      window.MOCK_CONFIG[category] = (window.MOCK_CONFIG[category] || []).filter(v => v !== value);
      return clone(window.MOCK_CONFIG);
    }
    return call('removeConfigValue', { category, value });
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
  async getReports() {
    if (API_CONFIG.USE_MOCK) {
      // Mock reports — synthesize from MOCK_RUNS if any exist.
      const runs = window.MOCK_RUNS || [];
      const closed = runs.filter(r => ['Success','Partial','Failed','Closed'].includes(r['Status']));
      const speciesNameById = {};
      (window.MOCK_SPECIES || []).forEach(s => { speciesNameById[s['Species ID']] = s['Common Name']; });
      const groupBy = (rows, keyFn) => {
        const map = {};
        rows.forEach(r => {
          const k = keyFn(r) || '(unspecified)';
          if (!map[k]) map[k] = { key: k, total: 0, started: 0, surviving: 0, success: 0 };
          map[k].total += 1;
          map[k].started += Number(r['Quantity Started']) || 0;
          map[k].surviving += Number(r['Quantity Surviving']) || 0;
          if (r['Status'] === 'Success') map[k].success += 1;
        });
        return Object.values(map).map(g => Object.assign(g, {
          strikeRate: g.started > 0 ? Math.round((g.surviving / g.started) * 100) : null,
          successRate: g.total > 0 ? Math.round((g.success / g.total) * 100) : 0,
        })).sort((a, b) => b.total - a.total);
      };
      return {
        byMethod: groupBy(closed, r => r['Propagation Method']),
        bySpecies: groupBy(closed, r => speciesNameById[r['Species ID']]),
        bySeason: groupBy(closed, r => r['Season / Year']),
        needsAttention: [],
        totals: { species: (window.MOCK_SPECIES || []).length, runs: runs.length, closedRuns: closed.length },
      };
    }
    return call('getReports');
  },
  // ─── Brew Lab ──────────────────────────────────────────────────────
  async listBrews()                       { return mockArray('MOCK_BREWS') ?? call('listBrews'); },
  async getBrew(brewId)                   { return call('getBrew', { brewId }); },
  async createBrew(data)                  { return call('createBrew', data); },
  async updateBrew(brewId, data)          { return call('updateBrew', { brewId, data }); },

  async listSites()                       { return mockArray('MOCK_SITES') ?? call('listSites'); },
  async getSite(siteId)                   { return call('getSite', { siteId }); },
  async createSite(data)                  { return call('createSite', data); },
  async updateSite(siteId, data)          { return call('updateSite', { siteId, data }); },

  async deleteSite(siteId)                { return call('deleteSite', { siteId }); },
  async deleteBrew(brewId)                { return call('deleteBrew', { brewId }); },

  // Batch screen loads — one round-trip per page
  async getGridScreenData()               { return call('getGridScreenData'); },
  async getSpeciesScreenData(speciesId)   { return call('getSpeciesScreenData', { speciesId }); },
  async getRunScreenData(runId)           { return call('getRunScreenData', { runId }); },
  async getReportsScreenData()            { return call('getReportsScreenData'); },
  async getBrewHomeData()                 { return call('getBrewHomeData'); },
  async getSitesScreenData()              { return call('getSitesScreenData'); },
  async getBrewsScreenData()              { return call('getBrewsScreenData'); },
  async getSiteScreenData(siteId)         { return call('getSiteScreenData', { siteId }); },
  async getBrewScreenData(brewId)         { return call('getBrewScreenData', { brewId }); },
  async getBrewStatsData()                { return call('getBrewStatsData'); },

  async listApplicationsBySite(siteId)    { return call('listApplicationsBySite', { siteId }); },
  async listApplicationsByBrew(brewId)    { return call('listApplicationsByBrew', { brewId }); },
  async createApplication(data)           { return call('createApplication', data); },
  async updateApplication(id, data)       { return call('updateApplication', { id, data }); },
  async deleteApplication(id)             { return call('deleteApplication', { id }); },

  async listObservationsBySite(siteId)    { return call('listObservationsBySite', { siteId }); },
  async createObservation(data)           { return call('createObservation', data); },
  async updateObservation(id, data)       { return call('updateObservation', { id, data }); },
  async deleteObservation(id)             { return call('deleteObservation', { id }); },

  async uploadBrewPhoto(payload)          { return call('uploadBrewPhoto', payload); },
  async getBrewReports()                  { return call('getBrewReports'); },

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
function mockArray(globalKey) {
  if (!API_CONFIG.USE_MOCK) return null;
  return clone(window[globalKey] || []);
}
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
