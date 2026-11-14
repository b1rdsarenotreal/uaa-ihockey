// Generated Top-N poll (15 by default; Settings changes the size). A fixed
// panel of 23 voters fills out ballots. Every voter starts from the same
// picture, built the way the CFB dynasty's poll is: team strength (power
// ratings from game scores, starting from OFF/PIT/DEF) blended with a
// season-long résumé (every win, worth more against strong teams; every
// loss, costing less against strong teams), with the résumé counting more
// as games are played. Each voter then
// leans a little according to a built-in personality: some trust talent,
// some trust numbers, some punish bad losses, some watch one conference
// closely. The leans are small, so the poll stays close to a consensus.
// Each week also counts on its own: what the week's results did to a
// résumé, and head to head (a ranked team that beats a ranked team a few
// spots above it goes above it).
// The 23 built-in personalities live here in the code. The commissioner can
// add more voters, each with a random personality (stored in the season's
// settings, so they carry into later seasons), remove added voters, and
// edit any published poll.

import { rng, normal, hashStr, clamp } from './util.js?v=20261113221327';
import { records, rpi, rating, indexName, usesNpi, isFinal, winnerOf, isTie } from './standings.js?v=20261113221327';

export const DEFAULT_POLL_SIZE = 15;
export const POLL_SIZES = [10, 15, 20, 25];
export const pollSizeOf = season => season?.settings?.pollSize ?? DEFAULT_POLL_SIZE;

// talent:  >0 keeps trusting rosters longer, <0 moves to the résumé sooner
// rpi:     share of the résumé from RPI (the rest is win-loss record)
// sos:     extra credit for a tough schedule
// loyalty: how much last week's ranking carries over (1 = consensus)
// recency: reaction to this week's results
// losses:  penalty for losing to teams outside last week's poll
// region:  the conference (by position in the league) this voter covers, with a small boost
// noise:   how much this voter's ballot wanders week to week
const P = (o) => ({ talent: 0, rpi: 0.5, sos: 0, loyalty: 1, recency: 0, losses: 0, region: null, regionBoost: 0, noise: 0.1, ...o });
export const VOTER_PANEL = [
  { id: 'v1', name: 'Hank Dobbins', outlet: 'Plains Ledger', style: 'Old school. Trusts proven programs and is slow to move teams.', ...P({ talent: 0.25, loyalty: 1.35, noise: 0.08 }) },
  { id: 'v2', name: 'Priya Raman', outlet: 'Pitchside Analytics', style: 'Numbers first. Leans on the NPI and strength of schedule.', ...P({ talent: -0.2, rpi: 0.75, sos: 0.14, loyalty: 0.85 }) },
  { id: 'v3', name: 'Marcus Bell', outlet: 'Gulf Coast Gazette', style: 'Regional voter. Gives the {conf} a little extra credit.', ...P({ region: 0, regionBoost: 0.09 }) },
  { id: 'v4', name: 'Lena Kowalski', outlet: 'Great Lakes Sports Radio', style: 'Regional voter. Watches the {conf} closely.', ...P({ region: 1, regionBoost: 0.08 }) },
  { id: 'v5', name: 'Tom Whitfield', outlet: 'Desert Sun', style: 'Regional voter. Sees a lot of the {conf}.', ...P({ region: 2, regionBoost: 0.08 }) },
  { id: 'v6', name: 'Carla Mendes', outlet: 'National Wire', style: 'Middle of the road. Her ballot tracks the consensus.', ...P({ noise: 0.05 }) },
  { id: 'v7', name: 'Jake Orr', outlet: 'Grandstand Report', style: 'Reacts to last week. Big weeks move teams up fast.', ...P({ recency: 0.2, loyalty: 0.7, noise: 0.12 }) },
  { id: 'v8', name: 'Dana Pruitt', outlet: 'Heartland Herald', style: 'Punishes bad losses.', ...P({ losses: 0.12 }) },
  { id: 'v9', name: 'Russ Kemper', outlet: 'The Crease Daily', style: 'Win-loss record above all.', ...P({ talent: -0.15, rpi: 0.25 }) },
  { id: 'v10', name: 'Mei Chen', outlet: 'Pacific Sports Journal', style: 'Rewards teams that play tough schedules.', ...P({ sos: 0.15, rpi: 0.6 }) },
  { id: 'v11', name: 'Gil Navarro', outlet: 'Faceoff Insider', style: 'Talent evaluator. Ranks the best rosters, records aside.', ...P({ talent: 0.3, loyalty: 1.1 }) },
  { id: 'v12', name: 'Beth Abernathy', outlet: 'Mountain West Times', style: 'Steady. Rarely moves a team more than a spot or two.', ...P({ loyalty: 1.4, noise: 0.06 }) },
  { id: 'v13', name: 'Omar Haddad', outlet: 'Riverfront Press', style: 'Wildcard. His ballot is the hardest to predict.', ...P({ noise: 0.2 }) },
  { id: 'v14', name: 'Sully Grant', outlet: 'Fast Break Podcast', style: 'Likes hot teams. Streaks and big weeks count.', ...P({ recency: 0.15, loyalty: 0.85 }) },
  { id: 'v15', name: 'Nora Lindqvist', outlet: 'North Star Tribune', style: 'Balanced and careful. Close to the consensus.', ...P({ noise: 0.07 }) },
  { id: 'v16', name: 'Pete Varga', outlet: 'Lakeshore Courier', style: 'Regional voter. Gives the {conf} the benefit of the doubt.', ...P({ region: 3, regionBoost: 0.09 }) },
  { id: 'v17', name: 'Alicia Brooks', outlet: 'Box Score Weekly', style: 'Leans on the NPI more than most.', ...P({ talent: -0.1, rpi: 0.68 }) },
  { id: 'v18', name: 'Ray Thibodeaux', outlet: 'Bayou Sports', style: 'Old school, and hard on teams that lose to unranked opponents.', ...P({ talent: 0.15, losses: 0.1, loyalty: 1.15 }) },
  { id: 'v19', name: 'Kim Sato', outlet: 'Hockey Today', style: 'Consensus voter. Rarely far from the field.', ...P({ noise: 0.05 }) },
  { id: 'v20', name: 'Walt Hensley', outlet: 'Valley Voice', style: 'Loyal to his preseason picks.', ...P({ talent: 0.2, loyalty: 1.3 }) },
  { id: 'v21', name: 'Jess Moreno', outlet: 'Southwest Sports Network', style: 'Résumé voter. Moves to results early in the season.', ...P({ talent: -0.25, rpi: 0.45 }) },
  { id: 'v22', name: 'Dev Patel', outlet: 'Ratings Lab', style: 'Schedule strength and the NPI, with little attention to preseason hype.', ...P({ talent: -0.15, rpi: 0.7, sos: 0.12 }) },
  { id: 'v23', name: 'Frank Lacey', outlet: 'Coastal Chronicle', style: 'Regional voter. Keeps a close eye on the {conf}.', ...P({ region: 4, regionBoost: 0.08 }) },
];
export const VOTERS = VOTER_PANEL.length;

