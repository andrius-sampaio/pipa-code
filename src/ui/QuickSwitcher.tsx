import { useState, useEffect, useRef } from 'preact/hooks'

interface QuickSwitcherProps {
  files: string[]
  activePath: string | null
  onSelect: (path: string) => void
  onClose: () => void
}

// Seletor rápido de arquivos (estilo Ctrl+P), aberto como overlay.
// Filtra por nome/caminho e navega com Enter, setas e Escape.
export function QuickSwitcher({ files, activePath, onSelect, onClose }: QuickSwitcherProps) {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = files
    .filter((f) => f.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => {
      // arquivo ativo primeiro, depois ordem alfabética
      if (a === activePath) return -1
      if (b === activePath) return 1
      return a.localeCompare(b)
    })

  // Mantém o índice dentro dos limites
  const safeIndex = Math.min(index, Math.max(filtered.length - 1, 0))

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const choose = (path: string) => {
    onSelect(path)
    onClose()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[safeIndex]) choose(filtered[safeIndex]) }
  }

  return (
    <div class="quick-switcher-backdrop" onClick={onClose}>
      <div class="quick-switcher" role="dialog" aria-label="Abrir arquivo" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={query}
          onInput={(e) => { setQuery((e.target as HTMLInputElement).value); setIndex(0) }}
          onKeyDown={onKeyDown}
          placeholder="Nome do arquivo…"
          aria-label="Filtrar arquivos"
        />
        <div class="quick-switcher-list">
          {filtered.length === 0 && <span class="muted">Nenhum arquivo encontrado.</span>}
          {filtered.map((f, i) => (
            <button
              key={f}
              class={`qs-item ${i === safeIndex ? 'active' : ''}`}
              onClick={() => choose(f)}
              onMouseEnter={() => setIndex(i)}
            >
              <span class="qs-name">{f.split('/').pop()}</span>
              <span class="muted qs-path">{f.includes('/') ? f.substring(0, f.lastIndexOf('/')) : ''}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
