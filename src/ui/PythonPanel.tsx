import { useState } from 'preact/hooks'
import { PythonRunner } from '../runtime/pythonRunner'

export function PythonPanel({ content }: { content: string }) {
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [runner] = useState(() => new PythonRunner((t) => setLogs((prev) => [...prev, t]), () => setRunning(false)))

  const run = async () => {
    setLogs([])
    setRunning(true)
    await runner.run(content || '')
  }
  const stop = () => { runner.stop(); setRunning(false); setLogs((prev) => [...prev, 'Interrompido.']) }

  return (
    <div class="python-panel">
      <div class="python-toolbar">
        <button onClick={run} disabled={running}>▶ Executar Python</button>
        <button onClick={stop} disabled={!running}>⏹ Parar</button>
        <span class="muted">Python via Pyodide (carregado sob demanda, ~14 MB).</span>
      </div>
      <div class="console-output">
        {logs.map((l, i) => <div key={i} class="console-line">{l}</div>)}
      </div>
    </div>
  )
}