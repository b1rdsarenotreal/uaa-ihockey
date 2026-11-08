// Postseason: conference tournaments (single elimination at one school's
// field, for conferences with at least `aqMin` teams),
// then a national tournament whose shape comes from the season's settings.
// Every round is one game, played to a finish (20-minute sudden-death overtimes).
//   - regions: `regionals` brackets of `perRegional` teams (2 to 8), single
//     elimination; teams carry a seed inside their region (1 to
//     perRegional). With `homeSites` every game is at the higher seed's
//     field (or only the first `campusRounds`, the rest at a neutral site
//     from `settings.regionSites`);
//   - super regionals (one game) between two region winners when there are
//     twice as many regions as Frozen Four spots; the higher national seed
//     hosts,
//   - the Frozen Four at a neutral rink: semifinals and final two days
//     apart (`settings.finalDays`).
// Only conferences with at least `aqMin` teams (4) get an automatic bid.
// Internally the stages keep the names they have in MCS Dynasty: regionals,
// supers and mcws. The format is locked into the season when the field is
// announced.

import { blankGame, DAY_ORDER } from './schedule.js?v=20261107205925';
import { sameConf, records, rpi, rating, indexName, usesNpi, confStandings, conferences, isFinal, winnerOf, loserOf, isTie, resultFor, regularSeasonDone, regSeasonChamp, regSeasonChamps, quadrants } from './standings.js?v=20261107205925';
import { generatePoll } from './polls.js?v=20261107205925';
import { hashStr } from './util.js?v=20261107205925';

// ---------- tournament format ----------

// Default: 8 teams in four regions of two: the quarterfinal at the higher
// seed's rink, then the Frozen Four (1 v 4 and 2 v 3 by national seed).
export const DEFAULT_NCAA = { regionals: 4, perRegional: 2, wsSize: 4, homeSites: true, homeWeeks: 1, campusRounds: 0 };
// Conferences need this many teams for an automatic bid (and a tournament,
// by default); smaller ones compete for at-large spots. A setting.
export const DEFAULT_AQ_MIN = 4;
export const aqMinOf = season => season.settings?.aqMin ?? DEFAULT_AQ_MIN;
// Conferences whose champion gets an automatic bid.
export function aqConferences(season) {
  const n = {};
  for (const t of Object.values(season.teams)) n[t.conference] = (n[t.conference] || 0) + 1;
  return conferences(season).filter(c => (n[c] || 0) >= aqMinOf(season));
}
const twoWeeksOf = cfg => !!cfg.homeSites && cfg.homeWeeks === 2;
export const OLD_DEFAULT_NCAA = { regionals: 8, perRegional: 4, wsSize: 4 };
// `regionals: 0` means no regionals: the whole field (wsSize teams, 2 to 8)
// plays single elimination at the finals site, the top seeds getting byes
// when the field isn't a power of two (6 teams: 1 and 2 wait for 4 v 5 and
// 3 v 6). The men's default.
export const noRegionals = cfg => !cfg.regionals;
export const fieldSize = cfg => (noRegionals(cfg) ? cfg.wsSize : cfg.regionals * cfg.perRegional);
export const hasSupers = cfg => !noRegionals(cfg) && cfg.regionals === cfg.wsSize * 2;

export function ncaaConfig(season) {
  return { ...DEFAULT_NCAA, ...(season.post?.cfg || season.settings?.ncaa || {}) };
}

// The national seed shown for a team: only the regional hosts (the top
// national seeds, one per regional) carry a national seed on screen. Inside a
// regional every team shows its regional seed instead (regionalSeed).
export function regionalSeed(season, team) {
  const ev = season.post?.regionals?.find(e => e.seeds.includes(team));
  return ev ? ev.seeds.indexOf(team) + 1 : null;
}
export function shownSeed(season, team) {
  const p = season.post;
  const f = p?.field?.find(x => x.team === team), cfg = ncaaConfig(season);
  return f && f.seed <= (noRegionals(cfg) ? cfg.wsSize : cfg.regionals) ? f.seed : null;
}

// Problems with a format, in plain words (empty when it works).
export function ncaaProblems(cfg, teamCount) {
  const out = [];
  if (noRegionals(cfg)) {
    if (!(cfg.wsSize >= 2 && cfg.wsSize <= 8)) out.push('With no regionals the field must be 2 to 8 teams.');
    if (fieldSize(cfg) > teamCount) out.push(`That's ${fieldSize(cfg)} teams, but there are only ${teamCount} teams.`);
    return out;
  }
  if (![4, 8].includes(cfg.wsSize)) out.push('The Frozen Four must have 4 or 8 teams.');
  if (cfg.regionals !== cfg.wsSize && cfg.regionals !== cfg.wsSize * 2) out.push(`With ${cfg.wsSize} teams at the finals there must be ${cfg.wsSize} regions (winners go straight to the Frozen Four) or ${cfg.wsSize * 2} (winners meet in super regionals).`);
  if (!(cfg.perRegional >= 2 && cfg.perRegional <= 8)) out.push('Each region needs 2 to 8 teams.');
  if (fieldSize(cfg) > teamCount) out.push(`That's ${fieldSize(cfg)} teams, but there are only ${teamCount} teams.`);
  return out;
}

// Name of the round with n teams left.
export const stageRoundName = n => ({ 2: 'National final', 4: 'Frozen Four', 8: 'Quarterfinals', 16: 'Round of 16', 32: 'Round of 32', 64: 'Round of 64' }[n] || `Final ${n}`);

// One-paragraph description of a tournament format.
export function formatSummary(cfg) {
  if (noRegionals(cfg)) {
    const n = cfg.wsSize, p = 2 ** Math.ceil(Math.log2(n)), byes = p - n;
    return `<b>Format:</b> ${n} teams, single elimination at the Frozen Four site, seeded 1–${n}${byes ? `; the top ${byes === 1 ? 'seed waits' : `${byes} seeds wait`} a round` : ''}. Every round is one game, with sudden-death overtime.`;
  }
  const per = cfg.perRegional, p2 = 2 ** Math.ceil(Math.log2(Math.max(2, per))), byes = p2 - per;
  const site = per === 2 ? 'one game' : `${per}-team single elimination${byes ? `, the top ${byes === 1 ? 'seed waiting' : `${byes} seeds waiting`} a round` : ''}`;
  const camp = cfg.campusRounds || 0;
  const where = cfg.homeSites ? (camp ? `the first ${camp === 1 ? 'round' : `${camp} rounds`} at the higher seed's arena and the rest at the region's neutral arena${twoWeeksOf(cfg) ? ' the next week' : ''}` : `every game at the higher seed's arena${twoWeeksOf(cfg) ? ' (the first round one week, the next rounds the week after)' : ''}`) : `played at the top seed's arena`;
  const sup = hasSupers(cfg) ? ` Region winners pair off in ${cfg.regionals / 2} super regionals (the ${stageRoundName(cfg.regionals)}), one game hosted by the higher national seed.` : '';
  const ws = cfg.wsSize === 8 ? '8 teams at the Frozen Four site: quarterfinals, semifinals and the final' : 'the Frozen Four: the semifinals and, two days later, the national final';
  return `<b>Format:</b> ${fieldSize(cfg)} teams in ${cfg.regionals} regions of ${per} (${site}, seeded 1–${per}), led by the top ${cfg.regionals} national seeds, ${where}.${sup} Then ${ws} at a neutral site. Every round is one game, with sudden-death overtime.`;
}

// Weeks after the regular season, which runs weeks 1 to `regWeeks`.
export function regWeeksOf(season) { return season.regWeeks ?? 14; }
export function postWeeks(season) {
  const R = regWeeksOf(season), cfg = ncaaConfig(season);
  if (noRegionals(cfg)) return { conf: R + 1, mcws: R + 2 };
  const w = { conf: R + 1, regional: R + 2 };
  let n = R + 3;
  if (twoWeeksOf(cfg)) w.regional2 = n++; // the second and third rounds
  if (hasSupers(cfg)) w.super = n++;
  w.mcws = n++;
  return w;
}

// Conference tournaments: a conference with 4 or more teams takes its top
// 4; smaller ones have none. Set per conference on the Standings page.
export function defaultConfTourneySize(n) { return n >= 4 ? 4 : 0; }

// ---------- bracket nodes ----------

function bracketOrder(p) {
  let order = [1, 2];
  while (order.length < p) { const n = order.length * 2; order = order.flatMap(s => [s, n + 1 - s]); }
  return order;
}

// Days for a tournament week: the deepest round lands on Sunday.
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function assignDays(nodes) {
  const byKey = Object.fromEntries(nodes.map(n => [n.key, n]));
  const depth = n => n._d ??= 1 + Math.max(0, ...[n.a, n.b].map(r => (r && !('seed' in r) ? depth(byKey[r.w || r.l]) : 0)));
  const max = Math.max(...nodes.map(depth));
  for (const n of nodes) { n.day = WEEKDAYS[Math.max(0, 7 - max + n._d - 1)]; n.depth = n._d; delete n._d; }
  return nodes;
}

// Single elimination for `size` teams (byes for the top seeds when needed).
// sec / col place each game in the drawn bracket.
function singleElim(size) {
  const p = 2 ** Math.ceil(Math.log2(Math.max(2, size)));
  const order = bracketOrder(p);
  const rounds = Math.log2(p);
  const names = ['Final', 'Semifinal', 'Quarterfinal', 'First round'];
  const codes = ['F', 'SF', 'QF', 'R1'];
  const nodes = [];
  let refs = [];
  for (let i = 0; i < order.length; i += 2) refs.push({ seed: order[i] - 1 }, { seed: order[i + 1] - 1 });
  for (let r = 0; r < rounds; r++) {
    const next = [], fromEnd = rounds - 1 - r, count = refs.length / 2;
    for (let i = 0; i < refs.length; i += 2) {
      const key = `R${r + 1}-${i / 2 + 1}`;
      const code = fromEnd === 0 ? 'Final' : `${codes[fromEnd] || 'R' + (r + 1)}${count > 1 ? '-' + (i / 2 + 1) : ''}`;
      nodes.push({ key, code, a: refs[i], b: refs[i + 1], sec: 'W', col: r, label: names[fromEnd] || `Round ${r + 1}` });
      next.push({ w: key });
    }
    refs = next;
  }
  return assignDays(nodes);
}

