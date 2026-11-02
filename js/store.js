// Persistence: the league lives in this browser's IndexedDB (falls back to
// localStorage). Export/import JSON for backups or moving devices.

// Women's and men's are separate dynasties, each saved under its own key.
// The switch at the top of the page picks which one loads.
const DB = 'aau-hockey', STORE = 'kv';
const SIDE_KEY = 'aau-hockey-side';
export function currentSide() { try { return localStorage.getItem(SIDE_KEY) === 'men' ? 'men' : 'women'; } catch { return 'women'; } }
export function setSide(side) { try { localStorage.setItem(SIDE_KEY, side === 'men' ? 'men' : 'women'); } catch { /* ignore */ } }
const keyFor = side => (side === 'men' ? 'aau-hockey-league-men' : 'aau-hockey-league');

function idb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) return reject(new Error('no indexedDB'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
  });
}

export async function loadLeague(side = currentSide()) {
  const KEY = keyFor(side);
  try { return (await tx('readonly', s => s.get(KEY))) || null; }
  catch { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
}

export async function saveLeague(league) {
  const KEY = keyFor(league.side === 'men' ? 'men' : 'women');
  league.savedAt = new Date().toISOString();
  try { await tx('readwrite', s => s.put(JSON.parse(JSON.stringify(league)), KEY)); }
  catch { localStorage.setItem(KEY, JSON.stringify(league)); }
}

export async function clearLeague(side = currentSide()) {
  const KEY = keyFor(side);
  try { await tx('readwrite', s => s.delete(KEY)); } catch { /* ignore */ }
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function exportLeague(league) {
  const blob = new Blob([JSON.stringify(league, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(league.name || 'dynasty').replace(/\W+/g, '-')}-${league.currentYear}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
