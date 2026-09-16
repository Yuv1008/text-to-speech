import { LANGUAGES } from '../services/languages.js';
import './HistoryPanel.css';

function languageLabel(code) {
  return LANGUAGES.find((l) => l.code === code)?.label || code;
}

function relativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function HistoryPanel({ items, status, activeId, onReplay, onDelete, onClearAll }) {
  return (
    <section className="history-panel" aria-label="Generation history">
      <div className="history-panel__head">
        <h2>History</h2>
        {items.length > 0 && (
          <button type="button" className="history-panel__clear" onClick={onClearAll}>
            Clear all
          </button>
        )}
      </div>

      {status === 'loading' && (
        <div className="history-panel__list" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="history-item history-item--skeleton" />
          ))}
        </div>
      )}

      {status === 'success' && items.length === 0 && (
        <p className="history-panel__empty">
          Generated clips will show up here — click one any time to play it again.
        </p>
      )}

      {status === 'success' && items.length > 0 && (
        <ul className="history-panel__list">
          {items.map((item) => (
            <li key={item.id} className={`history-item${item.id === activeId ? ' is-active' : ''}`}>
              <button
                type="button"
                className="history-item__main"
                onClick={() => onReplay(item)}
                aria-label={`Replay: ${item.textPreview}`}
              >
                <span className="history-item__play" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 2.5v11l9-5.5-9-5.5z" />
                  </svg>
                </span>
                <span className="history-item__text">
                  <span className="history-item__preview">{item.textPreview}</span>
                  <span className="history-item__meta">
                    {languageLabel(item.language)} · {item.voice} · {relativeTime(item.createdAt)}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="history-item__delete"
                aria-label="Delete this entry"
                onClick={() => onDelete(item.id)}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M3 4.5h10M6.5 4.5V3a1 1 0 011-1h1a1 1 0 011 1v1.5M4.5 4.5l.6 8.2a1 1 0 001 .93h3.8a1 1 0 001-.93l.6-8.2"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
