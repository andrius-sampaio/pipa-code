import './app.css'

// Fase 0: casca mínima. Layout completo na Fase 1.
export function App() {
  return (
    <main class="minicode-app">
      <header class="topbar">
        <strong>MiniCode</strong>
        <span class="tagline">IDE educacional web, offline</span>
      </header>
      <section class="placeholder">
        <h1>Bem-vindo ao MiniCode</h1>
        <p>Fase 0 — fundação (PWA, estrutura, orçamento de tamanho).</p>
        <p>O layout completo (Modo Desktop e Modo Toque) chega na Fase 1.</p>
      </section>
      <footer class="statusbar">
        <span>Offline pronto após a primeira visita</span>
      </footer>
    </main>
  )
}