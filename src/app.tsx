import './app.css'
import { useState, useEffect, useCallback } from 'preact/hooks'
import { Layout } from './ui/Layout'
import { Home } from './ui/Home'
import { requestPersist } from './storage/db'
import type { ProjectRecord } from './storage/db'

export function App() {
  const [project, setProject] = useState<ProjectRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const isFileMode = typeof window !== 'undefined' && window.location.protocol === 'file:'

  useEffect(() => {
    requestPersist().catch(() => {})
    setLoading(false)
  }, [])

  const openProject = useCallback((p: ProjectRecord) => setProject(p), [])
  const closeProject = useCallback(() => setProject(null), [])

  if (loading) return <div class="placeholder">Carregando...</div>

  if (!project) {
    return (
      <div>
        {isFileMode && <div class="banner warn">Modo arquivo único: Python indisponível. O restante funciona normalmente.</div>}
        <Home onOpen={openProject} />
      </div>
    )
  }
  return (
    <div style={{ height:'100%' }}>
      {isFileMode && <div class="banner warn">Modo arquivo único: Python indisponível.</div>}
      <Layout project={project} onClose={closeProject} />
    </div>
  )
}