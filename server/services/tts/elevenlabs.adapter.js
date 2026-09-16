import { AppError } from '../../utils/errors.js';

const BASE_URL = 'https://api.elevenlabs.io/v1';

function requireApiKey() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    throw new AppError(
      'PROVIDER_AUTH_FAILED',
      'The text-to-speech provider is not configured correctly.',
    );
  }
  return key;
}

async function requestRaw(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    throw new AppError('PROVIDER_UNAVAILABLE', 'The text-to-speech provider is unreachable.', {
      details: err.message,
    });
  }

  if (response.status === 401 || response.status === 403) {
    const body = await response.text();
    throw new AppError(
      'PROVIDER_AUTH_FAILED',
      'The text-to-speech provider rejected the request credentials.',
      { details: body },
    );
  }
  if (!response.ok) {
    const body = await response.text();
    throw new AppError('PROVIDER_UNAVAILABLE', 'The text-to-speech provider is unavailable.', {
      details: body,
    });
  }
  return response;
}

// ElevenLabs has no direct pitch control; our -10..10 pitch is a no-op here,
// which is a documented limitation of this adapter (see README).
export async function synthesize({ text, voice, rate = 1.0 }) {
  const key = requireApiKey();
  const start = Date.now();

  const response = await requestRaw(`${BASE_URL}/text-to-speech/${voice}`, {
    method: 'POST',
    headers: {
      'xi-api-key': key,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        // ElevenLabs speed accepts roughly 0.7-1.2; clamp our wider 0.5-2.0 range into it.
        speed: Math.min(1.2, Math.max(0.7, rate)),
      },
    }),
  });

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: 'audio/mpeg',
    durationMs: Date.now() - start,
  };
}

export async function listVoices() {
  const key = requireApiKey();
  const response = await requestRaw(`${BASE_URL}/voices`, {
    headers: { 'xi-api-key': key },
  });
  const data = await response.json();

  return (data.voices || []).map((v) => ({
    id: v.voice_id,
    name: v.name,
    // ElevenLabs voices don't reliably self-report a language; default unlabeled
    // ones to en-US rather than omitting the field the contract requires.
    language: v.labels?.language || v.fine_tuning?.language || 'en-US',
    gender: v.labels?.gender || 'neutral',
  }));
}
