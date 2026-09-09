import type { Turn } from './neuro.ts';

// Keep only a short, deduplicated in-memory history for the current session.
export function mergeSessionTurns(previous: Turn[], current: Turn[], limit = 40): Turn[] {
  const unique = new Map<string, Turn>();
  for (const turn of [...previous, ...current]) unique.set(turn.id, turn);
  return [...unique.values()].slice(-Math.max(1, limit));
}
