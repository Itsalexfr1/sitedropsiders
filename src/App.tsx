import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { News } from './pages/News';
import { Agenda } from './pages/Agenda';
import { Recap } from './pages/Recap';
import { Interviews } from './pages/Interviews';
import { Team } from './pages/Team';
import { Shop } from './pages/Shop';
import { Galerie } from './pages/Galerie';
import { AlbumDetail } from './pages/AlbumDetail';
import { ArticleDetail } from './pages/ArticleDetail';
import { RecapDetail } from './pages/RecapDetail';
import { LivePage } from './pages/LivePage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { CookiesPolicy } from './pages/CookiesPolicy';
import { MentionsLegales } from './pages/MentionsLegales';
import { Newsletter } from './pages/Newsletter';
import { Unsubscribe } from './pages/Unsubscribe';
import { ClipsPage } from './pages/ClipsPage';
import { RecapCreate } from './pages/RecapCreate';
import { AgendaCreate } from './pages/AgendaCreate';
import { GalerieCreate } from './pages/GalerieCreate';
import { AdminDashboard } from './pages/AdminDashboard';
import { NewsletterAdmin } from './pages/NewsletterAdmin';
import { NewsletterComposer } from './pages/NewsletterComposer';
import { NewsCreate } from './pages/NewsCreate';
import { AdminManage } from './pages/AdminManage';
import { AdminTeam } from './pages/AdminTeam';
import { AdminEditors } from './pages/AdminEditors';
import { AdminStats } from './pages/AdminStats';
import { AdminSpotify } from './pages/AdminSpotify';
import { AdminShop } from './pages/AdminShop';
import KitMedia from './pages/KitMedia';
import { AdminHome } from './pages/AdminHome';
import { AdminSettings } from './pages/AdminSettings';
import { AdminMessages } from './pages/AdminMessages';
import { AdminBanner } from './pages/AdminBanner';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import { CookieConsent } from './components/ui/CookieConsent';
import { GoogleAdSense } from './components/analytics/GoogleAdSense';
import { ScrollToTop } from './components/utils/ScrollToTop';

function Root() {
  return (
    <>
      <ScrollToTop />
      <GoogleAdSense />
      <Layout>
        <Outlet />
      </Layout>
      <CookieConsent />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { index: true, element: <Home /> },
      { path: "live", element: <LivePage /> },
      { path: "news", element: <News /> },
      { path: "agenda", element: <Agenda /> },
      { path: "recaps", element: <Recap /> },
      { path: "interviews", element: <Interviews /> },
      { path: "team", element: <Team /> },
      { path: "shop", element: <Shop /> },
      { path: "galerie", element: <Galerie /> },
      { path: "galerie/:id", element: <AlbumDetail /> },
      { path: "news/:id", element: <ArticleDetail /> },
      { path: "interviews/:id", element: <ArticleDetail /> },
      { path: "recaps/:id", element: <RecapDetail /> },
      { path: "mentions-legales", element: <MentionsLegales /> },
      { path: "politique-de-confidentialite", element: <PrivacyPolicy /> },
      { path: "cgu", element: <TermsOfService /> },
      { path: "cookies", element: <CookiesPolicy /> },
      { path: "kit-media", element: <KitMedia /> },
      { path: "clips", element: <ClipsPage /> },

      // Admin Routes
      { path: "admin", element: <AdminDashboard /> },
      { path: "admin/manage", element: <ProtectedRoute><AdminManage /></ProtectedRoute> },
      { path: "admin/team", element: <ProtectedRoute><AdminTeam /></ProtectedRoute> },
      { path: "admin/editors", element: <ProtectedRoute><AdminEditors /></ProtectedRoute> },
      { path: "admin/stats", element: <ProtectedRoute><AdminStats /></ProtectedRoute> },
      { path: "admin/spotify", element: <ProtectedRoute><AdminSpotify /></ProtectedRoute> },
      { path: "admin/home", element: <ProtectedRoute><AdminHome /></ProtectedRoute> },
      { path: "admin/shop", element: <ProtectedRoute><AdminShop /></ProtectedRoute> },
      { path: "admin/settings", element: <ProtectedRoute><AdminSettings /></ProtectedRoute> },
      { path: "admin/messages", element: <ProtectedRoute><AdminMessages /></ProtectedRoute> },
      { path: "admin/banner", element: <ProtectedRoute><AdminBanner /></ProtectedRoute> },

      { path: "newsletter", element: <Newsletter /> },
      { path: "unsubscribe", element: <Unsubscribe /> },
      { path: "newsletter/admin", element: <ProtectedRoute><NewsletterAdmin /></ProtectedRoute> },
      { path: "newsletter/studio", element: <ProtectedRoute><NewsletterComposer /></ProtectedRoute> },

      { path: "news/create", element: <ProtectedRoute><NewsCreate /></ProtectedRoute> },
      { path: "recaps/create", element: <ProtectedRoute><RecapCreate /></ProtectedRoute> },
      { path: "agenda/create", element: <ProtectedRoute><AgendaCreate /></ProtectedRoute> },
      { path: "galerie/create", element: <ProtectedRoute><GalerieCreate /></ProtectedRoute> },
    ]
  }
]);

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

  return <RouterProvider router={router} />;
}

export default App;
