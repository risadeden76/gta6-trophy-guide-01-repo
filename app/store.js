// Progress store: earned trophies and per-trophy counters, saved in localStorage, exportable and importable.
export const STORAGE_KEY = 'leonida-platinum-progress-v1';

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { earned: [], counters: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { earned: [], counters: {} };
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned.filter((n) => typeof n === 'string') : [],
      counters: parsed.counters && typeof parsed.counters === 'object' ? parsed.counters : {},
    };
  } catch {
    return { earned: [], counters: {} };
  }
}

export function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function exportProgress(progress) {
  const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gta6-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(url);
}

export async function importProgressFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('Not a progress file');
  return {
    earned: Array.isArray(parsed.earned) ? parsed.earned.filter((n) => typeof n === 'string') : [],
    counters: parsed.counters && typeof parsed.counters === 'object' ? parsed.counters : {},
  };
}

export function earnedCount(progress, trophies) {
  const names = new Set(trophies.map((t) => t.name));
  return progress.earned.filter((n) => names.has(n)).length;
}

export function progressPercent(progress, trophies) {
  if (!trophies.length) return 0;
  return Math.round((earnedCount(progress, trophies) / trophies.length) * 100);
}
