import "server-only";
import { sealData, unsealData } from "iron-session";

export const SESSION_COOKIE_NAME = "honeymoon_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

type SessionPayload = {
  authenticated: true;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET env var must be set to a random string of at least 32 characters",
    );
  }
  return secret;
}

/** Seals an authenticated session into an encrypted, tamper-proof cookie value. */
export async function createSessionCookieValue(): Promise<string> {
  return sealData(
    { authenticated: true } satisfies SessionPayload,
    { password: getSessionSecret(), ttl: SESSION_MAX_AGE },
  );
}

/** Verifies a session cookie value. Returns false for missing, expired, or tampered cookies. */
export async function isValidSessionCookieValue(
  value: string | undefined,
): Promise<boolean> {
  if (!value) return false;
  try {
    const data = await unsealData<SessionPayload>(value, {
      password: getSessionSecret(),
      ttl: SESSION_MAX_AGE,
    });
    return data.authenticated === true;
  } catch {
    return false;
  }
}
