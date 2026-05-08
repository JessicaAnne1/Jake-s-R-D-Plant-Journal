// ─── State ──────────────────────────────────────────────────────────
const State = {
  mode: localStorage.getItem('jakes-mode') || 'plant',  // 'plant' | 'brew'
  config: null,
  species: [],
  brews: [],
  sites: [],
  filters: { search: '', category: '' },
  history: [],     // navigation stack: [{ name, params }]
  current: { name: 'grid', params: {} },
};

// ─── Mode definitions ───────────────────────────────────────────────
const MODES = {
  plant: {
    label: 'PLANT JOURNAL',
    home: 'grid',
    accent: 'var(--moss)',
    brandSub: 'PLANT JOURNAL',
    fabAction: 'fab-plant',
    nav: [
      { name: 'grid',    label: 'Specimens', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>' },
      { name: 'reports', label: 'Stats',     icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l3-3 4 4 6-6"/></svg>' },
    ],
  },
  brew: {
    label: 'BREW LAB',
    home: 'brewhome',
    accent: 'var(--terra)',
    brandSub: 'BREW LAB',
    fabAction: 'fab-brew',
    nav: [
      { name: 'brewhome',  label: 'Home',  icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l9-9 9 9"/><path d="M5 10v11h14V10"/></svg>' },
      { name: 'brewstats', label: 'Stats', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l3-3 4 4 6-6"/></svg>' },
    ],
  },
};
function currentMode() { return MODES[State.mode]; }

function toggleMode() {
  State.mode = State.mode === 'plant' ? 'brew' : 'plant';
  localStorage.setItem('jakes-mode', State.mode);
  State.history = [];
  State.filters = { search: '', category: '' };
  applyMode();
  Router.go(currentMode().home, {}, { reset: true });
  toast('Switched to ' + currentMode().label);
}

function applyMode() {
  const m = currentMode();
  $('#brand-sub').textContent = m.brandSub;
  document.body.dataset.mode = State.mode;
  renderBottomNav();
}

function renderBottomNav() {
  const nav = $('#bottom-nav');
  if (!nav) return;
  const m = currentMode();
  nav.innerHTML = '';
  // First nav item
  nav.appendChild(navButton(m.nav[0]));
  // FAB centered
  const fab = el('button', {
    class: 'nav-btn fab',
    'data-action': m.fabAction,
    'aria-label': 'Add',
  });
  fab.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  nav.appendChild(fab);
  // Second + third nav items (if any)
  m.nav.slice(1).forEach(item => nav.appendChild(navButton(item)));
}
function navButton(item) {
  const btn = el('button', { class: 'nav-btn', 'data-nav': item.name },
    el('span', { class: 'nav-icon', html: item.icon }),
    el('span', {}, item.label),
  );
  return btn;
}

// ─── Utilities ──────────────────────────────────────────────────────
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v == null || v === false) return;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) node.setAttribute(k, '');
    else node.setAttribute(k, v);
  });
  children.flat().forEach(c => {
    if (c == null || c === false) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}

function toast(msg) {
  const t = el('div', { class: 'toast' }, msg);
  $('#toast-root').appendChild(t);
  setTimeout(() => t.remove(), 2400);
}

const fmtDate = (d) => {
  if (!d) return '';
  const date = (d instanceof Date) ? d : new Date(d);
  if (isNaN(date)) return '';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const slug = (s) => (s || '').toLowerCase().replace(/[^a-z]/g, '');

// ─── Router ─────────────────────────────────────────────────────────
const Router = {
  go(name, params = {}, { push = true, reset = false } = {}) {
    if (reset) State.history = [];
    if (push && !reset && State.current.name !== name) State.history.push(State.current);
    State.current = { name, params };
    render();
  },
  back() {
    const prev = State.history.pop();
    if (prev) { State.current = prev; render(); }
    else      { Router.go(currentMode().home, {}, { reset: true }); }
  },
};

function render() {
  const { name, params } = State.current;
  const screen = $('#screen');
  screen.innerHTML = '<div class="loading">Loading…</div>';

  $$('.nav-btn[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
  $('.back-btn').hidden = (name === currentMode().home && State.history.length === 0);

  const dispatch = () => {
    // Plant mode
    if      (name === 'grid')          return Screens.grid(screen);
    else if (name === 'species')       return Screens.speciesDetail(screen, params.speciesId);
    else if (name === 'run')           return Screens.runDetail(screen, params.runId);
    else if (name === 'reports')       return Screens.reports(screen);
    // Brew mode
    else if (name === 'brewhome')      return Screens.brewhome(screen);
    else if (name === 'sites')         return Screens.sites(screen);
    else if (name === 'site')          return Screens.siteDetail(screen, params.siteId);
    else if (name === 'brews')         return Screens.brews(screen);
    else if (name === 'brew')          return Screens.brewDetail(screen, params.brewId);
    else if (name === 'brewstats')     return Screens.brewStats(screen);
    // Shared
    else if (name === 'settings')      return Screens.settings(screen);
  };

  Promise.resolve().then(dispatch).catch(err => {
    console.error(err);
    renderScreenError(screen, err);
  });
}

function renderScreenError(root, err) {
  const msg = (err && err.message) || String(err);
  const isUnknown = /Unknown action/i.test(msg);
  root.innerHTML = '';
  root.appendChild(el('div', { class: 'empty' },
    el('div', { class: 'empty-illustration', html: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="32" r="24"/><path d="M32 18v18M32 44v.5"/></svg>` }),
    el('p', { class: 'empty-title' }, isUnknown ? 'Backend not redeployed yet' : 'Something went wrong'),
    el('p', { class: 'empty-body' }, isUnknown
      ? 'The Apps Script Web App needs to be redeployed so it picks up the new Brew Lab actions. Open Apps Script → Deploy → Manage deployments → pencil → Version: New version → Deploy.'
      : msg),
    el('div', { style: 'margin-top:14px' },
      el('button', { class: 'btn', onclick: () => render() }, 'Try again'),
    ),
  ));
}

document.addEventListener('click', (e) => {
  const navBtn = e.target.closest('[data-nav]');
  if (navBtn) { Router.go(navBtn.dataset.nav, {}, { reset: true }); return; }
  const action = e.target.closest('[data-action]');
  if (action) {
    const a = action.dataset.action;
    if (a === 'back') Router.back();
    else if (a === 'toggle-mode') toggleMode();
    else if (a === 'fab-plant') openFabSheet();
    else if (a === 'fab-brew')  openBrewFabSheet();
    else if (a === 'add-species') openFabSheet();
    else if (a === 'add-species-direct') openAddSpeciesModal();
    else if (a === 'add-run') openAddRunModal(action.dataset.speciesId);
    else if (a === 'add-application') openAddApplicationModal(action.dataset.siteId, action.dataset.brewId);
    else if (a === 'add-observation') openAddObservationModal(action.dataset.siteId);
  }
});

// ─── FAB action sheet (contextual + menu) ────────────────────────────
function openFabSheet() {
  const { name, params } = State.current;
  const actions = [];

  actions.push({
    label: 'Add new species', sub: 'Create a new entry',
    icon: '＋', cls: '',
    onClick: () => openAddSpeciesModal(),
  });

  if (name === 'grid') {
    actions.push({
      label: 'New propagation run', sub: 'Pick a species and log an attempt',
      icon: '🌱', cls: 'alt',
      onClick: () => openAddRunModal(null),
    });
  }

  if (name === 'species' && params.speciesId) {
    const sp = State.species.find(s => s['Species ID'] === params.speciesId);
    const spName = sp ? sp['Common Name'] : 'this species';
    actions.unshift({
      label: 'New propagation run', sub: `Log a new attempt for ${spName}`,
      icon: '🌱', cls: 'alt',
      onClick: () => openAddRunModal(params.speciesId),
    });
    actions.push({
      label: 'Add a note', sub: `Living note for ${spName}`,
      icon: '✎', cls: 'cool',
      onClick: () => focusNoteInput(),
    });
  }

  if (name === 'run' && params.runId) {
    actions.unshift({
      label: 'Duplicate this run', sub: 'Clone as a new attempt',
      icon: '⎘', cls: 'alt',
      onClick: () => duplicateCurrentRun(params.runId),
    });
    actions.push({
      label: 'Add a run note', sub: 'Observation for this run',
      icon: '✎', cls: 'cool',
      onClick: () => focusNoteInput(),
    });
  }

  showActionSheet(actions);
}

function showActionSheet(actions) {
  const root = $('#modal-root');
  const close = () => { root.innerHTML = ''; document.body.style.overflow = ''; };
  document.body.style.overflow = 'hidden';

  const backdrop = el('div', { class: 'sheet-backdrop',
    onclick: (e) => { if (e.target === backdrop) close(); }
  },
    el('div', { class: 'action-sheet' },
      el('div', { class: 'sheet-handle' }),
      ...actions.map(a => el('button', {
        class: 'sheet-action',
        onclick: () => { close(); setTimeout(a.onClick, 50); }
      },
        el('div', { class: 'ico ' + (a.cls || '') }, a.icon),
        el('div', { class: 'body' },
          el('span', {}, a.label),
          a.sub ? el('small', {}, a.sub) : null,
        ),
      )),
      el('button', { class: 'sheet-cancel', onclick: close }, 'Cancel'),
    )
  );
  root.innerHTML = '';
  root.appendChild(backdrop);
}

function focusNoteInput() {
  const ta = $('.note-form textarea');
  if (ta) { ta.focus(); ta.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  else toast('No note field on this screen');
}

async function duplicateCurrentRun(runId) {
  try {
    const dup = await api.duplicateRun(runId);
    toast('Duplicated as ' + dup['Run ID']);
    Router.go('run', { runId: dup['Run ID'] });
  } catch (err) { toast('Error: ' + err.message); }
}

// ─── Screens ────────────────────────────────────────────────────────
const Screens = {
  async grid(root) {
    if (!State.config) State.config = await api.getConfig();
    State.species = await api.listSpecies();
    renderGrid(root);
  },

  async speciesDetail(root, speciesId) {
    if (!State.config) State.config = await api.getConfig();
    const [species, runs, notes] = await Promise.all([
      api.getSpecies(speciesId),
      api.listRunsBySpecies(speciesId),
      api.listNotes('Species', speciesId),
    ]);
    if (!species) { Screens.placeholder(root, 'Not found', 'Species not found.'); return; }
    renderSpeciesDetail(root, species, runs, notes);
  },

  async settings(root) {
    State.config = await api.getConfig();
    renderSettings(root);
  },

  // ─── Brew Lab screens ─────────────────────────────────────────────
  async brewhome(root) {
    if (!State.config) State.config = await api.getConfig();
    const reports = await api.getBrewReports();
    State.sites = await api.listSites();
    State.brews = await api.listBrews();
    renderBrewHome(root, reports);
  },
  async sites(root) {
    if (!State.config) State.config = await api.getConfig();
    State.sites = await api.listSites();
    renderSitesGrid(root);
  },
  async siteDetail(root, siteId) {
    if (!State.config) State.config = await api.getConfig();
    if (!State.brews.length) State.brews = await api.listBrews();
    const [site, applications, observations] = await Promise.all([
      api.getSite(siteId),
      api.listApplicationsBySite(siteId),
      api.listObservationsBySite(siteId),
    ]);
    if (!site) { Screens.placeholder(root, 'Not found', 'Site not found.'); return; }
    renderSiteDetail(root, site, applications, observations);
  },
  async brews(root) {
    if (!State.config) State.config = await api.getConfig();
    State.brews = await api.listBrews();
    renderBrewsGrid(root);
  },
  async brewDetail(root, brewId) {
    if (!State.config) State.config = await api.getConfig();
    if (!State.sites.length) State.sites = await api.listSites();
    const [brew, applications] = await Promise.all([
      api.getBrew(brewId),
      api.listApplicationsByBrew(brewId),
    ]);
    if (!brew) { Screens.placeholder(root, 'Not found', 'Brew not found.'); return; }
    renderBrewDetail(root, brew, applications);
  },
  async brewStats(root) {
    if (!State.config) State.config = await api.getConfig();
    const reports = await api.getBrewReports();
    renderBrewStats(root, reports);
  },

  async reports(root) {
    if (!State.config) State.config = await api.getConfig();
    const reports = await api.getReports();
    if (!State.species.length) State.species = await api.listSpecies();
    renderReports(root, reports);
  },

  async runDetail(root, runId) {
    if (!State.config) State.config = await api.getConfig();
    const run = await api.getRun(runId);
    if (!run) { Screens.placeholder(root, 'Not found', 'Run not found.'); return; }
    const species = await api.getSpecies(run['Species ID']);
    const notes = await api.listNotes('Run', runId);
    renderRunDetail(root, run, species, notes);
  },

  placeholder(root, title, body) {
    root.innerHTML = '';
    root.appendChild(emptyState(title, body));
  },
};

// ─── Grid screen ────────────────────────────────────────────────────
function renderGrid(root) {
  root.innerHTML = '';

  const sticky = el('div', { class: 'sticky-bar' },
    el('div', { class: 'search' },
      el('span', { class: 'search-icon', html: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>` }),
      el('input', {
        type: 'search',
        placeholder: 'Search by name, category, region, conditions…',
        value: State.filters.search,
        oninput: (e) => { State.filters.search = e.target.value; renderCards(); }
      })
    ),
    el('div', { class: 'chip-row' },
      chip('All', !State.filters.category, () => { State.filters.category = ''; renderGrid(root); }),
      ...State.config['Species Categories'].map(c =>
        chip(c, State.filters.category === c, () => {
          State.filters.category = State.filters.category === c ? '' : c;
          renderGrid(root);
        })
      )
    )
  );
  root.appendChild(sticky);

  root.appendChild(el('div', { class: 'card-grid', id: 'card-grid' }));
  renderCards();
}

function chip(label, active, onClick) {
  return el('button', { class: 'chip' + (active ? ' active' : ''), onclick: onClick }, label);
}

function renderCards() {
  const grid = $('#card-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const q = State.filters.search.trim().toLowerCase();
  const cat = State.filters.category;
  const filtered = State.species.filter(s => {
    if (cat && s['Species Category'] !== cat) return false;
    if (!q) return true;
    const haystack = [
      s['Common Name'],
      s['Scientific Name'],
      s['Species Category'],
      s['Native Climate / Region'],
      s['Natural Conditions'],
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  });

  if (filtered.length === 0) {
    grid.style.display = 'none';
    grid.parentElement.appendChild(emptyState(
      State.species.length === 0 ? 'No species yet' : 'Nothing matches',
      State.species.length === 0
        ? 'Tap the green + below to add your first.'
        : 'Try a different search or filter.'
    ));
    return;
  }
  grid.style.display = '';
  filtered.forEach((s, i) => grid.appendChild(speciesCard(s, i)));
}

function speciesCard(s, idx = 0) {
  const cat = s['Species Category'];
  const card = el('button', {
    class: 'species-card cat-' + slug(cat),
    onclick: () => Router.go('species', { speciesId: s['Species ID'] }),
  },
    el('div', { class: 'card-banner', html: iconFor(cat) }),
    el('div', { class: 'card-body' },
      el('h3', { class: 'common-name' }, s['Common Name'] || '(unnamed)'),
      el('p', { class: 'scientific-name' }, s['Scientific Name'] || ''),
      el('div', { class: 'card-foot' },
        cat ? el('span', { class: 'cat-tag' }, cat) : el('span'),
        s.runCount
          ? el('span', { class: 'run-count' }, `${s.runCount} ${s.runCount === 1 ? 'RUN' : 'RUNS'}`)
          : null,
      ),
    ),
  );
  card.style.animationDelay = `${Math.min(idx, 20) * 30}ms`;
  return card;
}

function emptyState(title, body) {
  return el('div', { class: 'empty' },
    el('div', { class: 'empty-illustration', html: `
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M32 50V20"/>
        <path d="M32 36c-8 0-14-6-14-14 0-5 3-9 7-9"/>
        <path d="M32 30c8 0 14-6 14-14 0-5-3-9-7-9"/>
        <path d="M22 50h20"/>
      </svg>` }),
    el('p', { class: 'empty-title' }, title),
    el('p', { class: 'empty-body' }, body),
  );
}

// ─── Species detail screen ─────────────────────────────────────────
function renderSpeciesDetail(root, species, runs, notes) {
  root.innerHTML = '';

  // Hero
  const hero = el('div', { class: 'detail-hero cat-' + slug(species['Species Category']) });
  hero.style.setProperty('--tint', categoryColor(species['Species Category']));
  hero.append(
    el('div', { class: 'hero-icon', html: iconFor(species['Species Category']) }),
    el('h2', {}, species['Common Name'] || '(unnamed)'),
    species['Scientific Name'] ? el('p', { class: 'sci' }, species['Scientific Name']) : null,
    el('div', { class: 'badges' },
      species['Species Category'] ? el('span', { class: 'pill' }, species['Species Category']) : null,
      species['Native Climate / Region'] ? el('span', { class: 'pill' }, species['Native Climate / Region']) : null,
    ),
    species['Natural Conditions']
      ? el('p', { class: 'hero-meta' }, el('strong', {}, 'Natural conditions: '), species['Natural Conditions'])
      : null,
  );
  root.appendChild(hero);

  // Notes section
  root.appendChild(el('div', { class: 'section-header' },
    el('h3', { html: `Notes ${notes.length ? `<span class="count">${notes.length}</span>` : ''}` }),
  ));

  const noteForm = el('form', { class: 'note-form', onsubmit: (e) => e.preventDefault() });
  const noteInput = el('textarea', { placeholder: 'Add a note…', rows: 1 });
  noteForm.append(
    noteInput,
    el('button', { class: 'btn-primary', onclick: async () => {
      const text = noteInput.value.trim();
      if (!text) return;
      try {
        await api.addNote('Species', species['Species ID'], text);
        toast('Note added');
        Router.go('species', { speciesId: species['Species ID'] }, { push: false });
      } catch (err) { toast('Error: ' + err.message); }
    }}, 'Add'),
  );
  root.appendChild(noteForm);

  if (notes.length) {
    const list = el('div', { class: 'notes-list' });
    notes.forEach(n => list.appendChild(el('div', { class: 'note' },
      el('div', { class: 'note-date' }, fmtDate(n['Date'])),
      el('div', { class: 'note-body' }, n['Note']),
    )));
    root.appendChild(list);
  }

  // Runs section
  root.appendChild(el('div', { class: 'section-header' },
    el('h3', { html: `Propagation runs ${runs.length ? `<span class="count">${runs.length}</span>` : ''}` }),
    el('button', { class: 'btn-add-inline', 'data-action': 'add-run', 'data-species-id': species['Species ID'] }, '＋ New run'),
  ));

  if (runs.length === 0) {
    root.appendChild(emptyState('No runs yet', 'Tap “New run” to log your first propagation attempt for this specimen.'));
  } else {
    const grid = el('div', { class: 'run-grid' });
    runs
      .slice().sort((a, b) => new Date(b['Date Started'] || 0) - new Date(a['Date Started'] || 0))
      .forEach(r => grid.appendChild(runCard(r)));
    root.appendChild(grid);
  }
}

function runCard(r) {
  return el('button', {
    class: 'run-card',
    onclick: () => Router.go('run', { runId: r['Run ID'] }),
  },
    el('div', { class: 'run-id' }, r['Run ID']),
    el('h4', { class: 'run-method' }, r['Propagation Method'] || '(no method)'),
    el('div', { class: 'run-meta' },
      r['Status'] ? el('span', { class: 'tag status-' + slug(r['Status']) }, r['Status']) : null,
      r['Phase'] ? el('span', { class: 'tag' }, r['Phase']) : null,
      r['Date Started'] ? el('span', { class: 'tag' }, fmtDate(r['Date Started'])) : null,
    ),
  );
}

// ─── Run detail screen ─────────────────────────────────────────────
function renderRunDetail(root, run, species, notes) {
  root.innerHTML = '';

  const detail = el('div', { class: 'run-detail' },
    el('div', { class: 'run-id' }, run['Run ID']),
    el('h2', {}, run['Propagation Method'] || '(no method)'),
    el('p', { class: 'sci' }, species ? `${species['Common Name']} — ${species['Scientific Name'] || ''}` : ''),
    el('div', { class: 'run-meta' },
      run['Status'] ? el('span', { class: 'tag status-' + slug(run['Status']) }, run['Status']) : null,
      run['Phase'] ? el('span', { class: 'tag' }, run['Phase']) : null,
      run['Season / Year'] ? el('span', { class: 'tag' }, run['Season / Year']) : null,
    ),
  );

  // Editable fields
  const grid = el('div', { class: 'field-grid' });
  const fields = [
    { key: 'Date Started', type: 'date' },
    { key: 'Propagation Method', type: 'select', config: 'Propagation Methods' },
    { key: 'Phase', type: 'select', config: 'Phases' },
    { key: 'Status', type: 'select', config: 'Statuses' },
    { key: 'Medium', type: 'select', config: 'Mediums' },
    { key: 'Container', type: 'select', config: 'Container Types' },
    { key: 'Light Exposure', type: 'select', config: 'Light Exposure' },
    { key: 'Rainfall', type: 'select', config: 'Rainfall' },
    { key: 'Temp °C', type: 'number' },
    { key: 'Quantity Started', type: 'number' },
    { key: 'Quantity Surviving', type: 'number' },
    { key: 'Days to First Success', type: 'number' },
  ];
  const inputs = {};
  fields.forEach(f => {
    let input;
    if (f.type === 'select') {
      input = el('select', { name: f.key },
        el('option', { value: '' }, '—'),
        ...(State.config[f.config] || []).map(v =>
          el('option', { value: v, selected: run[f.key] === v ? '' : null }, v)
        )
      );
    } else if (f.type === 'date') {
      const d = run[f.key] ? new Date(run[f.key]) : null;
      const v = d && !isNaN(d) ? d.toISOString().slice(0, 10) : '';
      input = el('input', { type: 'date', name: f.key, value: v });
    } else {
      input = el('input', { type: f.type, name: f.key, value: run[f.key] || '' });
    }
    inputs[f.key] = input;
    grid.appendChild(el('div', { class: 'field' }, el('label', {}, f.key), input));
  });

  const interventions = el('textarea', { name: 'Human Interventions' }, run['Human Interventions'] || '');
  const outcome      = el('textarea', { name: 'Outcome / Observations' }, run['Outcome / Observations'] || '');
  inputs['Human Interventions']    = interventions;
  inputs['Outcome / Observations'] = outcome;

  detail.appendChild(grid);
  detail.appendChild(el('div', { class: 'field' }, el('label', {}, 'Human Interventions'), interventions));
  detail.appendChild(el('div', { class: 'field' }, el('label', {}, 'Outcome / Observations'), outcome));

  detail.appendChild(el('div', { class: 'run-action-row' },
    el('button', { class: 'btn-primary', onclick: async () => {
      const data = {};
      Object.keys(inputs).forEach(k => { data[k] = inputs[k].value; });
      try {
        await api.updateRun(run['Run ID'], data);
        toast('Saved');
        Router.go('run', { runId: run['Run ID'] }, { push: false });
      } catch (err) { toast('Error: ' + err.message); }
    }}, 'Save changes'),
    el('button', { class: 'btn', onclick: async () => {
      try {
        const dup = await api.duplicateRun(run['Run ID']);
        toast('Duplicated as ' + dup['Run ID']);
        Router.go('run', { runId: dup['Run ID'] });
      } catch (err) { toast('Error: ' + err.message); }
    }}, 'Duplicate run'),
    el('button', { class: 'btn', onclick: () => {
      if (species) Router.go('species', { speciesId: species['Species ID'] });
    }}, '↩ Back to specimen'),
  ));

  root.appendChild(detail);

  // Run notes
  root.appendChild(el('div', { class: 'section-header' },
    el('h3', { html: `Run notes ${notes.length ? `<span class="count">${notes.length}</span>` : ''}` }),
  ));
  const noteForm = el('form', { class: 'note-form', onsubmit: (e) => e.preventDefault() });
  const noteInput = el('textarea', { placeholder: 'Add an observation…', rows: 1 });
  noteForm.append(
    noteInput,
    el('button', { class: 'btn-primary', onclick: async () => {
      const text = noteInput.value.trim();
      if (!text) return;
      try {
        await api.addNote('Run', run['Run ID'], text);
        toast('Note added');
        Router.go('run', { runId: run['Run ID'] }, { push: false });
      } catch (err) { toast('Error: ' + err.message); }
    }}, 'Add'),
  );
  root.appendChild(noteForm);

  if (notes.length) {
    const list = el('div', { class: 'notes-list' });
    notes.forEach(n => list.appendChild(el('div', { class: 'note' },
      el('div', { class: 'note-date' }, fmtDate(n['Date'])),
      el('div', { class: 'note-body' }, n['Note']),
    )));
    root.appendChild(list);
  }
}

function categoryColor(cat) {
  const map = {
    Tree: '#2d7a3a', Shrub: '#7a8a3a', Herb: '#6fb53a', Succulent: '#4ea895',
    Grass: '#d4a73a', Fern: '#2f6f72', Climber: '#7a5ab0', Conifer: '#3a6a9c',
  };
  return map[cat] || '#2d8a3e';
}

// ─── Add Species modal ────────────────────────────────────────────
function openAddSpeciesModal() {
  const form = el('form', { onsubmit: (e) => e.preventDefault() },
    field('Common Name', el('input', { name: 'Common Name', required: true, autofocus: true, autocomplete: 'off' })),
    field('Scientific Name', el('input', { name: 'Scientific Name', placeholder: 'e.g. Eucalyptus regnans', autocomplete: 'off' })),
    field('Species Category', selectFromConfig('Species Category', 'Species Categories')),
    field('Native Climate / Region', el('input', { name: 'Native Climate / Region', placeholder: 'e.g. cool temperate, montane', autocomplete: 'off' })),
    field('Natural Conditions', el('textarea', { name: 'Natural Conditions', placeholder: 'Temp range, rainfall, soil type…' })),
  );

  openModal('Add new species', form, async (close) => {
    const data = {};
    new FormData(form).forEach((v, k) => { data[k] = v; });
    if (!data['Common Name']) { toast('Common name required'); return; }
    try {
      const created = await api.createSpecies(data);
      State.species.unshift(Object.assign({}, created, { runCount: 0 }));
      toast(`Added ${created['Common Name']}`);
      close();
      Router.go('species', { speciesId: created['Species ID'] });
    } catch (err) {
      toast('Error: ' + err.message);
    }
  });
}

// ─── Add Run modal ────────────────────────────────────────────────
function openAddRunModal(speciesId) {
  const today = new Date().toISOString().slice(0, 10);

  const speciesField = speciesId ? null : field('Species',
    el('select', { name: 'Species ID', required: true },
      el('option', { value: '' }, 'Choose a species…'),
      ...State.species
        .slice()
        .sort((a, b) => (a['Common Name'] || '').localeCompare(b['Common Name'] || ''))
        .map(s => el('option', { value: s['Species ID'] },
          `${s['Common Name']}${s['Scientific Name'] ? ' — ' + s['Scientific Name'] : ''}`))
    )
  );

  const form = el('form', { onsubmit: (e) => e.preventDefault() },
    speciesField,
    field('Propagation Method', selectFromConfig('Propagation Method', 'Propagation Methods')),
    field('Phase', selectFromConfig('Phase', 'Phases')),
    field('Date Started', el('input', { type: 'date', name: 'Date Started', value: today })),
    field('Quantity Started', el('input', { type: 'number', name: 'Quantity Started', placeholder: 'How many?' })),
    field('Medium', selectFromConfig('Medium', 'Mediums')),
    field('Container', selectFromConfig('Container', 'Container Types')),
    field('Light Exposure', selectFromConfig('Light Exposure', 'Light Exposure')),
    field('Human Interventions', el('textarea', { name: 'Human Interventions', placeholder: 'Treatments, scarification, hormones, etc.' })),
  );

  openModal('Log new run', form, async (close) => {
    const data = { 'Status': 'In progress' };
    new FormData(form).forEach((v, k) => { data[k] = v; });
    if (speciesId) data['Species ID'] = speciesId;
    if (!data['Species ID']) { toast('Pick a species'); return; }
    try {
      const created = await api.createRun(data);
      toast(`Logged ${created['Run ID']}`);
      close();
      Router.go('run', { runId: created['Run ID'] });
    } catch (err) {
      toast('Error: ' + err.message);
    }
  });
}

function selectFromConfig(name, configKey, initialValue) {
  const ADD_NEW = '__add_new__';
  const select = el('select', { name },
    el('option', { value: '' }, '—'),
    ...(State.config[configKey] || []).map(c =>
      el('option', { value: c, selected: c === initialValue ? '' : null }, c)
    ),
    el('option', { value: ADD_NEW, class: 'add-new-opt' }, '＋ Add new…')
  );
  let lastValue = initialValue || '';
  select.addEventListener('change', async (e) => {
    if (e.target.value !== ADD_NEW) { lastValue = e.target.value; return; }
    const fresh = (prompt(`Add a new ${configKey.replace(/s$/, '').toLowerCase()}:`) || '').trim();
    if (!fresh) { e.target.value = lastValue; return; }
    if ((State.config[configKey] || []).includes(fresh)) {
      e.target.value = fresh;
      lastValue = fresh;
      return;
    }
    try {
      State.config = await api.addConfigValue(configKey, fresh);
      // Rebuild this select's options to include the new value
      const current = lastValue;
      while (select.options.length) select.remove(0);
      [
        el('option', { value: '' }, '—'),
        ...(State.config[configKey] || []).map(c => el('option', { value: c }, c)),
        el('option', { value: ADD_NEW, class: 'add-new-opt' }, '＋ Add new…')
      ].forEach(o => select.add(o));
      select.value = fresh;
      lastValue = fresh;
      toast(`Added "${fresh}" — saved to ${configKey}`);
    } catch (err) {
      toast('Error: ' + err.message);
      e.target.value = lastValue;
    }
  });
  return select;
}

// ─── Modal helper ─────────────────────────────────────────────────
function openModal(title, body, onSave) {
  const root = $('#modal-root');
  const close = () => { root.innerHTML = ''; document.body.style.overflow = ''; };
  document.body.style.overflow = 'hidden';

  const backdrop = el('div', { class: 'modal-backdrop',
    onclick: (e) => { if (e.target === backdrop) close(); }
  },
    el('div', { class: 'modal' },
      el('div', { class: 'modal-header' },
        el('div', { class: 'modal-handle' }),
        el('h2', {}, title)
      ),
      el('div', { class: 'modal-body' }, body),
      el('div', { class: 'modal-footer' },
        el('button', { class: 'btn-ghost', onclick: close }, 'Cancel'),
        el('button', { class: 'btn-primary', onclick: () => onSave(close) }, 'Save'),
      ),
    )
  );
  root.innerHTML = '';
  root.appendChild(backdrop);
}

function field(label, input) {
  return el('div', { class: 'field' }, el('label', {}, label), input);
}

// ─── Settings screen ─────────────────────────────────────────────
const PLANT_CONFIG_CATEGORIES = [
  { key: 'Species Categories', label: 'Species Categories', hint: 'Tree, Shrub, Herb, Fern… (these drive the per-category icons + colours)' },
  { key: 'Propagation Methods', label: 'Propagation Methods', hint: 'Seed, Cutting, Division, Layering, Grafting…' },
  { key: 'Phases', label: 'Phases', hint: 'Sourcing, Sown, Rooting, Hardening Off…' },
  { key: 'Statuses', label: 'Statuses', hint: 'In progress, Success, Failed, Closed…' },
  { key: 'Mediums', label: 'Mediums', hint: 'Perlite, Coir, Seed-raising mix…' },
  { key: 'Container Types', label: 'Container Types', hint: 'Tray, Tube, Pot, Propagator…' },
  { key: 'Light Exposure', label: 'Light Exposure', hint: 'Full Sun, Part Shade, Indoor…' },
  { key: 'Rainfall', label: 'Rainfall', hint: 'None, Light, Heavy…' },
];

const BREW_CONFIG_CATEGORIES = [
  { key: 'Site Types',          label: 'Site Types',          hint: 'Treated, Control — drives the colour-coding on site cards.' },
  { key: 'Crops',               label: 'Crops',               hint: 'Tomato, Lettuce, Pasture… add whatever he\'s testing on.' },
  { key: 'Soil Types',          label: 'Soil Types',          hint: 'Sandy loam, Clay, Loam…' },
  { key: 'Brew Statuses',       label: 'Brew Statuses',       hint: 'Brewing, Ready, In use, Expired, Archived…' },
  { key: 'Manure Types',        label: 'Manure Types',        hint: 'Horse, Cow, Chicken… or "None".' },
  { key: 'Manure States',       label: 'Manure States',       hint: 'Composted, Aged, Fresh — flagged in safety banners.' },
  { key: 'Application Methods', label: 'Application Methods', hint: 'Foliar, Soil drench, Fertigation, In-furrow…' },
];

const CONFIG_CATEGORIES_BY_MODE = {
  plant: PLANT_CONFIG_CATEGORIES,
  brew:  BREW_CONFIG_CATEGORIES,
};

// ─── Reports screen ─────────────────────────────────────────────────
function renderReports(root, reports) {
  root.innerHTML = '';

  root.appendChild(el('div', { class: 'settings-intro' },
    el('h2', { class: 'settings-title' }, 'Stats'),
    el('p', { class: 'settings-blurb' },
      'Strike rates roll up only from runs marked Success, Partial, Failed or Closed. Open runs (still in progress) are tracked in “Needs attention”.')
  ));

  // Totals strip
  root.appendChild(el('div', { class: 'stat-strip' },
    statTile(reports.totals.species, 'Species', 'sun'),
    statTile(reports.totals.runs, 'Total runs', 'cool'),
    statTile(reports.totals.closedRuns, 'Closed runs', 'alt'),
  ));

  // Needs attention
  if (reports.needsAttention && reports.needsAttention.length) {
    const section = el('section', { class: 'config-section attention-section' });
    section.appendChild(el('div', { class: 'config-section-head' },
      el('h3', { html: `Needs attention <span class="count-pill">${reports.needsAttention.length}</span>` }),
      el('p', { class: 'config-hint' }, 'Open runs that haven’t been touched in 30+ days. Tap to open.'),
    ));
    const list = el('div', { class: 'attention-list' });
    reports.needsAttention.forEach(r => {
      list.appendChild(el('button', {
        class: 'attention-row',
        onclick: () => Router.go('run', { runId: r['Run ID'] }),
      },
        el('div', { class: 'run-id' }, r['Run ID']),
        el('div', { class: 'attention-name' }, r.speciesName || '(unknown species)'),
        el('div', { class: 'run-meta' },
          r['Propagation Method'] ? el('span', { class: 'tag' }, r['Propagation Method']) : null,
          r['Phase'] ? el('span', { class: 'tag' }, r['Phase']) : null,
          r['Status'] ? el('span', { class: 'tag status-' + slug(r['Status']) }, r['Status']) : null,
        ),
      ));
    });
    section.appendChild(list);
    root.appendChild(section);
  }

  // Strike-rate sections
  root.appendChild(strikeSection('Strike rate by method',  reports.byMethod,  'Best methods get the longest bars.'));
  root.appendChild(strikeSection('Top species',            reports.bySpecies, 'Species with the most closed runs first.'));
  root.appendChild(strikeSection('By season',              reports.bySeason,  'Seasonal patterns across all closed runs.'));
}

function statTile(value, label, cls) {
  return el('div', { class: 'stat-tile ' + (cls || '') },
    el('div', { class: 'stat-value' }, String(value || 0)),
    el('div', { class: 'stat-label' }, label),
  );
}

function strikeSection(title, rows, hint) {
  const section = el('section', { class: 'config-section' });
  section.appendChild(el('div', { class: 'config-section-head' },
    el('h3', {}, title),
    hint ? el('p', { class: 'config-hint' }, hint) : null,
  ));
  if (!rows || rows.length === 0) {
    section.appendChild(el('p', { class: 'config-empty' }, 'Not enough closed runs yet — log some outcomes and they’ll show up here.'));
    return section;
  }
  const list = el('div', { class: 'bar-list' });
  rows.slice(0, 10).forEach(r => {
    const sr = (r.strikeRate == null) ? null : r.strikeRate;
    const display = sr == null ? '—' : `${sr}%`;
    const widthPct = sr == null ? 0 : Math.max(2, Math.min(100, sr));
    list.appendChild(el('div', { class: 'bar-row' },
      el('div', { class: 'bar-row-head' },
        el('span', { class: 'bar-label' }, r.key),
        el('span', { class: 'bar-value' }, display),
      ),
      el('div', { class: 'bar-track' },
        el('div', { class: 'bar-fill ' + strikeColor(sr), style: `width:${widthPct}%` }),
      ),
      el('div', { class: 'bar-meta' },
        `${r.total} run${r.total === 1 ? '' : 's'} · ${r.surviving}/${r.started} survived`,
      ),
    ));
  });
  section.appendChild(list);
  return section;
}

function strikeColor(sr) {
  if (sr == null) return 'sr-none';
  if (sr >= 70) return 'sr-high';
  if (sr >= 40) return 'sr-mid';
  return 'sr-low';
}

function makeRemovableChip(v, cat) {
  const chip = el('span', { class: 'config-chip' });
  const removeBtn = el('button', { class: 'chip-remove', 'aria-label': 'Remove ' + v, type: 'button' }, '×');
  const valueSpan = el('span', { class: 'chip-value' }, v);
  let armed = false;
  let timer = null;

  const disarm = () => {
    armed = false;
    chip.classList.remove('armed');
    removeBtn.textContent = '×';
    if (timer) { clearTimeout(timer); timer = null; }
  };

  removeBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!armed) {
      // First tap — arm it. Disarm any other armed chip first.
      $$('.config-chip.armed').forEach((c) => {
        c.classList.remove('armed');
        const b = c.querySelector('.chip-remove');
        if (b) b.textContent = '×';
      });
      armed = true;
      chip.classList.add('armed');
      removeBtn.textContent = 'DELETE?';
      timer = setTimeout(disarm, 4000);
      return;
    }
    // Second tap — confirm removal.
    if (timer) { clearTimeout(timer); timer = null; }
    try {
      State.config = await api.removeConfigValue(cat.key, v);
      renderSettings($('#screen'));
      toast(`Removed "${v}"`);
    } catch (err) {
      disarm();
      toast('Error: ' + err.message);
    }
  });

  // Tap the chip body (not the button) to disarm it.
  chip.addEventListener('click', (e) => {
    if (e.target.closest('.chip-remove')) return;
    if (armed) disarm();
  });

  chip.append(valueSpan, removeBtn);
  return chip;
}

function renderSettings(root) {
  root.innerHTML = '';
  const cats = CONFIG_CATEGORIES_BY_MODE[State.mode] || PLANT_CONFIG_CATEGORIES;

  root.appendChild(el('div', { class: 'settings-intro' },
    el('h2', { class: 'settings-title' }, currentMode().label + ' — Setup'),
    el('p', { class: 'settings-blurb' },
      'These are the values that appear in every dropdown across ' + currentMode().label + '. Add new ones, remove old ones — changes apply everywhere immediately.'),
    el('p', { class: 'settings-blurb', style: 'margin-top:6px;font-size:12px;opacity:0.7' },
      'Need to manage the other mode? Tap the brand to switch.'),
  ));

  cats.forEach(cat => {
    root.appendChild(renderConfigSection(cat));
  });
}

function renderConfigSection(cat) {
  const values = State.config[cat.key] || [];
  const section = el('section', { class: 'config-section' });

  section.appendChild(el('div', { class: 'config-section-head' },
    el('h3', {}, cat.label),
    el('p', { class: 'config-hint' }, cat.hint),
  ));

  const chips = el('div', { class: 'config-chips' });
  if (values.length === 0) {
    chips.appendChild(el('span', { class: 'config-empty' }, 'Nothing here yet — add one below.'));
  } else {
    values.forEach(v => {
      chips.appendChild(makeRemovableChip(v, cat));
    });
  }
  section.appendChild(chips);

  const addInput = el('input', {
    type: 'text',
    placeholder: `Add new ${cat.label.toLowerCase().replace(/s$/, '')}…`,
    autocomplete: 'off',
    onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); addBtn.click(); } }
  });
  const addBtn = el('button', { class: 'btn-primary', onclick: async () => {
    const v = addInput.value.trim();
    if (!v) return;
    if ((State.config[cat.key] || []).includes(v)) { toast('Already in the list'); return; }
    try {
      State.config = await api.addConfigValue(cat.key, v);
      renderSettings($('#screen'));
      toast(`Added "${v}"`);
    } catch (err) { toast('Error: ' + err.message); }
  }}, 'Add');

  section.appendChild(el('div', { class: 'config-add' }, addInput, addBtn));
  return section;
}

