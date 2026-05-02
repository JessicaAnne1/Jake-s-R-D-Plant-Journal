// ─── State ──────────────────────────────────────────────────────────
const State = {
  config: null,
  species: [],
  filters: { search: '', category: '' },
  history: [],     // navigation stack: [{ name, params }]
  current: { name: 'grid', params: {} },
};

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
    else      { Router.go('grid', {}, { reset: true }); }
  },
};

function render() {
  const { name, params } = State.current;
  const screen = $('#screen');
  screen.innerHTML = '<div class="loading">Loading…</div>';

  $$('.nav-btn[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
  $('.back-btn').hidden = (name === 'grid' && State.history.length === 0);

  if      (name === 'grid')          Screens.grid(screen);
  else if (name === 'species')       Screens.speciesDetail(screen, params.speciesId);
  else if (name === 'run')           Screens.runDetail(screen, params.runId);
  else if (name === 'reports')       Screens.placeholder(screen, 'Stats', 'Strike rates and reports — coming next.');
  else if (name === 'settings')      Screens.settings(screen);
}

document.addEventListener('click', (e) => {
  const navBtn = e.target.closest('[data-nav]');
  if (navBtn) { Router.go(navBtn.dataset.nav, {}, { reset: true }); return; }
  const action = e.target.closest('[data-action]');
  if (action) {
    const a = action.dataset.action;
    if (a === 'back') Router.back();
    else if (a === 'add-species') openFabSheet();
    else if (a === 'add-species-direct') openAddSpeciesModal();
    else if (a === 'add-run') openAddRunModal(action.dataset.speciesId);
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

function selectFromConfig(name, configKey) {
  const ADD_NEW = '__add_new__';
  const select = el('select', { name },
    el('option', { value: '' }, '—'),
    ...(State.config[configKey] || []).map(c => el('option', { value: c }, c)),
    el('option', { value: ADD_NEW, class: 'add-new-opt' }, '＋ Add new…')
  );
  let lastValue = '';
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
const CONFIG_CATEGORIES = [
  { key: 'Species Categories', label: 'Species Categories', hint: 'Tree, Shrub, Herb, Fern… (these drive the per-category icons + colours)' },
  { key: 'Propagation Methods', label: 'Propagation Methods', hint: 'Seed, Cutting, Division, Layering, Grafting…' },
  { key: 'Phases', label: 'Phases', hint: 'Sourcing, Sown, Rooting, Hardening Off…' },
  { key: 'Statuses', label: 'Statuses', hint: 'In progress, Success, Failed, Closed…' },
  { key: 'Mediums', label: 'Mediums', hint: 'Perlite, Coir, Seed-raising mix…' },
  { key: 'Container Types', label: 'Container Types', hint: 'Tray, Tube, Pot, Propagator…' },
  { key: 'Light Exposure', label: 'Light Exposure', hint: 'Full Sun, Part Shade, Indoor…' },
  { key: 'Rainfall', label: 'Rainfall', hint: 'None, Light, Heavy…' },
];

function renderSettings(root) {
  root.innerHTML = '';

  root.appendChild(el('div', { class: 'settings-intro' },
    el('h2', { class: 'settings-title' }, 'Dropdown Lists'),
    el('p', { class: 'settings-blurb' },
      'These are the values that appear in every dropdown across the app. Add new ones, remove old ones — changes apply everywhere immediately.')
  ));

  CONFIG_CATEGORIES.forEach(cat => {
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
      chips.appendChild(el('span', { class: 'config-chip' },
        el('span', {}, v),
        el('button', {
          class: 'chip-remove',
          'aria-label': 'Remove ' + v,
          onclick: async () => {
            if (!confirm(`Remove "${v}" from ${cat.label}?\n\nExisting records that already use this value will keep it — but it won't appear in dropdowns anymore.`)) return;
            try {
              State.config = await api.removeConfigValue(cat.key, v);
              renderSettings($('#screen'));
              toast(`Removed "${v}"`);
            } catch (err) { toast('Error: ' + err.message); }
          }
        }, '×')
      ));
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

// ─── Boot ─────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  if (window.API_CONFIG && window.API_CONFIG.USE_MOCK) {
    document.body.insertBefore(
      el('div', { class: 'mock-banner' }, 'Preview mode — sample data'),
      document.body.firstChild
    );
  }
  Router.go('grid', {}, { push: false });
});
