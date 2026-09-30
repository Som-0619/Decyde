'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Option, Vote } from '@/lib/types';

interface LiveResultsChartProps {
  options: Option[];
  votes: Vote[];
  isClosed: boolean;
}

export default function LiveResultsChart({
  options,
  votes,
  isClosed,
}: LiveResultsChartProps) {
  // Count yes-votes per option
  const optionStats = options.map((opt) => {
    const optVotes = votes.filter((v) => v.option_id === opt.id);
    const yesCount = optVotes.filter((v) => v.vote_type === 'yes').length;
    const totalOptionVotes = optVotes.length;
    return {
      ...opt,
      yesCount,
      totalOptionVotes,
    };
  });

  // Calculate highest yes count to scale bars proportionally
  const maxYesVotes = Math.max(...optionStats.map((o) => o.yesCount), 1);
  const totalYesVotesAll = optionStats.reduce((acc, curr) => acc + curr.yesCount, 0);

  // Find leader(s)
  const highestCount = Math.max(...optionStats.map((o) => o.yesCount));
  const isLeader = (count: number) => count > 0 && count === highestCount;

  return (
    <div className="w-full bg-card rounded-3xl p-5 sm:p-6 border border-border shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-bold text-foreground">
            {isClosed ? 'Final Results (Yes Votes)' : 'Live Yes-Votes Leaderboard'}
          </h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {totalYesVotesAll} total {totalYesVotesAll === 1 ? 'Yes' : 'Yeses'}
        </span>
      </div>

      <div className="space-y-3.5">
        {optionStats.map((opt) => {
          const isWinning = isLeader(opt.yesCount);
          const barPercentage = (opt.yesCount / maxYesVotes) * 100;

          return (
            <div key={opt.id} className="space-y-1.5">
              {/* Option Title and Count */}
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="text-lg select-none flex-shrink-0">{opt.emoji || '✨'}</span>
                  <span className="truncate text-foreground">
                    {opt.text}
                  </span>
                  {isWinning && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex-shrink-0">
                      <Trophy className="w-3 h-3" />
                      <span>{isClosed ? 'Winner' : 'Leading'}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-foreground flex-shrink-0">
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm font-extrabold">
                    {opt.yesCount}
                  </span>
                  <span className="text-muted-foreground font-normal">yes</span>
                </div>
              </div>

              {/* Horizontal Bar */}
              <div className="h-3.5 w-full bg-secondary rounded-full overflow-hidden p-0.5 relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${opt.yesCount > 0 ? Math.max(barPercentage, 5) : 0}%` }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  className={`h-full rounded-full transition-colors ${
                    isWinning
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/30'
                      : 'bg-muted-foreground'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
