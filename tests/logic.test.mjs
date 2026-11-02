// Logic tests: run with `node tests/logic.test.mjs`
import assert from 'node:assert/strict';
import { ALIGNMENT, newLeague, currentSeason, simGames, startNextSeason, beginOffseason, draftWarnings, clearResult, estimateHE, migrateLeague, addConference, rebuildSchedule, weekName, defaultSettings } from '../js/league.js';
import { simulateGame, winProbability, simulatedWinRate, matchOdds, ovr } from '../js/sim.js';
import { DEFAULT_REG_WEEKS, dateOf, breakWeek } from '../js/schedule.js';
import { isFinal, isTie, winnerOf, resultFor } from '../js/standings.js';
import { gameVenue, postseasonFinish, postseasonRecord, wsTeams, ncaaProblems, fieldSize, DEFAULT_NCAA, postWeeks, aqConferences, autoBids } from '../js/postseason.js';
import { recordBook } from '../js/records.js';
import { readAauLogos, applyAauLogos } from '../js/logo-import.js';
import { seedTeams, splitOvr, COACHES, MEN_COACHES, CONFERENCES, SIDES } from '../js/data.js';
import { existsSync } from 'node:fs';
import { rng } from '../js/util.js';

const t0 = Date.now();
let n = 0;
const check = (name, fn) => {
  try { fn(); } catch (e) { console.error(`✗ ${name}`); throw e; }
  n++;
};
const reg = s => s.games.filter(g => g.type === 'regular');
const count = (games, pick = () => true) => { const c = {}; for (const g of games) for (const t of [g.home, g.away]) if (pick(g, t)) c[t] = (c[t] || 0) + 1; return c; };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const absDay = g => g.week * 7 + DAYS.indexOf(g.day);

check("the AAU hockey programs: women's in the commissioner's conferences, men's in West and East", () => {
  assert.deepEqual(Object.keys(SIDES), ['women', 'men']);
  const W = seedTeams('women'), M = seedTeams('men');
  assert.equal(Object.keys(W).length, 13); assert.equal(Object.keys(M).length, 17);
  const sizes = T => { const z = {}; for (const t of Object.values(T)) z[t.conference] = (z[t.conference] || 0) + 1; return z; };
  assert.deepEqual(sizes(W), { 'Big Ten': 4, 'Ivy League': 6, 'Metro Conference': 3 });
  assert.deepEqual(sizes(M), { 'Eastern Hockey Conference': 9, 'Western Hockey Conference': 8 });
  for (const T of [W, M]) {
    assert.ok(Object.values(T).every(t => t.stadium && t.city && t.color && t.mascot), 'rinks, cities, colors, mascots');
    for (const t of Object.values(T)) assert.ok(Math.abs(ovr(t) - (t.off * 0.4 + t.pit * 0.3 + t.def * 0.3)) < 1);
  }
  assert.equal(M.Michigan.coach, 'Brandon Naurato'); assert.equal(W.Wisconsin.coach, 'Mark Johnson');
  assert.equal(M.Wisconsin.stadium, 'Kohl Center'); assert.equal(W.Wisconsin.stadium, 'LaBahn Arena');
  assert.ok(ovr(W.Wisconsin) >= 92, 'the 2026 women\'s champion leads');
  assert.equal(new Set(Object.values(MEN_COACHES)).size, Object.keys(MEN_COACHES).length);
  for (const c of Object.keys(CONFERENCES)) if (CONFERENCES[c].logo) assert.ok(existsSync(new URL(`../${CONFERENCES[c].logo}`, import.meta.url)), `${c} logo`);
  assert.equal(newLeague({ side: 'men' }).sport, 'hockey');
});

