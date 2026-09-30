'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

const OnlineCountContext = createContext(0);

/**
 * Tracks how many browser tabs are currently open anywhere on the site, via
 * a single Supabase Realtime Presence channel shared across every page.
 * Mounted once in the root layout so it reflects site-wide activity, not
 * just whoever's on the current page.
 */
export function OnlineCountProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const clientId = 'client_' + Math.random().toString(36).slice(2);
    const channel = supabase.channel('decyde:online', {
      config: { presence: { key: clientId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        setCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return <OnlineCountContext.Provider value={count}>{children}</OnlineCountContext.Provider>;
}

export function useOnlineCount() {
  return useContext(OnlineCountContext);
}
