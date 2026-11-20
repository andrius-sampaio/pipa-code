import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import { listFiles, writeFile, deleteFile, renameFile, type FileRecord } from '../storage/projects'
import { extractZip, downloadBlob, createZip } from '../files/zip'
import type { ProjectRecord } from '../storage/db'

interface ExplorerProps {
  project: ProjectRecord
  selectedFile: string | null
  onSelectFile: (path: string | null) => void
  /** Incremente para forçar recarregamento (ex.: após ações externas que criam arquivos). */
  refreshToken?: number
}

function buildTree(files: FileRecord[]): any {
  const root: any = { name: '', type: 'folder', children: {} }
  for (const f of files) {
    const parts = f.path.split('/').filter(Boolean)
    let cur: any = root
    parts.forEach((part: string, idx: number) => {
      if (!cur.children[part]) {
        cur.children[part] = { name: part, type: idx === parts.length - 1 ? f.type : 'folder', path: parts.slice(0, idx + 1).join('/'), children: {} }
      }
      cur = cur.children[part]
    })
  }
  return root
}

// Pasta que contém um caminho ('' para a raiz).
function parentDir(path: string): string {
  return path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : ''
}

// Valida um nome de arquivo/pasta simples (sem "/", sem vazios, sem só espaços).
function isValidName(name: string): boolean {
  const trimmed = name.trim()
  if (!trimmed) return false
  if (trimmed.includes('/')) return false
  if (trimmed.includes('\\')) return false
  return true
}

