import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const DIST = 'dist'
const JS_LIMIT_KB = 300
const CSS_LIMIT_KB = 60

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

const files = walk(DIST).filter((f) => !f.includes('pyodide'))
let jsTotal = 0
let cssTotal = 0
let failed = false
for (const f of files) {
  const buf = readFileSync(f)
  const gz = gzipSync(buf).length
  const kb = gz / 1024
  if (f.endsWith('.js')) {
    jsTotal += gz
    console.log(`${f}: ${kb.toFixed(1)} KB gzip`)
  } else if (f.endsWith('.css')) {
    cssTotal += gz
    console.log(`${f}: ${kb.toFixed(1)} KB gzip (CSS)`)
  }
}
const jsKb = jsTotal / 1024
const cssKb = cssTotal / 1024
console.log(`\nTotal JS gzip: ${jsKb.toFixed(1)} KB (limite ${JS_LIMIT_KB} KB)`)
console.log(`Total CSS gzip: ${cssKb.toFixed(1)} KB (limite ${CSS_LIMIT_KB} KB)`)
if (jsKb > JS_LIMIT_KB) {
  console.error(`FALHOU: orçamento de JS ultrapassado (${jsKb.toFixed(1)} > ${JS_LIMIT_KB} KB).`)
  failed = true
}
if (cssKb > CSS_LIMIT_KB) {
  console.error(`FALHOU: orçamento de CSS ultrapassado (${cssKb.toFixed(1)} > ${CSS_LIMIT_KB} KB).`)
  failed = true
}
if (failed) process.exit(1)
console.log('OK: dentro do orçamento.')
