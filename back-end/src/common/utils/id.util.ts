let counters: Record<string, number> = {};

export function generateId(prefix: string): string {
  if (!counters[prefix]) counters[prefix] = 1;
  const id = `${prefix}${String(counters[prefix]).padStart(3, '0')}`;
  counters[prefix]++;
  return id;
}
