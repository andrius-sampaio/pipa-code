import './app.css'
import { useState, useEffect, useCallback } from 'preact/hooks'
import { Layout } from './ui/Layout'
import { Home } from './ui/Home'
import { Onboarding } from './ui/Onboarding'
import { requestPersist } from './storage/db'
import type { ProjectRecord } from './storage/db'

function onboardingDone(): boolean {
  try { return localStorage.getItem('pipa-code:onboarding-done') === '1' } catch { return true }
}

export function App() {
  const [project, setProject] = useState<ProjectRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const isFileMode = typeof window !== 'undefined' && window.location.protocol === 'file:'

  useEffect(() => {
    requestPersist().catch(() => {})
    setLoading(false)
  }, [])

  useEffect(() => {
    // Mostra o onboarding uma única vez, na tela inicial (não no modo arquivo único).
    if (isFileMode) return
    if (!loading && !project && !onboardingDone()) setShowOnboarding(true)
  }, [loading, project, isFileMode])

  const openProject = useCallback((p: ProjectRecord) => setProject(p), [])
  const closeProject = useCallback(() => setProject(null), [])

  if (loading) return <div class="placeholder">Carregando...</div>

  if (!project) {
    return (
      <div>
        {isFileMode && <div class="banner warn">Modo arquivo único: Python indisponível. O restante funciona normalmente.</div>}
        <Home onOpen={openProject} />
        {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
      </div>
    )
  }
  return (
    <div style={{ height: '100%' }}>
      {isFileMode && <div class="banner warn">Modo arquivo único: Python indisponível.</div>}
      <Layout project={project} onClose={closeProject} />
    </div>
  )
}
