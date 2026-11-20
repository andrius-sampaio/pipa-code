import { linter, type Diagnostic as CMDiagnostic } from '@codemirror/lint'
import { syntaxTree } from '@codemirror/language'
import { extraDiagnostics } from '../tutor/rules'

export interface Diagnostic {
  from: number
  to: number
  severity: 'error' | 'warning' | 'info'
  message: string
  source?: string
  line?: number
  col?: number
}

export interface DiagnosticsReporter {
  (diags: Diagnostic[]): void
}

// Cria um linter do CodeMirror que combina erros do parser Lezer + regras extras.
// `language` pode ser uma string fixa ou um getter (para acompanhar trocas de arquivo/linguagem).
export function createLinter(language: string | (() => string), reporter?: DiagnosticsReporter) {
  return linter((view) => {
    const state = view.state
    const diags: Diagnostic[] = []
    const languageId = typeof language === 'function' ? language() : language

    // 1. Erros de sintaxe do parser Lezer
    try {
      syntaxTree(state).iterate({
        enter(node) {
          if (node.type.isError) {
            diags.push({ from: node.from, to: Math.max(node.to, node.from + 1), severity: 'error', message: 'Erro de sintaxe.', source: 'sintaxe' })
          }
        },
      })
    } catch {
      // ignore
    }

    // 2. Regras extras
    const code = state.doc.toString()
    const extras = extraDiagnostics(languageId, code)
    for (const d of extras) diags.push(d)

    // calcular linha/coluna
    for (const d of diags) {
      try {
        const line = state.doc.lineAt(d.from)
        d.line = line.number
        d.col = d.from - line.from + 1
      } catch {
        d.line = 1
        d.col = 1
      }
    }

    reporter?.(diags)

    const cm: CMDiagnostic[] = diags.map((d) => ({
      from: d.from,
      to: d.to,
      severity: d.severity === 'info' ? 'info' : d.severity,
      message: d.message,
    }))
    return cm
  }, { delay: 500 })
}