// Double elimination for a conference tournament: a winners bracket, an
// elimination (losers) bracket, and ONE championship game between the two
// bracket winners — no "if necessary" game.
function doubleElimConf(size) {
  const p = 2 ** Math.ceil(Math.log2(Math.max(2, size)));
  const k = Math.log2(p);
  if (k < 2) return singleElim(size);
  const order = bracketOrder(p);
  const nodes = [];
  const W = []; // W[r] = keys of winners round r (1-based)
  let refs = [];
  for (let i = 0; i < order.length; i += 2) refs.push({ seed: order[i] - 1 }, { seed: order[i + 1] - 1 });
  for (let r = 1; r <= k; r++) {
    W[r] = [];
    const next = [], count = refs.length / 2;
    for (let i = 0; i < refs.length; i += 2) {
      const key = `W${r}-${i / 2 + 1}`;
      nodes.push({ key, code: count > 1 ? key : 'W-Final', a: refs[i], b: refs[i + 1], sec: 'W', col: r - 1, label: r === k ? 'Winners final' : `Winners round ${r}` });
      W[r].push(key); next.push({ w: key });
    }
    refs = next;
  }
  // Elimination bracket.
  let lr = 1, prevL = [];
  const addL = (pairs, label) => {
    const keys = [];
    pairs.forEach(([a, b], i) => {
      const key = `L${lr}-${i + 1}`;
      nodes.push({ key, code: pairs.length > 1 ? key : `L${lr}`, a, b, sec: 'L', col: lr - 1, label });
      keys.push(key);
    });
    lr++;
    return keys;
  };
  const w1 = W[1];
  prevL = addL(Array.from({ length: w1.length / 2 }, (_, i) => [{ l: w1[2 * i] }, { l: w1[2 * i + 1] }]), 'Elimination round 1');
  for (let j = 1; j <= k - 1; j++) {
    const drop = [...W[j + 1]].reverse(); // cross the drop-ins to avoid quick rematches
    const last = j === k - 1;
    prevL = addL(prevL.map((key, i) => [{ w: key }, { l: drop[i] }]), last ? 'Elimination final' : `Elimination round ${lr}`);
    if (!last) prevL = addL(Array.from({ length: prevL.length / 2 }, (_, i) => [{ w: prevL[2 * i] }, { w: prevL[2 * i + 1] }]), `Elimination round ${lr}`);
  }
  nodes.push({ key: 'CH', code: 'Final', a: { w: W[k][0] }, b: { w: prevL[0] }, sec: 'F', col: 0, label: 'Championship' });
  return assignDays(nodes);
}

// Best of three between seeds[0] and seeds[1] (higher seed first).
function seriesNodes(days = ['Fri', 'Sat', 'Sun']) {
  return [
    { key: 'S1', code: 'Game 1', a: { seed: 0 }, b: { seed: 1 }, day: days[0], t: 1, label: 'Game 1', sec: 'F', col: 0 },
    { key: 'S2', code: 'Game 2', a: { seed: 1 }, b: { seed: 0 }, day: days[1], t: 2, label: 'Game 2', sec: 'F', col: 0, after: 'S1' },
    { key: 'S3', code: 'Game 3', a: { seed: 0 }, b: { seed: 1 }, day: days[2], t: 3, label: 'Game 3 (if necessary)', cond: 's3', sec: 'F', col: 0 },
  ];
}

// Double elimination with an "if necessary" final: the elimination-bracket
// winner has to beat the winners-bracket winner twice.
function doubleElimIfNec(size) {
  const nodes = doubleElimConf(size);
  const ch = nodes.find(n => n.key === 'CH');
  ch.label = 'Final';
  for (const n of nodes) n.t = n.depth;
  nodes.push({ key: 'IF', code: 'Final (if necessary)', a: ch.a, b: ch.b, sec: 'F', col: 0, label: 'Final (if necessary)', cond: 'ifnec', day: 'Mon', t: ch.depth + 1 });
  return nodes;
}

// A region: single elimination. With home sites over two weeks, the last two
// rounds are the second week's Thursday and Sunday and any earlier rounds
// the first week (Friday, then Sunday); otherwise the rounds are spread over
// one week ending on Sunday. The last round is the national quarterfinal.
const REGION_DAYS = { 1: ['Sun'], 2: ['Fri', 'Sun'], 3: ['Wed', 'Fri', 'Sun'], 4: ['Mon', 'Wed', 'Fri', 'Sun'] };
// A regional's first-round matchups for previews, read from the regional's
// own bracket (regionalNodes): [[seedA, seedB], ...] with seeds 1 to size,
// in bracket order, and [seed, null] for a team with a first-round bye.
export function regionalFirstRound(size) {
  const nodes = regionalNodes(size);
  const pairs = [], playing = new Set();
  for (const n of nodes) {
    const a = n.a?.seed, b = n.b?.seed;
    if (a == null || b == null) continue;
    if (a < size && b < size) { pairs.push([a + 1, b + 1]); playing.add(a); playing.add(b); }
    else if (a < size || b < size) { const k = a < size ? a : b; pairs.push([k + 1, null]); playing.add(k); }
  }
  const byes = [];
  for (let k = 0; k < size; k++) if (!playing.has(k)) byes.push([k + 1, null]);
  return [...byes, ...pairs];
}

function regionalNodes(size, twoWeeks = false) {
  const nodes = singleElim(size);
  const last = Math.max(...nodes.map(n => +n.key.split('-')[0].slice(1)));
  for (const n of nodes) {
    const [r, k] = n.key.slice(1).split('-').map(Number);
    n.label = r === last ? 'Quarterfinal' : `${['First', 'Second', 'Third', 'Fourth'][r - 1] || `Round ${r}`} round`;
    n.code = r === last ? 'Region final' : `${n.label} · Game ${k}`;
    if (twoWeeks && last >= 2) {
      const later = r > last - 2; // the last two rounds: next week
      const pos = later ? r - (last - 2) - 1 : r - 1, wk = later ? 1 : 0;
      // Week one: Friday and Saturday (half the games each) for one round,
      // or Friday then Sunday for two.
      const days = later ? ['Fri', 'Sun'] : (last - 2 >= 2 ? ['Fri', 'Sun'] : [k % 2 ? 'Fri' : 'Sat']);
      n.wk = wk; n.day = days[pos] || 'Sun';
    } else n.day = (REGION_DAYS[last] || REGION_DAYS[4])[r - 1] || 'Sun';
  }
  return nodes;
}
function endOn(nodes, last) {
  const shift = 6 - WEEKDAYS.indexOf(last);
  for (const n of nodes) n.day = WEEKDAYS[Math.max(0, WEEKDAYS.indexOf(n.day) - shift)];
  return nodes;
}
// A super regional: one game between two regional winners.
function oneMatchNodes(label) {
  return [{ key: 'R1-1', code: 'Final', a: { seed: 0 }, b: { seed: 1 }, sec: 'W', col: 0, label, day: 'Sat', depth: 1 }];
}
// The finals: single elimination for 2 to 8 teams on the finals days
// (`settings.finalDays`: semifinals, final). A field bigger than four opens
// with quarterfinals two days before the semifinals, in the same week.
function finalsNodes(size, days = ['Fri', 'Sun']) {
  const nodes = singleElim(size);
  const early = WEEKDAYS[Math.max(0, WEEKDAYS.indexOf(days[0]) - 2)];
  for (const n of nodes) n.day = n.label === 'Final' ? days[1] : n.label === 'Semifinal' ? days[0] : early;
  for (const n of nodes) { n.label = n.label === 'Final' ? 'National final' : n.label === 'Semifinal' ? 'National semifinal' : n.label; n.code = n.code.replace(/^Final$/, 'National final').replace(/^SF-/, 'Semifinal ').replace(/^QF-/, 'Quarterfinal '); }
  return nodes;
}
// Hockey weeks run Monday to Sunday, so a Monday-to-Wednesday game is in the
// same week as the weekend after it, unless an earlier round of its event
// was played later in the week (a Saturday semifinal, then a Monday final):
// then it's the next week, which a game's `order` of 7 or more says.
export function nextWeekGame(ev, node) {
  const d = DAY_ORDER[node.day];
  if (!(d <= DAY_ORDER.Wed)) return false;
  return (ev?.nodes || []).some(n => (n.depth || 0) < (node.depth || 0) && DAY_ORDER[n.day] > d);
}
// Postseason games saved before that rule were all put a week late when
// played Monday to Wednesday. Returns true when it moved any.
export function fixEarlyWeekDates(season) {
  let moved = false;
  for (const ev of allEvents(season)) for (const node of ev.nodes || []) {
    const g = node.gameId != null && season.games.find(x => x.id === node.gameId);
    if (!g || g.type === 'regular' || g.type === 'conf' || !((g.order ?? 0) >= 7) || nextWeekGame(ev, node)) continue;
    if (!['Mon', 'Tue', 'Wed'].includes(g.day)) continue;
    g.order -= 7; moved = true;
  }
  return moved;
}

