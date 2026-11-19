import { writeFile } from '../storage/projects'

export interface SugestaoEstrutura {
  motivo: string
  linhas: number
  estiloLinhas: number
  scriptLinhas: number
}

// Heurística: um único .html com muitas linhas ou <style>/<script> longos.
export function analisarEstrutura(path: string, content: string): SugestaoEstrutura | null {
  if (!path.endsWith('.html')) return null
  const linhas = content.split('\n').length
  const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
  const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i)
  const estiloLinhas = styleMatch ? styleMatch[1].split('\n').length : 0
  const scriptLinhas = scriptMatch ? scriptMatch[1].split('\n').length : 0
  if (linhas > 150 || estiloLinhas > 20 || scriptLinhas > 20) {
    return { motivo: 'O arquivo HTML está grande ou tem CSS/JS embutido longo.', linhas, estiloLinhas, scriptLinhas }
  }
  return null
}

// "Separar para mim": cria index.html, style.css, script.js e ajusta referências.
export async function separarHtml(projectId: string, originalPath: string, content: string): Promise<{ created: string[] }> {
  const created: string[] = []
  const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
  const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i)
  const css = styleMatch ? styleMatch[1].trim() : ''
  const js = scriptMatch ? scriptMatch[1].trim() : ''

  // remover style/script embutidos do html
  let html = content
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '<link rel="stylesheet" href="style.css">')
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '<script src="script.js"></script>')
  // garantir link/script se não existiam
  if (css && !html.includes('style.css')) {
    html = html.replace('</head>', '  <link rel="stylesheet" href="style.css">\n</head>')
  }
  if (js && !html.includes('script.js')) {
    html = html.replace('</body>', '  <script src="script.js"></script>\n</body>')
  }

  const basePath = originalPath.includes('/') ? originalPath.substring(0, originalPath.lastIndexOf('/') + 1) : ''
  const indexPath = basePath + 'index.html'
  const cssPath = basePath + 'style.css'
  const jsPath = basePath + 'script.js'

  await writeFile(projectId, indexPath, html)
  created.push(indexPath)
  if (css) { await writeFile(projectId, cssPath, css); created.push(cssPath) }
  if (js) { await writeFile(projectId, jsPath, js); created.push(jsPath) }
  return { created }
}