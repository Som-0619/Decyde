'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface CircularTimerProps {
  createdAt: string;
  durationSeconds: number;
  isClosed: boolean;
  onExpire?: () => void;
  size?: number;
}

export default function CircularTimer({
  createdAt,
  durationSeconds,
  isClosed,
  onExpire,
  size = 64,
}: CircularTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(durationSeconds);
  const hasExpiredRef = useRef(false);

  const radius = 24;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (isClosed) {
      setSecondsRemaining(0);
      return;
    }

    const calculateRemaining = () => {
      const startMs = new Date(createdAt).getTime();
      const endMs = startMs + (durationSeconds || 60) * 1000;
      const nowMs = Date.now();
      return Math.max(0, Math.ceil((endMs - nowMs) / 1000));
    };

    const initialRemaining = calculateRemaining();
    setSecondsRemaining(initialRemaining);

    if (initialRemaining <= 0) {
      if (!hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpire?.();
      }
      return;
    }

    const interval = setInterval(() => {
      const left = calculateRemaining();
      setSecondsRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        if (!hasExpiredRef.current) {
          hasExpiredRef.current = true;
          onExpire?.();
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [createdAt, durationSeconds, isClosed, onExpire]);

  const total = durationSeconds || 60;
  const progress = isClosed ? 0 : Math.min(Math.max(secondsRemaining / total, 0), 1);
  const strokeDashoffset = circumference - progress * circumference;

  // Color transitions as time runs down
  const strokeColor =
    isClosed || secondsRemaining <= 0
      ? '#a1a1aa' // zinc-400
      : secondsRemaining <= 10
      ? '#ef4444' // red-500
      : secondsRemaining <= 25
      ? '#f59e0b' // amber-500
      : '#10b981'; // emerald-500

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
      title={isClosed ? 'Voting closed' : `${secondsRemaining}s remaining`}
    >
      <svg
        className="w-full h-full -rotate-90 transform"
        viewBox="0 0 60 60"
      >
        {/* Background track */}
        <circle
          cx="30"
          cy="30"
          r={radius}
          className="text-border"
          strokeWidth="4"
          stroke="currentColor"
          fill="transparent"
        />
        {/* Animated countdown stroke */}
        <motion.circle
          cx="30"
          cy="30"
          r={radius}
          stroke={strokeColor}
          strokeWidth="4"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.4, ease: 'linear' }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className={`font-mono text-xs font-bold ${
            isClosed || secondsRemaining <= 0
              ? 'text-muted-foreground'
              : secondsRemaining <= 10
              ? 'text-red-500 animate-pulse'
              : 'text-foreground'
          }`}
        >
          {isClosed ? '0:00' : formatTime(secondsRemaining)}
        </span>
      </div>
    </div>
  );
}