// Four-team regional weekend: Friday G1 and G2; Saturday G3, G4 and G5;
// Sunday the regional final and, if needed, the second final.
const REGIONAL_DAYS = { G1: ['Fri', 1], G2: ['Fri', 1.1], G3: ['Sat', 2], G4: ['Sat', 2.1], G5: ['Sat', 2.2], G6: ['Sun', 3], G7: ['Sun', 3.1] };
function fourTeamRegional(nodes) {
  for (const n of nodes) if (REGIONAL_DAYS[n.key]) [n.day, n.t] = REGIONAL_DAYS[n.key];
  return nodes;
}
// Regionals built by older versions played G5 on Sunday and G7 on Monday.
// Move any game not yet played to the current weekend.
function fixRegionalDays(season, ev) {
  if (ev.kind !== 'regional') return; // (never in volleyball: every site is single elimination)
  for (const n of ev.nodes) {
    const want = REGIONAL_DAYS[n.key];
    if (!want || (n.day === want[0] && n.t === want[1])) continue;
    const g = n.gameId && season.games.find(x => x.id === n.gameId);
    if (g && isFinal(g)) continue;
    [n.day, n.t] = want;
    if (g) { g.day = want[0]; g.order = want[1]; }
  }
}
const regionalKind = () => 'single';

// Play-in, then double elimination: the lowest seeds play a single-
// elimination first round (lose and you're out) while the top seeds have a
// bye. The play-in winners and the bye teams then play a double-elimination
// bracket of 4 (or 8) with one championship game. A top 6 is 3 vs 6 and
// 4 vs 5, then 1, 2 and the two winners in double elimination; a top 8 has
// no byes, so all eight play in.
function playInDoubleConf(size) {
  if (size < 5) return doubleElimConf(size);
  const D = 2 ** Math.floor(Math.log2(size - 1)); // double-elimination field
  const order = bracketOrder(2 * D);
  const pre = [], slot = {};
  let k = 0;
  for (let i = 0; i < order.length; i += 2) {
    const hi = Math.min(order[i], order[i + 1]) - 1, lo = Math.max(order[i], order[i + 1]) - 1;
    const real = lo < size;
    const key = `P-${i / 2 + 1}`;
    pre.push({ key, code: real ? `Play-in ${++k}` : 'Bye', a: { seed: hi }, b: { seed: lo }, sec: 'W', col: 0, label: 'Play-in round' });
    slot[hi] = key;
  }
  if (k === 1) pre.find(n => n.code === 'Play-in 1').code = 'Play-in';
  const de = doubleElimConf(D);
  for (const n of de) {
    for (const side of ['a', 'b']) if (n[side] && 'seed' in n[side]) n[side] = { w: slot[n[side].seed] };
    if (n.sec !== 'F') n.col += 1;
    delete n.day; delete n.depth;
  }
  return assignDays([...pre, ...de]);
}

// The format a conference tournament of `size` teams actually uses.
// Conference tournaments are single elimination.
export function confKind() { return 'single'; }
export const CONF_FORMATS = [['single', 'Single elimination']];
export const confFormatName = kind => (CONF_FORMATS.find(([k]) => k === kind) || CONF_FORMATS[0])[1];

// Conference tournaments are single elimination with a day of rest between
// rounds: the final on Sunday, the semifinals Friday, any earlier round on
// Wednesday.
function buildConfNodes(kind, size) {
  const nodes = singleElim(size);
  const last = Math.max(...nodes.map(n => +n.key.split('-')[0].slice(1)));
  const days = { 1: ['Sun'], 2: ['Fri', 'Sun'], 3: ['Wed', 'Fri', 'Sun'], 4: ['Mon', 'Wed', 'Fri', 'Sun'] }[last] || ['Mon', 'Wed', 'Fri', 'Sun'];
  for (const n of nodes) { const r = +n.key.split('-')[0].slice(1); n.day = days[Math.max(0, days.length - (last - r) - 1)]; }
  return nodes;
}

// A conference tournament day with only one real game (byes don't count)
// folds into the next day of play, even if that gives a team a doubleheader
// (but never three games in a day). The days are then packed together so
// there are no off days and the final is still on Sunday.
function mergeLoneDays(nodes, size) {
  const byKey = Object.fromEntries(nodes.map(n => [n.key, n]));
  const memo = {};
  // Does a slot hold a bye? Losers of bye games are byes too; winners aren't.
  const isBye = ref => ref && ('seed' in ref ? ref.seed >= size : ref.l ? byeNode(byKey[ref.l]) : false);
  const byeNode = n => (memo[n.key] ??= isBye(n.a) || isBye(n.b));
  const real = nodes.filter(n => !byeNode(n));
  const DAYS = WEEKDAYS;
  const used = () => DAYS.filter(d => real.some(n => n.day === d));
  // Longest run of games one team could play in a day: a game fed by another
  // game the same day.
  const chain = (set) => {
    const inSet = new Set(set.map(n => n.key)), depth = {};
    const dep = n => (depth[n.key] ??= 1 + Math.max(0, ...[n.a, n.b].map(r => (r && !('seed' in r) && inSet.has(r.w || r.l) ? dep(byKey[r.w || r.l]) : 0))));
    return Math.max(0, ...set.map(dep));
  };
  for (let guard = 0; guard < 10; guard++) {
    const days = used();
    const lone = days.slice(0, -1).find((d, i) => {
      if (real.filter(n => n.day === d).length !== 1) return false;
      const next = days[i + 1];
      return chain(real.filter(n => n.day === d || n.day === next)) <= 2;
    });
    if (!lone) break;
    const next = days[days.indexOf(lone) + 1];
    for (const n of nodes) if (n.day === lone) n.day = next;
  }
  // Pack the days so they run back to back and end on Sunday.
  const days = used(), shift = Object.fromEntries(days.map((d, i) => [d, DAYS[DAYS.length - days.length + i]]));
  for (const n of nodes) if (shift[n.day]) n.day = shift[n.day];
  return nodes;
}

function doubleElim(final = 'g7') {
  const n = [
    { key: 'G1', code: 'G1', a: { seed: 0 }, b: { seed: 3 }, day: 'Fri', label: 'Game 1', sec: 'W', col: 0 },
    { key: 'G2', code: 'G2', a: { seed: 1 }, b: { seed: 2 }, day: 'Fri', label: 'Game 2', sec: 'W', col: 0 },
    { key: 'G3', code: 'G3', a: { l: 'G1' }, b: { l: 'G2' }, day: 'Sat', label: 'Game 3 (elimination)', sec: 'L', col: 0 },
    { key: 'G4', code: 'G4', a: { w: 'G1' }, b: { w: 'G2' }, day: 'Sat', label: 'Game 4', sec: 'W', col: 1 },
    { key: 'G5', code: 'G5', a: { w: 'G3' }, b: { l: 'G4' }, day: 'Sun', label: 'Game 5 (elimination)', sec: 'L', col: 1 },
  ];
  if (final === 'g7') {
    n.push({ key: 'G6', code: 'G6', a: { w: 'G4' }, b: { w: 'G5' }, day: 'Sun', label: 'Regional final', sec: 'F', col: 0 });
    n.push({ key: 'G7', code: 'G7', a: { w: 'G4' }, b: { w: 'G5' }, day: 'Mon', label: 'Regional final (if necessary)', cond: 'g7', sec: 'F', col: 0 });
  } else {
    for (const x of n) x.day = { Fri: 'Thu', Sat: 'Fri', Sun: 'Sat' }[x.day];
    n.push({ key: 'F1', code: 'Finals G1', a: { w: 'G4' }, b: { w: 'G5' }, day: 'Sun', label: 'Championship Series · Game 1', after: 'G5', sec: 'F', col: 0 });
    n.push({ key: 'F2', code: 'Finals G2', a: { w: 'G5' }, b: { w: 'G4' }, day: 'Mon', label: 'Championship Series · Game 2', after: 'F1', sec: 'F', col: 0 });
    n.push({ key: 'F3', code: 'Finals G3', a: { w: 'G4' }, b: { w: 'G5' }, day: 'Tue', label: 'Championship Series · Game 3 (if necessary)', cond: 'f3', sec: 'F', col: 0 });
  }
  return n;
}

// One Frozen Four bracket (Bracket A or B): the 4-team NCAA double elimination,
// shifted a day for Bracket B so the two brackets alternate.
// Frozen Four days (both brackets play the same days): opening games Friday, Game 4
// Saturday, Games 3 and 5 Sunday, bracket finals Monday. In a 4-team Frozen Four
// the Championship Series follows on Monday, Tuesday and Wednesday.
const WS_DAYS = { G1: ['Fri', 1], G2: ['Fri', 1.1], G4: ['Sat', 2], G3: ['Sun', 3], G5: ['Sun', 3.1], G6: ['Mon', 4], G7: ['Mon', 4.1], F1: ['Mon', 4], F2: ['Tue', 5], F3: ['Wed', 6] };
function wsDays(nodes) {
  for (const n of nodes) if (WS_DAYS[n.key]) [n.day, n.t] = WS_DAYS[n.key];
  return nodes;
}
function wsBracketNodes() {
  const n = wsDays(doubleElim('g7'));
  for (const x of n) {
    if (x.key === 'G6') x.label = 'Bracket final';
    if (x.key === 'G7') x.label = 'Bracket final (if necessary)';
  }
  return n;
}
// Frozen Four events built by older versions: move games not yet played to these days.
function fixWsDays(season, ev) {
  for (const n of ev.nodes) {
    const want = WS_DAYS[n.key];
    if (!want || (n.day === want[0] && n.t === want[1])) continue;
    const g = n.gameId && season.games.find(x => x.id === n.gameId);
    if (g && isFinal(g)) continue;
    [n.day, n.t] = want;
    if (g) { g.day = want[0]; g.order = want[1]; }
  }
}

