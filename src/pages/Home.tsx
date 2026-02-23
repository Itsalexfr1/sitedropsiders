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
                return <Hero key="hero" videoId={item.videoId} accentColor={accentColor} resolvedColor={color} />;
            case 'news_grid':
                return (
                    <section key="news_grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div
                            className="grid grid-cols-1 gap-8 items-stretch"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: window.innerWidth > 1024 ? (columns === '1fr' ? '1.5fr 1fr' : columns.replace('_', ' ')) : '1fr'
                            }}
                        >
                            <FeaturedNews accentColor={accentColor} resolvedColor={color} />
                            <RecentNews accentColor={item.accentColor2 || 'blue'} resolvedColor={resolveColor(item.accentColor2 || 'blue')} />
                        </div>
                    </section>
                );
            case 'recap_agenda_grid':
                return (
                    <section key="recap_agenda_grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div
                            className="grid grid-cols-1 gap-8 items-stretch"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: window.innerWidth > 1024 ? (columns === '1fr' ? '2fr 1fr' : columns.replace('_', ' ')) : '1fr'
                            }}
                        >
                            <RecapWidget accentColor={accentColor} resolvedColor={color} />
                            <AgendaWidget maxItems={item.maxAgendaItems} accentColor={item.accentColor2 || 'red'} resolvedColor={resolveColor(item.accentColor2 || 'red')} />
                        </div>
                    </section>
                );
            case 'interviews':
                return (
                    <section key="interviews" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <InterviewWidget accentColor={accentColor} resolvedColor={color} />
                    </section>
                );
            case 'social_grid':
                return (
                    <section key="social_grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div
                            className="grid grid-cols-1 gap-8 items-stretch"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: window.innerWidth > 1024 ? (columns === '1fr' ? '1fr 1fr' : columns.replace('_', ' ')) : '1fr'
                            }}
                        >
                            <InstagramWidget accentColor={accentColor} resolvedColor={color} />
                            <TikTokWidget accentColor={item.accentColor2 || 'cyan'} resolvedColor={resolveColor(item.accentColor2 || 'cyan')} />
                        </div>
                    </section>
                );
            case 'instagram':
                return (
                    <section key="instagram" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <InstagramWidget accentColor={accentColor} resolvedColor={color} />
                    </section>
                );
            case 'tiktok':
                return (
                    <section key="tiktok" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <TikTokWidget accentColor={accentColor} resolvedColor={color} />
                    </section>
                );
            case 'spotify':
                return (
                    <section key="spotify" className="bg-dark-bg/5 py-8 relative z-10">
                        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                            <SpotifyWidget accentColor={accentColor} resolvedColor={color} />
                        </div>
                    </section>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-12 pb-12">
            {layout
                .filter(item => item.enabled)
                .map(item => renderSection(item))
            }
        </div>
    );
}
