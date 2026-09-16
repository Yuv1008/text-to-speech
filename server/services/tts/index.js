import * as elevenlabsAdapter from './elevenlabs.adapter.js';
import * as googleAdapter from './google.adapter.js';
import * as mockAdapter from './mock.adapter.js';

// Every adapter implements { synthesize, listVoices }. Adding a 4th provider
// means writing its own adapter file and adding one line here — nothing else changes.
const ADAPTERS = {
  mock: mockAdapter,
  google: googleAdapter,
  elevenlabs: elevenlabsAdapter,
};

export function getProvider() {
  const name = process.env.TTS_PROVIDER || 'mock';
  const adapter = ADAPTERS[name];
  if (!adapter) {
    throw new Error(`Unknown TTS_PROVIDER "${name}". Valid options: ${Object.keys(ADAPTERS)}`);
  }
  return adapter;
}

export function getProviderName() {
  return process.env.TTS_PROVIDER || 'mock';
}
