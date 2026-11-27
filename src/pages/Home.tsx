import { useState, useEffect } from 'react';
import { Hero } from '../components/ui/Hero';
import { FeaturedNews } from '../components/widgets/FeaturedNews';
import { RecentNews } from '../components/widgets/RecentNews';
import { AgendaWidget } from '../components/widgets/AgendaWidget';
import { InstagramWidget } from '../components/widgets/InstagramWidget';
import { TikTokWidget } from '../components/widgets/TikTokWidget';
import { SpotifyWidget } from '../components/widgets/SpotifyWidget';
import { RecapWidget } from '../components/widgets/RecapWidget';
import { InterviewWidget } from '../components/widgets/InterviewWidget';
import { MobileHome } from '../components/mobile/MobileHome';
import layoutData from '../data/home_layout.json';
import { SEO } from '../components/utils/SEO';
import { AdminEditBar } from '../components/admin/AdminEditBar';
import { LayoutDashboard, FileText, Calendar } from 'lucide-react';
import { WikiWidget } from '../components/widgets/WikiWidget';
import { TopTracksLeaderboard } from '../components/widgets/TopTracksLeaderboard';
import { CommunityMixesLeaderboard } from '../components/widgets/CommunityMixesLeaderboard';

import { useNavigate, useLocation } from 'react-router-dom';

