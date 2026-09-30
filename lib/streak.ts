import { supabase } from './supabaseClient';
import { Profile } from './types';
import { hasOptionalStorageConsent } from './cookieConsent';

const VOTER_ID_KEY = 'decyde_voter_id';
const LOCAL_PROFILE_PREFIX = 'decyde_profile_';

export function getOrCreateVoterId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(VOTER_ID_KEY);
  if (!id) {
    id = 'voter_' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem(VOTER_ID_KEY, id);
  }
  return id;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function emptyProfile(voterId: string): Profile {
  return {
    voter_id: voterId,
    display_name: null,
    current_streak: 0,
    longest_streak: 0,
    last_active_date: null,
    total_rooms: 0,
  };
}

function readLocalProfile(voterId: string): Profile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(`${LOCAL_PROFILE_PREFIX}${voterId}`);
  return raw ? (JSON.parse(raw) as Profile) : null;
}

function writeLocalProfile(profile: Profile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${LOCAL_PROFILE_PREFIX}${profile.voter_id}`, JSON.stringify(profile));
}

export async function getProfile(voterId: string): Promise<Profile | null> {
  if (!voterId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('voter_id', voterId)
      .maybeSingle();

    if (!error && data) return data as Profile;
  } catch (err) {
    console.warn('Supabase profile fetch note (falling back to local cache):', err);
  }

  return readLocalProfile(voterId);
}

export interface StreakResult {
  profile: Profile;
  incremented: boolean;
}

/**
 * Call once per finished vote. Increments the streak at most once per calendar
 * day: +1 if the voter's last active day was yesterday, resets to 1 otherwise.
 */
export async function recordVoteStreak(voterId: string): Promise<StreakResult> {
  if (!voterId) {
    return { profile: emptyProfile(voterId), incremented: false };
  }

  // Streaks are the one non-essential (gamification) piece of local storage
  // decyde keeps — respect a "decline" on the cookie banner by not writing
  // new streak data. Reading existing data back (getProfile) is unaffected.
  if (!hasOptionalStorageConsent()) {
    const existing = (await getProfile(voterId)) ?? emptyProfile(voterId);
    return { profile: existing, incremented: false };
  }

  const existing = (await getProfile(voterId)) ?? emptyProfile(voterId);
  const today = todayStr();

  if (existing.last_active_date === today) {
    return { profile: existing, incremented: false };
  }

  const wasYesterday = existing.last_active_date === yesterdayStr();
  const newStreak = wasYesterday ? existing.current_streak + 1 : 1;

  const updated: Profile = {
    ...existing,
    current_streak: newStreak,
    longest_streak: Math.max(existing.longest_streak, newStreak),
    last_active_date: today,
    total_rooms: existing.total_rooms + 1,
  };

  try {
    await supabase.from('profiles').upsert(updated, { onConflict: 'voter_id' });
  } catch (err) {
    console.warn('Supabase profile upsert note (kept locally only):', err);
  }

  writeLocalProfile(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('decyde:streak-updated', { detail: updated }));
  }

  return { profile: updated, incremented: true };
}
