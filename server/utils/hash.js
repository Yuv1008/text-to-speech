import { createHash } from 'node:crypto';

/**
 * Deterministic cache key for a synthesis request: sha256 of the fields that
 * fully determine the resulting audio. Order matters — keep it fixed.
 */
export function cacheKey({ text, language, voice, rate, pitch, format }) {
  const payload = [text, language, voice, rate, pitch, format].join('|');
  return createHash('sha256').update(payload).digest('hex');
}
