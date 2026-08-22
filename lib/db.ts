import postgres from 'postgres'

let sql: ReturnType<typeof postgres> | null = null
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured')
  if (!sql) sql = postgres(process.env.DATABASE_URL, { max: 3, idle_timeout: 20, connect_timeout: 10, prepare: false })
  return sql
}

export async function ensureSchema() {
  const q = db()
  await q`CREATE EXTENSION IF NOT EXISTS pgcrypto`
  await q`CREATE TABLE IF NOT EXISTS daily_puzzles (puzzle_date DATE PRIMARY KEY, word TEXT NOT NULL, difficulty TEXT NOT NULL, pool_luna BIGINT NOT NULL DEFAULT 0, closed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
  await q`CREATE TABLE IF NOT EXISTS players (wallet TEXT PRIMARY KEY, current_streak INTEGER NOT NULL DEFAULT 0, best_streak INTEGER NOT NULL DEFAULT 0, total_won_luna BIGINT NOT NULL DEFAULT 0, solved_count INTEGER NOT NULL DEFAULT 0, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
  await q`CREATE TABLE IF NOT EXISTS entries (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), puzzle_date DATE NOT NULL REFERENCES daily_puzzles(puzzle_date), wallet TEXT NOT NULL REFERENCES players(wallet), stake_luna BIGINT NOT NULL, tx_hash TEXT, status TEXT NOT NULL DEFAULT 'pending', entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(puzzle_date, wallet))`
  await q`CREATE TABLE IF NOT EXISTS guesses (id BIGSERIAL PRIMARY KEY, puzzle_date DATE NOT NULL REFERENCES daily_puzzles(puzzle_date), wallet TEXT NOT NULL REFERENCES players(wallet), guess TEXT NOT NULL, result TEXT NOT NULL, attempt INTEGER NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(puzzle_date, wallet, attempt))`
  await q`CREATE TABLE IF NOT EXISTS payouts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), puzzle_date DATE NOT NULL REFERENCES daily_puzzles(puzzle_date), wallet TEXT NOT NULL REFERENCES players(wallet), amount_luna BIGINT NOT NULL, tx_hash TEXT, status TEXT NOT NULL DEFAULT 'queued', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(puzzle_date, wallet))`
}