// The whole panel for a season: the built-in voters plus any added ones.
export function votersOf(season) {
  return [...VOTER_PANEL, ...(season?.settings?.extraVoters || [])];
}

// ---------- added voters with a random personality ----------
const FIRST = ['Avery', 'Bo', 'Cal', 'Dee', 'Eli', 'Fran', 'Gus', 'Hollis', 'Ines', 'Jo', 'Kip', 'Lou', 'Mack', 'Nell', 'Otis', 'Pia', 'Quinn', 'Rory', 'Sal', 'Tess', 'Uma', 'Vic', 'Wade', 'Xavi', 'Yara', 'Zeke', 'Bianca', 'Cody', 'Darnell', 'Elena', 'Felix', 'Greta', 'Hector', 'Isla', 'Jonah', 'Keiko', 'Luis', 'Maeve', 'Nico', 'Odette', 'Pedro', 'Rosa', 'Silas', 'Tamsin', 'Vera', 'Wes'];
const LAST = ['Abbott', 'Barrera', 'Castillo', 'Delaney', 'Ellison', 'Fontaine', 'Gallagher', 'Holloway', 'Ibarra', 'Jansen', 'Kaplan', 'Lockhart', 'Maddox', 'Nakamura', 'Okafor', 'Pruett', 'Quintero', 'Ramsey', 'Sandoval', 'Tolliver', 'Underwood', 'Valdez', 'Whitaker', 'Yates', 'Zamora', 'Brennan', 'Cardenas', 'Dorsey', 'Escobar', 'Farrow', 'Greer', 'Hartley', 'Iverson', 'Keane', 'Lindgren', 'Marsh', 'Novak', 'Ortega', 'Pierce', 'Rhodes', 'Stroud', 'Thorne', 'Voss', 'Wilder'];
const OUTLETS = ['Bleacher Bulletin', 'Blue Line Media', 'Box Seat Digest', 'Power Play Radio', 'Five-Hole Daily', 'Top Shelf Blog', 'Sudden Death News', 'Penalty Box Report', 'County Courier', 'Metro Sports Desk', 'Sunday Sports Page', 'Prairie Press', 'Harbor Herald', 'Capital Sports Wire', 'Upper Deck Journal', 'The Scorecard', 'Zamboni Network', 'Between the Pipes Podcast', 'Ridgeline Register', 'Tri-County Times'];
// Personality types; each new voter gets one, with its numbers nudged a little.
const ARCHETYPES = [
  { style: 'Old school. Trusts proven programs and is slow to move teams.', p: { talent: 0.25, loyalty: 1.3, noise: 0.08 } },
  { style: 'Numbers first. Leans on the NPI and strength of schedule.', p: { talent: -0.2, rpi: 0.72, sos: 0.13, loyalty: 0.85 } },
  { style: 'Regional voter. Gives the {conf} a little extra credit.', p: { regionBoost: 0.08 }, region: true },
  { style: 'Consensus voter. Rarely far from the field.', p: { noise: 0.05 } },
  { style: 'Reacts to last week. Big weeks move teams up fast.', p: { recency: 0.18, loyalty: 0.75, noise: 0.12 } },
  { style: 'Punishes bad losses.', p: { losses: 0.12 } },
  { style: 'Win-loss record above all.', p: { talent: -0.15, rpi: 0.25 } },
  { style: 'Rewards teams that play tough schedules.', p: { sos: 0.15, rpi: 0.6 } },
  { style: 'Talent evaluator. Ranks the best rosters, records aside.', p: { talent: 0.3, loyalty: 1.1 } },
  { style: 'Steady. Rarely moves a team more than a spot or two.', p: { loyalty: 1.4, noise: 0.06 } },
  { style: 'Wildcard. Their ballot is the hardest to predict.', p: { noise: 0.2 } },
  { style: 'Likes hot teams. Streaks and big weeks count.', p: { recency: 0.14, loyalty: 0.85 } },
  { style: 'Résumé voter. Moves to results early in the season.', p: { talent: -0.25, rpi: 0.45 } },
];
// A new voter with a random name, outlet and personality, added to the
// season's panel. Returns the voter.
export function addRandomVoter(season, random = Math.random) {
  season.settings.extraVoters ||= [];
  const panel = votersOf(season);
  const pick = a => a[Math.floor(random() * a.length)];
  let name = '';
  for (let i = 0; i < 50 && (!name || panel.some(v => v.name === name)); i++) name = `${pick(FIRST)} ${pick(LAST)}`;
  const a = pick(ARCHETYPES);
  const jig = (x, d) => Math.round((x + (random() - 0.5) * d) * 1000) / 1000;
  const base = P(a.p);
  const p = { talent: jig(base.talent, 0.1), rpi: clamp(jig(base.rpi, 0.1), 0.2, 0.8), sos: Math.max(0, jig(base.sos, 0.04)), loyalty: clamp(jig(base.loyalty, 0.15), 0.6, 1.5),
    recency: Math.max(0, jig(base.recency, 0.05)), losses: Math.max(0, jig(base.losses, 0.04)), regionBoost: a.region ? clamp(jig(base.regionBoost, 0.03), 0.05, 0.11) : 0,
    region: a.region ? Math.floor(random() * 12) : null, noise: clamp(jig(base.noise, 0.04), 0.04, 0.22) };
  const used = new Set(panel.map(v => v.id));
  let n = season.settings.extraVoters.length + 1;
  while (used.has(`x${n}`)) n++;
  const outlets = OUTLETS.filter(o => !panel.some(v => v.outlet === o));
  const v = { id: `x${n}`, name, outlet: pick(outlets.length ? outlets : OUTLETS), style: a.style, added: true, ...p };
  season.settings.extraVoters.push(v);
  return v;
}
export function removeVoter(season, id) {
  season.settings.extraVoters = (season.settings.extraVoters || []).filter(v => v.id !== id);
}

