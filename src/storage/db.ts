import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export interface ProjectRecord {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  lastOpened: number
}

export interface FileRecord {
  id: string
  projectId: string
  path: string // caminho completo, ex: "src/index.html"
  name: string
  type: 'file' | 'folder'
  content: string
  updatedAt: number
}

interface MiniCodeDB extends DBSchema {
  projects: { key: string; value: ProjectRecord; indexes: { 'by-updated': number } }
  files: { key: string; value: FileRecord; indexes: { 'by-project': string; 'by-path': string } }
}

let dbPromise: Promise<IDBPDatabase<MiniCodeDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MiniCodeDB>('minicode', 1, {
      upgrade(db) {
        const p = db.createObjectStore('projects', { keyPath: 'id' })
        p.createIndex('by-updated', 'updatedAt')
        const f = db.createObjectStore('files', { keyPath: 'id' })
        f.createIndex('by-project', 'projectId')
        f.createIndex('by-path', 'path')
      },
    })
  }
  return dbPromise
}

export async function requestPersist(): Promise<boolean> {
  try {
    if (navigator.storage && navigator.storage.persist) {
      return await navigator.storage.persist()
    }
  } catch {
    // ignore
  }
  return false
}

export async function storageUsage(): Promise<{ used: number; quota: number }> {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const e = await navigator.storage.estimate()
      return { used: e.usage ?? 0, quota: e.quota ?? 0 }
    }
  } catch {
    // ignore
  }
  return { used: 0, quota: 0 }
}