import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const DIST = 'dist'
const LIMIT_KB = 300

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const s = statSync(p)
    if (s.isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

const files = walk(DIST).filter((f) => f.endsWith('.js') && !f.includes('pyodide'))
let total = 0
for (const f of files) {
  const buf = readFileSync(f)
  const gz = gzipSync(buf)
  total += gz.length
  console.log(`${f}: ${(gz.length / 1024).toFixed(1)} KB gzip`)
}
const totalKb = total / 1024
console.log(`\nTotal JS gzip: ${totalKb.toFixed(1)} KB (limite ${LIMIT_KB} KB)`)
if (totalKb > LIMIT_KB) {
  console.error(`FALHOU: orçamento de desempenho ultrapassado (${totalKb.toFixed(1)} > ${LIMIT_KB} KB).`)
  process.exit(1)
}
console.log('OK: dentro do orçamento.')