export function Home() {
    const [layout, setLayout] = useState(layoutData);
    const [socials, setSocials] = useState<any>(null);
    // Détection mobile STRICTE : user-agent + largeur écran (évite la redirection sur PC)
    const isTrulyMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const [isMobile, setIsMobile] = useState(isTrulyMobile && window.innerWidth < 1024);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleResize = () => setIsMobile(isTrulyMobile && window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isTrulyMobile]);

    // Automatic redirection pour les VRAIS mobiles (user-agent mobile) vers /go
    // Les PC avec petite fenêtre ne sont jamais redirigés
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const hasFullFlag = params.get('full') === '1' || params.get('desktop') === '1';
        if (hasFullFlag) {
            sessionStorage.setItem('dropsiders_full_site', 'true');
        }
        const preferFullSite = sessionStorage.getItem('dropsiders_full_site') === 'true';
        
        if (isMobile && !preferFullSite && !hasFullFlag) {
            navigate('/go', { replace: true });
        }
    }, [isMobile, location.search, navigate]);

    useEffect(() => {
        const fetchLayout = async () => {
            try {
                const response = await fetch('/api/home-layout');
                if (response.ok) {
                    const data = await response.json();
                    setLayout(data);
                }
            } catch (err: any) {
                console.error('Failed to fetch home layout', err);
            }
        };

        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                if (response.ok) {
                    const data = await response.json();
                    if (data.socials) setSocials(data.socials);
                }
            } catch (err: any) {
                console.error('Failed to fetch settings', err);
            }
        };

        fetchLayout();
        fetchSettings();
    }, []);

    const resolveColor = (color: string) => {
        if (!color) return 'var(--color-neon-red)';
        if (color === 'white') return '#ffffff';
        if (color.startsWith('#')) return color;
        return `var(--color-neon-${color})`;
    };

    const renderEditorialDesktop = () => {
        const enabledMap = new Map<string, any>();
        layout.filter((item: any) => item.enabled).forEach((item: any) => enabledMap.set(item.id, item));

        const heroItem = enabledMap.get('hero');
        const newsItem = enabledMap.get('news_grid');
        const recapAgendaItem = enabledMap.get('recap_agenda_grid');
        const interviewsItem = enabledMap.get('interviews');
        const instagramItem = enabledMap.get('instagram');
        const tiktokItem = enabledMap.get('tiktok');
        const spotifyItem = enabledMap.get('spotify');
        const wikiItem = enabledMap.get('wiki_widget');

        const showInstagram = Boolean(recapAgendaItem || instagramItem);
        const showTiktok = Boolean(recapAgendaItem || tiktokItem);
        const hasRightSidebar = Boolean(recapAgendaItem || tiktokItem);

        return (
            <div className="pb-16">
                {/* 1. HERO FULL-BLEED */}
                {heroItem && (
                    <Hero
                        videoId={heroItem.videoId}
                        videoUrl={heroItem.videoUrl}
                        accentColor={heroItem.accentColor || 'red'}
                        resolvedColor={resolveColor(heroItem.accentColor || 'red')}
                    />
                )}

                {/* 2. À LA UNE & DERNIÈRES ACTUS (ancré directement sous le Hero) */}
                {newsItem && (
                    <section className="relative w-full border-b border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent py-10 md:py-12">
                        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
                            <div
                                className="grid grid-cols-1 gap-8 xl:gap-10 items-stretch"
                                style={{
                                    gridTemplateColumns: window.innerWidth > 1024
                                        ? (newsItem.columns === '1fr' || !newsItem.columns ? '1.5fr 1fr' : newsItem.columns.toString().replace('_', ' '))
                                        : '1fr'
                                }}
                            >
                                <FeaturedNews
                                    accentColor={newsItem.accentColor || 'red'}
                                    resolvedColor={resolveColor(newsItem.accentColor || 'red')}
                                />
                                <RecentNews
                                    accentColor={newsItem.accentColor2 || 'blue'}
                                    resolvedColor={resolveColor(newsItem.accentColor2 || 'blue')}
                                />
                            </div>
                        </div>
                    </section>
                )}

                {/* 3. CORPS MAGAZINE ASYMÉTRIQUE : Flux éditorial (gauche) + Sidebar sticky Agenda & Charts (droite) */}
                {(interviewsItem || showInstagram || showTiktok || hasRightSidebar) && (
                    <section className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-12 md:py-16">
                        <div className={`grid grid-cols-1 ${hasRightSidebar ? 'lg:grid-cols-12 gap-10 xl:gap-14 items-start' : ''}`}>
                            {/* Colonne principale : Interviews, Récaps & Social Strip */}
                            <div className={`${hasRightSidebar ? 'lg:col-span-7 xl:col-span-8' : ''} space-y-14`}>
                                {interviewsItem && (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start">
                                        <InterviewWidget
                                            accentColor={interviewsItem.accentColor || 'red'}
                                            resolvedColor={resolveColor(interviewsItem.accentColor || 'red')}
                                            featuredInterviews={interviewsItem.featuredInterviews}
                                        />
                                        <RecapWidget
                                            accentColor="purple"
                                            resolvedColor="var(--color-neon-purple)"
                                        />
                                    </div>
                                )}

                                {(showInstagram || showTiktok) && (
                                    <div className={`${interviewsItem ? 'border-t border-white/[0.06] pt-12' : ''} grid grid-cols-1 md:grid-cols-2 gap-10 items-start`}>
                                        {showInstagram && (
                                            <InstagramWidget
                                                accentColor={instagramItem?.accentColor || 'pink'}
                                                resolvedColor={resolveColor(instagramItem?.accentColor || 'pink')}
                                                username={socials?.instagram}
                                            />
                                        )}
                                        {showTiktok && (
                                            <TikTokWidget
                                                accentColor={tiktokItem?.accentColor || 'cyan'}
                                                resolvedColor={resolveColor(tiktokItem?.accentColor || 'cyan')}
                                                username={socials?.tiktok}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Sidebar éditoriale sticky : Agenda + Top 10 Tracks */}
                            {hasRightSidebar && (
                                <aside className="lg:col-span-5 xl:col-span-4 lg:border-l lg:border-white/[0.06] lg:pl-10 space-y-12 lg:sticky lg:top-24">
                                    {recapAgendaItem && (
                                        <AgendaWidget
                                            maxItems={recapAgendaItem.maxAgendaItems || 7}
                                            accentColor={recapAgendaItem.accentColor2 || 'red'}
                                            resolvedColor={resolveColor(recapAgendaItem.accentColor2 || 'red')}
                                        />
                                    )}
                                    <div className={recapAgendaItem ? 'border-t border-white/[0.06] pt-10' : ''}>
                                        <TopTracksLeaderboard
                                            resolvedColor={resolveColor((recapAgendaItem || tiktokItem)?.accentColor || 'red')}
                                        />
                                    </div>
                                </aside>
                            )}
                        </div>
                    </section>
                )}

                {/* 4. BANDEAU PLEINE LARGEUR MUSIQUE & MIXES */}
                {spotifyItem && (
                    <section className="relative z-10 w-full border-y border-white/[0.06] bg-gradient-to-b from-white/[0.025] via-black/30 to-transparent py-14">
                        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-14 items-stretch">
                                <div className="w-full">
                                    <SpotifyWidget
                                        accentColor={spotifyItem.accentColor || 'red'}
                                        resolvedColor={resolveColor(spotifyItem.accentColor || 'red')}
                                        hideTabs={true}
                                    />
                                </div>
                                <div className="w-full lg:border-l lg:border-white/[0.06] lg:pl-10">
                                    <CommunityMixesLeaderboard />
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* 5. WIKI & SCÈNE ÉLECTRO */}
                {wikiItem && (
                    <section className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-14">
                        <WikiWidget resolvedColor={resolveColor(wikiItem.accentColor || 'red')} />
                    </section>
                )}
            </div>
        );
    };

    return (
        <>
            <SEO />
            {isMobile ? (
                <MobileHome />
            ) : (
                renderEditorialDesktop()
            )}
            <AdminEditBar
                pageName="Accueil"
                pageActions={[
                    { label: 'Mise en page accueil', icon: <LayoutDashboard className="w-3.5 h-3.5" />, to: '/admin/home', permission: 'accueil' },
                    { label: 'Publier un article', icon: <FileText className="w-3.5 h-3.5" />, to: '/admin/manage?tab=News', permission: 'news' },
                    { label: 'Ajouter un événement', icon: <Calendar className="w-3.5 h-3.5" />, to: '/agenda#add', permission: 'agenda' },
                ]}
            />
        </>
    );
}
