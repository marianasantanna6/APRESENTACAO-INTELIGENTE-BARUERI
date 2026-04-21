import { Navigate, Route, Routes } from "react-router-dom";
import CreatePresentationPage from "./components/CreatePresentationPage";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import ScrollReveal from "./components/ScrollReveal";

function App() {
  return (
    <>
      <ScrollReveal />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/criar" element={<CreatePresentationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
