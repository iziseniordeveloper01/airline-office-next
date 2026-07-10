import { draftMode } from "next/headers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DraftModeBanner from "@/components/layout/DraftModeBanner";
import { getSettings } from "@/lib/data/getSettings";
import { getAllAirlines } from "@/lib/data/getAirline";

// Scoped to the (site) route group only — admin/ is a sibling outside this
// group and never inherits this chrome. getSettings() and getAllAirlines() are
// both request-cached, so reading them here keeps public pages' rendering intact.
export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, airlines, { isEnabled: previewing }] = await Promise.all([
    getSettings(),
    getAllAirlines(),
    draftMode(),
  ]);

  // Footer "Top Airlines" — featured first, busiest as fallback, capped at 5.
  const featured = airlines.filter((a) => a.isFeatured);
  const topAirlines = (
    featured.length >= 3
      ? featured
      : [...airlines].sort((a, b) => b.officeCount - a.officeCount)
  )
    .slice(0, 5)
    .map((a) => ({ slug: a.slug, name: a.name }));

  return (
    <>
      {previewing && <DraftModeBanner />}
      <Navbar tagline={settings.tagline} phone={settings.contactPhone} />
      <div className="flex-1">{children}</div>
      <Footer settings={settings} topAirlines={topAirlines} />
    </>
  );
}
