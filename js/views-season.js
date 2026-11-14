// Season pages: home, schedule, standings, rankings and postseason.

import { ctx, S, app, modal, $, $$, esc, toast, changed, persist, cache, team, teamOptions, teamNames, confLogo, confHref, confColor, confInfo, gameCard, compactCard, placeholderCard, bindGameCards, openGame, resultText, periodNote, DAY_NAMES, readableOn, teamInfo, logoImg, teamHref, seasonLabel } from './ui.js?v=20261113221327';
import { isFinal, winnerOf, resultFor, records, rpi, rating, indexName, usesNpi, NPI_DIALS, confStandings, conferences, regSeasonChamp, regSeasonChamps, TIEBREAKERS, quadrants, quadCuts, isIndependent, INDEPENDENT } from './standings.js?v=20261113221327';
import { latestPoll, generatePoll, pollRankMap, pollSizeOf, VOTER_PANEL, voterStyle, votersOf, addRandomVoter, removeVoter } from './polls.js?v=20261113221327';
import { ovr } from './sim.js?v=20261113221327';
import { simGames, addGame, weekName } from './league.js?v=20261113221327';
import { confClashes, CONF_FORMATS, confFormatName, confKind , regionalFirstRound } from './postseason.js?v=20261113221327';
import { COMMITTEE_TIERS, gameVenue, COMMITTEE_SHORT, committeeSheet, compareTeams, mcwsVenue, postWeeks, regWeeksOf, ncaaConfig, hasSupers, noRegionals, fieldSize, wsTeams, formatSummary, shownSeed, postseasonBonus, defaultConfTourneySize, confTourneySeeds, reseedConfTourney, proposeField, lockField, pods, nodeTeams, nodeNeeded, runnerUp, committeeOrder, autoBids, refLabel, setConfFormat, ensureLayout, confHost, setConfHost, mcwsHistory, selectionBoard, setAtLarge, confirmField, unconfirmField, bracketology, BRACKETOLOGY_FROM_WEEK } from './postseason.js?v=20261113221327';
import { fmtPct, hashStr } from './util.js?v=20261113221327';
import { DAY_ORDER, CONF_WEEKENDS, applyConfWeekend } from './schedule.js?v=20261113221327';

// " at Lynah Rink, Ithaca, N.Y." for a host school with a home rink.
const atField = (s, school) => { const t = s.teams[school]; const f = [t?.stadium, t?.city].filter(Boolean).join(', '); return f ? ` at ${esc(f)}` : ''; };

const ui = { week: null, schedFilter: 'all', standConf: 'all', pollWeek: null, rankTab: 'poll', postTab: null, editPoll: null, voter: null };
export function resetSeasonUi() { ui.week = null; ui.pollWeek = null; ui.postTab = null; ui.editPoll = null; }

const PHASE_TEXT = { regular: 'Regular season', conf: 'Conference tournaments', selection: 'Selection', regionals: 'National Tournament: quarterfinals', supers: 'National Tournament: super regionals', mcws: 'Frozen Four', complete: 'Season complete' };

function nextGame(s) {
  return s.games.filter(g => !isFinal(g)).sort((a, b) => a.week - b.week || a.order - b.order || a.id - b.id)[0] || null;
}

function simAndReport(filter, what, opts = {}) {
  const s = S();
  const n = simGames(s, filter, opts);
  changed();
  toast(n ? `${n} game${n === 1 ? '' : 's'} simulated${what ? ' ' + what : ''}.` : 'Nothing left to simulate there.');
}

// ---------- Home ----------

export function renderHome() {
  const s = S(), recs = cache.recs(), poll = latestPoll(s);
  const total = s.games.length, done = s.games.filter(isFinal).length;
  const nx = nextGame(s);
  const best = Object.keys(s.teams).sort((a, b) => (recs[b].w - recs[b].l) - (recs[a].w - recs[a].l) || recs[b].w - recs[a].w)[0];
  const champ = s.post?.champion;
  const ct = champ ? teamInfo(champ) : null;
  const recent = s.games.filter(isFinal).sort((a, b) => b.week - a.week || b.order - a.order || b.id - a.id).slice(0, 8);
  const leaders = Object.keys(ctx.league.conferences).filter(c => !isIndependent(c) && Object.values(s.teams).some(t => t.conference === c)).map(c => {
    const st = confStandings(s, c, recs);
    return { c, top: st[0] };
  });
  app.innerHTML = `
    <div class="section-head"><h1>${seasonLabel(s.year)} Season</h1><span class="muted">${PHASE_TEXT[s.phase]}${nx ? ` · next: ${weekName(nx.week, s)}, ${DAY_NAMES[nx.day] || nx.day}` : ''}</span></div>
    ${champ ? `<div class="banner" style="background:linear-gradient(120deg, ${esc(ct.color)}, #15171c)"><span class="trophy">🏆</span><div><div class="small" style="opacity:.8">${seasonLabel(s.year)} National Champion</div><div class="big">${esc(champ)}</div><div class="small" style="opacity:.8">Beat ${esc(s.post.runnerUp)} in the national final at the ${esc(s.settings.mcwsName)} · ${recs[champ].w}-${recs[champ].l}-${recs[champ].t || 0}</div></div></div><div style="height:16px"></div>` : ''}
    <div class="kpis">
      <div class="kpi"><div class="v">${done}<span class="muted" style="font-size:16px"> / ${total}</span></div><div class="l">Games final</div></div>
      <div class="kpi"><div class="v">${poll?.ranks[0] ? team(poll.ranks[0].team, { rank: false, size: 22 }) : '—'}</div><div class="l">No. 1 ${poll ? (poll.week === 'final' ? '(final poll)' : poll.week === 0 ? '(preseason)' : `(week ${poll.week} poll)`) : ''}</div></div>
      <div class="kpi"><div class="v">${best ? team(best, { rank: false, size: 22 }) : '—'}</div><div class="l">Best record ${best ? `(${recs[best].w}-${recs[best].l}-${recs[best].t || 0})` : ''}</div></div>
      <div class="kpi"><div class="v">${PHASE_TEXT[s.phase]}</div><div class="l">Phase</div></div>
    </div>
    ${nx ? `<div class="card"><div class="row"><div><h2 style="margin:0">Up next: ${weekName(nx.week, s)} · ${DAY_NAMES[nx.day] || nx.day}</h2>
      <div class="muted small">${(n => `${n} game${n === 1 ? '' : 's'}`)(s.games.filter(g => g.week === nx.week && g.day === nx.day && !isFinal(g)).length)} that day</div></div><span class="spacer"></span>
      <a class="btn" href="#/schedule">Open schedule</a>
      <button class="btn" id="h-day">🎲 Sim next day</button>
      <button class="btn primary" id="h-week">🎲 Sim ${weekName(nx.week, s)}</button></div></div>`
      : s.phase === 'complete' && ctx.league.viewYear === ctx.league.currentYear ? `<div class="card"><div class="row"><div><h2 style="margin:0">On to the ${seasonLabel(s.year + 1)} offseason</h2><div class="muted small">Add teams and conferences, realign, and update coaches before the new schedule is built.</div></div><span class="spacer"></span><a class="btn primary" href="#/offseason">Open the offseason</a></div></div>`
      : s.phase === 'selection' ? `<div class="card"><div class="row"><h2 style="margin:0">The National Tournament field is ready to announce</h2><span class="spacer"></span><a class="btn primary" href="#/postseason">Review the field</a></div></div>` : ''}
    <div class="grid" style="margin-top:16px">
      <div class="card"><h2>${poll ? (poll.week === 'final' ? 'Final poll' : poll.week === 0 ? 'Preseason poll' : `Week ${poll.week} poll`) : 'Poll'}</h2>
        <table><tbody>${(poll?.ranks || []).slice(0, 10).map((x, i) => `<tr><td class="num" style="width:28px">${i + 1}</td><td>${team(x.team, { rank: false })}</td><td class="num muted">${esc(x.record)}</td></tr>`).join('')}</tbody></table>
        <p class="small"><a href="#/rankings">Full Top 15 and ${indexName(s)} →</a></p></div>
      <div class="card"><h2>Conference leaders</h2>
        <table><tbody>${leaders.map(({ c, top }) => `<tr><td style="width:30px"><a href="${confHref(c)}">${confLogo(c, 22)}</a></td><td>${top ? team(top.team) : '—'}</td><td class="num muted">${top ? `${top.cw}-${top.cl}-${top.ct || 0}` : ''}</td></tr>`).join('')}</tbody></table>
        <p class="small"><a href="#/standings">Standings →</a></p></div>
      <div class="card"><h2>Latest results</h2>
        ${recent.length ? `<div class="mini-scores">${recent.map(g => miniScore(g, s)).join('')}</div>` : '<p class="muted">No games played yet.</p>'}</div>
    </div>`;
  $$('[data-open]').forEach(r => (r.onclick = () => openGame(Number(r.dataset.open))));
  if ($('#h-day')) $('#h-day').onclick = () => simAndReport(g => g.week === nx.week && g.day === nx.day, `on ${DAY_NAMES[nx.day] || nx.day}`);
  if ($('#h-week')) $('#h-week').onclick = () => simAndReport(g => g.week === nx.week, `in ${weekName(nx.week, s)}`);
}

// Standings for the week's early-season tournaments, in a panel that starts
// closed. Order: wins, then fewest losses, head-to-head between two tied
// teams, run differential, runs allowed. The leader is marked as champion once
// every game of the event is final.
function tourneyStandings(s, weekGames) {
  const ids = [...new Set(weekGames.filter(g => g.tourney).map(g => g.tourney))];
  if (!ids.length) return '';
  // Poll ranks as they stood when the tournament was played (as on the game boxes).
  const weekRanks = cache.ranksAt(weekGames.find(g => g.tourney).week);
  const tables = ids.map(id => {
    const gs = weekGames.filter(g => g.tourney === id);
    const host = gs.find(g => !g.neutral)?.home || gs[0].site || gs[0].home;
    const rows = {};
    for (const t of new Set(gs.flatMap(g => [g.home, g.away]))) rows[t] = { t, w: 0, l: 0, rs: 0, ra: 0 };
    for (const g of gs.filter(isFinal)) {
      const w = winnerOf(g), l = w === g.home ? g.away : g.home;
      rows[w].w++; rows[l].l++;
      rows[g.home].rs += g.homeR; rows[g.home].ra += g.awayR; rows[g.away].rs += g.awayR; rows[g.away].ra += g.homeR;
    }
    const h2h = (a, b) => { const g = gs.find(x => isFinal(x) && [x.home, x.away].includes(a) && [x.home, x.away].includes(b)); return g ? (winnerOf(g) === a ? -1 : 1) : 0; };
    const list = Object.values(rows).sort((a, b) => b.w - a.w || a.l - b.l).sort((a, b) => {
      if (a.w !== b.w || a.l !== b.l) return 0;
      const tied = Object.values(rows).filter(x => x.w === a.w && x.l === a.l).length;
      return (tied === 2 ? h2h(a.t, b.t) : 0) || (b.rs - b.ra) - (a.rs - a.ra) || a.ra - b.ra || a.t.localeCompare(b.t);
    });
    const done = gs.every(isFinal), played = gs.filter(isFinal).length;
    return `<div class="tst"><div class="row tst-head"><b>${esc(gs[0].label)}</b><span class="spacer"></span><span class="muted small">${done ? `Champion: ${esc(list[0].t)}` : `${played} of ${gs.length} games played`}</span></div>
      <div class="muted small" style="margin-bottom:4px">Hosted by ${esc(host)}${atField(S(), host)} · round robin, ${gs.length > 6 ? 'Thursday–Saturday' : 'Friday–Saturday'}</div>
      <table class="tst-table"><thead><tr><th></th><th>Team</th><th class="num">W-L</th><th class="num" title="Sets won">SW</th><th class="num" title="Sets lost">SL</th><th class="num">Diff</th></tr></thead>
      <tbody>${list.map((x, i) => `<tr class="${done && i === 0 ? 'tst-champ' : ''}"><td class="num muted">${i + 1}</td><td>${team(x.t, { size: 16, ranks: weekRanks })}</td><td class="num"><b>${x.w}-${x.l}-${x.t || 0}</b></td><td class="num">${x.rs}</td><td class="num">${x.ra}</td><td class="num ${x.rs - x.ra > 0 ? 'good' : x.rs - x.ra < 0 ? 'bad' : ''}">${x.rs - x.ra > 0 ? '+' : ''}${x.rs - x.ra}</td></tr>`).join('')}</tbody></table></div>`;
  });
  return `<details class="card tstand"${ui.tstandOpen ? ' open' : ''}><summary><b>Tournament standings</b> <span class="muted small">${ids.length} event${ids.length === 1 ? '' : 's'} this week</span></summary>
    <div class="tst-grid">${tables.join('')}</div>
    <p class="small muted" style="margin:10px 0 0">Ordered by record. Ties: head-to-head when two teams are tied, then set differential, then fewest sets lost. Invitational games count in the standings, ${indexName(S())} and polls like any non-conference game.</p></details>`;
}

// One finished game as a compact scoreboard row: logos, abbreviations,
// runs, with the winner in bold.
function miniScore(g, s) {
  const w = winnerOf(g);
  const side = (t, r) => { const info = teamInfo(t); return `<span class="ms-team ${w === t && g.homeR !== g.awayR ? 'is-win' : ''}">${logoImg(info, 20)}<span class="ms-abbr" title="${esc(t)}">${esc(info?.abbr || t)}</span><b class="ms-r">${r}</b></span>`; };
  const inn = Math.max(g.homeLine.length, g.awayLine.length);
  return `<button type="button" class="mini-score" data-open="${g.id}" title="${esc(resultText(g))}">${side(g.away, g.awayR)}${side(g.home, g.homeR)}<span class="ms-when">${esc(weekName(g.week, s).replace('Week ', 'Wk '))} ${esc(g.day)}${g.pk ? ' · F/PK' : periodNote(g) ? ` · F/${periodNote(g)}` : ''}</span></button>`;
}

// ---------- Schedule ----------

function weeksOf(s) { return [...new Set(s.games.map(g => g.week))].sort((a, b) => a - b); }

