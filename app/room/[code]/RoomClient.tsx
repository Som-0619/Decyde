'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  PanInfo,
} from 'framer-motion';
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  QrCode,
  Share2,
  Copy,
  CheckCircle2,
  BarChart3,
  Layers,
  Trophy,
  Users,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CircularTimer from '@/components/CircularTimer';
import LiveResultsChart from '@/components/LiveResultsChart';
import RoomSkeleton from '@/components/RoomSkeleton';
import RoomNotFound from '@/components/RoomNotFound';
import Toast from '@/components/Toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Room, Option, VoteType, Vote } from '@/lib/types';
import { recordVoteStreak } from '@/lib/streak';

// Both are only needed once the user actually opens the QR dialog or the
// room closes — deferring them (and canvas-confetti, which WinnerRevealModal
// pulls in) keeps them out of the initial voting-page bundle.
const QRCodeModal = dynamic(() => import('@/components/QRCodeModal'));
const WinnerRevealModal = dynamic(() => import('@/components/WinnerRevealModal'));

function hapticBuzz(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore unsupported/blocked vibration
    }
  }
}

interface SwipeCardProps {
  option: Option;
  index: number;
  totalCards: number;
  onSwipe: (direction: VoteType) => void;
}

function SwipeCard({ option, index, totalCards, onSwipe }: SwipeCardProps) {
  const isTop = index === 0;

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Rotate smoothly as dragged horizontally
  const rotate = useTransform(x, [-200, 200], [-18, 18]);

  // Visual cues on drag
  const yesOpacity = useTransform(x, [20, 100], [0, 1]);
  const noOpacity = useTransform(x, [-20, -100], [0, 1]);
  const mehOpacity = useTransform(y, [-20, -80], [0, 1]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const swipeThresholdX = 100;
    const swipeThresholdY = -80;

    if (info.offset.x > swipeThresholdX) {
      onSwipe('yes');
    } else if (info.offset.x < -swipeThresholdX) {
      onSwipe('no');
    } else if (info.offset.y < swipeThresholdY) {
      onSwipe('meh');
    }
  };

  const stackOffset = Math.min(index * 12, 24);
  const stackScale = Math.max(1 - index * 0.05, 0.9);

  return (
    <motion.div
      style={{
        zIndex: totalCards - index,
        x: isTop ? x : 0,
        y: isTop ? y : stackOffset,
        scale: isTop ? 1 : stackScale,
        rotate: isTop ? rotate : 0,
      }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.85}
      onDragEnd={isTop ? handleDragEnd : undefined}
      initial={{ scale: 0.9, opacity: 0, y: 30 }}
      animate={{
        scale: isTop ? 1 : stackScale,
        opacity: 1,
        y: isTop ? 0 : stackOffset,
      }}
      exit={{
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.2 },
      }}
      className={`absolute inset-0 select-none touch-none rounded-3xl p-6 sm:p-8 bg-card border border-border shadow-2xl flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing ${
        !isTop ? 'pointer-events-none' : ''
      }`}
    >
      {/* Swipe Feedback Badges */}
      {isTop && (
        <>
          <motion.div
            style={{ opacity: yesOpacity }}
            className="absolute top-6 left-6 px-4 py-1.5 rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-lg sm:text-xl tracking-wider uppercase rotate-[-12deg] pointer-events-none shadow-sm flex items-center gap-1.5"
          >
            <ThumbsUp className="w-5 h-5" />
            <span>YES</span>
          </motion.div>

          <motion.div
            style={{ opacity: noOpacity }}
            className="absolute top-6 right-6 px-4 py-1.5 rounded-2xl border-2 border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black text-lg sm:text-xl tracking-wider uppercase rotate-[12deg] pointer-events-none shadow-sm flex items-center gap-1.5"
          >
            <ThumbsDown className="w-5 h-5" />
            <span>NO</span>
          </motion.div>

          <motion.div
            style={{ opacity: mehOpacity }}
            className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-2xl border-2 border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-lg sm:text-xl tracking-wider uppercase pointer-events-none shadow-sm flex items-center gap-1.5"
          >
            <Minus className="w-5 h-5" />
            <span>MEH</span>
          </motion.div>
        </>
      )}

      {/* Card Header Hint */}
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <span>Option</span>
        <span>Swipe or tap</span>
      </div>

      {/* Card Content */}
      <div className="my-auto text-center px-4 py-2">
        <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-secondary flex items-center justify-center text-6xl shadow-inner select-none">
          {option.emoji || '✨'}
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-snug">
          {option.text}
        </h3>
      </div>

      {/* Instructions */}
      <div className="text-center pt-4 border-t border-border text-[11px] font-medium text-muted-foreground">
        ← Left: No &nbsp;•&nbsp; ↑ Up: Meh &nbsp;•&nbsp; Right: Yes →
      </div>
    </motion.div>
  );
}

