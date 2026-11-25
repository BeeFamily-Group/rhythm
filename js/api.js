// Chiamate alla web app Apps Script. Con ?demo usa i dati di prova in locale (non pubblicati).
// Protezione (25/11): niente più letture pubbliche, i dati arrivano solo con il codice (azione "load").
import { WEB_APP_URL } from '../config.js';

const DEMO = new URLSearchParams(location.search).has('demo');

export function isDemo() { return DEMO; }

// Piano, spesa Meta, storico e nomi delle strutture in una risposta (da leggere con unpackLoad di session.js).
export async function load(code) {
  if (DEMO) {
    const get = (u) => fetch(u, { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
    const [state, meta, storico, names] = await Promise.all([get('data/demo-state.json'), get('data/demo-meta.json'),
      get('data/storico-2026.json'), get('data/strutture.json')]);
    return { ok: true, role: null, state, meta, storico, names };
  }
  return post('load', {}, code);
}

// POST in text/plain: niente preflight CORS verso Apps Script.
export async function post(action, payload, code) {
  if (DEMO) return { ok: false, error: 'modalità demo: niente salvataggi' };
  const r = await fetch(WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...payload, action, code }),
  });
  return r.json();
}
