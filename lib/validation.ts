// Letters and spaces only — matches the "alphabets only" rule for dish/restaurant names.
export const ALPHA_SPACE_PATTERN = /^[A-Za-z ]+$/;

// Digits with an optional decimal fraction (e.g. "250" or "149.50").
export const PRICE_PATTERN = /^\d+(\.\d+)?$/;

export function stripNonAlpha(value: string): string {
  return value.replace(/[^A-Za-z ]/g, "");
}

export function stripNonPriceChars(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
}
