// Starting league: the AAU members with varsity ice hockey, in the 2030
// season after the AAU took over college athletics. Women's and men's are
// separate dynasties (the switch in the top bar).
//
// Women's: the 13 programs in the owner's AAU Dynasty file, in the
// commissioner's conferences (Ivy League 6, Big Ten 4, Metro 3).
// Men's: the 17 programs in the owner's file, in two men's hockey
// conferences made for these dynasties (rename or realign them in the
// offseason): the Western Hockey Conference (the Big Ten schools, Notre Dame
// and Arizona State) and the Eastern Hockey Conference (the six Ivies,
// Boston University, McGill and Toronto). Colors and mascots are each
// school's real ones.
//
// Ratings: OFF (offense), MID (two-way play and special teams) and DEF
// (defense and goaltending), 40–99, stored as off / pit / def. OVR comes from
// the 2025-26 season:
// - Men's: Denver beat Wisconsin 2–1 for the 2026 NCAA title in Las Vegas;
//   Michigan (No. 1 seed, Big Ten tournament champion) reached the Frozen
//   Four; Michigan State (No. 1 seed, Big Ten regular-season champion),
//   Dartmouth (2 seed), Penn State and Cornell (3 seeds) were in the field
//   (collegehockeyinc.com; flohockey). The rest are estimates; McGill and
//   Toronto (U Sports) sit below.
// - Women's: Wisconsin won its second straight national title; Ohio State
//   was the No. 1 overall seed, Penn State reached the Frozen Four and
//   Minnesota was seeded 4th; Yale and Princeton were also in the field
//   (ncaa.com, collegehockeyinc.com). The rest are estimates.
//
// Head coaches are the real ones for 2026-27 (Wikipedia's list of current
// Division I men's ice hockey coaches, school athletics sites): new are Brett
// Larson at Minnesota, Dave Hakstol at Arizona State, Tom Upton at Brown, Rob
// Rassey at Harvard and Jeff Hamilton at Yale. Brown's women's job, which
// couldn't be confirmed, starts open. Rinks are each school's home rink
// (several men's teams play in a bigger arena).

import { DEFAULT_LOGOS } from './logo-import.js?v=20261107205925';

export const START_YEAR = 2030;

// The commissioner's conferences (from the AAU Dynasty), each with a logo
// drawn for these dynasties (img/conf/), and the men's hockey conferences.
// Conference logos the owner picked from the web (linked, not copied; the
// drawn ones in img/conf/ stay for CAC, SWC, UCAA and as fallbacks).
export const CONF_LOGO_LINKS = {
  bigten: 'https://content.sportslogos.net/logos/153/4661/full/big_ten_conference_logo_primary_20115933.png',
  ivy: 'https://content.sportslogos.net/logos/153/4824/full/ivy_league_logo_primary_2019_sportslogosnet-9024.png',
  metro: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/METRO_Primary_LtBG.png/500px-METRO_Primary_LtBG.png',
  pac10: 'https://content.sportslogos.net/logos/153/4945/full/pacific-10_conference_logo_wordmark_1995_sportslogosnet-1134.png',
  uaa: 'https://dbukjj6eu5tsf.cloudfront.net/uaasports.info/images/responsive_2023/logo-main.svg',
};
const L = f => CONF_LOGO_LINKS[f] || `img/conf/${f}.svg`;
export const CONFERENCES = {
  'Big Ten': { abbr: 'B1G', color: '#0088CE', altColor: '#0B2A4A', logo: L('bigten') },
  'Ivy League': { abbr: 'IVY', color: '#026937', altColor: '#C9B37E', logo: L('ivy') },
  'Metro Conference': { abbr: 'METRO', color: '#E03A3E', altColor: '#23262D', logo: L('metro') },
  'Western Hockey Conference': { abbr: 'WHC', color: '#14365D', altColor: '#C8A951' },
  'Eastern Hockey Conference': { abbr: 'EHC', color: '#6B1E2E', altColor: '#B9C3CC' },
};

