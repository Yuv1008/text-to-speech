import { deleteAudioFile, listAudioFiles } from './audioStore.js';
import { invalidateByFilename } from './cache.js';
import { logger } from './logger.js';

/**
 * Deletes any generated audio file older than AUDIO_TTL_MINUTES. Runs once
 * immediately, then on a fixed interval (JANITOR_INTERVAL_MINUTES).
 */
export function startJanitor() {
  const ttlMs = (Number(process.env.AUDIO_TTL_MINUTES) || 30) * 60 * 1000;
  const intervalMs = (Number(process.env.JANITOR_INTERVAL_MINUTES) || 5) * 60 * 1000;

  async function sweep() {
    try {
      const files = await listAudioFiles();
      const now = Date.now();
      const expired = files.filter((f) => now - f.mtimeMs > ttlMs);
      await Promise.all(
        expired.map(async (f) => {
          await deleteAudioFile(f.filename);
          invalidateByFilename(f.filename);
        }),
      );
      if (expired.length > 0) {
        logger.info('janitor sweep', { deleted: expired.length });
      }
    } catch (err) {
      logger.error('janitor sweep failed', { error: err.message });
    }
  }

  sweep();
  const timer = setInterval(sweep, intervalMs);
  timer.unref();
  return timer;
}
