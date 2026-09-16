CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  language TEXT NOT NULL,
  voice TEXT NOT NULL,
  filename TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_history_created_at ON history (created_at DESC);
