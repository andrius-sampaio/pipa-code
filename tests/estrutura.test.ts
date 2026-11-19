import { describe, it, expect } from 'vitest'
import { analisarEstrutura } from '../src/tutor/estrutura'

describe('analisarEstrutura', () => {
  it('sugere separar quando HTML grande', () => {
    const html = '<html><head></head><body>' + 'x\n'.repeat(200) + '</body></html>'
    const s = analisarEstrutura('index.html', html)
    expect(s).not.toBeNull()
  })
  it('não sugere para HTML pequeno', () => {
    const html = '<html><head><title>t</title></head><body><p>hi</p></body></html>'
    const s = analisarEstrutura('index.html', html)
    expect(s).toBeNull()
  })
})