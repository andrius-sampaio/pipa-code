import { describe, it, expect } from 'vitest'
import { normalizePath } from '../src/storage/projects'

describe('normalizePath', () => {
  it('remove barras iniciais e segmentos vazios', () => {
    expect(normalizePath('/a//b/')).toBe('a/b')
  })

  it('converte barras invertidas', () => {
    expect(normalizePath('a\\b\\c.txt')).toBe('a/b/c.txt')
  })

  it('resolve ".." sem sair da raiz', () => {
    expect(normalizePath('a/b/../../c.txt')).toBe('c.txt')
    expect(normalizePath('../../../x')).toBe('x')
  })

  it('remove segmentos "."', () => {
    expect(normalizePath('./a/./b.txt')).toBe('a/b.txt')
  })

  it('retorna vazio para caminhos inválidos', () => {
    expect(normalizePath('')).toBe('')
    expect(normalizePath('/')).toBe('')
    expect(normalizePath('.')).toBe('')
    expect(normalizePath('..')).toBe('')
  })
})
