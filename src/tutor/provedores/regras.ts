import { extraDiagnostics } from '../rules'
import { analisarEstrutura } from '../estrutura'
import { detectarNivel, rotuloNivel } from '../nivel'

export interface Dica {
  id: string
  severidade: 'erro' | 'aviso' | 'sugestao' | 'info'
  mensagem: string
  porque?: string
  como?: string
  exemplo?: string
  linha?: number
}

export interface ProvedorDeTutor {
  nome: string
  disponivel(): Promise<boolean>
  analisar(entrada: { codigo: string; linguagem: string; arquivo: string; nivel: 'iniciante' | 'intermediario' | 'avancado' }): Promise<Dica[]>
}

export const provedorRegras: ProvedorDeTutor = {
  nome: 'regras',
  async disponivel() { return true },
  async analisar(entrada) {
    const dicas: Dica[] = []
    const diags = extraDiagnostics(entrada.linguagem, entrada.codigo)
    for (const d of diags) {
      dicas.push({
        id: `${entrada.linguagem}-${d.from}`,
        severidade: d.severity === 'error' ? 'erro' : d.severity === 'warning' ? 'aviso' : 'info',
        mensagem: d.message,
        linha: d.line,
      })
    }
    // estrutura
    const sug = analisarEstrutura(entrada.arquivo, entrada.codigo)
    if (sug) {
      dicas.push({
        id: 'estrutura-separar',
        severidade: 'sugestao',
        mensagem: `Este HTML tem ${sug.linhas} linhas (CSS embutido: ${sug.estiloLinhas}, JS: ${sug.scriptLinhas}). Que tal separar em index.html, style.css e script.js?`,
        porque: 'Separar responsabilidades deixa o código mais organizado e fácil de manter.',
        como: 'Clique em "Separar para mim" para criar os arquivos automaticamente.',
      })
    }
    // nível
    const nivelDetectado = detectarNivel(entrada.codigo)
    dicas.push({
      id: 'nivel',
      severidade: 'info',
      mensagem: `Nível de dicas: ${rotuloNivel(entrada.nivel === 'iniciante' ? nivelDetectado : entrada.nivel)}.`,
    })
    return dicas
  },
}