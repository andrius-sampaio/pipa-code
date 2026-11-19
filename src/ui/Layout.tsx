import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import { loadPrefs, savePrefs, type Prefs, type Theme } from '../app/preferences'
import { Explorer } from './Explorer'
import { Editor } from '../editor/Editor'
import { Preview } from '../preview/Preview'
import { ConsolePanel } from './ConsolePanel'
import type { ConsoleEntry } from './ConsolePanel'
import { loadLanguageExtension } from '../editor/languages'
import { writeFile, findFile } from '../storage/projects'
import type { ProjectRecord } from '../storage/db'

interface LayoutProps {
  project: ProjectRecord
  onClose: () => void
}

export function Layout({ project, onClose }: LayoutProps) {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const [showDesktopSuggest, setShowDesktopSuggest] = useState(false)
  const [openFiles, setOpenFiles] = useState<string[]>([])
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [contents, setContents] = useState<Record<string, string>>({})
  const [langs, setLangs] = useState<Record<string, any>>({})
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([])
  const saveTimers = useRef<Record<string, number>>({})

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', prefs.theme === 'dark' ? '' : prefs.theme)
    if (prefs.theme === 'dark') document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.setProperty('--ui-scale', String(prefs.zoom))
  }, [prefs.theme, prefs.zoom])

  useEffect(() => { savePrefs(prefs) }, [prefs])

  useEffect(() => {
    if (prefs.mode === 'desktop') return
    let suggested = false
    const onKey = (e: KeyboardEvent) => {
      if (suggested) return
      const hasMod = e.ctrlKey || e.metaKey || e.altKey
      const navKey = ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
      if (hasMod || navKey) { suggested = true; setShowDesktopSuggest(true) }
    }
    const onPointer = (e: PointerEvent) => {
      if (suggested) return
      if (e.pointerType === 'mouse' || (window.matchMedia && window.matchMedia('(pointer: fine)').matches)) {
        suggested = true; setShowDesktopSuggest(true)
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onPointer) }
  }, [prefs.mode])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key === '+' || e.key === '=') { e.preventDefault(); setPrefs((p) => ({ ...p, zoom: Math.min(1.4, Math.round((p.zoom + 0.1) * 10) / 10) })) }
      else if (e.key === '-') { e.preventDefault(); setPrefs((p) => ({ ...p, zoom: Math.max(0.8, Math.round((p.zoom - 0.1) * 10) / 10) })) }
      else if (e.key === '0') { e.preventDefault(); setPrefs((p) => ({ ...p, zoom: 1 })) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const enterDesktop = useCallback(async () => {
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen() } catch {}
    try { // @ts-ignore
      if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape') } catch {}
    setPrefs((p) => ({ ...p, mode: 'desktop' }))
    setShowDesktopSuggest(false)
  }, [])

  const exitDesktop = useCallback(async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen() } catch {}
    setPrefs((p) => ({ ...p, mode: 'touch' }))
  }, [])

  const togglePanel = (key: keyof Prefs['desktopPanels']) => {
    setPrefs((p) => ({ ...p, desktopPanels: { ...p.desktopPanels, [key]: !p.desktopPanels[key] } }))
  }
  const addConsole = (level: string, text: string) => setConsoleEntries((prev) => [...prev, { level, text, ts: Date.now() }])

  const openFile = useCallback(async (path: string) => {
    if (!openFiles.includes(path)) {
      setOpenFiles((prev) => [...prev, path])
      // carregar conteúdo
      const rec = await findFile(project.id, path)
      setContents((prev) => ({ ...prev, [path]: rec?.content ?? '' }))
      // carregar linguagem (lazy)
      if (!langs[path]) {
        const ext = await loadLanguageExtension(path)
        setLangs((prev) => ({ ...prev, [path]: ext }))
      }
    }
    setActiveFile(path)
  }, [openFiles, project.id, langs])


  const handleSelectFile = useCallback((path: string | null) => {
    if (path) openFile(path)
  }, [openFile])

  const closeTab = (path: string) => {
    setOpenFiles((prev) => prev.filter((p) => p !== path))
    setContents((prev) => { const c = { ...prev }; delete c[path]; return c })
    if (activeFile === path) {
      const remaining = openFiles.filter((p) => p !== path)
      setActiveFile(remaining.length ? remaining[remaining.length - 1] : null)
    }
  }

  const handleChange = (path: string, value: string) => {
    setContents((prev) => ({ ...prev, [path]: value }))
    // autosave com debounce
    if (saveTimers.current[path]) window.clearTimeout(saveTimers.current[path])
    saveTimers.current[path] = window.setTimeout(() => {
      writeFile(project.id, path, value).catch(() => {})
    }, 600)
  }

  const handleSave = (path: string) => {
    if (saveTimers.current[path]) window.clearTimeout(saveTimers.current[path])
    writeFile(project.id, path, contents[path] ?? '').catch(() => {})
  }

  return (
    <div class={`minicode-app mode-${prefs.mode}`}>
      <header class="topbar">
        <strong>MiniCode</strong>
        <span class="project-name">{project.name}</span>
        <nav class="topbar-actions">
          <button onClick={() => (prefs.mode === 'desktop' ? exitDesktop() : enterDesktop())}>
            {prefs.mode === 'desktop' ? 'Sair do Modo Desktop' : 'Modo Desktop'}
          </button>
          <select value={prefs.theme} onChange={(e) => setPrefs((p) => ({ ...p, theme: (e.target as HTMLSelectElement).value as Theme }))} aria-label="Tema">
            <option value="dark">Escuro</option>
            <option value="light">Claro</option>
            <option value="high-contrast">Alto contraste</option>
          </select>
          <button onClick={onClose} title="Fechar projeto">Fechar projeto</button>
        </nav>
      </header>

      {showDesktopSuggest && prefs.mode !== 'desktop' && (
        <div class="banner">
          Teclado/mouse detectados. Ativar Modo Desktop?
          <button onClick={enterDesktop}>Ativar</button>
          <button onClick={() => setShowDesktopSuggest(false)}>Agora não</button>
        </div>
      )}

      <main class="workspace">
        {prefs.mode === 'desktop' ? (
          <DesktopLayout prefs={prefs} togglePanel={togglePanel} project={project} openFiles={openFiles} activeFile={activeFile}
            contents={contents} langs={langs} onSelectFile={handleSelectFile} onCloseTab={closeTab} onActivate={setActiveFile}
            onChange={handleChange} onSave={handleSave} onConsole={addConsole} consoleEntries={consoleEntries} setConsoleEntries={setConsoleEntries} />
        ) : (
          <TouchLayout project={project} openFiles={openFiles} activeFile={activeFile}
            contents={contents} langs={langs} onSelectFile={handleSelectFile} onCloseTab={closeTab} onActivate={setActiveFile}
            onChange={handleChange} onSave={handleSave} onConsole={addConsole} />
        )}
      </main>

      <footer class="statusbar">
        <span>Modo: {prefs.mode === 'desktop' ? 'Desktop' : 'Toque'}</span>
        <span>Zoom: {Math.round(prefs.zoom * 100)}%</span>
        <span>Tema: {prefs.theme}</span>
        {activeFile && <span>Arquivo: {activeFile}</span>}
      </footer>
    </div>
  )
}

