import Link from "next/link";
import { getChapters, getFrontispiece, type ResolvedChapter } from "@/content/chapters";
import type { MediaRef } from "@/content/types";
import { getChapterMedia } from "@/lib/content";
import { formatShortDate } from "@/lib/format";
import { readTrip } from "@/lib/trip-repository";
import { rawMediaUrl } from "@/components/admin/raw-media-url";

/**
 * The itinerary editor's front door: the opening, then the chapters, each a
 * card. Open one and the whole chapter is in edit mode, laid out exactly as
 * the reader sees it, and saves as you type.
 */

function Thumb({ media, alt }: { media?: MediaRef; alt: string }) {
  return (
    <div className="aspect-[3/2] w-full overflow-hidden rounded-md bg-secondary/40">
      {media?.sourcePath ? (
        // eslint-disable-next-line @next/next/no-img-element -- local dev-only file stream
        <img
          src={rawMediaUrl(media.sourcePath, undefined, 640)}
          alt={alt}
          className="grade h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          No photograph yet
        </div>
      )}
    </div>
  );
}

function ChapterCard({ chapter }: { chapter: ResolvedChapter }) {
  const media = getChapterMedia(chapter);
  const photos = media.length;
  const missingAlt = media.filter((m) => !m.alt.trim()).length;
  const activities = chapter.activities.length;

  return (
    <Link
      href={`/admin/itinerary/${chapter.id}`}
      className="group flex flex-col gap-3 rounded-md border border-border p-4 no-underline transition-colors hover:border-primary"
    >
      <Thumb media={chapter.cover} alt="" />
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-primary">{chapter.ordinal}</p>
        <h2 className="mt-1 font-display text-xl italic text-foreground">
          {chapter.title || "Untitled chapter"}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {chapter.start && chapter.end ? (
            <>
              {formatShortDate(chapter.start)} &ndash; {formatShortDate(chapter.end)} ·{" "}
            </>
          ) : (
            <>No dates yet · </>
          )}
          {activities} activit{activities === 1 ? "y" : "ies"} · {photos} photo
          {photos === 1 ? "" : "s"}
        </p>
        {missingAlt > 0 && (
          <p className="mt-1 text-xs text-destructive">
            {missingAlt} photo{missingAlt === 1 ? "" : "s"} need alt text
          </p>
        )}
      </div>
    </Link>
  );
}

export default async function AdminItineraryPage() {
  const trip = await readTrip();
  const chapters = getChapters(trip);
  const frontispiece = getFrontispiece(trip, chapters);

  return (
    <div className="mx-auto max-w-6xl pb-24">
      <div>
        <h1 className="font-display text-3xl italic text-foreground">Itinerary editor</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          The trip page, part by part. Open the opening or a chapter to edit everything in
          it, laid out exactly as the reader sees it. Changes save as you type.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/itinerary/overview"
          className="flex flex-col gap-3 rounded-md border border-border p-4 no-underline transition-colors hover:border-primary"
        >
          <Thumb media={frontispiece} alt="" />
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Opening</p>
            <h2 className="mt-1 font-display text-xl italic text-foreground">
              {trip.headline || trip.title}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Headline, subtitle, frontispiece, map copy, and the overview.
            </p>
          </div>
        </Link>

        {chapters.map((chapter) => (
          <ChapterCard key={chapter.id} chapter={chapter} />
        ))}
      </div>
    </div>
  );
}