check('games: three periods; regular-season overtime then a tie; postseason sudden death', () => {
  const T = seedTeams('men'), A = T.Cornell, B = T.Harvard;
  let ties = 0, ots = 0, goals = 0;
  const N = 3000;
  for (let i = 0; i < N; i++) {
    const r = simulateGame(A, B, { type: 'regular' }, { seed: i + 1 });
    assert.ok(r.homeLine.length === 3 || r.homeLine.length === 4);
    assert.equal(r.home.R, r.homeLine.reduce((a, b) => a + b, 0));
    if (r.homeLine.length === 4) { ots++; assert.ok(r.homeLine[3] + r.awayLine[3] <= 1, 'sudden death'); }
    if (r.home.R === r.away.R) { ties++; assert.equal(r.homeLine.length, 4, 'a tie only after overtime'); }
    goals += r.home.R + r.away.R;
    const p = simulateGame(A, B, { type: 'regional' }, { seed: i + 1 });
    assert.notEqual(p.home.R, p.away.R, 'no postseason ties');
  }
  console.log(`  ${(goals / N / 2).toFixed(2)} goals per team, ${(100 * ots / N).toFixed(1)}% overtime, ${(100 * ties / N).toFixed(1)}% ties`);
  assert.ok(goals / N / 2 > 2.5 && goals / N / 2 < 3.8);
  assert.ok(ties > 0 && ties < ots);
  const o = matchOdds(A, B, { type: 'regular' });
  assert.ok(Math.abs(o.win + o.tie + o.loss - 1) < 1e-9 && o.tie > 0.05);
  const est = winProbability(A, B, { type: 'regular' }), simd = simulatedWinRate(A, B, { type: 'regular' }, {}, 1500);
  assert.ok(Math.abs(est - simd) < 0.05, `win chance ${est.toFixed(2)} vs simulated ${simd.toFixed(2)}`);
  const g = { type: 'regular', home: 'A', away: 'B', homeR: 2, awayR: 2, final: true, homeLine: [1, 1, 0, 0], awayLine: [0, 1, 1, 0] };
  assert.ok(isTie(g)); assert.equal(resultFor(g, 'A'), 'T'); assert.equal(winnerOf(g), null);
  const L = newLeague(), s = currentSeason(L), x = reg(s)[0];
  const e = estimateHE(s, x, [1, 2, 0], [0, 1, 1]);
  assert.ok(e.home.H >= 3 && e.home.E >= 2);
});

for (const side of ['women', 'men']) check(`${side}'s schedule: weekend series, everyone met`, () => {
  const L = newLeague({ side }), s = currentSeason(L), g = reg(s);
  assert.equal(dateOf(s.year, 1, 'Mon').toISOString().slice(0, 10), '2030-10-07', 'the first Monday in October');
  assert.ok(g.every(x => ['Fri', 'Sat'].includes(x.day)), 'Friday and Saturday');
  for (const x of g) assert.ok(!breakWeek(s.year, x.week), 'no games over the holiday break');
  const seen = new Set();
  for (const x of g) for (const t of [x.home, x.away]) { const k = `${t}|${x.week}|${x.day}`; assert.ok(!seen.has(k), k); seen.add(k); }
  const meets = {};
  for (const x of g) (meets[[x.home, x.away].sort().join('|')] ||= []).push(x);
  const names = Object.keys(s.teams);
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const [a, b] = [names[i], names[j]], list = meets[[a, b].sort().join('|')] || [];
    const conf = s.teams[a].conference === s.teams[b].conference;
    const homes = list.map(x => x.home);
    if (side === 'men') {
      if (conf) { assert.equal(list.length, 2, `${a}-${b}`); assert.equal(list[0].week, list[1].week, 'one weekend'); assert.notEqual(homes[0], homes[1], 'home and home'); assert.ok(list.every(x => x.confGame)); }
      else { assert.equal(list.length, 1, `${a}-${b} once`); assert.ok(!list[0].confGame); }
    } else if (conf) {
      assert.equal(list.length, 4, `${a}-${b}`);
      assert.equal(homes.filter(h => h === a).length, 2, 'a series at each rink');
    } else { assert.equal(list.length, 2, `${a}-${b}: one series`); assert.equal(list[0].week, list[1].week); assert.equal(homes[0], homes[1]); }
  }
  const totals = Object.values(count(g));
  console.log(`  ${side}: ${Math.min(...totals)}–${Math.max(...totals)} games per team over ${s.regWeeks} weeks`);
  assert.ok(s.regWeeks <= DEFAULT_REG_WEEKS + 2);
});

check('automatic bids for conferences of 4 or more; 8-team format; week names', () => {
  const L = newLeague(), s = currentSeason(L);
  assert.deepEqual(aqConferences(s).sort(), ['Big Ten', 'Ivy League']);
  assert.equal(aqConferences(currentSeason(newLeague({ side: 'men' }))).length, 2);
  assert.equal(fieldSize(DEFAULT_NCAA), 8);
  assert.deepEqual(ncaaProblems(DEFAULT_NCAA, 13), []);
  const W = postWeeks(s);
  assert.equal(weekName(W.regional, s), 'Quarterfinals');
  assert.equal(weekName(W.mcws, s), 'Frozen Four');
  const g = reg(s).find(x => !x.neutral);
  assert.equal(gameVenue(s, g).stadium, s.teams[g.home].stadium);
});

