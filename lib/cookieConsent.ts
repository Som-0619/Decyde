const CONSENT_KEY = 'decyde_cookie_consent';

export type ConsentChoice = 'accepted' | 'declined';

export function getCookieConsent(): ConsentChoice | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(CONSENT_KEY);
  return value === 'accepted' || value === 'declined' ? value : null;
}

export function setCookieConsent(choice: ConsentChoice) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONSENT_KEY, choice);
  window.dispatchEvent(new CustomEvent('decyde:consent-changed', { detail: choice }));
}

/** Streaks are the only non-essential (gamification) local storage decyde keeps — gated on consent. */
export function hasOptionalStorageConsent(): boolean {
  return getCookieConsent() === 'accepted';
}
