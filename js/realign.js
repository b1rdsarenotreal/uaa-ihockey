// A realignment from the AAU Dynasty hub (its Realignment page, the owner's
// ask, Nov. 2026). The hub leaves the plan in this browser's localStorage
// (`aau-realignment`, shared by every app on the site): every AAU school's
// conference, the conferences' looks, who joins and who leaves. Here it
// becomes this sport's changes, offered on the Offseason page: schools that
// play this sport join (`AAU_PROGRAMS` lists them), members move, leavers
// leave; schools that don't play it are left out. The commissioner picks
// what to apply; the plan is then marked applied or skipped in this save
// (`league.realign[planId]`), which the hub reads back.

import { AAU_SCHOOLS, AAU_CONFERENCES, AAU_PROGRAMS } from './aau-schools.js?v=20261117005235';
import { DEFAULT_LOGOS } from './logo-import.js?v=20261117005235';
import { addConference, addTeam, draftRemoveTeam, deleteConference } from './league.js?v=20261117005235';

export const REALIGN_KEY = 'aau-realignment';
// New schools start at this rating in each category; change it on the
// Offseason page.
export const JOIN_RATING = 60;

export function readRealignment() {
  try { const p = JSON.parse(localStorage.getItem(REALIGN_KEY) || 'null'); return p && p.id && p.schools ? p : null; } catch { return null; }
}

// This sport's share of the waiting plan, or null (none, or already
// applied or skipped here).
export function realignmentFor(league) {
  const plan = readRealignment();
  if (!plan || league.realign?.[plan.id]) return null;
  const side = league.side || Object.keys(AAU_PROGRAMS)[0];
  const programs = AAU_PROGRAMS[side] || {};
  const teams = league.draft?.teams || league.seasons?.[league.currentYear]?.teams || {};
  const removed = league.draft?.removed || {};
  // Only teams in the AAU's all-sports conferences are realigned; a sport's
  // own conferences (men's hockey's, men's volleyball's) stay as they are.
  const shared = new Set([...Object.keys(AAU_CONFERENCES), ...Object.keys(plan.conferences || {})]);
  const moves = [], joins = [], leaves = [], notHere = [];
  for (const [s, t] of Object.entries(teams)) {
    if (!shared.has(t.conference)) continue;
    const to = plan.schools[s];
    if (to && to !== t.conference) moves.push({ school: s, from: t.conference, to });
    else if (!to && (plan.left || []).includes(s)) leaves.push({ school: s, from: t.conference });
  }
  for (const [s, to] of Object.entries(plan.schools)) {
    if (teams[s] || removed[s]) continue;
    if (programs[s]) joins.push({ school: s, to, stadium: programs[s].stadium || '', coach: programs[s].coach || '' });
    else if ((plan.joins || []).includes(s)) notHere.push(s);
  }
  const live = c => league.conferences[c] && !league.conferences[c].retired;
  const newConfs = [...new Set([...moves, ...joins].map(x => x.to))].filter(c => !live(c));
  if (!moves.length && !joins.length && !leaves.length) return { plan, empty: true, moves, joins, leaves, notHere, newConfs };
  return { plan, empty: false, moves, joins, leaves, notHere, newConfs };
}

// Apply the picked changes to next season's teams (the offseason draft).
// `pick` holds the schools to change; `retireEmpty` retires conferences left
// with no teams.
export function applyRealignment(league, r, pick, { retireEmpty = true } = {}) {
  const d = league.draft;
  if (!d) throw new Error('Realignment is applied in the offseason.');
  const T = d.teams, plan = r.plan;
  const want = x => pick.has(x.school);
  const needed = new Set([...r.moves.filter(want), ...r.joins.filter(want)].map(x => x.to));
  for (const c of needed) {
    if (league.conferences[c] && !league.conferences[c].retired) continue;
    const info = { ...(AAU_CONFERENCES[c] || {}), ...(plan.conferences?.[c] || {}) };
    addConference(league, c, { abbr: info.abbr, color: info.color || '#555555' });
    const conf = league.conferences[c];
    if (info.logo && !conf.logo) conf.logo = info.logo;
    if (info.altColor && !conf.altColor) conf.altColor = info.altColor;
  }
  for (const m of r.moves.filter(want)) if (T[m.school]) T[m.school].conference = m.to;
  for (const j of r.joins.filter(want)) {
    const x = AAU_SCHOOLS[j.school] || plan.info?.[j.school] || {};
    const t = addTeam(league, T, { school: j.school, mascot: x.mascot || '', abbr: x.abbr, city: x.city || '', color: x.color, altColor: x.altColor, conference: j.to, stadium: j.stadium, coachName: j.coach || '', off: JOIN_RATING, pit: JOIN_RATING, def: JOIN_RATING });
    t.logoOverride ||= DEFAULT_LOGOS[j.school] || x.logo || null;
  }
  for (const l of r.leaves.filter(want)) if (T[l.school]) draftRemoveTeam(league, l.school);
  if (retireEmpty) {
    const from = new Set([...r.moves.filter(want), ...r.leaves.filter(want)].map(x => x.from));
    for (const c of from) if (!Object.values(T).some(t => t.conference === c)) { try { deleteConference(league, { teams: T }, c); } catch { /* keep it */ } }
  }
  league.realign = { ...(league.realign || {}), [plan.id]: 'applied' };
}

export function skipRealignment(league, r) {
  league.realign = { ...(league.realign || {}), [r.plan.id]: 'skipped' };
}
