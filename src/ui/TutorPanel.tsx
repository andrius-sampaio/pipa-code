import { useState, useEffect } from 'preact/hooks'
import { provedorRegras } from '../tutor/provedores/regras'
import { analisarEstrutura, separarHtml } from '../tutor/estrutura'
import { detectarNivel, rotuloNivel } from '../tutor/nivel'
import type { Dica } from '../tutor/provedores/regras'

export function TutorPanel({ activeFile, content, project, onRefreshFiles }: { activeFile: string | null; content: string; project: any; onRefreshFiles?: () => void }) {
  const [dicas, setDicas] = useState<Dica[]>([])
  const [nivel, setNivel] = useState<'iniciante' | 'intermediario' | 'avancado'>('iniciante')
  const [modo, setModo] = useState<'aprendizado' | 'produtividade'>('aprendizado')
  const [silenciado, setSilenciado] = useState(false)
  const [separando, setSeparando] = useState(false)

  useEffect(() => {
    try {
      const m = localStorage.getItem('minicode:modo') || 'aprendizado'
      setModo(m as any)
      setSilenciado(localStorage.getItem('minicode:tutor-silenciado') === '1')
    } catch {}
  }, [])

  useEffect(() => {
    if (silenciado || !activeFile || !content) { setDicas([]); return }
    let cancelled = false
    provedorRegras.analisar({ codigo: content, linguagem: activeFile.split('.').pop() === 'py' ? 'python' : activeFile.split('.').pop() === 'html' ? 'html' : activeFile.split('.').pop() === 'css' ? 'css' : activeFile.split('.').pop() === 'json' ? 'json' : 'javascript', arquivo: activeFile, nivel }).then((ds) => {
      if (cancelled) return
      // filtrar por modo aprendizado: limitar sugestões agressivas
      let filtered = ds
      if (modo === 'aprendizado') filtered = ds.filter((d) => d.severidade !== 'info' || d.id === 'nivel')
      setDicas(filtered)
    })
    return () => { cancelled = true }
  }, [activeFile, content, nivel, silenciado, modo])

  const sug = activeFile ? analisarEstrutura(activeFile, content) : null

  const handleSeparar = async () => {
    if (!activeFile) return
    if (!confirm('Separar este HTML em index.html, style.css e script.js?')) return
    setSeparando(true)
    try {
      await separarHtml(project.id, activeFile, content)
      onRefreshFiles?.()
    } finally {
      setSeparando(false)
    }
  }

  if (silenciado) {
    return (
      <div class="tutor-panel">
        <p class="muted">Tutor silenciado.</p>
        <button onClick={() => { setSilenciado(false); localStorage.setItem('minicode:tutor-silenciado', '0') }}>Reativar</button>
      </div>
    )
  }

  return (
    <div class="tutor-panel">
      <div class="tutor-header">
        <label>Nível de dicas:
          <select value={nivel} onChange={(e) => setNivel((e.target as HTMLSelectElement).value as any)}>
            <option value="iniciante">Básico</option>
            <option value="intermediario">Intermediário</option>
            <option value="avancado">Avançado</option>
          </select>
        </label>
        <label>Modo:
          <select value={modo} onChange={(e) => { const m = (e.target as HTMLSelectElement).value as any; setModo(m); localStorage.setItem('minicode:modo', m) }}>
            <option value="aprendizado">Aprendizado</option>
            <option value="produtividade">Produtividade</option>
          </select>
        </label>
        <button onClick={() => { setSilenciado(true); localStorage.setItem('minicode:tutor-silenciado', '1') }}>Silenciar tutor</button>
      </div>
      {nivel && <p class="muted">Nível detectado: {rotuloNivel(detectarNivel(content))}</p>}
      {sug && (
        <div class="tutor-card">
          <p>{sug.motivo}</p>
          <button onClick={handleSeparar} disabled={separando}>{separando ? 'Separando...' : 'Separar para mim'}</button>
        </div>
      )}
      <div class="tutor-list">
        {dicas.length === 0 && <span class="muted">Sem dicas no momento.</span>}
        {dicas.map((d, i) => (
          <div key={i} class="tutor-dica">
            <strong>{d.mensagem}</strong>
            {d.porque && <p class="muted">{d.porque}</p>}
            {d.como && <p class="muted">{d.como}</p>}
            {d.linha && <span class="muted">Linha {d.linha}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}