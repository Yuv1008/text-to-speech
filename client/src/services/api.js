import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

// The server returns audio URLs relative to its own origin ("/audio/<id>.wav"),
// not under /api — strip the /api suffix to get that origin for playback/download.
export const API_ORIGIN = baseURL.replace(/\/api\/?$/, '');

export function toAudioSrc(audioUrl) {
  if (!audioUrl) return null;
  return `${API_ORIGIN}${audioUrl}`;
}

export const api = axios.create({
  baseURL,
  timeout: 20_000, // mock has ~800ms simulated latency; real providers can take longer
});

/**
 * Normalizes any axios failure into the app's own error shape, whether it came
 * from the server ({ success:false, error:{code,message,field} }), a client-side
 * abort, or the network never reaching the server at all.
 */
function normalizeError(error) {
  if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
    return { kind: 'aborted', code: 'ABORTED', message: 'Request was cancelled.' };
  }

  const serverError = error.response?.data?.error;
  if (serverError) {
    return {
      kind: 'server',
      code: serverError.code,
      message: serverError.message,
      field: serverError.field,
      status: error.response.status,
      retryAfter: serverError.retryAfter,
    };
  }

  if (error.request) {
    return {
      kind: 'network',
      code: 'NETWORK_ERROR',
      message: 'Could not reach the server. Check your connection and try again.',
    };
  }

  return { kind: 'client', code: 'CLIENT_ERROR', message: error.message || 'Something went wrong.' };
}

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeError(error)),
);
