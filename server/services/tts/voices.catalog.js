// Static catalog backing the mock provider and the language/voice validation rules.
// Real providers (google, elevenlabs) ignore this and report their own voices instead.

export const SUPPORTED_LANGUAGES = [
  'en-US',
  'en-GB',
  'hi-IN',
  'gu-IN',
  'mr-IN',
  'pa-IN',
  'es-ES',
  'fr-FR',
  'de-DE',
];

export const VOICES = [
  { id: 'ava', name: 'Ava', language: 'en-US', gender: 'female' },
  { id: 'miles', name: 'Miles', language: 'en-US', gender: 'male' },
  { id: 'freya', name: 'Freya', language: 'en-GB', gender: 'female' },
  { id: 'oliver', name: 'Oliver', language: 'en-GB', gender: 'male' },
  { id: 'ananya', name: 'Ananya', language: 'hi-IN', gender: 'female' },
  { id: 'rohan', name: 'Rohan', language: 'hi-IN', gender: 'male' },
  { id: 'meera', name: 'Meera', language: 'gu-IN', gender: 'female' },
  { id: 'aditi', name: 'Aditi', language: 'mr-IN', gender: 'female' },
  { id: 'simran', name: 'Simran', language: 'pa-IN', gender: 'female' },
  { id: 'lucia', name: 'Lucía', language: 'es-ES', gender: 'female' },
  { id: 'emile', name: 'Émile', language: 'fr-FR', gender: 'male' },
  { id: 'klara', name: 'Klara', language: 'de-DE', gender: 'female' },
];

export function listVoices(language) {
  if (!language) return VOICES;
  return VOICES.filter((v) => v.language === language);
}

export function findVoice(id) {
  return VOICES.find((v) => v.id === id);
}
