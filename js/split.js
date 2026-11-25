// Dividi un totale (richiesta di Ambra del 25/11/2026): il totale di un canale diviso nei mesi scelti con le % dello
// stesso mese dell'anno prima. Ogni mese diventa una proposta in €/giorno sui giorni attivi del mese.

const MISSING = 'Manca l\'anno precedente: il budget va inserito a mano.';

const round2 = (n) => Math.round(n * 100) / 100;
const ymAdd = (ym, n) => {
  const t = Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1 + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
};

// I mesi di yms tra from e to compresi (vuoto se l'inizio viene dopo la fine).
export function monthRange(yms, from, to) {
  if (from > to) return [];
  return yms.filter(ym => ym >= from && ym <= to);
}

// Peso di ogni mese = quanto ha pesato lo stesso mese dell'anno prima sullo stesso canale.
// Prima dell'inizio del piano: vecchio foglio, speso o (se manca, come ad agosto e settembre 2026) programmato.
// Dal piano in poi: speso del piano o, se manca, programmato (€/giorno × giorni). null = nessun dato.
export function lastYearWeights(storico, structure, plan, channelId, yms) {
  const start = plan[0].ym;
  const ch = structure.channels.find(c => c.id === channelId);
  const old = (storico && storico.tabs && storico.tabs[structure.tab] && ch && storico.tabs[structure.tab][ch.title]) || {};
  const out = {};
  for (const ym of yms) {
    const src = ymAdd(ym, -12);
    let w = null;
    if (src < start) {
      const v = old[src];
      if (v && v.spent !== null && v.spent !== undefined) w = v.spent;
      else if (v && typeof v.programmed === 'number') w = v.programmed;
    } else {
      const p = plan.find(x => x.ym === src);
      const c = p && p.channels.find(x => x.id === channelId);
      if (c && c.spent !== null && c.spent !== undefined) w = c.spent;
      else if (c && c.eur !== null && c.eur !== undefined) w = c.programmed;
    }
    out[ym] = w;
  }
  return out;
}

// months: [{ ym, days, current, weight }]. Le righe senza peso o senza giorni attivi restano fuori dalla somma.
export function splitTotal(total, months) {
  const usable = months.filter(m => m.weight !== null && m.weight !== undefined && m.days > 0);
  const sum = usable.reduce((a, m) => a + m.weight, 0);
  if (!usable.length || !(sum > 0)) return { ok: false, error: MISSING };
  const rows = months.map((m) => {
    const base = { ym: m.ym, weight: m.weight ?? null, share: null, eur: null, amount: null, skip: null };
    if (m.weight === null || m.weight === undefined) return { ...base, skip: 'missing' };
    if (!(m.days > 0)) return { ...base, share: Math.round((m.weight / sum) * 100), skip: 'nodays' };
    const eur = round2((total * m.weight) / sum / m.days);
    return { ...base, share: Math.round((m.weight / sum) * 100), eur, amount: round2(eur * m.days),
      skip: m.current !== null && m.current !== undefined && Number(m.current) === eur ? 'same' : null };
  });
  const tot = round2(rows.reduce((a, r) => a + (r.amount || 0), 0));
  return { ok: true, rows, total: tot };
}