function DesktopLayout({ prefs, togglePanel, project, openFiles, activeFile, contents, langs, onSelectFile, onCloseTab, onActivate, onChange, onSave, onConsole, consoleEntries, setConsoleEntries }: any) {
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
          <div class="panel-body">
            <Explorer project={project} selectedFile={activeFile} onSelectFile={onSelectFile} />
          </div>
        </aside>
      )}
      <section class="editor-area">
        <div class="tabs">
          {openFiles.length === 0 && <span class="muted">Nenhum arquivo aberto</span>}
          {openFiles.map((p: string) => (
            <button key={p} class={`tab ${activeFile === p ? 'active' : ''}`} onClick={() => onActivate(p)}>
              {p.split('/').pop()}
              <span class="tab-close" onClick={(e) => { e.stopPropagation(); onCloseTab(p) }}>×</span>
            </button>
          ))}
        </div>
        <div class="editor-host">
          {activeFile ? (
            <Editor value={contents[activeFile] ?? ''} language={langs[activeFile]} onChange={(v: string) => onChange(activeFile, v)} onSave={() => onSave(activeFile)} />
          ) : (
            <div class="editor-placeholder">Abra um arquivo no explorador</div>
          )}
        </div>
      </section>
      {prefs.desktopPanels.preview && (
        <aside class="panel preview">
          <header class="panel-header">
            PREVIEW
            <button class="panel-close" onClick={() => togglePanel('preview')} aria-label="Fechar preview">×</button>
          </header>
          <div class="panel-body preview-body">
            <Preview contents={contents} onConsole={onConsole} />
          </div>
        </aside>
      )}
      {prefs.desktopPanels.bottom && (
        <div class="bottom-panel">
          <header class="panel-header">
            PAINEL
            <button class="panel-close" onClick={() => togglePanel('bottom')} aria-label="Fechar painel">×</button>
          </header>
          <div class="panel-body">
            <ConsolePanel entries={consoleEntries} onClear={() => setConsoleEntries([])} />
          </div>
        </div>
      )}
    </div>
  )
}

function TouchLayout({ project, openFiles, activeFile, contents, langs, onSelectFile, onCloseTab, onActivate, onChange, onSave, onConsole }: any) {
  const [tab, setTab] = useState<'files' | 'code' | 'result' | 'tutor'>('code')
  return (
    <div class="touch-layout">
      <div class="touch-content">
        {tab === 'files' && <Explorer project={project} selectedFile={activeFile} onSelectFile={onSelectFile} />}
        {tab === 'code' && (
          <div class="editor-host">
            {openFiles.length > 0 && (
              <div class="tabs">
                {openFiles.map((p: string) => (
                  <button key={p} class={`tab ${activeFile === p ? 'active' : ''}`} onClick={() => onActivate(p)}>
                    {p.split('/').pop()}
                    <span class="tab-close" onClick={(e) => { e.stopPropagation(); onCloseTab(p) }}>×</span>
                  </button>
                ))}
              </div>
            )}
            {activeFile ? (
              <Editor value={contents[activeFile] ?? ''} language={langs[activeFile]} onChange={(v: string) => onChange(activeFile, v)} onSave={() => onSave(activeFile)} />
            ) : (
              <div class="editor-placeholder">Abra um arquivo em Arquivos</div>
            )}
          </div>
        )}
        {tab === 'result' && <div class="panel-body"><Preview contents={contents} onConsole={onConsole} /></div>}
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