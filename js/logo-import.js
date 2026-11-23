// Logos from the owner's AAU Dynasty. Its backups carry a logo per school
// (`schools[].logo`, a link or an uploaded image as a data: URL) and may
// carry one per conference (`conferences[].logo`). Those win over the
// automatic logo lists here.
//
// DEFAULT_LOGOS are the school logos from the AAU Dynasty backup of Nov.
// 2026; new dynasties start with them, and older saves pick them up for any
// team without its own logo. Settings → Backups → "Logos from an AAU
// Dynasty backup" brings in a newer file's logos.

export const AAU_LOGO_SET = 'aau-dynasty-2026-11';
export const DEFAULT_LOGOS = {
  // The owner's next schools (Nov. 2026): ESPN's logos, and UT Dallas's
  // Comets mark from its brand site (brand.utdallas.edu).
  Arkansas: 'https://a.espncdn.com/i/teamlogos/ncaa/500/8.png',
  Baylor: 'https://a.espncdn.com/i/teamlogos/ncaa/500/239.png',
  Houston: 'https://a.espncdn.com/i/teamlogos/ncaa/500/248.png',
  SMU: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2567.png',
  'Texas Tech': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2641.png',
  'UT Dallas': 'https://brand.utdallas.edu/files/2023/11/Comets-clock-full-color-1.png',
  'Saint Louis': 'https://a.espncdn.com/i/teamlogos/ncaa/500/139.png',
  Memphis: 'https://a.espncdn.com/i/teamlogos/ncaa/500/235.png',
  'Northern Arizona': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2464.png',
  'San Diego State': 'https://a.espncdn.com/i/teamlogos/ncaa/500/21.png',
  Nevada: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2440.png',
  UNLV: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2439.png',
  'Oregon State': 'https://a.espncdn.com/i/teamlogos/ncaa/500/204.png',
  BYU: 'https://a.espncdn.com/i/teamlogos/ncaa/500/252.png',
  'Utah State': 'https://a.espncdn.com/i/teamlogos/ncaa/500/328.png',
  'Washington State': 'https://a.espncdn.com/i/teamlogos/ncaa/500/265.png',
  // The owner's fourth crop (Nov. 2026): ESPN's logos.
  'Boston College': 'https://a.espncdn.com/i/teamlogos/ncaa/500/103.png',
  "Colorado State": 'https://a.espncdn.com/i/teamlogos/ncaa/500/36.png',
  Denver: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2172.png',
  "Colorado School of Mines": 'https://a.espncdn.com/i/teamlogos/ncaa/500/2146.png',
  Montana: 'https://a.espncdn.com/i/teamlogos/ncaa/500/149.png',
  "Montana State": 'https://a.espncdn.com/i/teamlogos/ncaa/500/147.png',
  "North Dakota": 'https://a.espncdn.com/i/teamlogos/ncaa/500/155.png',
  "North Dakota State": 'https://a.espncdn.com/i/teamlogos/ncaa/500/2449.png',
  "New Mexico": 'https://a.espncdn.com/i/teamlogos/ncaa/500/167.png',
  "New Mexico State": 'https://a.espncdn.com/i/teamlogos/ncaa/500/166.png',
  UTEP: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2638.png',
  UTSA: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2636.png',
  "Loyola Chicago": 'https://a.espncdn.com/i/teamlogos/ncaa/500/2350.png',
  UIC: 'https://a.espncdn.com/i/teamlogos/ncaa/500/82.png',
  "IU Indianapolis": 'https://a.espncdn.com/i/teamlogos/ncaa/500/85.png',
  UMKC: 'https://a.espncdn.com/i/teamlogos/ncaa/500/140.png',
  "Missouri S&T": 'https://a.espncdn.com/i/teamlogos/ncaa/500/2402.png',
  Cincinnati: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2132.png',
  Dayton: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2168.png',
  "West Virginia": 'https://a.espncdn.com/i/teamlogos/ncaa/500/277.png',
  Ohio: 'https://a.espncdn.com/i/teamlogos/ncaa/500/195.png',
  "Southern Illinois": 'https://a.espncdn.com/i/teamlogos/ncaa/500/79.png',
  Northeastern: 'https://a.espncdn.com/i/teamlogos/ncaa/500/111.png',
  "UMass Amherst": 'https://a.espncdn.com/i/teamlogos/ncaa/500/113.png',
  Lehigh: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2329.png',
  Temple: 'https://a.espncdn.com/i/teamlogos/ncaa/500/218.png',
  "Rhode Island": 'https://a.espncdn.com/i/teamlogos/ncaa/500/227.png',
  "East Carolina": 'https://a.espncdn.com/i/teamlogos/ncaa/500/151.png',
  Charlotte: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2429.png',
  "George Mason": 'https://a.espncdn.com/i/teamlogos/ncaa/500/2244.png',
  VCU: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2670.png',
  'Boston University': 'https://content.sportslogos.net/logos/30/619/full/boston_university_terriers_logo_secondary_2015_sportslogosnet-1868.png',
  Brandeis: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/Brandeis_athletics_logo_2024.png/330px-Brandeis_athletics_logo_2024.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail',
  Caltech: 'https://upload.wikimedia.org/wikipedia/en/f/fb/Caltech_beavers_logo.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail_unscaled',
  'UC Irvine': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b6/UC_Irvine_Anteaters_logo.svg/250px-UC_Irvine_Anteaters_logo.svg.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail',
  'UC Riverside': 'https://content.sportslogos.net/logos/30/881/full/8157_california_riverside_highlanders-alternate-2020.png',
  'UC San Diego': 'https://content.sportslogos.net/logos/35/6819/full/uc_san_diego_tritons_logo_secondary_2018_sportslogosnet-6761.png',
  'UC Santa Barbara': 'https://content.sportslogos.net/logos/35/883/full/ucsb_gauchos_logo_primary_20097166.png',
  'UC Santa Cruz': 'https://upload.wikimedia.org/wikipedia/en/d/dd/Banana_slugs_logo.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail_unscaled',
  Emory: 'https://thumb.wikimedia.org/wikipedia/en/thumb/3/32/Emory_Eagles_logo.svg/500px-Emory_Eagles_logo.svg.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail',
  'George Washington': 'https://content.sportslogos.net/logos/31/685/full/george_washington_colonials_logo_primary_20063517.png',
  NYU: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/49/NYU_Violets_wordmark.svg/500px-NYU_Violets_wordmark.svg.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail',
  McGill: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/Mcgill_athletics_logo.png/330px-Mcgill_athletics_logo.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail',
  Toronto: 'https://thumb.wikimedia.org/wikipedia/en/thumb/0/01/Varsity_Blues_Logo.svg/250px-Varsity_Blues_Logo.svg.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail',
};

