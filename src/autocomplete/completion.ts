import { autocompletion, type CompletionContext, type CompletionResult, type Completion } from '@codemirror/autocomplete'
import { KEYWORDS, SNIPPETS } from './keywords'

// `language` pode ser string fixa ou getter (acompanha trocas de linguagem sem recriar a extensão).
export function createCompletionExtension(language: string | (() => string), getSymbols: () => string[]) {
  const source = (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\w*/)
    if (!word || (word.from === word.to && !context.explicit)) return null
    const languageId = typeof language === 'function' ? language() : language
    const opts: Completion[] = []
    const kws = KEYWORDS[languageId] ?? []
    for (const k of kws) opts.push({ label: k, type: 'keyword' })
    const snippets = SNIPPETS[languageId] ?? []
    for (const s of snippets) opts.push({ label: s.label, type: 'snippet', apply: s.snippet, detail: 'snippet' })
    const symbols = getSymbols()
    for (const s of symbols) opts.push({ label: s, type: 'variable' })
    return { from: word.from, options: opts }
  }
  return autocompletion({ override: [source] })
}