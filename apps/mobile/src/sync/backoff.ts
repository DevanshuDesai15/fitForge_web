export function nextRetryAt(attempts: number, nowMs: number, random: () => number = Math.random): string {
  const exponent = Math.max(0, attempts - 1);
  const baseDelayMs = Math.min(60 * 60 * 1000, 1000 * 2 ** exponent);
  const jitter = 0.75 + Math.min(1, Math.max(0, random())) * 0.5;
  return new Date(nowMs + Math.round(baseDelayMs * jitter)).toISOString();
}