export default function RoomVotingPage() {
  const params = useParams();
  const roomCode = (params?.code as string)?.toUpperCase() || '';

  const [room, setRoom] = useState<Room | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voterId, setVoterId] = useState<string>('');
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'voting' | 'results'>('voting');
  const [showRevealModal, setShowRevealModal] = useState(true);
  const confettiTriggeredRef = useRef(false);
  const streakRecordedRef = useRef(false);
  const [roomOnlineCount, setRoomOnlineCount] = useState(0);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // 1. Initialize anonymous voter_id
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('decyde_voter_id');
      if (!id) {
        id = 'voter_' + Math.random().toString(36).substring(2, 12);
        localStorage.setItem('decyde_voter_id', id);
      }
      setVoterId(id);
    }
  }, []);

  // Loads a locally-cached room (created without Supabase, or Supabase unreachable).
  // Returns true if a cached room was found and state was populated.
  const loadFromSessionCache = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const cached = sessionStorage.getItem(`decyde_room_${roomCode}`);
    if (!cached) return false;

    const parsed = JSON.parse(cached);
    setRoom(parsed.room);
    setOptions(parsed.options || []);
    const hasVotedLocal = localStorage.getItem(`decyde_voted_${roomCode}`);
    if (hasVotedLocal) {
      setAlreadyVoted(true);
      setActiveTab('results');
    }
    return true;
  }, [roomCode]);

  // 2. Fetch Room, Options, and Votes
  const fetchRoomData = useCallback(async (currentVoterId: string) => {
    if (!roomCode) return;
    setLoading(true);
    setError(null);

    // Supabase isn't configured (placeholder credentials) — skip straight to
    // the local cache instead of waiting on network calls that would just
    // time out, which is what made this page take ~10s to load.
    if (!isSupabaseConfigured) {
      if (loadFromSessionCache()) {
        setLoading(false);
        return;
      }
      setError('Decision room not found. Please verify the code.');
      setLoading(false);
      return;
    }

    try {
      // Fetch Room
      const { data: roomData, error: roomErr } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode)
        .single();

      if (roomErr || !roomData) {
        // Fallback demo storage
        if (loadFromSessionCache()) {
          setLoading(false);
          return;
        }
        throw new Error('Decision room not found. Please verify the code.');
      }

      setRoom(roomData);

      // Fetch Options
      const { data: optionsData, error: optionsErr } = await supabase
        .from('options')
        .select('*')
        .eq('room_id', roomData.id);

      if (optionsErr) throw optionsErr;
      const loadedOptions = optionsData || [];
      setOptions(loadedOptions);

      // Fetch All Votes for the Room (for live chart)
      const { data: votesData, error: votesErr } = await supabase
        .from('votes')
        .select('*')
        .eq('room_id', roomData.id);

      if (!votesErr && votesData) {
        setVotes(votesData);

        // Check if current voter already voted
        if (currentVoterId) {
          const userVotes = votesData.filter((v) => v.voter_id === currentVoterId);
          if (userVotes.length >= loadedOptions.length) {
            setAlreadyVoted(true);
            setActiveTab('results');
          } else if (userVotes.length > 0) {
            const votedOptIds = new Set(userVotes.map((v) => v.option_id));
            const nextIdx = loadedOptions.findIndex((opt) => !votedOptIds.has(opt.id));
            if (nextIdx !== -1) {
              setCurrentIndex(nextIdx);
            } else {
              setAlreadyVoted(true);
              setActiveTab('results');
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching room:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load room';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [roomCode, loadFromSessionCache]);

  useEffect(() => {
    if (voterId) {
      fetchRoomData(voterId);
    }
  }, [voterId, fetchRoomData]);

  // 3. Supabase Realtime Subscription on votes, room status, and who's here
  useEffect(() => {
    if (!room?.id || !isSupabaseConfigured || !voterId) return;

    const channel = supabase
      .channel(`room-live-${room.id}`, {
        config: { presence: { key: voterId } },
      })
      .on('presence', { event: 'sync' }, () => {
        setRoomOnlineCount(Object.keys(channel.presenceState()).length);
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newVote = payload.new as Vote;
            setVotes((prev) => {
              const exists = prev.some((v) => v.id === newVote.id);
              return exists ? prev : [...prev, newVote];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Vote;
            setVotes((prev) =>
              prev.map((v) => (v.id === updated.id ? updated : v))
            );
          } else if (payload.eventType === 'DELETE') {
            setVotes((prev) => prev.filter((v) => v.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          if (payload.new && 'status' in payload.new) {
            setRoom((prev) =>
              prev ? { ...prev, status: (payload.new as Room).status } : null
            );
          }
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ voter_id: voterId, online_at: new Date().toISOString() });
        }
      });

    return () => {
      setRoomOnlineCount(0);
      supabase.removeChannel(channel);
    };
  }, [room?.id, voterId]);

  // 4. Handle Timer Expiry -> Freeze results & close room in Supabase
  const handleTimerExpire = useCallback(async () => {
    if (!room?.id) return;

    setRoom((prev) => (prev ? { ...prev, status: 'closed' } : null));
    setShowRevealModal(true);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('rooms')
          .update({ status: 'closed' })
          .eq('id', room.id);
      } catch (err) {
        console.error('Failed to close room in Supabase:', err);
      }
    }

    // Trigger celebration confetti — loaded on demand so it's not in the
    // initial voting-page bundle.
    if (!confettiTriggeredRef.current) {
      confettiTriggeredRef.current = true;
      try {
        const { default: confetti } = await import('canvas-confetti');
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore in non-browser environments
      }
    }
  }, [room?.id]);

  const isClosed = room?.status === 'closed';

  // Handle Swipe or Tap vote
  const handleVote = async (voteType: VoteType) => {
    if (!room || currentIndex >= options.length || isClosed) return;

    hapticBuzz(15);

    const currentOption = options[currentIndex];
    const nextIndex = currentIndex + 1;

    // Advance card immediately
    setCurrentIndex(nextIndex);

    // Local optimistic update for live chart
    const optimisticVote: Vote = {
      id: 'local-' + Date.now(),
      room_id: room.id,
      option_id: currentOption.id,
      voter_id: voterId,
      vote_type: voteType,
      created_at: new Date().toISOString(),
    };
    setVotes((prev) => [...prev, optimisticVote]);

    // Insert vote via the server route (not a direct Supabase call) so votes
    // can be rate-limited — RLS alone doesn't stop a script from spamming
    // inserts with freshly-generated voter_ids.
    if (isSupabaseConfigured) {
      try {
        const res = await fetch('/api/votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room_id: room.id,
            option_id: currentOption.id,
            voter_id: voterId,
            vote_type: voteType,
          }),
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({ error: undefined }));
          console.warn('Vote insert note:', error || res.status);
        }
      } catch (err) {
        console.error('Error inserting vote:', err);
      }
    }

    // If last card, finish voting and switch to results view
    if (nextIndex >= options.length) {
      setAlreadyVoted(true);
      setActiveTab('results');
      if (typeof window !== 'undefined') {
        localStorage.setItem(`decyde_voted_${roomCode}`, 'true');
      }
    }
  };

  const remainingOptions = useMemo(() => {
    return options.slice(currentIndex);
  }, [options, currentIndex]);

  const hasFinishedVoting =
    !loading && options.length > 0 && (alreadyVoted || currentIndex >= options.length);

  // Award the daily voting streak once a voter finishes a room
  useEffect(() => {
    if (!hasFinishedVoting || !voterId || streakRecordedRef.current) return;
    streakRecordedRef.current = true;

    recordVoteStreak(voterId).then(({ profile, incremented }) => {
      if (incremented) {
        hapticBuzz([40, 30, 40]);
        showToast(`🔥 ${profile.current_streak} day streak! Keep it going.`);
      }
    });
  }, [hasFinishedVoting, voterId, showToast]);

  // Finish the room the moment every question has been answered, instead of
  // waiting out the rest of the countdown.
  useEffect(() => {
    if (!hasFinishedVoting || isClosed) return;
    handleTimerExpire();
  }, [hasFinishedVoting, isClosed, handleTimerExpire]);

  const roomUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://decyde.app/room/${roomCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopiedLink(true);
      showToast('Room invite link copied! 📋');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(true);
      showToast('Room invite link copied! 📋');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Decyde: ${room?.question || 'Vote now!'}`,
          text: `Cast your vote on: "${room?.question || 'Quick group decision'}"`,
          url: roomUrl,
        });
        showToast('Invite shared! 🚀');
        return;
      } catch {
        // User cancelled or failed -> fallback to copy link
      }
    }
    handleCopyLink();
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col font-sans text-foreground">
        <Navbar />
        <RoomSkeleton />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col font-sans text-foreground">
        <Navbar />
        <RoomNotFound attemptedCode={roomCode} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      <Navbar />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 sm:py-8 flex flex-col justify-between">
        {/* Room Header with Circular Countdown Timer */}
        <div className="bg-card rounded-3xl p-5 sm:p-6 border border-border shadow-sm mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest px-2.5 py-1 rounded-lg bg-secondary text-foreground">
                #{room.code}
              </span>
              {isClosed ? (
                <button
                  onClick={() => setShowRevealModal(true)}
                  className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 flex items-center gap-1 transition active:scale-95"
                  title="Re-open Winner Reveal"
                >
                  <Trophy className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Winner Reveal</span>
                </button>
              ) : (
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live</span>
                </span>
              )}
              {roomOnlineCount > 0 && (
                <span
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 flex items-center gap-1"
                  title={`${roomOnlineCount} here right now`}
                >
                  <Users className="w-3 h-3" />
                  <span>{roomOnlineCount}</span>
                </span>
              )}
            </div>

            {/* Circular Timer & Share Actions */}
            <div className="flex items-center gap-3">
              <CircularTimer
                createdAt={room.created_at}
                durationSeconds={room.duration_seconds}
                isClosed={isClosed}
                onExpire={handleTimerExpire}
                size={52}
              />

              <button
                onClick={() => setIsQRModalOpen(true)}
                className="p-2 rounded-2xl bg-secondary hover:bg-accent text-foreground transition"
                title="Share Room / QR"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground leading-tight">
            {room.question}
          </h1>

          {/* Toggle Tab between Cards & Live Results */}
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('voting')}
                disabled={hasFinishedVoting}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeTab === 'voting'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                } ${hasFinishedVoting ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Vote</span>
              </button>

              <button
                onClick={() => setActiveTab('results')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeTab === 'results'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Results</span>
              </button>
            </div>

            {!hasFinishedVoting && activeTab === 'voting' && (
              <span className="text-xs font-semibold text-muted-foreground">
                Card {currentIndex + 1} of {options.length}
              </span>
            )}
          </div>
        </div>

        {/* Content Container: Either Swipe Deck or Results Chart */}
        <div className="my-auto">
          {activeTab === 'results' || hasFinishedVoting ? (
            <div className="space-y-4">
              {/* Waiting for others pulsing notification if vote finished but room still open */}
              {hasFinishedVoting && !isClosed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-3xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.1, 0.4] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute w-8 h-8 rounded-full bg-purple-500/30"
                      />
                      <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold z-10">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200">
                        Waiting for others to decide…
                      </h4>
                      <p className="text-[11px] text-purple-600 dark:text-purple-400">
                        Updating live as others cast votes!
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyLink}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-white dark:bg-purple-900/60 text-purple-700 dark:text-purple-200 text-xs font-bold border border-purple-200 dark:border-purple-700/60 hover:bg-purple-100 dark:hover:bg-purple-800/60 transition"
                  >
                    {copiedLink ? 'Copied!' : 'Invite'}
                  </button>
                </motion.div>
              )}

              {/* Live Horizontal Bar Chart */}
              <LiveResultsChart
                options={options}
                votes={votes}
                isClosed={isClosed}
              />

              {/* In-page QR code card for shared meeting screens / TV */}
              <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-sm flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Shared Screen Scan</span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground mt-0.5 truncate">
                    Scan to vote from your phone
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Room #{room.code} • Point camera to join
                  </p>
                  <button
                    onClick={handleCopyLink}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-secondary hover:bg-accent text-xs font-semibold text-foreground transition active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

                <div className="p-2.5 bg-white rounded-2xl border border-border shadow-sm flex-shrink-0">
                  <QRCodeSVG value={roomUrl} size={84} level="M" />
                </div>
              </div>
            </div>
          ) : (
            /* Card Stack */
            <div className="relative w-full aspect-[4/5] sm:aspect-[1/1.15] max-h-[440px]">
              <div className="relative w-full h-full">
                <AnimatePresence>
                  {remainingOptions.map((opt, i) => (
                    <SwipeCard
                      key={opt.id}
                      option={opt}
                      index={i}
                      totalCards={remainingOptions.length}
                      onSwipe={handleVote}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Fallback Voting Buttons (Only if activeTab is voting and not finished) */}
        {!hasFinishedVoting && activeTab === 'voting' && !isClosed && (
          <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4 px-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleVote('no')}
              className="flex-1 min-h-[48px] py-3.5 rounded-2xl bg-card border border-border hover:border-rose-300 dark:hover:border-rose-700/60 shadow-md text-rose-600 dark:text-rose-400 font-bold text-sm flex items-center justify-center gap-2 transition active:bg-rose-50 dark:active:bg-rose-950/40"
              title="Vote No (Swipe Left)"
            >
              <ThumbsDown className="w-4 h-4" />
              <span>No</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleVote('meh')}
              className="flex-1 min-h-[48px] py-3.5 rounded-2xl bg-card border border-border hover:border-amber-300 dark:hover:border-amber-700/60 shadow-md text-amber-600 dark:text-amber-400 font-bold text-sm flex items-center justify-center gap-2 transition active:bg-amber-50 dark:active:bg-amber-950/40"
              title="Vote Meh (Swipe Up)"
            >
              <Minus className="w-4 h-4" />
              <span>Meh</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleVote('yes')}
              className="flex-1 min-h-[48px] py-3.5 rounded-2xl bg-card border border-border hover:border-emerald-300 dark:hover:border-emerald-700/60 shadow-md text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 transition active:bg-emerald-50 dark:active:bg-emerald-950/40"
              title="Vote Yes (Swipe Right)"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Yes</span>
            </motion.button>
          </div>
        )}

        {/* Share buttons when in results tab or finished */}
        {(activeTab === 'results' || hasFinishedVoting) && (
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex-1 min-h-[48px] py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:opacity-95 transition active:scale-98 flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedLink ? 'Link Copied!' : 'Share Room Link'}</span>
            </button>

            <button
              onClick={() => setIsQRModalOpen(true)}
              className="min-h-[48px] min-w-[48px] p-3.5 rounded-2xl bg-card border border-border text-foreground hover:bg-accent transition active:scale-95 flex items-center justify-center"
              title="Show QR Code Modal"
            >
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        )}

        <Footer className="pt-6" />
      </main>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        roomCode={room.code}
        roomUrl={roomUrl}
        question={room.question}
      />

      {/* Full-Screen Winner Reveal Modal */}
      <WinnerRevealModal
        isOpen={Boolean(isClosed && showRevealModal)}
        options={options}
        votes={votes}
        question={room.question}
        onDismissViewBreakdown={() => setShowRevealModal(false)}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} isVisible={Boolean(toastMessage)} />
    </div>
  );
}
