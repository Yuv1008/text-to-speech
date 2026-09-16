// Every error code from the API contract, mapped to its HTTP status.
export const ERROR_STATUS = {
  EMPTY_TEXT: 400,
  TEXT_TOO_LONG: 400,
  UNSUPPORTED_LANGUAGE: 400,
  INVALID_VOICE: 400,
  VOICE_LANGUAGE_MISMATCH: 400,
  INVALID_RATE: 400,
  INVALID_PITCH: 400,
  RATE_LIMITED: 429,
  PROVIDER_AUTH_FAILED: 401,
  PROVIDER_UNAVAILABLE: 503,
  INTERNAL: 500,
  // Not part of the TTS error vocabulary, but needed for unmatched routes and
  // missing history rows — still rendered through the same { success:false, error } shape.
  NOT_FOUND: 404,
};

export class AppError extends Error {
  constructor(code, message, { field, details } = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = ERROR_STATUS[code] || 500;
    this.field = field;
    this.details = details; // server-side only, never serialized to the client
  }
}
