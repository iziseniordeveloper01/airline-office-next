import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getSettings } from "@/lib/data/getSettings";

// Scoped to the (site) route group only — admin/ is a sibling outside this
// group and never inherits this chrome. getSettings() is cached (tag: 'settings'),
// so reading it here keeps every public page's static/ISR rendering intact.
export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  return (
    <>
      <Navbar tagline={settings.tagline} phone={settings.contactPhone} />
      <div className="flex-1">{children}</div>
      <Footer settings={settings} />
    </>
  );
}
