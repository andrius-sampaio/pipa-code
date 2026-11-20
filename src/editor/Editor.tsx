import { useEffect, useRef } from 'preact/hooks'
import { EditorView, basicSetup } from 'codemirror'
import { keymap } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import type { ViewUpdate } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
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

export function Editor({ value, language, languageId, onChange, onSave, onDiagnostics, onReady }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onSaveRef = useRef(onSave)
  const onReadyRef = useRef(onReady)
  const onDiagnosticsRef = useRef(onDiagnostics)
  const languageIdRef = useRef(languageId)
  const languageCompartment = useRef(new Compartment()).current
  onChangeRef.current = onChange
  onSaveRef.current = onSave
  onReadyRef.current = onReady
  onDiagnosticsRef.current = onDiagnostics
  languageIdRef.current = languageId

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
    return () => { view.destroy(); viewRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Atualiza documento quando value muda externamente (troca de arquivo).
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
    }
  }, [value])

  // Troca a extensão de linguagem sem recriar o estado (preserva documento, linter e autocomplete).
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({ effects: languageCompartment.reconfigure(language ?? []) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language])

  return <div class="cm-host" ref={containerRef} />
}
