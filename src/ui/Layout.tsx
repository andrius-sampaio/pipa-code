import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import { loadPrefs, savePrefs, type Prefs, type Theme } from '../app/preferences'
import { Explorer } from './Explorer'
import { Editor } from '../editor/Editor'
import { loadLanguageExtension, languageFromPath } from '../editor/languages'
import { writeFile, findFile, listFiles } from '../storage/projects'
import { Preview } from '../preview/Preview'
import { ConsolePanel } from './ConsolePanel'
import type { ConsoleEntry } from './ConsolePanel'
import { ProblemsPanel } from './ProblemsPanel'
import { TutorPanel } from './TutorPanel'
import { PythonPanel } from './PythonPanel'
import type { ProjectRecord } from '../storage/db'

interface LayoutProps {
  project: ProjectRecord
  onClose: () => void
}

function BottomPanel({ consoleEntries, setConsoleEntries, diagnostics, activeFile, contents, project, refreshFiles }: any) {
  const [tab, setTab] = useState<'problems' | 'console' | 'tutor' | 'python'>('problems')
  const content = activeFile ? (contents[activeFile] ?? '') : ''
  const isPy = !!activeFile && activeFile.endsWith('.py')
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div class="bottom-tabs">
        <button class={tab === 'problems' ? 'active' : ''} onClick={() => setTab('problems')}>Problemas ({diagnostics.length})</button>
        <button class={tab === 'console' ? 'active' : ''} onClick={() => setTab('console')}>Console ({consoleEntries.length})</button>
        <button class={tab === 'tutor' ? 'active' : ''} onClick={() => setTab('tutor')}>Tutor</button>
        {isPy && <button class={tab === 'python' ? 'active' : ''} onClick={() => setTab('python')}>Python</button>}
      </div>
      <div class="panel-body" style={{ flex:1, overflow:'auto' }}>
        {tab === 'problems' && <ProblemsPanel diagnostics={diagnostics} />}
        {tab === 'console' && <ConsolePanel entries={consoleEntries} onClear={() => setConsoleEntries([])} />}
        {tab === 'tutor' && <TutorPanel activeFile={activeFile} content={content} project={project} onRefreshFiles={refreshFiles} />}
        {tab === 'python' && <PythonPanel content={content} />}
      </div>
    </div>
  )
}

