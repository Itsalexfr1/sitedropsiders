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
import layoutData from '../data/home_layout.json';

export function Home() {
    const [layout, setLayout] = useState(layoutData);

    useEffect(() => {
        const fetchLayout = async () => {
            try {
                const response = await fetch('/api/home-layout');
                if (response.ok) {
                    const data = await response.json();
                    setLayout(data);
                }
            } catch (err) {
                console.error('Failed to fetch home layout', err);
            }
        };
        fetchLayout();
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
                        <div className="bg-dark-card/20 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-2">
                                <div className="space-y-1">
                                    <h3 className="text-3xl md:text-4xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                        DROPSIDERS <span style={{ color: color }}>NEWS</span>
                                    </h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Exclusivités • Musique • Festivals</p>
                                </div>
                            </div>
                            <div
                                className="grid grid-cols-1 gap-12 items-stretch"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: window.innerWidth > 1024 ? (columns === '1fr' ? '1.5fr 1fr' : columns.replace('_', ' ')) : '1fr'
                                }}
                            >
                                <FeaturedNews accentColor={accentColor} resolvedColor={color} hideHeader />
                                <RecentNews accentColor={item.accentColor2 || 'blue'} resolvedColor={resolveColor(item.accentColor2 || 'blue')} hideHeader />
                            </div>
                        </div>
                    </section>
                );
            case 'recap_agenda_grid':
                return (
                    <section key="recap_agenda_grid" className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
                        <div className="bg-dark-card/20 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 px-2">
                                <div className="space-y-1">
                                    <h3 className="text-3xl md:text-4xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                        EVENT <span style={{ color: color }}>RECAPS</span>
                                    </h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Festivals • Aftermovies • Reports</p>
                                </div>
                            </div>
                            <div
                                className="grid grid-cols-1 gap-12 items-stretch"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: window.innerWidth > 1024 ? (columns === '1fr' ? '2.5fr 1fr' : columns.replace('_', ' ')) : '1fr'
                                }}
                            >
                                <RecapWidget accentColor={accentColor} resolvedColor={color} hideHeader />
                                <AgendaWidget maxItems={item.maxAgendaItems} accentColor={item.accentColor2 || 'red'} resolvedColor={resolveColor(item.accentColor2 || 'red')} hideHeader />
                            </div>
                        </div>
                    </section>
                );
            case 'interviews':
                return (
                    <section key="interviews" className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-8">
                        <div className="bg-dark-card/20 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                            <InterviewWidget accentColor={accentColor} resolvedColor={color} />
                        </div>
                    </section>
                );
            case 'social_grid':
                return (
                    <section key="social_grid" className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
                        <div className="bg-dark-card/20 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                            <div
                                className="grid grid-cols-1 gap-12 items-stretch"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: window.innerWidth > 1024 ? (columns === '1fr' ? '1fr 1fr' : columns.replace('_', ' ')) : '1fr'
                                }}
                            >
                                <InstagramWidget accentColor={accentColor} resolvedColor={color} />
                                <TikTokWidget accentColor={item.accentColor2 || 'cyan'} resolvedColor={resolveColor(item.accentColor2 || 'cyan')} />
                            </div>
                        </div>
                    </section>
                );
            case 'instagram':
                return (
                    <section key="instagram" className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
                        <div className="bg-dark-card/20 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                            <InstagramWidget accentColor={accentColor} resolvedColor={color} />
                        </div>
                    </section>
                );
            case 'tiktok':
                return (
                    <section key="tiktok" className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
                        <div className="bg-dark-card/20 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                            <TikTokWidget accentColor={accentColor} resolvedColor={color} />
                        </div>
                    </section>
                );
            case 'spotify':
                return (
                    <section key="spotify" className="bg-dark-bg/5 py-8 relative z-10">
                        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
                            <div className="bg-dark-card/20 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                                <SpotifyWidget accentColor={accentColor} resolvedColor={color} />
                            </div>
                        </div>
                    </section>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {layout
                .filter(item => item.enabled)
                .map(item => renderSection(item))
            }
        </div>
    );
}
