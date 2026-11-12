// Records, conference standings with tiebreakers, the RPI and the NPI.

import { pct, hashStr } from './util.js?v=20261111234538';

export const isFinal = g => g.final && g.homeR != null && g.awayR != null;
// A regular-season game still tied after its 5-minute overtime is a tie: a
// T in the record and 1 point in the conference standings (a win 3).
// Postseason games always have a winner. (`pk` is never set.)
export const isTie = g => g.homeR === g.awayR && !g.pk;
// Who won (or, after penalties, advanced); null for a regular-season tie.
export const winnerOf = g => (g.homeR > g.awayR ? g.home : g.homeR < g.awayR ? g.away : g.pk ? (g.pk.home > g.pk.away ? g.home : g.away) : null);
export const loserOf = g => { const w = winnerOf(g); return w == null ? null : w === g.home ? g.away : g.home; };
// 'W' or 'L' for team t, 'T' only for a tied (unfinished) entry.
export const resultFor = (g, t) => (isTie(g) ? 'T' : winnerOf(g) === t ? 'W' : 'L');
// Points for a result: 3 a win, 1 a tie.
export const POINTS = { W: 3, T: 1, L: 0 };
// Conference points from a record.
export const confPts = r => 3 * r.cw + r.ct;

function blank() {
  return { w: 0, l: 0, t: 0, cw: 0, cl: 0, ct: 0, hw: 0, hl: 0, ht: 0, aw: 0, al: 0, at: 0, nw: 0, nl: 0, nt: 0, rs: 0, ra: 0, streak: '', results: [] };
}

// filter(g) narrows which games count (e.g. through a given week).
export function records(season, filter = null) {
  const out = {};
  for (const t of Object.keys(season.teams)) out[t] = blank();
  const games = season.games.filter(g => isFinal(g) && (!filter || filter(g))).sort((a, b) => a.week - b.week || a.order - b.order || a.id - b.id);
  for (const g of games) {
    for (const [t, rs, ra, where] of [[g.home, g.homeR, g.awayR, g.neutral ? 'n' : 'h'], [g.away, g.awayR, g.homeR, g.neutral ? 'n' : 'a']]) {
      const r = out[t];
      if (!r) continue;
      const res = resultFor(g, t), k = res.toLowerCase();
      r[k]++;
      r[where + k]++;
      if (g.type === 'regular' && g.confGame) r['c' + k]++;
      r.rs += rs; r.ra += ra;
      r.results.push(res);
    }
  }
  for (const r of Object.values(out)) {
    const res = r.results;
    if (res.length) {
      const last = res[res.length - 1];
      let n = 0;
      for (let i = res.length - 1; i >= 0 && res[i] === last; i--) n++;
      r.streak = `${last}${n}`;
    }
  }
  return out;
}