// Brackets saved by older versions lack the layout fields (sec, col, code,
// depth) that the drawn bracket needs; fill them in from the node keys.
const FIXED_LAYOUT = { G1: ['W', 0], G2: ['W', 0], G3: ['L', 0], G4: ['W', 1], G5: ['L', 1], G6: ['F', 0], G7: ['F', 0], F1: ['F', 0], F2: ['F', 0], F3: ['F', 0] };
export function ensureLayout(ev) {
  if (!ev?.nodes?.length || ev.nodes.every(n => n.sec && Number.isFinite(n.col) && n.code)) return ev;
  const rounds = Math.max(1, ...ev.nodes.map(n => +(/^R(\d+)-/.exec(n.key)?.[1] || 0)));
  for (const n of ev.nodes) {
    let m;
    if ((m = /^R(\d+)-(\d+)$/.exec(n.key))) {
      const r = +m[1], fromEnd = rounds - r, count = ev.nodes.filter(x => x.key.startsWith(`R${r}-`)).length;
      n.sec ||= 'W'; if (!Number.isFinite(n.col)) n.col = r - 1;
      n.code ||= fromEnd === 0 ? 'Final' : `${['F', 'SF', 'QF', 'R1'][fromEnd] || 'R' + r}${count > 1 ? '-' + m[2] : ''}`;
    } else if (FIXED_LAYOUT[n.key]) {
      const [sec, col] = FIXED_LAYOUT[n.key];
      n.sec ||= sec; if (!Number.isFinite(n.col)) n.col = col;
      n.code ||= /^F\d/.test(n.key) ? `Finals G${n.key[1]}` : n.key;
    } else if ((m = /^([WL])(\d+)-/.exec(n.key))) {
      n.sec ||= m[1]; if (!Number.isFinite(n.col)) n.col = +m[2] - 1; n.code ||= n.key;
    } else {
      n.sec ||= 'F'; if (!Number.isFinite(n.col)) n.col = 0; n.code ||= n.key;
    }
  }
  return ev;
}

const nodeOf = (ev, k) => ev.nodes.find(n => n.key === k);
const BYE = '__bye__';

function resolve(ev, ref) {
  if (!ref) return null;
  if ('seed' in ref) return ev.seeds[ref.seed] ?? BYE;
  const n = nodeOf(ev, ref.w || ref.l);
  if (!n) return null;
  return ref.w ? n.winner : n.loser;
}

function condMet(ev, node) {
  if (node.after && !nodeOf(ev, node.after)?.winner) return false;
  if (node.cond === 'g7') { const g6 = nodeOf(ev, 'G6'); return !!g6.winner && g6.winner !== resolve(ev, { w: 'G4' }); }
  if (node.cond === 'f3') { const a = nodeOf(ev, 'F1'), b = nodeOf(ev, 'F2'); return !!a.winner && !!b.winner && a.winner !== b.winner; }
  if (node.cond === 's3') { const a = nodeOf(ev, 'S1'), b = nodeOf(ev, 'S2'); return !!a.winner && !!b.winner && a.winner !== b.winner; }
  if (node.cond === 'ifnec') { const ch = nodeOf(ev, 'CH'); return !!ch.winner && ch.winner !== resolve(ev, ch.a); }
  return true;
}

// Games that switch home and away from the game they follow.
const FLIP_OF = { S2: 'S1', F2: 'F1', G7: 'G6', IF: 'CH' };

// Create games whose teams are known; record winners of finished games.
function advanceEvent(season, ev, { type, week, name }) {
  // Re-derive winners from the games, so edited results flow through. Games
  // not yet played whose matchup no longer fits the bracket are removed.
  for (const n of ev.nodes) { n.winner = null; n.loser = null; }
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of ev.nodes) {
      if (node.winner || !node.gameId) continue;
      const g = season.games.find(x => x.id === node.gameId);
      if (!g) { node.gameId = null; continue; }
      const a = resolve(ev, node.a), b = resolve(ev, node.b);
      if (!a || !b) continue;
      const fits = condMet(ev, node) && new Set([a, b, g.home, g.away]).size === 2;
      if (!fits && !isFinal(g)) { season.games = season.games.filter(x => x !== g); node.gameId = null; continue; }
      // Older saves: a flipped game not yet played that has the same home team
      // as the game it follows gets switched.
      const ref = FLIP_OF[node.key] && ev.nodes.find(x => x.key === FLIP_OF[node.key]);
      const refGame = ref?.gameId && season.games.find(x => x.id === ref.gameId);
      if (!isFinal(g) && refGame && g.home === refGame.home && g.away === refGame.away) {
        [g.home, g.away] = [g.away, g.home];
        if (ev.host && (g.home === ev.host || g.away === ev.host)) { g.neutral = true; g.site = ev.host; }
      }
      if (isFinal(g)) { node.winner = winnerOf(g); node.loser = loserOf(g); changed = true; }
    }
  }
  changed = true;
  while (changed) {
    changed = false;
    for (const node of ev.nodes) {
      if (node.winner) continue;
      if (node.gameId) {
        const g = season.games.find(x => x.id === node.gameId);
        if (!g) { node.gameId = null; changed = true; continue; }
        if (isFinal(g)) { node.winner = winnerOf(g); node.loser = loserOf(g); changed = true; }
        continue;
      }
      if (!condMet(ev, node)) continue;
      const a = resolve(ev, node.a), b = resolve(ev, node.b);
      if (!a || !b) continue;
      if (a === BYE || b === BYE) { node.winner = a === BYE ? b : a; node.loser = BYE; changed = true; continue; }
      const ia = ev.seeds.indexOf(a), ib = ev.seeds.indexOf(b);
      let home = ia <= ib ? a : b, away = home === a ? b : a;
      const hosted = ev.host && (home === ev.host || away === ev.host);
      if (hosted && away === ev.host) [home, away] = [away, home];
      // Game 2 of a series, and the "if necessary" game after a double-
      // elimination final, flip home and away. At a host's field the game is
      // still played there; the visitor is the home team (bats last).
      const flip = FLIP_OF[node.key] != null;
      if (flip) [home, away] = [away, home];
      const atHostAsVisitor = hosted && flip;
      // Home sites: the higher seed plays at home in the campus rounds; later
      // rounds are at the region's neutral arena.
      const round = +(/^R(\d+)-/.exec(node.key)?.[1] || 1);
      const atHome = !!ev.homeSites && (!ev.campusRounds || round <= ev.campusRounds);
      const g = blankGame(season, {
        type, week: week + (node.wk || 0), day: node.day,
        order: node.t != null ? node.t : DAY_ORDER[node.day] + (type !== 'conf' && nextWeekGame(ev, node) ? 7 : 0) + (node.key === 'G6' ? 0.5 : 0) + (node.depth || 0) * 0.01,
        home, away, neutral: atHome ? false : !hosted || atHostAsVisitor, ...(atHostAsVisitor && !atHome ? { site: ev.host } : {}), ...(!atHome && ev.venue ? { venue: { ...ev.venue } } : {}), event: ev.id, node: node.key,
        label: `${name} · ${node.label}`,
        ...(ev.kind === 'series' ? { series: ev.id, bestOf: 3 } : node.key[0] === 'F' && ev.kind === 'mcws' ? { series: `${ev.id}-finals`, bestOf: 3 } : {}),
      });
      season.games.push(g);
      node.gameId = g.id;
      changed = true;
    }
  }
  ev.champion = eventChampion(ev);
  return ev.champion;
}

function seriesChampion(ev, keys) {
  const wins = {};
  for (const k of keys) { const w = nodeOf(ev, k)?.winner; if (w) wins[w] = (wins[w] || 0) + 1; }
  return Object.keys(wins).find(t => wins[t] >= 2) || null;
}

function eventChampion(ev) {
  if (ev.kind === 'single' || ev.kind === 'double' || ev.kind === 'playin') { const w = ev.nodes[ev.nodes.length - 1].winner; return w && w !== BYE ? w : null; }
  if (ev.kind === 'regional') {
    const g6 = nodeOf(ev, 'G6'), g7 = nodeOf(ev, 'G7');
    if (g7.winner) return g7.winner;
    if (g6.winner && g6.winner === resolve(ev, { w: 'G4' })) return g6.winner;
    return null;
  }
  if (ev.kind === 'de') {
    const ch = nodeOf(ev, 'CH'), ifn = nodeOf(ev, 'IF');
    if (ifn.winner) return ifn.winner;
    if (ch.winner && ch.winner === resolve(ev, ch.a)) return ch.winner;
    return null;
  }
  if (ev.kind === 'series') return seriesChampion(ev, ['S1', 'S2', 'S3']);
  return seriesChampion(ev, ['F1', 'F2', 'F3']);
}

export function runnerUp(ev) {
  if (!ev?.champion) return null;
  if (ev.kind === 'series') return ev.seeds.find(t => t !== ev.champion) || null;
  const finalKey = ev.kind === 'mcws' ? 'F1' : ev.kind === 'regional' ? 'G6' : ev.kind === 'de' ? 'CH' : ev.nodes[ev.nodes.length - 1].key;
  const n = nodeOf(ev, finalKey);
  return n.winner === ev.champion ? n.loser : n.winner;
}

// ---------- conference tournaments ----------

export function confTourneySeeds(season, conf) {
  const recs = records(season, g => g.type === 'regular'), r = rating(season, g => g.type === 'regular');
  return confStandings(season, conf, recs, r).map(x => x.team);
}

