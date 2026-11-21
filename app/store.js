// The progress store: which trophies are earned and how far each counting
// trophy has come. It lives in localStorage so the tracker works offline,
// and it can be exported to a file and imported back.
export const STORAGE_KEY = 'leonida-platinum-progress-v1';

function cleanProgress(parsed) {
  if (!parsed || typeof parsed !== 'object') return { earned: [], counters: {} };
  return {
    earned: Array.isArray(parsed.earned) ? parsed.earned.filter((name) => typeof name === 'string') : [],
    counters: parsed.counters && typeof parsed.counters === 'object' ? parsed.counters : {},
  };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { earned: [], counters: {} };
    return cleanProgress(JSON.parse(raw));
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
  return cleanProgress(parsed);
}

export function earnedCount(progress, trophies) {
  const known = new Set(trophies.map((t) => t.name));
  return progress.earned.filter((name) => known.has(name)).length;
}

export function progressPercent(progress, trophies) {
  if (!trophies.length) return 0;
  return Math.round((earnedCount(progress, trophies) / trophies.length) * 100);
}
