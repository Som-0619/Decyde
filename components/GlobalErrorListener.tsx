'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/reportError';

/**
 * Catches errors React's own boundaries don't — uncaught exceptions outside
 * render (event handlers, timers) and unhandled promise rejections — and
 * forwards them to /api/log-error so they show up in server logs instead of
 * only the user's own devtools console.
 */
export default function GlobalErrorListener() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportClientError(event.error ?? event.message, 'window.onerror');
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      reportClientError(event.reason, 'unhandledrejection');
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
