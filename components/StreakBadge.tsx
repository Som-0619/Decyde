'use client';

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
  justIncremented?: boolean;
  className?: string;
}

export default function StreakBadge({ streak, justIncremented, className = '' }: StreakBadgeProps) {
  if (streak <= 0) return null;

  return (
    <motion.div
      initial={false}
      animate={justIncremented ? { scale: [1, 1.35, 1] } : {}}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      title={`${streak} day voting streak`}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-300/70 dark:border-orange-800/60 text-orange-600 dark:text-orange-400 text-xs font-black ${className}`}
    >
      <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
      <span>{streak}</span>
    </motion.div>
  );
}
