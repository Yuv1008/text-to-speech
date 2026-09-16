import { useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer.js';
import Waveform from './Waveform.jsx';
import './AudioPlayer.css';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AudioPlayer({ src, label }) {
  const player = useAudioPlayer(src);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const speedMenuRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target)) {
        setSpeedMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (!src) return null;

  const progress = player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0;

  return (
    <div className="audio-player">
      <audio ref={player.audioRef} src={src} preload="metadata" crossOrigin="anonymous" />

      <Waveform analyserRef={player.analyserRef} isPlaying={player.isPlaying} />

      <div className="audio-player__row">
        <button
          type="button"
          className="audio-player__play"
          onClick={player.toggle}
          aria-label={player.isPlaying ? `Pause ${label}` : `Play ${label}`}
        >
          {player.isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="4" height="12" rx="1" />
              <rect x="9" y="2" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2.5v11l9-5.5-9-5.5z" />
            </svg>
          )}
        </button>

        <span className="audio-player__time">{formatTime(player.currentTime)}</span>

        <input
          type="range"
          className="audio-player__scrubber"
          min={0}
          max={player.duration || 0}
          step={0.01}
          value={player.currentTime}
          onChange={(e) => player.seek(Number(e.target.value))}
          style={{ '--progress': `${progress}%` }}
          aria-label="Seek"
        />

        <span className="audio-player__time">{formatTime(player.duration)}</span>

        <div className="audio-player__speed" ref={speedMenuRef}>
          <button
            type="button"
            className="audio-player__chip"
            onClick={() => setSpeedMenuOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={speedMenuOpen}
          >
            {player.playbackRate}×
          </button>
          {speedMenuOpen && (
            <ul className="audio-player__speed-menu" role="listbox" aria-label="Playback speed">
              {SPEEDS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={s === player.playbackRate}
                    className={s === player.playbackRate ? 'is-selected' : ''}
                    onClick={() => {
                      player.setPlaybackRate(s);
                      setSpeedMenuOpen(false);
                    }}
                  >
                    {s}×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="audio-player__volume">
          <button
            type="button"
            className="audio-player__icon-btn"
            onClick={player.toggleMute}
            aria-label={player.muted ? 'Unmute' : 'Mute'}
          >
            {player.muted || player.volume === 0 ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 6h2.5L8 3v10L4.5 10H2V6z" />
                <path
                  d="M10.5 5.5l4 4M14.5 5.5l-4 4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 6h2.5L8 3v10L4.5 10H2V6z" />
                <path
                  d="M10.5 5.2a4 4 0 010 5.6M12.3 3.5a6.5 6.5 0 010 9"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            )}
          </button>
          <input
            type="range"
            className="audio-player__volume-slider"
            min={0}
            max={1}
            step={0.01}
            value={player.muted ? 0 : player.volume}
            onChange={(e) => player.setVolume(Number(e.target.value))}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