// ─── Brew Lab — Home dashboard ────────────────────────────────────
function renderBrewHome(root, reports) {
  root.innerHTML = '';

  root.appendChild(el('div', { class: 'settings-intro' },
    el('h2', { class: 'settings-title' }, 'Brew Lab'),
    el('p', { class: 'settings-blurb' },
      'R&D for liquid biofertiliser brews. Pick where to dive in:'),
  ));

  const tiles = el('div', { class: 'home-tiles' });
  tiles.appendChild(homeTile({
    label: 'Sites',
    sub: `${(reports.totals && reports.totals.sites) || 0} test ${reports.totals && reports.totals.sites === 1 ? 'site' : 'sites'}`,
    accent: 'tile-treated',
    iconHtml: siteIconSvg(),
    onClick: () => Router.go('sites'),
  }));
  tiles.appendChild(homeTile({
    label: 'Brews',
    sub: `${(reports.totals && reports.totals.brews) || 0} ${reports.totals && reports.totals.brews === 1 ? 'recipe' : 'recipes'}`,
    accent: 'tile-brew',
    iconHtml: brewIconSvg(),
    onClick: () => Router.go('brews'),
  }));
  tiles.appendChild(homeTile({
    label: 'Stats',
    sub: `${(reports.totals && reports.totals.observations) || 0} observations`,
    accent: 'tile-stats',
    iconHtml: '<svg viewBox="0 0 48 48" fill="currentColor"><rect x="8" y="28" width="6" height="14" rx="1"/><rect x="20" y="20" width="6" height="22" rx="1"/><rect x="32" y="12" width="6" height="30" rx="1"/></svg>',
    onClick: () => Router.go('brewstats'),
  }));
  tiles.appendChild(homeTile({
    label: 'Setup',
    sub: 'Manage dropdown lists',
    accent: 'tile-setup',
    iconHtml: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="5"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M9 9l4 4M35 35l4 4M9 39l4-4M35 13l4-4"/></svg>',
    onClick: () => Router.go('settings'),
  }));
  root.appendChild(tiles);

  // Quick recent activity
  const recent = el('div', { class: 'config-section' },
    el('div', { class: 'config-section-head' },
      el('h3', {}, 'Quick add'),
      el('p', { class: 'config-hint' }, 'Get straight into logging — these jump past the menus.'),
    ),
    el('div', { class: 'quick-row' },
      el('button', { class: 'btn-primary', onclick: () => openAddSiteModal() }, '＋ Add new site'),
      el('button', { class: 'btn', onclick: () => openAddBrewModal() }, '＋ Log new brew'),
    ),
  );
  root.appendChild(recent);
}

