import Homebanner from "@/components/layout/Homebanner";
import Headquarters from "@/components/layout/Headquarters";
import WhyChooseUs from "@/components/layout/WhyChooseUs";
import CtaBanner from "@/components/layout/CtaBanner";
import PopularAirlines from "@/components/layout/PopularAirlines";

// Rendered at runtime, not at build: the PopularAirlines/Headquarters sections
// read from MySQL, and Railway's build phase can't reach the private
// mysql.railway.internal host, so a build-time prerender fails.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main>
      <Homebanner />
      <PopularAirlines />
      <Headquarters />
      <WhyChooseUs />
      <CtaBanner />
    </main>
  );
}
