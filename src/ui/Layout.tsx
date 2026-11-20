import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import type { EditorView } from 'codemirror'
import { undo, redo } from '@codemirror/commands'
import { loadPrefs, savePrefs, type Prefs, type Theme } from '../app/preferences'
import { Explorer } from './Explorer'
import { Editor, pasteIntoView } from '../editor/Editor'
import { QuickSwitcher } from './QuickSwitcher'
import { IconMonitor, IconSmartphone, IconX, IconFolder, IconFolderOpen, IconPlay, IconPanel, IconCode, IconBook } from './Icons'
import { loadLanguageExtension, languageFromPath } from '../editor/languages'
import { writeFile, findFile, listFiles, touchProject } from '../storage/projects'
import { Preview } from '../preview/Preview'
import { ConsolePanel } from './ConsolePanel'
import type { ConsoleEntry } from './ConsolePanel'
import { ProblemsPanel } from './ProblemsPanel'
import { TutorPanel } from './TutorPanel'
import { PythonPanel } from './PythonPanel'
import type { ProjectRecord } from '../storage/db'
import type { Diagnostic } from '../editor/diagnostics'

interface LayoutProps {
  project: ProjectRecord
  onClose: () => void
}

interface WorkspaceProps {
  project: ProjectRecord
  openFiles: string[]
  activeFile: string | null
  contents: Record<string, string>
  langs: Record<string, any>
  onSelectFile: (path: string | null) => void
  onCloseTab: (path: string) => void
  onActivate: (path: string) => void
  onChange: (path: string, value: string) => void
  onSave: (path: string) => void
  onConsole: (level: string, text: string) => void
  onDiagnostics: (diags: Diagnostic[]) => void
  onEditorReady: (view: EditorView) => void
  onExternalWrite: (path: string, content: string) => void
  onOpenSwitcher: () => void
  refreshFiles: () => void
  filesVersion: number
}

