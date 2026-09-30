'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PlusCircle } from 'lucide-react';
import StreakBadge from './StreakBadge';
import { getOrCreateVoterId, getProfile } from '@/lib/streak';

export default function Navbar() {
  const [streak, setStreak] = useState(0);
  const [justIncremented, setJustIncremented] = useState(false);

  useEffect(() => {
    const voterId = getOrCreateVoterId();
    if (!voterId) return;
    getProfile(voterId).then((profile) => setStreak(profile?.current_streak || 0));

    const onStreakUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ current_streak: number }>).detail;
      if (!detail) return;
      setStreak(detail.current_streak);
      setJustIncremented(true);
      setTimeout(() => setJustIncremented(false), 500);
    };

    window.addEventListener('decyde:streak-updated', onStreakUpdated);
    return () => window.removeEventListener('decyde:streak-updated', onStreakUpdated);
  }, []);

  return (
    <header className="bg-background/80 sticky top-0 z-40 w-full backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-purple-500/20"
          >
            <Image src="/logo.jpg" alt="decyde" width={40} height={40} className="w-full h-full object-cover" priority />
          </motion.div>
          <div>
            <span className="text-foreground font-extrabold text-xl tracking-tight">
              decyde
            </span>
            <span className="text-primary ml-1.5 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-semibold uppercase tracking-wider">
              Live
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <StreakBadge streak={streak} justIncremented={justIncremented} />
          <Link
            href="/create"
            className="bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New Room</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
