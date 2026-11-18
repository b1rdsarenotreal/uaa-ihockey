// Conference home and away (the owner's rule, Nov. 2026): no team plays more
// than two conference weekends in a row away from home, or more than three
// in a row at home; a mix of both. Run after the schedule is drawn: it only
// changes who hosts conference games (and, where the scheduler allows, moves
// a whole conference meeting to a week both teams have open), never who
// plays whom.
//
// A meeting is a pair's games in one week (a series, or a single game). Moves:
// - swap the hosts of two meetings of the same pair (home and away stays
//   even);
// - turn around a triangle of single meetings (a hosts b, b hosts c, c hosts
//   a): every team keeps its number of home games;
// - turn around one meeting, when a team's home games stay within one of
//   half;
// - (with `canMoveTo`) move a meeting to another week inside the
//   conference's weeks where neither team plays.
// Last year's hosts (`lastHost(a, b)`): a pair that meets once a year swaps
// hosts; that gives way only when the rule above needs it.

import { shuffle } from './util.js?v=20261117182452';

export const MAX_AWAY = 2;
export const MAX_HOME = 3;

const KEY = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

// Each team's worst runs of conference weeks away and at home.
export function homeAwayRuns(games, teams) {
  const by = {};
  for (const g of games) {
    if (g.type !== 'regular' || !g.confGame || g.neutral) continue;
    for (const t of [g.home, g.away]) ((by[t] ||= {})[g.week] ||= []).push(g.home === t);
  }
  const out = {};
  for (const [t, wk] of Object.entries(by)) {
    let a = 0, h = 0, prev = null, worstA = 0, worstH = 0;
    for (const w of Object.keys(wk).map(Number).sort((x, y) => x - y)) {
      if (prev != null && w - prev > 1) { a = 0; h = 0; }
      prev = w;
      a = wk[w].every(x => !x) ? a + 1 : 0; h = wk[w].every(x => x) ? h + 1 : 0;
      worstA = Math.max(worstA, a); worstH = Math.max(worstH, h);
    }
    out[t] = { away: worstA, home: worstH };
  }
  return out;
}

export function spreadConfHomes(games, teams, r, { skip = () => false, lastHost = () => null, canMoveTo = null, keepSwaps = false, iterations = null } = {}) {
  const byConf = {};
  for (const g of games) {
    if (g.type !== 'regular' || !g.confGame || g.neutral || g.final) continue;
    const conf = teams[g.home]?.conference;
    if (!conf || skip(conf)) continue;
    (byConf[conf] ||= []).push(g);
  }
  for (const list of Object.values(byConf)) spreadOne(list, games, r, { lastHost, canMoveTo, keepSwaps, iterations });
}