// Rating Percentage Index: 25% winning pct, 50% opponents' winning pct
// (excluding games against the team), 25% opponents' opponents' pct.
export function rpi(season, filter = null) {
  const games = season.games.filter(g => isFinal(g) && (!filter || filter(g)));
  const teams = Object.keys(season.teams);
  const opps = {}, wl = {}, vs = {};
  for (const t of teams) { opps[t] = []; wl[t] = { w: 0, n: 0 }; vs[t] = {}; }
  for (const g of games) {
    for (const [t, o] of [[g.home, g.away], [g.away, g.home]]) {
      if (!wl[t]) continue;
      // A win counts 1, a tie half.
      const x = { W: 1, T: 0.5, L: 0 }[resultFor(g, t)];
      wl[t].n++; wl[t].w += x;
      opps[t].push(o);
      const v = (vs[t][o] ||= { w: 0, n: 0 });
      v.n++; v.w += x;
    }
  }
  const wp = t => (wl[t]?.n ? wl[t].w / wl[t].n : 0);
  const wpExcl = (o, t) => {
    const a = wl[o]; if (!a) return 0;
    const v = vs[o][t] || { w: 0, n: 0 };
    const n = a.n - v.n;
    return n > 0 ? (a.w - v.w) / n : 0;
  };
  const owp = {};
  for (const t of teams) owp[t] = opps[t].length ? opps[t].reduce((s, o) => s + wpExcl(o, t), 0) / opps[t].length : 0;
  const out = {};
  for (const t of teams) {
    const oowp = opps[t].length ? opps[t].reduce((s, o) => s + (owp[o] ?? 0), 0) / opps[t].length : 0;
    // Strength of schedule: opponents' winning pct (2/3) and their
    // opponents' (1/3), the NCAA's usual SOS formula.
    let ow = 0, ol = 0;
    for (const o of new Set(opps[t])) {
      const times = opps[t].filter(x => x === o).length, a = wl[o], v = vs[o][t] || { w: 0, n: 0 };
      if (!a) continue;
      ow += times * (a.w - v.w); ol += times * ((a.n - v.n) - (a.w - v.w));
    }
    out[t] = { wp: wp(t), owp: owp[t], oowp, rpi: 0.25 * wp(t) + 0.5 * owp[t] + 0.25 * oowp, sos: (2 * owp[t] + oowp) / 3, oppW: ow, oppL: ol, games: wl[t].n };
  }
  const ranked = teams.filter(t => out[t].games).sort((a, b) => out[b].rpi - out[a].rpi);
  ranked.forEach((t, i) => { out[t].rank = i + 1; });
  teams.filter(t => out[t].games).sort((a, b) => out[b].sos - out[a].sos).forEach((t, i) => { out[t].sosRank = i + 1; });
  return out;
}

// The power index: the NCAA Power Index (NPI) by default, the RPI in older
// seasons (settings.index). Both come back in the same shape, the index value
// in `rpi` (the shared code's name for it), with `rank` and `sosRank`.
export const usesNpi = season => season?.settings?.index === 'npi';
export const indexName = season => (usesNpi(season) ? 'NPI' : 'RPI');
export function rating(season, filter = null) {
  return usesNpi(season) ? npi(season, filter) : rpi(season, filter);
}

// The NCAA's Division III ice hockey NPI dials (2025-26): 25% winning
// percentage, 75% strength of schedule; away wins and home losses weigh 1.1,
// home wins and away losses 0.9; a regular-season overtime win is 0.67 of a
// win (and 0.33 of a loss), a postseason one a full win; a tie is half of
// each; a win over a team above 53.00 earns (its NPI - 53) x 0.5; and a team
// keeps at least 9 wins, dropping any others that would lower its NPI.
export const NPI_DIALS = { win: 25, sos: 75, away: 1.1, home: 0.9, otWin: 0.67, qwbBase: 53, qwbMult: 0.5, minWins: 9 };
const REG_PERIODS = 3;

