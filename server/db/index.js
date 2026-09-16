import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(__dirname, '..');

const dbPath = path.resolve(SERVER_ROOT, process.env.DB_PATH || './db/history.sqlite');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

const HISTORY_LIMIT = Number(process.env.HISTORY_LIMIT) || 100;

const statements = {
  insert: db.prepare(
    `INSERT INTO history (id, text, language, voice, filename, created_at)
     VALUES (@id, @text, @language, @voice, @filename, @created_at)`,
  ),
  list: db.prepare(`SELECT * FROM history ORDER BY created_at DESC LIMIT ?`),
  get: db.prepare(`SELECT * FROM history WHERE id = ?`),
  delete: db.prepare(`DELETE FROM history WHERE id = ?`),
  clear: db.prepare(`DELETE FROM history`),
  countAll: db.prepare(`SELECT COUNT(*) AS count FROM history`),
  oldestBeyondLimit: db.prepare(
    `SELECT id FROM history ORDER BY created_at DESC LIMIT -1 OFFSET ?`,
  ),
  deleteMany: db.prepare(`DELETE FROM history WHERE id = ?`),
};

/** Inserts a history row and prunes anything past HISTORY_LIMIT (oldest first). */
export function insertHistory({ text, language, voice, filename }) {
  const row = {
    id: randomUUID(),
    text,
    language,
    voice,
    filename,
    created_at: new Date().toISOString(),
  };
  statements.insert.run(row);
  pruneHistory();
  return row;
}

export function pruneHistory() {
  const { count } = statements.countAll.get();
  if (count <= HISTORY_LIMIT) return;
  const overflow = statements.oldestBeyondLimit.all(HISTORY_LIMIT);
  const deleteMany = db.transaction((rows) => {
    for (const row of rows) statements.deleteMany.run(row.id);
  });
  deleteMany(overflow);
}

export function listHistory(limit = 20) {
  return statements.list.all(limit);
}

export function getHistoryItem(id) {
  return statements.get.get(id);
}

export function deleteHistoryItem(id) {
  const result = statements.delete.run(id);
  return result.changes > 0;
}

export function clearHistory() {
  statements.clear.run();
}

export default db;