// Conference tournament hosts. Each season every conference's tournament is
// played at one of its schools, picked at random (not last year's host when
// there's a choice). The commissioner can change it. Hosting doesn't change
// the bracket: the host plays its games at home and every other game is at
// the host's site.
export function pickConfHosts(season, prev = null) {
  season.confHosts ||= {};
  for (const conf of conferences(season)) confHost(season, conf, prev?.confHosts?.[conf]);
  return season.confHosts;
}
export function confHost(season, conf, avoid = null) {
  season.confHosts ||= {};
  const teams = Object.values(season.teams).filter(t => t.conference === conf).map(t => t.school).sort();
  if (!teams.length) return null;
  let h = season.confHosts[conf];
  if (!h || !teams.includes(h)) {
    const pool = teams.length > 1 && avoid ? teams.filter(t => t !== avoid) : teams;
    h = pool[hashStr(`${season.year}|${conf}|host`) % pool.length];
    season.confHosts[conf] = h;
  }
  return h;
}
// Change a tournament's host. Games already played keep their site; games
// not yet played are rebuilt at the new host.
export function setConfHost(season, conf, team) {
  season.confHosts ||= {};
  season.confHosts[conf] = team;
  const ev = season.post?.confT?.[conf];
  if (ev) moveConfTourney(season, ev, team);
}
function moveConfTourney(season, ev, host) {
  ev.host = host;
  const ids = new Set(ev.nodes.map(n => n.gameId).filter(Boolean));
  season.games = season.games.filter(g => !ids.has(g.id) || isFinal(g));
}

export function setupConfTourneys(season) {
  season.post ||= {};
  season.post.confT = {};
  for (const conf of conferences(season)) {
    const n = Object.values(season.teams).filter(t => t.conference === conf).length;
    const size = Math.min(n, season.settings.confTourney?.[conf] ?? defaultConfTourneySize(n));
    if (size < 2) continue;
    const seeds = confTourneySeeds(season, conf).slice(0, size);
    const kind = confKind(season.settings.confFormat?.[conf], size);
    season.post.confT[conf] = { id: `ct-${conf}`, kind, conf, size, seeds, nodes: buildConfNodes(kind, size), champion: null, host: confHost(season, conf) };
  }
  season.phase = 'conf';
}

// Replace a conference tournament's seeds (only before any of its games are played).
export function reseedConfTourney(season, conf, seeds) {
  const ev = season.post.confT[conf];
  const ids = new Set(ev.nodes.map(n => n.gameId).filter(Boolean));
  if (season.games.some(g => ids.has(g.id) && isFinal(g))) throw new Error('That tournament has already started.');
  season.games = season.games.filter(g => !ids.has(g.id));
  ev.seeds = seeds;
  ev.nodes = buildConfNodes(ev.kind, ev.size);
  ev.champion = null;
}

// Where the Frozen Four is played. Every finals game is at this neutral site.
export const DEFAULT_MCWS_VENUE = { stadium: 'Ridder Arena', city: 'Minneapolis, Minn.' };
export function mcwsVenue(season) {
  const st = season?.settings || {};
  return { stadium: st.mcwsVenue || DEFAULT_MCWS_VENUE.stadium, city: st.mcwsCity ?? DEFAULT_MCWS_VENUE.city };
}

// Where a game is played: { host, stadium, city }. The host is the school whose
// field it is (null for the Frozen Four, or a neutral game with no host). A
// conference tournament, regional or super regional game is at the event
// host's field, even when the host isn't playing in it.
export function gameVenue(season, g) {
  if (g.type === 'mcws') { const v = mcwsVenue(season); return { host: null, stadium: v.stadium, city: v.city }; }
  // A neutral arena: a preseason tournament, a showcase, a regional site.
  if (g.venue) return { host: null, stadium: g.venue.stadium || '', city: g.venue.city || '' };
  const host = g.site || (g.neutral ? (['conf', 'regional', 'super'].includes(g.type) ? allEvents(season).find(ev => ev.id === g.event)?.host : null) : g.home) || null;
  const t = host ? season.teams[host] : null;
  return { host, stadium: t?.stadium || '', city: t?.city || '' };
}

// ---------- selection ----------

// ---------- the committee: team-vs-team comparisons ----------
//
// The committee compares two teams at a time, tier by tier. Within a tier
// each criterion goes to the better team (or to neither on a tie); the team
// that wins more of a tier's criteria wins the comparison. Only if a tier is
// even does the next tier decide. Tier 1 decides most comparisons.
export const COMMITTEE_TIERS = [
  { name: 'Tier 1', items: [['rpi', 'RPI'], ['q1w', 'Q1 wins'], ['q4l', 'Q4 losses']] },
  { name: 'Tier 2', items: [['sos', 'Strength of schedule'], ['h2h', 'Head-to-head'], ['q2w', 'Q2 wins'], ['wl', 'Overall W-L']] },
  { name: 'Tier 3', items: [['aq', 'Automatic bid'], ['reg', 'Regular-season conference title'], ['q3l', 'Q3 losses'], ['q1p', 'Q1 win %'], ['q2p', 'Q2 win %'], ['q12p', 'Q1 + Q2 win %']] },
];
export const COMMITTEE_SHORT = { rpi: 'RPI', q1w: 'Q1 W', q4l: 'Q4 L', sos: 'SOS', h2h: 'H2H', q2w: 'Q2 W', wl: 'W-L', aq: 'AQ', reg: 'Reg. title', q3l: 'Q3 L', q1p: 'Q1 %', q2p: 'Q2 %', q12p: 'Q1+Q2 %' };

// Everything the committee looks at, gathered once for a season.
export function committeeSheet(season) {
  const r = rating(season), Q = quadrants(season, r), recs = records(season);
  const autos = new Set(Object.values(autoBids(season)).filter(Boolean));
  const regDone = season.games.some(g => g.type === 'regular') && season.games.filter(g => g.type === 'regular').every(isFinal);
  const reg = new Set(regDone ? conferences(season).flatMap(c => regSeasonChamps(season, c)) : []);
  const h2h = {};
  for (const g of season.games) if (isFinal(g) && !isTie(g)) { const k = `${winnerOf(g)}|${loserOf(g)}`; h2h[k] = (h2h[k] || 0) + 1; }
  // Winning percentage, a tie counting half.
  const pct = (w, l, t = 0) => (w + l + t ? (w + t / 2) / (w + l + t) : null);
  const stat = {};
  for (const t of Object.keys(season.teams)) {
    const q = Q[t].rec;
    stat[t] = {
      rpiRank: r[t]?.rank ?? 999, rpi: r[t]?.rpi ?? 0, sos: r[t]?.sosRank ?? 999,
      q1w: q[0].w, q2w: q[1].w, q3l: q[2].l, q4l: q[3].l,
      q1p: pct(q[0].w, q[0].l, q[0].t), q2p: pct(q[1].w, q[1].l, q[1].t), q12p: pct(q[0].w + q[1].w, q[0].l + q[1].l, q[0].t + q[1].t),
      wl: pct(recs[t]?.w || 0, recs[t]?.l || 0, recs[t]?.t || 0), aq: autos.has(t), reg: reg.has(t),
    };
  }
  // With the NPI the committee goes straight down the index, as the NCAA's
  // NPI sports do: no tiers, every comparison is the higher NPI.
  return { stat, h2h, r, Q, tiers: usesNpi(season) ? [] : COMMITTEE_TIERS };
}

// One criterion: 1 if A is better, -1 if B is, 0 if even.
function criterion(sheet, k, a, b) {
  const A = sheet.stat[a], B = sheet.stat[b], sgn = x => (x > 0 ? 1 : x < 0 ? -1 : 0);
  switch (k) {
    case 'rpi': return sgn(B.rpiRank - A.rpiRank);
    case 'sos': return sgn(B.sos - A.sos);
    case 'q1w': case 'q2w': return sgn(A[k] - B[k]);
    case 'q3l': case 'q4l': return sgn(B[k] - A[k]);
    case 'h2h': return sgn((sheet.h2h[`${a}|${b}`] || 0) - (sheet.h2h[`${b}|${a}`] || 0));
    case 'aq': case 'reg': return sgn(+A[k] - +B[k]);
    default: return A[k] == null || B[k] == null ? 0 : sgn(A[k] - B[k]); // win percentages (overall, Q1, Q2, Q1+Q2), when both have games
  }
}

// Compare two teams. Returns { better, worse, tier (1-3, or 0 if every tier
// was even and the raw RPI decided), won: criteria the better team won in the
// deciding tier, lost: criteria it lost there }.
export function compareTeams(sheet, a, b) {
  const tiers = sheet.tiers || COMMITTEE_TIERS;
  for (let i = 0; i < tiers.length; i++) {
    const res = tiers[i].items.map(([k]) => [k, criterion(sheet, k, a, b)]);
    const sum = res.reduce((n, [, v]) => n + v, 0);
    if (sum) {
      const [better, worse] = sum > 0 ? [a, b] : [b, a], sign = sum > 0 ? 1 : -1;
      return { better, worse, tier: i + 1, won: res.filter(([, v]) => v === sign).map(([k]) => k), lost: res.filter(([, v]) => v === -sign).map(([k]) => k) };
    }
  }
  const A = sheet.stat[a].rpi, B = sheet.stat[b].rpi;
  const aFirst = A !== B ? A > B : a.localeCompare(b) < 0;
  return { better: aFirst ? a : b, worse: aFirst ? b : a, tier: 0, won: ['rpi'], lost: [] };
}

// Rank a set of teams one comparison at a time. Teams start in RPI order;
// each team in turn starts at the bottom and moves up past every team it
// beats head to head in the comparison, stopping at the first team that
// beats it. (Team A over B; then C vs. B, and if C wins, C vs. A; and so on.)
export function committeeRank(season, teams, sheet = committeeSheet(season)) {
  const start = [...teams].sort((a, b) => sheet.stat[a].rpiRank - sheet.stat[b].rpiRank || a.localeCompare(b));
  const out = [];
  for (const t of start) {
    let i = out.length;
    out.push(t);
    while (i > 0 && compareTeams(sheet, t, out[i - 1]).better === t) { [out[i - 1], out[i]] = [out[i], out[i - 1]]; i--; }
  }
  return out;
}
// The whole league in committee order (used to pick the at-large teams).
export function committeeOrder(season, sheet = committeeSheet(season)) {
  return committeeRank(season, Object.keys(season.teams), sheet);
}
// Seeds for a chosen field: the same comparisons, among the field's teams only.
export function committeeSeeds(season, teams, sheet = committeeSheet(season)) {
  return committeeRank(season, teams, sheet);
}

