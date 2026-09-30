'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getCookieConsent, setCookieConsent } from '@/lib/cookieConsent';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getCookieConsent() === null);
  }, []);

  // On narrow screens the banner is wide enough to sit on top of whatever's
  // at the bottom of the page (e.g. the footer's Privacy link) — reserve
  // space so it doesn't cover anything interactive while it's up.
  useEffect(() => {
    if (!visible) return;
    const mql = window.matchMedia('(max-width: 639px)');
    if (!mql.matches) return;

    document.body.style.paddingBottom = '190px';
    return () => {
      document.body.style.paddingBottom = '';
    };
  }, [visible]);

  const choose = (choice: 'accepted' | 'declined') => {
    setCookieConsent(choice);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-card border-border fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-xs rounded-2xl border p-4 shadow-lg sm:right-6 sm:bottom-6"
          role="dialog"
          aria-label="Cookie preferences"
        >
          <p className="text-foreground text-sm font-semibold">A quick heads-up</p>
          <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
            decyde keeps a few things on your device to run votes and streaks — no tracking, no ads. See our{' '}
            <Link href="/privacy" className="text-foreground underline underline-offset-2">
              privacy page
            </Link>{' '}
            for exactly what.
          </p>
          <div className="mt-3.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => choose('accepted')}
              className="bg-primary text-primary-foreground hover:opacity-90 flex-1 rounded-full py-2 text-xs font-semibold transition active:scale-[0.98]"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => choose('declined')}
              className="border-border text-foreground hover:bg-accent flex-1 rounded-full border py-2 text-xs font-semibold transition active:scale-[0.98]"
            >
              Decline
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
