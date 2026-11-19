import { useState, useEffect, useRef } from 'preact/hooks'

interface PreviewProps {
  contents: Record<string, string>
  onConsole: (level: string, text: string) => void
}

function resolveFile(files: Record<string, string>, ref: string): string | null {
  const clean = ref.replace(/^\.\//, '').replace(/^\//, '')
  if (files[clean] !== undefined) return files[clean]
  // tentar sem query
  const key = clean.split('?')[0]
  if (files[key] !== undefined) return files[key]
  return null
}

function buildSrcdoc(files: Record<string, string>): string {
  const entry = files['index.html'] !== undefined ? 'index.html' : Object.keys(files).find((k) => k.endsWith('.html'))
  if (!entry) return '<!DOCTYPE html><html><body><p>Sem index.html</p></body></html>'
  let html = files[entry]

  // CSS links -> inline
  html = html.replace(/<link([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi, (match, _pre, href, _post) => {
    if (!/rel=["']stylesheet["']/.test(match) && !match.includes('stylesheet')) return match
    const content = resolveFile(files, href)
    if (content === null) return match
    return `<style>/* ${href} */\n${content}\n</style>`
  })

  // script src -> inline
  html = html.replace(/<script([^>]*?)src=["']([^"']+)["']([^>]*?)><\/script>/gi, (match, _pre, src, _post) => {
    const content = resolveFile(files, src)
    if (content === null) return match
    const attrs = (_pre + _post).replace(/src=["'][^"']*["']/, '')
    return `<script${attrs}>/* ${src} */\n${content}\n</script>`
  })

  // injetar captura de console
  const capture = `<script>
(function(){
  function send(level, args){ try { parent.postMessage({__minicode:true, type:'console', level:level, text: Array.from(args).map(function(x){ try { return typeof x==='object' ? JSON.stringify(x) : String(x) } catch(e){ return String(x) } }).join(' ') }, '*'); } catch(e){}
  }
  const c = console;
  ['log','info','warn','error'].forEach(function(l){ const orig = c[l].bind(c); c[l] = function(){ send(l, arguments); orig.apply(c, arguments); }; });
  window.addEventListener('error', function(e){ try { parent.postMessage({__minicode:true, type:'error', message: e.message, line: e.lineno, col: e.colno }, '*'); } catch(err){} });
})();
</script>`

  if (/<head>/i.test(html)) html = html.replace(/<head>/i, '<head>' + capture)
  else html = capture + html

  return html
}

export function Preview({ contents, onConsole }: PreviewProps) {
  const [srcdoc, setSrcdoc] = useState('')
  const [auto, setAuto] = useState(true)
  const debounceRef = useRef<number | null>(null)

  const run = () => {
    onConsole('info', '--- Executando preview ---')
    setSrcdoc(buildSrcdoc(contents))
  }

  useEffect(() => {
    if (!auto) return
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => { run() }, 600)
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
  }, [contents, auto])

  // listener de mensagens do iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const d = e.data
      if (!d || !d.__minicode) return
      if (d.type === 'console') onConsole(d.level, d.text)
      else if (d.type === 'error') onConsole('error', `${d.message} (linha ${d.line})`)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onConsole])

  return (
    <div class="preview-wrap">
      <div class="preview-toolbar">
        <button onClick={run}>▶ Executar</button>
        <button onClick={() => setSrcdoc('')}>⏹ Parar</button>
        <label class="auto-toggle">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto((e.target as HTMLInputElement).checked)} />
          Atualização automática
        </label>
      </div>
      <iframe
        class="preview-frame"
        sandbox="allow-scripts"
        srcDoc={srcdoc}
        title="Preview"
      />
    </div>
  )
}