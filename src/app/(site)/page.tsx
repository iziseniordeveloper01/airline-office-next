import Homebanner from "@/components/layout/Homebanner";
import Headquarters from "@/components/layout/Headquarters";
import HowItWorks from "@/components/layout/HowItWorks";
import WhyChooseUs from "@/components/layout/WhyChooseUs";
import LatestFromBlog from "@/components/layout/LatestFromBlog";
import CtaBanner from "@/components/layout/CtaBanner";
import PopularAirlines from "@/components/layout/PopularAirlines";

// Rendered at runtime, not at build: the PopularAirlines/Headquarters sections
// read from MySQL, and Railway's build phase can't reach the private
// mysql.railway.internal host, so a build-time prerender fails.
export const dynamic = "force-dynamic";

// Section backgrounds alternate dark → white → gray-50 → white → gray-50 →
// white → indigo; keep that rhythm when reordering.
export default function Home() {
  return (
    <main>
      <Homebanner />
      <PopularAirlines />
      <Headquarters />
      <HowItWorks />
      <WhyChooseUs />
      <LatestFromBlog />
      <CtaBanner />
    </main>
  );
}
