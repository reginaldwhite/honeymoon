import { SiteHeader } from "@/components/site-header";

/**
 * Widened from max-w-5xl to max-w-6xl: the photo-led day spreads put
 * photographs and notes side by side, and the photographs need the room to
 * lead. The header and the sticky chapter bar use the same measure so the
 * three stay in column.
 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6">{children}</main>
    </div>
  );
}
