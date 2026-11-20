// Registro de linguagens suportadas (destaque de sintaxe + tutor básico).
// Cada linguagem é carregada sob demanda (lazy) quando um arquivo é aberto.

export type LanguageId =
  | 'html' | 'css' | 'javascript' | 'typescript' | 'json' | 'markdown' | 'python'
  | 'java' | 'c' | 'cpp' | 'csharp' | 'php' | 'sql' | 'go' | 'rust' | 'kotlin'
  | 'swift' | 'ruby' | 'lua' | 'shell' | 'xml' | 'yaml'

export interface LanguageInfo {
  id: LanguageId
  extensions: string[]
  load: () => Promise<any> // retorna Extension do CodeMirror
}

const byExt: Record<string, LanguageId> = {
  html: 'html', htm: 'html',
  css: 'css',
  js: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  json: 'json',
  md: 'markdown', markdown: 'markdown',
  py: 'python',
  java: 'java',
  c: 'c', h: 'c',
  cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  sql: 'sql',
  go: 'go',
  rs: 'rust',
  kt: 'kotlin', kts: 'kotlin',
  swift: 'swift',
  rb: 'ruby',
  lua: 'lua',
  sh: 'shell', bash: 'shell',
  xml: 'xml',
  yml: 'yaml', yaml: 'yaml',
}

export function languageFromPath(path: string): LanguageId {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  return byExt[ext] ?? 'javascript'
}

// Lazy loaders. Retornam a extensão de linguagem do CodeMirror.
export const LANGUAGES: LanguageInfo[] = [
  { id: 'html', extensions: ['html', 'htm'], load: async () => (await import('@codemirror/lang-html')).html() },
  { id: 'css', extensions: ['css'], load: async () => (await import('@codemirror/lang-css')).css() },
  { id: 'javascript', extensions: ['js', 'mjs', 'cjs'], load: async () => (await import('@codemirror/lang-javascript')).javascript() },
  { id: 'typescript', extensions: ['ts', 'tsx'], load: async () => (await import('@codemirror/lang-javascript')).javascript({ typescript: true }) },
  { id: 'json', extensions: ['json'], load: async () => (await import('@codemirror/lang-json')).json() },
  { id: 'markdown', extensions: ['md', 'markdown'], load: async () => (await import('@codemirror/lang-markdown')).markdown() },
  { id: 'python', extensions: ['py'], load: async () => (await import('@codemirror/lang-python')).python() },
  // Demais: legacy modes (leves, sem parser Lezer completo) carregados sob demanda
  { id: 'java', extensions: ['java'], load: async () => legacy('java') },
  { id: 'c', extensions: ['c', 'h'], load: async () => legacy('c') },
  { id: 'cpp', extensions: ['cpp', 'cc', 'cxx', 'hpp'], load: async () => legacy('cpp') },
  { id: 'csharp', extensions: ['cs'], load: async () => legacy('csharp') },
  { id: 'php', extensions: ['php'], load: async () => [] },
  { id: 'sql', extensions: ['sql'], load: async () => legacy('sql') },
  { id: 'go', extensions: ['go'], load: async () => legacy('go') },
  { id: 'rust', extensions: ['rs'], load: async () => legacy('rust') },
  { id: 'kotlin', extensions: ['kt', 'kts'], load: async () => legacy('kotlin') },
  { id: 'swift', extensions: ['swift'], load: async () => legacy('swift') },
  { id: 'ruby', extensions: ['rb'], load: async () => legacy('ruby') },
  { id: 'lua', extensions: ['lua'], load: async () => legacy('lua') },
  { id: 'shell', extensions: ['sh', 'bash'], load: async () => legacy('shell') },
  { id: 'xml', extensions: ['xml'], load: async () => legacy('xml') },
  { id: 'yaml', extensions: ['yml', 'yaml'], load: async () => legacy('yaml') },
]

async function legacy(name: string): Promise<any> {
  try {
    const mod = await import('./legacyModes')
    return mod.LEGACY_MODES[name] ?? []
  } catch {
    return []
  }
}

export async function loadLanguageExtension(path: string): Promise<any> {
  const id = languageFromPath(path)
  const info = LANGUAGES.find((l) => l.id === id)
  if (!info) return []
  try {
    return await info.load()
  } catch {
    return []
  }
}

export function languageLabel(path: string): string {
  return languageFromPath(path)
}