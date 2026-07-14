import HeroSection from "@/components/HeroSection";
import CategoryGrid from "@/components/CategoryGrid";
import TrendingProducts from "@/components/TrendingProducts";
import SaleBanner from "@/components/SaleBanner";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <CategoryGrid />
      <TrendingProducts />
      <SaleBanner />
    </div>
  );
}