function homeTile({ label, sub, accent, iconHtml, onClick }) {
  return el('button', { class: 'home-tile ' + (accent || ''), onclick: onClick },
    el('div', { class: 'home-tile-icon', html: iconHtml }),
    el('div', { class: 'home-tile-label' }, label),
    el('div', { class: 'home-tile-sub' }, sub),
  );
}

// ─── Brew Lab — Sites grid ────────────────────────────────────────
function renderSitesGrid(root) {
  root.innerHTML = '';
  root.appendChild(el('div', { class: 'screen-header' },
    el('h2', { class: 'screen-title' }, 'Sites'),
    el('button', { class: 'btn-primary', onclick: () => openAddSiteModal() }, '＋ Add site'),
  ));
  const sticky = el('div', { class: 'sticky-bar sticky-bar-secondary' },
    el('div', { class: 'search' },
      el('span', { class: 'search-icon', html: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>` }),
      el('input', {
        type: 'search',
        placeholder: 'Search sites by name, owner, crop, soil…',
        value: State.filters.search,
        oninput: (e) => { State.filters.search = e.target.value; renderSiteCards(); }
      })
    ),
    el('div', { class: 'chip-row' },
      chip('All', !State.filters.category, () => { State.filters.category = ''; renderSitesGrid(root); }),
      chip('Treated', State.filters.category === 'Treated', () => { State.filters.category = State.filters.category === 'Treated' ? '' : 'Treated'; renderSitesGrid(root); }),
      chip('Control', State.filters.category === 'Control', () => { State.filters.category = State.filters.category === 'Control' ? '' : 'Control'; renderSitesGrid(root); }),
      ...((State.config['Crops'] || []).map(c =>
        chip(c, State.filters.category === c, () => {
          State.filters.category = State.filters.category === c ? '' : c;
          renderSitesGrid(root);
        })
      )),
    ),
  );
  root.appendChild(sticky);
  root.appendChild(el('div', { class: 'card-grid', id: 'card-grid' }));
  renderSiteCards();
}
function renderSiteCards() {
  const grid = $('#card-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const q = State.filters.search.trim().toLowerCase();
  const filterCat = State.filters.category;
  const filtered = State.sites.filter(s => {
    if (filterCat === 'Treated' || filterCat === 'Control') {
      if (s['Site Type'] !== filterCat) return false;
    } else if (filterCat) {
      if (s['Crop'] !== filterCat) return false;
    }
    if (!q) return true;
    const hay = [s['Name'], s['Owner / Farm'], s['Location'], s['Crop'], s['Soil Type'], s['Site Type'], s['Baseline Notes']]
      .filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  });
  if (filtered.length === 0) {
    grid.style.display = 'none';
    grid.parentElement.appendChild(emptyState(
      State.sites.length === 0 ? 'No sites yet' : 'Nothing matches',
      State.sites.length === 0 ? 'Tap the + below to add your first test site.' : 'Try a different search or filter.'
    ));
    return;
  }
  grid.style.display = '';
  filtered.forEach((s, i) => grid.appendChild(siteCard(s, i)));
}
function siteCard(s, idx = 0) {
  const isControl = s['Site Type'] === 'Control';
  const card = el('button', {
    class: 'species-card site-card ' + (isControl ? 'cat-control' : 'cat-treated'),
    onclick: () => Router.go('site', { siteId: s['Site ID'] }),
  },
    el('div', { class: 'card-banner site-banner' },
      el('div', { html: siteIconSvg() }),
      el('span', { class: 'site-type-badge' }, isControl ? 'CONTROL' : 'TREATED'),
    ),
    el('div', { class: 'card-body' },
      el('h3', { class: 'common-name' }, s['Name'] || '(unnamed site)'),
      el('p', { class: 'scientific-name' },
        [s['Owner / Farm'], s['Crop']].filter(Boolean).join(' · ')),
      el('div', { class: 'card-foot' },
        s['Crop'] ? el('span', { class: 'cat-tag' }, s['Crop']) : el('span'),
        s.applicationCount
          ? el('span', { class: 'run-count' }, `${s.applicationCount} APP${s.applicationCount > 1 ? 'S' : ''}`)
          : null,
      ),
    ),
  );
  card.style.animationDelay = `${Math.min(idx, 20) * 30}ms`;
  return card;
}
function siteIconSvg() {
  return `<svg viewBox="0 0 48 48" fill="currentColor"><path d="M24 6 L8 18 L8 42 L40 42 L40 18 Z"/><rect x="20" y="28" width="8" height="14"/></svg>`;
}

// ─── Brew Lab — Site detail ───────────────────────────────────────
function renderSiteDetail(root, site, applications, observations) {
  root.innerHTML = '';
  const isControl = site['Site Type'] === 'Control';

  const hero = el('div', { class: 'detail-hero ' + (isControl ? 'cat-control' : 'cat-treated') });
  hero.style.setProperty('--tint', isControl ? '#7a5ab0' : '#2d8a3e');
  hero.append(
    el('div', { class: 'hero-actions' },
      el('button', { class: 'hero-edit', onclick: () => openEditSiteModal(site) }, '✎ Edit'),
      makeArmedDeleteButton({
        confirmLabel: () => 'DELETE?',
        warn: () => `Delete ${site['Name'] || 'site'}? Existing applications and observations will become orphaned. Tap again to confirm.`,
        action: async () => {
          const result = await api.deleteSite(site['Site ID']);
          State.sites = State.sites.filter(s => s['Site ID'] !== site['Site ID']);
          let msg = `Deleted ${site['Name'] || site['Site ID']}`;
          if (result.orphanedApplications || result.orphanedObservations) {
            msg += ` — ${result.orphanedApplications + result.orphanedObservations} orphan record(s) left in sheet`;
          }
          toast(msg);
          Router.go('sites', {}, { reset: true });
        },
      }),
    ),
    el('div', { class: 'hero-icon', html: siteIconSvg() }),
    el('h2', {}, site['Name'] || '(unnamed site)'),
    site['Owner / Farm'] ? el('p', { class: 'sci' }, site['Owner / Farm']) : null,
    el('div', { class: 'badges' },
      el('span', { class: 'pill' }, isControl ? 'CONTROL' : 'TREATED'),
      site['Crop']      ? el('span', { class: 'pill' }, site['Crop']) : null,
      site['Soil Type'] ? el('span', { class: 'pill' }, site['Soil Type']) : null,
      site['Location']  ? el('span', { class: 'pill' }, site['Location']) : null,
    ),
    site['Baseline Notes']
      ? el('p', { class: 'hero-meta' }, el('strong', {}, 'Baseline: '), site['Baseline Notes'])
      : null,
  );
  root.appendChild(hero);

  // Applications
  root.appendChild(el('div', { class: 'section-header' },
    el('h3', { html: `Applications ${applications.length ? `<span class="count">${applications.length}</span>` : ''}` }),
    el('button', { class: 'btn-add-inline', 'data-action': 'add-application', 'data-site-id': site['Site ID'] }, '＋ Apply brew'),
  ));
  if (applications.length === 0) {
    root.appendChild(emptyState('No applications yet', 'Tap "Apply brew" to log the first one.'));
  } else {
    const grid = el('div', { class: 'run-grid' });
    applications.forEach(a => {
      const brew = State.brews.find(b => b['Brew ID'] === a['Brew ID']);
      grid.appendChild(applicationCard(a, brew));
    });
    root.appendChild(grid);
  }

  // Observations
  root.appendChild(el('div', { class: 'section-header' },
    el('h3', { html: `Observations ${observations.length ? `<span class="count">${observations.length}</span>` : ''}` }),
    el('button', { class: 'btn-add-inline', 'data-action': 'add-observation', 'data-site-id': site['Site ID'] }, '＋ Log observation'),
  ));
  if (observations.length === 0) {
    root.appendChild(emptyState('No observations yet', 'Take a reading and log it — photos welcome.'));
  } else {
    const list = el('div', { class: 'notes-list' });
    observations.forEach(o => list.appendChild(observationCard(o)));
    root.appendChild(list);
  }
}

function applicationCard(a, brew) {
  return el('div', { class: 'run-card', style: 'cursor:default' },
    el('div', { class: 'run-id' }, a['Application ID']),
    el('h4', { class: 'run-method' }, brew ? brew['Name'] || brew['Brew ID'] : (a['Brew ID'] || '(unknown brew)')),
    el('div', { class: 'run-meta' },
      a['Method'] ? el('span', { class: 'tag' }, a['Method']) : null,
      a['Date Applied'] ? el('span', { class: 'tag' }, fmtDate(a['Date Applied'])) : null,
      a['Volume Applied (L)'] ? el('span', { class: 'tag' }, a['Volume Applied (L)'] + ' L') : null,
      a['Dilution'] ? el('span', { class: 'tag' }, a['Dilution']) : null,
    ),
    a['Notes'] ? el('p', { class: 'note-body', style: 'margin-top:6px;font-size:12px' }, a['Notes']) : null,
  );
}
function observationCard(o) {
  const photos = parsePhotoUrls(o['Photo URLs']);
  return el('div', { class: 'note observation' },
    el('div', { class: 'note-date' },
      [fmtDate(o['Date']), o['Days Since Application'] ? `Day ${o['Days Since Application']}` : null]
        .filter(Boolean).join(' · ')),
    o['Plant Health 1-10']
      ? el('div', { class: 'health-bar' },
          el('span', {}, 'Plant health'),
          el('div', { class: 'health-meter' },
            el('div', { class: 'health-fill', style: `width:${(Number(o['Plant Health 1-10']) || 0) * 10}%` })
          ),
          el('strong', {}, o['Plant Health 1-10'] + '/10'),
        )
      : null,
    o['Growth']            ? el('p', { class: 'note-body' }, el('strong', {}, 'Growth: '), o['Growth']) : null,
    o['Disease Incidence'] ? el('p', { class: 'note-body' }, el('strong', {}, 'Disease: '), o['Disease Incidence']) : null,
    o['Yield']             ? el('p', { class: 'note-body' }, el('strong', {}, 'Yield: '), o['Yield']) : null,
    o['Notes']             ? el('p', { class: 'note-body' }, o['Notes']) : null,
    photos.length
      ? el('div', { class: 'photo-strip' },
          ...photos.map(url =>
            el('a', { href: url, target: '_blank', rel: 'noopener' },
              el('img', { src: url, alt: 'observation photo', loading: 'lazy' })
            )
          )
        )
      : null,
  );
}
function parsePhotoUrls(s) {
  if (!s) return [];
  return String(s).split(/[;\n]/).map(x => x.trim()).filter(Boolean);
}

// ─── Brew Lab — Brews grid + detail ───────────────────────────────
function renderBrewsGrid(root) {
  root.innerHTML = '';
  root.appendChild(el('div', { class: 'screen-header' },
    el('h2', { class: 'screen-title' }, 'Brews'),
    el('button', { class: 'btn-primary', onclick: () => openAddBrewModal() }, '＋ Log brew'),
  ));
  const sticky = el('div', { class: 'sticky-bar sticky-bar-secondary' },
    el('div', { class: 'search' },
      el('span', { class: 'search-icon', html: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>` }),
      el('input', {
        type: 'search',
        placeholder: 'Search brews by name, status, ingredient…',
        value: State.filters.search,
        oninput: (e) => { State.filters.search = e.target.value; renderBrewCards(); }
      })
    ),
    el('div', { class: 'chip-row' },
      chip('All', !State.filters.category, () => { State.filters.category = ''; renderBrewsGrid(root); }),
      ...(State.config['Brew Statuses'] || []).map(s =>
        chip(s, State.filters.category === s, () => {
          State.filters.category = State.filters.category === s ? '' : s;
          renderBrewsGrid(root);
        })
      ),
    ),
  );
  root.appendChild(sticky);
  root.appendChild(el('div', { class: 'card-grid', id: 'card-grid' }));
  renderBrewCards();
}
function renderBrewCards() {
  const grid = $('#card-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const q = State.filters.search.trim().toLowerCase();
  const cat = State.filters.category;
  const filtered = State.brews.filter(b => {
    if (cat && b['Status'] !== cat) return false;
    if (!q) return true;
    const hay = [b['Name'], b['Status'], b['Worm Cast Source'], b['Manure Type'], b['Manure State'], b['Fish Water Source'], b['Other Additives'], b['Notes']]
      .filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  });
  if (filtered.length === 0) {
    grid.style.display = 'none';
    grid.parentElement.appendChild(emptyState(
      State.brews.length === 0 ? 'No brews yet' : 'Nothing matches',
      State.brews.length === 0 ? 'Tap the + below to log your first brew.' : 'Try a different search or filter.'
    ));
    return;
  }
  grid.style.display = '';
  filtered.forEach((b, i) => grid.appendChild(brewCard(b, i)));
}
function brewCard(b, idx = 0) {
  const status = (b['Status'] || '').toLowerCase().replace(/\s+/g, '');
  const card = el('button', {
    class: 'species-card brew-card status-' + status,
    onclick: () => Router.go('brew', { brewId: b['Brew ID'] }),
  },
    el('div', { class: 'card-banner brew-banner' },
      el('div', { html: brewIconSvg() }),
    ),
    el('div', { class: 'card-body' },
      el('h3', { class: 'common-name' }, b['Name'] || b['Brew ID']),
      el('p', { class: 'scientific-name' }, b['Date Brewed'] ? fmtDate(b['Date Brewed']) : 'No date'),
      el('div', { class: 'card-foot' },
        b['Status'] ? el('span', { class: 'cat-tag' }, b['Status']) : el('span'),
        b.applicationCount
          ? el('span', { class: 'run-count' }, `${b.applicationCount} APP${b.applicationCount > 1 ? 'S' : ''}`)
          : null,
      ),
    ),
  );
  card.style.animationDelay = `${Math.min(idx, 20) * 30}ms`;
  return card;
}
function brewIconSvg() {
  return `<svg viewBox="0 0 48 48" fill="currentColor"><path d="M14 12h20l-2 28H16z"/><rect x="18" y="6" width="12" height="8" rx="2"/><path d="M16 22c4 2 8-2 12 0s8-2 12 0" stroke="rgba(0,0,0,0.2)" stroke-width="1.5" fill="none"/></svg>`;
}

function renderBrewDetail(root, brew, applications) {
  root.innerHTML = '';
  const tint = '#a85a3a';
  const hero = el('div', { class: 'detail-hero' });
  hero.style.setProperty('--tint', tint);
  hero.append(
    el('div', { class: 'hero-actions' },
      makeArmedDeleteButton({
        warn: () => `Delete brew ${brew['Name'] || brew['Brew ID']}? Existing applications using it will become orphaned. Tap again to confirm.`,
        action: async () => {
          const result = await api.deleteBrew(brew['Brew ID']);
          State.brews = State.brews.filter(b => b['Brew ID'] !== brew['Brew ID']);
          let msg = `Deleted ${brew['Name'] || brew['Brew ID']}`;
          if (result.orphanedApplications) {
            msg += ` — ${result.orphanedApplications} orphan record(s) left in sheet`;
          }
          toast(msg);
          Router.go('brews', {}, { reset: true });
        },
      }),
    ),
    el('div', { class: 'hero-icon', html: brewIconSvg() }),
    el('h2', {}, brew['Name'] || brew['Brew ID']),
    el('p', { class: 'sci' }, brew['Brew ID'] + (brew['Date Brewed'] ? ' · ' + fmtDate(brew['Date Brewed']) : '')),
    el('div', { class: 'badges' },
      brew['Status']        ? el('span', { class: 'pill' }, brew['Status']) : null,
      brew['Manure Type']   ? el('span', { class: 'pill' }, brew['Manure Type'] + (brew['Manure State'] ? ' (' + brew['Manure State'] + ')' : '')) : null,
      brew['Storage Days']  ? el('span', { class: 'pill' }, brew['Storage Days'] + 'd storage') : null,
    ),
  );
  root.appendChild(hero);

  // Recipe panel — editable
  const recipe = el('div', { class: 'run-detail' },
    el('h3', { style: 'margin:0 0 8px;font-family:var(--display)' }, 'Recipe & batch'),
    safetyBanners(brew),
  );

  const fields = [
    { key: 'Name',                type: 'text' },
    { key: 'Date Brewed',         type: 'date' },
    { key: 'Status',              type: 'select', config: 'Brew Statuses' },
    { key: 'Worm Cast Source',    type: 'text' },
    { key: 'Worm Cast Amount',    type: 'text', placeholder: 'e.g. 2 cups' },
    { key: 'Manure Type',         type: 'select', config: 'Manure Types' },
    { key: 'Manure State',        type: 'select', config: 'Manure States' },
    { key: 'Manure Amount',       type: 'text', placeholder: 'e.g. 1 cup' },
    { key: 'Fish Water Source',   type: 'text', placeholder: 'e.g. tank A' },
    { key: 'Fish Water Amount',   type: 'text', placeholder: 'e.g. 10 L' },
    { key: 'Molasses % v/v',      type: 'number', step: '0.01', placeholder: '0.2 max' },
    { key: 'Aeration Hours',      type: 'number' },
    { key: 'Storage Days',        type: 'number' },
    { key: 'DO mg/L',             type: 'number', step: '0.1' },
    { key: 'pH',                  type: 'number', step: '0.1' },
    { key: 'Use-By Date',         type: 'date' },
  ];
  const inputs = {};
  const grid = el('div', { class: 'field-grid' });
  fields.forEach(f => {
    let input;
    if (f.type === 'select') {
      input = el('select', { name: f.key },
        el('option', { value: '' }, '—'),
        ...(State.config[f.config] || []).map(v =>
          el('option', { value: v, selected: brew[f.key] === v ? '' : null }, v)
        )
      );
    } else if (f.type === 'date') {
      const d = brew[f.key] ? new Date(brew[f.key]) : null;
      const v = d && !isNaN(d) ? d.toISOString().slice(0, 10) : '';
      input = el('input', { type: 'date', name: f.key, value: v });
    } else {
      const attrs = { type: f.type, name: f.key, value: brew[f.key] || '' };
      if (f.step) attrs.step = f.step;
      if (f.placeholder) attrs.placeholder = f.placeholder;
      input = el('input', attrs);
    }
    inputs[f.key] = input;
    grid.appendChild(el('div', { class: 'field' }, el('label', {}, f.key), input));
  });
  const additives = el('input', { type: 'text', name: 'Other Additives', value: brew['Other Additives'] || '' });
  const smell    = el('input', { type: 'text', name: 'Smell / Colour', value: brew['Smell / Colour'] || '' });
  const notes    = el('textarea', { name: 'Notes' }, brew['Notes'] || '');
  inputs['Other Additives'] = additives;
  inputs['Smell / Colour']  = smell;
  inputs['Notes'] = notes;

  recipe.appendChild(grid);
  recipe.appendChild(el('div', { class: 'field' }, el('label', {}, 'Other additives'), additives));
  recipe.appendChild(el('div', { class: 'field' }, el('label', {}, 'Smell / colour'), smell));
  recipe.appendChild(el('div', { class: 'field' }, el('label', {}, 'Notes'), notes));

  recipe.appendChild(el('div', { class: 'run-action-row' },
    el('button', { class: 'btn-primary', onclick: async () => {
      const data = {};
      Object.keys(inputs).forEach(k => { data[k] = inputs[k].value; });
      try {
        await api.updateBrew(brew['Brew ID'], data);
        toast('Saved');
        Router.go('brew', { brewId: brew['Brew ID'] }, { push: false });
      } catch (err) { toast('Error: ' + err.message); }
    }}, 'Save changes'),
  ));
  root.appendChild(recipe);

  // Application history
  root.appendChild(el('div', { class: 'section-header' },
    el('h3', { html: `Applied to ${applications.length ? `<span class="count">${applications.length}</span>` : ''}` }),
  ));
  if (applications.length === 0) {
    root.appendChild(emptyState('Not yet applied', 'Open a site and tap "Apply brew" to start.'));
  } else {
    const grid = el('div', { class: 'run-grid' });
    applications.forEach(a => {
      const site = State.sites.find(s => s['Site ID'] === a['Site ID']);
      grid.appendChild(el('button', {
        class: 'run-card',
        onclick: () => site ? Router.go('site', { siteId: site['Site ID'] }) : null,
      },
        el('div', { class: 'run-id' }, a['Application ID']),
        el('h4', { class: 'run-method' }, site ? site['Name'] : a['Site ID']),
        el('div', { class: 'run-meta' },
          a['Method']         ? el('span', { class: 'tag' }, a['Method']) : null,
          a['Date Applied']   ? el('span', { class: 'tag' }, fmtDate(a['Date Applied'])) : null,
          site && site['Site Type'] ? el('span', { class: 'tag' }, site['Site Type']) : null,
        ),
      ));
    });
    root.appendChild(grid);
  }
}

function safetyBanners(brew) {
  const warnings = [];
  const mol = parseFloat(brew['Molasses % v/v']);
  if (!isNaN(mol) && mol > 0.2) warnings.push(`Molasses ${mol}% — above the 0.2% pathogen-regrowth threshold. Add microbial testing or reduce.`);
  const doVal = parseFloat(brew['DO mg/L']);
  if (!isNaN(doVal) && doVal < 6) warnings.push(`DO ${doVal} mg/L — below the 6 mg/L target for aerobic brewing.`);
  const storage = parseFloat(brew['Storage Days']);
  if (!isNaN(storage) && storage > 7) warnings.push(`Storage ${storage} days — biology has likely shifted anaerobic; treat as a different product to what was brewed.`);
  if (brew['Manure State'] === 'Fresh') warnings.push(`Fresh manure — increased pathogen / weed-seed risk. Avoid edible-crop sites without composting first.`);
  if (warnings.length === 0) return null;
  return el('div', { class: 'safety-banners' },
    ...warnings.map(w => el('div', { class: 'safety-banner' },
      el('span', { class: 'sb-icon' }, '⚠'),
      el('span', {}, w),
    ))
  );
}

// ─── Brew Lab — Stats ─────────────────────────────────────────────
function renderBrewStats(root, reports) {
  root.innerHTML = '';
  root.appendChild(el('div', { class: 'settings-intro' },
    el('h2', { class: 'settings-title' }, 'Brew Lab Stats'),
    el('p', { class: 'settings-blurb' }, 'Quick rollup of how the trial is going. More breakdowns will appear as observations build up.'),
  ));

  root.appendChild(el('div', { class: 'stat-strip' },
    statTile(reports.totals.sites, 'Sites', 'sun'),
    statTile(reports.totals.brews, 'Brews', 'cool'),
    statTile(reports.totals.applications, 'Applications', 'alt'),
  ));
  root.appendChild(el('div', { class: 'stat-strip', style: 'grid-template-columns:1fr' },
    statTile(reports.totals.observations, 'Observations logged', '')
  ));

  // Treated vs control
  const tvc = reports.treatedVsControl || { treated: {}, control: {} };
  const section = el('section', { class: 'config-section' },
    el('div', { class: 'config-section-head' },
      el('h3', {}, 'Treated vs Control'),
      el('p', { class: 'config-hint' }, 'Average plant health on the most recent observation per site, by site type.'),
    ),
    el('div', { class: 'tvc-grid' },
      el('div', { class: 'tvc-card treated' },
        el('div', { class: 'tvc-label' }, 'Treated'),
        el('div', { class: 'tvc-value' }, tvc.treated.avgHealth != null ? tvc.treated.avgHealth + '/10' : '—'),
        el('div', { class: 'tvc-meta' }, (tvc.treated.count || 0) + ' sites'),
      ),
      el('div', { class: 'tvc-card control' },
        el('div', { class: 'tvc-label' }, 'Control'),
        el('div', { class: 'tvc-value' }, tvc.control.avgHealth != null ? tvc.control.avgHealth + '/10' : '—'),
        el('div', { class: 'tvc-meta' }, (tvc.control.count || 0) + ' sites'),
      ),
    ),
  );
  root.appendChild(section);

  if (reports.expiringBrews && reports.expiringBrews.length) {
    const exp = el('section', { class: 'config-section attention-section' },
      el('div', { class: 'config-section-head' },
        el('h3', { html: `Brews past use-by <span class="count-pill">${reports.expiringBrews.length}</span>` }),
        el('p', { class: 'config-hint' }, 'Tap to mark expired or archive.'),
      ),
      el('div', { class: 'attention-list' },
        ...reports.expiringBrews.map(b => el('button', {
          class: 'attention-row',
          onclick: () => Router.go('brew', { brewId: b['Brew ID'] }),
        },
          el('div', { class: 'run-id' }, b['Brew ID']),
          el('div', { class: 'attention-name' }, b['Name'] || '(unnamed brew)'),
          el('div', { class: 'run-meta' },
            b['Status'] ? el('span', { class: 'tag' }, b['Status']) : null,
            b['Use-By Date'] ? el('span', { class: 'tag' }, 'Use-by ' + fmtDate(b['Use-By Date'])) : null,
          ),
        ))
      )
    );
    root.appendChild(exp);
  }
}

// ─── Brew Lab — FAB action sheet ──────────────────────────────────
function openBrewFabSheet() {
  const { name, params } = State.current;
  const actions = [];

  actions.push({
    label: 'Add new site', sub: 'Where you’re testing brews',
    icon: '🏡', cls: '',
    onClick: () => openAddSiteModal(),
  });
  actions.push({
    label: 'Log new brew', sub: 'Recipe + batch info',
    icon: '🫙', cls: 'alt',
    onClick: () => openAddBrewModal(),
  });

  if (name === 'site' && params.siteId) {
    actions.unshift({
      label: 'Log observation', sub: 'Plant health + photos',
      icon: '✎', cls: 'cool',
      onClick: () => openAddObservationModal(params.siteId),
    });
    actions.unshift({
      label: 'Apply brew', sub: 'Record an application on this site',
      icon: '💧', cls: 'alt',
      onClick: () => openAddApplicationModal(params.siteId, null),
    });
  }
  if (name === 'brew' && params.brewId) {
    actions.unshift({
      label: 'Apply brew to site', sub: 'Pick a site and record application',
      icon: '💧', cls: 'alt',
      onClick: () => openAddApplicationModal(null, params.brewId),
    });
  }

  showActionSheet(actions);
}

// ─── Brew Lab — Modals ────────────────────────────────────────────
function openAddSiteModal() {
  const form = el('form', { onsubmit: (e) => e.preventDefault() },
    field('Site name', el('input', { name: 'Name', required: true, autofocus: true, autocomplete: 'off', placeholder: 'e.g. Harvey’s back paddock' })),
    field('Owner / farm', el('input', { name: 'Owner / Farm', placeholder: 'Whose farm is it?', autocomplete: 'off' })),
    field('Location', el('input', { name: 'Location', placeholder: 'Town / GPS / paddock id', autocomplete: 'off' })),
    field('Crop', selectFromConfig('Crop', 'Crops')),
    field('Soil type', selectFromConfig('Soil Type', 'Soil Types')),
    field('Site type', selectFromConfig('Site Type', 'Site Types')),
    field('Baseline notes', el('textarea', { name: 'Baseline Notes', placeholder: 'Soil tests, prior treatments, what you’re measuring against…' })),
  );
  openModal('Add new site', form, async (close) => {
    const data = {};
    new FormData(form).forEach((v, k) => { data[k] = v; });
    if (!data['Name']) { toast('Name required'); return; }
    try {
      const created = await api.createSite(data);
      State.sites.unshift(Object.assign({}, created, { applicationCount: 0, observationCount: 0 }));
      toast(`Added ${created['Name']}`);
      close();
      Router.go('site', { siteId: created['Site ID'] });
    } catch (err) { toast('Error: ' + err.message); }
  });
}

// Two-tap delete button. First tap arms it (red, "DELETE?"), second tap confirms.
// Auto-disarms after 4 seconds.
function makeArmedDeleteButton({ warn, action, label = '🗑 Delete', confirmLabel = () => 'TAP AGAIN' }) {
  const btn = el('button', { class: 'hero-delete', type: 'button' }, label);
  let armed = false;
  let timer = null;
  const disarm = () => {
    armed = false;
    btn.classList.remove('armed');
    btn.textContent = label;
    if (timer) { clearTimeout(timer); timer = null; }
  };
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!armed) {
      armed = true;
      btn.classList.add('armed');
      btn.textContent = confirmLabel();
      if (warn) toast(warn());
      timer = setTimeout(disarm, 4000);
      return;
    }
    if (timer) { clearTimeout(timer); timer = null; }
    btn.disabled = true;
    btn.textContent = '…';
    try { await action(); }
    catch (err) { toast('Error: ' + err.message); disarm(); btn.disabled = false; }
  });
  return btn;
}

