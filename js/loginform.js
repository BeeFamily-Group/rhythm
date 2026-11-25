// Modulo di accesso come vero campo password (task di Ambra del 25/11/2026): il portachiavi del browser (Chrome,
// Safari/iCloud, gestori di password) lo riconosce, propone di salvarlo e lo compila da solo alla volta dopo.
// Il nome utente è fisso e nascosto alla vista: serve solo a legare la password a "Rhythm".
// Dal 25/11 è anche la porta della pagina: senza codice non si vede nessun dato, quindi il modulo non si chiude.

export const CREDENTIAL_USER = 'Rhythm';

export function loginFormHtml() {
  return `<form class="dialog-card" id="loginForm" method="post" action="#">
      <h3>Accedi con il tuo codice</h3>
      <p class="small">Rhythm si apre con il tuo codice personale. Il browser può ricordarlo per te.</p>
      <input class="pw-user" type="text" name="username" autocomplete="username" value="${CREDENTIAL_USER}" tabindex="-1" aria-hidden="true" readonly>
      <label for="code">Codice</label>
      <div class="pw">
        <input id="code" name="password" type="password" autocomplete="current-password" autocapitalize="characters" spellcheck="false" placeholder="es. FRA-XXXX-XXXX" required>
        <button class="pw-toggle" id="pwToggle" type="button" aria-pressed="false" aria-controls="code">Mostra</button>
      </div>
      <p class="small" id="err" role="alert"></p>
      <button class="btn primary" type="submit">Entra</button>
    </form>`;
}