// A team's NPI is the weighted average of its game values. A game splits
// into a win share w and a loss share 1 - w: the win share is worth
// win + sos% x the opponent's NPI + the quality-win bonus, the loss share
// sos% x the opponent's NPI, each weighted by where it was played. Every
// team starts at 50 and the values are worked out again until they settle.
export function npi(season, filter = null, dials = { ...NPI_DIALS, ...(season.settings?.npi || {}) }) {
  const D = dials, sosW = D.sos / 100;
  const games = season.games.filter(g => isFinal(g) && (!filter || filter(g)));
  const teams = Object.keys(season.teams);
  const list = {};
  for (const t of teams) list[t] = [];
  for (const g of games) {
    const ot = (g.homeLine?.length || 0) > REG_PERIODS;
    for (const [t, o, where] of [[g.home, g.away, g.neutral ? 'n' : 'h'], [g.away, g.home, g.neutral ? 'n' : 'a']]) {
      if (!list[t] || !season.teams[o]) continue;
      const res = resultFor(g, t);
      const full = g.type !== 'regular' || !ot;
      const w = res === 'T' ? 0.5 : res === 'W' ? (full ? 1 : D.otWin) : (full ? 0 : 1 - D.otWin);
      list[t].push({ o, w, res, ww: where === 'a' ? D.away : where === 'h' ? D.home : 1, lw: where === 'h' ? D.away : where === 'a' ? D.home : 1 });
    }
  }
  let val = Object.fromEntries(teams.map(t => [t, 50]));
  // The quality-win bonus is figured from the opponents' base NPI (worked
  // out without bonuses), added once at the end: fed back into the
  // iteration, a bonus worth half of every point above the base on top of
  // the SOS share can grow without bound in a small league.
  let bonus = 0;
  const sum = (gs, v) => {
    let num = 0, den = 0;
    for (const x of gs) {
      const opp = v[x.o] ?? 50, qwb = opp > D.qwbBase ? (opp - D.qwbBase) * D.qwbMult * bonus : 0;
      num += x.w * x.ww * (D.win + sosW * opp + qwb) + (1 - x.w) * x.lw * sosW * opp;
      den += x.w * x.ww + (1 - x.w) * x.lw;
    }
    return { num, den };
  };
  const solve = (t, v) => {
    const gs = list[t];
    if (!gs.length) return { value: 50, kept: [] };
    // Wins can be dropped; everything else stays. Keep the best minWins
    // wins, then add the rest from best to worst while they raise the NPI.
    const wins = gs.filter(x => x.res === 'W').map(x => ({ x, v: D.win + sosW * (v[x.o] ?? 50) + Math.max(0, ((v[x.o] ?? 50) - D.qwbBase) * D.qwbMult * bonus) }))
      .sort((a, b) => b.v - a.v);
    const kept = gs.filter(x => x.res !== 'W');
    let k = 0;
    for (; k < Math.min(D.minWins, wins.length); k++) kept.push(wins[k].x);
    let { num, den } = sum(kept, v);
    for (; k < wins.length; k++) {
      if (den && wins[k].v <= num / den) break;
      const s = sum([wins[k].x], v); num += s.num; den += s.den; kept.push(wins[k].x);
    }
    return { value: den ? num / den : 50, kept };
  };
  for (let it = 0; it < 200; it++) {
    const next = {};
    let diff = 0;
    for (const t of teams) { next[t] = solve(t, val).value; diff = Math.max(diff, Math.abs(next[t] - val[t])); }
    val = next;
    if (diff < 1e-6) break;
  }
  bonus = 1;
  const out = {};
  for (const t of teams) {
    const { value, kept } = solve(t, val);
    const n = kept.length, w = kept.reduce((s, x) => s + x.w, 0);
    const qwb = kept.reduce((s, x) => s + (x.w && val[x.o] > D.qwbBase ? x.w * (val[x.o] - D.qwbBase) * D.qwbMult * bonus : 0), 0);
    const adj = { w: kept.filter(x => x.res === 'W').length, l: kept.filter(x => x.res === 'L').length, t: kept.filter(x => x.res === 'T').length };
    out[t] = {
      npi: value, rpi: value, wp: n ? w / n : 0, sos: n ? kept.reduce((s, x) => s + val[x.o], 0) / n : 0, qwb,
      adj, dropped: list[t].length - n, games: list[t].length,
    };
  }
  const ranked = teams.filter(t => out[t].games).sort((a, b) => out[b].rpi - out[a].rpi);
  ranked.forEach((t, i) => { out[t].rank = i + 1; });
  teams.filter(t => out[t].games).sort((a, b) => out[b].sos - out[a].sos).forEach((t, i) => { out[t].sosRank = i + 1; });
  return out;
}

