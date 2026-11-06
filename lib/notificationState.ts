const STORAGE_KEY = "notificationsLastSeen";

// A first-time visitor starts from "now" rather than from the beginning of
// time, so the bell doesn't open with the site's entire history as "new".
export function getLastSeen(): string {
  const now = new Date().toISOString();
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && !Number.isNaN(new Date(stored).getTime())) return stored;
    window.localStorage.setItem(STORAGE_KEY, now);
  } catch {
    // Storage unavailable (private mode, blocked site data): fall through.
  }
  return now;
}

export function markSeen(timestamp: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, timestamp);
  } catch {
    // Best effort — worst case the same items show as new again next visit.
  }
}
