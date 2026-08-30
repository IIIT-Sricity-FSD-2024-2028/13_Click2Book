// Repositories seed themselves with hardcoded literal IDs (e.g. BookingRepository's
// 'B001'..'B003') that never went through generateId(). Without this, the first real
// generateId('B') call would also mint 'B001' and collide with the seeded row — two
// entries sharing an ID, with Array.find()-based lookups silently resolving to the
// old seeded one instead of the newly created one. Starting each prefix's counter
// past its highest hardcoded seed value avoids that. Update this map if seed data
// for a prefix grows past these values.
let counters: Record<string, number> = {
  A: 2, B: 3, C: 4, IRCTC: 1, O: 3, P: 10, PAY: 3, R: 10, REV: 3, SCH: 25, SR: 3, SUP: 2, T: 25, V: 19,
};

export function generateId(prefix: string): string {
  if (!counters[prefix]) counters[prefix] = 0;
  counters[prefix]++;
  return `${prefix}${String(counters[prefix]).padStart(3, '0')}`;
}
