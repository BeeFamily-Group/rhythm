// Protezione (25/11): la web app restituisce piano, spesa Meta, storico e nomi in una sola risposta, e solo a chi manda
// un codice valido. Qui si separa il «codice non valido» (si torna al modulo di accesso) dagli errori passeggeri
// (il codice resta salvato e si riprova).

export const EMPTY_META = { as_of: null, accounts: {}, campaigns: [], daily: [] };
const emptyMeta = () => ({ as_of: null, accounts: {}, campaigns: [], daily: [] });

export function unpackLoad(r) {
  if (!r || !r.ok) return { ok: false, invalid: Boolean(r) && r.error === 'codice non valido', error: (r && r.error) || 'rete' };
  if (!r.state || r.state.ok === false) return { ok: false, invalid: false, error: (r.state && r.state.error) || 'stato non disponibile' };
  return { ok: true, role: r.role || null, state: r.state, meta: r.meta || emptyMeta(), storico: r.storico || null, names: r.names || null };
}

// Campi dello store dopo un caricamento: la data dei dati è quella di Meta, o ieri se Meta non ne ha ancora una.
export function storeFields(d, now = new Date()) {
  return {
    state: d.state, meta: d.meta, storico: d.storico, names: d.names,
    today: now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' }),
    asOf: (d.meta && d.meta.as_of) || new Date(now.getTime() - 86400000).toISOString().slice(0, 10),
  };
}