function spreadOne(confGames, allGames, r, { lastHost, canMoveTo, keepSwaps, iterations }) {
  // Meetings: a pair's games in one week. Mixed ones (a home-and-home in a
  // weekend) are left as they are but still count.
  const units = new Map();
  for (const g of confGames) {
    const k = `${g.week}#${KEY(g.home, g.away)}`;
    if (!units.has(k)) units.set(k, { games: [], pair: KEY(g.home, g.away), a: g.home, b: g.away });
    units.get(k).games.push(g);
  }
  const U = [...units.values()];
  const host = u => u.games[0].home, visitor = u => u.games[0].away;
  const flip = u => { for (const g of u.games) [g.home, g.away] = [g.away, g.home]; };
  const byPair = {};
  for (const u of U) (byPair[u.pair] ||= []).push(u);
  // With `keepSwaps`, a pair meeting once keeps last year's swap for sure.
  for (const u of U) u.fixed = u.games.some(g => g.home !== u.games[0].home) || (keepSwaps && byPair[u.pair].length === 1 && !!lastHost(u.a, u.b));
  const teamsIn = [...new Set(confGames.flatMap(g => [g.home, g.away]))];
  const homeOf = () => {
    const h = Object.fromEntries(teamsIn.map(t => [t, 0])), n = { ...h };
    for (const g of confGames) { h[g.home]++; n[g.home]++; n[g.away]++; }
    return { h, n };
  };
  const dev = ({ h, n }, t) => Math.abs(2 * h[t] - n[t]);
  const start = homeOf();
  // A team may end at most one meeting (a game, or a series) off half, or as
  // far off as it started.
  const size = Math.max(1, ...U.map(u => u.games.length));
  const allowed = Object.fromEntries(teamsIn.map(t => [t, Math.max(dev(start, t), 2 * size)]));
  // Weeks each team is busy (any game), for moving meetings.
  const busy = new Map();
  const mark = (t, w, d) => { const k = `${t}|${w}`; busy.set(k, (busy.get(k) || 0) + d); };
  if (canMoveTo) for (const g of allGames) { mark(g.home, g.week, 1); mark(g.away, g.week, 1); }
  const weeks = confGames.map(g => g.week);
  const lo = Math.min(...weeks), hi = Math.max(...weeks);

  // Cost: runs over the limit (100 each), runs right at the away limit (1, so
  // mixes are preferred), home games past the allowance (1000 a game), and a
  // once-a-year pair not swapping hosts from last year (30).
  const gamesOf = Object.fromEntries(teamsIn.map(t => [t, confGames.filter(g => g.home === t || g.away === t)]));
  const teamCost = t => {
    const wk = {};
    let home = 0;
    for (const g of gamesOf[t]) { (wk[g.week] ||= []).push(g.home === t); if (g.home === t) home++; }
    let c = 0, a = 0, h = 0, prev = null;
    for (const w of Object.keys(wk).map(Number).sort((x, y) => x - y)) {
      if (prev != null && w - prev > 1) { a = 0; h = 0; }
      prev = w;
      a = wk[w].every(x => !x) ? a + 1 : 0; h = wk[w].every(x => x) ? h + 1 : 0;
      if (a > MAX_AWAY) c += 100; if (h > MAX_HOME) c += 100;
      if (a === MAX_AWAY) c += 1;
    }
    return c + Math.max(0, Math.abs(2 * home - gamesOf[t].length) - allowed[t]) * 1000;
  };
  const unitCost = u => {
    if (byPair[u.pair].length !== 1) return 0;
    const last = lastHost(u.a, u.b);
    return last && host(u) === last ? 30 : 0;
  };
  const tc = Object.fromEntries(teamsIn.map(t => [t, teamCost(t)]));
  const uc = new Map(U.map(u => [u, unitCost(u)]));
  let cur = Object.values(tc).reduce((x, y) => x + y, 0) + [...uc.values()].reduce((x, y) => x + y, 0);
  // Try a change: apply it, keep it if the cost doesn't rise (sideways moves
  // now and then), else undo it.
  let improved = false;
  const attempt = (set, apply, undo) => {
    const ts = [...new Set(set.flatMap(u => [u.a, u.b]))];
    const before = ts.reduce((c, t) => c + tc[t], 0) + set.reduce((c, u) => c + uc.get(u), 0);
    apply();
    const nt = ts.map(teamCost), nu = set.map(unitCost);
    const after = nt.reduce((x, y) => x + y, 0) + nu.reduce((x, y) => x + y, 0);
    if (after < before || (after === before && r() < 0.3)) {
      ts.forEach((t, i) => { tc[t] = nt[i]; }); set.forEach((u, i) => uc.set(u, nu[i]));
      if (after < before) improved = true;
      cur += after - before;
    } else undo();
  };

  const moves = [];
  for (const us of Object.values(byPair)) {
    const free = us.filter(u => !u.fixed);
    // A pair meeting more than once keeps one meeting at each school: its
    // meetings only trade hosts.
    if (us.length === 1 && free.length) moves.push([free[0]]);
    for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) moves.push([free[i], free[j]]);
  }
  const singles = U.filter(u => !u.fixed && byPair[u.pair].length === 1);
  const triangle = () => {
    if (singles.length < 3) return null;
    const u = singles[Math.floor(r() * singles.length)];
    const v1 = singles.filter(x => host(x) === visitor(u));
    for (const v of shuffle(v1, r)) {
      const w = singles.find(x => host(x) === visitor(v) && visitor(x) === host(u));
      if (w) return [u, v, w];
    }
    return null;
  };
  const moveWeek = () => {
    const u = U[Math.floor(r() * U.length)];
    const from = u.games[0].week;
    const opts = [];
    for (let w = lo; w <= hi; w++) if (w !== from && canMoveTo(w) && !busy.get(`${u.a}|${w}`) && !busy.get(`${u.b}|${w}`)) opts.push(w);
    if (!opts.length) return null;
    return { u, from, to: opts[Math.floor(r() * opts.length)] };
  };
  const setWeek = (u, w) => {
    const from = u.games[0].week;
    for (const g of u.games) { mark(g.home, from, -1); mark(g.away, from, -1); g.week = w; mark(g.home, w, 1); mark(g.away, w, 1); }
  };

  // Two of the conference's weeks trade places when every team plays on the
  // same days in both (so nothing else that week has to move).
  const confWeeks = [...new Set(weeks)];
  const inWeek = w => confGames.filter(g => g.week === w);
  const sig = gs => gs.map(g => `${g.home}:${g.day}`).concat(gs.map(g => `${g.away}:${g.day}`)).sort().join(',');
  const swapWeeks = () => {
    if (confWeeks.length < 2) return null;
    const x = confWeeks[Math.floor(r() * confWeeks.length)], y = confWeeks[Math.floor(r() * confWeeks.length)];
    if (x === y) return null;
    const gx = inWeek(x), gy = inWeek(y);
    if (!gx.length || sig(gx) !== sig(gy)) return null;
    const us = U.filter(u => u.games[0].week === x || u.games[0].week === y);
    const go = () => { for (const g of gx) g.week = y; for (const g of gy) g.week = x; };
    const back = () => { for (const g of gx) g.week = x; for (const g of gy) g.week = y; };
    return { us, go, back };
  };

  const steps = iterations ?? 600 * U.length;
  // Stop when nothing is over the limits and a while has passed without a
  // better arrangement turning up.
  for (let it = 0, quiet = 0; it < steps && cur >= 1 && !(cur < 100 && quiet > 1500); it++) {
    if (improved) { quiet = 0; improved = false; } else quiet++;
    const kind = r();
    if (kind < 0.15) {
      const m = swapWeeks();
      if (m) attempt(m.us, m.go, m.back);
      continue;
    }
    if (canMoveTo && kind < 0.35) {
      const m = moveWeek();
      if (m) attempt([m.u], () => setWeek(m.u, m.to), () => setWeek(m.u, m.from));
      continue;
    }
    let set;
    if (kind < 0.55) set = triangle();
    else if (moves.length) set = moves[Math.floor(r() * moves.length)];
    if (set) attempt(set, () => set.forEach(flip), () => set.forEach(flip));
  }
}
