import { useEffect, Suspense, useState } from 'react';
import { AlertCircle, RefreshCw, X, Bell } from 'lucide-react';
import { createBrowserRouter, RouterProvider, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { CookieConsent } from './components/ui/CookieConsent';
import { GoogleAdSense } from './components/analytics/GoogleAdSense';
import { ScrollToTop } from './components/utils/ScrollToTop';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { lazyRetry } from './utils/lazyRetry';

import { UserProvider } from './context/UserContext';
import { PlayerProvider } from './context/PlayerContext';
import { GlobalPlayerContainer } from './components/widgets/GlobalPlayerContainer';

// Lazy load pages for better mobile performance
const Home = lazyRetry(() => import('./pages/Home').then(m => m.Home));
const News = lazyRetry(() => import('./pages/News').then(m => m.News));
const Agenda = lazyRetry(() => import('./pages/Agenda').then(m => m.Agenda));
const Recap = lazyRetry(() => import('./pages/Recap').then(m => m.Recap));
const Interviews = lazyRetry(() => import('./pages/Interviews').then(m => m.Interviews));
const Team = lazyRetry(() => import('./pages/Team').then(m => m.Team));
const Shop = lazyRetry(() => import('./pages/Shop').then(m => m.Shop));
const Galerie = lazyRetry(() => import('./pages/Galerie').then(m => m.Galerie));
const Voyage = lazyRetry(() => import('./pages/Voyage').then(m => m.Voyage));
const AlbumDetail = lazyRetry(() => import('./pages/AlbumDetail').then(m => m.AlbumDetail));
const ArticleDetail = lazyRetry(() => import('./pages/ArticleDetail').then(m => m.ArticleDetail));
const RecapDetail = lazyRetry(() => import('./pages/RecapDetail').then(m => m.RecapDetail));
const LivePage = lazyRetry(() => import('./pages/LivePage').then(m => m.LivePage));
const PrivacyPolicy = lazyRetry(() => import('./pages/PrivacyPolicy').then(m => m.PrivacyPolicy));
const TermsOfService = lazyRetry(() => import('./pages/TermsOfService').then(m => m.TermsOfService));
const CookiesPolicy = lazyRetry(() => import('./pages/CookiesPolicy').then(m => m.CookiesPolicy));
const MentionsLegales = lazyRetry(() => import('./pages/MentionsLegales').then(m => m.MentionsLegales));
const Newsletter = lazyRetry(() => import('./pages/Newsletter').then(m => m.Newsletter));
const Unsubscribe = lazyRetry(() => import('./pages/Unsubscribe').then(m => m.Unsubscribe));
const ClipsPage = lazyRetry(() => import('./pages/ClipsPage').then(m => m.ClipsPage));
const RecapCreate = lazyRetry(() => import('./pages/RecapCreate').then(m => m.RecapCreate));
const AgendaCreate = lazyRetry(() => import('./pages/AgendaCreate').then(m => m.AgendaCreate));
const GalerieCreate = lazyRetry(() => import('./pages/GalerieCreate').then(m => m.GalerieCreate));
const AdminDashboard = lazyRetry(() => import('./pages/AdminDashboard').then(m => m.AdminDashboard));
const NewsletterAdmin = lazyRetry(() => import('./pages/NewsletterAdmin').then(m => m.NewsletterAdmin));
const NewsletterComposer = lazyRetry(() => import('./pages/NewsletterComposer').then(m => m.NewsletterComposer));
const NewsCreate = lazyRetry(() => import('./pages/NewsCreate').then(m => m.NewsCreate));
const AdminManage = lazyRetry(() => import('./pages/AdminManage').then(m => m.AdminManage));
const AdminTeam = lazyRetry(() => import('./pages/AdminTeam').then(m => m.AdminTeam));
const AdminEditors = lazyRetry(() => import('./pages/AdminEditors').then(m => m.AdminEditors));
const AdminStats = lazyRetry(() => import('./pages/AdminStats').then(m => m.AdminStats));
const AdminSpotify = lazyRetry(() => import('./pages/AdminSpotify').then(m => m.AdminSpotify));
const AdminShop = lazyRetry(() => import('./pages/AdminShop').then(m => m.AdminShop));
const KitMedia = lazyRetry(() => import('./pages/KitMedia'));
const AdminHome = lazyRetry(() => import('./pages/AdminHome').then(m => m.AdminHome));
const AdminSettings = lazyRetry(() => import('./pages/AdminSettings').then(m => m.AdminSettings));
const AdminFactures = lazyRetry(() => import('./pages/AdminFactures').then(m => m.AdminFactures));
const AdminTarifs = lazyRetry(() => import('./pages/AdminTarifs').then(m => m.AdminTarifs));
const AdminMessages = lazyRetry(() => import('./pages/AdminMessages').then(m => m.AdminMessages));
const AdminBanner = lazyRetry(() => import('./pages/AdminBanner').then(m => m.AdminBanner));
const Contact = lazyRetry(() => import('./pages/Contact').then(m => m.Contact));
const PhotoSubmission = lazyRetry(() => import('./pages/PhotoSubmission').then(m => m.PhotoSubmission));
const SocialStudioPage = lazyRetry(() => import('./pages/SocialStudioPage').then(m => m.SocialStudioPage));
const Community = lazyRetry(() => import('./pages/Community').then(m => m.Community));
const QrCodePage = lazyRetry(() => import('./pages/QrCodePage').then(m => m.QrCodePage));
const InterviewVisualGenerator = lazyRetry(() => import('./pages/InterviewVisualGenerator').then(m => m.InterviewVisualGenerator));
const VideoStudioGenerator = lazyRetry(() => import('./pages/AftermovieGenerator').then(m => m.VideoStudioGenerator));
const TopDropsiders = lazyRetry(() => import('./pages/TopDropsiders').then(m => m.TopDropsiders));
const Profile = lazyRetry(() => import('./pages/Profile').then(m => m.Profile));
const AdminPdfs = lazyRetry(() => import('./pages/AdminPdfs').then(m => m.AdminPdfs));
const AdminInterviewQuestions = lazyRetry(() => import('./pages/AdminInterviewQuestions').then(m => m.AdminInterviewQuestions));
const PublicProfile = lazyRetry(() => import('./pages/PublicProfile').then(m => m.PublicProfile));
const About = lazyRetry(() => import('./pages/About').then(m => m.About));
const ProShop = lazyRetry(() => import('./pages/ProShop').then(m => m.ProShop));
const BrandingPage = lazyRetry(() => import('./pages/BrandingPage').then(m => m.BrandingPage));
const MixPage = lazyRetry(() => import('./pages/MixPage').then(m => m.MixPage));


function ErrorFallback() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 text-center space-y-8 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-neon-red/10 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-neon-cyan/10 rounded-full blur-[80px]" />

        <div className="relative">
          <div className="w-20 h-20 bg-neon-red/10 rounded-3xl flex items-center justify-center mx-auto mb-8 group transition-all duration-500 hover:scale-110">
            <AlertCircle className="w-10 h-10 text-neon-red shadow-[0_0_15px_rgba(255,0,51,0.3)]" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">
              Oups, une petite <span className="text-neon-red">erreur</span> !
            </h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
              Le site a reÃ§u une mise Ã  jour ou un petit grain de sable s'est glissÃ©. 
              <br />RafraÃ®chis la page pour profiter de la derniÃ¨re version.
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full mt-10 py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-neon-red hover:text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(0,0,0,0.4)] hover:shadow-neon-red/20 active:scale-95"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" /> RAFRAÃŽCHIR LA EXPÃ‰RIENCE
          </button>
        </div>
      </div>
    </div>
  );
}

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

