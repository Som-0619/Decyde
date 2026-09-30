import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { generateRoomCode } from '@/lib/roomCode';

const ROOM_DURATION_SECONDS = 300;
const MAX_OPTIONS = 6;
const MIN_OPTIONS = 2;

interface OptionInput {
  text: string;
  emoji: string;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const limit = rateLimit(`${ip}:create-room`, 5, 600); // 5 rooms / 10 min per IP
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many rooms created from this connection. Try again in a bit.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  let body: { question?: unknown; options?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question || question.length > 300) {
    return NextResponse.json({ error: 'Please enter a question to decide.' }, { status: 400 });
  }

  const rawOptions = Array.isArray(body.options) ? (body.options as OptionInput[]) : [];
  const options = rawOptions
    .map((opt) => ({
      text: typeof opt?.text === 'string' ? opt.text.trim() : '',
      emoji: typeof opt?.emoji === 'string' && opt.emoji.trim() ? opt.emoji.trim() : '✨',
    }))
    .filter((opt) => opt.text.length > 0 && opt.text.length <= 120)
    .slice(0, MAX_OPTIONS);

  if (options.length < MIN_OPTIONS) {
    return NextResponse.json({ error: 'Please enter at least 2 non-empty options.' }, { status: 400 });
  }

  const code = generateRoomCode();

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({
      code,
      question,
      duration_seconds: ROOM_DURATION_SECONDS,
      status: 'open',
    })
    .select()
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: roomError?.message || 'Failed to create room.' }, { status: 500 });
  }

  const { error: optionsError } = await supabase.from('options').insert(
    options.map((opt) => ({
      room_id: room.id,
      text: opt.text,
      emoji: opt.emoji,
    }))
  );

  if (optionsError) {
    return NextResponse.json({ error: optionsError.message }, { status: 500 });
  }

  return NextResponse.json({ code: room.code });
}
