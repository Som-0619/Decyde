import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const VOTE_TYPES = new Set(['yes', 'no', 'meh']);

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const limit = rateLimit(`${ip}:vote`, 40, 60); // 40 votes / min per IP — generous for real swiping, blocks scripted spam
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many votes from this connection. Slow down a moment.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  let body: { room_id?: unknown; option_id?: unknown; voter_id?: unknown; vote_type?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const roomId = typeof body.room_id === 'string' ? body.room_id : '';
  const optionId = typeof body.option_id === 'string' ? body.option_id : '';
  const voterId = typeof body.voter_id === 'string' ? body.voter_id.trim() : '';
  const voteType = typeof body.vote_type === 'string' ? body.vote_type : '';

  if (!roomId || !optionId || !voterId || voterId.length > 64 || !VOTE_TYPES.has(voteType)) {
    return NextResponse.json({ error: 'Invalid vote.' }, { status: 400 });
  }

  const { error } = await supabase.from('votes').insert({
    room_id: roomId,
    option_id: optionId,
    voter_id: voterId,
    vote_type: voteType,
  });

  if (error) {
    // A duplicate vote (same room/option/voter) hits the unique constraint —
    // that's an expected, harmless case (e.g. a retried request), not a
    // real failure.
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
