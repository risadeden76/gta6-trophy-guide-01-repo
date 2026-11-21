// Roadmap and missables, built from the official descriptions alone:
// which story chapters and missions, which collectibles and counts, in what order.
// The planner in app.js reads the same stages to say what to do next.
export const ROADMAP_STAGES = [
  {
    stage: 1,
    title: 'Stage 1 — Play the story',
    text: 'Chapters 1–4, the named story missions and the final mission. Nothing here is missable: finishing the story earns every trophy in this stage.',
    trophies: ['Just Like Paradise', 'Paradise Lost', 'T**s Ass Drug Money', 'Vice City, Baby!', 'Top Of The World, Ma', 'You Gotta Know When to Get Off', 'Trust', 'Break the Bank', 'Family Matters', 'DWNFALL', 'Hi-Jacked', 'Snow Storm'],
  },
  {
    stage: 2,
    title: 'Stage 2 — Friends, strangers & side strands',
    text: 'Finish the mission strands for Andy, Kenton, Billy, Randy and Tyrone, complete 8 stranger strands across Leonida, and hunt Bret’s unique animal. Do these as they unlock — they are the story’s side content.',
    trophies: ['Road to Rehabilitation', 'This Was No Boat Accident', 'The Lone Rider', 'Supply & Demand', 'Spin On This!', 'Strangers & Freaks', 'Fair Game'],
  },
  {
    stage: 3,
    title: 'Stage 3 — Collect & count',
    text: 'The counting trophies: 42 Shooting Range golds, 3 card sets, 100 WAiNK spots, 100 vehicles, 52 areas of Leonida, 18 meditation spots and all 8 garages. Pick these up as you travel; mop up the rest with the map at the end.',
    trophies: ['The Shootist', "Don't Touch My Deck", 'You WAiNKer!', 'Whip It Good', 'The Goodtime State', 'Positive Mental Attitude', 'Little Boxes'],
  },
  {
    stage: 4,
    title: 'Stage 4 — Activities & challenges',
    text: 'Try every activity type once, then work the counts: 250 stunts, 14 drone-race locations, 20 different race wins, 50 challenges, plus fishing, the arcade and bowling.',
    trophies: ['Master of None', 'Cunning Stunts', 'Top Fun', 'Earn Cash, Not Kudos', 'One Last Thing', 'Baited My Tackle', 'Stick Fiddler', 'Let’s Go Bowling', 'Ten Pin'],
  },
  {
    stage: 5,
    title: 'Stage 5 — Money, mayhem & 100%',
    text: 'The endgame: launder $250,000 of marked bills, spend $100,000, rob the vaults, trucks and gang operations, try the 7 missable moments, then reach 100% completion — and the platinum pops.',
    trophies: ['Dime on the Dollar', 'Treat Yo Self', 'Maximum Withdrawal', 'A Classic Blitz Play', 'Pest Control', 'Hot Together', 'Retail Therapy', 'Catch Me If You Can', 'Sneakthief', 'Personal Best', 'Bad Luck, I Guess', 'The Truth Is Out There', 'In The Beginning…', 'Capital Offense', 'Actions Speak Louder', 'Challenging Tank', 'Gunslinger', 'On the Spot', 'A Long Road', 'Vice Got a Price!'],
  },
];

export function stageForTrophy(trophy) {
  return ROADMAP_STAGES.find((s) => s.trophies.includes(trophy.name)) ?? null;
}

export function missableTrophies(trophies) {
  return trophies.filter((t) => t.missable === true);
}

export function missableReason(trophy) {
  if (trophy.name === 'Hot Together' || trophy.name === 'Retail Therapy') {
    return 'Needs your partner beside you — attempt it while partner sections last.';
  }
  if (trophy.name === 'Catch Me If You Can') {
    return 'Tied to one spot, VCIA — try it on your first airport visit.';
  }
  if (trophy.name === 'Sneakthief') {
    return 'One clean attempt: being detected fails it, so plan before you go in.';
  }
  if (trophy.name === 'Personal Best') {
    return 'Tied to a single public partnership moment in the story.';
  }
  if (trophy.name === 'Bad Luck, I Guess') {
    return 'A single retry: fail once, then succeed at the same thing right away.';
  }
  if (trophy.name === 'The Truth Is Out There') {
    return 'A one-off strange event — it may not repeat, so watch for it while exploring.';
  }
  return 'Tied to a single moment in the game — try it when the moment comes.';
}

// How far a stage is: earned of its trophies, as a whole percent.
export function stageProgress(stage, trophies, earnedSet) {
  const names = stage.trophies.filter((name) => trophies.some((t) => t.name === name));
  const total = names.length;
  const earned = names.filter((name) => earnedSet.has(name)).length;
  return { earned, total, pct: total ? Math.round((earned / total) * 100) : 0 };
}

// The first stage that still has unearned trophies — where the player is now.
export function currentStage(trophies, earnedSet) {
  return ROADMAP_STAGES.find((stage) => stageProgress(stage, trophies, earnedSet).earned < stageProgress(stage, trophies, earnedSet).total) ?? null;
}

// Next up: what to do now, in order. Missables first (they can be lost), then
// the trophies of the current roadmap stage, then everything else in stage order.
// Each entry carries its trophy, why it is next, and which group it came from.
export function nextUpList(trophies, earnedSet) {
  const unearned = trophies.filter((t) => !earnedSet.has(t.name));
  const current = currentStage(trophies, earnedSet);
  const entries = [];
  const seen = new Set();
  const push = (trophy, reason, group) => {
    if (seen.has(trophy.name)) return;
    seen.add(trophy.name);
    entries.push({ trophy, reason, group });
  };
  for (const trophy of unearned.filter((t) => t.missable)) {
    push(trophy, `Missable — ${missableReason(trophy)}`, 'missable');
  }
  if (current) {
    for (const name of current.trophies) {
      const trophy = unearned.find((t) => t.name === name);
      if (trophy) push(trophy, `Current stage — ${current.title}`, 'current');
    }
  }
  for (const stage of ROADMAP_STAGES) {
    for (const name of stage.trophies) {
      const trophy = unearned.find((t) => t.name === name);
      if (trophy) push(trophy, stage.title, 'upcoming');
    }
  }
  for (const trophy of unearned) {
    const stage = stageForTrophy(trophy);
    push(trophy, stage ? stage.title : 'No roadmap stage', 'upcoming');
  }
  return entries;
}
