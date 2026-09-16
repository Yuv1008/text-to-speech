import { insertHistory } from '../db/index.js';
import { getProvider, getProviderName } from '../services/tts/index.js';
import { audioFileExists, writeAudioFile } from '../utils/audioStore.js';
import { deleteCached, getCached, setCached } from '../utils/cache.js';
import { AppError } from '../utils/errors.js';
import { cacheKey } from '../utils/hash.js';
import { logger } from '../utils/logger.js';

const MIME_TO_EXT = { 'audio/wav': 'wav', 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3' };
const AUDIO_TTL_MINUTES = Number(process.env.AUDIO_TTL_MINUTES) || 30;

export async function postTts(req, res) {
  const { text, language, voice, rate, pitch, format } = req.body;
  const provider = getProvider();

  // Voice must belong to the submitted language — checked against whichever
  // provider is active, so a real provider's own catalog is authoritative in that mode.
  const voices = await provider.listVoices();
  const match = voices.find((v) => v.id === voice);
  if (!match) {
    throw new AppError('INVALID_VOICE', `"${voice}" is not a known voice.`, { field: 'voice' });
  }
  if (match.language !== language) {
    throw new AppError(
      'VOICE_LANGUAGE_MISMATCH',
      `Voice "${voice}" does not speak "${language}".`,
      { field: 'voice' },
    );
  }

  const key = cacheKey({ text, language, voice, rate, pitch, format });
  const cached = getCached(key);
  if (cached && (await audioFileExists(cached.filename))) {
    return res.status(200).json({
      success: true,
      audioUrl: cached.audioUrl,
      durationMs: cached.durationMs,
      cached: true,
      expiresAt: cached.expiresAt,
    });
  }
  if (cached) deleteCached(key); // stale pointer to a swept file

  let result;
  try {
    result = await provider.synthesize({ text, language, voice, rate, pitch });
  } catch (err) {
    if (err instanceof AppError) throw err;
    // An adapter threw something unexpected — never leak it, never fall back to mock.
    logger.error('provider synthesis failed', { provider: getProviderName(), error: err.message });
    throw new AppError('PROVIDER_UNAVAILABLE', 'The text-to-speech provider is unavailable.');
  }

  const ext = MIME_TO_EXT[result.mimeType] || format;
  const { filename, audioUrl } = await writeAudioFile(result.buffer, ext);
  const expiresAt = new Date(Date.now() + AUDIO_TTL_MINUTES * 60 * 1000).toISOString();

  setCached(key, { filename, audioUrl, durationMs: result.durationMs, expiresAt });
  insertHistory({ text, language, voice, filename });

  res.status(200).json({
    success: true,
    audioUrl,
    durationMs: result.durationMs,
    cached: false,
    expiresAt,
  });
}
