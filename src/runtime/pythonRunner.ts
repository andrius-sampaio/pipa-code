// Python opcional via Pyodide (carregado sob demanda). Requer arquivos em /pyodide/.
//
// Limitação conhecida: Pyodide roda na thread principal e não pode ser interrompido
// no meio de uma execução. Por isso usamos gerações: "Parar" e timeouts invalidam a
// execução corrente (callbacks tardios são ignorados) e a instância é recarregada
// na próxima execução.

export interface PyResult { logs: string[]; error?: string }

export class PythonRunner {
  private pyodide: any = null
  private loading = false
  private generation = 0
  private timedOut = false
  private onLog: (text: string) => void
  private onDone: (err?: string) => void

  constructor(onLog: (t: string) => void, onDone: (e?: string) => void) {
    this.onLog = onLog
    this.onDone = onDone
  }

  async load(onProgress?: (msg: string) => void): Promise<boolean> {
    if (this.pyodide) return true
    if (this.loading) return false
    this.loading = true
    try {
      onProgress?.('Carregando Python (Pyodide)... isso pode levar alguns segundos.')
      const mod: any = await import('pyodide')
      const base = (import.meta as any).env?.BASE_URL ?? '/'
      this.pyodide = await mod.loadPyodide({ indexURL: base + 'pyodide/' })
      this.timedOut = false
      onProgress?.('Python carregado.')
      return true
    } catch (e: any) {
      onProgress?.('Falha ao carregar Python: ' + (e?.message ?? e))
      return false
    } finally {
      this.loading = false
    }
  }

  async run(code: string, timeoutMs = 10000) {
    // Se a execução anterior estourou o tempo, a instância pode estar presa no
    // código antigo: descarta e recarrega.
    if (this.timedOut) {
      this.pyodide = null
      this.timedOut = false
    }
    if (!this.pyodide) {
      const ok = await this.load((m) => this.onLog(m))
      if (!ok) { this.onDone('Python não carregado.'); return }
    }
    const py = this.pyodide
    const gen = ++this.generation
    // capturar stdout/stderr
    py.setStdout({ batched: (s: string) => { if (gen === this.generation) this.onLog(s) } })
    py.setStderr({ batched: (s: string) => { if (gen === this.generation) this.onLog(s) } })
    let timer: number | null = null
    try {
      timer = window.setTimeout(() => {
        if (gen !== this.generation) return
        this.timedOut = true
        this.onLog('Tempo limite excedido. A execução foi descartada; use "Parar" ou execute de novo.')
        this.onDone('Timeout')
      }, timeoutMs)
      await py.runPythonAsync(code)
      if (gen !== this.generation) return
      if (timer) window.clearTimeout(timer)
      this.onDone()
    } catch (e: any) {
      if (gen !== this.generation) return
      if (timer) window.clearTimeout(timer)
      this.onLog(String(e?.message ?? e))
      this.onDone(String(e?.message ?? e))
    }
  }

  stop() {
    // Invalida qualquer execução/callback pendente. A instância é abandonada
    // (não dá para interromper Pyodide na thread principal) e recarregada sob demanda.
    this.generation++
    this.pyodide = null
    this.timedOut = false
  }
}
