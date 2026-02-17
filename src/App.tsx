import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import { NewsletterAdmin } from './pages/NewsletterAdmin';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<ArticleDetail />} />
          <Route path="/recap" element={<Recap />} />
          <Route path="/recap/:id" element={<RecapDetail />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/interviews/:id" element={<ArticleDetail />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/galerie" element={<Galerie />} />
          <Route path="/galerie/:id" element={<AlbumDetail />} />
          <Route path="/team" element={<Team />} />
          <Route path="/newsletter" element={<Newsletter />} />
          <Route path="/newsletter/admin" element={<NewsletterAdmin />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookies" element={<CookiesPolicy />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

