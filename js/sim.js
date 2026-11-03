// Ice hockey game simulator. Plays the game minute by minute from the teams'
// ratings: OFF (offense, stored as `off`), MID (two-way play and special
// teams, `pit`) and DEF (defense and goaltending, `def`). College rules
// (NCAA, 2026):
// - three 20-minute periods;
// - regular season: a game tied after 60 minutes plays one 5-minute
//   sudden-death overtime, and if it's still tied the game is a tie;
// - postseason (conference tournaments and the national tournament):
//   20-minute sudden-death overtimes until someone scores.
//
// The result keeps the field names the rest of the app uses for every game:
// homeLine / awayLine are goals per period (three periods, then any
// overtimes), R is goals, H is shots on goal, E is penalty minutes and
// `innings` is the number of periods played. A simulation is only a
// suggestion — the commissioner reviews and saves it.

import { rng as makeRng } from './util.js?v=20261103130650';

export const OVR_WEIGHTS = { off: 0.4, pit: 0.3, def: 0.3 };
const ovrExact = t => t.off * OVR_WEIGHTS.off + t.pit * OVR_WEIGHTS.pit + t.def * OVR_WEIGHTS.def;
export function ovr(t) { return Math.round(ovrExact(t)); }

export const QUARTERS = 3; // regulation periods (the shared code calls them quarters)
export const REG_OT = 5, POST_OT = 20;
export let OT = REG_OT; // shown in the score editor
export const OT_PERIODS = 5; // the most overtimes a hand entry offers
export const REG_MINUTES = 60;
export function setOvertime() {}
export function setPeriods() {}

const GOALS = 3.0;       // goals per team per 60 minutes between equal teams
const SHOTS = 30;        // shots on goal per team per 60 minutes
const TALENT = 38;       // rating points per unit of log goal rate (lower = fewer upsets)
const HOME = 0.08;       // home ice, on the log goal rate

function goalRate(att, opp, home, vol) {
  const x = ((att.off - opp.def) * 0.6 + (att.pit - opp.pit) * 0.4) / TALENT / vol + (home ? HOME / 2 : -HOME / 2);
  return GOALS * Math.exp(x);
}

// Games that can't end in a tie: every postseason game.
export const isKnockout = g => !!g && g.type !== 'regular';
export const otMinutesFor = g => (isKnockout(g) ? POST_OT : REG_OT);

// Play `minutes` minutes. With `golden`, stop at the first goal. Shots on
// goal (H) and penalty minutes (E) are counted as they happen.
function playPeriod(minutes, rate, shotRate, r, stats, golden) {
  const goals = { home: 0, away: 0 };
  for (let m = 0; m < minutes * 2; m++) {
    for (const side of ['home', 'away']) {
      if (r() < 3.6 / REG_MINUTES / 2) stats[side].E += r() < 0.08 ? 5 : 2;
      if (r() >= shotRate[side] / REG_MINUTES / 2) continue;
      stats[side].H++;
      if (r() < Math.min(0.5, rate[side] / shotRate[side])) goals[side]++;
      if (golden && goals.home !== goals.away) return goals; // sudden death
    }
  }
  return goals;
}

export function simulateGame(homeTeam, awayTeam, game = {}, { seed, volatility = 1 } = {}) {
  const r = makeRng(seed);
  const neutral = !!game.neutral;
  const rate = { home: goalRate(homeTeam, awayTeam, !neutral, volatility), away: goalRate(awayTeam, homeTeam, false, volatility) };
  if (neutral) rate.away *= Math.exp(HOME / 2), rate.home *= Math.exp(-HOME / 2);
  const lean = side => Math.sqrt(rate[side] / GOALS);
  const shotRate = { home: SHOTS * lean('home'), away: SHOTS * lean('away') };
  const stats = { home: { H: 0, E: 0 }, away: { H: 0, E: 0 } };
  const homeLine = [], awayLine = [];
  for (let q = 0; q < QUARTERS; q++) {
    const g = playPeriod(20, rate, shotRate, r, stats, false);
    homeLine.push(g.home); awayLine.push(g.away);
  }
  const total = l => l.reduce((a, b) => a + b, 0);
  if (total(homeLine) === total(awayLine)) {
    if (isKnockout(game)) {
      for (let ot = 0; total(homeLine) === total(awayLine); ot++) {
        const g = playPeriod(POST_OT, rate, shotRate, r, stats, true);
        if (ot >= 6 && g.home === g.away) g[r() < 0.5 ? 'home' : 'away'] = 1; // a guard
        homeLine.push(g.home); awayLine.push(g.away);
      }
    } else {
      const g = playPeriod(REG_OT, rate, shotRate, r, stats, true);
      homeLine.push(g.home); awayLine.push(g.away);
    }
  }
  return {
    homeLine, awayLine,
    home: { R: total(homeLine), H: stats.home.H, E: stats.home.E },
    away: { R: total(awayLine), H: stats.away.H, E: stats.away.E },
    innings: homeLine.length, runRule: false, pk: null,
  };
}

