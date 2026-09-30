import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Room, Option, Vote } from '@/lib/types';

export const DEMO_ROOM_CODE = 'DEMO1';

export const DEMO_ROOM: Room = {
  id: 'room-demo-12345',
  code: DEMO_ROOM_CODE,
  question: 'Where should the team go for lunch? 🍱',
  duration_seconds: 300,
  status: 'open',
  created_at: new Date().toISOString(),
};

export const DEMO_OPTIONS: Option[] = [
  {
    id: 'opt-demo-1',
    room_id: DEMO_ROOM.id,
    text: 'Artisan Woodfired Pizza',
    emoji: '🍕',
  },
  {
    id: 'opt-demo-2',
    room_id: DEMO_ROOM.id,
    text: 'Tokyo Sushi & Sashimi Bar',
    emoji: '🍣',
  },
  {
    id: 'opt-demo-3',
    room_id: DEMO_ROOM.id,
    text: 'Smash Burgers & Truffle Fries',
    emoji: '🍔',
  },
  {
    id: 'opt-demo-4',
    room_id: DEMO_ROOM.id,
    text: 'Birria Street Tacos',
    emoji: '🌮',
  },
];

export const DEMO_VOTES: Vote[] = [
  // Sarah's votes
  {
    id: 'vote-demo-1',
    room_id: DEMO_ROOM.id,
    option_id: 'opt-demo-1',
    voter_id: 'voter_sarah',
    vote_type: 'yes',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vote-demo-2',
    room_id: DEMO_ROOM.id,
    option_id: 'opt-demo-2',
    voter_id: 'voter_sarah',
    vote_type: 'meh',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vote-demo-3',
    room_id: DEMO_ROOM.id,
    option_id: 'opt-demo-3',
    voter_id: 'voter_sarah',
    vote_type: 'no',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vote-demo-4',
    room_id: DEMO_ROOM.id,
    option_id: 'opt-demo-4',
    voter_id: 'voter_sarah',
    vote_type: 'yes',
    created_at: new Date().toISOString(),
  },
  // Alex's votes
  {
    id: 'vote-demo-5',
    room_id: DEMO_ROOM.id,
    option_id: 'opt-demo-1',
    voter_id: 'voter_alex',
    vote_type: 'yes',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vote-demo-6',
    room_id: DEMO_ROOM.id,
    option_id: 'opt-demo-2',
    voter_id: 'voter_alex',
    vote_type: 'yes',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vote-demo-7',
    room_id: DEMO_ROOM.id,
    option_id: 'opt-demo-3',
    voter_id: 'voter_alex',
    vote_type: 'no',
    created_at: new Date().toISOString(),
  },
  // Chen's votes
  {
    id: 'vote-demo-8',
    room_id: DEMO_ROOM.id,
    option_id: 'opt-demo-1',
    voter_id: 'voter_chen',
    vote_type: 'yes',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vote-demo-9',
    room_id: DEMO_ROOM.id,
    option_id: 'opt-demo-3',
    voter_id: 'voter_chen',
    vote_type: 'yes',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vote-demo-10',
    room_id: DEMO_ROOM.id,
    option_id: 'opt-demo-4',
    voter_id: 'voter_chen',
    vote_type: 'meh',
    created_at: new Date().toISOString(),
  },
];

/**
 * Seed demo room into Supabase or fallback session storage
 */
export async function seedDemoRoom(): Promise<string> {
  const currentDemoRoom = {
    ...DEMO_ROOM,
    created_at: new Date().toISOString(),
  };

  // 1. Try Supabase upsert/insert (skip entirely if not configured — avoids
  // waiting on network calls that would just time out)
  if (isSupabaseConfigured) try {
    const { data: existing } = await supabase
      .from('rooms')
      .select('id')
      .eq('code', DEMO_ROOM_CODE)
      .maybeSingle();

    let roomId = existing?.id;

    if (!roomId) {
      const { data: newRoom } = await supabase
        .from('rooms')
        .insert({
          code: DEMO_ROOM_CODE,
          question: currentDemoRoom.question,
          duration_seconds: currentDemoRoom.duration_seconds,
          status: 'open',
        })
        .select()
        .single();
      roomId = newRoom?.id;
    } else {
      // Re-open if it was closed
      await supabase
        .from('rooms')
        .update({ status: 'open', created_at: new Date().toISOString() })
        .eq('id', roomId);
    }

    if (roomId) {
      // Upsert options
      for (const opt of DEMO_OPTIONS) {
        await supabase.from('options').upsert(
          {
            room_id: roomId,
            text: opt.text,
            emoji: opt.emoji,
          },
          { onConflict: 'room_id,text' }
        );
      }

      // Fetch newly inserted option IDs
      const { data: optionsData } = await supabase
        .from('options')
        .select('id, text')
        .eq('room_id', roomId);

      if (optionsData && optionsData.length > 0) {
        const optionMap = new Map(optionsData.map((o) => [o.text, o.id]));
        // Insert sample votes
        for (const vote of DEMO_VOTES) {
          const opt = DEMO_OPTIONS.find((o) => o.id === vote.option_id);
          const realOptId = opt ? optionMap.get(opt.text) : null;
          if (realOptId) {
            await supabase.from('votes').upsert(
              {
                room_id: roomId,
                option_id: realOptId,
                voter_id: vote.voter_id,
                vote_type: vote.vote_type,
              },
              { onConflict: 'room_id,option_id,voter_id' }
            );
          }
        }
      }
    }
  } catch (err) {
    console.warn('Supabase demo seeding note (falling back to local cache):', err);
  }

  // 2. Always persist in client cache so it works 100% offline as well
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(
      `decyde_room_${DEMO_ROOM_CODE}`,
      JSON.stringify({
        room: currentDemoRoom,
        options: DEMO_OPTIONS,
        votes: DEMO_VOTES,
      })
    );
    // Reset local vote for demo room so judges can vote fresh
    localStorage.removeItem(`decyde_voted_${DEMO_ROOM_CODE}`);
  }

  return DEMO_ROOM_CODE;
}