function openEditSiteModal(site) {
  const form = el('form', { onsubmit: (e) => e.preventDefault() },
    field('Site name', el('input', { name: 'Name', required: true, value: site['Name'] || '', autocomplete: 'off' })),
    field('Owner / farm', el('input', { name: 'Owner / Farm', value: site['Owner / Farm'] || '', autocomplete: 'off' })),
    field('Location', el('input', { name: 'Location', value: site['Location'] || '', autocomplete: 'off' })),
    field('Crop', selectFromConfig('Crop', 'Crops', site['Crop'])),
    field('Soil type', selectFromConfig('Soil Type', 'Soil Types', site['Soil Type'])),
    field('Site type', selectFromConfig('Site Type', 'Site Types', site['Site Type'])),
    field('Baseline notes', el('textarea', { name: 'Baseline Notes' }, site['Baseline Notes'] || '')),
  );
  openModal('Edit site', form, async (close) => {
    const data = {};
    new FormData(form).forEach((v, k) => { data[k] = v; });
    if (!data['Name']) { toast('Name required'); return; }
    try {
      await api.updateSite(site['Site ID'], data);
      toast('Saved');
      close();
      Router.go('site', { siteId: site['Site ID'] }, { push: false });
    } catch (err) { toast('Error: ' + err.message); }
  });
}

