import { useState, useEffect, useCallback } from 'preact/hooks'
import { listProjects, createProject, deleteProject, writeFile } from '../storage/projects'
import { TEMPLATES } from '../templates'
import { extractZip } from '../files/zip'
import type { ProjectRecord } from '../storage/db'

interface HomeProps {
  onOpen: (p: ProjectRecord) => void
}

export function Home({ onOpen }: HomeProps) {
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('html-basic')
  const [importMsg, setImportMsg] = useState('')

  const refresh = useCallback(async () => {
    setProjects(await listProjects())
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const createFromTemplate = async () => {
    const name = newName.trim() || 'Meu projeto'
    const p = await createProject(name)
    const tpl = TEMPLATES.find((t) => t.id === selectedTemplate)
    if (tpl) {
      for (const f of tpl.files) {
        await writeFile(p.id, f.path, f.content)
      }
    }
    setShowNew(false)
    setNewName('')
    await refresh()
    onOpen(p)
  }

  const handleImportZip = async (file: File) => {
    setImportMsg('Importando...')
    try {
      const buf = new Uint8Array(await file.arrayBuffer())
      const entries = extractZip(buf)
      const name = file.name.replace(/\.zip$/i, '') || 'Projeto importado'
      const p = await createProject(name)
      for (const e of entries) {
        await writeFile(p.id, e.path, e.content)
      }
      setImportMsg(`Importado: ${entries.length} arquivo(s).`)
      await refresh()
      onOpen(p)
    } catch (err) {
      setImportMsg('Falha ao importar: ' + (err as Error).message)
    }
  }

  const handleImportFiles = async (files: FileList) => {
    const p = await createProject('Projeto importado')
    for (const f of Array.from(files)) {
      const text = await f.text()
      await writeFile(p.id, f.name, text)
    }
    await refresh()
    onOpen(p)
  }

  return (
    <div class="home">
      <header class="home-header">
        <h1>MiniCode</h1>
        <p>IDE educacional web, offline. Escolha um projeto ou crie um novo.</p>
      </header>

      <section class="home-section">
        <div class="home-actions">
          <button onClick={() => setShowNew(true)}>+ Novo projeto</button>
          <label class="import-label">
            Importar .zip
            <input type="file" accept=".zip" style={{ display: 'none' }} onChange={(e) => {
              const f = (e.target as HTMLInputElement).files?.[0]
              if (f) handleImportZip(f)
            }} />
          </label>
          <label class="import-label">
            Importar arquivos
            <input type="file" multiple style={{ display: 'none' }} onChange={(e) => {
              const fs = (e.target as HTMLInputElement).files
              if (fs && fs.length) handleImportFiles(fs)
            }} />
          </label>
        </div>
        {importMsg && <p class="muted">{importMsg}</p>}
      </section>

      {showNew && (
        <section class="home-card">
          <h2>Novo projeto</h2>
          <label>Nome do projeto
            <input value={newName} onInput={(e) => setNewName((e.target as HTMLInputElement).value)} placeholder="Meu projeto" />
          </label>
          <label>Modelo
            <select value={selectedTemplate} onChange={(e) => setSelectedTemplate((e.target as HTMLSelectElement).value)}>
              {TEMPLATES.map((t) => <option value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <p class="muted">{TEMPLATES.find((t) => t.id === selectedTemplate)?.description}</p>
          <div class="home-actions">
            <button onClick={createFromTemplate}>Criar</button>
            <button onClick={() => setShowNew(false)}>Cancelar</button>
          </div>
        </section>
      )}

      <section class="home-section">
        <h2>Projetos recentes</h2>
        {projects.length === 0 && <p class="muted">Nenhum projeto ainda. Crie um novo acima.</p>}
        <ul class="project-list">
          {projects.map((p) => (
            <li key={p.id}>
              <button class="project-item" onClick={() => onOpen(p)}>
                <span class="project-name">{p.name}</span>
                <span class="muted">{new Date(p.lastOpened).toLocaleString('pt-BR')}</span>
              </button>
              <button class="danger" onClick={async (e) => { e.stopPropagation(); if (confirm('Excluir projeto "' + p.name + '"?')) { await deleteProject(p.id); await refresh() } }}>Excluir</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}