const leagues = {};
for (const side of ['women', 'men']) {
  const league = newLeague({ side });
  const s = currentSeason(league);
  simGames(s, undefined, { autoLock: true, max: 9000 });
  leagues[side] = league;
  check(`${side}'s season: conference tournaments, campus quarterfinals, the Frozen Four`, () => {
    assert.equal(s.phase, 'complete');
    const R = reg(s);
    assert.ok(R.every(isFinal));
    assert.ok(R.some(isTie), 'regular-season ties happen');
    assert.ok(!s.games.filter(g => g.type !== 'regular').some(isTie), 'no postseason ties');
    for (const ev of Object.values(s.post.confT)) assert.equal(ev.size, 4);
    assert.equal(s.post.field.length, 8);
    for (const ev of s.post.regionals) {
      const [g] = s.games.filter(x => x.event === ev.id);
      assert.ok(!g.neutral && g.home === ev.seeds[0], 'the higher seed hosts the quarterfinal');
    }
    const ff = s.games.filter(g => g.type === 'mcws');
    assert.equal(ff.length, 3);
    assert.ok(ff.every(g => g.neutral && gameVenue(s, g).stadium === s.settings.mcwsVenue));
    assert.deepEqual(ff.map(g => g.day).sort(), side === 'men' ? ['Sat', 'Thu', 'Thu'] : ['Fri', 'Fri', 'Sun']);
    assert.equal(postseasonFinish(s, s.post.champion), 'National champion');
    assert.equal(postseasonRecord(s, s.post.champion).ncaa.w, 3);
    assert.ok(s.polls.final);
  });
}

check('clearing a result', () => {
  const s = currentSeason(leagues.women);
  const copy = { ...s.games.find(isFinal) };
  clearResult(copy);
  assert.ok(!copy.final && copy.homeR == null);
});

check('logos from the AAU Dynasty', () => {
  const L = newLeague();
  const backup = { schools: [{ id: 'x', name: 'Cornell University', short: 'Cornell', logo: 'data:image/png;base64,AAAA' }], conferences: { c1: { name: 'Ivy League', logo: 'https://e.com/ivy.png' } } };
  const got = applyAauLogos(L, readAauLogos(backup));
  assert.deepEqual(got, { teams: ['Cornell'], conferences: ['Ivy League'] });
  assert.throws(() => readAauLogos({ seasons: {} }));
});

check('an unstarted saved dynasty picks up the commissioner\'s conferences', () => {
  const L = newLeague(), s0 = currentSeason(L);
  delete L.alignment;
  s0.teams.Yale.conference = 'Big Ten';
  migrateLeague(L);
  assert.equal(L.alignment, ALIGNMENT);
  assert.equal(s0.teams.Yale.conference, 'Ivy League');
});

check('record book', () => {
  const B = recordBook(leagues.men);
  assert.ok(B.games.length > 150);
  assert.ok(B.programs.some(x => x.titles === 1));
});

check('offseason and the next season', () => {
  const league = leagues.men, prev = currentSeason(league);
  beginOffseason(league);
  assert.ok(Array.isArray(draftWarnings(league)));
  addConference(league, 'West Coast', { abbr: 'WC', color: '#123456' });
  for (const t of ['Arizona State', 'Notre Dame', 'Michigan']) league.draft.teams[t].conference = 'West Coast';
  const s2 = startNextSeason(league);
  assert.equal(s2.year, 2031);
  const conf = count(reg(s2).filter(g => g.confGame && s2.teams[g.home].conference === 'West Coast'));
  assert.deepEqual(Object.values(conf), [4, 4, 4], 'a home-and-home with each conference opponent');
  rebuildSchedule(s2, prev);
  assert.ok(reg(s2).length > 150);
});

check('a saved league loads again', () => {
  const copy = JSON.parse(JSON.stringify(leagues.men));
  delete copy.sport;
  migrateLeague(copy);
  assert.equal(copy.currentYear, 2031);
  assert.equal(copy.sport, 'hockey');
});

console.log(`${n} checks ok in ${Date.now() - t0} ms`);
