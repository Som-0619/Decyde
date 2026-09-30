'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { seedDemoRoom } from '@/lib/demoData';
import StreakBadge from '@/components/StreakBadge';
import Footer from '@/components/Footer';
import { SonarGrid } from '@/components/ui/sonar-grid';
import { getOrCreateVoterId, getProfile } from '@/lib/streak';
import { useOnlineCount } from '@/lib/presence';

export default function HomePage() {
  const router = useRouter();
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const reduceMotion = useReducedMotion();
  const onlineCount = useOnlineCount();

  const enter = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
          transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  useEffect(() => {
    const voterId = getOrCreateVoterId();
    if (!voterId) return;
    getProfile(voterId).then((profile) => setStreak(profile?.current_streak || 0));
  }, []);

  const handleLaunchDemo = async () => {
    setIsDemoLoading(true);
    try {
      const code = await seedDemoRoom();
      router.push(`/room/${code}`);
    } catch (err) {
      console.error('Error launching demo:', err);
      router.push('/room/DEMO1');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col font-sans">
      {/* Hero — dot field that pings back on tap, with the real CTAs on top */}
      <SonarGrid
        ringWidth={90}
        speed={260}
        amplitude={2.2}
        pingEvery={2.4}
        interactive
        spacing={26}
        baseOpacity={0.28}
        pingArea={[0.22, 0.18, 0.78, 0.82]}
        className="bg-background flex min-h-[100svh] w-full flex-col"
      >
        {/* Soft wash behind the copy keeps it legible while rings pass underneath */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_34%_30%_at_50%_50%,var(--background)_0%,transparent_100%)]"
        />

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
          <div className="flex max-w-xl flex-col items-center">
            {onlineCount > 0 && (
              <motion.p
                {...enter(0)}
                className="text-muted-foreground mb-3 inline-flex items-center gap-1.5 text-xs font-medium"
              >
                <span className="relative flex size-1.5">
                  <span className="bg-emerald-500 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                  <span className="bg-emerald-500 relative inline-flex size-1.5 rounded-full" />
                </span>
                {onlineCount} {onlineCount === 1 ? 'person' : 'people'} deciding right now
              </motion.p>
            )}

            <motion.p
              {...enter(0.04)}
              className="text-muted-foreground border-border mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
            >
              <span aria-hidden="true" className="bg-primary size-1.5 rounded-full" />
              no cap, no boring polls
            </motion.p>

            <motion.h1
              {...enter(0.08)}
              className="text-foreground text-5xl font-semibold tracking-tight text-balance sm:text-6xl md:text-7xl"
            >
              stop debating
              <br />
              in the group chat
            </motion.h1>

            <motion.p {...enter(0.16)} className="text-muted-foreground mt-6 max-w-md text-base text-pretty sm:text-lg">
              Swipe, vote, done. decyde is how your squad actually picks where to go.
            </motion.p>

            <motion.div {...enter(0.22)} className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-medium">
              <StreakBadge streak={streak} />
              <span className="text-muted-foreground border-border rounded-full border px-2.5 py-1">zero login</span>
              <span className="text-muted-foreground border-border rounded-full border px-2.5 py-1">5 min rounds</span>
              <span className="text-muted-foreground border-border rounded-full border px-2.5 py-1">free forever</span>
            </motion.div>

            <motion.div {...enter(0.3)} className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/create"
                className="group bg-primary text-primary-foreground focus-visible:ring-ring/50 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-6 text-sm font-medium shadow-sm transition-[transform,box-shadow] duration-200 outline-none hover:shadow-md focus-visible:ring-[3px] active:scale-[0.98]"
              >
                Create a decyde
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
              <button
                type="button"
                onClick={handleLaunchDemo}
                disabled={isDemoLoading}
                className="bg-background/70 text-foreground border-border hover:bg-accent focus-visible:ring-ring/50 inline-flex h-11 cursor-pointer items-center rounded-full border px-6 text-sm font-medium backdrop-blur transition-[background-color,transform] duration-200 outline-none focus-visible:ring-[3px] active:scale-[0.98] disabled:opacity-50"
              >
                {isDemoLoading ? 'Loading…' : 'Try me'}
              </button>
            </motion.div>
          </div>
        </div>

        <Footer className="relative z-10 pb-6" />
      </SonarGrid>
    </div>
  );
}
