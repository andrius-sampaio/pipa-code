// Execução de JavaScript puro em Web Worker, com saída capturada e botão Parar.

export interface RunResult {
  logs: { level: string; text: string }[]
  error?: string
}

export class JsRunner {
  private worker: Worker | null = null
  private onLog: (level: string, text: string) => void
  private onDone: (err?: string) => void

  constructor(onLog: (level: string, text: string) => void, onDone: (err?: string) => void) {
    this.onLog = onLog
    this.onDone = onDone
  }

  run(code: string) {
    this.stop()
    const workerCode = `
      const send = (level, text) => self.postMessage({ type: 'log', level, text });
      const console = {
        log: (...a) => send('log', a.map(String).join(' ')),
        info: (...a) => send('info', a.map(String).join(' ')),
        warn: (...a) => send('warn', a.map(String).join(' ')),
        error: (...a) => send('error', a.map(String).join(' ')),
      };
      self.onmessage = (e) => {
        const code = e.data.code;
        try {
          // eslint-disable-next-line no-eval
          const fn = new Function(code);
          const r = fn();
          if (r !== undefined) send('log', String(r));
          self.postMessage({ type: 'done' });
        } catch (err) {
          self.postMessage({ type: 'error', message: (err && err.stack) ? err.stack : String(err) });
        }
      };
    `
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    this.worker = new Worker(url)
    URL.revokeObjectURL(url)
    this.worker.onmessage = (e) => {
      const d = e.data
      if (d.type === 'log') this.onLog(d.level, d.text)
      else if (d.type === 'error') { this.onLog('error', d.message); this.onDone(d.message) }
      else if (d.type === 'done') this.onDone()
    }
    this.worker.onerror = (e) => { this.onLog('error', e.message); this.onDone(e.message) }
    this.worker.postMessage({ code })
  }

  stop() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }
}