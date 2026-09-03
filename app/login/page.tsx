import type { Metadata } from "next";
import { trip } from "@/content/trip";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Enter",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-background px-6 py-24">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">Private itinerary</p>
        <h1 className="font-display text-4xl italic text-foreground sm:text-5xl">
          {trip.title}
        </h1>
      </div>
      <LoginForm redirectTo={from ?? "/"} />
    </main>
  );
}
