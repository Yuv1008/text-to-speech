// In-memory synthesis cache, keyed by sha256(text|language|voice|rate|pitch|format).
// Ephemeral by design — it lives exactly as long as the audio files it points to
// (see janitor.js), so a restart or a swept file both simply produce a cache miss.
const store = new Map();

export function getCached(key) {
  return store.get(key);
}

export function setCached(key, value) {
  store.set(key, value);
}

export function deleteCached(key) {
  store.delete(key);
}

/** Drops every cache entry pointing at a given filename (used when the janitor sweeps it). */
export function invalidateByFilename(filename) {
  for (const [key, value] of store.entries()) {
    if (value.filename === filename) store.delete(key);
  }
}
