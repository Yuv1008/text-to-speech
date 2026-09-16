import { useMemo } from 'react';
import './TextInput.css';

const MAX_LENGTH = 1000; // mirrors the server's default MAX_TEXT_LENGTH; server is authoritative
const WARNING_RATIO = 0.8;

function countWords(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export default function TextInput({ value, onChange }) {
  const length = value.length;
  const words = useMemo(() => countWords(value), [value]);
  const ratio = length / MAX_LENGTH;
  const atCap = length >= MAX_LENGTH;
  const warning = !atCap && ratio >= WARNING_RATIO;

  return (
    <div className="text-input">
      <div className="text-input__head">
        <label htmlFor="tts-text" className="text-input__label">
          Text to speak
        </label>
        {value.length > 0 && (
          <button
            type="button"
            className="text-input__clear"
            onClick={() => onChange('')}
            aria-label="Clear text"
          >
            Clear
          </button>
        )}
      </div>

      <textarea
        id="tts-text"
        className="text-input__field"
        placeholder="Type or paste what you'd like to hear…"
        value={value}
        maxLength={MAX_LENGTH}
        rows={6}
        onChange={(e) => onChange(e.target.value)}
      />

      <div
        className={`text-input__meta${warning ? ' text-input__meta--warning' : ''}${
          atCap ? ' text-input__meta--cap' : ''
        }`}
      >
        <span>{words} word{words === 1 ? '' : 's'}</span>
        <span aria-live="polite">
          {length} / {MAX_LENGTH}
        </span>
      </div>
    </div>
  );
}
