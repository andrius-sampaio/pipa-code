// Preferências do aluno (salvas no localStorage). Chaves simples para a Fase 1.

const KEY = 'pipa-code:prefs'

export type Theme =
  | 'dark' | 'light' | 'high-contrast'
  | 'aura' | 'aurora' | 'astral' | 'omarchy-851' | 'aetheria'
  | 'ayaka' | 'black-arch' | 'bright-future' | 'all-hallows-eve'
export type Mode = 'desktop' | 'touch'

export interface Prefs {
  theme: Theme
  mode: Mode
  zoom: number // 0.8 .. 1.4
  desktopPanels: { explorer: boolean; preview: boolean; bottom: boolean }
}

const DEFAULTS: Prefs = {
  theme: 'dark',
  mode: 'touch',
  zoom: 1,
  desktopPanels: { explorer: true, preview: true, bottom: true },
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<Prefs>
    return { ...DEFAULTS, ...parsed, desktopPanels: { ...DEFAULTS.desktopPanels, ...(parsed.desktopPanels ?? {}) } }
  } catch {
    return { ...DEFAULTS }
  }
}

export function savePrefs(p: Prefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // ignore (storage indisponível)
  }
}