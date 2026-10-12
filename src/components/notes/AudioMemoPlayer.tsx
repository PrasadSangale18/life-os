import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioMemoPlayerProps {
  initialDuration?: string;
  className?: string;
}

export const AudioMemoPlayer: React.FC<AudioMemoPlayerProps> = ({
  initialDuration = '05:47',
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('00:00');
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          const next = prev + 1;
          const totalSec = 347; // 5:47 in seconds
          const curSec = Math.floor((next / 100) * totalSec);
          const m = String(Math.floor(curSec / 60)).padStart(2, '0');
          const s = String(curSec % 60).padStart(2, '0');
          setCurrentTime(`${m}:${s}`);
          return next;
        });
      }, 340);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlayback = () => {
    if (!isPlaying) {
      // Gentle synthetic ambient chime sound for audio feedback
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioCtxRef.current = ctx;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        }
      } catch {
        // AudioContext not allowed or disabled
      }
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  // 36 bars representing the audio waveform in media_1791719363063.png
  const waveformHeights = [
    8, 14, 20, 12, 18, 24, 16, 28, 22, 14, 26, 32, 
    20, 16, 28, 30, 18, 24, 12, 22, 28, 16, 20, 14, 
    24, 18, 30, 22, 16, 20, 14, 18, 12, 16, 10, 8
  ];

  return (
    <div 
      className={`audio-memo-player ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        borderRadius: 9999,
        background: '#191d28',
        color: '#ffffff',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
        userSelect: 'none'
      }}
    >
      {/* Circular Play / Pause Button */}
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={isPlaying ? 'Pause audio memo' : 'Play audio memo'}
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: '#ffffff',
          color: '#0f172a',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'transform 0.12s ease',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isPlaying ? (
          <Pause size={14} fill="#0f172a" />
        ) : (
          <Play size={14} fill="#0f172a" style={{ marginLeft: 2 }} />
        )}
      </button>

      {/* Waveform Visualizer */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          height: 32,
          overflow: 'hidden',
          cursor: 'pointer'
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const pct = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));
          setProgress(pct);
        }}
      >
        {waveformHeights.map((h, i) => {
          const barPct = (i / waveformHeights.length) * 100;
          const isPassed = barPct <= progress;
          return (
            <div
              key={i}
              style={{
                width: 2.5,
                height: isPlaying ? Math.max(6, Math.min(28, h + (Math.sin(progress + i) * 6))) : h * 0.7,
                borderRadius: 2,
                background: isPassed ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                transition: isPlaying ? 'height 0.15s ease' : 'background 0.15s ease'
              }}
            />
          );
        })}
      </div>

      {/* Timestamp Duration */}
      <div 
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 12,
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.85)',
          letterSpacing: '0.04em',
          flexShrink: 0
        }}
      >
        {isPlaying ? currentTime : initialDuration}
      </div>
    </div>
  );
};