const list = x => (Array.isArray(x) ? x : Object.values(x || {}));
const logoOf = o => o && (o.logo || o.logoOverride || o.logoUrl) || null;

// Read an AAU Dynasty backup: { schools: { name: url }, conferences: { name: url } }.
// Schools are listed under both their short name ("UC Irvine") and full name.
export function readAauLogos(data) {
  if (!data || !data.schools || !data.conferences) throw new Error("That file isn't an AAU Dynasty backup (it needs its schools and conferences).");
  const schools = {}, conferences = {};
  for (const s of list(data.schools)) {
    const url = logoOf(s);
    if (!url) continue;
    for (const n of [s.short, s.name]) if (n) schools[n] = url;
  }
  for (const c of list(data.conferences)) {
    const url = logoOf(c);
    if (url && c.name) conferences[c.name] = url;
  }
  return { schools, conferences };
}

// Put the logos on every team (all seasons and the offseason draft) and
// conference that games by name. Returns what changed.
export function applyAauLogos(league, { schools = {}, conferences = {} }) {
  const teams = new Set(), confs = new Set();
  const sets = [...Object.values(league.seasons || {}).map(se => se.teams), ...(league.draft ? [league.draft.teams] : [])];
  for (const tset of sets) for (const t of Object.values(tset || {})) {
    const url = schools[t.school];
    if (url) { t.logoOverride = url; teams.add(t.school); }
  }
  for (const [name, url] of Object.entries(conferences)) {
    if (league.conferences?.[name]) { league.conferences[name].logo = url; confs.add(name); }
  }
  return { teams: [...teams].sort(), conferences: [...confs].sort() };
}
