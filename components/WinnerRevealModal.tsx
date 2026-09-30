'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Shuffle, ArrowRight, BarChart2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Option, Vote } from '@/lib/types';

interface WinnerRevealModalProps {
  isOpen: boolean;
  options: Option[];
  votes: Vote[];
  question: string;
  onDismissViewBreakdown?: () => void;
}

function getVibeCaption(yesVotes: number, totalVotesForWinner: number, isTie: boolean): string {
  if (isTie) return '😤 Dead heat. Fate had to break it.';
  if (totalVotesForWinner === 0) return '🤷 Nobody weighed in on this one.';

  const yesShare = yesVotes / totalVotesForWinner;

  if (yesShare === 1) return '✅ Unanimous. Nobody even hesitated.';
  if (yesShare >= 0.75) return '🔥 Landslide. Barely a debate.';
  if (yesShare >= 0.5) return '👍 Solid pick, majority approved.';
  return '👀 Controversial. Half the squad is side-eyeing this.';
}

export default function WinnerRevealModal({
  isOpen,
  options,
  votes,
  question,
  onDismissViewBreakdown,
}: WinnerRevealModalProps) {
  const [phase, setPhase] = useState<'idle' | 'shuffling' | 'revealed'>('idle');
  const [displayOption, setDisplayOption] = useState<Option | null>(null);
  const [winner, setWinner] = useState<Option | null>(null);
  const [isTie, setIsTie] = useState(false);
  const confettiFiredRef = useRef(false);

  // Trigger rich celebration confetti
  const fireConfetti = () => {
    try {
      // Main central burst
      confetti({
        particleCount: 90,
        spread: 100,
        origin: { y: 0.55 },
      });

      // Left cannon
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0.1, y: 0.7 },
        });
      }, 200);

      // Right cannon
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 0.9, y: 0.7 },
        });
      }, 350);
    } catch {
      // Ignore if canvas is unavailable
    }
  };

  useEffect(() => {
    if (!isOpen || options.length === 0) return;

    // 1. Calculate yes count for each option
    const stats = options.map((opt) => {
      const yesVotes = votes.filter(
        (v) => v.option_id === opt.id && v.vote_type === 'yes'
      ).length;
      return { option: opt, yesVotes };
    });

    const highestYes = Math.max(...stats.map((s) => s.yesVotes));
    const tied = stats.filter((s) => s.yesVotes === highestYes).map((s) => s.option);

    if (tied.length > 1) {
      // TIE DETECTED -> Run 2-second shuffle animation
      setIsTie(true);
      setPhase('shuffling');

      let currentIdx = 0;
      const shuffleInterval = setInterval(() => {
        currentIdx = (currentIdx + 1) % tied.length;
        setDisplayOption(tied[currentIdx]);
      }, 85);

      const timeout = setTimeout(() => {
        clearInterval(shuffleInterval);
        // Land on randomly chosen one
        const chosen = tied[Math.floor(Math.random() * tied.length)];
        setWinner(chosen);
        setDisplayOption(chosen);
        setPhase('revealed');
        if (!confettiFiredRef.current) {
          confettiFiredRef.current = true;
          fireConfetti();
        }
      }, 2000);

      return () => {
        clearInterval(shuffleInterval);
        clearTimeout(timeout);
      };
    } else {
      // Single clear winner
      setIsTie(false);
      const chosen = tied[0];
      setWinner(chosen);
      setDisplayOption(chosen);
      setPhase('revealed');

      if (!confettiFiredRef.current) {
        confettiFiredRef.current = true;
        fireConfetti();
      }
    }
  }, [isOpen, options, votes]);

  if (!isOpen) return null;

  const winnerYesVotes = winner
    ? votes.filter((v) => v.option_id === winner.id && v.vote_type === 'yes').length
    : 0;
  const winnerTotalVotes = winner
    ? votes.filter((v) => v.option_id === winner.id).length
    : 0;
  const vibeCaption = getVibeCaption(winnerYesVotes, winnerTotalVotes, isTie);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Full-screen Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Shuffling Tie-Breaker Screen */}
        {phase === 'shuffling' && displayOption && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-10 w-full max-w-md text-center p-8 bg-zinc-900/90 border border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-500/20 text-white"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider mb-5 border border-amber-500/30 animate-pulse">
              <Shuffle className="w-3.5 h-3.5 animate-spin" />
              <span>It&apos;s a Tie! Deciding...</span>
            </div>

            <h3 className="text-sm font-semibold text-zinc-400 mb-6">
              Breaking the tie between top picks:
            </h3>

            {/* Cycling Option Display */}
            <motion.div
              key={displayOption.id}
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.08 }}
              className="py-6 px-4 rounded-2xl bg-zinc-800/80 border border-zinc-700/60"
            >
              <div className="text-7xl mb-3 select-none animate-bounce">
                {displayOption.emoji || '✨'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {displayOption.text}
              </h2>
            </motion.div>

            <p className="text-xs text-zinc-500 mt-6">
              Hold tight, selecting the winner randomly...
            </p>
          </motion.div>
        )}

        {/* Final Winner Reveal Screen */}
        {phase === 'revealed' && winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              type: 'spring',
              damping: 22,
              stiffness: 280,
            }}
            className="relative z-10 w-full max-w-md text-center p-6 sm:p-9 bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Top Glow Accent */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-b from-amber-500/20 to-transparent rounded-full blur-2xl pointer-events-none" />

            {/* Winner Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-widest shadow-md shadow-amber-500/30 mb-4"
            >
              <Trophy className="w-4 h-4" />
              <span>THE WINNER</span>
            </motion.div>

            {/* Question Context */}
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">
              Decision on
            </p>
            <h4 className="text-base font-bold text-foreground px-4 line-clamp-2 mb-6">
              &ldquo;{question}&rdquo;
            </h4>

            {/* Winning Option Card */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="p-6 rounded-3xl bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 mb-6 relative"
            >
              <div className="text-7xl sm:text-8xl select-none mb-3 filter drop-shadow-md">
                {winner.emoji || '✨'}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
                {winner.text}
              </h2>
              <div className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {winnerYesVotes} {winnerYesVotes === 1 ? 'Yes vote' : 'Yes votes'}
                {isTie && (
                  <span className="block text-amber-600 dark:text-amber-400 text-[11px] mt-0.5">
                    ⚡ Chosen via tiebreaker
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs font-bold text-muted-foreground">
                {vibeCaption}
              </p>
            </motion.div>

            {/* Actions */}
            <div className="space-y-2.5">
              {/* Primary CTA: Start a new decision */}
              <Link
                href="/create"
                className="bg-primary text-primary-foreground hover:opacity-90 w-full py-4 rounded-2xl font-bold text-sm sm:text-base shadow-lg transition active:scale-98 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Start a new decision</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Secondary action: View Breakdown */}
              {onDismissViewBreakdown && (
                <button
                  type="button"
                  onClick={onDismissViewBreakdown}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition flex items-center justify-center gap-1.5"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>View Full Results Breakdown</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
