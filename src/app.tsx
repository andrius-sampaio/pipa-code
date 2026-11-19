import './app.css'
import { useState, useEffect, useCallback } from 'preact/hooks'
import { Layout } from './ui/Layout'
import { Home } from './ui/Home'
import { requestPersist } from './storage/db'
import type { ProjectRecord } from './storage/db'

export function App() {
  const [project, setProject] = useState<ProjectRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    requestPersist().catch(() => {})
    setLoading(false)
  }, [])

  const openProject = useCallback((p: ProjectRecord) => setProject(p), [])
  const closeProject = useCallback(() => setProject(null), [])

  if (loading) return <div class="placeholder">Carregando...</div>

  if (!project) {
    return <Home onOpen={openProject} />
  }
  return <Layout project={project} onClose={closeProject} />
}