function openAddBrewModal() {
  const today = new Date().toISOString().slice(0, 10);
  const form = el('form', { onsubmit: (e) => e.preventDefault() },
    field('Brew name', el('input', { name: 'Name', required: true, autofocus: true, autocomplete: 'off', placeholder: 'e.g. Brew 01 — molasses-free' })),
    field('Date brewed', el('input', { type: 'date', name: 'Date Brewed', value: today })),
    field('Worm cast source', el('input', { name: 'Worm Cast Source', placeholder: 'e.g. Jake’s home worms' })),
    field('Worm cast amount', el('input', { name: 'Worm Cast Amount', placeholder: 'e.g. 2 cups' })),
    field('Manure type', selectFromConfig('Manure Type', 'Manure Types')),
    field('Manure state', selectFromConfig('Manure State', 'Manure States')),
    field('Manure amount', el('input', { name: 'Manure Amount', placeholder: 'e.g. 1 cup' })),
    field('Fish water source', el('input', { name: 'Fish Water Source', placeholder: 'e.g. aquarium A' })),
    field('Fish water amount', el('input', { name: 'Fish Water Amount', placeholder: 'e.g. 10 L' })),
    field('Molasses % v/v (≤ 0.2 ideal)', el('input', { type: 'number', step: '0.01', name: 'Molasses % v/v', placeholder: '0 for none' })),
    field('Aeration hours', el('input', { type: 'number', name: 'Aeration Hours', placeholder: '24 typical' })),
    field('Storage days before use', el('input', { type: 'number', name: 'Storage Days', placeholder: '0 = use straight away' })),
    field('Notes', el('textarea', { name: 'Notes', placeholder: 'Anything worth remembering for next batch…' })),
  );
  openModal('Log new brew', form, async (close) => {
    const data = { 'Status': 'Brewing' };
    new FormData(form).forEach((v, k) => { data[k] = v; });
    if (!data['Name']) { toast('Name required'); return; }
    try {
      const created = await api.createBrew(data);
      State.brews.unshift(Object.assign({}, created, { applicationCount: 0 }));
      toast(`Logged ${created['Brew ID']}`);
      close();
      Router.go('brew', { brewId: created['Brew ID'] });
    } catch (err) { toast('Error: ' + err.message); }
  });
}

