import type { Diagnostic } from '../../editor/diagnostics'

// Reexporta tipo para conveniência
export type { Diagnostic }

// Funções de regras extras por linguagem. Cada retorna Diag[] com offsets no documento.
export function extraDiagnostics(language: string, code: string): Diagnostic[] {
  const out: Diagnostic[] = []
  if (language === 'html') htmlRules(code, out)
  else if (language === 'css') cssRules(code, out)
  else if (language === 'javascript' || language === 'typescript') jsRules(code, out)
  else if (language === 'json') jsonRules(code, out)
  else if (language === 'python') pythonRules(code, out)
  return out
}

function add(out: Diagnostic[], from: number, to: number, severity: Diagnostic['severity'], message: string) {
  if (from < 0 || to < from) return
  out.push({ from, to: Math.max(to, from + 1), severity, message, source: 'regra' })
}

function htmlRules(code: string, out: Diagnostic[]) {
  if (!/<!DOCTYPE html>/i.test(code)) {
    add(out, 0, 1, 'warning', 'Falta <!DOCTYPE html> no início do documento.')
  }
  if (!/<html[^>]*lang=/i.test(code)) {
    const i = code.indexOf('<html')
    add(out, i >= 0 ? i : 0, i >= 0 ? i + 5 : 1, 'warning', 'A tag <html> deveria ter atributo lang (ex.: lang="pt-BR").')
  }
  if (!/<title>/i.test(code)) {
    add(out, 0, 1, 'warning', 'Falta a tag <title> dentro do <head>.')
  }
  // img sem alt
  const imgRe = /<img\b[^>]*>/gi
  let m: RegExpExecArray | null
  while ((m = imgRe.exec(code))) {
    if (!/\salt\s*=/.test(m[0])) {
      add(out, m.index, m.index + m[0].length, 'warning', 'A tag <img> deveria ter atributo alt (acessibilidade).')
    }
  }
  // tags obsoletas
  for (const tag of ['center', 'font', 'marquee', 'blink']) {
    const re = new RegExp(`<${tag}\\b`, 'gi')
    let mm: RegExpExecArray | null
    while ((mm = re.exec(code))) {
      add(out, mm.index, mm.index + tag.length + 1, 'warning', `A tag <${tag}> é obsoleta. Use CSS.`)
    }
  }
  // IDs duplicados
  const ids = new Map<string, number>()
  const idRe = /\bid\s*=\s*["']([^"']+)["']/gi
  let im: RegExpExecArray | null
  while ((im = idRe.exec(code))) {
    const id = im[1]
    if (ids.has(id)) {
      add(out, im.index, im.index + im[0].length, 'warning', `ID duplicado: "${id}".`)
    } else {
      ids.set(id, im.index)
    }
  }
}

function cssRules(code: string, out: Diagnostic[]) {
  // chaves balanceadas
  let depth = 0
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '{') depth++
    else if (code[i] === '}') depth--
    if (depth < 0) { add(out, i, i + 1, 'error', 'Chave de fechamento "}" sem abertura correspondente.'); depth = 0 }
  }
  if (depth > 0) add(out, code.length - 1, code.length, 'error', 'Falta fechar chave "}".')
  // ponto e vírgula: heurística em declarações (prop: valor sem ; antes de })
  // propriedade desconhecida (lista curta) - checar linhas "prop: valor"
  const known = new Set(['color','background','background-color','margin','padding','font-size','font-family','display','width','height','border','border-radius','text-align','line-height','max-width','gap','grid-template-columns','flex','flex-direction','justify-content','align-items'])
  const declRe = /^\s*([a-z-]+)\s*:/gm
  let dm: RegExpExecArray | null
  while ((dm = declRe.exec(code))) {
    const prop = dm[1]
    if (!known.has(prop)) {
      add(out, dm.index, dm.index + prop.length, 'info', `Propriedade "${prop}" pode ser desconhecida (lista curta).`)
    }
  }
}

function jsRules(code: string, out: Diagnostic[]) {
  // var
  const varRe = /\bvar\b/g
  let vm: RegExpExecArray | null
  while ((vm = varRe.exec(code))) {
    add(out, vm.index, vm.index + 3, 'warning', 'Uso de "var". Prefira "let" ou "const".')
  }
  // == (não ===)
  const eqRe = /[^=!]==[^=]/g
  let em: RegExpExecArray | null
  while ((em = eqRe.exec(code))) {
    add(out, em.index + 1, em.index + 3, 'warning', 'Use "===" em vez de "==" para evitar conversão de tipo.')
  }
  // console.log (info)
  const clRe = /console\.log/g
  let cm: RegExpExecArray | null
  while ((cm = clRe.exec(code))) {
    add(out, cm.index, cm.index + 11, 'info', 'console.log esquecido? Remova antes de entregar.')
  }
  // funções muito longas (> 40 linhas entre chaves) - heurística simples: não implementar profundamente
}

function jsonRules(code: string, out: Diagnostic[]) {
  try {
    JSON.parse(code)
  } catch (e: any) {
    const msg = e?.message ?? 'JSON inválido.'
    // tentar extrair posição
    const m = msg.match(/position\s+(\d+)/i)
    if (m) {
      const pos = parseInt(m[1], 10)
      add(out, pos, Math.min(pos + 1, code.length), 'error', 'JSON inválido: ' + msg)
    } else {
      add(out, 0, 1, 'error', 'JSON inválido: ' + msg)
    }
  }
}

function pythonRules(code: string, out: Diagnostic[]) {
  // mistura de tabs e espaços na indentação
  const lines = code.split('\n')
  let hasTab = false, hasSpace = false
  for (const line of lines) {
    if (/^\t/.test(line)) hasTab = true
    if (/^ +/.test(line)) hasSpace = true
  }
  if (hasTab && hasSpace) {
    add(out, 0, 1, 'warning', 'Mistura de tabs e espaços na indentação. Escolha um só.')
  }
  // : faltando em def/if/for/while
  const stmtRe = /^\s*(def|if|elif|else|for|while|try|except|with|class)\b.*[^:\s]\s*$/gm
  let sm: RegExpExecArray | null
  while ((sm = stmtRe.exec(code))) {
    add(out, sm.index + sm[0].length - 1, sm.index + sm[0].length, 'error', 'Falta ":" no final da linha.')
  }
}