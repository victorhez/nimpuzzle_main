CREATE TABLE IF NOT EXISTS daily_puzzles (
  puzzle_date DATE PRIMARY KEY,
  word TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  pool_luna BIGINT NOT NULL DEFAULT 0,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS players (
  wallet TEXT PRIMARY KEY,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  total_won_luna BIGINT NOT NULL DEFAULT 0,
  solved_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_date DATE NOT NULL REFERENCES daily_puzzles(puzzle_date),
  wallet TEXT NOT NULL REFERENCES players(wallet),
  stake_luna BIGINT NOT NULL,
  tx_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending','confirmed','refunded','paid')) DEFAULT 'pending',
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(puzzle_date, wallet)
);

CREATE TABLE IF NOT EXISTS guesses (
  id BIGSERIAL PRIMARY KEY,
  puzzle_date DATE NOT NULL REFERENCES daily_puzzles(puzzle_date),
  wallet TEXT NOT NULL REFERENCES players(wallet),
  guess TEXT NOT NULL,
  result TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(puzzle_date, wallet, attempt)
);

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_date DATE NOT NULL REFERENCES daily_puzzles(puzzle_date),
  wallet TEXT NOT NULL REFERENCES players(wallet),
  amount_luna BIGINT NOT NULL,
  tx_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('queued','sent','failed')) DEFAULT 'queued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(puzzle_date, wallet)
);

CREATE INDEX IF NOT EXISTS guesses_lookup ON guesses(puzzle_date, wallet);
CREATE INDEX IF NOT EXISTS entries_lookup ON entries(puzzle_date, status);