// At-large teams need a winning or .500 record (every game so far counts).
// Teams below .500 only get in as their conference's automatic qualifier.
export function atLargeEligible(season, t, recs = records(season)) {
  const r = recs[t];
  return !!r && r.w >= r.l;
}

// The teams that may take at-large spots, in committee order. If too few
// teams are .500 or better to fill the field, the best of the rest fill the
// remaining spots (listed in `fill`) so the bracket still works.
export function atLargePool(season, order = committeeOrder(season), autoSet = new Set(Object.values(autoBids(season)).filter(Boolean))) {
  const size = Math.min(fieldSize(ncaaConfig(season)), Object.keys(season.teams).length);
  const recs = records(season);
  const rest = order.filter(t => !autoSet.has(t));
  const eligible = rest.filter(t => atLargeEligible(season, t, recs));
  const ineligible = rest.filter(t => !atLargeEligible(season, t, recs));
  const spots = Math.max(0, size - autoSet.size);
  const fill = ineligible.slice(0, Math.max(0, spots - eligible.length));
  const allowed = new Set([...eligible, ...fill]);
  return { size, spots, eligible, ineligible, fill, pool: rest.filter(t => allowed.has(t)) };
}

export function autoBids(season) {
  const out = {};
  const recs = records(season, g => g.type === 'regular'), r = rating(season, g => g.type === 'regular');
  for (const conf of aqConferences(season)) {
    const ev = season.post?.confT?.[conf];
    out[conf] = season.overrides?.autoBids?.[conf] || ev?.champion || regSeasonChamp(season, conf, recs, r);
  }
  return out;
}

export function proposeField(season, size = Math.min(fieldSize(ncaaConfig(season)), Object.keys(season.teams).length)) {
  const order = committeeOrder(season);
  const autos = autoBids(season);
  const autoSet = new Set(Object.values(autos).filter(Boolean));
  const recs = records(season);
  const { pool } = atLargePool(season, order, autoSet);
  const field = [...autoSet];
  for (const t of pool) { if (field.length >= size) break; if (!field.includes(t)) field.push(t); }
  const seeded = committeeSeeds(season, field);
  season.post.field = seeded.map((t, i) => ({ team: t, seed: i + 1, bid: autoSet.has(t) ? 'auto' : 'at-large', conf: season.teams[t].conference }));
  season.post.lastIn = order.filter(t => field.includes(t) && !autoSet.has(t)).slice(-4);
  season.post.firstOut = order.filter(t => !field.includes(t) && atLargeEligible(season, t, recs)).slice(0, 4);
  season.post.fieldConfirmed = false;
  season.phase = 'selection';
}

// Bracketology: the field and regionals as they would look if the season
// ended today. Projected automatic bids go to each conference's current
// leader (or its tournament champion once there is one); the rest follow the
// committee order. Nothing is saved.
export const BRACKETOLOGY_FROM_WEEK = 4;
export function bracketology(season) {
  const cfg = ncaaConfig(season);
  const size = Math.min(fieldSize(cfg), Object.keys(season.teams).length);
  const order = committeeOrder(season);
  const autos = autoBids(season);
  // Before a conference has played league games, its projected bid goes to
  // its best team in the committee order.
  for (const c of Object.keys(autos)) if (!autos[c]) autos[c] = order.find(t => season.teams[t].conference === c) || null;
  const autoSet = new Set(Object.values(autos).filter(Boolean));
  const recs = records(season);
  const { pool, fill } = atLargePool(season, order, autoSet);
  const chosen = [...autoSet];
  for (const t of pool) { if (chosen.length >= size) break; if (!chosen.includes(t)) chosen.push(t); }
  const field = committeeSeeds(season, chosen).map((t, i) => ({ team: t, seed: i + 1, bid: autoSet.has(t) ? 'auto' : 'at-large', conf: season.teams[t].conference }));
  const atLarge = order.filter(t => chosen.includes(t) && !autoSet.has(t));
  const out = order.filter(t => !chosen.includes(t) && !autoSet.has(t) && atLargeEligible(season, t, recs));
  return { cfg, field, autos, fill, regionals: pods(field, cfg.regionals, season), lastIn: atLarge.slice(-4), firstOut: out.slice(0, 4), nextOut: out.slice(4, 8) };
}

// Selection, step 1: the commissioner settles which teams are in. Automatic
// qualifiers are fixed; at-large spots go to any non-automatic team.
export function selectionBoard(season, extra = 10) {
  const order = committeeOrder(season);
  const autoSet = new Set(Object.values(autoBids(season)).filter(Boolean));
  const autos = order.filter(t => autoSet.has(t));
  const { size, spots, pool, ineligible, fill } = atLargePool(season, order, autoSet);
  const inField = new Set((season.post?.field || []).map(f => f.team));
  // Show the at-large spots plus the next `extra` teams, and never hide a team that's in.
  let board = pool.slice(0, spots + extra);
  for (const t of pool) if (inField.has(t) && !board.includes(t)) board.push(t);
  return { size, autos, spots, board, order, pool, ineligible: ineligible.filter(t => !fill.includes(t)), fill, chosen: pool.filter(t => inField.has(t)) };
}
function reseedByCommittee(season, teams) {
  const order = committeeOrder(season);
  const autoSet = new Set(Object.values(autoBids(season)).filter(Boolean));
  const field = committeeSeeds(season, teams);
  season.post.field = field.map((t, i) => ({ team: t, seed: i + 1, bid: autoSet.has(t) ? 'auto' : 'at-large', conf: season.teams[t].conference }));
  season.post.lastIn = order.filter(t => field.includes(t) && !autoSet.has(t)).slice(-4);
  const recs = records(season);
  season.post.firstOut = order.filter(t => !field.includes(t) && !autoSet.has(t) && atLargeEligible(season, t, recs)).slice(0, 4);
}
export function setAtLarge(season, team, on) {
  const p = season.post;
  if (p.fieldConfirmed) throw new Error('Unlock the field to change teams.');
  const b = selectionBoard(season);
  if (b.autos.includes(team)) throw new Error(`${team} is an automatic qualifier.`);
  if (on && !b.pool.includes(team)) throw new Error(`${team} has a losing record and can only get in as an automatic qualifier.`);
  let teams = p.field.map(f => f.team);
  if (on && !teams.includes(team)) {
    if (b.chosen.length >= b.spots) throw new Error(`All ${b.spots} at-large spots are taken. Take a team out first.`);
    teams.push(team);
  } else if (!on) teams = teams.filter(t => t !== team);
  reseedByCommittee(season, teams);
}
// Step 2: confirm the teams, then order the seeds.
export function confirmField(season) {
  const b = selectionBoard(season);
  if (season.post.field.length !== b.size) throw new Error(`Pick ${b.spots} at-large teams (${b.chosen.length} picked).`);
  season.post.fieldConfirmed = true;
}
export function unconfirmField(season) { season.post.fieldConfirmed = false; }

// What an NCAA site is called: the host's city ("East Lansing" for Michigan
// State), or the school when it has no city set.
export function siteName(season, school) {
  const city = (season.teams[school]?.city || '').split(',')[0].trim();
  return city || school;
}

// Older saves named regionals and super regionals after the host school.
// Renames those (and their games) after the host's city. Names that don't
// follow the old pattern are left alone.
export function citySiteNames(season) {
  const p = season.post || {};
  const rename = (ev, now) => {
    const old = ev.name;
    if (!old || old === now) return;
    ev.name = now;
    for (const g of season.games) if (g.event === ev.id && g.label?.startsWith(`${old} · `)) g.label = now + g.label.slice(old.length);
  };
  for (const [list, kind] of [[p.regionals, 'Site'], [p.supers, 'Regional']]) {
    for (const ev of list || []) {
      const old = `${ev.host} ${kind}`, now = `${siteName(season, ev.host)} ${kind}`;
      if (ev.name === old && now !== old) rename(ev, now);
    }
  }
  // Sites became regionals and regional finals super regionals.
  for (const ev of p.supers || []) {
    if (/ Regional$/.test(ev.name || '') && !/ Super Regional$/.test(ev.name)) rename(ev, ev.name.replace(/ Regional$/, ' Super Regional'));
    for (const n of ev.nodes || []) if (n.label === 'Regional final') n.label = 'Super regional';
    for (const g of season.games) if (g.event === ev.id && g.label?.endsWith(' · Regional final')) g.label = g.label.replace(/ · Regional final$/, ' · Super regional');
  }
  for (const ev of p.regionals || []) {
    if (/ Site$/.test(ev.name || '')) rename(ev, ev.name.replace(/ Site$/, ' Regional'));
    for (const n of ev.nodes || []) if (n.code === 'Site final') n.code = 'Regional final';
  }
}

// Serpentine pods: with 4 regionals, regional 1 gets seeds 1, 8, 9, 16,
// regional 2 gets 2, 7, 10, 15, and so on. Regional k is hosted by seed k+1.
export function pods(field, regionals = 4, season = null) {
  if (!regionals) return [];
  const n = regionals, out = Array.from({ length: n }, () => []);
  field.forEach((f, i) => { const rnd = Math.floor(i / n); const k = rnd % 2 === 0 ? i % n : n - 1 - (i % n); out[k].push(f.team); });
  return season ? avoidConferenceMatchups(out, season) : out;
}