export function renderSchedule() {
  const s = S();
  const weeks = weeksOf(s);
  if (ui.week === null || !weeks.includes(ui.week)) ui.week = nextGame(s)?.week ?? weeks[weeks.length - 1] ?? 1;
  // Within a day, mix conferences like a real scoreboard. The sort key comes
  // from the series (or the game), so a weekend series keeps its spot
  // Friday through Sunday and the order stays the same between visits.
  const mixKey = g => hashStr(`${s.year}|${g.series || 'g' + g.id}`);
  // Postseason days mix the same way: games at one site keep their order
  // (Game 1 before Game 2), but sites are shuffled together, so the day's
  // first games from every site come first in a mixed order, then the next
  // ones, and so on. Rounds played at the higher seed's field are one game a
  // site, so they come out fully mixed rather than in bracket order.
  const week = s.games.filter(g => g.week === ui.week);
  const post = week.filter(g => g.type !== 'regular');
  const dayKey = g => DAY_ORDER[g.day] + (g.type !== 'conf' && ['Mon', 'Tue', 'Wed'].includes(g.day) ? 7 : 0);
  const slot = {};
  const byEventDay = {};
  const siteOf = {};
  for (const g of post) { const v = gameVenue(s, g); siteOf[g.id] = v.host || v.stadium || ''; }
  for (const g of post) (byEventDay[`${g.event || g.type}|${g.day}|${siteOf[g.id]}`] ||= []).push(g);
  for (const list of Object.values(byEventDay)) list.sort((a, b) => a.order - b.order || a.id - b.id).forEach((g, i) => { slot[g.id] = i; });
  const postKey = g => hashStr(`${slot[g.id]}|${g.day}|${s.year}|${siteOf[g.id]}|${g.event || g.type}`);
  const games = week.sort((a, b) => {
    if (a.type === 'regular' && b.type === 'regular') return a.order - b.order || mixKey(a) - mixKey(b) || a.id - b.id;
    if (a.type !== 'regular' && b.type !== 'regular') return dayKey(a) - dayKey(b) || slot[a.id] - slot[b.id] || postKey(a) - postKey(b) || a.id - b.id;
    return a.order - b.order || a.id - b.id;
  });
  const unplayed = games.filter(g => !isFinal(g));
  const days = [...new Set(games.map(g => g.day))];
  // Filter (All games unless the commissioner picks another; the sim buttons
  // still cover the whole week). A game counts as ranked if either team was
  // ranked in the poll in effect when it was played (the latest poll if not).
  const confs = conferences(s);
  if (Object.values(s.teams).some(t => isIndependent(t.conference))) confs.push(INDEPENDENT);
  if (ui.schedFilter !== 'all' && !['ranked', 'top'].includes(ui.schedFilter) && !confs.includes(ui.schedFilter.replace(/^conf:/, ''))) ui.schedFilter = 'all';
  const rankedIn = g => { const r = isFinal(g) ? cache.ranksAt(g.week) : cache.ranks(); return [g.home, g.away].filter(t => r[t]).length; };
  const sf = ui.schedFilter, filtering = sf !== 'all';
  const keep = sf === 'ranked' ? g => rankedIn(g) >= 1 : sf === 'top' ? g => rankedIn(g) === 2
    : sf.startsWith('conf:') ? (c => g => s.teams[g.home]?.conference === c || s.teams[g.away]?.conference === c)(sf.slice(5)) : () => true;
  const shown = games.filter(keep);
  const shownDays = days.filter(d => shown.some(g => g.day === d));
  const filterName = sf === 'ranked' ? 'ranked-team' : sf === 'top' ? 'ranked vs. ranked' : sf.startsWith('conf:') ? sf.slice(5) : '';
  const fchip = (v, label, extra = '') => `<button type="button" class="fchip ${sf === v ? 'active' : ''}" data-sf="${esc(v)}" aria-pressed="${sf === v}"${extra}>${label}</button>`;
  const filterBar = `<div class="sched-filter" role="group" aria-label="Filter games">
      ${fchip('all', 'All games')}${fchip('ranked', 'Ranked teams', ' title="Games with at least one ranked team"')}${fchip('top', 'Ranked vs. ranked', ' title="Both teams ranked"')}
      <span class="fsep" aria-hidden="true"></span>
      ${confs.map(c => fchip(`conf:${c}`, `${confLogo(c, 16)}<span>${esc(confInfo(c).abbr || c)}</span>`, ` title="Games with a ${esc(c)} team"`)).join('')}
    </div>`;
  const firstOpenDay = unplayed[0]?.day;
  // A sim button on each day heading with games left to play. It also plays
  // any earlier day of the week that's still open, so results stay in order.
  const dayOpen = d => unplayed.some(g => g.day === d);
  const throughDay = d => { const i = days.indexOf(d); return g => g.week === ui.week && days.indexOf(g.day) <= i; };
  const dayBtn = d => (dayOpen(d) ? `<button type="button" class="btn sm day-sim" data-simday="${esc(d)}" title="Simulate ${days.slice(0, days.indexOf(d)).some(dayOpen) ? 'every open game through' : 'the games on'} ${esc(DAY_NAMES[d] || d)}">🎲 Sim ${esc(DAY_NAMES[d] || d)}</button>` : '');
  const isDone = w => s.games.filter(g => g.week === w).every(isFinal);
  const finals = s.games.filter(isFinal).length;
  const regLeft = s.games.filter(g => g.type === 'regular' && !isFinal(g)).length;
  app.innerHTML = `
    <div class="section-head"><h1>${seasonLabel(s.year)} Schedule</h1><span class="muted">${finals} of ${s.games.length} games final</span></div>
    <div class="chips">${weeks.map(w => `<button class="chip ${w === ui.week ? 'active' : ''} ${isDone(w) ? 'done' : ''}" data-week="${w}">${w > regWeeksOf(s) ? esc(weekName(w, s)) : 'Wk ' + w}</button>`).join('')}</div>
    <div class="row" style="margin-bottom:14px">
      <h2 style="margin:0">${esc(weekName(ui.week, s))}</h2><span class="spacer"></span>
      ${firstOpenDay ? `<button class="btn" id="w-day">🎲 Sim ${DAY_NAMES[firstOpenDay] || firstOpenDay}</button>` : ''}
      ${unplayed.length ? `<button class="btn" id="w-sim">🎲 Sim week (${unplayed.length})</button>` : ''}
      ${regLeft && ui.week <= regWeeksOf(s) ? `<button class="btn" id="w-rest">Sim rest of regular season (${regLeft})</button>` : ''}
      ${ui.week <= regWeeksOf(s) ? '<button class="btn" id="w-add">+ Add game</button>' : ''}
    </div>
    ${filterBar}
    ${tourneyStandings(s, games)}
    ${shownDays.map(d => { const all = games.filter(g => g.day === d).length, n = shown.filter(g => g.day === d).length; return `<h3 class="day-head">${DAY_NAMES[d] || esc(d)} <span class="muted small">${filtering ? `${n} of ${all} games` : `${n} game${n === 1 ? '' : 's'}`}</span>${dayBtn(d)}</h3>
      <div class="games">${shown.filter(g => g.day === d).map(gameCard).join('')}</div>`; }).join('') || `<div class="empty">${filtering && games.length ? `No ${esc(filterName)} games in ${esc(weekName(ui.week, s))}. <button class="btn sm" id="sf-clear">Show all games</button>` : 'No games this week.'}</div>`}
    <p class="small muted" style="margin-top:16px">Click a game to enter its score or simulate it. Percentages are each favorite's chance to win (a tie counts half), from the teams' OFF, MID and DEF ratings and home field.</p>`;
  $$('[data-week]').forEach(b => (b.onclick = () => { ui.week = Number(b.dataset.week); renderSchedule(); }));
  $$('[data-sf]').forEach(b => (b.onclick = () => { ui.schedFilter = b.dataset.sf; renderSchedule(); }));
  const tsd = $('details.tstand'); if (tsd) tsd.ontoggle = () => { ui.tstandOpen = tsd.open; };
  if ($('#sf-clear')) $('#sf-clear').onclick = () => { ui.schedFilter = 'all'; renderSchedule(); };
  bindGameCards();
  $$('[data-simday]').forEach(btn => (btn.onclick = () => { const d = btn.dataset.simday; simAndReport(throughDay(d), `${days.slice(0, days.indexOf(d)).some(dayOpen) ? 'through' : 'on'} ${DAY_NAMES[d] || d}`); }));
  if ($('#w-day')) $('#w-day').onclick = () => simAndReport(g => g.week === ui.week && g.day === firstOpenDay, `on ${DAY_NAMES[firstOpenDay] || firstOpenDay}`);
  if ($('#w-sim')) $('#w-sim').onclick = () => simAndReport(g => g.week === ui.week, `in ${weekName(ui.week, s)}`);
  if ($('#w-rest')) $('#w-rest').onclick = () => {
    if (!confirm(`Simulate all ${regLeft} remaining regular-season games? Every result stays editable.`)) return;
    simAndReport(g => g.type === 'regular', 'in the regular season');
  };
  if ($('#w-add')) $('#w-add').onclick = () => {
    const g = addGame(s, { week: ui.week, day: 'Tue' });
    openGame(g.id, { isNew: true });
  };
}

// ---------- Standings ----------

// A conference's colors as CSS variables (--ch, --ch2, --chi: background,
// second color, text on it), and its header: logo on a white tile, name,
// a line under it, then badges.
function confVars(c) {
  const info = confInfo(c), bg = info.color || '#0b1f3a';
  return `--ch:${esc(bg)};--ch2:${esc(info.altColor || bg)};--chi:${readableOn(bg)}`;
}
function confHead(c, sub = '', extra = '', attrs = '', logo = 48) {
  return `<div class="conf-head" ${attrs}><a class="conf-tile" href="${confHref(c)}">${confLogo(c, logo)}</a><div class="conf-name"><h2><a href="${confHref(c)}">${esc(c)}</a></h2>${sub ? `<span>${sub}</span>` : ''}</div><span class="spacer"></span>${extra}</div>`;
}

