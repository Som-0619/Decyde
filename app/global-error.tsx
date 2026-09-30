'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/reportError';

// Next.js replaces the entire document (including <html>/<body>) with this
// when an error escapes the root layout itself, so it can't rely on
// globals.css/Tailwind having loaded — hence inline styles.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, 'global-error-boundary');
  }, [error]);

  return (
    <html>
      <body
        style={{
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          background: '#09090b',
          color: '#fafafa',
          minHeight: '100vh',
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💀</p>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Something broke</h1>
        <p style={{ color: '#a1a1aa', fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: '24rem' }}>
          That&apos;s on us, not you. Give it another shot.
        </p>
        <button
          onClick={reset}
          style={{
            background: '#7c3aed',
            color: '#fff',
            borderRadius: '9999px',
            padding: '0.625rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
