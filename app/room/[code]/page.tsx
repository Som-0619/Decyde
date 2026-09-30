import type { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import RoomClient from './RoomClient';

interface RoomPageProps {
  params: { code: string };
}

// This has to live in a Server Component — the actual voting UI is a Client
// Component (RoomClient) for all its interactivity, but link-preview
// metadata (and the opengraph-image sibling file) can only be generated
// server-side. No auth or profile of any kind is involved: this just reads
// the room's already-public question to build a nicer link preview.
export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  const code = params.code?.toUpperCase() || '';
  let question = "Cast your vote — someone's waiting on you";

  try {
    const { data } = await supabase.from('rooms').select('question').eq('code', code).maybeSingle();
    if (data?.question) question = data.question;
  } catch {
    // Fall back to the generic title below.
  }

  const description = 'Swipe yes, no, or meh on decyde — fast, fun group decisions.';

  return {
    title: `${question} — decyde`,
    description,
    openGraph: {
      title: question,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: question,
      description,
    },
  };
}

export default function RoomPage() {
  return <RoomClient />;
}
