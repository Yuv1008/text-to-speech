import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';

export function useHistory(limit = 20) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [error, setError] = useState(null);

  const refresh = useCallback(
    async (signal) => {
      setStatus('loading');
      setError(null);
      try {
        const res = await api.get('/history', { params: { limit }, signal });
        setItems(res.data.items);
        setStatus('success');
      } catch (err) {
        if (err.kind === 'aborted') return;
        setError(err);
        setStatus('error');
      }
    },
    [limit],
  );

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const deleteOne = useCallback(async (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id)); // optimistic
    try {
      await api.delete(`/history/${id}`);
    } catch {
      refresh(); // fell out of sync — resync with the server
    }
  }, [refresh]);

  const clearAll = useCallback(async () => {
    const previous = items;
    setItems([]);
    try {
      await api.delete('/history');
    } catch {
      setItems(previous);
    }
  }, [items]);

  return { items, status, error, refresh, deleteOne, clearAll };
}
