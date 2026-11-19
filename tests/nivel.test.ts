import { describe, it, expect } from 'vitest'
import { detectarNivel } from '../src/tutor/nivel'

describe('detectarNivel', () => {
  it('iniciante para código simples', () => {
    expect(detectarNivel('const x = 1')).toBe('iniciante')
  })
  it('avançado para código complexo', () => {
    const code = 'class A { async run(){ if (x) { for (let i=0;i<10;i++){ if(y){} } } } } import x from "y"'
    expect(detectarNivel(code)).toBe('avancado')
  })
})