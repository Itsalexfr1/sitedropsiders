import { Link } from 'react-router-dom';
import { Newspaper, TrendingUp, Star, Calendar, MapPin } from 'lucide-react';
import newsData from '../../data/news.json';
import agendaData from '../../data/agenda.json';
import { getArticleLink, getAgendaLink } from '../../utils/slugify';
import { useLanguage } from '../../context/LanguageContext';
import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '../ui/Skeleton';

export function MobileHome() {
    const { t, language } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate initial data loading
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const sortedNews = useMemo(() => {
        return [...newsData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, []);

    const featuredNews = sortedNews.filter(n => n.isFeatured).slice(0, 5);
    const hotNews = sortedNews.slice(0, 6);

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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-10 p-6 bg-black min-h-screen">
                <div className="space-y-4">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-4 overflow-hidden">
                        <Skeleton className="h-48 w-72 flex-shrink-0" />
                        <Skeleton className="h-48 w-72 flex-shrink-0" />
                    </div>
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-4 w-40" />
                    <div className="flex gap-4 overflow-hidden">
                        <Skeleton className="h-24 w-32 flex-shrink-0" />
                        <Skeleton className="h-24 w-32 flex-shrink-0" />
                        <Skeleton className="h-24 w-32 flex-shrink-0" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full" />)}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-12 pb-32 bg-black min-h-screen overflow-x-hidden"
        >
            {/* 1. Hero / Top News - Horizontal Scroll */}
            <motion.section variants={itemVariants} className="pt-8">
                <div className="mobile-safe-container mb-5 flex items-center justify-between">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40 flex items-center gap-2.5">
                        <TrendingUp className="w-4 h-4 text-neon-red shadow-[0_0_10px_rgba(255,0,51,0.5)]" />
                        {t('home.featured').toUpperCase()}
                    </h2>
                    <Link to="/news" className="text-[10px] font-black uppercase tracking-widest text-neon-red px-2 py-1 rounded-lg hover:bg-neon-red/10 transition-colors">Tout voir</Link>
                </div>
                <div className="flex gap-4 overflow-x-auto px-5 scrollbar-hide snap-x no-scrollbar">
                    {featuredNews.map((news) => (
                        <Link
                            key={news.id}
                            to={getArticleLink(news)}
                            className="min-w-[280px] aspect-[16/10] relative rounded-[2.5rem] overflow-hidden snap-center border border-white/5 group shadow-2xl active:scale-95 transition-transform"
                        >
                            <img src={news.image} className="absolute inset-0 w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <span className="px-3 py-1 bg-neon-red text-white text-[9px] font-black uppercase rounded-lg mb-3 inline-block shadow-lg">
                                    {news.category}
                                </span>
                                <h3 className="text-base font-display font-black text-white italic leading-tight uppercase line-clamp-2 drop-shadow-lg">
                                    {news.title}
                                </h3>
                            </div>
                        </Link>
                    ))}
                    <div className="min-w-[20px] shrink-0" />
                </div>
            </motion.section>

            {/* 2. Agenda Slider */}
            <motion.section variants={itemVariants}>
                <div className="mobile-safe-container mb-5 flex items-center justify-between">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40 flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-neon-cyan shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                        AGENDA PROCHAINEMENT
                    </h2>
                    <Link to="/agenda" className="text-[10px] font-black uppercase tracking-widest text-neon-cyan px-2 py-1 rounded-lg hover:bg-neon-cyan/10 transition-colors">Agenda</Link>
                </div>
                <div className="flex gap-4 overflow-x-auto px-5 scrollbar-hide snap-x no-scrollbar">
                    {upcomingEvents.map((event) => (
                        <Link
                            key={event.id}
                            to={getAgendaLink(event)}
                            className="min-w-[260px] bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-6 snap-start active:bg-white/10 transition-colors relative overflow-hidden shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-neon-cyan/10 blur-2xl rounded-full" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-cyan/5 blur-3xl rounded-full" />
                            <div className="text-neon-cyan text-[11px] font-black mb-2 flex items-center gap-2 relative z-10">
                                <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                {new Date(event.date || event.startDate || 0).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' }).toUpperCase()}
                            </div>
                            <h3 className="text-sm md:text-base font-black text-white uppercase italic mb-4 leading-tight relative z-10">
                                {event.title}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-500 relative z-10">
                                <MapPin className="w-3.5 h-3.5 text-neon-cyan" />
                                <span className="text-[10px] font-black uppercase truncate">{event.location}</span>
                            </div>
                        </Link>
                    ))}
                    <div className="min-w-[20px] shrink-0" />
                </div>
            </motion.section>

            {/* 4. The Feed - List News */}
            <motion.section variants={itemVariants} className="pt-8 border-t border-white/5">
                <div className="mobile-safe-container mb-5 flex items-center justify-between">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40 flex items-center gap-2.5">
                        <Newspaper className="w-4 h-4 text-neon-red shadow-[0_0_10px_rgba(255,0,51,0.5)]" />
                        ACTUALITÉS RÉCENTES
                    </h2>
                    <Link to="/news" className="text-[10px] font-black uppercase tracking-widest text-neon-red px-2 py-1 rounded-lg hover:bg-neon-red/10 transition-colors">Tout voir</Link>
                </div>
                <div className="flex gap-4 overflow-x-auto px-5 scrollbar-hide snap-x no-scrollbar">
                    {hotNews.map((news) => (
                        <Link
                            key={news.id}
                            to={getArticleLink(news)}
                            className="min-w-[280px] flex flex-col bg-white/[0.03] border border-white/5 rounded-[3rem] active:bg-white/10 transition-all shadow-2xl overflow-hidden group snap-center"
                        >
                            <div className="h-56 overflow-hidden shrink-0 bg-black/40 relative">
                                <img src={news.image} className="w-full h-full object-cover group-active:scale-105 transition-transform duration-700" alt="" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                <div className="absolute top-4 left-4 px-4 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl shadow-lg">
                                    <span className="text-[10px] font-black text-neon-red uppercase tracking-[0.2em]">{news.category}</span>
                                </div>
                            </div>
                            <div className="p-6 flex flex-col gap-3">
                                <h3 className="text-sm font-display font-black text-white uppercase italic leading-tight line-clamp-3">{news.title}</h3>
                                <div className="flex items-center gap-2 text-gray-500 mt-1">
                                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{news.date}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    <div className="min-w-[20px] shrink-0" />
                </div>
            </motion.section>

            {/* 5. Premium CTA */}
            <motion.section variants={itemVariants} className="mobile-safe-container">
                <div className="bg-gradient-to-br from-neon-red/80 to-neon-purple/80 p-10 rounded-[3.5rem] relative overflow-hidden shadow-[0_20px_60px_rgba(255,0,51,0.3)] border border-white/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-[100px] rounded-full" />
                    <Star className="absolute top-8 right-8 w-10 h-10 text-white/30 animate-pulse" />
                    <div className="relative z-10">
                        <h3 className="text-3xl font-display font-black text-white italic uppercase leading-none mb-4">DROPSIDERS<br />PREMIUM</h3>
                        <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mb-8 leading-relaxed max-w-[200px]">Accès exclusif, interviews,<br />et concours VIP par SMS.</p>
                        <button className="px-10 py-4 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] active:scale-95 transition-all shadow-2xl hover:bg-neon-red hover:text-white">S'abonner</button>
                    </div>
                </div>
            </motion.section>
        </motion.div>
    );
}
