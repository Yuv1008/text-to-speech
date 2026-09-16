import { VOICES, findVoice } from './voices.catalog.js';

const SAMPLE_RATE = 22050;
const SIMULATED_LATENCY_MS = 800;

/** Deterministic base tone (Hz) per voice, so different voices are audibly different. */
function baseFrequency(voiceId) {
  let hash = 0;
  for (const char of voiceId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  // Spread voices across a pleasant, clearly-distinguishable range.
  return 160 + (hash % 22) * 18;
}

/** Semitone-style pitch shift, mapped from the -10..10 control range. */
function applyPitch(freqHz, pitch) {
  return freqHz * Math.pow(2, pitch / 12);
}

function textToDurationMs(text, rate) {
  const base = 400 + Math.min(text.length, 400) * 35;
  return Math.round(Math.min(Math.max(base, 600), 9000) / rate);
}

/** Builds a mono 16-bit PCM WAV buffer: a speech-like tone with a soft envelope
 *  and light amplitude wobble so it doesn't sound like a flat test-tone beep. */
function synthesizeTone({ freqHz, durationMs }) {
  const sampleCount = Math.round((durationMs / 1000) * SAMPLE_RATE);
  const samples = new Int16Array(sampleCount);
  const fadeSamples = Math.min(Math.round(SAMPLE_RATE * 0.02), Math.floor(sampleCount / 4));

  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    const wobble = 1 + 0.06 * Math.sin(2 * Math.PI * 5.5 * t); // light vibrato
    const tone =
      Math.sin(2 * Math.PI * freqHz * wobble * t) * 0.6 +
      Math.sin(2 * Math.PI * freqHz * 2 * wobble * t) * 0.15; // a soft harmonic

    let envelope = 1;
    if (i < fadeSamples) envelope = i / fadeSamples;
    else if (i > sampleCount - fadeSamples) envelope = (sampleCount - i) / fadeSamples;

    samples[i] = Math.max(-1, Math.min(1, tone * envelope)) * 0.85 * 32767;
  }
  return samples;
}

function encodeWav(samples, sampleRate) {
  const blockAlign = 2; // 16-bit mono
  const dataSize = samples.length * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * blockAlign, 28); // byte rate
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(samples[i], 44 + i * 2);
  }
  return buffer;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function synthesize({ text, voice, rate = 1.0, pitch = 0 }) {
  await sleep(SIMULATED_LATENCY_MS);

  const meta = findVoice(voice);
  const freqHz = applyPitch(baseFrequency(meta ? meta.id : voice), pitch);
  const durationMs = textToDurationMs(text, rate);
  const samples = synthesizeTone({ freqHz, durationMs });
  const buffer = encodeWav(samples, SAMPLE_RATE);

  return { buffer, mimeType: 'audio/wav', durationMs };
}

export async function listVoices() {
  return VOICES;
}
