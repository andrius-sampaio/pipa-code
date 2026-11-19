import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate'

export interface ZipEntry {
  path: string
  content: string
}

// Cria um .zip a partir de uma lista de arquivos (caminho -> conteúdo texto).
export function createZip(entries: ZipEntry[]): Uint8Array {
  const obj: Record<string, Uint8Array> = {}
  for (const e of entries) {
    const clean = e.path.replace(/^\/+/, '')
    if (!clean || clean.includes('..')) continue
    obj[clean] = strToU8(e.content)
  }
  return zipSync(obj, { level: 6 })
}

// Extrai um .zip (Uint8Array) em lista de arquivos texto. Ignora binários grandes? Retorna texto.
export function extractZip(data: Uint8Array): ZipEntry[] {
  const unzipped = unzipSync(data)
  const out: ZipEntry[] = []
  for (const [path, bytes] of Object.entries(unzipped)) {
    if (path.endsWith('/')) continue
    if (path.includes('..')) continue
    try {
      out.push({ path, content: strFromU8(bytes) })
    } catch {
      // binário: pular na v1 (apenas texto)
    }
  }
  return out
}

export function downloadBlob(data: Uint8Array | Blob, filename: string, mime = 'application/zip') {
  const blob = data instanceof Blob ? data : new Blob([data as any], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}