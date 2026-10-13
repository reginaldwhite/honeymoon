"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkPassword, clientKey } from "@/lib/login";
import { SESSION_COOKIE_NAME } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

function safeRedirectPath(path: FormDataEntryValue | null): string {
  if (typeof path === "string" && path.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return "/";
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get("password");
  const redirectTo = safeRedirectPath(formData.get("redirectTo"));

  const result = await checkPassword(
    typeof password === "string" ? password : "",
    clientKey(await headers()),
  );
  if (!result.ok) return { error: result.error };

  const cookieStore = await cookies();
  cookieStore.set(result.cookie.name, result.cookie.value, result.cookie.options);

  redirect(redirectTo);
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
