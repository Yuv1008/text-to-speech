import { AppError } from '../../utils/errors.js';

const BASE_URL = 'https://texttospeech.googleapis.com/v1';

function requireApiKey() {
  const key = process.env.GOOGLE_TTS_API_KEY;
  if (!key) {
    throw new AppError(
      'PROVIDER_AUTH_FAILED',
      'The text-to-speech provider is not configured correctly.',
    );
  }
  return key;
}

/** Rethrows any google-tts failure as the two client-safe codes the contract allows. */
async function requestJson(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    throw new AppError('PROVIDER_UNAVAILABLE', 'The text-to-speech provider is unreachable.', {
      details: err.message,
    });
  }

  if (response.status === 400 || response.status === 401 || response.status === 403) {
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
  return response.json();
}

export async function synthesize({ text, language, voice, rate = 1.0, pitch = 0 }) {
  const key = requireApiKey();
  const start = Date.now();

  const data = await requestJson(`${BASE_URL}/text:synthesize?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: language, name: voice },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: rate,
        pitch,
      },
    }),
  });

  if (!data.audioContent) {
    throw new AppError('PROVIDER_UNAVAILABLE', 'The text-to-speech provider returned no audio.');
  }

  return {
    buffer: Buffer.from(data.audioContent, 'base64'),
    mimeType: 'audio/mpeg',
    durationMs: Date.now() - start,
  };
}

export async function listVoices() {
  const key = requireApiKey();
  const data = await requestJson(`${BASE_URL}/voices?key=${key}`, { method: 'GET' });

  return (data.voices || []).flatMap((v) =>
    (v.languageCodes || []).map((language) => ({
      id: v.name,
      name: v.name,
      language,
      gender: (v.ssmlGender || 'neutral').toLowerCase(),
    })),
  );
}
