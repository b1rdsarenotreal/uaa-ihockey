// Regular-season schedule for college hockey: weekends from early October
// to early March (week 1 starts the first Monday in October), games on
// Friday and Saturday, with a holiday break in late December.
//
// Every game is part of a two-game weekend series at one rink (the owner's
// rules, Nov. 2026; both sides, `confSeries: 'auto'`, `nonConf: 'fill'`):
// - conference: in a conference of `confTwiceMax` (7) teams or fewer, two
//   series against each opponent, one at each rink (4 games); in a bigger
//   one, one series against each, the host swapping every year;
// - non-conference: series against teams from other conferences, a
//   different one each time and nearby teams of a similar level first,
//   until a team has about `maxMatches` (34) games.
// Older settings still work: `confSeries` 'split' (a home-and-home, Friday
// at one rink and Saturday at the other) or 'twice', `nonConf` 'single'
// (one game against everyone) or 'series' (a series against everyone).
// Each weekend a team plays a series or up to two single games; teams
// spread their weekends over the season (non-conference early, conference
// later), so the season fills `regWeeks` (22).
// When `prev` (last season) is given, series hosts swap from last year.

import { isIndependent } from './standings.js?v=20261111234538';
import { cityPoint, miles } from './geo.js?v=20261111234538';
import { rng, shuffle, hashStr } from './util.js?v=20261111234538';

export const DEFAULT_REG_WEEKS = 22;
export const DEFAULT_TOURNEY_WEEKS = 0; // kept for older code paths
export const PER_WEEK = 2; // games a weekend (Friday and Saturday)
export const DEFAULT_CONF_MATCHES = 40; // no cap: everyone plays the whole conference schedule
export const DEFAULT_MAX_MATCHES = 34; // games a team plays, non-conference series filling up to it
export const TWICE_MAX = 7; // conferences this size or smaller play everyone twice
export const MAX_CONF_WEEKS = 22;

// Conference games against each opponent: a home-and-home pair ('split'),
// or two series of two ('twice').
export const DOUBLE_ROUND_ROBIN_MAX = 99;
export const confGamesPerOpponent = (mode, n = 0, twiceMax = TWICE_MAX) => (mode === 'twice' || (mode === 'auto' && n <= twiceMax) ? 4 : 2);
export const confTarget = (n, max = DEFAULT_CONF_MATCHES, mode = 'auto', twiceMax = TWICE_MAX) => (n < 2 ? 0 : Math.min((n - 1) * confGamesPerOpponent(mode, n, twiceMax), max));

// Kept for older code paths that read these.
export const MIDWEEK = {}; export const MIDWEEK_FREQ = {};

export const DAY_ORDER = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ---------- the calendar ----------

// Week 1 starts on the first Monday in October of the season's year.
export function seasonStart(year) {
  const d = new Date(Date.UTC(year, 9, 1));
  return new Date(Date.UTC(year, 9, 1 + ((8 - d.getUTCDay()) % 7)));
}
// The holiday break: weekends whose Saturday falls December 14 to January 1.
export function breakWeek(year, week) {
  const d = dateOf(year, week, 'Sat'), m = d.getUTCMonth(), n = d.getUTCDate();
  return (m === 11 && n >= 14) || (m === 0 && n <= 1);
}
// The calendar date of a week and day (a Date at UTC midnight).
export function dateOf(year, week, day) {
  const d = new Date(seasonStart(year));
  d.setUTCDate(d.getUTCDate() + (week - 1) * 7 + Math.max(0, DAYS.indexOf(day)));
  return d;
}
// The week and day of a date.
export function weekDayOf(year, month, date) {
  const n = Math.round((Date.UTC(year, month, date) - seasonStart(year).getTime()) / 864e5);
  return { week: Math.floor(n / 7) + 1, day: DAYS[((n % 7) + 7) % 7] };
}
// Kept for older code paths.
export function confWeeksFor(regWeeks) { return Math.max(1, Math.min(MAX_CONF_WEEKS, regWeeks)); }
export function confWeeksMax(regWeeks) { return confWeeksFor(regWeeks); }
const rrRounds = n => (n < 2 ? 0 : n % 2 ? n : n - 1);

