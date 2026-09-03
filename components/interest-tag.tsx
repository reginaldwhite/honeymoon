import { interests } from "@/content/interests";

const labelBySlug = new Map(interests.map((interest) => [interest.slug, interest.label]));

export function InterestTag({ slug }: { slug: string }) {
  const label = labelBySlug.get(slug) ?? slug;

  return (
    <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] uppercase tracking-wide text-primary">
      {label}
    </span>
  );
}
