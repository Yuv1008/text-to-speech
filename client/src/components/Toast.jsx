import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import './Toast.css';

const ToastContext = createContext(null);
const MAX_VISIBLE = 3;

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (message, { type = 'info', durationMs = 4000 } = {}) => {
      const id = nextId++;
      setToasts((prev) => {
        const next = [...prev, { id, message, type }];
        if (next.length <= MAX_VISIBLE) return next;
        // Bursts (rapid retries, repeated cache hits) shouldn't pile the stack up
        // indefinitely — drop the oldest and clear its now-pointless timer.
        const overflow = next.slice(0, next.length - MAX_VISIBLE);
        overflow.forEach((t) => {
          clearTimeout(timers.current.get(t.id));
          timers.current.delete(t.id);
        });
        return next.slice(next.length - MAX_VISIBLE);
      });
      const timer = setTimeout(() => dismiss(id), durationMs);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span>{t.message}</span>
            <button
              type="button"
              className="toast__close"
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