// NCAA team-sheet quadrants. A game's quadrant depends on the opponent's RPI
// rank and where it was played, as on the NCAA's own sheets. These are the
// cut-offs for a 300-team league; they scale with league size (quadCuts):
//   Q1: home 1-30, neutral 1-50, away 1-75
//   Q2: home 31-75, neutral 51-100, away 76-135
//   Q3: home 76-160, neutral 101-200, away 136-240
//   Q4: everything else
// `rec[i]` is each team's record in Quadrant i+1. `q` is the quadrant a home
// game against the team would count as (used for display).
export const QUAD_CUTS = { home: [30, 75, 160], neutral: [50, 100, 200], away: [75, 135, 240] };
export function gameLocation(g, t) {
  if (g.site) return g.site === t ? 'home' : 'away';
  if (g.neutral) return 'neutral';
  return g.home === t ? 'home' : 'away';
}
// The cut-offs for a league of `teamCount` teams, by location.
export function quadCuts(teamCount = 300) {
  const k = teamCount / 300;
  return Object.fromEntries(Object.entries(QUAD_CUTS).map(([loc, cuts]) => [loc, cuts.map(c => Math.max(1, Math.round(c * k)))]));
}
export function quadOf(rank, loc, teamCount = 300) {
  if (!rank) return 4;
  const all = quadCuts(teamCount), cuts = all[loc] || all.neutral;
  const i = cuts.findIndex(c => rank <= c);
  return i < 0 ? 4 : i + 1;
}
export function quadrants(season, r = rating(season), filter = null) {
  const teams = Object.keys(season.teams), n = teams.length;
  const out = {};
  for (const t of teams) out[t] = { q: quadOf(r[t]?.rank, 'home', n), rec: [0, 1, 2, 3].map(() => ({ w: 0, l: 0, t: 0 })) };
  for (const g of season.games) {
    if (!isFinal(g) || (filter && !filter(g))) continue;
    for (const [t, o] of [[g.home, g.away], [g.away, g.home]]) {
      if (!out[t] || !out[o]) continue;
      const x = out[t].rec[quadOf(r[o]?.rank, gameLocation(g, t), n) - 1];
      x[resultFor(g, t).toLowerCase()]++;
    }
  }
  return out;
}

// One number for a team's quadrant résumé: wins count more the better the
// quadrant, losses cost more the worse the quadrant, and a tie is half of
// each.
export const QUAD_WIN = [4, 2, 1, 0.25], QUAD_LOSS = [0, 0.5, 2, 4];
export function quadScore(x) {
  return x.rec.reduce((a, q, i) => a + (q.w + (q.t || 0) / 2) * QUAD_WIN[i] - (q.l + (q.t || 0) / 2) * QUAD_LOSS[i], 0);
}

// Conference games only: each team's record against a set of opponents.
function recordVs(season, teams, opps) {
  const tset = new Set(teams), oset = new Set(opps), res = {};
  for (const t of teams) res[t] = { w: 0, l: 0, t: 0 };
  for (const g of season.games) {
    if (!isFinal(g) || g.type !== 'regular' || !g.confGame) continue;
    for (const [t, o] of [[g.home, g.away], [g.away, g.home]]) {
      if (!tset.has(t) || !oset.has(o) || t === o) continue;
      res[t][resultFor(g, t).toLowerCase()]++;
    }
  }
  return res;
}

// Split `group` into tiers by a score (higher first). Returns null when the
// score doesn't separate anyone.
function tiers(group, score) {
  const vals = new Map(group.map(t => [t, score(t)]));
  const distinct = [...new Set(vals.values())].sort((a, b) => b - a);
  if (distinct.length < 2) return null;
  return distinct.map(v => group.filter(t => vals.get(t) === v));
}

export const TIEBREAKERS = [
  'Conference points (3 for a win, 1 for a tie)',
  'Head-to-head points among all the tied teams (teams still tied start over with head-to-head among just them)',
  'Points against common conference opponents, starting with the highest-placed opponent and working down',
  'NPI (the RPI in seasons before the switch)',
  'Coin flip',
];