export function blankGame(season, fields) {
  return {
    id: season.nextId++, type: 'regular', week: 1, day: 'Sat', order: DAY_ORDER.Sat,
    home: null, away: null, neutral: false, confGame: false, series: null, label: '',
    final: false, homeLine: [], awayLine: [], homeR: null, homeH: null, homeE: null, awayR: null, awayH: null, awayE: null,
    pitching: null, source: null, ...fields,
  };
}

// The two days a conference plays each weekend: Friday and Saturday by
// default (`settings.confDays`), or set per conference (Standings →
// Commissioner).
export const CONF_WEEKENDS = [
  ['tus', 'Tuesday and Saturday'],
  ['ws', 'Wednesday and Saturday'],
  ['wsu', 'Wednesday and Sunday'],
  ['ts', 'Thursday and Saturday'],
  ['tsu', 'Thursday and Sunday'],
  ['fs', 'Friday and Saturday'],
  ['fsu', 'Friday and Sunday'],
];
const WEEKEND_DAYS = { tus: ['Tue', 'Sat'], ws: ['Wed', 'Sat'], wsu: ['Wed', 'Sun'], ts: ['Thu', 'Sat'], tsu: ['Thu', 'Sun'], fs: ['Fri', 'Sat'], fsu: ['Fri', 'Sun'] };
export function seriesDays(fmt) {
  return (WEEKEND_DAYS[fmt] || WEEKEND_DAYS.fs).map(day => ({ day, order: DAY_ORDER[day] }));
}
export const confDaysOf = (season, conf) => season.settings?.confWeekend?.[conf] || season.settings?.confDays || 'fs';
// Re-lay a conference's unplayed conference games after its days change.
export function applyConfWeekend(season, conf) {
  const days = seriesDays(confDaysOf(season, conf));
  let n = 0;
  for (const g of season.games) {
    if (g.type !== 'regular' || !g.confGame || g.final || season.teams[g.home]?.conference !== conf || g.slot == null) continue;
    Object.assign(g, days[g.slot]);
    n++;
  }
  return n;
}

// Count each team's conference games in a set of rounds.
export function confSeriesCounts(rounds, list) {
  const n = Object.fromEntries(list.map(t => [t, 0]));
  for (const pairs of rounds) for (const [a, b] of pairs) if (a && b) { n[a]++; n[b]++; }
  return n;
}

// Pick games to drop so every team ends with the same number: team t must
// lose `need[t]` games, each shared with another team that has games to
// lose. Small conferences, so a backtracking search is quick.
function pickDrops(edges, need, r) {
  const left = { ...need }, chosen = [], used = new Set();
  let steps = 0;
  const solve = () => {
    if (++steps > 20000) return false;
    const todo = Object.keys(left).filter(t => left[t] > 0);
    if (!todo.length) return true;
    const opts = t => edges.filter((e, i) => !used.has(i) && (e.a === t ? left[e.b] > 0 : e.b === t && left[e.a] > 0));
    const t = todo.reduce((x, y) => (opts(y).length - left[y] < opts(x).length - left[x] ? y : x));
    for (const e of shuffle(opts(t), r)) {
      const i = edges.indexOf(e);
      used.add(i); left[e.a]--; left[e.b]--; chosen.push(i);
      if (solve()) return true;
      used.delete(i); left[e.a]++; left[e.b]++; chosen.pop();
    }
    return false;
  };
  return solve() ? chosen : null;
}