// [school, conference, abbr, mascot, color, altColor, OVR]
const WOMEN = [
  ["Wisconsin", 'Big Ten', 'WIS', "Badgers", '#C5050C', '#FFFFFF', 94],
  ["Ohio State", 'Big Ten', 'OSU', "Buckeyes", '#BB0000', '#666666', 91],
  ["Penn State", 'Big Ten', 'PSU', "Nittany Lions", '#041E42', '#FFFFFF', 87],
  ["Minnesota", 'Big Ten', 'MINN', "Golden Gophers", '#7A0019', '#FFCC33', 85],
  ["Yale", 'Ivy League', 'YALE', "Bulldogs", '#00356B', '#FFFFFF', 77],
  ["Princeton", 'Ivy League', 'PRIN', "Tigers", '#E77500', '#000000', 76],
  ["Cornell", 'Ivy League', 'COR', "Big Red", '#B31B1B', '#FFFFFF', 74],
  ["Harvard", 'Ivy League', 'HARV', "Crimson", '#A51C30', '#1E1E1E', 66],
  ["Brown", 'Ivy League', 'BRWN', "Bears", '#4E3629', '#C00404', 60],
  ["Dartmouth", 'Ivy League', 'DART', "Big Green", '#00693E', '#FFFFFF', 60],
  ["Boston University", 'Metro Conference', 'BU', "Terriers", '#CC0000', '#FFFFFF', 70],
  ["McGill", 'Metro Conference', 'MCG', "Martlets", '#ED1B2F', '#FFFFFF', 52],
  ["Toronto", 'Metro Conference', 'TOR', "Varsity Blues", '#1E3765', '#FFFFFF', 48],
];
const MEN = [
  ["Dartmouth", 'Eastern Hockey Conference', 'DART', "Big Green", '#00693E', '#FFFFFF', 82],
  ["Cornell", 'Eastern Hockey Conference', 'COR', "Big Red", '#B31B1B', '#FFFFFF', 80],
  ["Boston University", 'Eastern Hockey Conference', 'BU', "Terriers", '#CC0000', '#FFFFFF', 74],
  ["Harvard", 'Eastern Hockey Conference', 'HARV', "Crimson", '#A51C30', '#1E1E1E', 68],
  ["Princeton", 'Eastern Hockey Conference', 'PRIN', "Tigers", '#E77500', '#000000', 66],
  ["Brown", 'Eastern Hockey Conference', 'BRWN', "Bears", '#4E3629', '#C00404', 62],
  ["Yale", 'Eastern Hockey Conference', 'YALE', "Bulldogs", '#00356B', '#FFFFFF', 62],
  ["McGill", 'Eastern Hockey Conference', 'MCG', "Redbirds", '#ED1B2F', '#FFFFFF', 48],
  ["Toronto", 'Eastern Hockey Conference', 'TOR', "Varsity Blues", '#1E3765', '#FFFFFF', 46],
  ["Wisconsin", 'Western Hockey Conference', 'WIS', "Badgers", '#C5050C', '#FFFFFF', 92],
  ["Michigan", 'Western Hockey Conference', 'MICH', "Wolverines", '#00274C', '#FFCB05', 90],
  ["Michigan State", 'Western Hockey Conference', 'MSU', "Spartans", '#18453B', '#FFFFFF', 87],
  ["Penn State", 'Western Hockey Conference', 'PSU', "Nittany Lions", '#041E42', '#FFFFFF', 82],
  ["Minnesota", 'Western Hockey Conference', 'MINN', "Golden Gophers", '#7A0019', '#FFCC33', 76],
  ["Arizona State", 'Western Hockey Conference', 'ASU', "Sun Devils", '#8C1D40', '#FFC627', 72],
  ["Notre Dame", 'Western Hockey Conference', 'ND', "Fighting Irish", '#0C2340', '#C99700', 72],
  ["Ohio State", 'Western Hockey Conference', 'OSU', "Buckeyes", '#BB0000', '#666666', 72],
];

// Home rinks: [rink, city]. Every one can be edited on the team page.
export const SITES = {
  "Arizona State": ["Mullett Arena", "Tempe, Ariz."],
  "Boston University": ["Walter Brown Arena", "Boston, Mass."],
  "Brown": ["Meehan Auditorium", "Providence, R.I."],
  "Cornell": ["Lynah Rink", "Ithaca, N.Y."],
  "Dartmouth": ["Thompson Arena", "Hanover, N.H."],
  "Harvard": ["Bright-Landry Hockey Center", "Boston, Mass."],
  "McGill": ["McConnell Arena", "Montreal, Que."],
  "Michigan": ["Yost Ice Arena", "Ann Arbor, Mich."],
  "Michigan State": ["Munn Ice Arena", "East Lansing, Mich."],
  "Minnesota": ["Ridder Arena", "Minneapolis, Minn."],
  "Notre Dame": ["Compton Family Ice Arena", "Notre Dame, Ind."],
  "Ohio State": ["OSU Ice Rink", "Columbus, Ohio"],
  "Penn State": ["Pegula Ice Arena", "University Park, Pa."],
  "Princeton": ["Hobey Baker Memorial Rink", "Princeton, N.J."],
  "Toronto": ["Varsity Arena", "Toronto, Ont."],
  "Wisconsin": ["LaBahn Arena", "Madison, Wis."],
  "Yale": ["Ingalls Rink", "New Haven, Conn."],
};
// Men's teams that play in a bigger arena.
export const MEN_SITES = {
  "Boston University": ["Agganis Arena", "Boston, Mass."],
  "Minnesota": ["3M Arena at Mariucci", "Minneapolis, Minn."],
  "Ohio State": ["Value City Arena", "Columbus, Ohio"],
  "Wisconsin": ["Kohl Center", "Madison, Wis."],
};

