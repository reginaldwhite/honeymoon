import type { Metadata } from "next";
import { trip } from "@/content/trip";
import { Eyebrow } from "@/components/typography";
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
      <div className="flex flex-col items-center gap-3 text-center">
        <Eyebrow>Private itinerary</Eyebrow>
        <h1 className="text-4xl font-normal text-balance sm:text-5xl">{trip.title}</h1>
        <hr className="hr w-16" />
      </div>
      <LoginForm redirectTo={from ?? "/"} />
    </main>
  );
}
