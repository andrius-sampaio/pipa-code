// Detecção de nível do aluno por sinais simples no código do projeto.

export type Nivel = 'iniciante' | 'intermediario' | 'avancado'

export function detectarNivel(codigo: string): Nivel {
  let score = 0
  if (/\bfunction\b|\bdef\b|\bclass\b/.test(codigo)) score++
  if (/\bfor\b|\bwhile\b/.test(codigo)) score++
  if (/\bif\b.*\belse\b/s.test(codigo)) score++
  if (/\bclass\b/.test(codigo)) score++
  if (/\bimport\b|\brequire\b|\bmodule\b/.test(codigo)) score++
  if (/\basync\b|\bawait\b|\bPromise\b/.test(codigo)) score++
  // aninhamento de condicionais
  const aninhado = (codigo.match(/\bif\b/g) || []).length
  if (aninhado >= 3) score++
  if (score <= 1) return 'iniciante'
  if (score <= 3) return 'intermediario'
  return 'avancado'
}

export function rotuloNivel(n: Nivel): string {
  if (n === 'iniciante') return 'Básico'
  if (n === 'intermediario') return 'Intermediário'
  return 'Avançado'
}