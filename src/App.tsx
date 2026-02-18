import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { News } from './pages/News';
import { Agenda } from './pages/Agenda';
import { Recap } from './pages/Recap';
import { Interviews } from './pages/Interviews';
import { Team } from './pages/Team';
import { Galerie } from './pages/Galerie';
import { AlbumDetail } from './pages/AlbumDetail';
import { ArticleDetail } from './pages/ArticleDetail';
import { RecapDetail } from './pages/RecapDetail';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { CookiesPolicy } from './pages/CookiesPolicy';
import { MentionsLegales } from './pages/MentionsLegales';
import { Newsletter } from './pages/Newsletter';
import { RecapCreate } from './pages/RecapCreate';
import { AgendaCreate } from './pages/AgendaCreate';
import { GalerieCreate } from './pages/GalerieCreate';
import { AdminDashboard } from './pages/AdminDashboard';
import { NewsletterAdmin } from './pages/NewsletterAdmin';
import { NewsletterStudio } from './pages/NewsletterStudio';
import { NewsCreate } from './pages/NewsCreate';
import { AdminManage } from './pages/AdminManage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  useEffect(() => {
    const originalTitle = document.title;
    const scrollText = "DROPSIDERS : L'actu de tous les festivals ";

    let position = 0;
    const interval = setInterval(() => {
      document.title = scrollText.substring(position) + scrollText.substring(0, position);
      position++;
      if (position >= scrollText.length) position = 0;
    }, 200);

    return () => {
      clearInterval(interval);
      document.title = originalTitle;
    };
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/recaps" element={<Recap />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/team" element={<Team />} />
          <Route path="/galerie" element={<Galerie />} />
          <Route path="/galerie/:id" element={<AlbumDetail />} />
          <Route path="/news/:id" element={<ArticleDetail />} />
          <Route path="/interviews/:id" element={<ArticleDetail />} />
          <Route path="/recaps/:id" element={<RecapDetail />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/politique-de-confidentialite" element={<PrivacyPolicy />} />
          <Route path="/cgu" element={<TermsOfService />} />
          <Route path="/cookies" element={<CookiesPolicy />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/manage" element={<ProtectedRoute><AdminManage /></ProtectedRoute>} />

          <Route path="/newsletter" element={<Newsletter />} />
          <Route path="/newsletter/admin" element={<ProtectedRoute><NewsletterAdmin /></ProtectedRoute>} />
          <Route path="/newsletter/studio" element={<NewsletterStudio />} />

          <Route path="/news/create" element={<ProtectedRoute><NewsCreate /></ProtectedRoute>} />
          <Route path="/recaps/create" element={<ProtectedRoute><RecapCreate /></ProtectedRoute>} />
          <Route path="/agenda/create" element={<ProtectedRoute><AgendaCreate /></ProtectedRoute>} />
          <Route path="/galerie/create" element={<ProtectedRoute><GalerieCreate /></ProtectedRoute>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

