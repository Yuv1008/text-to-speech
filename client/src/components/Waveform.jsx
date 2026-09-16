import { useEffect, useRef } from 'react';
import './Waveform.css';

const BAR_COUNT = 32;

export default function Waveform({ analyserRef, isPlaying }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    ctx.scale(dpr, dpr);

    const gradient = ctx.createLinearGradient(0, 0, cssWidth, 0);
    gradient.addColorStop(0, '#ff4f8b');
    gradient.addColorStop(1, '#6a5bff');

    const barWidth = cssWidth / BAR_COUNT;
    const freqData = new Uint8Array(64);

    function drawBars(heights) {
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      ctx.fillStyle = gradient;
      heights.forEach((h, i) => {
        const barHeight = Math.max(3, h * cssHeight);
        const x = i * barWidth + barWidth * 0.22;
        const w = barWidth * 0.56;
        const y = (cssHeight - barHeight) / 2;
        const radius = Math.min(w / 2, 3);
        ctx.beginPath();
        ctx.roundRect(x, y, w, barHeight, radius);
        ctx.fill();
      });
    }

    function idleFrame() {
      phaseRef.current += 0.05;
      const heights = Array.from({ length: BAR_COUNT }, (_, i) =>
        reduceMotion ? 0.08 : 0.06 + 0.05 * Math.abs(Math.sin(phaseRef.current + i * 0.35)),
      );
      drawBars(heights);
      if (!reduceMotion) rafRef.current = requestAnimationFrame(idleFrame);
    }

    function playingFrame() {
      const analyser = analyserRef.current;
      if (analyser) {
        analyser.getByteFrequencyData(freqData);
        const step = Math.floor(freqData.length / BAR_COUNT);
        const heights = Array.from({ length: BAR_COUNT }, (_, i) => {
          const v = freqData[i * step] / 255;
          return 0.05 + v * 0.9;
        });
        drawBars(heights);
      } else {
        // No analyser available (unsupported browser) — a gentle ambient pulse
        // still communicates "playing" instead of a dead, static bar.
        phaseRef.current += 0.15;
        const heights = Array.from({ length: BAR_COUNT }, (_, i) =>
          0.15 + 0.35 * Math.abs(Math.sin(phaseRef.current + i * 0.4)),
        );
        drawBars(heights);
      }
      rafRef.current = requestAnimationFrame(playingFrame);
    }

    cancelAnimationFrame(rafRef.current);
    if (isPlaying) {
      playingFrame();
    } else {
      idleFrame();
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, analyserRef]);

  return <canvas ref={canvasRef} className="waveform" aria-hidden="true" />;
}
