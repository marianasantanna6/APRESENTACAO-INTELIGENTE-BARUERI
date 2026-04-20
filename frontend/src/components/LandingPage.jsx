import CategoriesSection from './CategoriesSection'
import FeaturesSection from './FeaturesSection'
import HeroSection from './HeroSection'
import Navbar from './Navbar'
import StepsSection from './StepsSection'

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
  )
}

export default LandingPage
