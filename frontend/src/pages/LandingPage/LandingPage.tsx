import CategoriesSection from "../../components/CategoriesSection";
import FeaturesSection from "../../components/FeaturesSection";
import HeroSection from "../../components/HeroSection";
import Navbar from "../../components/Navbar";
import StepsSection from "../../components/StepsSection";

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e1e1e]">
      <Navbar />
      <main>
        <HeroSection />
        <CategoriesSection />
        <FeaturesSection />
        <StepsSection />
      </main>
    </div>
  );
}

export default LandingPage;
