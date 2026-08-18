export const TEST_PREFIX = "Zzztest";

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

function randomLetters(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }
  return out;
}

// Dish/restaurant names only allow letters and spaces, so uniqueness has to
// come from a random letter suffix rather than a timestamp or counter.
export function uniqueDishName(): string {
  return `${TEST_PREFIX} Dish ${randomLetters(8)}`;
}

export function uniqueRestaurantName(): string {
  return `${TEST_PREFIX} Restaurant ${randomLetters(8)}`;
}
