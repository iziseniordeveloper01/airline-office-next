import Homebanner from "@/components/layout/Homebanner";
import Headquarters from "@/components/layout/Headquarters";
import WhyChooseUs from "@/components/layout/WhyChooseUs";
import CtaBanner from "@/components/layout/CtaBanner";
import PopularAirlines from "@/components/layout/PopularAirlines";

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
