import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Wraps a hidden <audio> element with the state and controls the custom AudioPlayer
 * UI needs, plus a shared Web Audio AnalyserNode so Waveform can react to playback.
 * The AnalyserNode is created lazily on first play — browsers require a user
 * gesture before an AudioContext can run.
 */
export function useAudioPlayer(src) {
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [isReady, setIsReady] = useState(false);

  // New source: reset transport state; the <audio> element picks up the new `src` itself.
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsReady(false);
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setIsReady(true);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const ensureAnalyser = useCallback(() => {
    if (analyserRef.current || !audioRef.current) return analyserRef.current;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(audioRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      sourceNodeRef.current = source;
      analyserRef.current = analyser;
    } catch {
      // Web Audio unavailable — Waveform will fall back to an idle/ambient animation.
      analyserRef.current = null;
    }
    return analyserRef.current;
  }, []);

  const play = useCallback(async () => {
    ensureAnalyser();
    if (audioCtxRef.current?.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    await audioRef.current?.play();
  }, [ensureAnalyser]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const seek = useCallback((time) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const changeVolume = useCallback((next) => {
    if (!audioRef.current) return;
    audioRef.current.volume = next;
    audioRef.current.muted = next === 0;
    setVolumeState(next);
    setMuted(next === 0);
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const next = !muted;
    audioRef.current.muted = next;
    setMuted(next);
  }, [muted]);

  const changePlaybackRate = useCallback((rate) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRateState(rate);
  }, []);

  // Clean up the AudioContext when this player instance goes away.
  useEffect(
    () => () => {
      sourceNodeRef.current?.disconnect();
      analyserRef.current?.disconnect();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    },
    [],
  );

  return useMemo(
    () => ({
      audioRef,
      analyserRef,
      isPlaying,
      isReady,
      currentTime,
      duration,
      volume,
      muted,
      playbackRate,
      play,
      pause,
      toggle,
      seek,
      setVolume: changeVolume,
      toggleMute,
      setPlaybackRate: changePlaybackRate,
    }),
    [
      isPlaying,
      isReady,
      currentTime,
      duration,
      volume,
      muted,
      playbackRate,
      play,
      pause,
      toggle,
      seek,
      changeVolume,
      toggleMute,
      changePlaybackRate,
    ],
  );
}