// The conference a regional voter covers this season (by position, so it
// still works after conferences are renamed or added).
export function voterConference(season, v) {
  if (v.region == null) return null;
  const confs = [...new Set(Object.values(season.teams).map(t => t.conference))].sort();
  return confs.length ? confs[v.region % confs.length] : null;
}
export function voterStyle(season, v) {
  return v.style.replace('{conf}', voterConference(season, v) || 'their region');
}

function zmap(obj) {
  const v = Object.values(obj), n = v.length || 1;
  const m = v.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / n) || 1;
  return Object.fromEntries(Object.entries(obj).map(([k, x]) => [k, (x - m) / sd]));
}

export function previousPoll(season, week) {
  const weeks = Object.keys(season.polls || {}).filter(k => k !== 'final').map(Number).filter(w => w < week).sort((a, b) => b - a);
  return weeks.length ? season.polls[weeks[0]] : season.carryPoll || null;
}

// ---------- the consensus: strength + résumé (as in the CFB dynasty) ----------

// Power ratings from game scores: runs_i vs j = avg + off_i - def_j (± home).
// Each team is pulled toward a prior from its OFF/MID/DEF ratings by
// PRIOR_GAMES games' worth of evidence, so early ratings lean on the
// roster and later ones on this season's results. Units are goals per
// game; a margin counts at most 4 goals (no credit for running it up).
const PRIOR_GAMES = 8, HOME_RUNS = 0.25, MARGIN_CAP = 4, SCALE = 1; // SCALE: goals per unit of the résumé's quality scale
const priorOf = t => { const b = t.base || t; return { off: 0.04 * (0.6 * b.off + 0.4 * b.pit - 70), def: 0.04 * (0.6 * b.def + 0.4 * b.pit - 70) }; };
// A game's score with the margin capped, keeping the total.
const capped = g => { const mid = (g.homeR + g.awayR) / 2, m = Math.max(-MARGIN_CAP, Math.min(MARGIN_CAP, g.homeR - g.awayR)) / 2; return [mid + m, mid - m]; };
export function powerRatings(season, filter = null) {
  const teams = Object.keys(season.teams);
  const played = season.games.filter(g => isFinal(g) && season.teams[g.home] && season.teams[g.away] && (!filter || filter(g)));
  let tot = 0, c = 0;
  for (const g of played) { tot += g.homeR + g.awayR; c += 2; }
  const avg = c ? tot / c : 3;
  const prior = Object.fromEntries(teams.map(t => [t, priorOf(season.teams[t])]));
  const off = {}, def = {}, n = {};
  for (const t of teams) { off[t] = prior[t].off; def[t] = prior[t].def; n[t] = 0; }
  for (const g of played) { n[g.home]++; n[g.away]++; }
  for (let it = 0; it < 40; it++) {
    const so = {}, sd = {};
    for (const t of teams) { so[t] = 0; sd[t] = 0; }
    for (const g of played) {
      const h = g.neutral ? 0 : HOME_RUNS / 2, [hr, ar] = capped(g);
      so[g.home] += hr - avg - h + def[g.away]; so[g.away] += ar - avg + h + def[g.home];
      sd[g.away] += avg + off[g.home] + h - hr; sd[g.home] += avg + off[g.away] - h - ar;
    }
    for (const t of teams) { off[t] = (so[t] + PRIOR_GAMES * prior[t].off) / (n[t] + PRIOR_GAMES); def[t] = (sd[t] + PRIOR_GAMES * prior[t].def) / (n[t] + PRIOR_GAMES); }
  }
  return Object.fromEntries(teams.map(t => [t, { off: off[t], def: def[t], rating: off[t] + def[t], games: n[t] }]));
}

