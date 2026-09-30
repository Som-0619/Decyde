import { ImageResponse } from 'next/og';
import { supabase } from '@/lib/supabaseClient';

export const runtime = 'edge';
export const alt = 'A decyde vote';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: { code: string };
}

export default async function OpengraphImage({ params }: Props) {
  const code = params.code?.toUpperCase() || '';
  let question = "someone's waiting on your vote";
  let emojis: string[] = ['🍕', '🍣', '🎯'];

  try {
    const { data: room } = await supabase.from('rooms').select('id, question').eq('code', code).maybeSingle();
    if (room?.question) question = room.question;
    if (room?.id) {
      const { data: options } = await supabase.from('options').select('emoji').eq('room_id', room.id).limit(4);
      if (options && options.length > 0) emojis = options.map((o) => o.emoji || '✨');
    }
  } catch {
    // Fall back to the generic defaults above.
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          backgroundImage:
            'radial-gradient(circle at 18% 20%, rgba(124,58,237,0.35) 0%, rgba(124,58,237,0) 45%), radial-gradient(circle at 85% 75%, rgba(236,72,153,0.28) 0%, rgba(236,72,153,0) 45%)',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 30,
            color: '#a78bfa',
            fontWeight: 700,
            letterSpacing: -0.5,
            marginBottom: 36,
          }}
        >
          <span
            style={{
              display: 'flex',
              width: 12,
              height: 12,
              borderRadius: 999,
              backgroundColor: '#a78bfa',
            }}
          />
          decyde
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 68,
            fontWeight: 800,
            color: '#fafafa',
            textAlign: 'center',
            lineHeight: 1.2,
            letterSpacing: -1.5,
            maxWidth: 980,
          }}
        >
          {question}
        </div>

        <div style={{ display: 'flex', gap: 24, marginTop: 52 }}>
          {emojis.slice(0, 4).map((emoji, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 96,
                height: 96,
                borderRadius: 24,
                backgroundColor: 'rgba(255,255,255,0.06)',
                fontSize: 48,
              }}
            >
              {emoji}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', fontSize: 26, color: '#a1a1aa', marginTop: 52 }}>
          swipe yes, no, or meh →
        </div>
      </div>
    ),
    { ...size }
  );
}
