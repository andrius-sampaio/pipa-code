import { describe, it, expect } from 'vitest'
import { createZip, extractZip } from '../src/files/zip'

describe('zip', () => {
  it('roundtrip', () => {
    const z = createZip([{ path: 'a.txt', content: 'hello' }, { path: 'b/c.txt', content: 'world' }])
    const out = extractZip(z)
    expect(out.length).toBe(2)
    expect(out.find((e) => e.path === 'a.txt')?.content).toBe('hello')
  })
  it('ignora caminhos com ..', () => {
    const z = createZip([{ path: '../evil.txt', content: 'x' }])
    const out = extractZip(z)
    expect(out.length).toBe(0)
  })
})