// Points per game from a record (3 a win, 1 a tie).
const ppm = x => { const n = x.w + x.l + x.t; return n ? (3 * x.w + x.t) / n : 0; };
// Order teams tied on conference points. Each step that splits
// the group sends every smaller group that is still tied back to
// head-to-head. `why[t]` records the step that last separated a team.
function breakTie(season, conf, group, others, r, why) {
  if (group.length < 2) return group;
  const recurse = (split, label) => split.flatMap(sub => {
    if (sub.length === 1) { why[sub[0]] = label; return sub; }
    for (const t of sub) why[t] = label;
    return breakTie(season, conf, sub, others, r, why);
  });
  // Head-to-head, only when every tied team has played the others.
  const hh = recordVs(season, group, group);
  if (group.every(t => hh[t].w + hh[t].l + hh[t].t > 0)) {
    const split = tiers(group, t => ppm(hh[t]));
    if (split) return recurse(split, { step: 'h2h', text: 'Head-to-head' });
  }
  // Common opponents, from the top of the standings down. Opponents tied
  // with each other are taken together.
  const vs = t => new Set(season.games.filter(g => isFinal(g) && g.type === 'regular' && g.confGame && (g.home === t || g.away === t)).map(g => (g.home === t ? g.away : g.home)));
  const played = group.map(vs);
  for (const block of others) {
    const common = block.filter(o => played.every(p => p.has(o)));
    if (!common.length) continue;
    const rec = recordVs(season, group, common);
    const split = tiers(group, t => ppm(rec[t]));
    if (split) return recurse(split, { step: 'common', text: `Record vs ${common.join(', ')}` });
  }
  const byRpi = tiers(group, t => r[t]?.rpi ?? 0);
  if (byRpi) return recurse(byRpi, { step: 'rpi', text: indexName(season) });
  // Coin flip: fixed for the season, so the order doesn't change on reload.
  const flip = t => hashStr(`${season.year}|${conf}|${[...group].sort().join('|')}|${t}`);
  for (const t of group) why[t] = { step: 'coin', text: 'Coin flip' };
  return [...group].sort((a, b) => flip(a) - flip(b));
}

// Conference table, best first, with points (3 a win, 1 a tie) and points
// behind the leader (`gb`). Each row's `tb` says which tiebreaker placed it,
// when it was tied. Every member plays the same number of conference games,
// so points rank fairly.
export function confStandings(season, conf, recs = records(season), r = rating(season)) {
  const teams = Object.values(season.teams).filter(t => t.conference === conf).map(t => t.school);
  const cp = t => confPts(recs[t]);
  const groups = [];
  for (const t of [...teams].sort((a, b) => cp(b) - cp(a) || a.localeCompare(b))) {
    const last = groups[groups.length - 1];
    if (last && cp(last[0]) === cp(t)) last.push(t); else groups.push([t]);
  }
  const why = {};
  const out = groups.flatMap(g => breakTie(season, conf, g, groups.filter(x => x !== g), r, why));
  const lead = out[0];
  return out.map(t => ({
    team: t, ...recs[t],
    pts: confPts(recs[t]),
    gb: lead ? confPts(recs[lead]) - confPts(recs[t]) : 0,
    rpiRank: r[t]?.rank ?? null,
    tb: why[t] || null,
  }));
}

// Independent teams belong to no conference: no conference games, title,
// tournament or automatic bid.
export const INDEPENDENT = 'Independent';
export const isIndependent = c => c === INDEPENDENT;
// Conference rivals (independents are never rivals of each other).
export const sameConf = (teams, a, b) => teams[a]?.conference === teams[b]?.conference && !isIndependent(teams[a]?.conference);

export function conferences(season) {
  return [...new Set(Object.values(season.teams).map(t => t.conference))].filter(c => !isIndependent(c)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function regularSeasonDone(season) {
  return season.games.filter(g => g.type === 'regular').every(isFinal);
}

// Regular-season champions: every team tied for the most conference points
// shares the title (a commissioner override names one champion).
export function regSeasonChamps(season, conf, recs = records(season, g => g.type === 'regular'), r = rating(season, g => g.type === 'regular')) {
  if (isIndependent(conf)) return [];
  if (season.overrides?.regChamps?.[conf]) return [season.overrides.regChamps[conf]];
  const st = confStandings(season, conf, recs, r);
  if (!st.length || st[0].cw + st[0].cl + st[0].ct === 0) return [];
  const best = st[0].pts;
  return st.filter(x => x.cw + x.cl + x.ct > 0 && x.pts === best).map(x => x.team);
}

// The one team that takes the top spot: the regular-season champion, or the
// co-champion that wins the tiebreakers (commissioner override wins). This is
// the tournament's top seed and, with no tournament, the automatic bid.
export function regSeasonChamp(season, conf, recs, r) {
  if (season.overrides?.regChamps?.[conf]) return season.overrides.regChamps[conf];
  const st = confStandings(season, conf, recs, r);
  return st.length && (st[0].cw + st[0].cl + st[0].ct) > 0 ? st[0].team : null;
}
