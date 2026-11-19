import { useState, useEffect, useCallback } from 'preact/hooks'
import { loadPrefs, savePrefs, type Prefs, type Theme } from '../app/preferences'

// Layout raiz: controla tema, modo, zoom e tela cheia.
export function Layout() {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const [showDesktopSuggest, setShowDesktopSuggest] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Aplica tema e zoom no <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', prefs.theme === 'dark' ? '' : prefs.theme)
    if (prefs.theme === 'dark') document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.setProperty('--ui-scale', String(prefs.zoom))
  }, [prefs.theme, prefs.zoom])

  useEffect(() => {
    savePrefs(prefs)
  }, [prefs])

  // Detecta fullscreen changes
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // Detecção de teclado/mouse físico (sugestão, não impositiva)
  useEffect(() => {
    if (prefs.mode === 'desktop') return
    let suggested = false
    const onKey = (e: KeyboardEvent) => {
      if (suggested) return
      const hasMod = e.ctrlKey || e.metaKey || e.altKey
      const navKey = ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
      if (hasMod || navKey) {
        suggested = true
        setShowDesktopSuggest(true)
      }
    }
    const onPointer = (e: PointerEvent) => {
      if (suggested) return
      if (e.pointerType === 'mouse' || (window.matchMedia && window.matchMedia('(pointer: fine)').matches)) {
        suggested = true
        setShowDesktopSuggest(true)
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [prefs.mode])

  // Atalhos de zoom
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        setPrefs((p) => ({ ...p, zoom: Math.min(1.4, Math.round((p.zoom + 0.1) * 10) / 10) }))
      } else if (e.key === '-') {
        e.preventDefault()
        setPrefs((p) => ({ ...p, zoom: Math.max(0.8, Math.round((p.zoom - 0.1) * 10) / 10) }))
      } else if (e.key === '0') {
        e.preventDefault()
        setPrefs((p) => ({ ...p, zoom: 1 }))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const enterDesktop = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
    } catch {
      // fullscreen pode ser negado (ex.: iOS) — continuar mesmo assim
    }
    try {
      // @ts-ignore
      if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape')
    } catch {
      // não suportado — mostrar aviso
    }
    setPrefs((p) => ({ ...p, mode: 'desktop' }))
    setShowDesktopSuggest(false)
  }, [])

  const exitDesktop = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
    } catch {
      // ignore
    }
    setPrefs((p) => ({ ...p, mode: 'touch' }))
  }, [])

  const togglePanel = (key: keyof Prefs['desktopPanels']) => {
    setPrefs((p) => ({ ...p, desktopPanels: { ...p.desktopPanels, [key]: !p.desktopPanels[key] } }))
  }

  const orientationLocked = isFullscreen

  return (
    <div class={`minicode-app mode-${prefs.mode}`}>
      <header class="topbar">
        <strong>MiniCode</strong>
        <nav class="topbar-actions">
          <button onClick={() => (prefs.mode === 'desktop' ? exitDesktop() : enterDesktop())}>
            {prefs.mode === 'desktop' ? 'Sair do Modo Desktop' : 'Modo Desktop'}
          </button>
          <select
            value={prefs.theme}
            onChange={(e) => setPrefs((p) => ({ ...p, theme: (e.target as HTMLSelectElement).value as Theme }))}
            aria-label="Tema"
          >
            <option value="dark">Escuro</option>
            <option value="light">Claro</option>
            <option value="high-contrast">Alto contraste</option>
          </select>
        </nav>
      </header>

      {showDesktopSuggest && prefs.mode !== 'desktop' && (
        <div class="banner">
          Teclado/mouse detectados. Ativar Modo Desktop?
          <button onClick={enterDesktop}>Ativar</button>
          <button onClick={() => setShowDesktopSuggest(false)}>Agora não</button>
        </div>
      )}

      {!orientationLocked && prefs.mode === 'desktop' && (
        <div class="banner warn">Gire o aparelho para a horizontal para melhor visualização.</div>
      )}

      <main class="workspace">
        {prefs.mode === 'desktop' ? (
          <DesktopLayout prefs={prefs} togglePanel={togglePanel} />
        ) : (
          <TouchLayout />
        )}
      </main>

      <footer class="statusbar">
        <span>Modo: {prefs.mode === 'desktop' ? 'Desktop' : 'Toque'}</span>
        <span>Zoom: {Math.round(prefs.zoom * 100)}%</span>
        <span>Tema: {prefs.theme}</span>
      </footer>
    </div>
  )
}

function DesktopLayout({ prefs, togglePanel }: { prefs: Prefs; togglePanel: (k: keyof Prefs['desktopPanels']) => void }) {
  return (
    <div class="desktop-layout">
      <aside class="activitybar">
        <button title="Arquivos" aria-label="Arquivos">📁</button>
        <button title="Tutor" aria-label="Tutor">💡</button>
        <button title="Configurações" aria-label="Configurações">⚙️</button>
      </aside>
      {prefs.desktopPanels.explorer && (
        <aside class="panel explorer">
          <header class="panel-header">
            EXPLORADOR
            <button class="panel-close" onClick={() => togglePanel('explorer')} aria-label="Fechar explorador">×</button>
          </header>
          <div class="panel-body">Arquivos do projeto (Fase 2)</div>
        </aside>
      )}
      <section class="editor-area">
        <div class="tabs">aba1.html ×</div>
        <div class="editor-placeholder">Editor (CodeMirror) — Fase 3</div>
      </section>
      {prefs.desktopPanels.preview && (
        <aside class="panel preview">
          <header class="panel-header">
            PREVIEW
            <button class="panel-close" onClick={() => togglePanel('preview')} aria-label="Fechar preview">×</button>
          </header>
          <div class="panel-body">Preview/Resultado (Fase 4)</div>
        </aside>
      )}
      {prefs.desktopPanels.bottom && (
        <div class="bottom-panel">
          <header class="panel-header">
            PAINEL
            <button class="panel-close" onClick={() => togglePanel('bottom')} aria-label="Fechar painel">×</button>
          </header>
          <div class="panel-body">Problemas · Console · Tutor (Fases 5-6)</div>
        </div>
      )}
    </div>
  )
}

function TouchLayout() {
  const [tab, setTab] = useState<'files' | 'code' | 'result' | 'tutor'>('code')
  return (
    <div class="touch-layout">
      <div class="touch-content">
        {tab === 'files' && <div class="panel-body">Arquivos (Fase 2)</div>}
        {tab === 'code' && <div class="editor-placeholder">Editor (Fase 3)</div>}
        {tab === 'result' && <div class="panel-body">Resultado (Fase 4)</div>}
        {tab === 'tutor' && <div class="panel-body">Tutor (Fase 6)</div>}
      </div>
      <nav class="touch-nav">
        <button class={tab === 'files' ? 'active' : ''} onClick={() => setTab('files')}>Arquivos</button>
        <button class={tab === 'code' ? 'active' : ''} onClick={() => setTab('code')}>Código</button>
        <button class={tab === 'result' ? 'active' : ''} onClick={() => setTab('result')}>Resultado</button>
        <button class={tab === 'tutor' ? 'active' : ''} onClick={() => setTab('tutor')}>Tutor</button>
      </nav>
      <div class="symbol-bar">
        <button>Tab</button><button>{'{}'}</button><button>{'()'}</button><button>{'[]'}</button>
        <button>{'<>'}</button><button>;</button><button>:</button><button>"</button><button>'</button>
        <button>=</button><button>/</button><button>#</button><button>Undo</button><button>Redo</button>
      </div>
    </div>
  )
}