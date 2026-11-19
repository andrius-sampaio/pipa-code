import { getDB, type ProjectRecord, type FileRecord } from './db'
export type { FileRecord } from './db'
import { nanoid } from './ids'

export { nanoid }

export async function listProjects(): Promise<ProjectRecord[]> {
  const db = await getDB()
  const all = await db.getAll('projects')
  return all.sort((a, b) => b.lastOpened - a.lastOpened)
}

export async function getProject(id: string): Promise<ProjectRecord | undefined> {
  const db = await getDB()
  return db.get('projects', id)
}

export async function createProject(name: string): Promise<ProjectRecord> {
  const db = await getDB()
  const now = Date.now()
  const rec: ProjectRecord = { id: nanoid(), name, createdAt: now, updatedAt: now, lastOpened: now }
  await db.put('projects', rec)
  return rec
}

export async function touchProject(id: string): Promise<void> {
  const db = await getDB()
  const rec = await db.get('projects', id)
  if (!rec) return
  rec.lastOpened = Date.now()
  rec.updatedAt = rec.lastOpened
  await db.put('projects', rec)
}

export async function renameProject(id: string, name: string): Promise<void> {
  const db = await getDB()
  const rec = await db.get('projects', id)
  if (!rec) return
  rec.name = name
  rec.updatedAt = Date.now()
  await db.put('projects', rec)
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB()
  const files = await db.getAllFromIndex('files', 'by-project', id)
  const tx = db.transaction(['projects', 'files'], 'readwrite')
  await tx.objectStore('projects').delete(id)
  for (const f of files) await tx.objectStore('files').delete(f.id)
  await tx.done
}

export async function listFiles(projectId: string): Promise<FileRecord[]> {
  const db = await getDB()
  return db.getAllFromIndex('files', 'by-project', projectId)
}

export async function getFile(id: string): Promise<FileRecord | undefined> {
  const db = await getDB()
  return db.get('files', id)
}

export async function findFile(projectId: string, path: string): Promise<FileRecord | undefined> {
  const db = await getDB()
  const all = await db.getAllFromIndex('files', 'by-project', projectId)
  return all.find((f) => f.path === path)
}

export async function writeFile(projectId: string, path: string, content: string, type: 'file' | 'folder' = 'file'): Promise<FileRecord> {
  const db = await getDB()
  const existing = await findFile(projectId, path)
  const now = Date.now()
  const name = path.split('/').filter(Boolean).pop() || path
  if (existing) {
    existing.content = content
    existing.updatedAt = now
    await db.put('files', existing)
    await touchProject(projectId)
    return existing
  }
  const rec: FileRecord = { id: nanoid(), projectId, path, name, type, content, updatedAt: now }
  await db.put('files', rec)
  await touchProject(projectId)
  return rec
}

export async function deleteFile(id: string): Promise<void> {
  const db = await getDB()
  const rec = await db.get('files', id)
  await db.delete('files', id)
  if (rec) await touchProject(rec.projectId)
}

export async function renameFile(id: string, newPath: string): Promise<void> {
  const db = await getDB()
  const rec = await db.get('files', id)
  if (!rec) return
  const oldPath = rec.path
  const name = newPath.split('/').filter(Boolean).pop() || newPath
  rec.path = newPath
  rec.name = name
  rec.updatedAt = Date.now()
  await db.put('files', rec)
  // renomear filhos se for pasta
  if (rec.type === 'folder') {
    const children = await db.getAllFromIndex('files', 'by-project', rec.projectId)
    for (const c of children) {
      if (c.path.startsWith(oldPath + '/')) {
        c.path = newPath + c.path.slice(oldPath.length)
        c.updatedAt = Date.now()
        await db.put('files', c)
      }
    }
  }
  await touchProject(rec.projectId)
}