// Résumé: every win counts, more against a strong opponent; every loss costs,
// less against a strong opponent, but losses weigh as much as wins. Covers
// the whole season to date.
const INERTIA = 0.3;
const quality = r => Math.max(0, Math.min(2.5, (r / SCALE + 1.5) / 2.5));
export function resumeScores(season, power, filter = null) {
  const out = Object.fromEntries(Object.keys(season.teams).map(t => [t, 0]));
  for (const g of season.games) {
    if (!isFinal(g) || (filter && !filter(g))) continue;
    const winCredit = o => 1 + 1.6 * quality(power[o]?.rating ?? -2), lossCost = o => 2.5 + 0.6 * (2.5 - quality(power[o]?.rating ?? -2));
    // A tie is half a win and half a loss: worth something against a strong
    // team, a setback against a weak one. (Penalty kicks don't change that.)
    if (isTie(g)) {
      for (const [t, o] of [[g.home, g.away], [g.away, g.home]]) if (t in out) out[t] += (winCredit(o) - lossCost(o)) / 2;
      continue;
    }
    const w = winnerOf(g), l = w === g.home ? g.away : g.home;
    const rw = power[w]?.rating ?? -2, rl = power[l]?.rating ?? -2;
    // A loss always costs at least half of the best possible win, so losing
    // a series never adds to a résumé (taking one of three from a top team
    // breaks even; against anyone else it hurts).
    if (w in out) out[w] += 1 + 1.6 * quality(rl);
    if (l in out) out[l] -= 2.5 + 0.6 * (2.5 - quality(rw));
  }
  return out;
}

