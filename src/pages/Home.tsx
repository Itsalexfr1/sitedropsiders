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

export function Home() {
    const [layout, setLayout] = useState(layoutData);
    const [socials, setSocials] = useState<any>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        if (color.startsWith('#')) return color;
        return `var(--color-neon-${color})`;
    };

    const renderSection = (item: any) => {
        const { id, columns = '1fr', accentColor = 'red' } = item;
        const color = resolveColor(accentColor);

        switch (id) {
            case 'hero':
                return <Hero key="hero" videoId={item.videoId} videoUrl={item.videoUrl} accentColor={accentColor} resolvedColor={color} />;
            case 'news_grid':
                return (
                    <section key="news_grid" className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
                        <div 
                            className="grid grid-cols-1 gap-8 items-stretch"
                            style={{ 
                                display: 'grid',
                                gridTemplateColumns: window.innerWidth > 1024 ? (columns === '1fr' ? '1.5fr 1fr' : (columns || '1fr').toString().replace('_', ' ')) : '1fr'
                            }}
                        >
                            <FeaturedNews accentColor={accentColor} resolvedColor={color} />
                            <RecentNews accentColor={item.accentColor2 || 'blue'} resolvedColor={resolveColor(item.accentColor2 || 'blue')} />
                        </div>
                    </section>
                );
            case 'recap_agenda_grid':
                return (
                    <section key="recap_agenda_grid" className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
                        <div 
                            className="grid grid-cols-1 gap-8 items-stretch"
                            style={{ 
                                display: 'grid',
                                gridTemplateColumns: window.innerWidth > 1024 ? (columns === '1fr' ? '1.5fr 1fr' : (columns || '1fr').toString().replace('_', ' ')) : '1fr'
                            }}
                        >
                            <div className="">
                                <RecapWidget accentColor={accentColor} resolvedColor={color} />
                            </div>
                            <div className="">
                                <AgendaWidget maxItems={item.maxAgendaItems || 8} accentColor={item.accentColor2 || 'red'} resolvedColor={resolveColor(item.accentColor2 || 'red')} />
                            </div>
                        </div>
                    </section>
                );
            case 'interviews':
                return (
                    <section key="interviews" className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-8">
                        <InterviewWidget accentColor={accentColor} resolvedColor={color} featuredInterviews={item.featuredInterviews} />
                    </section>
                );
            case 'social_grid':
                return (
                    <section key="social_grid" className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
                        <div 
                            className="grid grid-cols-1 gap-8 items-stretch"
                            style={{ 
                                display: 'grid',
                                gridTemplateColumns: window.innerWidth > 1024 ? (columns === '1fr' ? '1fr 1fr' : (columns || '1fr').toString().replace('_', ' ')) : '1fr'
                            }}
                        >
                            <InstagramWidget accentColor={accentColor} resolvedColor={color} username={socials?.instagram} />
                            <TikTokWidget accentColor={item.accentColor2 || 'cyan'} resolvedColor={resolveColor(item.accentColor2 || 'cyan')} username={socials?.tiktok} />
                        </div>
                    </section>
                );
            case 'instagram':
                return (
                    <section key="instagram" className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
                        <InstagramWidget accentColor={accentColor} resolvedColor={color} username={socials?.instagram} />
                    </section>
                );
            case 'tiktok':
                return (
                    <section key="tiktok" className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
                        <TikTokWidget accentColor={accentColor} resolvedColor={color} username={socials?.tiktok} />
                    </section>
                );
            case 'spotify':
                return (
                    <section key="spotify" className="bg-dark-bg/5 py-8 relative z-10">
                        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                    <SpotifyWidget accentColor={accentColor} resolvedColor={color} />
                                </div>
                                <div className="lg:col-span-1">
                                    <TopTracksLeaderboard resolvedColor={color} />
                                </div>
                            </div>
                        </div>
                    </section>
                );
            case 'wiki_widget':
                return (
                    <section key="wiki_widget" className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-12">
                        <WikiWidget resolvedColor={color} />
                    </section>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <SEO />
            {isMobile ? (
                <MobileHome />
            ) : (
                <div className="space-y-4 md:space-y-8 pb-12">
                    {layout
                        .filter((item: any) => item.enabled)
                        .map((item: any) => renderSection(item))
                    }
                </div>
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
