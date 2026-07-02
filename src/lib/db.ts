import mysql from 'mysql2/promise'
import { drizzle } from 'drizzle-orm/mysql2'
import * as schema from './schema'

// In dev, Next's HMR re-executes this module on every edit. Without caching the
// pool it would leak ~connectionLimit connections per reload and eventually trip
// MySQL's max_connections ("Too many connections"), so reuse one pool across
// reloads via globalThis.
const globalForDb = globalThis as unknown as { _mysqlPool?: mysql.Pool }

// timezone: 'Z' forces the session to UTC so every TIMESTAMP/DATETIME value
// read/written agrees with the bound-Date comparisons in src/lib/visibility.ts —
// see that file for why SQL NOW()/UTC_TIMESTAMP() must never be used instead.
const pool =
  globalForDb._mysqlPool ??
  mysql.createPool({
    uri: process.env.DATABASE_URL,
    timezone: 'Z',
    connectionLimit: 10,
  })

if (process.env.NODE_ENV !== 'production') globalForDb._mysqlPool = pool

export const db = drizzle(pool, { schema, mode: 'default' })
