import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(__dirname, '..');

export const AUDIO_DIR = path.resolve(SERVER_ROOT, process.env.AUDIO_DIR || './tmp/audio');

export async function ensureAudioDir() {
  await fs.mkdir(AUDIO_DIR, { recursive: true });
}

/**
 * Writes a synthesized audio buffer to disk under a fresh uuid filename.
 * Returns the filename (not full path) and the public URL the client fetches it from.
 */
export async function writeAudioFile(buffer, format) {
  await ensureAudioDir();
  const filename = `${randomUUID()}.${format}`;
  await fs.writeFile(path.join(AUDIO_DIR, filename), buffer);
  return { filename, audioUrl: `/audio/${filename}` };
}

export function audioFilePath(filename) {
  return path.join(AUDIO_DIR, filename);
}

export async function audioFileExists(filename) {
  try {
    await fs.access(audioFilePath(filename));
    return true;
  } catch {
    return false;
  }
}

export async function deleteAudioFile(filename) {
  try {
    await fs.unlink(audioFilePath(filename));
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

/** Lists every audio file currently on disk with its last-modified time. */
export async function listAudioFiles() {
  await ensureAudioDir();
  const names = await fs.readdir(AUDIO_DIR);
  const files = await Promise.all(
    names
      .filter((name) => name !== '.gitkeep')
      .map(async (name) => {
        const stat = await fs.stat(path.join(AUDIO_DIR, name));
        return { filename: name, mtimeMs: stat.mtimeMs };
      }),
  );
  return files;
}
