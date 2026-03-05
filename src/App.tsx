import { useEffect, Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { CookieConsent } from './components/ui/CookieConsent';
import { GoogleAdSense } from './components/analytics/GoogleAdSense';
import { ScrollToTop } from './components/utils/ScrollToTop';
import { NotificationPrompt } from './components/NotificationPrompt';
import { CustomCursor } from './components/ui/CustomCursor';

// Lazy load pages for better mobile performance
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const News = lazy(() => import('./pages/News').then(m => ({ default: m.News })));
const Agenda = lazy(() => import('./pages/Agenda').then(m => ({ default: m.Agenda })));
const Recap = lazy(() => import('./pages/Recap').then(m => ({ default: m.Recap })));
const Interviews = lazy(() => import('./pages/Interviews').then(m => ({ default: m.Interviews })));
const Team = lazy(() => import('./pages/Team').then(m => ({ default: m.Team })));
const Shop = lazy(() => import('./pages/Shop').then(m => ({ default: m.Shop })));
const Galerie = lazy(() => import('./pages/Galerie').then(m => ({ default: m.Galerie })));
const Musique = lazy(() => import('./pages/Musique').then(m => ({ default: m.Musique })));
const AlbumDetail = lazy(() => import('./pages/AlbumDetail').then(m => ({ default: m.AlbumDetail })));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail').then(m => ({ default: m.ArticleDetail })));
const RecapDetail = lazy(() => import('./pages/RecapDetail').then(m => ({ default: m.RecapDetail })));
const LivePage = lazy(() => import('./pages/LivePage').then(m => ({ default: m.LivePage })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(m => ({ default: m.TermsOfService })));
const CookiesPolicy = lazy(() => import('./pages/CookiesPolicy').then(m => ({ default: m.CookiesPolicy })));
const MentionsLegales = lazy(() => import('./pages/MentionsLegales').then(m => ({ default: m.MentionsLegales })));
const Newsletter = lazy(() => import('./pages/Newsletter').then(m => ({ default: m.Newsletter })));
const Unsubscribe = lazy(() => import('./pages/Unsubscribe').then(m => ({ default: m.Unsubscribe })));
const ClipsPage = lazy(() => import('./pages/ClipsPage').then(m => ({ default: m.ClipsPage })));
const RecapCreate = lazy(() => import('./pages/RecapCreate').then(m => ({ default: m.RecapCreate })));
const AgendaCreate = lazy(() => import('./pages/AgendaCreate').then(m => ({ default: m.AgendaCreate })));
const GalerieCreate = lazy(() => import('./pages/GalerieCreate').then(m => ({ default: m.GalerieCreate })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const NewsletterAdmin = lazy(() => import('./pages/NewsletterAdmin').then(m => ({ default: m.NewsletterAdmin })));
const NewsletterComposer = lazy(() => import('./pages/NewsletterComposer').then(m => ({ default: m.NewsletterComposer })));
const NewsCreate = lazy(() => import('./pages/NewsCreate').then(m => ({ default: m.NewsCreate })));
const AdminManage = lazy(() => import('./pages/AdminManage').then(m => ({ default: m.AdminManage })));
const AdminTeam = lazy(() => import('./pages/AdminTeam').then(m => ({ default: m.AdminTeam })));
const AdminEditors = lazy(() => import('./pages/AdminEditors').then(m => ({ default: m.AdminEditors })));
const AdminStats = lazy(() => import('./pages/AdminStats').then(m => ({ default: m.AdminStats })));
const AdminSpotify = lazy(() => import('./pages/AdminSpotify').then(m => ({ default: m.AdminSpotify })));
const AdminShop = lazy(() => import('./pages/AdminShop').then(m => ({ default: m.AdminShop })));
const KitMedia = lazy(() => import('./pages/KitMedia'));
const AdminHome = lazy(() => import('./pages/AdminHome').then(m => ({ default: m.AdminHome })));
const AdminSettings = lazy(() => import('./pages/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AdminMessages = lazy(() => import('./pages/AdminMessages').then(m => ({ default: m.AdminMessages })));
const AdminBanner = lazy(() => import('./pages/AdminBanner').then(m => ({ default: m.AdminBanner })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const PhotoSubmission = lazy(() => import('./pages/PhotoSubmission').then(m => ({ default: m.PhotoSubmission })));
const SocialStudioPage = lazy(() => import('./pages/SocialStudioPage').then(m => ({ default: m.SocialStudioPage })));

function LoadingPage() {
  return (
    <div className="fixed inset-0 bg-dark-bg flex items-center justify-center z-[500]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-neon-red/20 border-t-neon-red rounded-full animate-spin shadow-[0_0_20px_rgba(255,0,51,0.2)]" />
        <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Chargement</span>
      </div>
    </div>
  );
}

function Root() {
  return (
    <>
      <ScrollToTop />
      <GoogleAdSense />
      <CustomCursor />
      <Layout>
        <Suspense fallback={<LoadingPage />}>
          <Outlet />
        </Suspense>
      </Layout>
      <CookieConsent />
      <NotificationPrompt />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { index: true, element: <Home /> },
      { path: "musique", element: <Musique /> },
      { path: "live", element: <LivePage /> },
      { path: "news", element: <News /> },
      { path: "agenda", element: <Agenda /> },
      { path: "recaps", element: <Recap /> },
      { path: "interviews", element: <Interviews /> },
      { path: "team", element: <Team /> },
      { path: "shop", element: <Shop /> },
      { path: "galerie", element: <Galerie /> },
      { path: "communaute", element: <Galerie /> },
      { path: "communaute/partager", element: <PhotoSubmission /> },
      { path: "galerie/:id", element: <AlbumDetail /> },
      { path: "communaute/:id", element: <AlbumDetail /> },
      { path: "news/:id", element: <ArticleDetail /> },
      { path: "interviews/:id", element: <ArticleDetail /> },
      { path: "recaps/:id", element: <RecapDetail /> },
      { path: "mentions-legales", element: <MentionsLegales /> },
      { path: "politique-de-confidentialite", element: <PrivacyPolicy /> },
      { path: "cgu", element: <TermsOfService /> },
      { path: "cookies", element: <CookiesPolicy /> },
      { path: "kit-media", element: <KitMedia /> },
      { path: "clips", element: <ClipsPage /> },
      { path: "contact", element: <Contact /> },

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
      { path: "social-studio", element: <ProtectedRoute><SocialStudioPage /></ProtectedRoute> },

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
