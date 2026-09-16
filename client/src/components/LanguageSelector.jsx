import { useEffect, useRef, useState } from 'react';
import { LANGUAGES } from '../services/languages.js';
import './LanguageSelector.css';

/** Custom, fully keyboard-navigable dropdown (arrow keys, Home/End, Enter/Space, Escape). */
export default function LanguageSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(LANGUAGES.findIndex((l) => l.code === value), 0),
  );
  const rootRef = useRef(null);
  const optionRefs = useRef([]);

  const selected = LANGUAGES.find((l) => l.code === value) || LANGUAGES[0];

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  function commit(index) {
    const lang = LANGUAGES[index];
    if (lang) onChange(lang.code);
    setOpen(false);
  }

  function onTriggerKeyDown(e) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveIndex(Math.max(LANGUAGES.findIndex((l) => l.code === value), 0));
      setOpen(true);
    }
  }

  function onOptionKeyDown(e, index) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((index + 1) % LANGUAGES.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((index - 1 + LANGUAGES.length) % LANGUAGES.length);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(LANGUAGES.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        commit(index);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        rootRef.current?.querySelector('.language-selector__trigger')?.focus();
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  }

  return (
    <div className="language-selector" ref={rootRef}>
      <span className="language-selector__label" id="language-label">
        Language
      </span>
      <button
        type="button"
        className="language-selector__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="language-label"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
      >
        <span>{selected.label}</span>
        <svg
          className={`language-selector__chevron${open ? ' language-selector__chevron--open' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <ul className="language-selector__listbox" role="listbox" aria-labelledby="language-label">
          {LANGUAGES.map((lang, index) => (
            <li
              key={lang.code}
              ref={(el) => (optionRefs.current[index] = el)}
              role="option"
              aria-selected={lang.code === value}
              tabIndex={-1}
              className={`language-selector__option${
                lang.code === value ? ' language-selector__option--selected' : ''
              }`}
              onClick={() => commit(index)}
              onKeyDown={(e) => onOptionKeyDown(e, index)}
            >
              {lang.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
