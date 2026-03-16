import { Link } from 'react-router-dom';
import { Newspaper, TrendingUp, Calendar, MapPin, Play, MessageSquare } from 'lucide-react';
import newsData from '../../data/news.json';
import agendaData from '../../data/agenda.json';
import recapsData from '../../data/recaps.json';
import { getArticleLink, getAgendaLink, getRecapLink } from '../../utils/slugify';
import { useLanguage } from '../../context/LanguageContext';
import { useMemo } from 'react';

export function MobileHome() {
    const { t, language } = useLanguage();



    const sortedNews = useMemo(() => {
        return [...newsData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, []);

    const featuredNews = useMemo(() => {
        const featured = sortedNews.filter(n => n.isFeatured).slice(0, 1);
        if (featured.length > 0) return featured;
        return sortedNews.slice(0, 1);
    }, [sortedNews]);

    // 2. Filter News (exclude interviews/musique for this block)
    const newsHighlight = useMemo(() => {
        return sortedNews.filter(n => {
            const cat = n.category?.toLowerCase() || '';
            return cat === 'news' || (!cat.includes('interview') && cat !== 'musique');
        }).slice(0, 6);
    }, [sortedNews]);

    // 3. Recaps
    const recapsHighlight = useMemo(() => {
        return [...recapsData]
            .sort((a, b) => {
                const yearA = Number(a.year) || new Date(a.date).getFullYear();
                const yearB = Number(b.year) || new Date(b.date).getFullYear();
                if (yearB !== yearA) return yearB - yearA;
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            })
            .slice(0, 6);
    }, []);

    // 4. Interviews
    const interviewsHighlight = useMemo(() => {
        return sortedNews.filter(n => (n.category?.toLowerCase() || '').includes('interview')).slice(0, 6);
    }, [sortedNews]);

    const upcomingEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return [...agendaData]
            .filter(e => {
                const dateStr = e.date || e.startDate;
                return dateStr && new Date(dateStr) >= today;
            })
            .sort((a, b) => {
                const dateA = new Date(a.date || a.startDate || 0).getTime();
                const dateB = new Date(b.date || b.startDate || 0).getTime();
                return dateA - dateB;
            })
            .slice(0, 8);
    }, []);



    return (
        <div
            className="flex flex-col gap-12 pb-32 bg-black min-h-screen overflow-x-hidden"
        >
            {/* 1. Hero / Top News - Horizontal Scroll */}
            <section className="pt-8">
                <div className="mobile-safe-container mb-5 flex items-center justify-between">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40 flex items-center gap-2.5">
                        <TrendingUp className="w-4 h-4 text-neon-red shadow-[0_0_10px_rgba(255,0,51,0.5)]" />
                        {t('home.featured').toUpperCase()}
                    </h2>
                    <Link to="/news" className="text-[10px] font-black uppercase tracking-widest text-neon-red px-2 py-1 rounded-lg hover:bg-neon-red/10 transition-colors">{t('home.view_all')}</Link>
                </div>
                <div className="flex gap-4 overflow-x-auto px-5 scrollbar-hide snap-x no-scrollbar">
                    {featuredNews.map((news) => (
                        <Link
                            key={news.id}
                            to={getArticleLink(news)}
                            className="w-[85vw] flex-shrink-0 aspect-square relative rounded-[3rem] overflow-hidden snap-center border border-white/10 group active:scale-95 transition-transform"
                        >
                            <img src={news.image} className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/50 to-transparent opacity-90" />
                            <div className="absolute top-6 left-6 px-4 py-2 bg-dark-bg/60 backdrop-blur-md border border-white/20 rounded-xl shadow-lg z-10">
                                <span className="text-xs font-black text-neon-red uppercase tracking-[0.2em]">{news.category}</span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col gap-4 z-10">
                                <h3 className="text-2xl sm:text-3xl font-display font-black text-white italic leading-[1.1] uppercase line-clamp-4 drop-shadow-2xl">
                                    {news.title}
                                </h3>
                            </div>
                        </Link>
                    ))}
                    <div className="min-w-[20px] shrink-0" />
                </div>
            </section>

            {/* 2. Dropsiders NEWS - Swipe Slider */}
            <section className="pt-8 border-t border-white/5">
                <div className="mobile-safe-container mb-5 flex items-center justify-between">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40 flex items-center gap-2.5">
                        <Newspaper className="w-4 h-4 text-neon-red shadow-[0_0_10px_rgba(255,0,51,0.5)]" />
                        {t('home.news')}
                    </h2>
                    <Link to="/news" className="text-[10px] font-black uppercase tracking-widest text-neon-red px-2 py-1 rounded-lg hover:bg-neon-red/10 transition-colors">{t('home.view_all')}</Link>
                </div>
                <div className="flex gap-4 overflow-x-auto px-5 scrollbar-hide snap-x no-scrollbar">
                    {newsHighlight.map((news) => (
                        <Link
                            key={news.id}
                            to={getArticleLink(news)}
                            className="w-[85vw] flex-shrink-0 aspect-square relative rounded-[3rem] overflow-hidden group snap-center border border-white/10 active:scale-95 transition-transform"
                        >
                            <img src={news.image} className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/50 to-transparent opacity-90" />
                            <div className="absolute top-6 left-6 px-4 py-2 bg-dark-bg/60 backdrop-blur-md border border-white/20 rounded-xl shadow-lg z-10">
                                <span className="text-xs font-black text-neon-red uppercase tracking-[0.2em]">{news.category}</span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col gap-4 z-10">
                                <h3 className="text-2xl sm:text-3xl font-display font-black text-white uppercase italic leading-[1.1] line-clamp-4 drop-shadow-2xl">{news.title}</h3>
                                <div className="flex items-center gap-3 text-white/60">
                                    <div className="w-2 h-2 bg-white/40 rounded-full" />
                                    <span className="text-xs font-bold uppercase tracking-widest">{news.date}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    <div className="min-w-[20px] shrink-0" />
                </div>
            </section>

            {/* 3. Agenda Slider - Moved below News */}
            <section className="pt-8 border-t border-white/5">
                <div className="mobile-safe-container mb-5 flex items-center justify-between">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40 flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-neon-cyan shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                        {t('home.agenda')}
                    </h2>
                    <Link to="/agenda" className="text-[10px] font-black uppercase tracking-widest text-neon-cyan px-2 py-1 rounded-lg hover:bg-neon-cyan/10 transition-colors">{t('nav.agenda')}</Link>
                </div>
                <div className="flex gap-4 overflow-x-auto px-5 scrollbar-hide snap-x no-scrollbar">
                    {upcomingEvents.map((event) => (
                        <Link
                            key={event.id}
                            to={getAgendaLink(event)}
                            className="w-[85vw] flex-shrink-0 aspect-square bg-[#080808] border border-white/10 rounded-[3rem] snap-center active:scale-95 transition-all relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-end group p-8"
                        >
                            {/* Événement Photo en fond */}
                            <img
                                src={event.image}
                                className="absolute inset-0 w-full h-full object-cover opacity-50"
                                loading="lazy"
                                decoding="async"
                                alt=""
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/40 to-transparent opacity-80" />

                            <div className="flex-1" />
                            <div className="text-neon-cyan text-sm font-black mb-3 flex items-center gap-2 relative z-10 uppercase tracking-widest">
                                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                {new Date(event.date || event.startDate || 0).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' }).toUpperCase()}
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase italic mb-6 leading-[1.1] relative z-10 drop-shadow-2xl line-clamp-3">
                                {event.title}
                            </h3>
                            <div className="flex items-center gap-3 text-gray-200 relative z-10 bg-dark-bg/40 w-fit px-4 py-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
                                <MapPin className="w-5 h-5 text-neon-cyan" />
                                <span className="text-xs font-black uppercase truncate max-w-[200px]">{event.location}</span>
                            </div>
                        </Link>
                    ))}
                    <div className="min-w-[20px] shrink-0" />
                </div>
            </section>

            {/* 4. RECAPS - Swipe Slider */}
            <section className="pt-8 border-t border-white/5">
                <div className="mobile-safe-container mb-5 flex items-center justify-between">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40 flex items-center gap-2.5">
                        <Play className="w-4 h-4 text-neon-purple shadow-[0_0_10px_rgba(189,0,255,0.5)]" />
                        {t('home.recaps')}
                    </h2>
                    <Link to="/recaps" className="text-[10px] font-black uppercase tracking-widest text-neon-purple px-2 py-1 rounded-lg hover:bg-neon-purple/10 transition-colors">{t('home.explore')}</Link>
                </div>
                <div className="flex gap-4 overflow-x-auto px-5 scrollbar-hide snap-x no-scrollbar">
                    {recapsHighlight.map((recap) => (
                        <Link
                            key={recap.id}
                            to={getRecapLink(recap)}
                            className="w-[85vw] flex-shrink-0 aspect-square relative rounded-[3rem] overflow-hidden group snap-center border border-white/10 active:scale-95 transition-transform"
                        >
                            <img src={(recap as any).image} className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/50 to-transparent opacity-90" />
                            <div className="absolute top-6 left-6 px-4 py-2 bg-dark-bg/60 backdrop-blur-md border border-white/20 rounded-xl shadow-lg z-10">
                                <span className="text-xs font-black text-neon-purple uppercase tracking-[0.2em]">{recap.festival || 'RECAP'}</span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col gap-4 z-10">
                                <h3 className="text-2xl sm:text-3xl font-display font-black text-white uppercase italic leading-[1.1] line-clamp-4 drop-shadow-2xl">{recap.title}</h3>
                                <div className="flex items-center gap-3 text-white/60">
                                    <div className="w-2 h-2 bg-white/40 rounded-full" />
                                    <span className="text-xs font-bold uppercase tracking-widest">{recap.location}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    <div className="min-w-[20px] shrink-0" />
                </div>
            </section>

            {/* 5. INTERVIEWS - Swipe Slider */}
            <section className="pt-8 border-t border-white/5">
                <div className="mobile-safe-container mb-5 flex items-center justify-between">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40 flex items-center gap-2.5">
                        <MessageSquare className="w-4 h-4 text-neon-blue shadow-[0_0_10px_rgba(0,100,255,0.5)]" />
                        {t('home.interviews')}
                    </h2>
                    <Link to="/interviews" className="text-[10px] font-black uppercase tracking-widest text-neon-blue px-2 py-1 rounded-lg hover:bg-neon-blue/10 transition-colors">{t('home.view_all')}</Link>
                </div>
                <div className="flex gap-4 overflow-x-auto px-5 scrollbar-hide snap-x no-scrollbar">
                    {interviewsHighlight.map((interview) => (
                        <Link
                            key={interview.id}
                            to={getArticleLink(interview)}
                            className="w-[85vw] flex-shrink-0 aspect-square relative rounded-[3rem] overflow-hidden group snap-center border border-white/10 active:scale-95 transition-transform"
                        >
                            <img src={interview.image} className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
                            <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl shadow-lg z-10">
                                <span className="text-xs font-black text-neon-blue uppercase tracking-[0.2em]">{interview.category}</span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col gap-4 z-10">
                                <h3 className="text-2xl sm:text-3xl font-display font-black text-white uppercase italic leading-[1.1] line-clamp-4 drop-shadow-2xl">{interview.title}</h3>
                                <div className="flex items-center gap-3 text-white/60">
                                    <div className="w-2 h-2 bg-white/40 rounded-full" />
                                    <span className="text-xs font-bold uppercase tracking-widest">{interview.date}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    <div className="min-w-[20px] shrink-0" />
                </div>
            </section>


        </div>
    );
}