import { ExtensionPromotion } from './components/ui/ExtensionPromotion';
import { CardRewardModal } from './components/cards/CardRewardModal';
import { BoosterRewardModal } from './components/cards/BoosterRewardModal';
import { useVisitTimer } from './hooks/useVisitTimer';
import { useUser } from './context/UserContext';

function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addCard, collectedCards, showNotification, pendingBooster, claimBooster, dismissBooster } = useUser();
  const collectedCardIds = collectedCards.map((c) => c.id);
  const { pendingCard, claimCard, dismissCard } = useVisitTimer(collectedCardIds);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const play = params.get('play');
    if (play && !location.pathname.startsWith('/mix')) {
      const t = params.get('t');
      navigate(`/mix/${play}${t ? `?t=${t}` : ''}`, { replace: true });
    }
  }, [location, navigate]);

  const handleClaim = () => {
    claimCard((card) => {
      addCard(card);
      showNotification(`🃏 Carte ${card.name} ajoutée à ta collection !`, 'success');
    });
  };

  return (
    <>
      <ScrollToTop />
      <GoogleAdSense />
      <Layout>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={location.pathname + location.search}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full"
          >
            <Suspense fallback={<LoadingPage />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </Layout>
      <CookieConsent />
      {/* <ExtensionPromotion /> */}
      <CardRewardModal
        card={pendingCard}
        onClaim={handleClaim}
        onDismiss={dismissCard}
      />
      <BoosterRewardModal
        booster={pendingBooster}
        onClaim={claimBooster}
        onDismiss={dismissBooster}
      />
      <GlobalPlayerContainer />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorFallback />,
    children: [
      { index: true, element: <Home /> },
      { path: "voyage", element: <Voyage /> },
      { path: "voyage/:type", element: <Voyage /> },
      { path: "live", element: <LivePage /> },
      { path: "news", element: <News /> },
      { path: "agenda", element: <Agenda /> },
      { path: "recaps", element: <Recap /> },
      { path: "interviews", element: <Interviews /> },
      { path: "team", element: <Team /> },
      { path: "shop", element: <Shop /> },
      { path: "galerie", element: <Galerie /> },
      { path: "communaute", element: <Community /> },
      { path: "top-dropsiders", element: <TopDropsiders /> },
      { path: "profil", element: <Profile /> },
      { path: "profil/:username", element: <PublicProfile /> },
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
      { path: "a-propos", element: <About /> },
      { path: "pro/boutique", element: <ProShop /> },

      
      // Protected Area Group (Shared Authentication Context)
      {
        element: <ProtectedRoute><Outlet /></ProtectedRoute>,
        children: [
          { path: "admin", element: <AdminDashboard /> },
          { path: "admin/manage", element: <AdminManage /> },
          { path: "admin/team", element: <AdminTeam /> },
          { path: "admin/editors", element: <AdminTeam /> },
          { path: "admin/stats", element: <AdminStats /> },
          { path: "admin/spotify", element: <AdminSpotify /> },
          { path: "admin/home", element: <AdminHome /> },
          { path: "admin/shop", element: <AdminShop /> },
          { path: "admin/settings", element: <AdminSettings /> },
          { path: "admin/messages", element: <AdminMessages /> },
          { path: "admin/factures", element: <AdminFactures /> },
          { path: "admin/tarifs", element: <AdminTarifs /> },
          { path: "admin/banner", element: <AdminBanner /> },
          { path: "admin/pdfs", element: <AdminPdfs /> },
          { path: "admin/interview-questions", element: <AdminInterviewQuestions /> },
          { path: "social-studio", element: <SocialStudioPage /> },
          { path: "interview-visuals", element: <InterviewVisualGenerator /> },
          { path: "aftermovie", element: <VideoStudioGenerator /> },
          { path: "recap-video", element: <VideoStudioGenerator /> },
          { path: "newsletter/admin", element: <NewsletterAdmin /> },
          { path: "newsletter/studio", element: <NewsletterComposer /> },
          { path: "news/create", element: <NewsCreate /> },
          { path: "recaps/create", element: <RecapCreate /> },
          { path: "agenda/create", element: <AgendaCreate /> },
          { path: "galerie/create", element: <GalerieCreate /> },
        ]
      },
      { path: "qr", element: <QrCodePage /> },
      { path: "go", element: <BrandingPage /> },
      { path: "link", element: <BrandingPage /> },
      { path: "drop", element: <BrandingPage /> },
      { path: "v", element: <BrandingPage /> },
      { path: "connect", element: <BrandingPage /> },
      { path: "bio", element: <BrandingPage /> },
      { path: "branding", element: <BrandingPage /> },
      { path: "newsletter", element: <Newsletter /> },
      { path: "unsubscribe", element: <Unsubscribe /> },
    ]
  },
  // ── Routes standalone SANS Layout (page publique mix partageable) ──
  {
    path: "/mix/:id",
    element: (
      <UserProvider>
        <PlayerProvider>
          <Suspense fallback={<LoadingPage />}>
            <MixPage />
          </Suspense>
        </PlayerProvider>
      </UserProvider>
    ),
  },
  {
    path: "/mixes/:id",
    element: (
      <UserProvider>
        <PlayerProvider>
          <Suspense fallback={<LoadingPage />}>
            <MixPage />
          </Suspense>
        </PlayerProvider>
      </UserProvider>
    ),
  },
]);