export function renderStandings() {
  const s = S(), recs = cache.recs(), r = rating(s);
  const regRecs = records(s, g => g.type === 'regular');
  const confs = Object.keys(ctx.league.conferences).filter(c => !isIndependent(c) && Object.values(s.teams).some(t => t.conference === c));
  // Independents: no conference record, so they're listed by overall record.
  const indep = Object.values(s.teams).filter(t => isIndependent(t.conference)).map(t => t.school)
    .sort((a, b) => ((recs[b].w + (recs[b].t || 0) / 2) / Math.max(1, recs[b].w + recs[b].l + (recs[b].t || 0))) - ((recs[a].w + (recs[a].t || 0) / 2) / Math.max(1, recs[a].w + recs[a].l + (recs[a].t || 0))) || (r[a]?.rank ?? 999) - (r[b]?.rank ?? 999));
  const wlt = x => `${x.w}-${x.l}-${x.t || 0}`;
  const indepCard = indep.length ? `<div class="card"><div class="row" style="margin-bottom:8px"><a href="${confHref(INDEPENDENT)}">${confLogo(INDEPENDENT, 30)}</a><h2 style="margin:0"><a class="team-link" href="${confHref(INDEPENDENT)}">Independents</a></h2><span class="spacer"></span><span class="muted small">No conference: at-large bids only</span></div>
      <div class="table-wrap"><table><thead><tr><th></th><th>Team</th><th class="num">Overall</th><th class="num">${indexName(s)}</th><th class="num">Home</th><th class="num">Away</th><th class="num">Strk</th></tr></thead>
        <tbody>${indep.map((t, i) => `<tr><td class="num muted">${i + 1}</td><td>${team(t)}</td><td class="num"><b>${wlt(recs[t])}</b></td><td class="num">${r[t]?.rank ?? '—'}</td><td class="num">${recs[t].hw}-${recs[t].hl}-${recs[t].ht || 0}</td><td class="num">${recs[t].aw}-${recs[t].al}-${recs[t].at || 0}</td><td class="num">${recs[t].streak || ''}</td></tr>`).join('')}</tbody></table></div></div>` : '';
  // Standings are points (3 a win, 1 a tie); PB is points behind.
  const gbText = x => (x.gb ? String(x.gb) : '—');
  // The last five results, postseason included (the owner's call, Nov.
  // 2026); hovering them shows the five games in the same pop-up as the
  // poll's week records. The streak counts every game too.
  const regDone = s.games.filter(isFinal).sort((a, b) => a.week - b.week || (DAY_ORDER[a.day] ?? 0) - (DAY_ORDER[b.day] ?? 0) || (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);
  const last5Games = t => regDone.filter(g => g.home === t || g.away === t).slice(-5);
  const last5 = t => { const gs = last5Games(t); return gs.length ? `<span class="l5s wk-hover" data-wk="${esc(t)}" tabindex="0" aria-label="${esc(`${t}'s last ${gs.length} games. Show them`)}">${gs.map(g => { const k = resultFor(g, t); return `<span class="l5 ${k === 'W' ? 'w' : k === 'L' ? 'l' : 't'}">${k}</span>`; }).join('')}</span>` : ''; };
  const strk = t => { const v = recs[t]?.streak || ''; return `<span class="strk ${v[0] === 'W' ? 'w' : v[0] === 'L' ? 'l' : ''}">${esc(v)}</span>`; };
  // One conference's full table, in its colors (the AAU look, Nov. 2026).
  const card = c => {
    const st = confStandings(s, c, regRecs, r);
    const n = st.length;
    const size = Math.min(n, s.settings.confTourney?.[c] ?? defaultConfTourneySize(n));
    const champ = regSeasonChamp(s, c, regRecs, r);
    const tchamp = s.post?.confT?.[c]?.champion;
    const canSize = s.phase === 'regular';
    // Fail-safe check: scheduled conference games should be equal (manual edits can change that).
    const sched = Object.fromEntries(st.map(x => [x.team, 0]));
    for (const g of s.games) if (g.type === 'regular' && g.confGame && g.home in sched && g.away in sched) { sched[g.home]++; sched[g.away]++; }
    const uneven = new Set(Object.values(sched)).size > 1;
    const played = s.games.filter(g => g.type === 'regular' && isFinal(g)).reduce((m, g) => Math.max(m, g.week), 0);
    return `<section class="st-card" style="${confVars(c)}">
      ${confHead(c, played ? `Standings through week ${played} · conference points: 3 for a win, 1 for a tie` : 'Before the first game', `${champ ? `<span class="badge">Regular season: ${esc(champ)}</span>` : ''}${tchamp ? `<span class="badge gold">Tournament: ${esc(tchamp)}</span>` : ''}`)}
      ${uneven ? `<div class="hint warn small st-pad">Conference schedules are uneven: ${Object.entries(sched).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${esc(t)} ${n}`).join(', ')} conference games. This usually comes from editing games by hand; fix the games or rebuild the schedule in Settings.</div>` : ''}
      <div class="table-wrap"><table class="st-table">
        <thead><tr><th class="num">#</th><th>Team</th><th class="num st-c" title="Conference points: 3 for a win, 1 for a tie">Pts</th><th class="num st-c">Conf</th><th class="num st-c" title="Points behind the leader">PB</th><th class="num">Overall</th><th class="num" title="Goals for and against">GF–GA</th><th class="num">Home</th><th class="num">Away</th><th class="num">Strk</th><th>Last 5</th></tr></thead>
        <tbody>${st.map((x, i) => `<tr class="${i === size - 1 && size < n ? 'cutline' : ''}"><td class="num st-pos">${i + 1}</td>
          <td>${team(x.team, { size: 26 })}</td>
          <td class="num st-c"><b>${x.pts}</b></td><td class="num st-c">${x.cw}-${x.cl}-${x.ct || 0}</td><td class="num st-c">${gbText(x)}</td>
          <td class="num">${wlt(recs[x.team])}</td><td class="num muted">${recs[x.team].rs}–${recs[x.team].ra}</td><td class="num muted">${x.hw}-${x.hl}-${x.ht || 0}</td><td class="num muted">${x.aw}-${x.al}-${x.at || 0}</td>
          <td class="num">${strk(x.team)}</td><td>${last5(x.team)}</td></tr>`).join('')}</tbody></table></div>
      <div class="st-legend"><span><b class="st-rk">5</b> Top ${pollSizeOf(s)} rank</span><span><span class="l5 w">W</span> Win</span><span><span class="l5 l">L</span> Loss</span><span><span class="l5 t">T</span> Tie</span>${size && size < n ? `<span><i class="st-cut"></i> Conference tournament cut (top ${size})</span>` : ''}</div>
      <details class="small st-pad st-comm"><summary class="muted">Commissioner</summary><div class="row" style="margin-top:8px">
        <label class="field">Regular-season champion <select data-champ="${esc(c)}"><option value="">Automatic (${esc(regSeasonChamps({ ...s, overrides: {} }, c, regRecs, r).join(' & ') || '—')})</option>${teamOptions(s.overrides.regChamps?.[c], { blank: false, list: st.map(x => x.team) })}</select></label>
        <label class="field">Game days <select data-weekend="${esc(c)}">${CONF_WEEKENDS.map(([k, l]) => `<option value="${k}" ${(s.settings.confWeekend?.[c] || 'tsu') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="field">Tournament format <select data-format="${esc(c)}" ${canSize ? '' : 'disabled'}>${CONF_FORMATS.map(([k, l]) => `<option value="${k}" ${(s.settings.confFormat?.[c] || 'single') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="field">Tournament teams <select data-size="${esc(c)}" ${canSize ? '' : 'disabled'}>${[0, ...Array.from({ length: Math.max(0, Math.min(n, 16) - 1) }, (_, i) => i + 2)].map(k => `<option value="${k}" ${k === size ? 'selected' : ''}>${k ? `Top ${k}` : 'No tournament'}</option>`).join('')}</select></label>
      </div>${canSize ? '' : `<p class="muted">Tournament size and format are locked once the tournaments are set. You can still switch a tournament's format on the Postseason page until its first game.</p>`}</details>
    </section>`;
  };
  // All conferences: a compact card per conference (place, team, conference
  // record, games behind, overall); a card's header opens the full table.
  const compact = c => {
    const st = confStandings(s, c, regRecs, r), n = st.length;
    const size = Math.min(n, s.settings.confTourney?.[c] ?? defaultConfTourneySize(n));
    return `<section class="st-card compact" style="${confVars(c)}">${confHead(c, '', '', `data-stc="${esc(c)}"`, 28)}
      <div class="table-wrap"><table class="st-table"><thead><tr><th></th><th>Team</th><th class="num st-c">Pts</th><th class="num st-c">Conf</th><th class="num">Overall</th></tr></thead>
        <tbody>${st.map((x, i) => `<tr class="${i === size - 1 && size < n ? 'cutline' : ''}"><td class="num st-pos">${i + 1}</td><td>${team(x.team, { size: 22 })}</td><td class="num st-c"><b>${x.pts}</b></td><td class="num st-c">${x.cw}-${x.cl}-${x.ct || 0}</td><td class="num muted">${wlt(recs[x.team])}</td></tr>`).join('')}</tbody></table></div></section>`;
  };
  const pick = confs.includes(ui.standConf) || (ui.standConf === INDEPENDENT && indep.length) ? ui.standConf : 'all';
  const side = (v, label, logo, cvars = '') => `<button type="button" class="st-link ${pick === v ? 'active' : ''}" data-stc="${esc(v)}" aria-pressed="${pick === v}" style="${cvars}">${logo}<span>${label}</span></button>`;
  app.innerHTML = `
    <div class="section-head"><h1>${seasonLabel(s.year)} Standings</h1><span class="muted">Ordered by conference points: 3 for a win, 1 for a tie. The line marks the conference tournament cut, where a conference has one.</span></div>
    <div class="st-layout">
      <aside class="st-side" aria-label="Conferences"><span class="st-kick">Conferences</span>
        ${side('all', 'All conferences', '<span class="st-grid-ic" aria-hidden="true"><i></i><i></i><i></i><i></i></span>')}
        ${confs.map(c => side(c, esc(c), `<span class="st-tile">${confLogo(c, 26)}</span>`, confVars(c))).join('')}
        ${indep.length ? side(INDEPENDENT, 'Independents', `<span class="st-tile">${confLogo(INDEPENDENT, 26)}</span>`) : ''}
      </aside>
      <div class="st-content">
        ${pick === 'all' ? `<div class="st-grid">${confs.map(compact).join('')}${indepCard}</div>` : `${pick === INDEPENDENT ? indepCard : card(pick)}
        <details class="card small"><summary><b>Tiebreakers</b></summary><ol style="margin:8px 0 0 18px">${TIEBREAKERS.map(t => `<li>${esc(t)}</li>`).join('')}</ol>
          <p class="muted" style="margin:6px 0 0">The same order seeds the conference tournaments.</p></details>`}
      </div>
    </div>`;
  $$('[data-stc]').forEach(b => (b.onclick = e => { if (e.target.closest('a')) return; ui.standConf = b.dataset.stc; renderStandings(); window.scrollTo(0, 0); }));
  bindWeekPopups(app, s, last5Games, null, 'Last 5 games');
  $$('[data-champ]').forEach(sel => (sel.onchange = () => {
    s.overrides.regChamps ||= {};
    if (sel.value) s.overrides.regChamps[sel.dataset.champ] = sel.value; else delete s.overrides.regChamps[sel.dataset.champ];
    changed({ progress: false });
  }));
  $$('[data-weekend]').forEach(sel => (sel.onchange = () => {
    const c = sel.dataset.weekend;
    s.settings.confWeekend ||= {}; s.settings.confWeekend[c] = sel.value;
    const n = applyConfWeekend(s, c);
    changed({ progress: false });
    toast(`${c} conference games: ${CONF_WEEKENDS.find(([k]) => k === sel.value)[1].toLowerCase()}.${n ? ` ${n} unplayed games moved.` : ''}`);
  }));
  $$('[data-format]').forEach(sel => (sel.onchange = () => { s.settings.confFormat ||= {}; s.settings.confFormat[sel.dataset.format] = sel.value; changed({ progress: false }); }));
  $$('[data-size]').forEach(sel => (sel.onchange = () => { s.settings.confTourney ||= {}; s.settings.confTourney[sel.dataset.size] = Number(sel.value); changed({ progress: false }); }));
}

// ---------- Rankings ----------

function pollWeeks(s) {
  const ks = Object.keys(s.polls || {}).filter(k => k !== 'final').map(Number).sort((a, b) => a - b);
  if (s.polls?.final) ks.push('final');
  return ks;
}

export function renderRankings() {
  const s = S();
  const tabs = { poll: `Top ${pollSizeOf(s)} poll`, rpi: indexName(s), sos: 'Strength of schedule', power: 'Power (OVR)', bracket: 'Bracketology' };
  app.innerHTML = `
    <div class="section-head"><h1>${seasonLabel(s.year)} Rankings</h1></div>
    <div class="steps">${Object.entries(tabs).map(([k, l]) => `<a href="#/rankings" data-tab="${k}" class="${ui.rankTab === k ? 'active' : ''}">${l}</a>`).join('')}</div>
    <div id="rk"></div>`;
  $$('[data-tab]').forEach(a => (a.onclick = e => { e.preventDefault(); ui.rankTab = a.dataset.tab; ui.editPoll = null; renderRankings(); }));
  ({ poll: renderPollTab, rpi: renderRpiTab, sos: renderSosTab, power: renderPowerTab, bracket: renderBracketology })[ui.rankTab]($('#rk'));
}

// Hover (or focus, or tap) a team's record for the week to see the games:
// a small card with each opponent, its rank at the time, and the score.
function weekPopupHtml(s, t, games, key, heading = null) {
  const title = heading ? heading : key === 'final' ? 'National Tournament' : key === postWeeks(s).conf ? 'Conference tournament' : `Week ${key}`;
  return `<div class="wkp-head">${logoImg(teamInfo(t), 18)}<b>${esc(t)}</b><span class="muted">${title}</span></div>
    ${games.map(g => {
      const home = g.home === t, opp = home ? g.away : g.home, res = resultFor(g, t), note = g.pk ? `PK ${home ? g.pk.home : g.pk.away}-${home ? g.pk.away : g.pk.home}` : periodNote(g);
      const at = (g.site || (g.neutral ? null : g.home)) === opp ? 'at' : 'vs.';
      const r = cache.ranksAt(g.week)[opp], inn = Math.max(g.homeLine.length, g.awayLine.length);
      return `<div class="wkp-row"><span class="wkp-day">${esc(g.day)}</span><span class="wkp-vs">${at}</span><span class="pt-logo wkp-logo">${logoImg(teamInfo(opp), 18)}</span>
        <span class="wkp-opp">${r ? `<span class="muted">#${r}</span> ` : ''}${esc(opp)}${g.type !== 'regular' && g.label ? ` <span class="muted wkp-round">· ${esc(g.label.split(' · ').slice(-1)[0])}</span>` : ''}</span>
        <span class="wkp-res"><b class="${res === 'W' ? 'w' : res === 'L' ? 'l' : ''}">${res}</b> ${home ? g.homeR : g.awayR}-${home ? g.awayR : g.homeR}${note ? ` <span class="muted">(${note})</span>` : ''}</span></div>`;
    }).join('')}`;
}

function bindWeekPopups(root, s, weekGames, key, heading = null) {
  document.querySelector('.wk-pop')?.remove();
  const pop = document.createElement('div');
  pop.className = 'wk-pop'; pop.setAttribute('role', 'tooltip'); pop.hidden = true;
  document.body.appendChild(pop);
  let owner = null;
  const hide = () => { pop.hidden = true; owner = null; };
  const show = el => {
    const t = el.dataset.wk, gs = weekGames(t);
    if (!gs.length) return;
    owner = el;
    pop.innerHTML = weekPopupHtml(s, t, gs, key, heading);
    pop.hidden = false;
    // Below the record, or above it when there's no room; kept on screen.
    const r = el.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    const left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2));
    const below = r.bottom + 8 + h < window.innerHeight || r.top < h + 16;
    pop.style.left = `${left + window.scrollX}px`;
    pop.style.top = `${(below ? r.bottom + 8 : r.top - h - 8) + window.scrollY}px`;
    pop.classList.toggle('above', !below);
  };
  $$('[data-wk]', root).forEach(el => {
    el.onmouseenter = () => show(el);
    el.onmouseleave = hide;
    el.onfocus = () => show(el);
    el.onblur = hide;
    el.onclick = e => { e.stopPropagation(); show(el); };
    el.onkeydown = e => { if (e.key === 'Escape') { hide(); el.blur(); } };
  });
  window.addEventListener('hashchange', () => pop.remove(), { once: true });
  window.addEventListener('scroll', hideWeekPopup, { passive: true });
  document.addEventListener('click', hideWeekPopup);
}
const hideWeekPopup = () => { const p = document.querySelector('.wk-pop'); if (p) p.hidden = true; };

// A rank number on the team's color (the alt color when the main one is white).
function rankBlock(name) {
  const t = teamInfo(name) || {};
  const bg = /^#[0-9a-f]{6}$/i.test(t.color || '') && t.color.toLowerCase() !== '#ffffff' ? t.color : (t.altColor || '#2c3e50');
  return `background:${esc(bg)};color:${esc(readableOn(bg))}`;
}

function renderPollTab(root) {
  const s = S();
  const weeks = pollWeeks(s);
  if (!weeks.length) { root.innerHTML = '<div class="empty">No polls yet.</div>'; return; }
  if (ui.pollWeek === null || !weeks.some(w => String(w) === String(ui.pollWeek))) ui.pollWeek = weeks[weeks.length - 1];
  const key = ui.pollWeek;
  const poll = s.polls[key];
  const prevKey = key === 'final' ? weeks.filter(w => w !== 'final').slice(-1)[0] : weeks.filter(w => w !== 'final' && w < key).slice(-1)[0];
  const prev = prevKey !== undefined ? pollRankMap(s.polls[prevKey]) : {};
  const label = w => (w === 'final' ? 'Final' : w === 0 ? 'Pre' : w === postWeeks(s).conf ? 'Post-tourney' : `Wk ${w}`);
  const editing = ui.editPoll && ui.editPoll.key === key;
  const rows = editing ? ui.editPoll.ranks : poll.ranks;
  // Teams ranked in the previous poll but not in this one, with that week's results.
  const inNow = new Set(rows.map(r => r.team));
  const inWeek = key === 'final' ? g => g.type !== 'regular' && g.type !== 'conf' : g => g.week === key;
  const weekGames = t => (key === 0 ? [] : s.games.filter(g => inWeek(g) && isFinal(g) && (g.home === t || g.away === t)).sort((a, b) => a.week - b.week || a.order - b.order || a.id - b.id));
  const weekRec = t => {
    if (key === 0) return '';
    const gs = weekGames(t);
    if (!gs.length) return '';
    const n = k => gs.filter(g => resultFor(g, t) === k).length;
    return `${n('W')}-${n('L')}${n('T') ? `-${n('T')}` : ''}`;
  };
  const dropped = prevKey === undefined ? [] : Object.entries(prev).filter(([t]) => !inNow.has(t)).sort((a, b) => a[1] - b[1]).map(([t, was]) => ({ team: t, was, week: weekRec(t) }));
  // The AAU look (Nov. 2026): the No. 1 team's card in its colors, then the
  // poll beside a column of the week's movers, others receiving votes and the
  // teams that dropped out.
  const top = !editing && rows[0];
  const hero = top ? (() => {
    const t = teamInfo(top.team) || {}, bg = t.color || '#0b1f3a', ink = readableOn(bg), acc = readableOn(bg, t.altColor);
    const was = prev[top.team];
    const kicker = key === 0 ? 'Preseason No. 1' : key === 'final' ? (s.post?.mcws?.champion === top.team ? 'National champion · final No. 1' : 'Final No. 1') : prevKey === undefined ? 'No. 1' : was === 1 ? 'No. 1 again this week' : was ? `Up from No. ${was} to No. 1` : 'New No. 1';
    const line = [esc(top.record || ''), esc(t.conference || '')].filter(Boolean).join(' · ');
    return `<a class="poll-hero" href="${teamHref(top.team)}" style="--hb:${esc(bg)};--hi:${ink};--ha:${acc}">
      <span class="ph-rank">1</span><span class="ph-logo">${logoImg(t, 72)}</span>
      <span class="ph-main"><span class="ph-kick">${esc(kicker)}</span><span class="ph-name">${esc(top.team)}${t.mascot ? ` ${esc(t.mascot)}` : ''}</span><span class="ph-line">${line}</span></span>
      <span class="ph-stats">${top.pts != null ? `<span><b>${top.pts}</b><i>Points</i></span>` : ''}${top.fp ? `<span><b>${top.fp}</b><i>First-place votes</i></span>` : ''}</span></a>`;
  })() : '';
  const moves = prevKey === undefined ? [] : rows.map((x, i) => ({ team: x.team, d: prev[x.team] ? prev[x.team] - (i + 1) : null, now: i + 1 })).filter(m => m.d).sort((a, b) => Math.abs(b.d) - Math.abs(a.d) || a.now - b.now).slice(0, 4);
  const title = key === 'final' ? 'Final poll' : key === 0 ? 'Preseason poll' : key === postWeeks(s).conf ? 'After the conference tournaments' : `Week ${key}`;
  const confShort = c => esc(confInfo(c)?.abbr && c.length > 18 ? c.replace(/ Conference$/, '') : c || '');
  root.innerHTML = `
    <div class="chips">${weeks.map(w => `<button class="chip ${String(w) === String(key) ? 'active' : ''}" data-pw="${w}">${label(w)}</button>`).join('')}</div>
    <div class="poll-headline"><span class="poll-kick">${esc(title)}</span><h2>AAU Top ${poll.size || poll.ranks.length}</h2>${poll.edited ? '<span class="badge manual">Commissioner edited</span>' : ''}<span class="spacer"></span>
      ${editing ? '<button class="btn" id="p-cancel">Cancel</button><button class="btn primary" id="p-save">Save poll</button>' : '<button class="btn" id="p-edit">Edit poll</button><button class="btn" id="p-regen">Regenerate</button>'}</div>
    ${hero}
    <div class="poll-cols">
    <section class="poll-board">
      <div class="pb-row pb-head"><span>Rank</span><span>Move</span><span>Team</span><span class="num">Record</span>${key === 0 ? '<span></span>' : `<span class="num" title="${key === 'final' ? 'National tournament record' : "Record in this poll's week"}">${key === 'final' ? 'Nat. Tourn.' : 'This week'}</span>`}<span class="num">${editing ? '' : 'Pts'}</span><span class="num">${editing ? '' : 'Prev'}</span></div>
      ${rows.map((x, i) => { const t = teamInfo(x.team) || {}; const p0 = prev[x.team]; const d = p0 ? p0 - (i + 1) : null;
        const mv = prevKey === undefined ? '' : !p0 ? '<span class="move new">NEW</span>' : d > 0 ? `<span class="move up">▲ ${d}</span>` : d < 0 ? `<span class="move down">▼ ${-d}</span>` : '<span class="muted">—</span>';
        const wr = weekRec(x.team); let wk = '<span class="num muted">—</span>';
        if (key === 0) wk = '<span></span>'; else if (wr) { const [w, l] = wr.split('-').map(Number); wk = `<span class="num"><span class="wk-rec wk-hover ${w > l ? 'up' : w < l ? 'down' : ''}" data-wk="${esc(x.team)}" tabindex="0" aria-label="${esc(`${x.team} went ${wr}. Show the games`)}">${wr}</span></span>`; }
        return `<div class="pb-row"><span class="pb-rank">${i + 1}</span><span class="pb-move">${mv}</span>
          <span class="pb-team"><span class="pb-logo">${logoImg(t, 32)}</span><span class="pb-name"><span class="pb-n1"><a class="team-link" href="${teamHref(x.team)}">${esc(x.team)}</a>${!editing && x.fp ? ` <span class="muted small">(${x.fp})</span>` : ''}</span><small>${confShort(t.conference)}</small></span></span>
          <span class="num pb-rec">${esc(x.record || '')}</span>${wk}
          ${editing ? `<span class="pb-edit"><button class="btn sm" data-up="${i}" ${i ? '' : 'disabled'} aria-label="Move up">▲</button> <button class="btn sm" data-down="${i}" ${i < rows.length - 1 ? '' : 'disabled'} aria-label="Move down">▼</button> <button class="btn sm danger" data-rm="${i}" aria-label="Remove">✕</button></span>`
            : `<span class="num pb-pts">${x.pts ?? ''}</span><span class="num muted">${prevKey !== undefined ? p0 ?? '—' : ''}</span>`}</div>`; }).join('')}
      ${editing ? `<div class="row pb-add"><select id="p-add">${teamOptions('', { blankLabel: 'Add a team…', list: teamNames().filter(t => !rows.some(r => r.team === t)) })}</select><span class="muted small">Added teams go to the bottom; move them up with ▲. The poll keeps ${poll.size || poll.ranks.length} teams.</span></div>` : ''}
      <p class="small muted pb-note">${poll.ballots ? `${poll.voters} voters` : `${poll.voters || 40} simulated voters`}. First-place votes in parentheses. ${poll.ranks.length !== pollSizeOf(s) ? `This poll ranks ${poll.ranks.length} teams; polls released from now on rank ${pollSizeOf(s)}. ` : ''}Polls come out when a week's games are all final.</p>
    </section>
    <aside class="poll-side">
      ${moves.length ? `<section class="ps-box"><h3>Biggest movers</h3>${moves.map(m => `<div class="ps-mv"><span>${logoImg(teamInfo(m.team), 20)} ${esc(m.team)}</span><span class="move ${m.d > 0 ? 'up' : 'down'}">${m.d > 0 ? '▲' : '▼'} ${Math.abs(m.d)} to No. ${m.now}</span></div>`).join('')}</section>` : ''}
      <section class="ps-box"><h3>Receiving votes</h3>${poll.others?.length ? `<p>${poll.others.map(o => `${esc(o.team)} ${o.pts}`).join(', ')}</p>` : '<p class="muted">None this week.</p>'}</section>
      ${prevKey !== undefined ? `<section class="ps-box"><h3>Dropped out</h3>${dropped.length ? dropped.map(d => `<div class="ps-mv"><span>${logoImg(teamInfo(d.team), 20)} ${esc(d.team)}</span><span class="muted small">was No. ${d.was}${d.week ? `, ${d.week}` : ''}</span></div>`).join('') : '<p class="muted">Nobody this week.</p>'}</section>` : ''}
    </aside>
    </div>
    ${voterPanel(s, poll)}`;
  bindWeekPopups(root, s, weekGames, key);
  $$('[data-voter]', root).forEach(b => (b.onclick = e => { if (e.target.closest('[data-unvoter]')) return; ui.voter = ui.voter === b.dataset.voter ? null : b.dataset.voter; renderRankings(); }));
  if ($('#v-add', root)) $('#v-add', root).onclick = () => {
    const cur = ctx.league.seasons[ctx.league.currentYear];
    const v = addRandomVoter(cur);
    changed({ progress: false });
    toast(`${v.name} (${v.outlet}) joins the panel and votes from the next poll. ${voterStyle(cur, v)}`);
  };
  $$('[data-unvoter]', root).forEach(b => (b.onclick = () => {
    const cur = ctx.league.seasons[ctx.league.currentYear], v = votersOf(cur).find(x => x.id === b.dataset.unvoter);
    if (!v || !confirm(`Remove ${v.name} from the voter panel? Polls already out keep their ballot.`)) return;
    removeVoter(cur, v.id); if (ui.voter === v.id) ui.voter = null; changed({ progress: false });
  }));
  $$('[data-pw]', root).forEach(b => (b.onclick = () => { ui.pollWeek = b.dataset.pw === 'final' ? 'final' : Number(b.dataset.pw); ui.editPoll = null; renderRankings(); }));
  const recs = cache.recs();
  if ($('#p-edit', root)) $('#p-edit', root).onclick = () => { ui.editPoll = { key, ranks: poll.ranks.map(x => ({ ...x })) }; renderRankings(); };
  if ($('#p-cancel', root)) $('#p-cancel', root).onclick = () => { ui.editPoll = null; renderRankings(); };
  if ($('#p-regen', root)) $('#p-regen', root).onclick = () => {
    if (!confirm('Regenerate this poll from scratch? Your edits to it will be replaced.')) return;
    s.polls[key] = key === 'final' ? generatePoll(s, 'final', { final: true, postBonus: postseasonBonus(s) }) : generatePoll(s, key);
    changed({ progress: false }); toast('Poll regenerated.');
  };
  if ($('#p-save', root)) $('#p-save', root).onclick = () => {
    const ranks = ui.editPoll.ranks.slice(0, poll.size || poll.ranks.length);
    const kept = new Set(ranks.map(r => r.team));
    s.polls[key] = { ...poll, edited: true, ranks: ranks.map(r => ({ ...r, pts: r.pts ?? 0, fp: r.fp ?? 0 })), others: [...poll.others || [], ...poll.ranks.filter(r => !kept.has(r.team))].filter(o => !kept.has(o.team)) };
    ui.editPoll = null; changed({ progress: false }); toast('Poll saved.');
  };
  const list = ui.editPoll?.ranks;
  $$('[data-up]', root).forEach(b => (b.onclick = () => { const i = +b.dataset.up; [list[i - 1], list[i]] = [list[i], list[i - 1]]; renderRankings(); }));
  $$('[data-down]', root).forEach(b => (b.onclick = () => { const i = +b.dataset.down; [list[i + 1], list[i]] = [list[i], list[i + 1]]; renderRankings(); }));
  $$('[data-rm]', root).forEach(b => (b.onclick = () => { list.splice(+b.dataset.rm, 1); renderRankings(); }));
  if ($('#p-add', root)) $('#p-add', root).onchange = e => {
    const t = e.target.value; if (!t) return;
    const r = recs[t];
    list.push({ team: t, record: `${r.w}-${r.l}-${r.t || 0}`, pts: 0, fp: 0 });
    const cap = poll.size || poll.ranks.length;
    if (list.length > cap) list.splice(cap - 1, 1);
    renderRankings();
  };
}

// The voter panel: who votes, how they lean, their #1 this week, and any
// voter's full ballot next to the poll.
function voterPanel(s, poll) {
  if (!poll.ballots) return `<div class="card" style="margin-top:16px"><h2>The voters</h2><p class="muted">Individual ballots weren't saved for this poll. Regenerate it to see them.</p></div>`;
  const rank = pollRankMap(poll);
  const panel = votersOf(s);
  const canEdit = s.year === ctx.league.currentYear;
  const pick = ui.voter && poll.ballots[ui.voter] ? panel.find(v => v.id === ui.voter) : null;
  const ballot = pick ? poll.ballots[pick.id] : null;
  const diff = (t, i) => {
    const r = rank[t];
    if (!r) return '<span class="move up">Not in poll</span>';
    const d = r - (i + 1);
    return d === 0 ? '<span class="muted">same</span>' : d > 0 ? `<span class="move up">poll #${r}</span>` : `<span class="move down">poll #${r}</span>`;
  };
  return `<div class="card" style="margin-top:16px">
    <div class="row" style="margin-bottom:6px"><h2 style="margin:0">The voters</h2><span class="muted small">${panel.length} voters, each with their own way of ranking. Click a voter to see their ballot.</span><span class="spacer"></span>${canEdit ? '<button class="btn sm" id="v-add" title="Add a voter with a random name, outlet and personality">+ Add voter</button>' : ''}</div>
    <div class="voter-layout">
      <div class="table-wrap"><table class="voters">
        <thead><tr><th>Voter</th><th>Tendency</th><th>#1 vote</th></tr></thead>
        <tbody>${panel.map(v => `<tr class="clickable ${pick?.id === v.id ? 'sel' : ''}" data-voter="${v.id}"><td><b>${esc(v.name)}</b>${v.added ? ' <span class="badge">Added</span>' : ''}<div class="small muted">${esc(v.outlet)}</div></td><td class="small">${esc(voterStyle(s, v))}</td><td>${poll.ballots[v.id]?.[0] ? team(poll.ballots[v.id][0], { rank: false, size: 16, link: false }) : v.added ? '<span class="small muted">Joined after this poll</span>' : ''}${v.added && canEdit ? ` <button class="btn sm ghost" data-unvoter="${v.id}" title="Remove ${esc(v.name)} from the panel" aria-label="Remove voter">✕</button>` : ''}</td></tr>`).join('')}</tbody></table></div>
      ${pick ? `<div class="ballot"><h3>${esc(pick.name)}'s ballot</h3><div class="small muted" style="margin-bottom:6px">${esc(pick.outlet)} · ${esc(voterStyle(s, pick))}</div>
        <table><tbody>${ballot.map((t, i) => `<tr><td class="num"><b>${i + 1}</b></td><td>${team(t, { rank: false, size: 16 })}</td><td class="num small">${diff(t, i)}</td></tr>`).join('')}</tbody></table>
        <p class="small muted">${poll.edited ? 'The published poll was edited by the commissioner after the votes came in.' : 'Green: this voter ranks the team higher than the poll. Red: lower.'}</p></div>` : ''}
    </div></div>`;
}

// Bracketology: the projected NCAA field and regionals as of today. It
// starts once Week 4 is in the books and stops once the real field is out.
function renderBracketology(root) {
  const s = S(), p = s.post || {};
  const W = BRACKETOLOGY_FROM_WEEK;
  const reg = s.games.filter(g => g.type === 'regular');
  const doneThrough = (() => { let w = 0; for (let k = 1; k <= regWeeksOf(s); k++) { const gs = reg.filter(g => g.week === k); if (gs.length && gs.every(isFinal)) w = k; else break; } return w; })();
  if (p.field && s.phase !== 'selection') { root.innerHTML = `<div class="empty">The ${seasonLabel(s.year)} National Tournament field has been announced. <a href="#/postseason">See the real bracket</a>.</div>`; return; }
  if (doneThrough < W) {
    root.innerHTML = `<div class="empty">Bracketology comes out once Week ${W} is finished${doneThrough ? ` (games are final through Week ${doneThrough})` : ''}. It projects the National Tournament field and the regionals as if the season ended that day, and updates as games are played.</div>`;
    return;
  }
  const B = bracketology(s), r = rating(s), recs = cache.recs(), pr = cache.ranks();
  const sameConfPair = (a, b) => confClashes([[a, b]], s).length > 0;
  const seedOf = Object.fromEntries(B.field.map(f => [f.team, f.seed]));
  const autoSet = new Set(Object.values(B.autos).filter(Boolean));
  const asOf = s.phase === 'regular' ? `after Week ${doneThrough}` : 'today';
  const row = (t, k) => `<div class="bo-row"><span class="bo-seed">${k + 1}</span><span class="bo-team">${team(t, { rank: false, size: 16 })}</span><span>${autoSet.has(t) ? '<span class="badge real" title="Projected automatic bid">AQ</span>' : ''}</span>
    <span class="bo-conf" title="${esc(s.teams[t].conference)}">${confLogo(s.teams[t].conference, 16)}</span><span class="bo-num">${recs[t].w}-${recs[t].l}-${recs[t].t || 0}</span><span class="bo-num muted" title="${indexName(s)} rank">${r[t]?.rank ? `${indexName(s)} ${r[t].rank}` : ''}</span></div>`;
  const regionals = noRegionals(B.cfg) ? `<div class="card bo-reg"><div class="bo-head"><h3>${esc(s.settings.mcwsName)}</h3><span class="muted small">Single elimination, seeds 1–${B.field.length}</span></div>${regionalFirstRound(B.field.length).map(pair => `<div class="bo-pair">${pair.map(k => (k == null ? '<div class="bo-row bye"><span class="bo-seed"></span><span class="bo-team muted">Bye</span></div>' : row(B.field[k - 1].team, k - 1))).join('')}</div>`).join('')}</div>` : B.regionals.map(teams => `<div class="card bo-reg"><div class="bo-head"><h3>${esc(teams[0])} Region</h3><span class="muted small">National seed ${seedOf[teams[0]]}</span></div>${regionalFirstRound(teams.length).map(pair => `<div class="bo-pair${pair[1] && sameConfPair(teams[pair[0] - 1], teams[pair[1] - 1]) ? ' clash' : ''}">${pair.map(k => (k == null ? '<div class="bo-row bye"><span class="bo-seed"></span><span class="bo-team muted">Bye</span></div>' : row(teams[k - 1], k - 1))).join('')}</div>`).join('')}</div>`).join('');
  const list = (title, teams, note) => `<div class="bo-list"><h3>${title}</h3>${teams.length ? `<ol>${teams.map(t => `<li>${team(t, { rank: false, size: 16 })} <span class="muted small">${recs[t].w}-${recs[t].l}-${recs[t].t || 0} · ${indexName(s)} ${r[t]?.rank ?? '–'}</span></li>`).join('')}</ol>` : '<p class="muted small">—</p>'}${note ? `<p class="small muted">${note}</p>` : ''}</div>`;
  const autoList = Object.entries(B.autos).filter(([, t]) => t).sort((a, b) => a[0].localeCompare(b[0]));
  root.innerHTML = `<div class="hint">Projected ${asOf}: ${noRegionals(B.cfg) ? `${B.field.length} teams, seeded 1–${B.field.length}, all at the finals site.` : `${B.field.length} teams in ${B.cfg.regionals} regions, seeded 1–${B.cfg.perRegional} in each. Teams on the same seed line trade places so conference rivals don't meet in the first round, if any swap allows it.`} Automatic bids go to each conference's current leader${s.phase === 'conf' ? ' (or tournament champion)' : ''}; at-large spots and seeds come from the committee's team-by-team comparisons (see below), and teams below .500 can't take an at-large spot. It changes as games are played.${B.fill.length ? ` <b>Too few at-large candidates are .500 or better to fill the field, so the best of the rest take the last ${B.fill.length} spot${B.fill.length > 1 ? 's' : ''}: ${B.fill.map(esc).join(', ')}.</b>` : ''}</div>
    <div class="bo-layout">
      <div class="bo-grid">${regionals}</div>
      <aside class="card bo-side">
        <div class="bo-list"><h3>Projected automatic bids</h3><ul class="bo-aq">${autoList.map(([c, t]) => `<li>${confLogo(c, 16)} <span class="muted small">${esc(c)}</span> ${team(t, { rank: false, size: 16 })}</li>`).join('')}</ul></div>
        ${list('Last four in', B.lastIn)}
        ${list('First four out', B.firstOut)}
        ${list('Next four out', B.nextOut)}
      </aside>
    </div>
    <div style="margin-top:16px">${committeeBox()}</div>`;
}

function renderRpiTab(root) {
  if (usesNpi(S())) return renderNpiTab(root);
  const s = S(), r = rating(s), recs = cache.recs(), pr = cache.ranks(), Q = quadrants(s, r);
  const qc = (t, i) => { const x = Q[t].rec[i]; return `<td class="num${x.w + x.l + (x.t || 0) ? '' : ' muted'}">${x.w}-${x.l}-${x.t || 0}</td>`; };
  const teams = Object.keys(s.teams).filter(t => r[t].games).sort((a, b) => r[a].rank - r[b].rank);
  root.innerHTML = `<div class="card"><div class="table-wrap"><table>
    <thead><tr><th class="num">RPI</th><th>Team</th><th>Conf</th><th class="num">Record</th><th class="num">WP</th><th class="num">OWP</th><th class="num">OOWP</th><th class="num">Rating</th><th class="num">SOS</th><th class="num">Poll</th>${QHEAD}</tr></thead>
    <tbody>${teams.map(t => `<tr><td class="num"><b>${r[t].rank}</b></td><td>${team(t, { rank: false })}</td><td>${confLogo(s.teams[t].conference, 18)}</td><td class="num">${recs[t].w}-${recs[t].l}-${recs[t].t || 0}</td>
      <td class="num">${fmtPct(r[t].wp)}</td><td class="num">${fmtPct(r[t].owp)}</td><td class="num">${fmtPct(r[t].oowp)}</td><td class="num"><b>${r[t].rpi.toFixed(4).replace(/^0/, '')}</b></td><td class="num muted">${r[t].sosRank ?? ''}</td><td class="num muted">${pr[t] ?? ''}</td>${[0, 1, 2, 3].map(i => qc(t, i)).join('')}</tr>`).join('') || '<tr><td colspan="14" class="muted">The RPI starts once games are played.</td></tr>'}</tbody></table></div>
    <p class="small muted">RPI = 25% winning percentage + 50% opponents' winning percentage (not counting games against this team) + 25% opponents' opponents' winning percentage. RPI is the selection committee's first criterion, alongside Q1 wins and Q4 losses. ${quadText(Object.keys(s.teams).length)}</p></div>`;
}

// The NCAA Power Index tab (seasons with settings.index 'npi').
function renderNpiTab(root) {
  const s = S(), r = rating(s), recs = cache.recs(), pr = cache.ranks(), Q = quadrants(s, r), D = NPI_DIALS;
  const qc = (t, i) => { const x = Q[t].rec[i]; return `<td class="num${x.w + x.l + (x.t || 0) ? '' : ' muted'}">${x.w}-${x.l}-${x.t || 0}</td>`; };
  const teams = Object.keys(s.teams).filter(t => r[t].games).sort((a, b) => r[a].rank - r[b].rank);
  const adj = t => { const a = r[t].adj; return `${a.w}-${a.l}-${a.t}`; };
  root.innerHTML = `<div class="card"><div class="table-wrap"><table>
    <thead><tr><th class="num">NPI</th><th>Team</th><th>Conf</th><th class="num">Record</th><th class="num" title="The record the NPI counts, after dropping wins that would lower it">NPI record</th><th class="num" title="Winning percentage of the NPI record (a regular-season overtime win counts 0.67)">Win %</th><th class="num" title="Average NPI of the opponents in the NPI record">SOS</th><th class="num" title="Quality-win bonus points">QWB</th><th class="num">Rating</th><th class="num">SOS rk</th><th class="num">Poll</th>${QHEAD}</tr></thead>
    <tbody>${teams.map(t => `<tr><td class="num"><b>${r[t].rank}</b></td><td>${team(t, { rank: false })}</td><td>${confLogo(s.teams[t].conference, 18)}</td><td class="num">${recs[t].w}-${recs[t].l}-${recs[t].t || 0}</td>
      <td class="num${r[t].dropped ? '' : ' muted'}">${adj(t)}</td><td class="num">${fmtPct(r[t].wp)}</td><td class="num">${r[t].sos.toFixed(2)}</td><td class="num">${r[t].qwb.toFixed(2)}</td><td class="num"><b>${r[t].npi.toFixed(3)}</b></td><td class="num muted">${r[t].sosRank ?? ''}</td><td class="num muted">${pr[t] ?? ''}</td>${[0, 1, 2, 3].map(i => qc(t, i)).join('')}</tr>`).join('') || '<tr><td colspan="15" class="muted">The NPI starts once games are played.</td></tr>'}</tbody></table></div>
    <p class="small muted">The Power Index (NPI), with the dials used for college ice hockey: each game is worth ${D.win} for a win plus ${D.sos}% of the opponent's NPI, plus a quality-win bonus of (opponent's NPI − ${D.qwbBase}) × ${D.qwbMult} for a win over a team above ${D.qwbBase.toFixed(2)}; a loss is worth ${D.sos}% of the opponent's NPI. Away wins and home losses weigh ${D.away}, home wins and away losses ${D.home}. A regular-season overtime win counts ${D.otWin} of a win (${(1 - D.otWin).toFixed(2)} of a loss); in the postseason an overtime win is a full win. A tie is half of each. A team's NPI is the average of its games, and it keeps at least ${D.minWins} wins, dropping any others that would lower its NPI (the NPI record). Every team starts at 50 and the NPIs are worked out again until they settle; the quality-win bonuses are then added, figured from the opponents' NPIs without bonuses. The committee picks the at-large teams and seeds the field in NPI order. ${quadText(Object.keys(s.teams).length)}</p></div>`;
}

function renderSosTab(root) {
  if (usesNpi(S())) {
    const s = S(), r = rating(s), recs = cache.recs(), pr = cache.ranks();
    const teams = Object.keys(s.teams).filter(t => r[t].games).sort((a, b) => r[a].sosRank - r[b].sosRank);
    root.innerHTML = `<div class="card"><div class="table-wrap"><table>
    <thead><tr><th class="num">SOS</th><th>Team</th><th>Conf</th><th class="num">Record</th><th class="num" title="Average NPI of the opponents in the NPI record">Opp. NPI</th><th class="num">NPI</th><th class="num">Poll</th></tr></thead>
    <tbody>${teams.map(t => `<tr><td class="num"><b>${r[t].sosRank}</b></td><td>${team(t, { rank: false })}</td><td>${confLogo(s.teams[t].conference, 18)}</td><td class="num">${recs[t].w}-${recs[t].l}-${recs[t].t || 0}</td>
      <td class="num"><b>${r[t].sos.toFixed(3)}</b></td><td class="num muted">${r[t].rank ?? ''}</td><td class="num muted">${pr[t] ?? ''}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">Strength of schedule starts once games are played.</td></tr>'}</tbody></table></div>
    <p class="small muted">Strength of schedule is the NPI's: the average NPI of a team's opponents, counting the games in its NPI record. It makes up ${NPI_DIALS.sos}% of the NPI.</p></div>`;
    return;
  }
  const s = S(), r = rating(s), recs = cache.recs(), pr = cache.ranks();
  const teams = Object.keys(s.teams).filter(t => r[t].games).sort((a, b) => r[a].sosRank - r[b].sosRank);
  root.innerHTML = `<div class="card"><div class="table-wrap"><table>
    <thead><tr><th class="num">SOS</th><th>Team</th><th>Conf</th><th class="num">Record</th><th class="num">Opponents' record</th><th class="num">Opp. win %</th><th class="num">Opp. opp. win %</th><th class="num">Rating</th><th class="num">RPI</th><th class="num">Poll</th></tr></thead>
    <tbody>${teams.map(t => `<tr><td class="num"><b>${r[t].sosRank}</b></td><td>${team(t, { rank: false })}</td><td>${confLogo(s.teams[t].conference, 18)}</td><td class="num">${recs[t].w}-${recs[t].l}-${recs[t].t || 0}</td>
      <td class="num">${r[t].oppW}-${r[t].oppL}</td><td class="num">${fmtPct(r[t].owp)}</td><td class="num">${fmtPct(r[t].oowp)}</td><td class="num"><b>${r[t].sos.toFixed(4).replace(/^0/, '')}</b></td><td class="num muted">${r[t].rank ?? ''}</td><td class="num muted">${pr[t] ?? ''}</td></tr>`).join('') || '<tr><td colspan="10" class="muted">Strength of schedule starts once games are played.</td></tr>'}</tbody></table></div>
    <p class="small muted">Strength of schedule = ⅔ opponents' winning percentage (not counting games against this team) + ⅓ opponents' opponents' winning percentage. Opponents' record counts every game a team's opponents played, once per meeting. Strength of schedule is in the selection committee's second tier, with head-to-head, Q2 wins and overall record.</p></div>`;
}

function renderPowerTab(root) {
  const s = S(), recs = cache.recs(), pr = cache.ranks();
  const teams = Object.keys(s.teams).sort((a, b) => ovr(s.teams[b]) - ovr(s.teams[a]) || s.teams[b].pit - s.teams[a].pit);
  root.innerHTML = `<div class="card"><div class="table-wrap"><table>
    <thead><tr><th class="num">#</th><th>Team</th><th>Conf</th><th class="num" title="Attack">ATK</th><th class="num" title="Serving and passing">SRV</th><th class="num" title="Blocking and digging">DEF</th><th class="num">OVR</th><th class="num">Record</th><th class="num">Poll</th></tr></thead>
    <tbody>${teams.map((t, i) => { const x = s.teams[t]; return `<tr><td class="num">${i + 1}</td><td>${team(t, { rank: false })}</td><td>${confLogo(x.conference, 18)}</td><td class="num">${x.off}</td><td class="num">${x.pit}</td><td class="num">${x.def}</td><td class="num"><b>${ovr(x)}</b></td><td class="num">${recs[t].w}-${recs[t].l}-${recs[t].t || 0}</td><td class="num muted">${pr[t] ?? ''}</td></tr>`; }).join('')}</tbody></table></div>
    <p class="small muted">OVR = 40% ATK + 30% SRV + 30% DEF. Change ratings on the Teams page or a team's profile.</p></div>`;
}

// ---------- Postseason ----------

// A drawn bracket. Rounds are columns; every game sits halfway between the
// two games that feed it, joined by lines. Double elimination draws the
// winners bracket on top, the elimination bracket underneath, and the
// championship to the right. Cards show R/H/E; click for the line score.
const BK = { CW: 300, COLW: 340, H: 90, SLOT: 104, HEAD: 30, SEC_GAP: 34 };

function eventBracket(ev, seedFn, { stack = false, colw = BK.COLW, cw = BK.CW, h = BK.H, slot: SLOTW = BK.SLOT, mirror = false, cls = '' } = {}) {
  // `mirror` draws the bracket right to left (the right-hand regions of the
  // full bracket); `cw`, `h` and `slot` make the boxes smaller.
  const COLW = colw;
  const BKX = { ...BK, CW: cw, H: h, SLOT: SLOTW };
  const s = S();
  const rankOn = !!s.post?.confT && Object.values(s.post.confT).includes(ev); // poll rankings on conference tournament brackets only
  ensureLayout(ev);
  const byKey = Object.fromEntries(ev.nodes.map(n => [n.key, n]));
  const secOf = n => n.sec || 'W';
  const kids = n => [n.a, n.b].filter(r => r && r.w && byKey[r.w] && secOf(byKey[r.w]) === secOf(n)).map(r => byKey[r.w]);
  const pos = {};
  // "Games" against a bye never happen; leave them out (the owner's rule,
  // Nov. 2026): a team with a bye starts in the next round, next to an
  // empty slot.
  const hidden = new Set(ev.nodes.filter(n => nodeTeams(ev, n).includes('BYE')).map(n => n.key));
  const sections = ['W', 'L'].filter(sec => ev.nodes.some(n => secOf(n) === sec));
  const double = sections.includes('L');
  let top = 0, maxCol = 0;
  const heads = [];
  for (const sec of sections) {
    const nodes = ev.nodes.filter(n => secOf(n) === sec);
    const fed = new Set(nodes.flatMap(n => kids(n).map(k => k.key)));
    const roots = nodes.filter(n => !fed.has(n.key));
    let slot = 0;
    const secTop = top + (double ? BK.SEC_GAP : 0) + BK.HEAD;
    const place = n => {
      if (pos[n.key]) return pos[n.key].y;
      const ks = kids(n);
      const y = ks.length ? ks.map(place).reduce((a, b) => a + b, 0) / ks.length : secTop + (slot++) * BKX.SLOT;
      pos[n.key] = { x: n.col * COLW, y };
      maxCol = Math.max(maxCol, n.col);
      return y;
    };
    roots.forEach(place);
    const cols = [...new Set(nodes.map(n => n.col))].sort((a, b) => a - b);
    for (const c of cols) {
      const first = nodes.find(n => n.col === c && !hidden.has(n.key));
      if (!first) continue;
      const byDay = ev.kind === 'regional' || ev.kind === 'mcws' || ev.kind === 'de';
      heads.push({ x: c * COLW, y: secTop - BK.HEAD, text: byDay ? DAY_NAMES[first.day] || first.day : first.label.replace(/ \(.*\)$/, ''), day: byDay ? null : first.day });
    }
    if (double) heads.push({ x: 0, y: top, text: sec === 'W' ? 'Winners bracket' : 'Elimination bracket', section: true });
    top = secTop + slot * BKX.SLOT;
  }
  // Championship column.
  const finals = ev.nodes.filter(n => secOf(n) === 'F');
  if (finals.length && !sections.length && stack) {
    // A best-of-three series stacked top to bottom (the Frozen Four Championship Series).
    finals.forEach((n, i) => {
      const step = BKX.H + BK.HEAD + 12;
      pos[n.key] = { x: 0, y: BK.HEAD + i * step };
      heads.push({ x: 0, y: i * step, text: `Game ${i + 1}`, day: n.day });
    });
  } else if (finals.length && !sections.length) {
    // A lone best-of-three series: the games side by side, left to right.
    finals.forEach((n, i) => {
      pos[n.key] = { x: i * COLW, y: BK.HEAD };
      heads.push({ x: i * COLW, y: 0, text: `Game ${i + 1}`, day: n.day });
    });
    top = BK.HEAD + BKX.SLOT;
  } else if (finals.length) {
    const x = sections.length ? (maxCol + 1) * COLW : 0;
    const feeders = [finals[0].a, finals[0].b].map(r => r && pos[r.w || r.l]).filter(Boolean);
    const mid = feeders.length ? feeders.reduce((a, p) => a + p.y, 0) / feeders.length : BK.HEAD;
    const start = Math.max(BK.HEAD, mid - ((finals.length - 1) * BKX.SLOT) / 2);
    finals.forEach((n, i) => { pos[n.key] = { x, y: start + i * BKX.SLOT }; });
    const finalsTitle = ev.id?.startsWith('reg-') ? 'Region final' : ev.id?.startsWith('sup-') ? 'Super regional' : ev.kind === 'mcws' ? 'National final' : ev.kind === 'series' ? 'Best of three' : ev.bracket ? 'Bracket final' : ev.kind === 'regional' || ev.kind === 'de' ? (ev.id.startsWith('reg') ? 'Regional final' : 'Final') : 'Championship';
    heads.push({ x, y: start - BK.HEAD, text: finalsTitle, day: ev.kind === 'series' ? null : finals[0].day });
    top = Math.max(top, start + finals.length * BKX.SLOT);
  }
  const width = Math.max(...Object.values(pos).map(p => p.x)) + BKX.CW;
  const height = Math.max(...Object.values(pos).map(p => p.y)) + BKX.H + 4;

  if (mirror) { for (const k of Object.keys(pos)) pos[k] = { ...pos[k], x: width - BKX.CW - pos[k].x }; for (const hd of heads) if (!hd.section) hd.x = width - BKX.CW - hd.x; }
  // Connector lines: from each feeding game into the game it feeds.
  const lines = [];
  const link = (from, to) => {
    const x1 = mirror ? from.x : from.x + BKX.CW, y1 = from.y + BKX.H / 2, x2 = mirror ? to.x + BKX.CW : to.x, y2 = to.y + BKX.H / 2, mx = x1 + (x2 - x1) / 2;
    lines.push(`<path d="M${x1},${y1} H${mx} V${y2} H${x2}" />`);
  };
  for (const n of ev.nodes) {
    if (secOf(n) === 'F') continue;
    for (const k of kids(n)) if (!hidden.has(k.key)) link(pos[k.key], pos[n.key]);
  }
  if (finals.length) for (const r of [finals[0].a, finals[0].b]) { const f = r && pos[r.w]; if (f) link(f, pos[finals[0].key]); }

  const cell = node => {
    const label = node.code || node.label;
    if (node.gameId) { const g = s.games.find(x => x.id === node.gameId); if (g) return compactCard({ ...g, label }, seedFn, { top: nodeTeams(ev, node)[0] }); }
    const [a, b] = nodeTeams(ev, node);
    if (a === 'BYE' || b === 'BYE') {
      const t = a === 'BYE' ? b : a;
      return placeholderCard(label, [t, 'BYE'], seedFn, { faded: true, note: 'First-round bye', ranks: rankOn });
    }
    const needed = nodeNeeded(ev, node);
    const decidedBy = { g7: 'G6', f3: 'F2', s3: 'S2', ifnec: 'CH' }[node.cond];
    const decided = !!(decidedBy && byKey[decidedBy]?.winner);
    const slotText = (t, ref) => t || (refLabel(ev, ref) ? { text: refLabel(ev, ref) } : null);
    return placeholderCard(label, [slotText(a, node.a), slotText(b, node.b)], seedFn, { ranks: rankOn, faded: !!node.cond && !needed && !!decided, note: node.cond ? (decided && !needed ? 'Not needed' : 'If necessary') : '' });
  };
  return `<div class="bk-scroll"><div class="bk ${cls}" style="width:${width}px;height:${height}px">
    <svg class="bk-lines" width="${width}" height="${height}" aria-hidden="true">${lines.join('')}</svg>
    ${heads.map(h => `<div class="bk-head ${h.section ? 'bk-sec' : ''}" style="left:${h.x}px;top:${h.y}px;${h.section ? '' : `width:${BKX.CW}px`}">${esc(h.text)}${h.day ? ` <span class="muted">· ${esc(DAY_NAMES[h.day] || h.day)}</span>` : ''}</div>`).join('')}
    ${ev.nodes.map(n => pos[n.key] && !hidden.has(n.key) ? `<div class="bk-node" style="left:${pos[n.key].x}px;top:${pos[n.key].y}px;width:${BKX.CW}px;height:${BKX.H}px">${cell(n)}</div>` : '').join('')}
  </div></div>`;
}

// Anchor for an event's card (conference names can have spaces).
const evAnchor = id => `ev-${String(id).replace(/[^A-Za-z0-9_-]+/g, '-')}`;

// A link like #/postseason/2031/regionals/reg-3 opens that season's tab and
// scrolls to that bracket. The address then goes back to #/postseason so the
// season picker and tabs keep working.
export function renderPostseason(arg = '') {
  let focus = null;
  if (arg) {
    const [y, tab, ev] = arg.split('/');
    if (ctx.league.seasons[+y] && +y !== ctx.league.viewYear) { ctx.league.viewYear = +y; resetSeasonUi(); }
    if (tab) ui.postTab = tab;
    focus = ev || null;
    history.replaceState(null, '', '#/postseason');
  }
  renderPostseasonPage();
  // After the router's own scroll-to-top for a new page.
  if (focus) setTimeout(() => {
    const el = document.getElementById(evAnchor(focus));
    if (!el) return;
    el.scrollIntoView({ block: 'start' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1800);
  }, 0);
}

function renderPostseasonPage() {
  const s = S(), p = s.post || {};
  const cfg = ncaaConfig(s);
  const board = !noRegionals(cfg) && !hasSupers(cfg) && (p.regionals?.length || 0) >= 2;
  const defaultTab = { regular: 'conf', conf: 'conf', selection: 'field', regionals: board ? 'bracket' : 'regionals', supers: 'supers', mcws: board ? 'bracket' : 'mcws', complete: board ? 'bracket' : 'mcws' }[s.phase];
  const tabs = { conf: 'Conference tournaments', field: 'Selection', ...(board ? { bracket: 'Full bracket' } : {}), ...(noRegionals(cfg) ? {} : { regionals: 'Regions' }), ...(hasSupers(cfg) ? { supers: 'Super regionals' } : {}), participants: 'Participants', mcws: s.settings.mcwsName };
  if (!ui.postTab || !tabs[ui.postTab]) ui.postTab = defaultTab;
  const left = s.games.filter(g => g.type !== 'regular' && !isFinal(g)).length + (s.phase === 'regular' ? 1 : 0);
  app.innerHTML = `
    <div class="section-head"><h1>${seasonLabel(s.year)} Postseason</h1><span class="muted">${PHASE_TEXT[s.phase]}</span><span class="spacer"></span>
      ${s.phase !== 'complete' && s.phase !== 'regular' ? '<button class="btn" id="ps-all">🎲 Sim rest of postseason</button>' : ''}</div>
    ${p.champion ? `<div class="banner" style="background:linear-gradient(120deg, ${esc(teamInfo(p.champion).color)}, #15171c)"><span class="trophy">🏆</span><div><div class="small" style="opacity:.8">${seasonLabel(s.year)} National Champion</div><div class="big">${esc(p.champion)}</div><div class="small" style="opacity:.8">Runner-up: ${esc(p.runnerUp)}</div></div></div><div style="height:16px"></div>` : ''}
    <div class="steps">${Object.entries(tabs).map(([k, l]) => `<a href="#/postseason" data-pt="${k}" class="${ui.postTab === k ? 'active' : ''}">${esc(l)}</a>`).join('')}</div>
    <div id="ps"></div>`;
  $$('[data-pt]').forEach(a => (a.onclick = e => { e.preventDefault(); ui.postTab = a.dataset.pt; renderPostseasonPage(); }));
  if ($('#ps-all')) $('#ps-all').onclick = () => {
    if (!confirm('Simulate the rest of the postseason? The National Tournament field is announced as proposed if you haven\'t announced it yet.')) return;
    simAndReport(g => g.type !== 'regular', 'in the postseason', { autoLock: true });
  };
  const root = $('#ps');
  ({ conf: renderConfTourneys, field: renderField, bracket: renderBoard, regionals: renderRegionals, supers: renderSupers, participants: renderParticipants, mcws: renderMcws })[ui.postTab](root);
  bindGameCards(root);
}

function renderConfTourneys(root) {
  const s = S(), p = s.post || {};
  if (s.phase === 'regular') {
    const left = s.games.filter(g => g.type === 'regular' && !isFinal(g)).length;
    const confs = conferences(s);
    root.innerHTML = `<div class="hint">Conference tournaments are seeded and start automatically when the regular season ends (${left} game${left === 1 ? '' : 's'} left). Tournament sizes can be changed on the Standings page until then. Projected seeds:</div>
      <div class="grid" style="margin-top:14px">${confs.map(c => {
        const n = Object.values(s.teams).filter(t => t.conference === c).length;
        const size = Math.min(n, s.settings.confTourney?.[c] ?? defaultConfTourneySize(n));
        const seeds = confTourneySeeds(s, c).slice(0, size);
        return `<div class="card"><div class="row"><a href="${confHref(c)}">${confLogo(c, 26)}</a><h3 style="margin:0">${esc(c)} Tournament</h3><span class="spacer"></span><span class="muted small">${size ? `Top ${size}, ${confFormatName(confKind(s.settings.confFormat?.[c], size)).toLowerCase()}` : 'No tournament: regular-season champion gets the bid'}</span></div>
          ${size ? hostPicker(s, c) : ''}
          <ol class="seedlist">${seeds.map(t => `<li>${team(t)}</li>`).join('')}</ol></div>`;
      }).join('')}</div>`;
    bindHostPickers(root);
    return;
  }
  const evs = Object.values(p.confT || {});
  const anyOpen = s.games.some(g => g.type === 'conf' && !isFinal(g));
  root.innerHTML = `${anyOpen ? '<div class="row" style="margin-bottom:12px"><span class="spacer"></span><button class="btn primary" id="ct-sim">🎲 Sim conference tournaments</button></div>' : ''}
    ${evs.map(ev => {
      const started = ev.nodes.some(n => n.gameId && s.games.find(g => g.id === n.gameId && isFinal(g)));
      return `<div class="card" id="${evAnchor(ev.id)}"><div class="row" style="margin-bottom:10px"><a href="${confHref(ev.conf)}">${confLogo(ev.conf, 28)}</a><h2 style="margin:0">${esc(ev.conf)} Tournament</h2>
        ${ev.champion ? `<span class="badge gold">Champion: ${esc(ev.champion)}</span>` : ''}<span class="spacer"></span>
        ${started ? `<span class="muted small">${confFormatName(ev.kind)}</span>` : `${ev.size >= 3 ? `<select class="sm-select" data-cformat="${esc(ev.conf)}" aria-label="${esc(ev.conf)} tournament format">${CONF_FORMATS.filter(([k]) => k !== 'playin' || ev.size >= 5).map(([k, l]) => `<option value="${k}" ${ev.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select>` : ''}<button class="btn sm" data-reseed="${esc(ev.conf)}">Edit seeds</button>`}</div>
        ${hostPicker(s, ev.conf, ev)}
        <div class="small muted" style="margin-bottom:8px">Seeds: ${ev.seeds.map((t, i) => `${i + 1}. ${esc(t)}`).join(' · ')}</div>
        ${eventBracket(ev, t => ev.seeds.indexOf(t) + 1 || null)}</div>`;
    }).join('')}
    ${!evs.length ? '<div class="empty">No conference tournaments this season.</div>' : ''}`;
  if ($('#ct-sim', root)) $('#ct-sim', root).onclick = () => simAndReport(g => g.type === 'conf', 'in the conference tournaments');
  $$('[data-reseed]', root).forEach(b => (b.onclick = () => editSeeds(b.dataset.reseed)));
  bindHostPickers(root);
  $$('[data-cformat]', root).forEach(sel => (sel.onchange = () => {
    try { setConfFormat(s, sel.dataset.cformat, sel.value); } catch (e) { return toast(e.message, true); }
    changed(); toast(`${sel.dataset.cformat} Tournament is now ${sel.value} elimination.`);
  }));
}

// Tournament host: any school in the conference. It can be changed until
// the tournament is over; games already played stay where they were.
function hostPicker(s, conf, ev = null) {
  const host = ev?.host || confHost(s, conf);
  const teams = Object.values(s.teams).filter(t => t.conference === conf).map(t => t.school).sort();
  const locked = !!ev?.champion;
  const inField = !ev || ev.seeds.includes(host);
  return `<div class="row small host-row" style="margin:6px 0 8px;gap:8px">${logoImg(teamInfo(host), 18)}<span>Hosted by <b>${esc(host)}</b>${atField(s, host)}${inField ? '' : ` <span class="muted">(didn't qualify; every game is still played there)</span>`}</span>
    ${locked ? '' : `<label class="muted" style="display:inline-flex;align-items:center;gap:6px">Change <select class="sm-select" data-host="${esc(conf)}" aria-label="${esc(conf)} tournament host">${teamOptions(host, { blank: false, list: teams })}</select></label>`}</div>`;
}
function bindHostPickers(root) {
  const s = S();
  $$('[data-host]', root).forEach(sel => (sel.onchange = () => {
    setConfHost(s, sel.dataset.host, sel.value);
    changed(); toast(`The ${sel.dataset.host} Tournament is now at ${sel.value}.`);
  }));
}

function editSeeds(conf) {
  const s = S(), ev = s.post.confT[conf];
  const teams = Object.values(s.teams).filter(t => t.conference === conf).map(t => t.school).sort();
  modal.innerHTML = `<div class="modal-head"><h2>${esc(conf)} Tournament seeds</h2><button class="btn ghost" data-x>✕</button></div>
    <div class="modal-body stack">${ev.seeds.map((t, i) => `<label class="field">Seed ${i + 1} <select data-seed="${i}">${teamOptions(t, { blank: false, list: teams })}</select></label>`).join('')}</div>
    <div class="modal-foot"><span class="spacer"></span><button class="btn" data-x>Cancel</button><button class="btn primary" id="sd-save">Save seeds</button></div>`;
  $$('[data-x]', modal).forEach(b => (b.onclick = () => modal.close()));
  modal.onclose = () => ctx.render();
  $('#sd-save', modal).onclick = () => {
    const seeds = $$('[data-seed]', modal).map(x => x.value);
    if (new Set(seeds).size !== seeds.length) return toast('Each team can only have one seed.', true);
    try { reseedConfTourney(s, conf, seeds); } catch (e) { return toast(e.message, true); }
    modal.close(); changed(); toast('Seeds saved.');
  };
  modal.showModal();
}

const IX = () => indexName(S());
const COMMITTEE_TEXT_RPI = 'team-by-team comparisons: Tier 1 RPI, Q1 wins, Q4 losses; then Tier 2; then Tier 3';
const COMMITTEE_TEXT_NPI = 'the NPI: at-large teams in NPI order, then seeds in NPI order';
// The committee's criteria, for a collapsible note on the Selection and Bracketology tabs.
const committeeBox = (open = false) => usesNpi(S()) ? `<details class="card small committee-box"${open ? ' open' : ''}><summary><b>How the committee picks and seeds teams</b></summary>
  <p class="muted" style="margin:8px 0 0">The committee goes by the Power Index (NPI), as in the real NPI sports: automatic bids first, then at-large teams in NPI order until the field is full, and the seeds in NPI order. Quadrant records, strength of schedule and head-to-head are on the sheet for reference.</p></details>` : `<details class="card small committee-box"${open ? ' open' : ''}><summary><b>How the committee compares teams</b></summary>
  <p class="muted" style="margin:8px 0 6px">Teams are compared two at a time. In each tier, every criterion goes to the better team; whoever wins more of the tier's criteria is ranked higher. A tier only matters if the one before it is even.</p>
  <ol class="tier-list">${COMMITTEE_TIERS.map((t, i) => `<li><b>${t.name}${i === 2 ? ' (splitting hairs)' : ''}:</b> ${t.items.map(([, l]) => l).join(', ')}</li>`).join('')}</ol>
  <p class="muted" style="margin:6px 0 0">Ranking works one matchup at a time: teams start in RPI order, and each team moves up past every team it beats in a comparison until it meets one that beats it. If A beats B, then C is compared with B; if C wins, C is compared with A. The same comparisons pick the at-large teams (across the league) and set the seeds (within the field). Win percentages only count when both teams have games in that quadrant; fewer losses is better.</p></details>`;
const QHEAD = ['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => `<th class="num q${i + 1}" title="Record in ${q} matches (see the note below the table)">${q}</th>`).join('');
const quadText = n => { const C = quadCuts(n), r = (loc, k) => `${k ? C[loc][k - 1] + 1 : 1}-${C[loc][k]}`;
  return `Quadrants follow the selection committee's team sheet: a game's quadrant depends on the opponent's ${IX()} rank and where it was played. Q1 is home vs. ${IX()} ${r('home', 0)}, neutral ${r('neutral', 0)}, away ${r('away', 0)}; Q2 home ${r('home', 1)}, neutral ${r('neutral', 1)}, away ${r('away', 1)}; Q3 home ${r('home', 2)}, neutral ${r('neutral', 2)}, away ${r('away', 2)}; Q4 is everything else. For the committee, Q1 and Q2 wins count most and Q3 and Q4 losses hurt most.`; };

// Drag-to-reorder for table rows. Works with a mouse, pen or finger: press
// a row's handle (⠿), drag, and let go where the team should land. The page
// scrolls when the pointer nears the top or bottom of the window.
function dragSort(tbody, onMove) {
  tbody.addEventListener('pointerdown', e => {
    const handle = e.target.closest('[data-drag]');
    if (!handle || e.button > 0) return;
    e.preventDefault();
    const rows = [...tbody.querySelectorAll('tr[data-seed-i]')];
    const from = +handle.dataset.drag, row = rows[from];
    let to = from, lastY = e.clientY, raf = 0;
    row.classList.add('dragging');
    document.body.classList.add('is-dragging');
    handle.setPointerCapture?.(e.pointerId);
    const place = () => {
      const y = lastY;
      to = rows.length - 1;
      for (let i = 0; i < rows.length; i++) {
        const b = rows[i].getBoundingClientRect();
        if (y < b.top + b.height / 2) { to = i > from ? i - 1 : i; break; }
      }
      rows.forEach((rw, i) => rw.classList.toggle('drop-before', to < from && i === to));
      rows.forEach((rw, i) => rw.classList.toggle('drop-after', to > from && i === to));
    };
    const scroll = () => {
      const edge = 60, h = window.innerHeight;
      const dy = lastY < edge ? -(edge - lastY) / 3 : lastY > h - edge ? (lastY - (h - edge)) / 3 : 0;
      if (dy) { window.scrollBy(0, dy); place(); }
      raf = requestAnimationFrame(scroll);
    };
    raf = requestAnimationFrame(scroll);
    const move = ev => { lastY = ev.clientY; place(); };
    const up = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      document.body.classList.remove('is-dragging');
      rows.forEach(rw => rw.classList.remove('dragging', 'drop-before', 'drop-after'));
      onMove(from, to);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  });
}

function renderField(root) {
  const s = S(), p = s.post || {};
  if (!p.field) {
    const cfg = ncaaConfig(s);
    root.innerHTML = `<div class="empty">The ${fieldSize(cfg)}-team National Tournament field is chosen once every conference tournament is finished. It has ${Object.keys(ctx.league.conferences).length ? 'one automatic bid per conference (the tournament champion, or the regular-season champion where there is no tournament)' : 'automatic bids'}, and the rest are at-large picks. ${usesNpi(S()) ? 'The committee goes straight down the NPI' : 'The committee compares teams two at a time (Tier 1: RPI, Q1 wins, Q4 losses; Tier 2: strength of schedule, head-to-head, Q2 wins, overall W-L; Tier 3: automatic bid, regular-season title, Q3 losses, Q1 and Q2 win percentages)'} as a starting point; you pick the at-large teams and set the seeds.<br><br>${formatSummary(cfg)} <a href="#/settings">Change the format in Settings.</a></div>`;
    return;
  }
  const r = rating(s), pr = cache.ranks(), recs = cache.recs(), Q = quadrants(s, r), sheet = committeeSheet(s);
  const editable = s.phase === 'selection';
  const confirmed = !editable || !!p.fieldConfirmed;
  const cfg = ncaaConfig(s);
  const B = selectionBoard(s);
  const field = [...p.field].sort((a, b) => a.seed - b.seed);
  const inField = new Set(field.map(f => f.team));
  const crank = Object.fromEntries(B.order.map((t, i) => [t, i + 1]));
  const autos = autoBids(s);
  const via = t => {
    const c = s.teams[t].conference;
    if (s.overrides?.autoBids?.[c]) return 'Commissioner';
    return s.post?.confT?.[c]?.champion === t ? 'Tournament' : 'Reg. season';
  };
  const qcell = (t, i) => { const x = Q[t].rec[i]; return `<td class="num q${i + 1}${x.w + x.l + (x.t || 0) ? '' : ' muted'}">${x.w}-${x.l}-${x.t || 0}</td>`; };
  const stats = t => `<td class="num">${recs[t].w}-${recs[t].l}-${recs[t].t || 0}</td><td class="num key">${r[t]?.rank ?? ''}</td>${[0, 1, 2, 3].map(i => qcell(t, i)).join('')}<td class="num">${r[t]?.sosRank ?? ''}</td><td class="num muted">${pr[t] ?? ''}</td>`;
  const head = first => `<thead><tr>${first}<th>Team</th><th class="num">Rec</th><th class="num key" title="${IX()} rank">${IX()}</th>${QHEAD}<th class="num" title="Strength-of-schedule rank">SOS</th><th class="num" title="Poll rank (not used by the committee)">Poll</th></tr></thead>`;
  const teamCell = t => `<td><span class="sel-team">${confLogo(s.teams[t].conference, 16)}${team(t, { rank: false, size: 16 })}</span></td>`;
  const lastIn = new Set(p.lastIn || []), firstOut = new Set(p.firstOut || []);
  const autoRows = B.autos.map(t => `<tr><td class="num muted">${crank[t]}</td>${teamCell(t)}${stats(t)}<td class="small muted">${via(t)}</td></tr>`).join('');
  const boardRows = B.board.map((t, i) => {
    const on = inField.has(t);
    const tag = B.fill.includes(t) ? '<span class="badge manual" title="Not enough teams at .500 or better to fill the field">Below .500 · fills short field</span>' : lastIn.has(t) ? '<span class="badge">Last 4 in</span>' : firstOut.has(t) ? '<span class="badge">First 4 out</span>' : '';
    return `<tr class="${on ? 'sel-in' : ''}${i === B.spots - 1 ? ' cutline' : ''}"><td class="num"><input type="checkbox" data-al="${esc(t)}" ${on ? 'checked' : ''} ${confirmed ? 'disabled' : ''} aria-label="${esc(t)} in the field"></td>${teamCell(t)}${stats(t)}<td class="small">${tag}</td></tr>`;
  }).join('');
  const board = `<div class="card sel-board">
    <div class="row" style="margin-bottom:6px"><h2 style="margin:0">Automatic qualifiers · ${B.autos.length}</h2><span class="spacer"></span>${editable ? '<button class="btn sm" id="f-redo">Re-run selection</button>' : ''}</div>
    <div class="table-wrap"><table class="sel-table">${head('<th class="num" title="Committee order">#</th>')}<tbody>${autoRows}</tbody></table></div>
    <div class="row" style="margin:16px 0 6px"><h2 style="margin:0">At-large · ${B.chosen.length} of ${B.spots}</h2><span class="spacer"></span>
      ${editable && !confirmed ? `<button class="btn primary sm" id="f-confirm" ${B.chosen.length === B.spots ? '' : 'disabled'}>Confirm the ${B.size} teams</button>` : ''}</div>
    <div class="small muted" style="margin-bottom:6px">The ${B.spots} at-large spots plus the next 10 teams, in committee order (${usesNpi(S()) ? COMMITTEE_TEXT_NPI : COMMITTEE_TEXT_RPI}). The line marks the committee's cut. Teams with a losing record can't take an at-large spot.${editable && !confirmed ? ' Check or uncheck teams to set the field.' : ''}</div>
    <div class="table-wrap"><table class="sel-table">${head('<th class="num">In</th>')}<tbody>${boardRows}</tbody></table></div>
    ${(() => { const cut = B.order.indexOf(B.board[B.board.length - 1]); const skipped = B.ineligible.filter(t => B.order.indexOf(t) < cut); return skipped.length ? `<p class="small muted" style="margin:8px 0 0"><b>Not eligible (losing record):</b> ${skipped.map(t => `${esc(t)} ${recs[t].w}-${recs[t].l}-${recs[t].t || 0}`).join(', ')}</p>` : ''; })()}
    <p class="small muted" style="margin:8px 0 0">${quadText(Object.keys(s.teams).length)}</p>
  </div>`;
  // Why each seed sits above the next one: the deciding tier and criteria.
  // If the commissioner has moved a team above one the committee prefers, say so.
  const edge = i => {
    if (i >= field.length - 1) return '';
    const a = field[i].team, b = field[i + 1].team, c = compareTeams(sheet, a, b);
    const list = c.won.map(k => COMMITTEE_SHORT[k]).join(', ');
    const full = c.won.map(k => COMMITTEE_TIERS.flatMap(x => x.items).find(([kk]) => kk === k)[1]).join(', ');
    if (c.better !== a) return `<span class="edge-flip" title="The committee would put ${esc(b)} ahead (${c.tier ? `Tier ${c.tier}: ${esc(full)}` : IX()})">▼ ${c.tier ? `T${c.tier}` : IX()} favors #${field[i + 1].seed}</span>`;
    return `<span title="${esc(a)} over ${esc(b)}: ${c.tier ? `Tier ${c.tier}, ${esc(full)}` : IX() === 'NPI' ? 'higher NPI' : 'every tier even, higher RPI'}">${c.tier ? `T${c.tier} · ${esc(list)}` : IX()}</span>`;
  };
  // Seed lines: the 1 seeds, the 2 seeds… (national seeds in groups of one
  // per region), each team's region and its seed there. A team the
  // conference rule moved off its line shows the seed it plays as.
  const podList = pods(field, cfg.regionals, s);
  const podOf = {};
  podList.forEach((teams, r) => teams.forEach((t, k) => { podOf[t] = { r, k, head: teams[0] }; }));
  const lines = !noRegionals(cfg) && cfg.regionals > 0;
  const COLS = (editable ? 12 : 11) - (lines ? 0 : 1);
  const lineHead = i => {
    if (!lines || i % cfg.regionals) return '';
    const L = i / cfg.regionals + 1, last = Math.min(field.length, i + cfg.regionals);
    return `<tr class="seed-line"><td colspan="${COLS}"><b>${L} seeds</b> <span class="muted">· national seeds ${i + 1}–${last}${L === 1 ? ' · head the regions' : ''}</span></td></tr>`;
  };
  const regCell = (t, i) => {
    const x = podOf[t];
    if (!x) return '<td class="seed-reg muted">–</td>';
    const moved = lines && x.k !== Math.floor(i / cfg.regionals);
    return `<td class="seed-reg">${x.k === 0 ? '<span class="muted">Top seed</span>' : `with ${team(x.head, { rank: false, size: 16 })}`}${moved ? ` <span class="badge" title="Moved to keep conference rivals apart in the first round">plays as a ${x.k + 1}</span>` : ''}</td>`;
  };
  const seedRows = field.map((f, i) => { const t = f.team, x = Q[t].rec; return `${lineHead(i)}<tr class="seed-row${i < cfg.regionals ? ' host' : ''}${i === cfg.regionals - 1 ? ' host-cut' : ''}" data-seed-i="${i}">
    ${editable ? `<td class="drag-cell"><span class="drag-handle" tabindex="0" role="button" data-drag="${i}" aria-label="Move ${esc(t)} (seed ${f.seed}). Drag, or use the up and down arrow keys" title="Drag to move">⠿</span></td>` : ''}
    <td class="num seed-n">${f.seed}</td><td class="seed-team">${team(t, { rank: false, size: 16 })}${i < cfg.regionals ? ' <span class="badge gold">Host</span>' : ''}${f.bid === 'auto' ? ' <span class="badge auto" title="Automatic qualifier">AQ</span>' : ''}</td>
    <td class="num">${recs[t].w}-${recs[t].l}-${recs[t].t || 0}</td><td class="num key">${r[t]?.rank ?? ''}</td>${[0, 1, 2, 3].map(k => `<td class="num q${k + 1}${x[k].w + x[k].l + (x[k].t || 0) ? '' : ' muted'}">${x[k].w}-${x[k].l}-${x[k].t || 0}</td>`).join('')}<td class="num">${r[t]?.sosRank ?? ''}</td>${lines ? regCell(t, i) : ''}<td class="edge">${edge(i)}</td></tr>`; }).join('');
  const seeding = `<div class="card sel-seeds"><h2 style="margin:0 0 4px">Seeds 1–${field.length}</h2>
    ${confirmed ? `<div class="small muted" style="margin-bottom:8px">${editable ? 'Drag a team by its handle (⠿) to move it; on a keyboard, focus the handle and use the arrow keys. ' : ''}${noRegionals(cfg) ? `${formatSummary(cfg).replace(/<[^>]+>/g, '').replace(/^Format: /, '')}</div>` : `The top ${cfg.regionals} national seeds host the regionals. Regionals are built serpentine (national seed 1 with seed ${cfg.regionals * 2}${cfg.perRegional > 2 ? `, ${cfg.regionals * 2 + 1}` : ''}…); then teams on the same seed line trade regionals so conference rivals don't meet in the first round, and each team gets a regional seed, 1 to ${cfg.perRegional}.</div>`}
      <div class="table-wrap"><table class="sel-table seed-table"><thead><tr>${editable ? '<th aria-label="Move"></th>' : ''}<th class="num">Seed</th><th>Team</th><th class="num">Rec</th><th class="num key" title="${IX()} rank">${IX()}</th>${QHEAD}<th class="num" title="Strength-of-schedule rank">SOS</th>${lines ? '<th title="The region this team goes to (its top seed)">Region</th>' : ''}<th title="Why this team is ahead of the next seed: the deciding tier and the criteria it won there">Over next</th></tr></thead><tbody class="seed-list">${seedRows}</tbody></table></div>
      ${editable ? '<div class="row" style="margin-top:12px;gap:8px"><button class="btn primary" id="f-lock">Announce the field</button><button class="btn" id="f-unconfirm">Change teams</button></div>' : ''}`
      : `<p class="muted small">Pick the at-large teams and confirm them, then set the seeds here.</p>`}
  </div>`;
  root.innerHTML = `
    ${editable ? `<div class="hint">1. Pick the at-large teams (automatic qualifiers are in). 2. Confirm the ${B.size} teams. 3. Order seeds 1–${B.size}; the region preview updates as you go. 4. Announce the field.<br>${formatSummary(cfg)}</div>` : ''}
    ${confirmed
      ? `<div class="sel-layout seeding">${seeding}${noRegionals(cfg) ? '' : regionalPreview(s, field, podList, r)}</div><details class="card sel-board-wrap" style="margin-top:16px"><summary><b>Selection board</b> <span class="muted small">(automatic qualifiers and the at-large board)</span></summary>${board}</details>`
      : `<div class="sel-layout picking">${board}${seeding}</div>`}
    <div style="margin-top:16px">${committeeBox()}</div>`;
  if (!editable) return;
  const setField = list => { p.field = list.map((f, i) => ({ ...f, seed: i + 1 })); changed({ progress: false }); };
  $$('[data-al]', root).forEach(cb => (cb.onchange = () => {
    try { setAtLarge(s, cb.dataset.al, cb.checked); } catch (e) { cb.checked = !cb.checked; return toast(e.message, true); }
    changed({ progress: false });
  }));
  const moveSeed = (from, to) => {
    if (to < 0 || to >= field.length || to === from) return;
    const [f] = field.splice(from, 1); field.splice(to, 0, f);
    ui.seedFocus = to; setField(field);
  };
  const tbody = $('.seed-list', root);
  if (tbody) dragSort(tbody, moveSeed);
  $$('[data-drag]', root).forEach(h => (h.onkeydown = e => {
    const i = +h.dataset.drag;
    if (e.key === 'ArrowUp') { e.preventDefault(); moveSeed(i, i - 1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSeed(i, i + 1); }
  }));
  if (ui.seedFocus != null) { $(`[data-drag="${ui.seedFocus}"]`, root)?.focus(); ui.seedFocus = null; }
  $('#f-redo', root).onclick = () => { if (confirm('Throw out your changes and re-run the committee selection?')) { proposeField(s); changed({ progress: false }); } };
  if ($('#f-confirm', root)) $('#f-confirm', root).onclick = () => { try { confirmField(s); } catch (e) { return toast(e.message, true); } changed({ progress: false }); toast('Teams confirmed. Now set the seeds.'); setTimeout(() => document.querySelector('.sel-seeds')?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 0); };
  if ($('#f-unconfirm', root)) $('#f-unconfirm', root).onclick = () => { unconfirmField(s); changed({ progress: false }); };
  if ($('#f-lock', root)) $('#f-lock', root).onclick = () => { lockField(s); ui.postTab = noRegionals(cfg) ? 'mcws' : 'regionals'; changed(); toast(noRegionals(cfg) ? 'Field announced. The bracket is set.' : 'Field announced. The regionals are set.'); };
}

// Side panel on the Selection tab: each regional as it stands, with every
// team's conference, so the commissioner can keep regionals even. Teams from
// the same conference in one regional are flagged, and each regional's
// average OVR is compared with the field's.
function regionalPreview(s, field, podList, r) {
  const seedOf = t => field.find(f => f.team === t)?.seed;
  const avg = list => list.reduce((a, t) => a + ovr(s.teams[t]), 0) / (list.length || 1);
  const all = avg(field.map(f => f.team));
  const strengths = podList.map(avg);
  const spread = Math.max(...strengths) - Math.min(...strengths);
  const boxes = podList.map((teams, i) => {
    const confs = {};
    for (const t of teams) (confs[s.teams[t].conference] ||= []).push(t);
    const dupes = Object.entries(confs).filter(([, l]) => l.length > 1);
    const d = strengths[i] - all;
    return `<div class="reg-prev${dupes.length ? ' clash' : ''}">
      <div class="reg-prev-head"><span class="reg-prev-title">${esc(teams[0])} Region</span><span class="reg-prev-ovr" title="Average OVR of the region's teams, compared with the whole field">OVR ${strengths[i].toFixed(1)} <span class="${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}</span></span></div>
      ${(() => {
        const row = k => { if (k == null) return '<div class="reg-prev-row bye"><span class="reg-prev-seed"></span><span class="reg-prev-team muted">Bye</span></div>'; const t = teams[k - 1], c = s.teams[t].conference, dup = confs[c].length > 1; return `<div class="reg-prev-row${dup ? ' dup' : ''}">
        <span class="reg-prev-seed">${k}</span><span class="reg-prev-team">${team(t, { rank: false, size: 16 })}</span>
        <span class="reg-prev-conf" title="${esc(c)}">${confLogo(c, 18)}${confInfo(c).logo ? `<span>${esc(confInfo(c).abbr || c)}</span>` : ''}</span>
        <span class="reg-prev-num" title="National seed · ${IX()} rank">#${seedOf(t)} · ${r[t]?.rank ?? '–'}</span></div>`; };
        // The first-round matchups (byes too); conference rivals meeting are flagged.
        return `<div class="reg-prev-sub">First round</div>${regionalFirstRound(teams.length).map(pair => `<div class="reg-prev-pair${pair[1] && confClashes([[teams[pair[0] - 1], teams[pair[1] - 1]]], s).length ? ' clash' : ''}">${pair.map(row).join('')}</div>`).join('')}`;
      })()}
      ${dupes.length ? `<div class="reg-prev-warn">⚠ Same conference: ${dupes.map(([c, l]) => `${esc(c)} (${l.length})`).join(', ')}</div>` : ''}
    </div>`;
  }).join('');
  const clashes = podList.filter(teams => new Set(teams.map(t => s.teams[t].conference)).size < teams.length).length;
  const firstRound = confClashes(podList, s).length;
  return `<aside class="card reg-preview"><h2 style="margin:0 0 4px">Region preview</h2>
    <div class="small muted" style="margin-bottom:10px">Region seed, then national seed · ${IX()} rank. ${firstRound ? `<b class="warn-text">${firstRound} first-round matchup${firstRound > 1 ? 's' : ''} between conference rivals (no swap could avoid ${firstRound > 1 ? 'them' : 'it'}).</b>` : 'No conference rivals meet in the first round.'} ${clashes ? `${clashes} region${clashes > 1 ? 's have' : ' has'} conference rivals in it.` : ''} Strongest to weakest regional: ${spread.toFixed(1)} OVR.</div>
    <div class="reg-prev-list">${boxes}</div></aside>`;
}

// The whole National Tournament on one board, like a TV bracket (the AAU
// look, Nov. 2026): regions in the corners, the right-hand ones drawn right to
// left, and the finals in a navy panel in the middle. Regions whose winners
// meet in a semifinal share a side (region i meets region n-1-i).
function renderBoard(root) {
  const s = S(), p = s.post || {}, regs = p.regionals || [], n = regs.length;
  const name = esc(s.settings.mcwsName), v = mcwsVenue(s);
  const order = n === 4 ? [[regs[0], regs[3]], [regs[1], regs[2]]] : [regs.slice(0, Math.ceil(n / 2)), regs.slice(Math.ceil(n / 2))];
  const size = { cw: 204, colw: 220, h: 90, slot: 98 };
  const region = (ev, mirror) => {
    const seed = t => { const i = ev.seeds.indexOf(t); return i >= 0 ? i + 1 : null; };
    const top = ev.top || ev.host, c = teamInfo(top)?.color || '#0b1f3a';
    return `<div class="bb-region ${mirror ? 'mirror' : ''}" style="--rc:${esc(c)}"><div class="bb-rhead"><b>${esc(ev.name)}</b>${ev.champion ? `<span class="muted small">Winner: ${esc(ev.champion)}</span>` : ''}</div>${eventBracket(ev, seed, { ...size, mirror })}</div>`;
  };
  const champ = p.mcws?.champion, ci = champ ? teamInfo(champ) : null;
  const finals = `<div class="bb-finals"><img class="bb-mark" src="img/aau-block.svg" alt=""><div class="bb-ftitle">${name}</div><div class="bb-fsite">${esc(v.stadium || '')}${v.city ? ` · ${esc(v.city)}` : ''}</div>
    ${p.mcws ? p.mcws.nodes.map((nd, i, all) => {
      const g = nd.gameId && s.games.find(x => x.id === nd.gameId), label = nd.code || nd.label, sd = t => shownSeed(s, t);
      const [a, b] = nodeTeams(p.mcws, nd), slot = (t, ref) => t || (refLabel(p.mcws, ref) ? { text: refLabel(p.mcws, ref) } : null);
      return `<div class="bb-fgame ${i === all.length - 1 ? 'last' : ''}">${g ? compactCard({ ...g, label }, sd, { top: a }) : placeholderCard(label, [slot(a, nd.a), slot(b, nd.b)], sd)}</div>`;
    }).join('') : `<p class="bb-wait">The region winners meet here.</p>`}
    ${champ ? `<div class="bb-champ"><span class="bb-clogo">${logoImg(ci, 64)}</span><span class="bb-ckick">${seasonLabel(s.year)} National Champion</span><span class="bb-cname">${esc(champ)}</span></div>` : ''}</div>`;
  root.innerHTML = `<div class="bb-scroll"><div class="bb">
    <div class="bb-side">${order[0].map(ev => region(ev, false)).join('')}</div>
    ${finals}
    <div class="bb-side">${order[1].map(ev => region(ev, true)).join('')}</div></div></div>
    <p class="small muted">Seeds inside a region are regional seeds; the ${name} shows national seeds. Click a game for its box score.</p>`;
  fitBoard(root);
}
// Size the board to the window (see below). It refits when the window
// changes size.
function fitBoard(root) {
  const bb = $('.bb', root), box = $('.bb-scroll', root);
  if (!bb || !box) return;
  bb.style.zoom = 1;
  // Too wide: shrink to fit (down to 60%). Room to spare: grow a little (up
  // to 115%) while the whole board still fits on screen, so a small field
  // like 12 teams doesn't blow up.
  const byW = (box.clientWidth - 2) / bb.scrollWidth, byH = (window.innerHeight - 260) / bb.scrollHeight;
  const z = byW < 1 ? Math.max(0.6, byW) : Math.max(1, Math.min(1.15, byW, byH));
  bb.style.zoom = z.toFixed(3);
}
let boardResize = null;
window.addEventListener('resize', () => { clearTimeout(boardResize); boardResize = setTimeout(() => { const r = document.querySelector('.bb')?.closest('#ps'); if (r) fitBoard(r); }, 120); });

function renderRegionals(root) {
  const s = S(), p = s.post || {};
  if (!p.regionals) { root.innerHTML = '<div class="empty">The regions begin once the National Tournament field is announced.</div>'; return; }
  const open = s.games.some(g => g.type === 'regional' && !isFinal(g));
  root.innerHTML = `${open ? '<div class="row" style="margin-bottom:12px"><span class="spacer"></span><button class="btn primary" id="rg-sim">🎲 Sim regions</button></div>' : ''}
    ${p.regionals.map(ev => {
      const seed = t => { const i = ev.seeds.indexOf(t); return i >= 0 ? i + 1 : null; };
      const top = ev.top || ev.host, nat = shownSeed(s, top);
      const camp = ev.campusRounds ? (ev.campusRounds === 1 ? 'the first round' : `the first ${ev.campusRounds} rounds`) : '';
      const where = ev.homeSites ? (camp && ev.venue ? `${camp} at the higher seed's rink, then ${esc(ev.venue.stadium)}, ${esc(ev.venue.city)}` : `every game at the higher seed's rink`) : `hosted by ${esc(ev.host)}${atField(s, ev.host)}`;
      return `<div class="card" id="${evAnchor(ev.id)}"><div class="row" style="margin-bottom:6px"><h2 style="margin:0">${esc(ev.name)}</h2>${ev.champion ? `<span class="badge gold">To the ${esc(s.settings.mcwsName)}: ${esc(ev.champion)}</span>` : ''}</div>
      <div class="small muted" style="margin-bottom:8px">${ev.seeds.map((t, i) => `${i + 1}. ${esc(t)}`).join(' · ')} · single elimination, led by ${esc(top)}${nat ? ` (No. ${nat} national seed)` : ''}, ${where}</div>
      ${eventBracket(ev, seed)}</div>`; }).join('')}`;
  if ($('#rg-sim', root)) $('#rg-sim', root).onclick = () => simAndReport(g => g.type === 'regional', 'in the regions');
}

function renderSupers(root) {
  const s = S(), p = s.post || {};
  if (!p.supers) { root.innerHTML = '<div class="empty">The super regionals start once every regional is finished. Each is one game between two regional winners, hosted by the higher national seed; the winners go to the Frozen Four.</div>'; return; }
  const open = s.games.some(g => g.type === 'super' && !isFinal(g));
  const seed = t => shownSeed(s, t);
  const named = t => `${esc(t)}${seed(t) ? ` (${seed(t)})` : ''}`;
  root.innerHTML = `${open ? '<div class="row" style="margin-bottom:12px"><span class="spacer"></span><button class="btn primary" id="sr-sim">🎲 Sim super regionals</button></div>' : ''}
    <div class="stack-cards">${p.supers.map(ev => `<div class="card" id="${evAnchor(ev.id)}"><div class="row" style="margin-bottom:6px"><h2 style="margin:0">${esc(ev.name)}</h2>${ev.champion ? `<span class="badge gold">To the ${esc(s.settings.mcwsName)}: ${esc(ev.champion)}</span>` : ''}</div>
      <div class="small muted" style="margin-bottom:8px">${ev.seeds.map(named).join(' vs ')} · one game, hosted by ${esc(ev.host)}${atField(s, ev.host)}</div>
      ${eventBracket(ev, seed)}</div>`).join('')}</div>`;
  if ($('#sr-sim', root)) $('#sr-sim', root).onclick = () => simAndReport(g => g.type === 'super', 'in the super regionals');
}

// The Frozen Four field, like the "Participants" table on a tournament's
// encyclopedia page: each qualifier's record entering the Frozen Four, coach,
// the regional or super regional it won, and its Frozen Four history.
const ordinal = n => `${n}${(n % 100 >= 11 && n % 100 <= 13) ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;
function renderParticipants(root) {
  const s = S(), p = s.post || {}, cfg = ncaaConfig(s);
  const supers = hasSupers(cfg);
  // With no regionals the whole field is at the finals: list it by seed.
  const stage = noRegionals(cfg)
    ? (p.mcws ? [...p.field].sort((a, b) => a.seed - b.seed).map((f, i) => ({ champion: f.team, path: i, name: f.bid === 'auto' ? `${s.teams[f.team].conference} (automatic)` : 'At-large' })) : [])
    : (supers ? p.supers : p.regionals) || [];
  const stageName = supers ? 'Super regional' : 'Region';
  if (!stage.length) {
    root.innerHTML = `<div class="empty">The ${esc(s.settings.mcwsName)} field fills in as the ${supers ? 'super regionals' : 'regionals'} finish. Each ${supers ? 'super regional' : 'regional'} winner advances.</div>`;
    return;
  }
  const entering = records(s, g => g.type !== 'mcws');
  const order = [...stage].map((ev, i) => [ev.path ?? i, ev]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const coachCell = t => {
    const id = s.teams[t]?.coachId, c = id && ctx.league.coaches?.[id];
    return c ? `<a class="team-link" href="#/coach/${encodeURIComponent(id)}">${esc(c.name)}</a>` : '<span class="muted">—</span>';
  };
  const rows = order.map(ev => {
    const t = ev.champion;
    const where = esc(ev.name || `${ev.host} ${stageName}`);
    if (!t) return `<tr class="muted"><td colspan="4"><i>Winner of the ${where}</i></td><td>${where}</td><td colspan="3"></td></tr>`;
    const r = entering[t], c = s.teams[t].conference, h = mcwsHistory(ctx.league, t, s.year);
    const history = h.apps
      ? `<td class="c">${h.apps}<div class="small muted">(last: ${h.last})</div></td>
         <td class="c">${h.best ? `${h.best.tied ? 'T-' : ''}${ordinal(h.best.place)}<div class="small muted">(${h.bestYears.join(', ')})</div>` : '—'}</td>
         <td class="c">${h.w}–${h.l}–${h.t || 0}</td>`
      : '<td colspan="3" class="c"><i>First appearance</i></td>';
    return `<tr><td>${team(t, { rank: false, seed: shownSeed(s, t) })}</td>
      <td><span class="row" style="gap:6px;flex-wrap:nowrap">${confLogo(c, 18)}<span>${esc(c)}</span></span></td>
      <td class="c">${r.w}–${r.l}–${r.t || 0}<div class="small muted">(${r.cw}–${r.cl}–${r.ct || 0})</div></td>
      <td>${coachCell(t)}</td><td>${where}</td>${history}</tr>`;
  }).join('');
  const done = order.filter(ev => ev.champion).length;
  root.innerHTML = `<div class="card"><div class="row" style="margin-bottom:10px"><h2 style="margin:0">${esc(s.settings.mcwsName)} participants</h2><span class="spacer"></span><span class="muted small">${done} of ${order.length} spots filled</span></div>
    <div class="table-wrap"><table class="participants"><thead><tr><th>School</th><th>Conference</th><th class="c">Record<div class="small">(Conf)</div></th><th>Head coach</th><th>${stageName}</th><th class="c">Previous trips<div class="small">to the finals</div></th><th class="c">Best<div class="small">finish</div></th><th class="c">W–L at the<div class="small">finals</div></th></tr></thead>
    <tbody>${rows}</tbody></table></div>
    <p class="small muted" style="margin-top:10px">Records are before the ${esc(s.settings.mcwsName)}, with the conference record in parentheses. History counts seasons in this dynasty before ${seasonLabel(s.year)}.</p></div>`;
}

function renderMcws(root) {
  const s = S(), p = s.post || {}, cfg = ncaaConfig(s);
  const name = esc(s.settings.mcwsName);
  const v = mcwsVenue(s);
  const venueBar = `<div class="venue-bar"><span class="venue-kicker">Home of the ${name}</span><span class="venue-name">${esc(v.stadium)}</span>${v.city ? `<span class="venue-city">${esc(v.city)}</span>` : ''}</div>`;
  if (!p.mcws) {
    root.innerHTML = `${venueBar}<div class="empty">${cfg.wsSize === 8
      ? `Eight teams reach the ${name}: quarterfinals, semifinals and the national final, one game each.`
      : `Four teams reach the ${name}: two national semifinals on Thursday and the national final on Sunday.`}</div>`;
    return;
  }
  const open = s.games.some(g => g.type === 'mcws' && !isFinal(g));
  const seed = t => shownSeed(s, t);
  const named = t => `${esc(t)}${seed(t) ? ` (${seed(t)})` : ''}`;
  root.innerHTML = `<div class="row venue-row">${venueBar}<span class="spacer"></span>${open ? `<button class="btn primary" id="mc-sim">🎲 Sim the ${name}</button>` : ''}</div>
    <div class="card"><div class="row" style="margin-bottom:6px"><h2 style="margin:0">${name}</h2>${p.mcws.champion ? `<span class="badge gold">Champion: ${esc(p.mcws.champion)}</span>` : ''}</div>
    <div class="small muted" style="margin-bottom:8px">${p.mcws.seeds.map(named).join(' · ')}</div>${eventBracket(p.mcws, seed)}</div>`;
  if ($('#mc-sim', root)) $('#mc-sim', root).onclick = () => simAndReport(g => g.type === 'mcws', `at the ${s.settings.mcwsName}`);
}
