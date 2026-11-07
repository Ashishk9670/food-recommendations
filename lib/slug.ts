// Pure helper (no DB imports) so client components can build restaurant links.
// Restaurant names are letters and spaces only, so this is always URL-safe.
export function restaurantSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

// One place is often typed several ways ("Meghana Foods", "meghana  foods").
// Show the spelling used most often; on a tie, the better-capitalised one;
// then the most recent. `namesNewestFirst` must be ordered newest first.
export function canonicalName(namesNewestFirst: string[]): string {
  const tally = new Map<string, { count: number; firstSeen: number }>();
  namesNewestFirst.forEach((raw, index) => {
    const name = raw.trim().replace(/\s+/g, " ");
    const entry = tally.get(name);
    if (entry) entry.count += 1;
    else tally.set(name, { count: 1, firstSeen: index });
  });
  const capitals = (s: string) => (s.match(/\b[A-Z]/g) ?? []).length;
  return [...tally.entries()].sort(
    ([a, x], [b, y]) => y.count - x.count || capitals(b) - capitals(a) || x.firstSeen - y.firstSeen,
  )[0][0];
}
