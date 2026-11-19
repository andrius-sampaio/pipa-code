// Python opcional via Pyodide (carregado sob demanda). Requer arquivos em /pyodide/.

export interface PyResult { logs: string[]; error?: string }

export class PythonRunner {
  private pyodide: any = null
  private loading = false
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
    if (!this.pyodide) {
      const ok = await this.load((m) => this.onLog(m))
      if (!ok) { this.onDone('Python não carregado.'); return }
    }
    const py = this.pyodide
    // capturar stdout
    py.setStdout({ batched: (s: string) => this.onLog(s) })
    py.setStderr({ batched: (s: string) => this.onLog(s) })
    let timer: number | null = null
    try {
      timer = window.setTimeout(() => { this.onLog('Tempo limite excedido.'); this.onDone('Timeout') }, timeoutMs)
      await py.runPythonAsync(code)
      if (timer) window.clearTimeout(timer)
      this.onDone()
    } catch (e: any) {
      if (timer) window.clearTimeout(timer)
      this.onLog(String(e?.message ?? e))
      this.onDone(String(e?.message ?? e))
    }
  }

  stop() {
    // Pyodide não suporta cancelamento fácil; recarregar instância
    this.pyodide = null
  }
}