// Home/away for single meetings so every team hosts half its conference
// games. Pairs that meet twice already have one home each. The rest are
// walked as closed trails (an Euler orientation: every visit to a team is one
// arrival and one departure, so hosts and visits balance). A team with an
// odd number of single meetings gets a dummy partner, so it ends at most one
// off. `prefer(a, b)` > 0 means a should host (last season's swap); each
// trail runs whichever way satisfies more of those.
function balanceHomes(edges, r, prefer) {
  const adj = new Map(), deg = new Map();
  const all = edges.map(e => ({ ...e }));
  for (const e of all) for (const t of [e.a, e.b]) deg.set(t, (deg.get(t) || 0) + 1);
  const odd = [...deg].filter(([, d]) => d % 2).map(([t]) => t);
  for (let i = 0; i + 1 < odd.length; i += 2) all.push({ a: odd[i], b: '\u0000', dummy: true }, { a: odd[i + 1], b: '\u0000', dummy: true });
  all.forEach((e, i) => { for (const t of [e.a, e.b]) { if (!adj.has(t)) adj.set(t, []); adj.get(t).push(i); } });
  for (const l of adj.values()) l.splice(0, l.length, ...shuffle(l, r));
  const used = new Set();
  for (const start of shuffle([...adj.keys()], r)) {
    while ((adj.get(start) || []).some(i => !used.has(i))) {
      const trail = [];
      let at = start;
      for (;;) {
        const i = adj.get(at).find(j => !used.has(j));
        if (i == null) break;
        used.add(i);
        const e = all[i], to = e.a === at ? e.b : e.a;
        trail.push({ e, host: at, visit: to });
        at = to;
      }
      const score = trail.reduce((s2, x) => s2 + (x.e.dummy || !prefer ? 0 : Math.sign(prefer(x.host, x.visit))), 0);
      for (const x of trail) [x.e.home, x.e.away] = score < 0 ? [x.visit, x.host] : [x.host, x.visit];
    }
  }
  return all.filter(e => !e.dummy);
}

// A conference's rounds for the season, at most `maxRounds`: a round robin,
// then a second one with home and away swapped, taken until every team has
// its number of conference matches (confTarget). Fail-safe: every member plays
// the same number, with an even home/away split. When the last rounds give
// some teams an extra game, extra second meetings are dropped (those teams
// get a non-conference game or an open date instead); if no clean set of
// drops exists, the round robin is redrawn and tried again.
export function confRounds(list, maxRounds, r, max = DEFAULT_CONF_MATCHES, prefer = null) {
  if (list.length < 2) return [];
  const T = confTarget(list.length, max);
  for (let attempt = 0; attempt < 40; attempt++) {
    const first = roundRobin(list, r);
    const all = [...first, ...first.map(pairs => pairs.map(([a, b]) => [b, a]))];
    const rounds = [], cnt = Object.fromEntries(list.map(t => [t, 0]));
    for (const pairs of all) {
      if (rounds.length >= maxRounds || list.every(t => cnt[t] >= T)) break;
      rounds.push(pairs);
      for (const [a, b] of pairs) if (a && b) { cnt[a]++; cnt[b]++; }
    }
    let k = Math.min(T, ...Object.values(cnt));
    if ((list.length * k) % 2) k--;
    const edges = rounds.flatMap((pairs, ri) => pairs.filter(([a, b]) => a && b).map(([a, b]) => ({ a, b, ri, second: ri >= first.length })));
    const need = Object.fromEntries(list.map(t => [t, cnt[t] - k]));
    let gone = new Set();
    if (Object.values(need).some(x => x > 0)) {
      const seconds = edges.filter(e => e.second);
      let drops = pickDrops(seconds, need, r);
      if (drops) drops = drops.map(i => seconds[i]);
      else { drops = pickDrops(edges, need, r); if (drops) drops = drops.map(i => edges[i]); }
      if (!drops) continue;
      gone = new Set(drops);
    }
    const kept = edges.filter(e => !gone.has(e));
    // Pairs meeting twice keep their swapped home and away; balance the rest.
    const meets = {};
    for (const e of kept) meets[key(e.a, e.b)] = (meets[key(e.a, e.b)] || 0) + 1;
    const singles = kept.filter(e => meets[key(e.a, e.b)] === 1);
    for (const e of balanceHomes(singles, r, prefer)) { const o = singles.find(x => x.a === e.a && x.b === e.b && x.ri === e.ri); o.home = e.home; o.away = e.away; }
    const out = rounds.map(() => []);
    for (const e of kept) out[e.ri].push(e.home ? [e.home, e.away] : [e.a, e.b]);
    while (out.length && !out[out.length - 1].length) out.pop();
    return out;
  }
  throw new Error(`Couldn't give every team in a ${list.length}-team conference the same number of conference games.`);
}

// Circle-method round robin. Returns rounds of [a, b] pairs (null = bye).
export function roundRobin(teams, r) {
  const list = shuffle(teams, r);
  if (list.length % 2) list.push(null);
  const n = list.length, rounds = [];
  for (let k = 0; k < n - 1; k++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i], b = list[n - 1 - i];
      pairs.push(k % 2 ? [b, a] : [a, b]);
    }
    rounds.push(pairs);
    list.splice(1, 0, list.pop());
  }
  return rounds;
}