// The pieces every voter looks at, through `week`.
function pollInputs(season, week) {
  const filter = g => g.week <= week;
  const recs = records(season, filter), r = rating(season, filter);
  const teams = Object.keys(season.teams);
  const power = powerRatings(season, filter);
  const res = resumeScores(season, power, filter);
  const zP = zmap(Object.fromEntries(teams.map(t => [t, power[t].rating])));
  const zQ = zmap(res);
  const zR = zmap(Object.fromEntries(teams.map(t => [t, r[t].rpi])));
  const zS = zmap(Object.fromEntries(teams.map(t => [t, r[t].sos || 0])));
  const played = teams.reduce((n, t) => n + recs[t].w + recs[t].l + (recs[t].t || 0), 0) / (teams.length || 1);
  // Team rating carries most of the weight in the preseason and the first
  // weeks (85%), fading as the season goes on to 20% at its end; the résumé
  // takes the rest.
  const progress = played / seasonLength(season);
  const strengthW = clamp(0.85 - 0.65 * progress, 0.2, 0.85);
  return { teams, recs, r, power, res, zP, zQ, zR, zS, played, strengthW };
}

// Consensus strength-plus-résumé score.
export function teamScores(season, week, { postBonus = null } = {}) {
  const { teams, recs, r, zP, zQ, played, strengthW } = pollInputs(season, week);
  const out = {};
  for (const t of teams) out[t] = strengthW * zP[t] + (1 - strengthW) * (played ? zQ[t] : 0) + (postBonus?.[t] || 0);
  return { scores: out, recs, rpi: r };
}

// Losing records. Voters mark a team down for a record under about .600,
// hardly at all in the first weeks and fully from 40% of the season on, and once a team has played about a fifth of
// its season (`recordGate`), one with a losing record goes to the bottom of
// every ballot: it's ranked only when there aren't enough teams at .500 or
// better to fill the poll (a sport with few teams).
const RECORD_PENALTY = 4, RECORD_PAR = 0.6;
const pctOf = r => { const n = r.w + r.l + (r.t || 0); return n ? (r.w + (r.t || 0) / 2) / n : 0.5; };
// Regular-season games per team (the schedule's average).
export function seasonLength(season) {
  const n = {};
  for (const g of season.games) if (g.type === 'regular') { n[g.home] = (n[g.home] || 0) + 1; n[g.away] = (n[g.away] || 0) + 1; }
  const v = Object.values(n);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 25;
}
const recordGate = season => Math.max(5, Math.round(0.2 * seasonLength(season)));
export function recordRules(season, recs) {
  const gate = recordGate(season), len = seasonLength(season);
  const penalty = {}, barred = new Set();
  for (const [t, r] of Object.entries(recs)) {
    const n = r.w + r.l + (r.t || 0), pct = pctOf(r);
    // Barely anything after a week or two (a top team swept by another good
    // team stays ranked); the full mark-down from 40% of the season on.
    penalty[t] = Math.min(1, n / len / 0.4) ** 2 * RECORD_PENALTY * Math.max(0, RECORD_PAR - pct);
    if (n >= gate && pct < 0.5) barred.add(t);
  }
  return { penalty, barred };
}

