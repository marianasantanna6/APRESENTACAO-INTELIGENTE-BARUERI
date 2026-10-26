import CategoriesSection from "../../components/CategoriesSection";
import FeaturesSection from "../../components/FeaturesSection";
import HeroSection from "../../components/HeroSection";
import Navbar from "../../components/Navbar";
import StepsSection from "../../components/StepsSection";

function LandingPage() {
  return (
    <div data-page-theme="public" className="min-h-screen bg-[#f8fafc] text-[#1e1e1e]">
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <CategoriesSection />
        <FeaturesSection />
        <StepsSection />
      </main>
    </div>
  );
}

export default LandingPage;
