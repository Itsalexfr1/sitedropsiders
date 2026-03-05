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
                            className="w-[85vw] flex-shrink-0 aspect-square relative rounded-[3rem] overflow-hidden snap-center border border-white/10 group shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-95 transition-transform"
                        >
                            <img src={news.image} className="absolute inset-0 w-full h-full object-cover group-active:scale-105 transition-transform duration-700" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
                            <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl shadow-lg z-10">
                                <span className="text-xs font-black text-neon-red uppercase tracking-[0.2em]">{news.category}</span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col gap-4 z-10">
                                <h3 className="text-3xl sm:text-4xl font-display font-black text-white italic leading-[1.1] uppercase line-clamp-4 drop-shadow-2xl">
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
                            className="w-[85vw] flex-shrink-0 aspect-square bg-[#111] border border-white/10 rounded-[3rem] p-8 snap-center active:bg-white/5 transition-colors relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-end group"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/10 blur-[50px] rounded-full group-hover:bg-neon-cyan/20 transition-colors" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-neon-cyan/5 blur-[50px] rounded-full" />
                            <div className="flex-1" />
                            <div className="text-neon-cyan text-sm font-black mb-3 flex items-center gap-2 relative z-10 uppercase tracking-widest">
                                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                {new Date(event.date || event.startDate || 0).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' }).toUpperCase()}
                            </div>
                            <h3 className="text-3xl font-black text-white uppercase italic mb-6 leading-[1.1] relative z-10 drop-shadow-2xl line-clamp-3">
                                {event.title}
                            </h3>
                            <div className="flex items-center gap-3 text-gray-400 relative z-10 bg-white/5 w-fit px-4 py-3 rounded-2xl backdrop-blur-sm border border-white/10 shadow-lg">
                                <MapPin className="w-5 h-5 text-neon-cyan" />
                                <span className="text-xs font-black uppercase truncate max-w-[200px]">{event.location}</span>
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
                            className="w-[85vw] flex-shrink-0 aspect-square relative rounded-[3rem] overflow-hidden group snap-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 active:scale-95 transition-transform"
                        >
                            <img src={news.image} className="absolute inset-0 w-full h-full object-cover group-active:scale-105 transition-transform duration-700" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
                            <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl shadow-lg z-10">
                                <span className="text-xs font-black text-neon-red uppercase tracking-[0.2em]">{news.category}</span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col gap-4 z-10">
                                <h3 className="text-3xl sm:text-4xl font-display font-black text-white uppercase italic leading-[1.1] line-clamp-4 drop-shadow-2xl">{news.title}</h3>
                                <div className="flex items-center gap-3 text-white/60">
                                    <div className="w-2 h-2 bg-white/40 rounded-full" />
                                    <span className="text-xs font-bold uppercase tracking-widest">{news.date}</span>
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