// First-round matchups between teams of one conference, across the regionals.
export function confClashes(podList, season) {
  const out = [];
  podList.forEach((teams, r) => {
    for (const [a, b] of regionalFirstRound(teams.length)) {
      const x = teams[a - 1], y = b ? teams[b - 1] : null;
      if (x && y && sameConf(season.teams, x, y)) out.push({ regional: r, teams: [x, y] });
    }
  });
  return out;
}

// Conference rivals shouldn't meet in the first round (the owner's rule,
// Nov. 2026), most of all in big fields. After the serpentine, teams on the
// same seed line (the same regional seed) trade regionals to break up
// first-round matchups between teams of one conference, lowest seed lines
// first. If that isn't enough, a team may move one seed line, trading with
// a team on the next line in another regional. The top line (the national
// seeds who head the regionals) never moves. A rivalry stays only when
// nothing else works. The same rule runs for bracketology, the selection
// preview and the announced field, so they always agree.
function avoidConferenceMatchups(out, season) {
  let best = confClashes(out, season).length;
  if (!best) return out;
  const lines = Math.max(...out.map(t => t.length));
  const pass = moves => {
    let improved = true;
    while (improved && best) {
      improved = false;
      for (const [a, i, b, j] of moves()) {
        if (!out[a][i] || !out[b][j]) continue;
        [out[a][i], out[b][j]] = [out[b][j], out[a][i]];
        const c = confClashes(out, season).length;
        if (c < best) { best = c; improved = true; if (!best) return; } else [out[a][i], out[b][j]] = [out[b][j], out[a][i]];
      }
    }
  };
  pass(function* () { for (let L = lines - 1; L >= 1; L--) for (let a = 0; a < out.length; a++) for (let b = a + 1; b < out.length; b++) yield [a, L, b, L]; });
  pass(function* () { for (let L = lines - 2; L >= 1; L--) for (let a = 0; a < out.length; a++) for (let b = 0; b < out.length; b++) if (a !== b) yield [a, L, b, L + 1]; });
  return out;
}

export function lockField(season) {
  const p = season.post;
  p.cfg = { ...DEFAULT_NCAA, ...(season.settings.ncaa || {}) };
  const field = [...p.field].sort((a, b) => a.seed - b.seed);
  const home = !!p.cfg.homeSites;
  const sites = season.settings.regionSites || [];
  p.regionals = pods(field, p.cfg.regionals, season).map((teams, i) => {
    const site = home && p.cfg.campusRounds ? sites[i] : null;
    return {
      id: `reg-${i + 1}`, kind: regionalKind(teams.length), seeds: teams, host: home ? null : teams[0], top: teams[0], homeSites: home, campusRounds: home ? p.cfg.campusRounds || 0 : 0,
      ...(site ? { venue: { stadium: site.stadium, city: site.city } } : {}),
      nodes: regionalNodes(teams.length, twoWeeksOf(p.cfg)), champion: null,
      name: site?.name ? `${site.name} Region` : home ? `${teams[0]} Region` : `${siteName(season, teams[0])} Regional`, path: i,
    };
  });
  if (!home) uniqueSiteNames(p.regionals, 'Regional');
  season.phase = 'regionals';
}

const nationalSeed = (season, t) => season.post.field?.find(f => f.team === t)?.seed ?? 99;

// Super regionals: regional k meets regional (n-1-k), so the 1 seed's
// regional pairs with the last host's. The higher national seed hosts.
function buildSupers(season) {
  const regs = season.post.regionals, n = regs.length;
  return uniqueSiteNames(Array.from({ length: n / 2 }, (_, i) => {
    const pair = [regs[i].champion, regs[n - 1 - i].champion].sort((a, b) => nationalSeed(season, a) - nationalSeed(season, b));
    return { id: `sup-${i + 1}`, kind: 'single', seeds: pair, host: pair[0], nodes: oneMatchNodes('Super regional'), champion: null, name: `${siteName(season, pair[0])} Super Regional`, path: i };
  }), 'Super Regional');
}
// Two hosts in one city (UCLA and Loyola Marymount, say): the second site
// is named after its school so the names stay different.
function uniqueSiteNames(events, kind) {
  const seen = new Set();
  for (const ev of events) {
    if (seen.has(ev.name)) ev.name = `${ev.host} ${kind}`;
    seen.add(ev.name);
  }
  return events;
}

