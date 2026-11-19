export interface ConsoleEntry { level: string; text: string; ts: number }

export function ConsolePanel({ entries, onClear }: { entries: ConsoleEntry[]; onClear: () => void }) {
  return (
    <div class="console-panel">
      <div class="console-toolbar">
        <button onClick={onClear}>Limpar</button>
      </div>
      <div class="console-output">
        {entries.length === 0 && <span class="muted">Sem saída.</span>}
        {entries.map((e, i) => (
          <div key={i} class={`console-line console-${e.level}`}>{e.text}</div>
        ))}
      </div>
    </div>
  )
}