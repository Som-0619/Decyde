import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

/**
 * Client-side errors happen in the user's browser, so they're invisible to
 * you unless something reports them somewhere you can see. This forwards
 * them into the server's console.error, which Vercel (and `next dev`)
 * captures in its own logs — no third-party error-tracking account needed.
 * A real Sentry/etc. integration is the natural upgrade if this app ever
 * needs alerting, breadcrumbs, or source-mapped stack traces.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  // Loose cap — this only needs to stop someone flooding your logs, not
  // guard anything sensitive.
  const limit = rateLimit(`${ip}:log-error`, 20, 60);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: { message?: unknown; stack?: unknown; url?: unknown; source?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.slice(0, 2000) : 'Unknown client error';
  const stack = typeof body.stack === 'string' ? body.stack.slice(0, 4000) : undefined;
  const url = typeof body.url === 'string' ? body.url.slice(0, 500) : undefined;
  const source = typeof body.source === 'string' ? body.source.slice(0, 100) : 'client';

  console.error(`[client-error:${source}] ${message}`, { url, stack });

  return NextResponse.json({ ok: true });
}
