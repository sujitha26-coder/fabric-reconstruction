import { Route, Routes } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import GalleryPage from './pages/GalleryPage';
import UploadPage from './pages/UploadPage';
import ResultsPage from './pages/ResultsPage';
import AnalysisPage from './pages/AnalysisPage';
import QualityInspectorPage from './pages/QualityInspectorPage';
import ColorwayStudioPage from './pages/ColorwayStudioPage';
import TextileLibraryPage from './pages/TextileLibraryPage';
import RestorationLabPage from './pages/RestorationLabPage';
import HowItWorksPage from './pages/HowItWorksPage';
import ContactPage from './pages/ContactPage';
import AuthPage from './pages/AuthPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<GalleryPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/analysis/:id" element={<AnalysisPage />} />
          <Route path="/quality-inspector" element={<QualityInspectorPage />} />
          <Route path="/colorway-studio" element={<ColorwayStudioPage />} />
          <Route path="/textile-library" element={<TextileLibraryPage />} />
          <Route path="/restoration-lab" element={<RestorationLabPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
