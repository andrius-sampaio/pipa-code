import { describe, it, expect } from 'vitest'
import { extraDiagnostics } from '../src/tutor/rules'

describe('extraDiagnostics json', () => {
  it('detecta JSON inválido', () => {
    const d = extraDiagnostics('json', '{ invalid }')
    expect(d.length).toBeGreaterThan(0)
    expect(d[0].severity).toBe('error')
  })
  it('não detecta erro em JSON válido', () => {
    const d = extraDiagnostics('json', '{"a":1}')
    expect(d.length).toBe(0)
  })
})

describe('extraDiagnostics js', () => {
  it('detecta var', () => {
    const d = extraDiagnostics('javascript', 'var x = 1')
    expect(d.some((x) => x.message.includes('var'))).toBe(true)
  })
})

describe('extraDiagnostics html', () => {
  it('avisa quando falta DOCTYPE', () => {
    const d = extraDiagnostics('html', '<html><head></head><body></body></html>')
    expect(d.some((x) => x.message.includes('DOCTYPE'))).toBe(true)
  })
  it('avisa quando img não tem alt', () => {
    const d = extraDiagnostics('html', '<!DOCTYPE html><html><body><img src="a.png"></body></html>')
    expect(d.some((x) => x.message.includes('acessibilidade'))).toBe(true)
  })
  it('não acusa img com alt', () => {
    const d = extraDiagnostics('html', '<!DOCTYPE html><html><body><img src="a.png" alt="figura"></body></html>')
    expect(d.some((x) => x.message.includes('acessibilidade'))).toBe(false)
  })
})