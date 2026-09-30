'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { reportClientError } from '@/lib/reportError';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, 'route-error-boundary');
  }, [error]);

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center px-6 text-center font-sans">
      <p className="text-4xl mb-4">💀</p>
      <h1 className="text-xl font-semibold mb-2">Something broke</h1>
      <p className="text-muted-foreground text-sm mb-6 max-w-sm">
        That&apos;s on us, not you. Give it another shot.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-medium"
        >
          Try again
        </button>
        <Link href="/" className="border-border rounded-full border px-5 py-2.5 text-sm font-medium">
          Go home
        </Link>
      </div>
    </div>
  );
}