export function Layout({ project, onClose }: LayoutProps) {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const [showDesktopSuggest, setShowDesktopSuggest] = useState(false)
  const [openFiles, setOpenFiles] = useState<string[]>([])
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [contents, setContents] = useState<Record<string, string>>({})
  const [langs, setLangs] = useState<Record<string, any>>({})
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([])
  const [diagnostics, setDiagnostics] = useState<any[]>([])
  const saveTimers = useRef<Record<string, number>>({})

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', prefs.theme === 'dark' ? '' : prefs.theme)
    if (prefs.theme === 'dark') document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.setProperty('--ui-scale', String(prefs.zoom))
  }, [prefs.theme, prefs.zoom])

  useEffect(() => { savePrefs(prefs) }, [prefs])

  // Carregar conteúdo de todos os arquivos do projeto para o Preview funcionar sem abrir abas
  useEffect(() => {
    let cancelled = false
    listFiles(project.id).then((fs) => {
      if (cancelled) return
      const map: Record<string, string> = {}
      for (const f of fs) if (f.type === 'file') map[f.path] = f.content
      setContents((prev) => ({ ...map, ...prev }))
    })
    return () => { cancelled = true }
  }, [project.id])

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
      const rec = await findFile(project.id, path)
      setContents((prev) => ({ ...prev, [path]: rec?.content ?? '' }))
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
    <div class={`pipa-code-app mode-${prefs.mode}`}>
      <header class="topbar">
        <strong>Pipa Code</strong>
        <span class="project-name">{project.name}</span>
        <nav class="topbar-actions">
          <button onClick={() => (prefs.mode === 'desktop' ? exitDesktop() : enterDesktop())}>
            {prefs.mode === 'desktop' ? 'Sair do Modo Desktop' : 'Modo Desktop'}
          </button>
          {prefs.mode === 'desktop' && (
            <>
              <button class={prefs.desktopPanels.explorer ? 'active' : ''} onClick={() => togglePanel('explorer')} title="Explorador">Explorador</button>
              <button class={prefs.desktopPanels.preview ? 'active' : ''} onClick={() => togglePanel('preview')} title="Preview">Preview</button>
              <button class={prefs.desktopPanels.bottom ? 'active' : ''} onClick={() => togglePanel('bottom')} title="Painel">Painel</button>
            </>
          )}
          <select value={prefs.theme} onChange={(e) => setPrefs((p) => ({ ...p, theme: (e.target as HTMLSelectElement).value as Theme }))} aria-label="Tema">
            <option value="dark">Escuro</option>
            <option value="light">Claro</option>
            <option value="high-contrast">Alto contraste</option>
            <option value="aura">Aura Dark</option>
            <option value="aurora">Aurora</option>
            <option value="astral">Astral</option>
            <option value="omarchy-851">851</option>
            <option value="aetheria">Aetheria</option>
            <option value="ayaka">Ayaka</option>
            <option value="black-arch">Black Arch</option>
            <option value="bright-future">Bright Future</option>
            <option value="all-hallows-eve">All Hallows Eve</option>
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
            onChange={handleChange} onSave={handleSave} onConsole={addConsole} consoleEntries={consoleEntries} setConsoleEntries={setConsoleEntries}
            onDiagnostics={(d: any[]) => setDiagnostics(d)} diagnostics={diagnostics} />
        ) : (
          <TouchLayout project={project} openFiles={openFiles} activeFile={activeFile}
            contents={contents} langs={langs} onSelectFile={handleSelectFile} onCloseTab={closeTab} onActivate={setActiveFile}
            onChange={handleChange} onSave={handleSave} onConsole={addConsole} onDiagnostics={(d: any[]) => setDiagnostics(d)} />
        )}
      </main>

      <footer class="statusbar">
        <span>Modo: {prefs.mode === 'desktop' ? 'Desktop' : 'Toque'}</span>
        <span>Zoom: {Math.round(prefs.zoom * 100)}%</span>
        <span>Tema: {prefs.theme}</span>
        {activeFile && <span>Arquivo: {activeFile}</span>}
        <span>Problemas: {diagnostics.filter((d: any) => d.severity === 'error').length} erros, {diagnostics.filter((d: any) => d.severity === 'warning').length} avisos</span>
      </footer>
    </div>
  )
}

