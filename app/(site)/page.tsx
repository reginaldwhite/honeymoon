import { getChapters } from "@/content/chapters";
import { Timeline } from "@/components/timeline";
import { TripOpening } from "@/components/trip-opening";

/**
 * The whole trip, in one scroll: the opening, then the chapters.
 *
 * There is deliberately no chapter-card index between the introduction and
 * Chapter One. Each chapter's opener already carries its photograph, note,
 * dates and map a screen below, so an index here said all of it twice; the
 * sticky chapter bar inside <Timeline /> is the only jump affordance needed.
 */
export default function HomePage() {
  return (
    <>
      <TripOpening chapters={getChapters()} />
      <Timeline />
    </>
  );
}
