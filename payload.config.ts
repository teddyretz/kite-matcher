import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

import { Kites } from './collections/Kites'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

function getDatabaseUri(): string {
  if (process.env.DATABASE_URI?.length) return process.env.DATABASE_URI
  if (process.env.DATABASE_URL?.length) return process.env.DATABASE_URL
  if (process.env.POSTGRES_URL?.length) return process.env.POSTGRES_URL
  // Construct from individual Supabase/Vercel Postgres env vars
  const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_DATABASE } = process.env
  if (POSTGRES_USER && POSTGRES_PASSWORD && POSTGRES_HOST && POSTGRES_DATABASE) {
    return `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DATABASE}`
  }
  return ''
}

export default buildConfig({
  editor: lexicalEditor(),
  collections: [Users, Kites],
  secret: process.env.PAYLOAD_SECRET || 'CHANGE-ME-SET-PAYLOAD_SECRET-ENV',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: getDatabaseUri(),
    },
    // Keep schema in sync in prod too — idempotent on unchanged schemas.
    push: true,
  }),
  sharp,
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
})