function openAddApplicationModal(siteId, brewId) {
  const today = new Date().toISOString().slice(0, 10);
  const siteField = siteId ? null : field('Site',
    el('select', { name: 'Site ID', required: true },
      el('option', { value: '' }, 'Pick a site…'),
      ...State.sites.slice().sort((a, b) => (a['Name'] || '').localeCompare(b['Name'] || ''))
        .map(s => el('option', { value: s['Site ID'] }, `${s['Name'] || s['Site ID']}${s['Site Type'] ? ' · ' + s['Site Type'] : ''}`))
    )
  );
  const brewField = brewId ? null : field('Brew',
    el('select', { name: 'Brew ID', required: true },
      el('option', { value: '' }, 'Pick a brew…'),
      ...State.brews.slice().sort((a, b) => (a['Name'] || '').localeCompare(b['Name'] || ''))
        .map(b => el('option', { value: b['Brew ID'] }, `${b['Name'] || b['Brew ID']}${b['Status'] ? ' · ' + b['Status'] : ''}`))
    )
  );
  const form = el('form', { onsubmit: (e) => e.preventDefault() },
    siteField,
    brewField,
    field('Method', selectFromConfig('Method', 'Application Methods')),
    field('Date applied', el('input', { type: 'date', name: 'Date Applied', value: today })),
    field('Dilution', el('input', { name: 'Dilution', placeholder: 'e.g. 1:10' })),
    field('Volume applied (L)', el('input', { type: 'number', step: '0.1', name: 'Volume Applied (L)' })),
    field('Area treated (m²)', el('input', { type: 'number', step: '0.1', name: 'Area Treated (m²)' })),
    field('Weather', el('input', { name: 'Weather', placeholder: 'Sunny / overcast / mm rain etc.' })),
    field('Notes', el('textarea', { name: 'Notes', placeholder: 'Anything worth knowing about the application' })),
  );
  openModal('Apply brew', form, async (close) => {
    const data = {};
    new FormData(form).forEach((v, k) => { data[k] = v; });
    if (siteId) data['Site ID'] = siteId;
    if (brewId) data['Brew ID'] = brewId;
    if (!data['Site ID']) { toast('Pick a site'); return; }
    if (!data['Brew ID']) { toast('Pick a brew'); return; }
    try {
      const created = await api.createApplication(data);
      toast(`Logged ${created['Application ID']}`);
      close();
      // Refresh whichever screen we came from
      if (State.current.name === 'site') Router.go('site', { siteId: data['Site ID'] }, { push: false });
      else if (State.current.name === 'brew') Router.go('brew', { brewId: data['Brew ID'] }, { push: false });
      else Router.go('site', { siteId: data['Site ID'] });
    } catch (err) { toast('Error: ' + err.message); }
  });
}

