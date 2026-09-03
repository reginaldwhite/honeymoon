"use server";

import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  createSessionCookieValue,
} from "@/lib/session";
import { checkLoginAllowed, clearLoginAttempts, recordFailedLogin } from "@/lib/login-throttle";

export type LoginState = { error?: string } | undefined;

function safeRedirectPath(path: FormDataEntryValue | null): string {
  if (typeof path === "string" && path.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return "/";
}

/** Best-effort client identity for throttling. */
async function requestKey(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get("password");
  const redirectTo = safeRedirectPath(formData.get("redirectTo"));

  if (typeof password !== "string" || password.length === 0) {
    return { error: "Enter the password." };
  }

  const key = await requestKey();
  const { allowed, retryAfterMinutes } = checkLoginAllowed(key);
  if (!allowed) {
    return { error: `Too many attempts. Try again in ${retryAfterMinutes} minutes.` };
  }

  const passwordHash = process.env.SITE_PASSWORD_HASH;
  if (!passwordHash) {
    throw new Error("SITE_PASSWORD_HASH env var is not set");
  }

  const isValid = await bcrypt.compare(password, passwordHash);
  if (!isValid) {
    recordFailedLogin(key);
    return { error: "Incorrect password." };
  }

  clearLoginAttempts(key);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, await createSessionCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect(redirectTo);
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