function App() {
  const [initialLoad, setInitialLoad] = useState(true);
  const isMobile = window.innerWidth < 1024;

  // Enregistrement explicite du Service Worker pour les Pushs
  useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error: any) {
      console.error('SW registration error', error);
    }
  });

  useEffect(() => {
    // Shorter splash on mobile for faster time-to-interactive
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, isMobile ? 800 : 2000);
    return () => clearTimeout(timer);
  }, [isMobile]);

  if (initialLoad) {
    return (
      <div className="fixed inset-0 bg-[#050505] z-[9999] flex flex-col items-center justify-center pointer-events-none overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-red/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-neon-cyan/5 rounded-full blur-[100px] animate-pulse [animation-delay:1s]" />

        <div className="relative flex flex-col items-center">
          <div className="relative w-24 h-24 mb-10">
            <div className="absolute inset-0 border-4 border-neon-red/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-neon-red rounded-full animate-spin shadow-[0_0_25px_rgba(255,0,51,0.4)]" />
            <div className="absolute inset-4 border-4 border-neon-cyan/20 rounded-full" />
            <div className="absolute inset-4 border-4 border-b-neon-cyan rounded-full animate-spin-slow [animation-duration:3s] shadow-[0_0_25px_rgba(0,240,255,0.4)]" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex overflow-hidden">
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-white font-display font-black uppercase tracking-[0.3em] text-2xl md:text-3xl italic"
              >
                DROPSIDERS <span className="text-neon-red">V2</span>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-[10px] text-white/60 font-black uppercase tracking-[0.5em] ml-1.5"
            >
              Chargement de l'expÃ©rience
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UserProvider>
      <PlayerProvider>
        <RouterProvider router={router} />
      </PlayerProvider>
    </UserProvider>
  );
}

export default App;