// Shots on goal and penalty minutes for a score entered by hand: about 30
// shots a team (more for the stronger team, never fewer than the goals) and
// 8 penalty minutes.
export function estimateHitsErrors(homeTeam, awayTeam, game, homeLine, awayLine, { seed } = {}) {
  const r = makeRng(seed ?? 1);
  const goals = l => l.reduce((a, b) => a + (Number(b) || 0), 0);
  const ot = Math.max(0, homeLine.length - QUARTERS);
  const minutes = REG_MINUTES + (ot ? (isKnockout(game) ? POST_OT * (ot - 0.5) : REG_OT / 2) : 0);
  const one = (g, me, opp) => {
    const lean = Math.exp(((me.off - opp.def) * 0.6 + (me.pit - opp.pit) * 0.4) / TALENT / 2);
    const H = Math.max(g, Math.round((26 * lean + g * 1.2 + r() * 8 - 4) * minutes / REG_MINUTES));
    const E = 2 * Math.round(2 + r() * 4);
    return { H, E };
  };
  return { home: one(goals(homeLine), homeTeam, awayTeam), away: one(goals(awayLine), awayTeam, homeTeam) };
}

// Home team's chances over 60 minutes (win, tie, loss) from a Poisson model
// of the two goal rates; in the regular season about a third of the ties
// are settled in overtime.
export function matchOdds(homeTeam, awayTeam, game = {}, { volatility = 1 } = {}) {
  const neutral = !!game.neutral;
  let lh = goalRate(homeTeam, awayTeam, !neutral, volatility), la = goalRate(awayTeam, homeTeam, false, volatility);
  if (neutral) la *= Math.exp(HOME / 2), lh *= Math.exp(-HOME / 2);
  const pois = (l, k) => { let p = Math.exp(-l); for (let i = 1; i <= k; i++) p *= l / i; return p; };
  let win = 0, tie = 0, loss = 0;
  for (let i = 0; i <= 14; i++) for (let j = 0; j <= 14; j++) {
    const p = pois(lh, i) * pois(la, j);
    if (i > j) win += p; else if (i === j) tie += p; else loss += p;
  }
  const n = win + tie + loss;
  win /= n; tie /= n; loss /= n;
  // Overtime: decided at the goal-rate ratio, sudden death.
  const share = lh / (lh + la);
  const decided = isKnockout(game) ? 1 : 1 - Math.exp(-(lh + la) * REG_OT / REG_MINUTES);
  return { win: win + tie * decided * share, tie: tie * (1 - decided), loss: loss + tie * decided * (1 - share), margin: lh - la };
}

// Home team's chance to win (a tie counts half).
export function winProbability(homeTeam, awayTeam, game = {}, opts = {}) {
  const o = matchOdds(homeTeam, awayTeam, game, opts);
  return o.win + o.tie / 2;
}

// Slower check of the formula above by simulating the matchup.
export function simulatedWinRate(homeTeam, awayTeam, game = {}, opts = {}, n = 2000) {
  let wins = 0;
  for (let i = 0; i < n; i++) {
    const res = simulateGame(homeTeam, awayTeam, game, { ...opts, seed: i * 7919 + 1 });
    if (res.home.R > res.away.R) wins++; else if (res.home.R === res.away.R) wins += 0.5;
  }
  return wins / n;
}