function BottomPanel({ consoleEntries, setConsoleEntries, diagnostics, activeFile, contents, project, refreshFiles, onExternalWrite, onJump }: {
  consoleEntries: ConsoleEntry[]
  setConsoleEntries: (updater: (prev: ConsoleEntry[]) => ConsoleEntry[]) => void
  diagnostics: Diagnostic[]
  activeFile: string | null
  contents: Record<string, string>
  project: ProjectRecord
  refreshFiles: () => void
  onExternalWrite: (path: string, content: string) => void
  onJump: (d: Diagnostic) => void
}) {
  const [tab, setTab] = useState<'problems' | 'console' | 'tutor' | 'python'>('problems')
  const content = activeFile ? (contents[activeFile] ?? '') : ''
  const isPy = !!activeFile && activeFile.endsWith('.py')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div class="bottom-tabs">
        <button class={tab === 'problems' ? 'active' : ''} onClick={() => setTab('problems')}>Problemas ({diagnostics.length})</button>
        <button class={tab === 'console' ? 'active' : ''} onClick={() => setTab('console')}>Console ({consoleEntries.length})</button>
        <button class={tab === 'tutor' ? 'active' : ''} onClick={() => setTab('tutor')}>Tutor</button>
        {isPy && <button class={tab === 'python' ? 'active' : ''} onClick={() => setTab('python')}>Python</button>}
      </div>
      <div class="panel-body" style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'problems' && <ProblemsPanel diagnostics={diagnostics} onJump={onJump} />}
        {tab === 'console' && <ConsolePanel entries={consoleEntries} onClear={() => setConsoleEntries(() => [])} />}
        {tab === 'tutor' && <TutorPanel activeFile={activeFile} content={content} project={project} onRefreshFiles={refreshFiles} onExternalWrite={onExternalWrite} />}
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
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [filesVersion, setFilesVersion] = useState(0)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const saveTimers = useRef<Record<string, number>>({})
  const editorViewRef = useRef<EditorView | null>(null)
  const openFilesRef = useRef<string[]>([])
  const activeFileRef = useRef<string | null>(null)
  openFilesRef.current = openFiles
  activeFileRef.current = activeFile

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', prefs.theme === 'dark' ? '' : prefs.theme)
    if (prefs.theme === 'dark') document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.setProperty('--ui-scale', String(prefs.zoom))
  }, [prefs.theme, prefs.zoom])

  useEffect(() => { savePrefs(prefs) }, [prefs])

  useEffect(() => {
    touchProject(project.id).catch(() => {})
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

  useEffect(() => {
    let cancelled = false
    listFiles(project.id).then((fs) => {
      if (cancelled) return
      const map: Record<string, string> = {}
      for (const f of fs) if (f.type === 'file') map[f.path] = f.content
      // Conteúdos em memória (edições não salvas) têm prioridade.
      setContents((prev) => ({ ...map, ...prev }))
    })
    return () => { cancelled = true }
  }, [project.id, filesVersion])

  const refreshFiles = useCallback(() => setFilesVersion((v) => v + 1), [])
  const handleEditorReady = useCallback((view: EditorView) => { editorViewRef.current = view }, [])
  const openSwitcher = useCallback(() => setSwitcherOpen(true), [])
  const closeSwitcher = useCallback(() => setSwitcherOpen(false), [])

  // Atalhos globais de navegação entre arquivos (Ctrl+P, Ctrl+Tab).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        setSwitcherOpen((o) => !o)
        return
      }
      if (e.key === 'Tab') {
        const files = openFilesRef.current
        if (!files.length) return
        e.preventDefault()
        const idx = files.indexOf(activeFileRef.current ?? '')
        const next = e.shiftKey
          ? (idx <= 0 ? files.length - 1 : idx - 1)
          : (idx + 1) % files.length
        setActiveFile(files[next])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Atualização externa de arquivos (ex.: tutor "Separar para mim"):
  // descarta saves pendentes do arquivo e atualiza o conteúdo em memória.
  const handleExternalWrite = useCallback((path: string, content: string) => {
    if (saveTimers.current[path]) {
      window.clearTimeout(saveTimers.current[path])
      delete saveTimers.current[path]
    }
    setContents((prev) => ({ ...prev, [path]: content }))
  }, [])

  const jumpToDiagnostic = useCallback((d: Diagnostic) => {
    const view = editorViewRef.current
    if (!view) return
    const to = Math.max(d.to, d.from)
    view.dispatch({ selection: { anchor: d.from, head: to }, scrollIntoView: true })
    view.focus()
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
      setLangs((prev) => {
        if (prev[path]) return prev
        loadLanguageExtension(path).then((ext) => setLangs((cur) => ({ ...cur, [path]: ext })))
        return prev
      })
    }
    setActiveFile(path)
  }, [project.id, openFiles])

  const handleSelectFile = useCallback((path: string | null) => {
    if (path) openFile(path)
  }, [openFile])

  const closeTab = (path: string) => {
    setOpenFiles((prev) => prev.filter((p) => p !== path))
    setContents((prev) => { const c = { ...prev }; delete c[path]; return c })
    setActiveFile((prev) => {
      if (prev !== path) return prev
      const remaining = openFiles.filter((p) => p !== path)
      return remaining.length ? remaining[remaining.length - 1] : null
    })
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

  const workspaceProps: WorkspaceProps = {
    project, openFiles, activeFile, contents, langs,
    onSelectFile: handleSelectFile, onCloseTab: closeTab, onActivate: setActiveFile,
    onChange: handleChange, onSave: handleSave, onConsole: addConsole,
    onDiagnostics: (d: Diagnostic[]) => setDiagnostics(d),
    onEditorReady: handleEditorReady, onExternalWrite: handleExternalWrite,
    onOpenSwitcher: openSwitcher,
    refreshFiles, filesVersion,
  }
  return (
    <div class={`pipa-code-app mode-${prefs.mode}`}>
      <header class="topbar">
        <strong>Pipa Code</strong>
        <span class="project-name">{project.name}</span>
        <nav class="topbar-actions">
          <button onClick={() => (prefs.mode === 'desktop' ? exitDesktop() : enterDesktop())} title={prefs.mode === 'desktop' ? 'Sair do Modo Desktop' : 'Modo Desktop'}>
            {prefs.mode === 'desktop' ? <IconSmartphone size={16} /> : <IconMonitor size={16} />}
            <span class="btn-label">{prefs.mode === 'desktop' ? 'Sair do Modo Desktop' : 'Modo Desktop'}</span>
          </button>
          {prefs.mode === 'desktop' && (
            <>
              <button class={prefs.desktopPanels.explorer ? 'active' : ''} onClick={() => togglePanel('explorer')} title="Explorador"><IconFolder size={16} /><span class="btn-label">Explorador</span></button>
              <button class={prefs.desktopPanels.preview ? 'active' : ''} onClick={() => togglePanel('preview')} title="Preview"><IconPlay size={16} /><span class="btn-label">Preview</span></button>
              <button class={prefs.desktopPanels.bottom ? 'active' : ''} onClick={() => togglePanel('bottom')} title="Painel"><IconPanel size={16} /><span class="btn-label">Painel</span></button>
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
          <button onClick={onClose} title="Fechar projeto"><IconX size={16} /><span class="btn-label">Fechar projeto</span></button>
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
          <DesktopLayout prefs={prefs} togglePanel={togglePanel} {...workspaceProps}
            consoleEntries={consoleEntries} setConsoleEntries={setConsoleEntries}
            diagnostics={diagnostics} onJump={jumpToDiagnostic} />
        ) : (
          <TouchLayout {...workspaceProps} />
        )}
      </main>

      <footer class="statusbar">
        <span class="status-extra">Modo: {prefs.mode === 'desktop' ? 'Desktop' : 'Toque'}</span>
        <span class="status-extra">Zoom: {Math.round(prefs.zoom * 100)}%</span>
        <span class="status-extra">Tema: {prefs.theme}</span>
        {activeFile && <span>Arquivo: {activeFile}</span>}
        <span>Problemas: {diagnostics.filter((d) => d.severity === 'error').length} erros, {diagnostics.filter((d) => d.severity === 'warning').length} avisos</span>
      </footer>

      {switcherOpen && (
        <QuickSwitcher
          files={Object.keys(contents).sort()}
          activePath={activeFile}
          onSelect={(p) => openFile(p)}
          onClose={closeSwitcher}
        />
      )}
    </div>
  )
}

// Colapso tipo sanfona: um wrapper com overflow:hidden anima a largura/altura até 0,
// enquanto o painel interno mantém largura/altura FIXA (não reflui, não sobrepõe).
function DesktopLayout(props: WorkspaceProps & {
  prefs: Prefs
  togglePanel: (key: keyof Prefs['desktopPanels']) => void
  consoleEntries: ConsoleEntry[]
  setConsoleEntries: (updater: (prev: ConsoleEntry[]) => ConsoleEntry[]) => void
  diagnostics: Diagnostic[]
  onJump: (d: Diagnostic) => void
}) {
  const { prefs, togglePanel, project, openFiles, activeFile, contents, langs, onSelectFile, onCloseTab, onActivate, onChange, onSave, onConsole, onDiagnostics, onEditorReady, onExternalWrite, onOpenSwitcher, refreshFiles, filesVersion, consoleEntries, setConsoleEntries, diagnostics, onJump } = props
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

  const dragY = (initial: number) => (e: MouseEvent) => {
    e.preventDefault()
    const start = e.clientY
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientY - start
      // Arrastar para cima aumenta o painel, para baixo diminui.
      setBottomH(Math.min(400, Math.max(100, initial - delta)))
    }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div class="desktop-layout" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Linha superior: explorador + editor + preview */}
      <div style={{ display: 'flex', flexDirection: 'row', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Explorador */}
        <div class="col-wrap" style={{ width: prefs.desktopPanels.explorer ? explorerW + 'px' : '0px' }}>
          <aside class="panel explorer" style={{ width: explorerW + 'px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <header class="panel-header">
              EXPLORADOR
              <button class="panel-close" onClick={() => togglePanel('explorer')} aria-label="Recolher explorador" title="Recolher">−</button>
            </header>
            <div class="panel-body">
              <Explorer project={project} selectedFile={activeFile} onSelectFile={onSelectFile} refreshToken={filesVersion} />
            </div>
          </aside>
        </div>
        {prefs.desktopPanels.explorer && (
          <div class="resizer-v" onMouseDown={dragX(setExplorerW, 160, 420, false, explorerW)} />
        )}

        {/* Editor */}
        <section class="editor-area" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div class="tabs">
            {openFiles.length === 0 && <span class="muted">Nenhum arquivo aberto</span>}
            {openFiles.map((p) => (
              <button key={p} class={`tab ${activeFile === p ? 'active' : ''}`} onClick={() => onActivate(p)}>
                {p.split('/').pop()}
                <span class="tab-close" onClick={(e) => { e.stopPropagation(); onCloseTab(p) }}>×</span>
              </button>
            ))}
          </div>
          <div class="editor-host">
            {activeFile ? (
              <Editor value={contents[activeFile] ?? ''} language={langs[activeFile]} languageId={languageFromPath(activeFile)} onChange={(v: string) => onChange(activeFile, v)} onSave={() => onSave(activeFile)} onDiagnostics={onDiagnostics} onReady={onEditorReady} />
            ) : (
              <div class="editor-placeholder">
                <button onClick={onOpenSwitcher}>Escolher arquivo…</button>
              </div>
            )}
          </div>
        </section>

        {/* Preview */}
        {prefs.desktopPanels.preview && (
          <div class="resizer-v" onMouseDown={dragX(setPreviewW, 200, 520, true, previewW)} />
        )}
        <div class="col-wrap" style={{ width: prefs.desktopPanels.preview ? previewW + 'px' : '0px' }}>
          <aside class="panel preview" style={{ width: previewW + 'px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <header class="panel-header">
              PREVIEW
              <button class="panel-close" onClick={() => togglePanel('preview')} aria-label="Recolher preview" title="Recolher">−</button>
            </header>
            <div class="panel-body preview-body">
              <Preview contents={contents} onConsole={onConsole} />
            </div>
          </aside>
        </div>
      </div>

      {/* Painel inferior */}
      <div style={{ height: prefs.desktopPanels.bottom ? bottomH + 'px' : '0px', overflow: 'hidden', transition: 'height .2s ease', flexShrink: 0, display: 'flex', flexDirection: 'column', borderTop: prefs.desktopPanels.bottom ? '1px solid var(--border)' : 'none' }}>
        {prefs.desktopPanels.bottom && (
          <>
            <div class="resizer-h" style={{ height: '6px', cursor: 'row-resize', flexShrink: 0 }} onMouseDown={dragY(bottomH)} />
            <div class="bottom-panel" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <header class="panel-header">
                PAINEL
                <button class="panel-close" onClick={() => togglePanel('bottom')} aria-label="Recolher painel" title="Recolher">−</button>
              </header>
              <div class="panel-body" style={{ flex: 1, overflow: 'auto' }}>
                <BottomPanel consoleEntries={consoleEntries} setConsoleEntries={setConsoleEntries} diagnostics={diagnostics} activeFile={activeFile} contents={contents} project={project} refreshFiles={refreshFiles} onExternalWrite={onExternalWrite} onJump={onJump} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Teclas extras da barra de símbolos por linguagem (inseridas no cursor).
export const EXTRA_KEYS: Record<string, string[]> = {
  html: ['<div>', '<p>', '<!--  -->'],
  css: ['display:', 'color:', 'margin:'],
  javascript: ['console.log(', 'function ', '=>'],
  typescript: ['console.log(', 'function ', '=>'],
  python: ['print(', 'def ', 'for '],
}

function TouchLayout(props: WorkspaceProps) {
  const { project, openFiles, activeFile, contents, langs, onSelectFile, onCloseTab, onActivate, onChange, onSave, onConsole, onDiagnostics, onEditorReady, onExternalWrite, onOpenSwitcher, refreshFiles, filesVersion } = props
  const [tab, setTab] = useState<'files' | 'code' | 'result' | 'tutor'>('code')
  const editorViewRef = useRef<EditorView | null>(null)
  // Gestos de troca rápida na fileira de abas (fling horizontal).
  const swipeStart = useRef<{ x: number; t: number } | null>(null)

  // Teclas extras conforme a linguagem do arquivo ativo.
  const langId = activeFile ? languageFromPath(activeFile) : ''
  const extraKeys = EXTRA_KEYS[langId] ?? []

  const cycleTab = (dir: 1 | -1) => {
    if (!openFiles.length) return
    const idx = openFiles.indexOf(activeFile ?? '')
    const next = dir === 1
      ? (idx + 1) % openFiles.length
      : idx <= 0 ? openFiles.length - 1 : idx - 1
    onActivate(openFiles[next])
  }

  const onTabsPointerDown = (e: PointerEvent) => { swipeStart.current = { x: e.clientX, t: Date.now() } }
  const onTabsPointerUp = (e: PointerEvent) => {
    const start = swipeStart.current
    swipeStart.current = null
    if (!start) return
    const dx = e.clientX - start.x
    const dt = Date.now() - start.t
    // Fling rápido horizontal (sem atrapalhar o scroll da fileira).
    if (dt < 400 && Math.abs(dx) > 80) {
      cycleTab(dx < 0 ? 1 : -1)
    }
  }

  const insertText = (text: string) => {
    const view = editorViewRef.current
    if (!view) return
    const { from, to } = view.state.selection.main
    view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length }, scrollIntoView: true })
    view.focus()
  }

  const insertPair = (pair: string) => {
    const view = editorViewRef.current
    if (!view) return
    const { from, to } = view.state.selection.main
    const mid = from + pair.length / 2
    view.dispatch({ changes: { from, to, insert: pair }, selection: { anchor: mid }, scrollIntoView: true })
    view.focus()
  }

  const handleUndo = () => { const v = editorViewRef.current; if (v) undo(v) }
  const handleRedo = () => { const v = editorViewRef.current; if (v) redo(v) }
  const handleEditorReady = (view: EditorView) => { editorViewRef.current = view; onEditorReady(view) }

  return (
    <div class="touch-layout">
      <div class="touch-content">
        {tab === 'files' && <Explorer project={project} selectedFile={activeFile} onSelectFile={onSelectFile} refreshToken={filesVersion} />}
        {tab === 'code' && (
          <div class="editor-host">
            {openFiles.length > 0 && (
              <div class="tabs" onPointerDown={onTabsPointerDown} onPointerUp={onTabsPointerUp} onPointerCancel={() => { swipeStart.current = null }}>
                <button class="tab-switcher-btn" onClick={onOpenSwitcher} title="Abrir arquivo (rápido)" aria-label="Abrir arquivo rápido"><IconFolderOpen size={16} /></button>
                <button class="tab-switcher-btn" onClick={() => setTab('result')} title="Ver resultado (preview)" aria-label="Ver resultado"><IconPlay size={16} /></button>
                {openFiles.map((p) => (
                  <button key={p} class={`tab ${activeFile === p ? 'active' : ''}`} onClick={() => onActivate(p)}>
                    {p.split('/').pop()}
                    <span class="tab-close" onClick={(e) => { e.stopPropagation(); onCloseTab(p) }}>×</span>
                  </button>
                ))}
              </div>
            )}
            {activeFile ? (
              <Editor value={contents[activeFile] ?? ''} language={langs[activeFile]} languageId={languageFromPath(activeFile)} onChange={(v: string) => onChange(activeFile, v)} onSave={() => onSave(activeFile)} onDiagnostics={onDiagnostics} onReady={handleEditorReady} />
            ) : (
              <div class="editor-placeholder">
                <button onClick={onOpenSwitcher}>Escolher arquivo…</button>
              </div>
            )}
          </div>
        )}
        {tab === 'result' && <div class="panel-body"><Preview contents={contents} onConsole={onConsole} /></div>}
        {tab === 'tutor' && <div class="panel-body"><TutorPanel activeFile={activeFile} content={activeFile ? (contents[activeFile] ?? '') : ''} project={project} onRefreshFiles={refreshFiles} onExternalWrite={onExternalWrite} /></div>}
      </div>
      <nav class="touch-nav">
        <button class={tab === 'files' ? 'active' : ''} onClick={() => setTab('files')}><IconFolder size={18} />Arquivos</button>
        <button class={tab === 'code' ? 'active' : ''} onClick={() => setTab('code')}><IconCode size={18} />Código</button>
        <button class={tab === 'result' ? 'active' : ''} onClick={() => setTab('result')}><IconPlay size={18} />Resultado</button>
        <button class={tab === 'tutor' ? 'active' : ''} onClick={() => setTab('tutor')}><IconBook size={18} />Tutor</button>
      </nav>
      <div class="symbol-bar">
        <button onClick={() => insertText('\t')} title="Tab">Tab</button>
        <button onClick={() => insertPair('{}')} title="Chaves">{'{}'}</button>
        <button onClick={() => insertPair('()')} title="Parênteses">{'()'}</button>
        <button onClick={() => insertPair('[]')} title="Colchetes">{'[]'}</button>
        <button onClick={() => insertPair('<>')} title="Menor/maior">{'<>'}</button>
        <button onClick={() => insertText(';')} title="Ponto e vírgula">;</button>
        <button onClick={() => insertText(':')} title="Dois pontos">:</button>
        <button onClick={() => insertPair('""')} title="Aspas duplas">"</button>
        <button onClick={() => insertPair("''")} title="Aspas simples">'</button>
        <button onClick={() => insertText('=')} title="Igual">=</button>
        <button onClick={() => insertText('/')} title="Barra">/</button>
        <button onClick={() => insertText('#')} title="Cerquilha">#</button>
        {extraKeys.map((k) => (
          <button key={k} onClick={() => insertText(k)} title={`Inserir ${k}`}>{k}</button>
        ))}
        <button onClick={() => { const v = editorViewRef.current; if (v) pasteIntoView(v) }} title="Colar da área de transferência">Colar</button>
        <button onClick={handleUndo} title="Desfazer">Undo</button>
        <button onClick={handleRedo} title="Refazer">Redo</button>
      </div>
    </div>
  )
}