function DesktopLayout({ prefs, togglePanel, project, openFiles, activeFile, contents, langs, onSelectFile, onCloseTab, onActivate, onChange, onSave, onConsole, consoleEntries, setConsoleEntries, onDiagnostics, diagnostics }: any) {
  const [explorerW, setExplorerW] = useState(230)
  const [previewW, setPreviewW] = useState(300)
  const [bottomH, setBottomH] = useState(180)

  const dragX = (setter: (n: number) => void, min: number, max: number, invert: boolean, initial: number) => (e: MouseEvent) => {
    e.preventDefault()
    const start = e.clientX
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - start
      const val = invert ? initial - delta : initial + delta
      setter(Math.min(max, Math.max(min, val)))
    }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const cols: string[] = []
  if (prefs.desktopPanels.explorer) cols.push(`${explorerW}px`, '6px')
  cols.push('1fr')
  if (prefs.desktopPanels.preview) cols.push('6px', `${previewW}px`)
  const colTemplate = cols.join(' ')

  const rows: string[] = ['1fr']
  if (prefs.desktopPanels.bottom) rows.push('6px', `${bottomH}px`)
  const rowTemplate = rows.join(' ')

  return (
    <div class="desktop-layout" style={{ gridTemplateColumns: colTemplate, gridTemplateRows: rowTemplate }}>
      {prefs.desktopPanels.explorer ? (
        <>
          <aside class="panel explorer">
            <header class="panel-header">
              EXPLORADOR
              <button class="panel-close" onClick={() => togglePanel('explorer')} aria-label="Minimizar explorador" title="Minimizar painel">−</button>
            </header>
            <div class="panel-body">
              <Explorer project={project} selectedFile={activeFile} onSelectFile={onSelectFile} />
            </div>
          </aside>
          <div class="resizer-v" onMouseDown={dragX(setExplorerW, 160, 420, false, explorerW)} />
        </>
      ) : (
        <button class="panel-strip" onClick={() => togglePanel('explorer')} title="Restaurar explorador">Explorador ▸</button>
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
            <Editor value={contents[activeFile] ?? ''} language={langs[activeFile]} languageId={activeFile ? languageFromPath(activeFile) : 'javascript'} onChange={(v: string) => onChange(activeFile, v)} onSave={() => onSave(activeFile)} onDiagnostics={(d: any[]) => onDiagnostics(d)} />
          ) : (
            <div class="editor-placeholder">Abra um arquivo no explorador</div>
          )}
        </div>
      </section>
      {prefs.desktopPanels.preview ? (
        <>
          <div class="resizer-v" onMouseDown={dragX(setPreviewW, 200, 520, true, previewW)} />
          <aside class="panel preview">
            <header class="panel-header">
              PREVIEW
              <button class="panel-close" onClick={() => togglePanel('preview')} aria-label="Minimizar preview" title="Minimizar">−</button>
            </header>
            <div class="panel-body preview-body">
              <Preview contents={contents} onConsole={onConsole} />
            </div>
          </aside>
        </>
      ) : (
        <button class="panel-strip" onClick={() => togglePanel('preview')} title="Restaurar preview">Preview ◂</button>
      )}
      {prefs.desktopPanels.bottom ? (
        <>
          <div class="resizer-h" style={{ gridColumn: '1 / -1', gridRow: 2 }} onMouseDown={(e) => {
            e.preventDefault()
            const start = e.clientY
            const initial = bottomH
            const onMove = (ev: MouseEvent) => {
              const delta = ev.clientY - start
              setBottomH(Math.min(400, Math.max(100, initial + delta)))
            }
            const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
            window.addEventListener('mousemove', onMove)
            window.addEventListener('mouseup', onUp)
          }} />
          <div class="bottom-panel" style={{ gridColumn: '1 / -1', gridRow: 3, height: bottomH }}>
            <header class="panel-header">
              PAINEL
              <button class="panel-close" onClick={() => togglePanel('bottom')} aria-label="Minimizar painel" title="Minimizar">−</button>
            </header>
            <div class="panel-body" style={{ flex:1, overflow:'auto' }}>
              <BottomPanel consoleEntries={consoleEntries} setConsoleEntries={setConsoleEntries} diagnostics={diagnostics} activeFile={activeFile} contents={contents} project={project} refreshFiles={() => {}} />
            </div>
          </div>
        </>
      ) : (
        <button class="panel-strip panel-strip-bottom" onClick={() => togglePanel('bottom')} title="Restaurar painel">Painel ▴</button>
      )}
    </div>
  )
}

function TouchLayout({ project, openFiles, activeFile, contents, langs, onSelectFile, onCloseTab, onActivate, onChange, onSave, onConsole, onDiagnostics }: any) {
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
              <Editor value={contents[activeFile] ?? ''} language={langs[activeFile]} languageId={activeFile ? languageFromPath(activeFile) : 'javascript'} onChange={(v: string) => onChange(activeFile, v)} onSave={() => onSave(activeFile)} onDiagnostics={(d: any[]) => onDiagnostics(d)} />
            ) : (
              <div class="editor-placeholder">Abra um arquivo no explorador</div>
            )}
          </div>
        )}
        {tab === 'result' && <div class="panel-body"><Preview contents={contents} onConsole={onConsole} /></div>}
        {tab === 'tutor' && <div class="panel-body"><TutorPanel activeFile={activeFile} content={activeFile ? (contents[activeFile] ?? '') : ''} project={project} onRefreshFiles={() => {}} /></div>}
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