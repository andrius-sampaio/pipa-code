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