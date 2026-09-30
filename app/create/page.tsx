'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { SonarGrid } from '@/components/ui/sonar-grid';
import { generateRoomCode } from '@/lib/roomCode';
import Footer from '@/components/Footer';

interface OptionItem {
  id: string;
  text: string;
  emoji: string;
}

const COMMON_EMOJIS = [
  '🍕', '🍣', '🍔', '🌮', '🍜', '☕',
  '🍦', '🍿', '🎬', '🎮', '🏖️', '🎳',
  '💡', '🚀', '🏕️', '🍻', '🎯', '✨'
];

export default function CreateRoomPage() {
  const router = useRouter();

  const [question, setQuestion] = useState('');
  // Start with 2 options
  const [options, setOptions] = useState<OptionItem[]>([
    { id: '1', text: '', emoji: '🍕' },
    { id: '2', text: '', emoji: '🍣' },
  ]);
  const [activeEmojiPickerIndex, setActiveEmojiPickerIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAddOption = () => {
    if (options.length >= 6) return;
    const nextEmoji = COMMON_EMOJIS[(options.length + 2) % COMMON_EMOJIS.length];
    setOptions([
      ...options,
      { id: String(Date.now()), text: '', emoji: nextEmoji },
    ]);
  };

  const handleRemoveOption = (indexToRemove: number) => {
    if (options.length <= 2) return;
    if (activeEmojiPickerIndex === indexToRemove) {
      setActiveEmojiPickerIndex(null);
    }
    setOptions(options.filter((_, i) => i !== indexToRemove));
  };

  const handleOptionTextChange = (index: number, text: string) => {
    const updated = [...options];
    updated[index].text = text;
    setOptions(updated);
    if (validationError) setValidationError(null);
  };

  const handleOptionEmojiChange = (index: number, emoji: string) => {
    const updated = [...options];
    updated[index].emoji = emoji;
    setOptions(updated);
    setActiveEmojiPickerIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation 1: Question is required
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setValidationError('Please enter a question to decide.');
      return;
    }

    // Validation 2: At least 2 non-empty options
    const validOptions = options
      .map((opt) => ({
        ...opt,
        text: opt.text.trim(),
        emoji: opt.emoji.trim() || '✨',
      }))
      .filter((opt) => opt.text.length > 0);

    if (validOptions.length < 2) {
      setValidationError('Please enter at least 2 non-empty options.');
      return;
    }

    setIsSubmitting(true);

    // Room creation goes through a server route (not a direct Supabase call)
    // so it can be rate-limited — otherwise nothing stops a script from
    // spamming room creation, since RLS alone only governs row-level access.
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmedQuestion, options: validOptions }),
      });

      if (res.ok) {
        const { code } = await res.json();
        router.push(`/room/${code}`);
        return;
      }

      if (res.status === 429) {
        const { error } = await res.json();
        setValidationError(error || 'Too many rooms created. Try again in a bit.');
        return;
      }

      // Any other failure (Supabase not configured, network blip, etc.) —
      // fall back to a local-only room so the demo still works.
      throw new Error('room creation failed');
    } catch (err) {
      console.error('Error creating decision room, using local fallback:', err);
      const roomCode = generateRoomCode();
      const fallbackRoom = {
        id: 'room-' + Date.now(),
        code: roomCode,
        question: trimmedQuestion,
        duration_seconds: 300,
        status: 'open',
        created_at: new Date().toISOString(),
      };
      const fallbackOptions = validOptions.map((opt, i) => ({
        id: `opt-${i}`,
        room_id: fallbackRoom.id,
        text: opt.text,
        emoji: opt.emoji,
      }));
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`decyde_room_${roomCode}`, JSON.stringify({ room: fallbackRoom, options: fallbackOptions }));
      }
      router.push(`/room/${roomCode}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SonarGrid
      ringWidth={90}
      speed={260}
      amplitude={2.2}
      pingEvery={4}
      interactive
      spacing={26}
      baseOpacity={0.2}
      seedPing={false}
      pingArea={[0.15, 0.1, 0.85, 0.55]}
      className="bg-background text-foreground flex min-h-screen w-full flex-col font-sans"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex w-fit items-center gap-1.5 text-xs font-medium transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>

        <div className="bg-card text-card-foreground border-border rounded-2xl border p-6 sm:p-9 shadow-sm">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Start a decyde
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Drop the question, add the options, share the link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question Input */}
            <div>
              <label
                htmlFor="question-input"
                className="text-muted-foreground block text-xs font-medium uppercase tracking-wider mb-2"
              >
                The Decision
              </label>
              <input
                id="question-input"
                type="text"
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="What are we deciding?"
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/50 w-full px-4 py-3.5 rounded-xl border outline-none focus-visible:ring-[3px] text-base font-medium transition"
                autoFocus
              />
            </div>

            {/* Dynamic Options List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Options ({options.length}/6)
                </label>
                <span className="text-muted-foreground text-xs">
                  Min 2 options
                </span>
              </div>

              <div className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {options.map((option, index) => (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative"
                    >
                      <div className="flex items-center gap-2">
                        {/* Emoji Picker Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setActiveEmojiPickerIndex(
                              activeEmojiPickerIndex === index ? null : index
                            )
                          }
                          className="bg-secondary hover:bg-accent border-border w-12 h-12 rounded-xl border flex items-center justify-center text-xl flex-shrink-0 transition active:scale-95"
                          title="Click to choose emoji"
                        >
                          {option.emoji || '✨'}
                        </button>

                        {/* Option Text Input */}
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => handleOptionTextChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/50 flex-1 px-4 py-3 rounded-xl border outline-none focus-visible:ring-[3px] text-sm font-medium transition"
                        />

                        {/* Remove Button (Allowed when > 2 options) */}
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(index)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-3 rounded-xl transition flex-shrink-0"
                            aria-label={`Remove option ${index + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Emoji Quick-Select Palette */}
                      {activeEmojiPickerIndex === index && (
                        <div className="bg-secondary border-border mt-2 p-3 rounded-xl border shadow-lg z-20">
                          <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                              Pick an Emoji
                            </span>
                            <input
                              type="text"
                              maxLength={2}
                              placeholder="Custom"
                              className="bg-background border-border w-16 px-1.5 py-0.5 text-center text-xs rounded-lg border outline-none"
                              onChange={(e) => {
                                if (e.target.value.trim()) {
                                  handleOptionEmojiChange(index, e.target.value.trim());
                                }
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-6 gap-1.5 text-xl">
                            {COMMON_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleOptionEmojiChange(index, emoji)}
                                className="hover:bg-background w-10 h-10 rounded-lg flex items-center justify-center transition active:scale-90"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Add Option Button (Only if < 6) */}
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="border-border hover:border-foreground text-muted-foreground hover:text-foreground mt-3 w-full py-2.5 rounded-xl border border-dashed text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Option</span>
                </button>
              )}
            </div>

            {/* Validation Error Message */}
            {validationError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-destructive/10 border-destructive/30 text-destructive flex items-center gap-2 p-3 rounded-xl border text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{validationError}</span>
              </motion.div>
            )}

            {/* Single Primary CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:opacity-90 w-full py-3.5 rounded-full font-medium text-sm shadow-sm transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Creating Room...</span>
                </>
              ) : (
                <>
                  <span>Create Decision Room</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          made for group chats that literally cannot decide
        </p>
        <Footer className="mt-3" />
      </div>
    </SonarGrid>
  );
}