export function generatePoll(season, week, { final = false, postBonus = null } = {}) {
  const size = pollSizeOf(season);
  const wk = final ? 99 : week;
  const inp = pollInputs(season, wk);
  const { teams, recs, zP, zQ, zR, zS, played, strengthW } = inp;
  const { penalty, barred } = recordRules(season, recs);
  const prev = final ? season.polls?.[Math.max(...Object.keys(season.polls).filter(k => k !== 'final').map(Number))] : previousPoll(season, week);
  const prevRank = {};
  prev?.ranks.forEach((x, i) => { prevRank[x.team] = i + 1; });
  const prevSize = prev?.ranks.length || size;

  // This week's results, for the voters who react to them.
  const weekNet = {}, badLosses = {};
  for (const t of teams) { weekNet[t] = 0; badLosses[t] = 0; }
  if (!final && week > 0) {
    for (const g of season.games) {
      if (g.week !== week || !isFinal(g) || isTie(g)) continue;
      const w = winnerOf(g), l = w === g.home ? g.away : g.home;
      if (weekNet[w] !== undefined) weekNet[w]++;
      if (weekNet[l] !== undefined) { weekNet[l]--; if (!prevRank[w]) badLosses[l]++; }
    }
  }
  const zWeek = zmap(weekNet);
  // What this week did to each résumé (a big win moves a team, a bad week
  // costs it), which every voter weighs, not just the season totals.
  let zDelta = null;
  if (!final && week > 0) {
    const before = resumeScores(season, inp.power, g => g.week <= week - 1);
    zDelta = zmap(Object.fromEntries(teams.map(t => [t, inp.res[t] - before[t]])));
  }
  // Head to head: a ranked team that won this week's meeting (more wins than
  // losses against that team) with a ranked team at most H2H_GAP (5) spots above
  // it goes above that team on every ballot.
  const h2h = headToHead(season, week, prevRank, final);
  const weekW = {}, weekL = {};
  if (!final && week > 0) for (const g of season.games) {
    if (g.week !== week || !isFinal(g) || isTie(g)) continue;
    const w = winnerOf(g), l = w === g.home ? g.away : g.home;
    weekW[w] = (weekW[w] || 0) + 1; weekL[l] = (weekL[l] || 0) + 1;
  }

  const pts = {}, fp = {}, ballots = {};
  const panel = votersOf(season);
  for (const v of panel) {
    const vconf = voterConference(season, v);
    const noise = rng(hashStr(`${v.id}|${season.year}|${final ? 'final' : week}`));
    // Personality: how much strength vs résumé, and how much of the résumé is RPI.
    const sw = clamp(strengthW + v.talent * 0.3, 0.2, 0.92);
    const rpiMix = clamp(v.rpi - 0.35, 0, 0.5);
    const full = teams.map(t => {
      const resume = played ? (1 - rpiMix) * zQ[t] + rpiMix * zR[t] : 0;
      let sc = sw * zP[t] + (1 - sw) * resume;
      sc += v.sos * zS[t] * Math.min(1, played / 20);
      // Voters remember last week's poll (loyal ones more).
      if (prevRank[t]) sc += INERTIA * v.loyalty * (prevSize + 1 - prevRank[t]) / prevSize;
      sc += v.recency * zWeek[t];
      // The week's résumé change, capped so one big week can't throw a team
      // across the poll (Nov. 2026: the owner found the moves too big).
      if (zDelta) sc += WEEK_WEIGHT * clamp(zDelta[t], -1.5, 1.5);
      sc -= v.losses * badLosses[t];
      if (vconf && season.teams[t].conference === vconf) sc += v.regionBoost;
      sc += postBonus?.[t] || 0;
      sc -= penalty[t] || 0;
      sc += normal(noise) * v.noise;
      return [t, sc];
    }).sort((a, b) => b[1] - a[1]).map(x => x[0]);
    // No voter moves a ranked team up after a losing week.
    const ballot = holdLosers(applyHeadToHead(full, h2h), prevRank, weekW, weekL);
    // Losing records last (they still fill the poll in a small sport).
    ballot.sort((a, b) => barred.has(a) - barred.has(b));
    ballot.splice(size);
    ballots[v.id] = ballot;
    ballot.forEach((t, i) => { pts[t] = (pts[t] || 0) + size - i; if (i === 0) fp[t] = (fp[t] || 0) + 1; });
  }
  // Ties in points go to the consensus score.
  const cons = teamScores(season, wk, { postBonus }).scores;
  let order = holdLosers(Object.keys(pts).sort((a, b) => pts[b] - pts[a] || cons[b] - cons[a]), prevRank, weekW, weekL);
  for (let i = 1; i < order.length; i++) if (pts[order[i]] > pts[order[i - 1]]) pts[order[i]] = pts[order[i - 1]];
  // The champion is the unanimous #1 in the final poll.
  if (final && season.post?.champion) {
    const c = season.post.champion;
    order = [c, ...order.filter(t => t !== c)];
    pts[c] = panel.length * size; fp[c] = panel.length;
    for (const t of Object.keys(fp)) if (t !== c) fp[t] = 0;
    for (const id of Object.keys(ballots)) ballots[id] = [c, ...ballots[id].filter(t => t !== c)].slice(0, size);
  }
  const rec = t => `${recs[t].w}-${recs[t].l}-${recs[t].t || 0}`;
  return {
    week: final ? 'final' : week, voters: panel.length, size, edited: false, ballots,
    ranks: order.slice(0, size).map(t => ({ team: t, pts: pts[t], fp: fp[t] || 0, record: rec(t) })),
    others: order.slice(size).filter(t => pts[t] > 0).map(t => ({ team: t, pts: pts[t], record: rec(t) })),
  };
}