// Names the logo lists may know a school by.
export const LOGO_ALIASES = { 'Penn': 'Pennsylvania', 'Miami': 'Miami', 'UC Santa Barbara': 'UC Santa Barbara', 'George Washington': 'George Washington' };

// Head coaches for the 2026 season (see above). By 2030 some will have moved
// on; rename anyone on the Coaches page.
export const COACHES = {
  "Boston University": "Tara Watchorn",
  "Cornell": "Doug Derraugh",
  "Dartmouth": "Liz Keady Norton",
  "Harvard": "Laura Bellamy",
  "McGill": "Alyssa Cecere",
  "Minnesota": "Brad Frost",
  "Ohio State": "Nadine Muzerall",
  "Penn State": "Jeff Kampersal",
  "Princeton": "Cara Morey",
  "Toronto": "Vicky Sunohara",
  "Wisconsin": "Mark Johnson",
  "Yale": "Mark Bolding",
};
export const MEN_COACHES = {
  "Arizona State": "Dave Hakstol",
  "Boston University": "Jay Pandolfo",
  "Brown": "Tom Upton",
  "Cornell": "Casey Jones",
  "Dartmouth": "Reid Cashman",
  "Harvard": "Rob Rassey",
  "McGill": "David Urquhart",
  "Michigan": "Brandon Naurato",
  "Michigan State": "Adam Nightingale",
  "Minnesota": "Brett Larson",
  "Notre Dame": "Brock Sheahan",
  "Ohio State": "Steve Rohlik",
  "Penn State": "Guy Gadowsky",
  "Princeton": "Ben Syer",
  "Toronto": "Ryan Medel",
  "Wisconsin": "Mike Hastings",
  "Yale": "Jeff Hamilton",
};

function hashName(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; }

export function makeTeam({ school, conference, abbr, mascot = '', coach = '', coachId = null, color = '#555555', altColor = '#dddddd', off = 65, pit = 65, def = 65, stadium, city, men = false }) {
  const known = (men && MEN_SITES[school]) || SITES[school] || [];
  return {
    school, conference, abbr: abbr || school.replace(/[^A-Za-z ]/g, '').split(/\s+/).map(w => w[0]).join('').slice(0, 4).toUpperCase(),
    mascot, coach, coachId, color, altColor, off, pit, def, base: { off, pit, def }, logoOverride: null,
    stadium: stadium || known[0] || '', city: city || known[1] || '',
  };
}

// Gives a team its home rink from SITES if it has none yet (older saves).
export function fillSite(t) {
  if (t.stadium !== undefined && t.city !== undefined) return;
  const known = SITES[t.school] || [];
  t.stadium ??= known[0] || '';
  t.city ??= known[1] || '';
}

// OVR → OFF / MID / DEF: each team leans a little one way (a high-scoring
// offense, a strong two-way team, a stingy defense and goalie), keeping the
// same OVR.
export function splitOvr(school, ovr) {
  const h = hashName(school);
  const a = (h % 7) - 3, b = ((h >>> 4) % 5) - 2;
  const off = ovr + a, pit = ovr + b, def = Math.round(ovr - (0.4 * a + 0.3 * b) / 0.3);
  const c = x => Math.max(40, Math.min(99, x));
  return { off: c(off), pit: c(pit), def: c(def) };
}

// Women's and men's are separate leagues (the switch at the top of the
// page). `side` is 'women' (the default) or 'men'.
export const SIDES = {
  women: { label: "Women's", name: "AAU Women's Hockey" },
  men: { label: "Men's", name: "AAU Men's Hockey" },
};
export const sideOf = league => (league?.side === 'men' ? 'men' : 'women');

export function seedTeams(side = 'women') {
  const teams = {};
  const men = side === 'men';
  for (const [school, conference, abbr, mascot, color, altColor, ovr] of men ? MEN : WOMEN) {
    teams[school] = makeTeam({ school, conference, abbr, mascot, coach: (men ? MEN_COACHES : COACHES)[school] || '', color, altColor, men, ...splitOvr(school, ovr) });
    // The AAU Dynasty's logos win over the automatic logo lists.
    teams[school].logoOverride = DEFAULT_LOGOS[school] || null;
  }
  return teams;
}
// Conferences each side starts with: only those with teams in that sport.
export function conferencesFor(side) {
  const used = new Set((side === 'men' ? MEN : WOMEN).map(r => r[1]));
  return Object.fromEntries(Object.entries(CONFERENCES).filter(([c]) => used.has(c)));
}
