import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api.js';

/** Drives POST /api/tts. Exposes idle/loading/success/error explicitly and aborts
 *  a stale request if a new one is fired (or the component unmounts) before it resolves. */
export function useTTS() {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const generate = useCallback(async (payload) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setStatus('loading');
    setError(null);

    try {
      const res = await api.post('/tts', payload, { signal: controller.signal });
      setResult(res.data);
      setStatus('success');
      return res.data;
    } catch (err) {
      if (err.kind === 'aborted') return undefined;
      setError(err);
      setStatus('error');
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, generate, reset };
}