const WEEK_WEIGHT = 0.07, H2H_GAP = 5;
function headToHead(season, week, prevRank, final) {
  if (final || week <= 0) return [];
  const pair = {};
  for (const g of season.games) {
    if (g.week !== week || !isFinal(g) || !prevRank[g.home] || !prevRank[g.away]) continue;
    const w = winnerOf(g);
    if (!w) continue;
    const [a, b] = [g.home, g.away].sort(), k = `${a}|${b}`;
    (pair[k] ||= { a, b, n: 0 }).n += w === a ? 1 : -1;
  }
  const out = [];
  for (const { a, b, n } of Object.values(pair)) {
    if (!n) continue;
    const [win, lose] = n > 0 ? [a, b] : [b, a];
    if (prevRank[win] > prevRank[lose] && prevRank[win] - prevRank[lose] <= H2H_GAP) out.push([win, lose]);
  }
  return out;
}
function applyHeadToHead(order, pairs) {
  const list = [...order];
  for (const [win, lose] of pairs) {
    const i = list.indexOf(win), j = list.indexOf(lose);
    if (i > j && j >= 0) { list.splice(i, 1); list.splice(j, 0, win); }
  }
  return list;
}

// A team ranked last week that lost more games than it won this week can't
// be placed above its old spot; it's moved back down to it.
// A ranked team that won every game it played this week can't drop.
function holdLosers(order, prevRank, weekW, weekL) {
  const list = [...order];
  const losers = Object.keys(prevRank).filter(t => (weekL[t] || 0) > (weekW[t] || 0)).sort((a, b) => prevRank[a] - prevRank[b]);
  const unbeaten = Object.keys(prevRank).filter(t => (weekW[t] || 0) > 0 && !weekL[t]).sort((a, b) => prevRank[a] - prevRank[b]);
  // Moving one team shifts the others, so repeat until every rule holds.
  for (let pass = 0; pass < 50; pass++) {
    let moved = false;
    for (const t of losers) {
      const i = list.indexOf(t), floor = prevRank[t] - 1;
      if (i >= 0 && i < floor) { list.splice(i, 1); list.splice(floor, 0, t); moved = true; }
    }
    for (const t of unbeaten) {
      const i = list.indexOf(t), ceil = prevRank[t] - 1;
      if (i > ceil) { list.splice(i, 1); list.splice(ceil, 0, t); moved = true; }
    }
    if (!moved) break;
  }
  return list;
}

// A week's poll comes out once all of that week's games are final.
export function weekComplete(season, week) {
  const gs = season.games.filter(g => g.week === week);
  return gs.length > 0 && gs.every(isFinal);
}

// Release any polls that are now due. Returns the weeks released.
export function releaseDuePolls(season, lastPollWeek) {
  const released = [];
  season.polls ||= {};
  for (let w = 1; w <= lastPollWeek; w++) {
    if (season.polls[w]) continue;
    // A week with no games has nothing to vote on: skip it, don't stop.
    if (!season.games.some(g => g.week === w)) continue;
    if (!weekComplete(season, w)) break;
    season.polls[w] = generatePoll(season, w);
    released.push(w);
  }
  return released;
}

export function latestPoll(season) {
  if (season.polls?.final) return season.polls.final;
  const weeks = Object.keys(season.polls || {}).filter(k => k !== 'final').map(Number);
  return weeks.length ? season.polls[Math.max(...weeks)] : null;
}

export function pollRankMap(poll) {
  const m = {};
  poll?.ranks.forEach((x, i) => { m[x.team] = i + 1; });
  return m;
}
