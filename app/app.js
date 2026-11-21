// Leonida Platinum boot: loads app/data/trophies.json, renders the checklist,
// the Next up planner, the roadmap, the missables page and the guide detail
// pane, and wires the tracker.
import { loadProgress, saveProgress, exportProgress, importProgressFile, earnedCount, progressPercent } from './store.js';
import { filterTrophies, isSpoilerHidden, spoilerLabel } from './filters.js';
import { ROADMAP_STAGES, missableTrophies, missableReason, stageForTrophy, stageProgress, nextUpList } from './roadmap.js';

const DATA_URL = 'data/trophies.json';
const rowsEl = document.getElementById('rows');
const plannerEl = document.getElementById('planner');
const plannerCountEl = document.getElementById('plannerCount');
const detailEl = document.getElementById('detail');
const listCountEl = document.getElementById('listCount');
const onlineNoteEl = document.getElementById('onlineNote');
const progressTextEl = document.getElementById('progressText');
const progressDetailEl = document.getElementById('progressDetail');
const progressFillEl = document.getElementById('progressFill');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const hideEarnedEl = document.getElementById('hideEarned');
const spoilerEl = document.getElementById('spoiler');

const state = { view: 'checklist', kind: 'all', grade: 'all', query: '', hideEarned: false, spoiler: false, selected: null };
let trophies = [];
let progress = loadProgress();

function earnedSet() {
  return new Set(progress.earned);
}

function saveAndRender() {
  saveProgress(progress);
  renderProgress();
  renderList();
  renderPlanner();
  renderRoadmap();
  renderMissables();
  if (state.selected) renderDetail(state.selected);
}