export function Explorer({ project, selectedFile, onSelectFile, refreshToken }: ExplorerProps) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; file: FileRecord | null; path: string } | null>(null)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState<'file' | 'folder' | null>(null)
  const [creatingParent, setCreatingParent] = useState('')
  const longPressTimers = useRef<Record<string, number>>({})

  const refresh = useCallback(async () => {
    setFiles(await listFiles(project.id))
  }, [project.id])

  useEffect(() => { refresh() }, [refresh, refreshToken])

  // Fecha o menu de contexto com Escape ou clique fora dele.
  useEffect(() => {
    if (!ctxMenu) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCtxMenu(null) }
    const onClick = () => setCtxMenu(null)
    window.addEventListener('keydown', onKey)
    window.addEventListener('click', onClick)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('click', onClick) }
  }, [ctxMenu])

  useEffect(() => () => {
    for (const t of Object.values(longPressTimers.current)) window.clearTimeout(t)
    longPressTimers.current = {}
  }, [])

  const handleCreate = async () => {
    if (!isValidName(newName) || !creating) return
    const name = newName.trim()
    const path = creatingParent ? `${creatingParent}/${name}` : name
    if (files.some((f) => f.path === path)) {
      alert(`Já existe um arquivo/pasta com o nome "${name}" aqui.`)
      return
    }
    await writeFile(project.id, path, creating === 'folder' ? '' : '', creating === 'folder' ? 'folder' : 'file')
    setCreating(null)
    setNewName('')
    setCreatingParent('')
    await refresh()
    if (creating === 'file') onSelectFile(path)
  }

  const handleDelete = async (f: FileRecord) => {
    if (!confirm(`Excluir "${f.path}"?`)) return
    // excluir filhos se pasta
    const children = files.filter((x) => x.path.startsWith(f.path + '/'))
    for (const c of children) await deleteFile(c.id)
    await deleteFile(f.id)
    if (selectedFile === f.path || (selectedFile && selectedFile.startsWith(f.path + '/'))) onSelectFile(null)
    await refresh()
  }

  const handleRename = async (f: FileRecord) => {
    const np = prompt('Novo caminho/nome:', f.path)
    if (!np || np.trim() === f.path) return
    const cleaned = np.trim().replace(/^\/+/, '')
    if (!cleaned || cleaned.includes('\\')) {
      alert('Nome inválido.')
      return
    }
    const target = files.find((x) => x.path === cleaned && x.id !== f.id)
    if (target) {
      alert(`Já existe um arquivo com o caminho "${cleaned}".`)
      return
    }
    await renameFile(f.id, cleaned)
    if (selectedFile === f.path) onSelectFile(cleaned)
    await refresh()
  }

  const handleDuplicate = async (f: FileRecord) => {
    if (f.type !== 'file') return
    const base = f.path
    const dot = base.lastIndexOf('.')
    const copyPath = dot > 0 ? base.slice(0, dot) + '_copia' + base.slice(dot) : base + '_copia'
    await writeFile(project.id, copyPath, f.content)
    await refresh()
    onSelectFile(copyPath)
  }

  const handleExportZip = async () => {
    const entries = files.filter((f) => f.type === 'file').map((f) => ({ path: f.path, content: f.content }))
    const z = createZip(entries)
    downloadBlob(z, `${project.name}.zip`)
  }

  const handleImportZip = async (file: File) => {
    const buf = new Uint8Array(await file.arrayBuffer())
    const entries = extractZip(buf)
    for (const e of entries) await writeFile(project.id, e.path, e.content)
    await refresh()
  }

  const handleImportFiles = async (list: FileList) => {
    for (const f of Array.from(list)) {
      await writeFile(project.id, f.name, await f.text())
    }
    await refresh()
  }

  const openCtx = (e: MouseEvent | TouchEvent, file: FileRecord | null, path: string) => {
    e.preventDefault()
    const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX
    const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY
    setCtxMenu({ x: clientX, y: clientY, file, path })
  }

  const tree = buildTree(files)

  const renderNode = (node: any, depth = 0): any => {
    if (node.name === '' && node.children) {
      return Object.values(node.children).map((c: any) => renderNode(c, 0))
    }
    const isFolder = node.type === 'folder'
    const isSelected = selectedFile === node.path
    return (
      <div key={node.path}>
        <div
          class={`tree-item ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
          onClick={() => { if (!isFolder) onSelectFile(node.path) }}
          onContextMenu={(e) => openCtx(e, files.find((f) => f.path === node.path) || null, node.path)}
          onTouchStart={(e) => {
            const path = node.path
            window.clearTimeout(longPressTimers.current[path])
            longPressTimers.current[path] = window.setTimeout(() => {
              delete longPressTimers.current[path]
              openCtx(e, files.find((f) => f.path === path) || null, path)
            }, 500)
          }}
          onTouchEnd={() => { window.clearTimeout(longPressTimers.current[node.path]); delete longPressTimers.current[node.path] }}
          onTouchMove={() => { window.clearTimeout(longPressTimers.current[node.path]); delete longPressTimers.current[node.path] }}
        >
          <span class="tree-icon">{isFolder ? '📁' : '📄'}</span>
          <span class="tree-name">{node.name}</span>
        </div>
        {isFolder && node.children && Object.values(node.children).map((c: any) => renderNode(c, depth + 1))}
      </div>
    )
  }

  return (
    <div class="explorer">
      <div class="explorer-toolbar">
        <button onClick={() => { setCreating('file'); setCreatingParent(''); setNewName('') }} title="Novo arquivo">+Arq</button>
        <button onClick={() => { setCreating('folder'); setCreatingParent(''); setNewName('') }} title="Nova pasta">+Pasta</button>
        <label class="icon-btn" title="Importar arquivos">
          ⬆
          <input type="file" multiple style={{ display: 'none' }} onChange={(e) => {
            const fs = (e.target as HTMLInputElement).files
            if (fs && fs.length) handleImportFiles(fs)
          }} />
        </label>
        <label class="icon-btn" title="Importar .zip">
          📦
          <input type="file" accept=".zip" style={{ display: 'none' }} onChange={(e) => {
            const f = (e.target as HTMLInputElement).files?.[0]
            if (f) handleImportZip(f)
          }} />
        </label>
        <button onClick={handleExportZip} title="Exportar .zip">⬇</button>
      </div>

      {creating && (
        <div class="create-row">
          <input
            autoFocus
            value={newName}
            placeholder={creating === 'file' ? 'nome.ext' : 'nome-da-pasta'}
            onInput={(e) => setNewName((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(null); setNewName('') } }}
          />
          <button onClick={handleCreate}>OK</button>
          <button onClick={() => { setCreating(null); setNewName('') }}>×</button>
        </div>
      )}

      <div class="tree" onClick={() => setCtxMenu(null)}>
        {files.length === 0 ? <p class="muted">Pasta vazia.</p> : renderNode(tree)}
      </div>

      {ctxMenu && (
        <div class="ctx-menu" style={{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }} onClick={(e) => e.stopPropagation()}>
          {ctxMenu.file && ctxMenu.file.type === 'file' && (
            <button onClick={() => { onSelectFile(ctxMenu.file!.path); setCtxMenu(null) }}>Abrir</button>
          )}
          <button onClick={() => { setCreating('file'); setCreatingParent(ctxMenu.file ? parentDir(ctxMenu.file.path) : ctxMenu.path); setNewName(''); setCtxMenu(null) }}>Novo arquivo aqui</button>
          <button onClick={() => { setCreating('folder'); setCreatingParent(ctxMenu.file ? parentDir(ctxMenu.file.path) : ctxMenu.path); setNewName(''); setCtxMenu(null) }}>Nova pasta aqui</button>
          {ctxMenu.file && <button onClick={() => { handleRename(ctxMenu.file!); setCtxMenu(null) }}>Renomear</button>}
          {ctxMenu.file && ctxMenu.file.type === 'file' && <button onClick={() => { handleDuplicate(ctxMenu.file!); setCtxMenu(null) }}>Duplicar</button>}
          {ctxMenu.file && <button class="danger" onClick={() => { handleDelete(ctxMenu.file!); setCtxMenu(null) }}>Excluir</button>}
          <button onClick={() => setCtxMenu(null)}>Fechar</button>
        </div>
      )}
    </div>
  )
}
