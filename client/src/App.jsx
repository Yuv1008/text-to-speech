import { useEffect, useState } from 'react';
import AudioPlayer from './components/AudioPlayer.jsx';
import ControlSliders from './components/ControlSliders.jsx';
import DownloadButton from './components/DownloadButton.jsx';
import ErrorMessage from './components/ErrorMessage.jsx';
import GenerateButton from './components/GenerateButton.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';
import LanguageSelector from './components/LanguageSelector.jsx';
import TextInput from './components/TextInput.jsx';
import { ToastProvider, useToast } from './components/Toast.jsx';
import VoiceSelector from './components/VoiceSelector.jsx';
import { useHistory } from './hooks/useHistory.js';
import { useTTS } from './hooks/useTTS.js';
import { useVoices } from './hooks/useVoices.js';
import { toAudioSrc } from './services/api.js';
import './App.css';

function AppShell() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [voice, setVoice] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [playback, setPlayback] = useState(null); // { src, text }

  const { voices, status: voicesStatus } = useVoices(language);
  const tts = useTTS();
  const history = useHistory(20);
  const { show } = useToast();

  // Keep the selected voice valid for the current language. Deliberately doesn't
  // depend on `voice` itself — it only needs to react when the voice *list*
  // changes (a language switch or an initial load), not every user pick,
  // otherwise a replay that sets language+voice together would immediately
  // stomp the voice it just set.
  useEffect(() => {
    if (voicesStatus !== 'success') return;
    const stillValid = voices.some((v) => v.id === voice);
    if (!stillValid) setVoice(voices[0]?.id || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voicesStatus, voices]);

  const trimmedLength = text.trim().length;
  const canGenerate = trimmedLength > 0 && text.length <= 1000 && Boolean(voice) && tts.status !== 'loading';

  async function handleGenerate() {
    try {
      const data = await tts.generate({ text, language, voice, rate, pitch, format: 'mp3' });
      if (!data) return; // request was superseded/aborted
      setPlayback({ src: toAudioSrc(data.audioUrl), text });
      show(data.cached ? 'Loaded from cache' : 'Speech generated', { type: 'success' });
      history.refresh();
    } catch {
      // tts.error already carries the details; ErrorMessage below renders it.
    }
  }

  function handleReplay(item) {
    setText(item.textPreview);
    setLanguage(item.language);
    setVoice(item.voice);
    setPlayback({ src: toAudioSrc(item.audioUrl), text: item.textPreview });
  }

  async function handleDeleteHistory(id) {
    const item = history.items.find((i) => i.id === id);
    await history.deleteOne(id);
    if (item && playback && toAudioSrc(item.audioUrl) === playback.src) {
      setPlayback(null);
    }
  }

  async function handleClearHistory() {
    await history.clearAll();
    setPlayback(null);
  }

  const statusAnnouncement =
    tts.status === 'loading'
      ? 'Generating speech…'
      : tts.status === 'success'
        ? 'Speech generated.'
        : tts.status === 'error'
          ? `Error: ${tts.error?.message || 'generation failed'}`
          : '';

  return (
    <div className="app-shell">
      <span className="visually-hidden" role="status" aria-live="polite">
        {statusAnnouncement}
      </span>

      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 6.5h2L7 3v10L4 9.5H2v-3z"
                fill="currentColor"
              />
              <path
                d="M9.5 5.3a4 4 0 010 5.4M11.3 3.5a6.6 6.6 0 010 9"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </span>
          <h1>Text to Speech</h1>
        </div>
        <p>Type or paste text, pick a language and voice, shape the delivery, and listen.</p>
      </header>

      <div className="app-grid">
        <section className="generator-card" aria-label="Speech generator">
          <TextInput value={text} onChange={setText} />

          <div className="field-row">
            <LanguageSelector value={language} onChange={setLanguage} />
            <VoiceSelector voices={voices} status={voicesStatus} value={voice} onChange={setVoice} />
          </div>

          <ControlSliders rate={rate} pitch={pitch} onRateChange={setRate} onPitchChange={setPitch} />

          <GenerateButton disabled={!canGenerate} loading={tts.status === 'loading'} onClick={handleGenerate} />

          {tts.status === 'error' && <ErrorMessage error={tts.error} onRetry={handleGenerate} />}

          {playback?.src && (
            <div className="result-section">
              <AudioPlayer src={playback.src} label={playback.text.slice(0, 40)} />
              <div className="result-actions">
                <DownloadButton src={playback.src} text={playback.text} />
              </div>
            </div>
          )}
        </section>

        <aside className="history-card">
          <HistoryPanel
            items={history.items}
            status={history.status}
            activeId={history.items.find((i) => playback && toAudioSrc(i.audioUrl) === playback.src)?.id}
            onReplay={handleReplay}
            onDelete={handleDeleteHistory}
            onClearAll={handleClearHistory}
          />
        </aside>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  );
}
