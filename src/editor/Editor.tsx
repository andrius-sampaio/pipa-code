import { useEffect, useRef } from 'preact/hooks'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'

interface EditorProps {
  value: string
  language: any
  onChange: (v: string) => void
  onSave?: () => void
}

export function Editor({ value, language, onChange, onSave }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onSaveRef = useRef(onSave)
  onChangeRef.current = onChange
  onSaveRef.current = onSave

  // Cria o editor uma vez
  useEffect(() => {
    if (!containerRef.current) return
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        language ? language : [],
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