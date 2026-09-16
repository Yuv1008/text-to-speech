import { useEffect, useState } from 'react';
import { api } from '../services/api.js';

/** Fetches the voice catalog for a language. Refetches when the language changes,
 *  and aborts any in-flight request on unmount or before a new one starts. */
export function useVoices(language) {
  const [voices, setVoices] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!language) {
      setVoices([]);
      setStatus('success');
      return undefined;
    }

    const controller = new AbortController();
    setStatus('loading');
    setError(null);

    api
      .get('/voices', { params: { language }, signal: controller.signal })
      .then((res) => {
        setVoices(res.data.voices);
        setStatus('success');
      })
      .catch((err) => {
        if (err.kind === 'aborted') return;
        setError(err);
        setStatus('error');
      });

    return () => controller.abort();
  }, [language]);

  return { voices, status, error };
}
