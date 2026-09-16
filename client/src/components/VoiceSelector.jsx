import { LANGUAGES } from '../services/languages.js';
import './VoiceSelector.css';

function languageLabel(code) {
  return LANGUAGES.find((l) => l.code === code)?.label || code;
}

export default function VoiceSelector({ voices, status, value, onChange }) {
  return (
    <fieldset className="voice-selector" disabled={status === 'loading'}>
      <legend className="voice-selector__label">Voice</legend>

      {status === 'loading' && (
        <div className="voice-selector__grid" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="voice-card voice-card--skeleton" />
          ))}
        </div>
      )}

      {status === 'success' && voices.length === 0 && (
        <p className="voice-selector__empty">No voices for this language yet.</p>
      )}

      {status === 'success' && voices.length > 0 && (
        <div className="voice-selector__grid" role="radiogroup" aria-label="Voice">
          {voices.map((voice) => (
            <label
              key={voice.id}
              className={`voice-card${voice.id === value ? ' voice-card--selected' : ''}`}
            >
              <input
                type="radio"
                name="voice"
                value={voice.id}
                checked={voice.id === value}
                onChange={() => onChange(voice.id)}
                className="voice-card__input"
              />
              <span className="voice-card__name">{voice.name}</span>
              <span className="voice-card__badges">
                <span className={`badge badge--${voice.gender}`}>{voice.gender}</span>
                <span className="badge badge--muted">{languageLabel(voice.language)}</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}
