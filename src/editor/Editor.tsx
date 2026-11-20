import { useEffect, useRef, useState } from 'preact/hooks'
import { EditorView, basicSetup } from 'codemirror'
import { keymap } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import type { ViewUpdate } from '@codemirror/view'
import { indentWithTab, indentMore, indentLess } from '@codemirror/commands'
import { createLinter, type Diagnostic } from './diagnostics'
import { createCompletionExtension } from '../autocomplete/completion'

interface EditorProps {
  value: string
  /** Extensão de linguagem do CodeMirror (pode chegar depois, via lazy load). */
  language: any
  languageId: string
  onChange: (v: string) => void
  onSave?: () => void
  onDiagnostics?: (diags: Diagnostic[]) => void
  /** Chamado uma vez quando o EditorView é criado (permite ações externas, ex.: pular para um problema). */
  onReady?: (view: EditorView) => void
}

// Copia texto para a área de transferência com fallback para navegadores/contextos
// sem a Clipboard API (comum em webviews e no modo arquivo único).
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // tenta fallback abaixo
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;top:-1000px;left:-1000px;opacity:0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch {
    return false
  }
}

// Cola o texto da área de transferência no editor. Se a Clipboard API não estiver
// disponível/permitida, tenta o caminho nativo e avisa via onError.
export async function pasteIntoView(view: EditorView, onError?: (msg: string) => void): Promise<void> {
  try {
    if (navigator.clipboard?.readText) {
      const t = await navigator.clipboard.readText()
      const { from, to } = view.state.selection.main
      view.dispatch({ changes: { from, to, insert: t }, selection: { anchor: from + t.length }, scrollIntoView: true })
      view.focus()
      return
    }
  } catch {
    // sem permissão: tenta o caminho nativo
  }
  view.focus()
  let ok = false
  try { ok = document.execCommand('paste') } catch { /* ignore */ }
  if (!ok) onError?.('Use colar do teclado (long-press)')
}

export function Editor({ value, language, languageId, onChange, onSave, onDiagnostics, onReady }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onSaveRef = useRef(onSave)
  const onReadyRef = useRef(onReady)
  const onDiagnosticsRef = useRef(onDiagnostics)
  const languageIdRef = useRef(languageId)
  const languageCompartment = useRef(new Compartment()).current
  const [hasSelection, setHasSelection] = useState(false)
  const [feedback, setFeedback] = useState('')
  const feedbackTimer = useRef<number | null>(null)
  onChangeRef.current = onChange
  onSaveRef.current = onSave
  onReadyRef.current = onReady
  onDiagnosticsRef.current = onDiagnostics
  languageIdRef.current = languageId

  const showFeedback = (msg: string) => {
    setFeedback(msg)
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current)
    feedbackTimer.current = window.setTimeout(() => setFeedback(''), 1600)
  }

  const getView = () => viewRef.current

  // Ações da barra de seleção (leem o estado ao vivo do editor).
  const handleCopy = async () => {
    const view = getView()
    if (!view) return
    const { from, to } = view.state.selection.main
    const text = view.state.sliceDoc(from, to)
    if (!text) return
    const ok = await copyText(text)
    showFeedback(ok ? 'Copiado!' : 'Copiar não disponível')
  }

  const handleCut = async () => {
    const view = getView()
    if (!view) return
    const { from, to } = view.state.selection.main
    const text = view.state.sliceDoc(from, to)
    // Apaga imediatamente (sem esperar o clipboard) e copia em segundo plano.
    view.dispatch({ changes: { from, to, insert: '' }, selection: { anchor: from } })
    if (text) {
      const ok = await copyText(text)
      showFeedback(ok ? 'Recortado!' : '')
    }
  }

  const handlePaste = async () => {
    const view = getView()
    if (!view) return
    await pasteIntoView(view, (m) => showFeedback(m))
  }

  const handleSelectAll = () => {
    const view = getView()
    if (!view) return
    view.dispatch({ selection: { anchor: 0, head: view.state.doc.length }, scrollIntoView: true })
  }

  const handleIndent = () => { const v = getView(); if (v) indentMore(v) }
  const handleUnindent = () => { const v = getView(); if (v) indentLess(v) }
  const handleClearSelection = () => {
    const view = getView()
    if (!view) return
    view.dispatch({ selection: { anchor: view.state.selection.main.head } })
  }

  // Cria o editor uma vez. Todas as extensões vivem no mesmo estado;
  // a linguagem é trocada via reconfigure do compartimento (sem perder linter/autocomplete).
  useEffect(() => {
    if (!containerRef.current) return
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        languageCompartment.of(language ?? []),
        createLinter(() => languageIdRef.current, (d) => onDiagnosticsRef.current?.(d)),
        createCompletionExtension(() => languageIdRef.current, () => {
          const doc = viewRef.current?.state.doc.toString() ?? ''
          const ids = new Set<string>()
          const re = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g
          let m: RegExpExecArray | null
          while ((m = re.exec(doc))) ids.add(m[0])
          return Array.from(ids).slice(0, 50)
        }),
        EditorView.updateListener.of((u: ViewUpdate) => {
          if (u.docChanged) onChangeRef.current(u.state.doc.toString())
          if (u.selectionSet || u.docChanged) {
            const want = !u.state.selection.main.empty
            setHasSelection((p) => (p === want ? p : want))
          }
        }),
        EditorView.domEventHandlers({
          keydown: (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
              e.preventDefault()
              onSaveRef.current?.()
              return true
            }
            return false
          },
        }),
      ],
    })
    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view
    onReadyRef.current?.(view)
    return () => {
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current)
      view.destroy(); viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Atualiza documento quando value muda externamente (troca de arquivo).
  // A seleção volta para o início, para não manter seleção obsoleta entre arquivos.
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value }, selection: { anchor: 0 } })
    }
  }, [value])

  // Troca a extensão de linguagem sem recriar o estado (preserva documento, linter e autocomplete).
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({ effects: languageCompartment.reconfigure(language ?? []) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language])

  return (
    <div class="editor-wrap">
      <div class="cm-host" ref={containerRef} />
      {hasSelection && (
        <div class="selection-toolbar" role="toolbar" aria-label="Ações de seleção">
          <button onClick={handleCopy} onMouseDown={(e) => e.preventDefault()} title="Copiar seleção">Copiar</button>
          <button onClick={handleCut} onMouseDown={(e) => e.preventDefault()} title="Recortar seleção">Recortar</button>
          <button onClick={handlePaste} onMouseDown={(e) => e.preventDefault()} title="Colar">Colar</button>
          <button onClick={handleSelectAll} onMouseDown={(e) => e.preventDefault()} title="Selecionar tudo">Tudo</button>
          <button onClick={handleIndent} onMouseDown={(e) => e.preventDefault()} title="Indentar">⇥→</button>
          <button onClick={handleUnindent} onMouseDown={(e) => e.preventDefault()} title="Desindentar">⇤←</button>
          <button onClick={handleClearSelection} onMouseDown={(e) => e.preventDefault()} title="Limpar seleção" aria-label="Limpar seleção">×</button>
          {feedback && <span class="sel-feedback" role="status">{feedback}</span>}
        </div>
      )}
    </div>
  )
}
