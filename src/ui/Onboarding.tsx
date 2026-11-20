import { useState } from 'preact/hooks'
import type { JSX } from 'preact'
import { IconCode, IconFolder, IconPlay, IconBook } from './Icons'

const KEY = 'pipa-code:onboarding-done'

interface Step {
  title: string
  text: string
  icon: JSX.Element
}

const STEPS: Step[] = [
  {
    title: 'Bem-vindo ao Pipa Code!',
    text: 'Aqui você aprende a programar criando projetos de verdade. Tudo funciona no seu aparelho, mesmo sem internet.',
    icon: <IconCode size={40} />,
  },
  {
    title: '1. Crie um projeto',
    text: 'Toque em "+ Novo projeto" e escolha um modelo (página web, JavaScript, Python ou calculadora).',
    icon: <IconFolder size={40} />,
  },
  {
    title: '2. Escreva código',
    text: 'Abra um arquivo e digite. No celular, a barra de símbolos e o autocompletar ajudam a escrever mais rápido.',
    icon: <IconCode size={40} />,
  },
  {
    title: '3. Veja o resultado',
    text: 'Toque em "Resultado" para ver sua página ou programa funcionando — a atualização é automática.',
    icon: <IconPlay size={40} />,
  },
  {
    title: '4. Peça ajuda ao Tutor',
    text: 'A aba "Tutor" analisa seu código e dá dicas em português. Se ele sugerir "Separar para mim", ele mesmo organiza os arquivos.',
    icon: <IconBook size={40} />,
  },
]

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const s = STEPS[step]
  const last = step === STEPS.length - 1

  const finish = () => {
    try { localStorage.setItem(KEY, '1') } catch { /* ignore */ }
    onDone()
  }

  return (
    <div class="onboarding-backdrop" role="dialog" aria-label="Boas-vindas ao Pipa Code">
      <div class="onboarding-card">
        <div class="onboarding-icon">{s.icon}</div>
        <h2>{s.title}</h2>
        <p>{s.text}</p>
        <div class="onboarding-dots" aria-hidden="true">
          {STEPS.map((_, i) => <span key={i} class={`dot ${i === step ? 'active' : ''}`} />)}
        </div>
        <div class="onboarding-actions">
          <button onClick={finish}>Pular</button>
          <span class="spacer" />
          {step > 0 && <button onClick={() => setStep(step - 1)}>Voltar</button>}
          <button class="primary" onClick={() => (last ? finish() : setStep(step + 1))}>
            {last ? 'Começar!' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  )
}
