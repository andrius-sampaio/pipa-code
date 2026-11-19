import type { Diagnostic } from '../editor/diagnostics'

export function ProblemsPanel({ diagnostics, onJump }: { diagnostics: Diagnostic[]; onJump?: (d: Diagnostic) => void }) {
  if (!diagnostics || diagnostics.length === 0) {
    return <div class="problems-panel"><span class="muted">Nenhum problema detectado.</span></div>
  }
  return (
    <div class="problems-panel">
      {diagnostics.map((d, i) => (
        <button key={i} class="problem-item" onClick={() => onJump?.(d)}>
          <span class={`problem-sev ${d.severity}`}>{d.severity === 'error' ? '✖' : d.severity === 'warning' ? '⚠' : 'ℹ'}</span>
          <span class="problem-msg">{d.message}</span>
          <span class="muted">{d.line ? `Ln ${d.line}, Col ${d.col}` : ''}</span>
        </button>
      ))}
    </div>
  )
}