// Teams reaching the Frozen Four, in bracket-path order (path k = national seed k+1's side).
function wsQualifiers(season) {
  const p = season.post, cfg = ncaaConfig(season);
  if (noRegionals(cfg)) return p.field ? [...p.field].sort((a, b) => a.seed - b.seed).map(f => f.team) : null;
  const stage = hasSupers(cfg) ? p.supers : p.regionals;
  if (!stage?.length || !stage.every(ev => ev.champion)) return null;
  return stage.map((ev, i) => [ev.path ?? i, ev.champion]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
}

// 8-team Frozen Four brackets: Bracket A holds paths 1, 4, 5, 8 (games 1 vs 8 and
// 4 vs 5); Bracket B holds paths 2, 3, 6, 7 (2 vs 7 and 3 vs 6).
function buildWsBrackets(q) {
  return [
    { id: 'ws-A', kind: 'regional', bracket: 'A', seeds: [q[0], q[3], q[4], q[7]], host: null, nodes: wsBracketNodes(), champion: null, name: 'Bracket A' },
    { id: 'ws-B', kind: 'regional', bracket: 'B', seeds: [q[1], q[2], q[5], q[6]], host: null, nodes: wsBracketNodes(), champion: null, name: 'Bracket B' },
  ];
}

// ---------- driver ----------

// Keep a stage (super regionals, the Frozen Four, its finals) in step with the
// stage before it. `sig` names the teams that should be in it, or is null
// while the earlier stage is unfinished. A stage whose teams no longer game
// is rebuilt, unless it already has results (the commissioner's call).
function syncStage(season, key, sig, build) {
  const p = season.post;
  p.sigs ||= {};
  if (p[key] && p.sigs[key] !== sig) {
    const evs = Array.isArray(p[key]) ? p[key] : [p[key]];
    const ids = new Set(evs.map(e => e.id));
    const played = season.games.some(g => ids.has(g.event) && isFinal(g));
    if (!played) {
      season.games = season.games.filter(g => !ids.has(g.event));
      delete p[key]; delete p.sigs[key];
    } else if (p.sigs[key] === undefined) p.sigs[key] = sig; // saved before stages were tracked: keep it as is
  }
  if (!p[key] && sig) { p[key] = build(); p.sigs[key] = sig; }
  return p[key];
}

// Advance everything that can advance. Call after any result changes.
export function progress(season) {
  if (!season.post) season.post = {};
  const p = season.post;
  for (const ev of allEvents(season)) ensureLayout(ev);
  const W = postWeeks(season);
  if (season.phase === 'regular' && regularSeasonDone(season) && season.games.some(g => g.type === 'regular')) setupConfTourneys(season);
  // Tournaments set up before hosts existed get one now.
  if (p.confT) for (const ev of Object.values(p.confT)) if (ev.host === undefined) moveConfTourney(season, ev, confHost(season, ev.conf));
  if (p.confT) for (const ev of Object.values(p.confT)) advanceEvent(season, ev, { type: 'conf', week: W.conf, name: `${ev.conf} Tournament` });
  if (season.phase === 'conf' && Object.values(p.confT || {}).every(ev => ev.champion)) proposeField(season);
  if (!p.regionals) return;

  const cfg = ncaaConfig(season);
  for (const ev of p.regionals) { fixRegionalDays(season, ev); advanceEvent(season, ev, { type: 'regional', week: W.regional, name: ev.name }); }

  if (hasSupers(cfg)) {
    const done = p.regionals.every(ev => ev.champion);
    syncStage(season, 'supers', done ? p.regionals.map(ev => ev.champion).join('|') : null, () => buildSupers(season));
    for (const ev of p.supers || []) advanceEvent(season, ev, { type: 'super', week: W.super, name: ev.name });
  }

  // The finals keep the bracket: the 1 seed's path meets the 4 seed's path
  // in the semifinals (paths are already in bracket order).
  const q = wsQualifiers(season);
  const wsName = season.settings.mcwsName || 'Frozen Four';
  syncStage(season, 'mcws', q ? q.join('|') : null, () => ({ id: 'mcws', kind: 'single', seeds: q, host: null, nodes: finalsNodes(q.length, season.settings.finalDays), champion: null }));
  if (p.mcws) advanceEvent(season, p.mcws, { type: 'mcws', week: W.mcws, name: wsName });

  // Phase and champion follow from the stages.
  const finalEv = p.mcws;
  const champ = finalEv?.champion || null;
  const wasComplete = season.phase === 'complete';
  p.champion = champ;
  p.runnerUp = champ ? runnerUp(finalEv) : null;
  season.phase = champ ? 'complete' : (p.mcws || p.mcwsBrackets) ? 'mcws' : p.supers ? 'supers' : 'regionals';
  if (champ && (!wasComplete || !season.polls.final)) season.polls.final = generatePoll(season, 'final', { final: true, postBonus: postseasonBonus(season) });
  if (!champ && season.polls.final) delete season.polls.final;
}

// Teams in the Frozen Four (either format).
export function wsTeams(season) {
  const p = season.post || {};
  return p.mcws?.seeds || (p.mcwsBrackets || []).flatMap(ev => ev.seeds);
}

export function postseasonBonus(season) {
  const p = season.post, b = {};
  const add = (t, x) => { if (t) b[t] = Math.max(b[t] || 0, x); };
  for (const ev of Object.values(p.confT || {})) add(ev.champion, 0.3);
  for (const ev of p.regionals || []) { for (const t of ev.seeds) add(t, 0.6); add(ev.champion, 2); }
  for (const ev of p.supers || []) { for (const t of ev.seeds) add(t, 2); }
  for (const t of wsTeams(season)) add(t, 5);
  for (const ev of p.mcwsBrackets || []) add(ev.champion, 7);
  add(p.runnerUp, 8); add(p.champion, 10);
  return b;
}

// How far each team got (for team pages and history).
// Final Frozen Four places for a finished season: { team: { place, tied } }.
// Champion 1st, runner-up 2nd; everyone else by the round they went out in
// (teams knocked out in the same round tie, e.g. T-3rd in an 8-team Frozen Four).
const ELIM_ROUND = node => +(/^R(\d+)-/.exec(node || '')?.[1] || 0);
export function mcwsPlaces(season) {
  const p = season.post || {}, out = {};
  const teams = wsTeams(season);
  if (!p.champion || !teams.length) return out;
  out[p.champion] = { place: 1, tied: false };
  if (p.runnerUp) out[p.runnerUp] = { place: 2, tied: false };
  const ws = season.games.filter(g => g.type === 'mcws' && isFinal(g)).sort((a, b) => a.week - b.week || a.order - b.order || a.id - b.id);
  const round = {};
  for (const t of teams) {
    if (out[t]) continue;
    const lost = ws.filter(g => loserOf(g) === t);
    round[t] = ELIM_ROUND(lost[lost.length - 1]?.node);
  }
  const others = Object.keys(round);
  for (const t of others) {
    const better = others.filter(o => round[o] > round[t]).length;
    out[t] = { place: 3 + better, tied: others.filter(o => round[o] === round[t]).length > 1 };
  }
  return out;
}
// A team's Frozen Four history before `year`: appearances, last one, best finish
// (and the years it came), and wins and losses in Frozen Four games.
export function mcwsHistory(league, team, year) {
  const h = { apps: 0, last: null, best: null, bestYears: [], w: 0, l: 0, t: 0 };
  for (const [y, se] of Object.entries(league.seasons).map(([y, se]) => [Number(y), se]).sort((a, b) => a[0] - b[0])) {
    if (y >= year || !wsTeams(se).includes(team)) continue;
    h.apps++; h.last = y;
    for (const g of se.games) if (g.type === 'mcws' && isFinal(g) && (g.home === team || g.away === team)) h[resultFor(g, team).toLowerCase()]++;
    const pl = mcwsPlaces(se)[team];
    if (!pl) continue;
    if (!h.best || pl.place < h.best.place) { h.best = pl; h.bestYears = [y]; }
    else if (pl.place === h.best.place) h.bestYears.push(y);
  }
  return h;
}

export function postseasonFinish(season, team) {
  const p = season.post || {};
  if (p.champion === team) return 'National champion';
  if (p.runnerUp === team) return 'National runner-up';
  const cfg = ncaaConfig(season);
  if (wsTeams(season).includes(team)) {
    // Name the round a team went out in by the teams left then.
    const lost = season.games.find(g => g.type === 'mcws' && isFinal(g) && loserOf(g) === team);
    if (!lost) return stageRoundName(Math.min(cfg.wsSize, 4));
    const r = ELIM_ROUND(lost.node), rounds = Math.ceil(Math.log2(cfg.wsSize));
    const left = Math.min(cfg.wsSize, 2 ** (rounds - r + 1));
    return left === 4 || left === 8 ? stageRoundName(left) : 'National Tournament';
  }
  if (p.supers?.some(ev => ev.seeds.includes(team))) return stageRoundName(cfg.regionals);
  const reg = p.regionals?.find(ev => ev.seeds.includes(team));
  if (!reg) return null;
  if (reg.champion === team) return stageRoundName(cfg.regionals);
  // Out inside the regional: name the round by how many teams were left
  // nationally (with 4 regionals of 8, a regional final is the Quarterfinals).
  const lost = season.games.find(g => g.event === reg.id && isFinal(g) && (g.home === team || g.away === team) && winnerOf(g) !== team);
  if (!lost) return 'National Tournament';
  const rounds = Math.max(...reg.nodes.map(n => +n.key.split('-')[0].slice(1)));
  const r = +String(lost.node || 'R1').split('-')[0].slice(1);
  const left = cfg.regionals * 2 ** (rounds - r + 1);
  return left === 8 || left === 16 ? stageRoundName(left) : 'National Tournament';
}

// Where a team's postseason ended, for team and coach histories:
// { text, tab, ev } where tab/ev point at the bracket on the Postseason page.
// "UCLA Regional · out in Game 5", "Oregon Super Regional · lost series 1-2".
export function postseasonDetail(season, team) {
  const p = season.post || {};
  const finish = postseasonFinish(season, team);
  if (!finish) return null;
  const gamesIn = ev => season.games.filter(g => g.event === ev.id && (g.home === team || g.away === team) && isFinal(g));
  const lostIn = ev => gamesIn(ev).find(g => loserOf(g) === team);
  const roundOf = (ev, g) => (nodeOf(ev, g.node)?.label || '').replace(/ \(.*\)$/, '');
  const wsName = season.settings?.mcwsName || 'Frozen Four';
  if (finish === 'National champion') return { text: 'National champion', tab: 'mcws', ev: null };
  if (p.mcws?.seeds.includes(team)) {
    const g = lostIn(p.mcws);
    return { text: finish === 'National runner-up' ? 'National runner-up' : `${wsName}${g ? ` · out in the ${roundOf(p.mcws, g).toLowerCase()}` : ''}`, tab: 'mcws', ev: null };
  }
  const sup = p.supers?.find(e => e.seeds.includes(team));
  if (sup) return { text: `${sup.name}${sup.champion && sup.champion !== team ? ' · lost the super regional' : ''}`, tab: 'supers', ev: sup.id };
  const ev = p.regionals.find(e => e.seeds.includes(team));
  if (ev.champion === team) return { text: `Won the ${ev.name}`, tab: 'regionals', ev: ev.id };
  if (!ev.champion) return { text: ev.name, tab: 'regionals', ev: ev.id };
  const g = lostIn(ev);
  return { text: `${ev.name}${g ? ` · out in the ${roundOf(ev, g).toLowerCase()}` : ''}`, tab: 'regionals', ev: ev.id };
}
function seriesScoreFinals(season, ev, team) {
  const gs = season.games.filter(g => g.event === ev.id && isFinal(g) && (g.home === team || g.away === team) && (ev.kind === 'series' || /^F\d/.test(g.node || '')));
  const w = gs.filter(g => winnerOf(g) === team).length;
  return `${w}-${gs.length - w}`;
}

// Postseason records for team and coach histories: the NCAA tournament W-L,
// and the conference tournament W-L with the champion or the round the team
// went out in. { ncaa: { w, l } | null, conf: { w, l, champ, out, ev } | null }
export function postseasonRecord(season, team) {
  const p = season.post || {};
  const mine = g => (g.home === team || g.away === team) && isFinal(g);
  // Ties (including games decided on penalty kicks) count as ties.
  const wl = gs => ({ w: gs.filter(g => resultFor(g, team) === 'W').length, l: gs.filter(g => resultFor(g, team) === 'L').length, t: gs.filter(g => resultFor(g, team) === 'T').length });
  const ncaaGames = season.games.filter(g => ['regional', 'super', 'mcws'].includes(g.type) && mine(g));
  const ev = Object.values(p.confT || {}).find(e => e.seeds.includes(team));
  let conf = null;
  if (ev) {
    const gs = season.games.filter(g => g.event === ev.id && mine(g)).sort((a, b) => a.order - b.order || a.id - b.id);
    const losses = gs.filter(g => loserOf(g) === team);
    // Out: the tournament is over, or the team has lost out of it already.
    const out1 = ev.kind === 'single' || losses.some(g => g.node.startsWith('P-'));
    const done = !!ev.champion || losses.length >= (out1 ? 1 : 2);
    const last = losses[losses.length - 1];
    conf = { ...wl(gs), champ: ev.champion === team, out: done && ev.champion !== team && last ? (nodeOf(ev, last.node)?.label || '').replace(/ \(.*\)$/, '') : null, ev: ev.id };
  }
  return { ncaa: p.field?.some(f => f.team === team) || ncaaGames.length ? wl(ncaaGames) : null, conf };
}

export function allEvents(season) {
  const p = season.post || {};
  return [...Object.values(p.confT || {}), ...(p.regionals || []), ...(p.supers || []), ...(p.mcws ? [p.mcws] : []), ...(p.mcwsBrackets || []), ...(p.mcwsFinals ? [p.mcwsFinals] : [])];
}

// The two teams a bracket node will have (null where still undecided).
export function nodeTeams(ev, node) {
  const f = ref => { const t = resolve(ev, ref); return t === BYE ? 'BYE' : t; };
  return [f(node.a), f(node.b)];
}
export function nodeNeeded(ev, node) { return !node.cond || condMet(ev, node); }

// "Winner of SF-1" style text for an undecided slot.
export function refLabel(ev, ref) {
  if (!ref || 'seed' in ref) return null;
  const n = nodeOf(ev, ref.w || ref.l);
  return `${ref.w ? 'Winner' : 'Loser'} of ${n?.code || n?.key || '?'}`;
}

// Change a conference tournament's format before it starts.
export function setConfFormat(season, conf, kind) {
  season.settings.confFormat ||= {};
  season.settings.confFormat[conf] = kind;
  const ev = season.post?.confT?.[conf];
  if (!ev) return;
  const ids = new Set(ev.nodes.map(n => n.gameId).filter(Boolean));
  if (season.games.some(g => ids.has(g.id) && isFinal(g))) throw new Error('That tournament has already started.');
  season.games = season.games.filter(g => !ids.has(g.id));
  ev.kind = confKind(kind, ev.size);
  ev.nodes = buildConfNodes(ev.kind, ev.size);
  ev.champion = null;
}
