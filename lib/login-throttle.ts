import "server-only";

/**
 * A small in-process throttle on password attempts. The site is protected by a
 * single shared password and the link is handed out directly, so the realistic
 * threat is someone guessing at it rather than a distributed attack — an
 * in-memory counter is proportionate. It resets when the server restarts, and
 * is per-instance rather than global.
 */
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkLoginAttempt(key: string): { allowed: boolean; retryAfterMinutes: number } {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || record.resetAt <= now) {
    return { allowed: true, retryAfterMinutes: 0 };
  }
  if (record.count < MAX_ATTEMPTS) {
    return { allowed: true, retryAfterMinutes: 0 };
  }
  return {
    allowed: false,
    retryAfterMinutes: Math.max(1, Math.ceil((record.resetAt - now) / 60000)),
  };
}

export function recordFailedLogin(key: string): void {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || record.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  record.count += 1;

  // Opportunistic cleanup so the map can't grow without bound.
  if (attempts.size > 1000) {
    for (const [existingKey, value] of attempts) {
      if (value.resetAt <= now) attempts.delete(existingKey);
    }
  }
}

export function clearLoginAttempts(key: string): void {
  attempts.delete(key);
}
