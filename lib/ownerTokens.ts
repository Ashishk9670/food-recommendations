const STORAGE_KEY = "myRecommendationTokens";

export function getOwnerTokens(): Record<number, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveOwnerToken(id: number, token: string) {
  const tokens = getOwnerTokens();
  tokens[id] = token;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function getOwnerToken(id: number): string | undefined {
  return getOwnerTokens()[id];
}
