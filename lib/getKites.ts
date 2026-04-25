import fs from 'fs'
import path from 'path'
import type { Kite } from './types'

const DATA_DIR = path.join(process.cwd(), 'data', 'kites')

let cache: Kite[] | null = null

function loadAllFromDisk(): Kite[] {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`data/kites/ not found at ${DATA_DIR}`)
  }
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')).sort()
  const kites: Kite[] = files.map((f) => {
    const raw = fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')
    return JSON.parse(raw) as Kite
  })
  return kites
}

function loadAll(): Kite[] {
  if (cache === null) cache = loadAllFromDisk()
  return cache
}

export async function getAllKites(): Promise<Kite[]> {
  return loadAll()
}

export async function getActiveKites(): Promise<Kite[]> {
  return loadAll().filter((k) => !k.discontinued)
}

export async function getKiteBySlug(slug: string): Promise<Kite | null> {
  return loadAll().find((k) => k.slug === slug) ?? null
}
