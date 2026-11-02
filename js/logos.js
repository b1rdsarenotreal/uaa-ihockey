// Team logos. Primary source: the college football logo list at
// https://gist.github.com/saiemgilani/c6596f0e1c8b148daabc2b7f1e6f6add
// (ESPN logo URLs keyed by school and alternate names). It's fetched once and
// cached in this browser. Teams it doesn't cover show their initials until
// the commissioner adds a logo.

const GIST_RAW = 'https://gist.githubusercontent.com/saiemgilani/c6596f0e1c8b148daabc2b7f1e6f6add/raw/logos';
const CACHE_KEY = 'aau-hockey-logo-table-v1';
// Schools without football (UC San Diego, UC Irvine, George Washington…)
// come from ESPN's women's college soccer team list (most hockey schools
// play soccer too) instead.
const ESPN_TEAMS = 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.ncaa.w.1/teams?limit=1000';
const MAX_AGE = 30 * 24 * 3600 * 1000;

let table = null; // lowercased name -> { light, dark, color, altColor }

const https = u => (u ? String(u).replace(/^http:\/\//i, 'https://') : null);
const norm = s => String(s || '').trim().toLowerCase();

export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(x => x !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some(x => x !== '')) rows.push(row); }
  return rows;
}

export function buildTable(csvText) {
  const [header, ...rows] = parseCSV(csvText);
  const col = name => header.findIndex(h => h.trim().toLowerCase() === name);
  const iSchool = col('school'), iLogo = col('logo'), iDark = col('logos[1]'), iColor = col('color'), iAlt = col('alt_color');
  const altCols = ['alt_name1', 'alt_name2', 'alt_name3', 'abbreviation'].map(col).filter(i => i >= 0);
  const out = {};
  for (const r of rows) {
    const entry = { light: https(r[iLogo]), dark: https(r[iDark]) || https(r[iLogo]), color: r[iColor] || null, altColor: r[iAlt] || null };
    if (!entry.light) continue;
    const school = norm(r[iSchool]);
    if (school) out[school] = entry;
    for (const i of altCols) { const k = norm(r[i]); if (k && !(k in out)) out[k] = entry; }
  }
  return out;
}

// Adds ESPN's team list to the table: "Michigan Wolverines" and "Michigan".
export function addEspn(out, json) {
  const teams = json?.sports?.[0]?.leagues?.[0]?.teams || [];
  for (const { team: t } of teams) {
    const url = https(t?.logos?.[0]?.href);
    if (!url) continue;
    const entry = { light: url, dark: https(t.logos?.[1]?.href) || url, color: t.color ? `#${t.color}` : null, altColor: t.alternateColor ? `#${t.alternateColor}` : null };
    for (const k of [t.displayName, t.location, t.shortDisplayName].map(norm)) if (k && !(k in out)) out[k] = entry;
  }
  return out;
}

export async function loadLogoTable({ force = false } = {}) {
  if (table && !force) return table;
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached && !force && Date.now() - cached.at < MAX_AGE) return (table = cached.table);
  } catch { /* ignore */ }
  const [gist, espn] = await Promise.allSettled([
    fetch(GIST_RAW).then(r => (r.ok ? r.text() : Promise.reject(r.status))),
    fetch(ESPN_TEAMS).then(r => (r.ok ? r.json() : Promise.reject(r.status))),
  ]);
  const next = gist.status === 'fulfilled' ? buildTable(gist.value) : {};
  if (espn.status === 'fulfilled') addEspn(next, espn.value);
  if (Object.keys(next).length) {
    table = next;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), table })); } catch { /* quota */ }
  } else table = table || {};
  return table;
}

// Returns a logo URL or null: the commissioner's own logo first, then the list.
export function logoFor(team, aliases = {}) {
  if (!team) return null;
  if (team.logoOverride) return https(team.logoOverride);
  const hit = table?.[norm(team.school)] || table?.[norm(aliases[team.school])];
  return hit ? hit.light : null;
}
