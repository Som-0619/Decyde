'use client';

/** Best-effort client error report — never throws, never blocks the caller. */
export function reportClientError(error: unknown, source: string) {
  try {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    const url = typeof window !== 'undefined' ? window.location.href : undefined;
    const payload = JSON.stringify({ message, stack, url, source });

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/log-error', payload);
    } else {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Reporting an error must never itself throw.
  }
}