function openAddObservationModal(siteId) {
  const today = new Date().toISOString().slice(0, 10);
  const photoState = { urls: [] };

  const photoInput = el('input', {
    type: 'file', accept: 'image/*', capture: 'environment', multiple: true,
    style: 'display:none',
    onchange: async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      uploadingMsg.style.display = '';
      for (const file of files) {
        try {
          const resized = await resizeImage(file, 1280);
          const result = await api.uploadBrewPhoto({
            filename: file.name,
            base64: resized.base64,
            mimeType: 'image/jpeg',
            siteId,
          });
          photoState.urls.push(result.url);
          photoStrip.appendChild(el('div', { class: 'photo-thumb' },
            el('img', { src: result.url }),
          ));
          toast('Photo uploaded');
        } catch (err) { toast('Photo error: ' + err.message); }
      }
      uploadingMsg.style.display = 'none';
      e.target.value = '';
    },
  });
  const photoStrip = el('div', { class: 'photo-strip' });
  const uploadingMsg = el('div', { class: 'photo-uploading', style: 'display:none' }, 'Uploading…');

  const form = el('form', { onsubmit: (e) => e.preventDefault() },
    field('Date', el('input', { type: 'date', name: 'Date', value: today })),
    field('Days since last application', el('input', { type: 'number', name: 'Days Since Application', placeholder: 'optional' })),
    field('Plant health 1–10', el('input', { type: 'number', min: '1', max: '10', name: 'Plant Health 1-10', placeholder: '1 = poor, 10 = thriving' })),
    field('Growth notes', el('input', { name: 'Growth', placeholder: 'Height, vigour, leaf colour…' })),
    field('Disease incidence', el('input', { name: 'Disease Incidence', placeholder: 'Any disease/pest signs?' })),
    field('Yield', el('input', { name: 'Yield', placeholder: 'If harvested — kg, count, etc.' })),
    field('Soil mineral N (if measured)', el('input', { name: 'Soil Mineral N' })),
    field('Soil available P (if measured)', el('input', { name: 'Soil Available P' })),
    field('Soil microbial (if measured)', el('input', { name: 'Soil Microbial' })),
    field('Notes', el('textarea', { name: 'Notes' })),
    el('div', { class: 'field' },
      el('label', {}, 'Photos'),
      el('button', {
        type: 'button',
        class: 'btn',
        onclick: () => photoInput.click(),
      }, '📷 Take or pick photos'),
      uploadingMsg,
      photoStrip,
      photoInput,
    ),
  );

  openModal('Log observation', form, async (close) => {
    const data = { 'Site ID': siteId };
    new FormData(form).forEach((v, k) => { data[k] = v; });
    if (photoState.urls.length) data['Photo URLs'] = photoState.urls.join(';');
    try {
      const created = await api.createObservation(data);
      toast(`Logged ${created['Observation ID']}`);
      close();
      Router.go('site', { siteId }, { push: false });
    } catch (err) { toast('Error: ' + err.message); }
  });
}

// Resize an image File client-side and return base64 (no data URI prefix).
function resizeImage(file, maxDim) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    reader.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, width: w, height: h });
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Boot ─────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  if (window.API_CONFIG && window.API_CONFIG.USE_MOCK) {
    document.body.insertBefore(
      el('div', { class: 'mock-banner' }, 'Preview mode — sample data'),
      document.body.firstChild
    );
  }
  applyMode();
  Router.go(currentMode().home, {}, { push: false });
});
