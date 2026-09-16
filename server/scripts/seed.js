// Populates a few realistic history rows (with real, playable audio files behind
// them) so the app has something to show on first run. Uses the mock adapter
// directly — it doesn't need the server running, and never touches a real
// provider or key regardless of TTS_PROVIDER.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { insertHistory } = await import('../db/index.js');
const { synthesize } = await import('../services/tts/mock.adapter.js');
const { writeAudioFile } = await import('../utils/audioStore.js');

const SEED_ITEMS = [
  {
    text: 'Welcome back. Your last three generations are saved right here in history.',
    language: 'en-US',
    voice: 'ava',
  },
  {
    text: "Good afternoon — this is a demonstration of the British English voice, Oliver.",
    language: 'en-GB',
    voice: 'oliver',
  },
  {
    text: 'नमस्ते, यह हिंदी आवाज़ का एक उदाहरण है।',
    language: 'hi-IN',
    voice: 'ananya',
  },
  {
    text: 'Bonjour et bienvenue dans votre application de synthèse vocale.',
    language: 'fr-FR',
    voice: 'emile',
  },
  {
    text: 'Guten Tag! Dies ist ein Beispiel für die deutsche Stimme Klara.',
    language: 'de-DE',
    voice: 'klara',
  },
];

async function seed() {
  console.log(`Seeding ${SEED_ITEMS.length} demo history entries…`);

  for (const item of SEED_ITEMS) {
    const result = await synthesize({ ...item, rate: 1, pitch: 0 });
    const { filename } = await writeAudioFile(result.buffer, 'wav');
    insertHistory({ text: item.text, language: item.language, voice: item.voice, filename });
    console.log(`  ✓ [${item.language}] ${item.text.slice(0, 50)}…`);
  }

  console.log('Done. Start the app and check the History panel.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exitCode = 1;
});
