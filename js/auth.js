// Codice personale: si salva in questo browser e la web app restituisce il ruolo.
// Protezione (25/11): il codice apre anche la lettura. Senza codice valido la pagina mostra solo il modulo di accesso.
import { load } from './api.js';
import { unpackLoad } from './session.js';
import { store, render, esc, apply } from './app.js';
import { rememberRole } from './greeting.js';
import { loginFormHtml, CREDENTIAL_USER } from './loginform.js';

const KEY = 'budget-adv-code';
const LABEL = { francesco: 'Francesco · Meta', marco: 'Marco · Google', ambra: 'Ambra · proposte' };

// Il ruolo resta nel browser per salutare per nome sulla schermata gialla (js/greeting.js).
function storage() { try { return localStorage; } catch { return null; } }

function saved() { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } }
function save(code) { try { code ? localStorage.setItem(KEY, code) : localStorage.removeItem(KEY); } catch { /* niente */ } }

// Portachiavi del browser (25/11): dove c'è l'API delle credenziali (Chrome, Edge) il codice si salva in modo esplicito
// dopo un accesso riuscito e, se il browser l'ha perso, si recupera in silenzio al caricamento. Safari e gli altri
// gestori di password lo prendono dal modulo (campo password + nome utente "Rhythm").
async function storeCredential(code) {
  try {
    if (window.PasswordCredential && navigator.credentials) {
      await navigator.credentials.store(new window.PasswordCredential({ id: CREDENTIAL_USER, password: code, name: 'Rhythm BeeFamily' }));
    }
  } catch { /* il browser può rifiutare: resta il salvataggio nel browser */ }
}

async function credentialCode() {
  try {
    if (!window.PasswordCredential || !navigator.credentials) return '';
    const c = await navigator.credentials.get({ password: true, mediation: 'silent' });
    return c && c.password ? String(c.password).trim().toUpperCase() : '';
  } catch { return ''; }
}

function paintButton() {
  const b = document.getElementById('who');
  b.textContent = store.role ? LABEL[store.role] : 'Accedi';
  b.classList.toggle('on', Boolean(store.role));
}

const fetchData = (code) => load(code).then(unpackLoad, (e) => unpackLoad({ ok: false, error: e.message }));

function enter(code, d) {
  store.code = code;
  store.role = d.role;
  save(code);
  rememberRole(storage(), d.role);
  apply(d);
  document.body.classList.remove('locked');
  paintButton();
  render();
}

// Al caricamento: true se il codice salvato (o del portachiavi) ha aperto i dati. Un errore passeggero, anche dopo
// il secondo tentativo, diventa un messaggio in pagina e il codice resta salvato.
export async function restore() {
  const code = saved() || await credentialCode();   // codice perso dal browser: lo ripropone il portachiavi
  if (!code) return false;
  let d = await fetchData(code);
  if (!d.ok && !d.invalid) {
    await new Promise(res => setTimeout(res, 2000));
    d = await fetchData(code);
  }
  if (d.ok) { enter(code, d); return true; }
  if (d.invalid) { save(''); rememberRole(storage(), null); return false; }
  throw new Error(d.error);
}

// Pagina chiusa: via i dati dalla memoria e dallo schermo, resta il modulo di accesso.
export function lock() {
  Object.assign(store, { state: null, meta: null, storico: null, names: null, role: null, code: null });
  document.body.classList.add('locked');
  ['cards', 'overview', 'months', 'banners', 'count', 'offCount'].forEach((id) => { document.getElementById(id).innerHTML = ''; });
  const det = document.getElementById('detail');
  det.hidden = true;
  det.innerHTML = '';
  paintButton();
  openLogin();
}

export function openLogin() {
  const d = document.getElementById('dialog');
  d.innerHTML = `<form class="dialog-card" id="loginForm">
      <h3>${store.role ? esc(LABEL[store.role]) : 'Accedi con il tuo codice'}</h3>
      ${store.role
        ? '<p class="small">Sei collegato su questo browser.</p><button class="btn" type="button" id="logout">Esci</button> <button class="btn" type="button" id="close">Chiudi</button>'
        : ''}
    </form>`;
  if (!store.role) d.innerHTML = loginFormHtml();
  d.hidden = false;
  const close = () => { d.hidden = true; d.innerHTML = ''; };
  const shut = d.querySelector('#close');
  if (shut) shut.addEventListener('click', close);
  const toggle = d.querySelector('#pwToggle');
  if (toggle) toggle.addEventListener('click', () => {
    const input = d.querySelector('#code');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    toggle.textContent = show ? 'Nascondi' : 'Mostra';
    toggle.setAttribute('aria-pressed', String(show));
    input.focus();
  });
  const out = d.querySelector('#logout');
  if (out) out.addEventListener('click', () => {
    // dopo «Esci» il portachiavi non deve rientrare da solo al caricamento successivo
    try { if (navigator.credentials && navigator.credentials.preventSilentAccess) navigator.credentials.preventSilentAccess().catch(() => {}); } catch { /* niente */ }
    save(''); rememberRole(storage(), null); close(); lock(); });
  d.querySelector('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = d.querySelector('#code').value.trim().toUpperCase();
    const btn = d.querySelector('button[type="submit"]');
    btn.disabled = true;
    d.querySelector('#err').textContent = 'Apro Rhythm…';
    const r = await fetchData(code);
    btn.disabled = false;
    if (!r.ok) {
      d.querySelector('#err').textContent = r.invalid ? 'Codice non valido.' : `Accesso non riuscito (${r.error}): riprova tra poco.`;
      return;
    }
    storeCredential(code);   // senza attendere: il dialogo si chiude subito
    close();
    enter(code, r);
  });
  const input = d.querySelector('#code');
  if (input) input.focus();
}
