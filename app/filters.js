// Checklist filters: kind, grade, search text and hide-earned, plus the
// spoiler rule. Kinds the brief asks for: story, missable, collectibles,
// activities, online. The official list has no online trophies, so the online
// filter correctly matches none.
export const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
};

export function trophyMatchesKind(trophy, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return trophy.missable === true;
  if (kind === 'online') return false;
  return trophy.kind === kind;
}

export function trophyMatchesSearch(trophy, query) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  return trophy.name.toLowerCase().includes(q) || trophy.description.toLowerCase().includes(q);
}

export function filterTrophies(trophies, state, earnedSet) {
  return trophies.filter((t) => {
    if (!trophyMatchesKind(t, state.kind)) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (!trophyMatchesSearch(t, state.query)) return false;
    if (state.hideEarned && earnedSet.has(t.name)) return false;
    return true;
  });
}

// Spoiler rule: with the spoiler setting on, story trophies stay hidden
// (name and description masked) until they are earned.
export function isSpoilerHidden(trophy, spoilerOn, earnedSet) {
  return spoilerOn && trophy.kind === 'story' && !earnedSet.has(trophy.name);
}

export function spoilerLabel(trophy) {
  return `Hidden story trophy — earn “${trophy.name}” to reveal it`;
}