const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
// Conference rivals; independents are nobody's rivals.
const rival = (teams, a, b) => teams[a].conference === teams[b].conference && !isIndependent(teams[a].conference);

// Pair teams across conferences, avoiding repeat opponents when possible.
function crossPairs(pool, teams, met, r) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const left = shuffle(pool, r), pairs = [];
    let ok = true;
    while (left.length > 1) {
      const a = left.shift();
      let j = left.findIndex(b => !rival(teams, a, b) && !met.has(key(a, b)));
      if (j < 0) j = left.findIndex(b => !rival(teams, a, b));
      if (j < 0) { ok = false; break; }
      pairs.push([a, left.splice(j, 1)[0]]);
    }
    if (ok) return { pairs, idle: left };
  }
  return { pairs: [], idle: [...pool] };
}

// Pair teams across conferences for non-conference games: each team (in
// random order) takes the free opponent with the lowest cost, which is the
// distance between their homes, the gap in their ratings and some
// randomness, with a big penalty for a repeat opponent. `dist` is in miles.
// Level: a little pull toward teams of a similar rating (good matches for
// the index), and a big one against a Division I power playing a Division
// III school. Marquee games (two teams in the top third by rating) get
// harder to add the more of them either team already has, so a top team
// plays a few, not a whole non-conference schedule of them (the owner's
// rule, Nov. 2026).
const levelCost = (x, y) => { const g = Math.abs(x - y); return g * 15 + Math.max(0, g - 16) * 60; };
const MARQUEE = 100, marquee = new WeakMap();
function marqueeOf(met, teams, lvl) {
  if (!marquee.has(met)) {
    const names = Object.keys(teams), top = new Set([...names].sort((a, b) => lvl(b) - lvl(a)).slice(0, Math.ceil(names.length / 3)));
    marquee.set(met, { top, n: {} });
  }
  return marquee.get(met);
}
function nearCross(pool, teams, met, r, dist) {
  const lvl = t => (teams[t].off ?? 65) * 0.4 + (teams[t].pit ?? 65) * 0.3 + (teams[t].def ?? 65) * 0.3;
  const mq = marqueeOf(met, teams, lvl), big = (a, b) => mq.top.has(a) && mq.top.has(b);
  const left = shuffle(pool, r), pairs = [];
  while (left.length > 1) {
    const a = left.shift();
    let best = -1, bs = Infinity;
    left.forEach((b, j) => {
      if (rival(teams, a, b)) return;
      // Teams of a similar level, too (`levelCost`), but few marquee games each.
      const c = dist(a, b) + r() * 700 + levelCost(lvl(a), lvl(b)) + (big(a, b) ? MARQUEE * ((mq.n[a] || 0) + (mq.n[b] || 0)) : 0) + (met.has(key(a, b)) ? 4000 : 0);
      if (c < bs) { bs = c; best = j; }
    });
    if (best >= 0) { const b = left.splice(best, 1)[0]; pairs.push([a, b]); if (big(a, b)) { mq.n[a] = (mq.n[a] || 0) + 1; mq.n[b] = (mq.n[b] || 0) + 1; } }
  }
  return pairs;
}

// Event sizes for n teams in `events` events, as even as possible.
export function eventSizes(n, events = Math.floor(n / 4)) {
  if (n < 3 || events < 1) return [];
  const base = Math.floor(n / events), extra = n % events;
  return Array.from({ length: events }, (_, i) => base + (i < extra ? 1 : 0));
}


