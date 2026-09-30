'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { seedDemoRoom } from '@/lib/demoData';

interface RoomNotFoundProps {
  attemptedCode?: string;
}

export default function RoomNotFound({ attemptedCode }: RoomNotFoundProps) {
  const router = useRouter();
  const [inputCode, setInputCode] = useState('');
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleRetry = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      router.push(`/room/${inputCode.trim().toUpperCase()}`);
    }
  };

  const handleLaunchDemo = async () => {
    setIsDemoLoading(true);
    const code = await seedDemoRoom();
    router.push(`/room/${code}`);
  };

  return (
    <div className="flex-1 max-w-md mx-auto w-full flex flex-col items-center justify-center p-6 text-center">
      {/* Friendly Icon */}
      <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl mb-5 shadow-sm">
        🛸
      </div>

      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 mb-2">
        Room 404
      </span>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
        Decision Room Not Found
      </h2>

      <p className="text-xs sm:text-sm text-muted-foreground mt-2 mb-6 max-w-xs">
        {attemptedCode ? (
          <>
            We couldn&apos;t find a room with code{' '}
            <span className="font-mono font-bold text-foreground">
              {attemptedCode}
            </span>
            . It may have expired or was typed incorrectly.
          </>
        ) : (
          'The requested decision room could not be found.'
        )}
      </p>

      {/* Code Re-enter form */}
      <form onSubmit={handleRetry} className="w-full mb-6">
        <div className="flex items-center gap-2 p-1.5 bg-card rounded-2xl border border-border shadow-sm">
          <input
            type="text"
            placeholder="Try another code..."
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="flex-1 bg-transparent px-3 py-2 text-sm font-mono uppercase tracking-wider text-foreground placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputCode.trim()}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition flex items-center gap-1"
          >
            <span>Go</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Action Buttons */}
      <div className="w-full space-y-2.5">
        <button
          type="button"
          onClick={handleLaunchDemo}
          disabled={isDemoLoading}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-500/20 hover:opacity-95 transition flex items-center justify-center gap-2 active:scale-98"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{isDemoLoading ? 'Loading Demo...' : 'Try Demo Decision Room (Judge Mode)'}</span>
        </button>

        <Link
          href="/"
          className="w-full py-3.5 rounded-2xl bg-secondary hover:bg-accent text-foreground text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 active:scale-98"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
}
