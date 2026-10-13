import "server-only";
import bcrypt from "bcryptjs";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE, createSessionCookieValue } from "@/lib/session";
import { checkLoginAttempt, clearLoginAttempts, recordFailedLogin } from "@/lib/login-throttle";

/**
 * The one way in, shared by the login form and the `?key=` link: throttle by
 * client, compare against the bcrypt hash, and on success hand back the
 * sealed cookie to set.
 */
export type PasswordCheck =
  | { ok: true; cookie: { name: string; value: string; options: CookieOptions } }
  | { ok: false; error: string };

export interface CookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
}

/** Best-effort client identity for throttling, from the proxy headers. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

export async function checkPassword(password: string, client: string): Promise<PasswordCheck> {
  if (password.length === 0) return { ok: false, error: "Enter the password." };

  const { allowed, retryAfterMinutes } = checkLoginAttempt(client);
  if (!allowed) {
    return { ok: false, error: `Too many attempts. Try again in ${retryAfterMinutes} minutes.` };
  }

  const passwordHash = process.env.SITE_PASSWORD_HASH;
  if (!passwordHash) throw new Error("SITE_PASSWORD_HASH env var is not set");

  if (!(await bcrypt.compare(password, passwordHash))) {
    recordFailedLogin(client);
    return { ok: false, error: "Incorrect password." };
  }

  clearLoginAttempts(client);
  return {
    ok: true,
    cookie: {
      name: SESSION_COOKIE_NAME,
      value: await createSessionCookieValue(),
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      },
    },
  };
}