export function generateSchedule(season, seed = hashStr(String(season.year)), prev = null) {
  const r = rng(seed);
  const teams = season.teams, year = season.year;
  const names = Object.keys(teams);
  const st = season.settings || {};
  const confMode = st.confSeries || 'split', ncMode = st.nonConf || 'single';
  const homeCount = Object.fromEntries(names.map(n => [n, 0]));
  const games = [];
  const REG = Math.max(8, st.regWeeks ?? DEFAULT_REG_WEEKS);
  const hosted = new Map(); // "a|b" -> who hosted last year (single host)
  for (const g of prev?.games || []) if (g.type === 'regular' && (g.slot === 0 || (g.slot == null && g.day === 'Fri'))) hosted.set(key(g.home, g.away), g.home);
  const lastHost = (a, b) => hosted.get(key(a, b));
  const add = (week, day, home, away, extra = {}) => {
    games.push(blankGame(season, { week, day, order: DAY_ORDER[day], home, away, ...extra }));
    homeCount[home]++;
  };

  // Every meeting: { a, b, kind: 'split' | 'host' | 'single', host, conf }.
  const twiceMax = st.confTwiceMax ?? TWICE_MAX;
  const size = {};
  for (const n of names) if (!isIndependent(teams[n].conference)) size[teams[n].conference] = (size[teams[n].conference] || 0) + 1;
  const modeOf = conf => (confMode === 'auto' ? (size[conf] <= twiceMax ? 'twice' : 'once') : confMode);
  const meetings = [], onceEdges = [];
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    let [a, b] = shuffle([names[i], names[j]], r);
    if (lastHost(a, b) === a) [a, b] = [b, a]; // last year's host travels first
    if (rival(teams, a, b)) {
      const mode = modeOf(teams[a].conference);
      if (mode === 'twice') meetings.push({ a, b, kind: 'host', host: a, conf: true }, { a, b, kind: 'host', host: b, conf: true });
      else if (mode === 'once') { const m = { a, b, kind: 'host', host: lastHost(a, b) ? a : null, conf: true }; meetings.push(m); onceEdges.push(m); }
      else meetings.push({ a, b, kind: 'split', conf: true });
    } else if (ncMode === 'series') meetings.push({ a, b, kind: 'host', host: null, conf: false });
    else if (ncMode === 'single') meetings.push({ a, b, kind: 'single', conf: false });
  }
  // One series a year against each conference opponent: the host swaps from
  // last year; pairs that didn't meet last year are set so every member
  // hosts about half its series.
  const confHome = Object.fromEntries(names.map(n => [n, 0]));
  for (const m of onceEdges) if (m.host) confHome[m.host]++;
  for (const m of shuffle(onceEdges.filter(m => !m.host), r)) { m.host = confHome[m.a] <= confHome[m.b] ? m.a : m.b; confHome[m.host]++; }
  // Non-conference series up to the games cap: each team (busiest first)
  // takes a different opponent from another conference, nearby and of a
  // similar level, until it has about `maxMatches` games.
  if (ncMode === 'fill') {
    const cap = st.maxMatches ?? DEFAULT_MAX_MATCHES;
    const want = Object.fromEntries(names.map(n => [n, cap]));
    for (const m of meetings) { const g = m.kind === 'single' ? 1 : 2; want[m.a] -= g; want[m.b] -= g; }
    for (const n of names) want[n] = Math.max(0, Math.floor(want[n] / 2));
    const pts = Object.fromEntries(names.map(n => [n, cityPoint(teams[n].city)]));
    const dist = (a, b) => (pts[a] && pts[b] ? miles(pts[a], pts[b]) : 900);
    const lvl = t => (teams[t].off ?? 65) * 0.4 + (teams[t].pit ?? 65) * 0.3 + (teams[t].def ?? 65) * 0.3;
    const met = new Map();
    for (let pass = 0; pass < 2; pass++) for (let progress = true; progress;) {
      progress = false;
      for (const a of shuffle(names, r).sort((x, y) => want[y] - want[x])) {
        if (want[a] <= 0) continue;
        let best = null, bs = Infinity;
        for (const b of names) {
          if (b === a || want[b] <= 0 || rival(teams, a, b)) continue;
          const times = met.get(key(a, b)) || 0;
          if (times && pass === 0) continue; // a repeat only when nobody new is left
          const c = dist(a, b) + Math.abs(lvl(a) - lvl(b)) * 30 + r() * 700 - want[b] * 60 + times * 4000;
          if (c < bs) { bs = c; best = b; }
        }
        if (!best) continue;
        let [x, y] = shuffle([a, best], r);
        if (lastHost(x, y) === x) [x, y] = [y, x];
        meetings.push({ a: x, b: y, kind: 'host', host: null, conf: false, swap: !!lastHost(x, y) });
        met.set(key(a, best), (met.get(key(a, best)) || 0) + 1);
        want[a]--; want[best]--; progress = true;
      }
    }
  }
  // Non-conference hosts: whoever has hosted fewer series so far (counting
  // conference series), last year's visitor when even.
  if (ncMode === 'fill') {
    const hosts = Object.fromEntries(names.map(n => [n, 0]));
    for (const m of meetings) if (m.kind === 'host' && m.host) hosts[m.host]++;
    for (const m of shuffle(meetings.filter(m => m.kind === 'host' && !m.host), r)) {
      m.host = hosts[m.a] < hosts[m.b] ? m.a : hosts[m.b] < hosts[m.a] ? m.b : m.swap ? m.a : r() < 0.5 ? m.a : m.b;
      hosts[m.host]++;
    }
  }
  // Weekend units each team still owes: a series is one, a single game half.
  const load = Object.fromEntries(names.map(n => [n, 0]));
  for (const m of meetings) { const u = m.kind === 'single' ? 0.5 : 1; load[m.a] += u; load[m.b] += u; }
  const weeks = [];
  for (let w = 1; w <= REG; w++) if (!breakWeek(year, w)) weeks.push(w);
  let left = meetings;
  for (let wi = 0; wi < weeks.length + 30 && left.length; wi++) {
    const week = wi < weeks.length ? weeks[wi] : weeks[weeks.length - 1] + (wi - weeks.length + 1) + (breakWeek(year, weeks[weeks.length - 1] + 1) ? 3 : 0);
    const weeksLeft = Math.max(1, weeks.length - wi);
    const progress = wi / Math.max(1, weeks.length - 1);
    // Who plays this weekend: everyone with as many weekends owed as left,
    // the rest by chance.
    const on = new Set(names.filter(t => load[t] > 0 && (load[t] >= weeksLeft - 0.5 || r() < load[t] / weeksLeft * 1.15)));
    const free = Object.fromEntries(names.map(t => [t, { Fri: on.has(t), Sat: on.has(t) }]));
    // Non-conference meetings early, conference later; busiest teams first.
    const order = shuffle(left, r).map(m => ({ m, p: (m.conf ? progress : 1 - progress) + (load[m.a] + load[m.b]) / 40 + r() * 0.35 })).sort((x, y) => y.p - x.p).map(x => x.m);
    const placed = new Set();
    for (const m of order) {
      const fa = free[m.a], fb = free[m.b];
      if (m.kind === 'single') {
        const day = ['Fri', 'Sat'].find(d => fa[d] && fb[d]);
        if (!day) continue;
        const [h, aw] = homeCount[m.a] > homeCount[m.b] ? [m.b, m.a] : homeCount[m.a] < homeCount[m.b] ? [m.a, m.b] : r() < 0.5 ? [m.a, m.b] : [m.b, m.a];
        add(week, day, h, aw);
        fa[day] = fb[day] = false;
        load[m.a] -= 0.5; load[m.b] -= 0.5;
      } else {
        if (!(fa.Fri && fa.Sat && fb.Fri && fb.Sat)) continue;
        if (m.kind === 'split') { add(week, 'Fri', m.a, m.b, { confGame: m.conf, slot: 0 }); add(week, 'Sat', m.b, m.a, { confGame: m.conf, slot: 1 }); }
        else {
          const host = m.host || (homeCount[m.a] <= homeCount[m.b] ? m.a : m.b), vis = host === m.a ? m.b : m.a;
          add(week, 'Fri', host, vis, { confGame: m.conf, slot: 0 }); add(week, 'Sat', host, vis, { confGame: m.conf, slot: 1 });
        }
        fa.Fri = fa.Sat = fb.Fri = fb.Sat = false;
        load[m.a] -= 1; load[m.b] -= 1;
      }
      placed.add(m);
    }
    left = left.filter(m => !placed.has(m));
  }
  // Conference days other than Friday and Saturday, if a conference set them.
  for (const g of games) if (g.confGame) { const conf = teams[g.home].conference; const d = seriesDays(confDaysOf(season, conf))[g.slot]; Object.assign(g, d); }
  season.regWeeks = Math.max(1, ...games.map(g => g.week));
  games.sort((a, b) => a.week - b.week || a.order - b.order);
  return games;
}
