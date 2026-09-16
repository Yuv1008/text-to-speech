import { clearHistory, deleteHistoryItem, getHistoryItem, listHistory } from '../db/index.js';
import { AppError } from '../utils/errors.js';

function toPreview(text, max = 80) {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function toItem(row) {
  return {
    id: row.id,
    textPreview: toPreview(row.text),
    language: row.language,
    voice: row.voice,
    audioUrl: `/audio/${row.filename}`,
    createdAt: row.created_at,
  };
}

export function getHistory(req, res) {
  const { limit } = req.query;
  const rows = listHistory(limit ?? 20);
  res.status(200).json({ items: rows.map(toItem) });
}

export function deleteHistoryEntry(req, res) {
  const { id } = req.params;
  const row = getHistoryItem(id);
  if (!row) {
    throw new AppError('NOT_FOUND', 'No history entry with that id.');
  }
  deleteHistoryItem(id);
  res.status(204).send();
}

export function deleteAllHistory(req, res) {
  clearHistory();
  res.status(204).send();
}
