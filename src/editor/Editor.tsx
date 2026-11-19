import { useEffect, useRef } from 'preact/hooks'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { createLinter } from './diagnostics'
import { createCompletionExtension } from '../autocomplete/completion'

interface EditorProps {
  value: string
  language: any
  languageId: string
  onChange: (v: string) => void
  onSave?: () => void
  onDiagnostics?: (diags: any[]) => void
}

export function Editor({ value, language, languageId, onChange, onSave, onDiagnostics }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onSaveRef = useRef(onSave)
  const onDiagnosticsRef = useRef(onDiagnostics)
  onChangeRef.current = onChange
  onSaveRef.current = onSave
  onDiagnosticsRef.current = onDiagnostics

  // Cria o editor uma vez
  useEffect(() => {
    if (!containerRef.current) return
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        language ? language : [],
        createLinter(languageId, (d) => onDiagnosticsRef.current?.(d)),
        createCompletionExtension(languageId, () => {
          const code = containerRef.current?.querySelector('.cm-content')?.textContent ?? ''
          const ids = new Set<string>()
          const re = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g
          let m: RegExpExecArray | null
          while ((m = re.exec(code))) ids.add(m[0])
          return Array.from(ids).slice(0, 50)
        }),
        EditorView.updateListener.of((u) => {
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
    return () => { view.destroy(); viewRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Atualiza documento quando value muda externamente (troca de arquivo)
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
    }
  }, [value])

  // Atualiza extensão de linguagem
  useEffect(() => {
    const view = viewRef.current
    if (!view || !language) return
    // Recompõe estado preservando documento
    const doc = view.state.doc.toString()
    const state = EditorState.create({
      doc,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        language,
        EditorView.updateListener.of((u) => {
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
    view.setState(state)
  }, [language])

  return <div class="cm-host" ref={containerRef} />
}