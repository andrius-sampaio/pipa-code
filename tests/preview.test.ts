import { describe, it, expect } from 'vitest'
import { buildSrcdoc } from '../src/preview/Preview'

describe('buildSrcdoc', () => {
  it('usa index.html como entrada quando existe', () => {
    const files = { 'index.html': '<html><head></head><body><p>oi</p></body></html>' }
    const out = buildSrcdoc(files)
    expect(out).toContain('<p>oi</p>')
  })

  it('mostra aviso quando não há HTML', () => {
    const out = buildSrcdoc({ 'main.js': 'console.log(1)' })
    expect(out).toContain('Sem index.html')
  })

  it('inlina link de CSS referenciado pelo HTML', () => {
    const files = {
      'index.html': '<html><head><link rel="stylesheet" href="style.css"></head><body></body></html>',
      'style.css': 'body { color: red; }',
    }
    const out = buildSrcdoc(files)
    expect(out).toContain('<style>')
    expect(out).toContain('body { color: red; }')
    expect(out).not.toContain('<link rel="stylesheet"')
  })

  it('resolve CSS relativo à pasta do HTML (subpastas)', () => {
    const files = {
      'pages/index.html': '<html><head><link rel="stylesheet" href="../css/estilo.css"></head><body></body></html>',
      'css/estilo.css': 'h1 { color: blue; }',
    }
    const out = buildSrcdoc(files)
    expect(out).toContain('h1 { color: blue; }')
  })

  it('inlina script preservando type="module"', () => {
    const files = {
      'index.html': '<html><head></head><body><script type="module" src="app.js"></script></body></html>',
      'app.js': 'console.log("modulo")',
    }
    const out = buildSrcdoc(files)
    expect(out).toContain('<script type="module">')
    expect(out).toContain('console.log("modulo")')
  })

  it('mantém link externo (http) sem inlinear', () => {
    const files = {
      'index.html': '<html><head><link rel="stylesheet" href="https://cdn.example.com/x.css"></head><body></body></html>',
    }
    const out = buildSrcdoc(files)
    expect(out).toContain('https://cdn.example.com/x.css')
  })

  it('injeta captura de console', () => {
    const files = { 'index.html': '<html><head></head><body></body></html>' }
    const out = buildSrcdoc(files)
    expect(out).toContain('__pipacode')
  })
})