function renderProgress() {
  const earned = earnedCount(progress, trophies);
  const total = trophies.length;
  const pct = progressPercent(progress, trophies);
  progressTextEl.textContent = `${earned} of ${total} earned`;
  progressDetailEl.textContent = `Platinum: ${pct}% — ${total - earned} to go`;
  progressFillEl.style.width = `${pct}%`;
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function groupLabel(group) {
  if (group === 'missable') return 'Missable first';
  if (group === 'current') return 'Current stage';
  return 'Later';
}

function trophyRow(trophy) {
  const li = document.createElement('li');
  li.className = 'trophy' + (earnedSet().has(trophy.name) ? ' earned' : '') + (state.selected === trophy.name ? ' selected' : '');
  const hidden = isSpoilerHidden(trophy, state.spoiler, earnedSet());
  if (hidden) li.classList.add('spoiler-hidden');

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earnedSet().has(trophy.name);
  box.setAttribute('aria-label', `Mark ${trophy.name} earned`);
  box.addEventListener('change', (event) => {
    event.stopPropagation();
    toggleEarned(trophy.name, box.checked);
  });
  box.addEventListener('click', (event) => event.stopPropagation());

  const main = document.createElement('div');
  const name = document.createElement('div');
  name.className = 'trophy-name';
  name.textContent = hidden ? 'Hidden story trophy' : trophy.name;
  const desc = document.createElement('div');
  desc.className = 'trophy-desc';
  desc.textContent = hidden ? spoilerLabel(trophy) : trophy.description;
  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  const gradePill = document.createElement('span');
  gradePill.className = `pill grade-${trophy.grade}`;
  gradePill.textContent = gradeLabel(trophy.grade);
  meta.append(gradePill);
  if (trophy.missable) {
    const miss = document.createElement('span');
    miss.className = 'pill missable';
    miss.textContent = 'Missable';
    meta.append(miss);
  }
  if (trophy.count) {
    const count = document.createElement('span');
    count.className = 'pill count';
    count.textContent = `${trophy.count.toLocaleString('en-US')} ${trophy.countLabel ?? ''}`.trim();
    meta.append(count);
  }
  const stage = stageForTrophy(trophy);
  if (stage) {
    const stagePill = document.createElement('span');
    stagePill.className = 'pill';
    stagePill.textContent = `Roadmap stage ${stage.stage}`;
    meta.append(stagePill);
  }
  main.append(name, desc, meta);

  const gradeSide = document.createElement('div');
  gradeSide.className = 'trophy-grade';
  gradeSide.textContent = hidden ? '???' : gradeLabel(trophy.grade);

  li.append(box, main, gradeSide);
  li.addEventListener('click', () => selectTrophy(trophy.name));
  return li;
}

function selectTrophy(name) {
  state.selected = name;
  renderList();
  renderPlanner();
  renderMissables();
  renderDetail(name);
  detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderList() {
  const filtered = filterTrophies(trophies, state, earnedSet());
  rowsEl.replaceChildren(...filtered.map(trophyRow));
  const earned = earnedCount(progress, trophies);
  listCountEl.textContent = filtered.length === trophies.length
    ? `Showing all ${trophies.length} trophies — ${earned} earned. Click a trophy to read its guide.`
    : `Showing ${filtered.length} of ${trophies.length} trophies — ${earned} earned.`;
  onlineNoteEl.hidden = state.kind !== 'online';
}

function renderPlanner() {
  const entries = nextUpList(trophies, earnedSet());
  const earned = earnedCount(progress, trophies);
  plannerCountEl.textContent = entries.length === 0
    ? 'All 55 trophies earned — the platinum is yours.'
    : `${entries.length} to go — ${earned} earned. Missables first, then your current stage, then the rest in stage order.`;
  if (entries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'planner-empty';
    empty.textContent = 'Nothing left to plan — every trophy is earned.';
    plannerEl.replaceChildren(empty);
    return;
  }
  plannerEl.replaceChildren(...entries.map((entry, index) => {
    const trophy = entry.trophy;
    const li = document.createElement('li');
    li.className = `planner-item group-${entry.group}` + (state.selected === trophy.name ? ' selected' : '');
    const hidden = isSpoilerHidden(trophy, state.spoiler, earnedSet());
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earnedSet().has(trophy.name);
    box.setAttribute('aria-label', `Mark ${trophy.name} earned`);
    box.addEventListener('change', (event) => {
      event.stopPropagation();
      toggleEarned(trophy.name, box.checked);
    });
    box.addEventListener('click', (event) => event.stopPropagation());
    const rank = document.createElement('span');
    rank.className = 'planner-rank';
    rank.textContent = String(index + 1);
    const main = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'planner-name';
    name.textContent = hidden ? 'Hidden story trophy' : trophy.name;
    const why = document.createElement('div');
    why.className = 'planner-why';
    why.textContent = hidden ? spoilerLabel(trophy) : `${entry.reason} — ${trophy.description}`;
    main.append(name, why);
    const group = document.createElement('span');
    group.className = 'planner-group';
    group.textContent = groupLabel(entry.group);
    li.append(box, rank, main, group);
    li.addEventListener('click', () => selectTrophy(trophy.name));
    return li;
  }));
}

function renderMissables() {
  const list = document.getElementById('missableRows');
  list.replaceChildren(...missableTrophies(trophies).map(trophyRow));
}

function renderRoadmap() {
  const list = document.getElementById('roadmap');
  list.replaceChildren(...ROADMAP_STAGES.map((stage) => {
    const done = stageProgress(stage, trophies, earnedSet());
    const li = document.createElement('li');
    li.className = 'stage' + (done.earned === done.total ? ' done' : '');
    const title = document.createElement('h3');
    title.className = 'stage-title';
    title.textContent = stage.title;
    const progressLine = document.createElement('div');
    progressLine.className = 'stage-progress';
    const counts = document.createElement('span');
    counts.textContent = `${done.earned} of ${done.total} earned`;
    const pct = document.createElement('span');
    pct.textContent = `${done.pct}%`;
    progressLine.append(counts, pct);
    const bar = document.createElement('div');
    bar.className = 'stage-bar';
    const fill = document.createElement('div');
    fill.style.width = `${done.pct}%`;
    bar.append(fill);
    const text = document.createElement('p');
    text.textContent = stage.text;
    const ul = document.createElement('ul');
    for (const name of stage.trophies) {
      const trophy = trophies.find((t) => t.name === name);
      const item = document.createElement('li');
      const earned = trophy && earnedSet().has(name);
      item.textContent = `${earned ? '✓ ' : ''}${name}${trophy && trophy.missable ? ' — Missable' : ''}${trophy && trophy.count ? ` (${trophy.count.toLocaleString('en-US')} ${trophy.countLabel ?? ''})`.trim() : ''}`;
      ul.append(item);
    }
    li.append(title, progressLine, bar, text, ul);
    return li;
  }));
}

function renderDetail(name) {
  const trophy = trophies.find((t) => t.name === name);
  if (!trophy) return;
  const hidden = isSpoilerHidden(trophy, state.spoiler, earnedSet());
  detailEl.replaceChildren();
  const title = document.createElement('h2');
  title.textContent = hidden ? 'Hidden story trophy' : trophy.name;
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = hidden
    ? 'Turn the spoiler setting off, or earn this trophy, to reveal its official name and description.'
    : `Official: “${trophy.description}” — ${gradeLabel(trophy.grade)}`;
  detailEl.append(title, official);

  const earnedLine = document.createElement('p');
  earnedLine.className = 'earned-state';
  earnedLine.textContent = earnedSet().has(trophy.name) ? '✓ Earned — ticked in your checklist.' : 'Not earned yet.';
  detailEl.append(earnedLine);

  if (trophy.missable) {
    const warn = document.createElement('p');
    warn.className = 'missable-warning';
    warn.textContent = `Missable — ${missableReason(trophy)}`;
    detailEl.append(warn);
  }

  if (!hidden) {
    const guideTitle = document.createElement('h3');
    guideTitle.textContent = 'Guide';
    const guide = document.createElement('p');
    guide.textContent = trophy.guide;
    detailEl.append(guideTitle, guide);

    if (trophy.steps && trophy.steps.length) {
      const stepsTitle = document.createElement('h3');
      stepsTitle.textContent = 'Steps';
      const steps = document.createElement('ol');
      for (const step of trophy.steps) {
        const li = document.createElement('li');
        li.textContent = step;
        steps.append(li);
      }
      detailEl.append(stepsTitle, steps);
    }

    if (trophy.count) {
      const counterTitle = document.createElement('h3');
      counterTitle.textContent = 'Your count';
      const counter = document.createElement('div');
      counter.className = 'counter';
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = String(trophy.count);
      input.value = String(progress.counters[trophy.name] ?? 0);
      input.setAttribute('aria-label', `Your progress toward ${trophy.count}`);
      input.addEventListener('change', () => {
        const value = Math.max(0, Math.min(trophy.count, Number(input.value) || 0));
        progress.counters[trophy.name] = value;
        if (value >= trophy.count && !earnedSet().has(trophy.name)) {
          progress.earned.push(trophy.name);
        }
        saveAndRender();
      });
      const target = document.createElement('span');
      target.textContent = `of ${trophy.count.toLocaleString('en-US')} ${trophy.countLabel ?? ''}`.trim();
      counter.append(input, target);
      detailEl.append(counterTitle, counter);
    }

    const sourcesTitle = document.createElement('h3');
    sourcesTitle.textContent = 'Sources';
    const sources = document.createElement('p');
    sources.className = 'sources';
    sources.textContent = 'Official name, description and grade: the official list on Exophase, cross-checked with PSNProfiles. Guide: our own words from the official description, not yet checked in-game. ';
    const exophase = document.createElement('a');
    exophase.href = 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/';
    exophase.textContent = 'Exophase — official trophy list';
    const sep = document.createTextNode(' · ');
    const psn = document.createElement('a');
    psn.href = 'https://psnprofiles.com/trophies/43531-grand-theft-auto-vi';
    psn.textContent = 'PSNProfiles — trophy list & targets';
    sources.append(exophase, sep, psn);
    detailEl.append(sourcesTitle, sources);
  }
}

function toggleEarned(name, checked) {
  if (checked) {
    if (!progress.earned.includes(name)) progress.earned.push(name);
  } else {
    progress.earned = progress.earned.filter((n) => n !== name);
  }
  saveAndRender();
}

function switchView(view) {
  state.view = view;
  for (const button of document.querySelectorAll('.tab')) {
    button.classList.toggle('active', button.dataset.view === view);
  }
  document.getElementById('view-checklist').hidden = view !== 'checklist';
  document.getElementById('view-planner').hidden = view !== 'planner';
  document.getElementById('view-roadmap').hidden = view !== 'roadmap';
  document.getElementById('view-missables').hidden = view !== 'missables';
  document.querySelector('.controls').style.display = view === 'checklist' || view === 'missables' ? '' : 'none';
}

async function boot() {
  const response = await fetch(DATA_URL);
  const data = await response.json();
  trophies = data.trophies;
  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => switchView(button.dataset.view));
  });
  searchEl.addEventListener('input', () => { state.query = searchEl.value; renderList(); });
  kindEl.addEventListener('change', () => { state.kind = kindEl.value; renderList(); });
  gradeEl.addEventListener('change', () => { state.grade = gradeEl.value; renderList(); });
  hideEarnedEl.addEventListener('change', () => { state.hideEarned = hideEarnedEl.checked; renderList(); });
  spoilerEl.addEventListener('change', () => {
    state.spoiler = spoilerEl.checked;
    renderList();
    renderPlanner();
    renderMissables();
    if (state.selected) renderDetail(state.selected);
  });
  document.getElementById('export').addEventListener('click', () => exportProgress(progress));
  document.getElementById('import').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      progress = await importProgressFile(file);
      saveAndRender();
    } catch {
      alert('That file is not a valid progress export.');
    }
    event.target.value = '';
  });
  document.getElementById('reset').addEventListener('click', () => {
    if (!confirm('Clear all earned trophies and counters?')) return;
    progress = { earned: [], counters: {} };
    state.selected = null;
    detailEl.replaceChildren();
    const empty = document.createElement('p');
    empty.className = 'detail-empty';
    empty.textContent = 'Select a trophy on the left to read its guide, steps and sources.';
    detailEl.append(empty);
    saveAndRender();
  });
  renderProgress();
  renderList();
  renderPlanner();
  renderRoadmap();
  renderMissables();
}

boot();
