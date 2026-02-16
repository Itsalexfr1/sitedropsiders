import { Hero } from '../components/ui/Hero';
import { FeaturedNews } from '../components/widgets/FeaturedNews';
import { RecentNews } from '../components/widgets/RecentNews';
import { AgendaWidget } from '../components/widgets/AgendaWidget';
import { InstagramWidget } from '../components/widgets/InstagramWidget';
import { TikTokWidget } from '../components/widgets/TikTokWidget';
import { SpotifyWidget } from '../components/widgets/SpotifyWidget';
import { RecapWidget } from '../components/widgets/RecapWidget';
import { InterviewWidget } from '../components/widgets/InterviewWidget';

export function Home() {
    return (
        <div className="space-y-6 pb-12">
            <Hero />

            {/* Row 1: Featured News & Recent News */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-stretch">
                    <FeaturedNews />
                    <RecentNews />
                </div>
            </section>

            {/* Row 1.5: Featured Interviews */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <InterviewWidget />
            </section>

            {/* Row 2: Recaps & Agenda */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-stretch">
                    <RecapWidget />
                    <AgendaWidget />
                </div>
            </section>

            {/* Row 3: Instagram & TikTok */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-stretch">
                    <InstagramWidget />
                    <TikTokWidget />
                </div>
            </section>
            {/* Row 4: Spotify Playlists */}
            <section className="bg-dark-bg/20 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SpotifyWidget />
                </div>
            </section>
        </div>
    );
}
