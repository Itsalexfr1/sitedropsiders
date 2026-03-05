import { Link } from 'react-router-dom';
import { Newspaper, ArrowRight, TrendingUp, Star, Calendar, Play, MapPin, Share2, Heart, MessageCircle } from 'lucide-react';
import newsData from '../../data/news.json';
import agendaData from '../../data/agenda.json';
import recapsData from '../../data/recaps.json';
import { getArticleLink, getAgendaLink, getRecapLink } from '../../utils/slugify';
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

    const recentRecaps = useMemo(() => {
        return [...recapsData]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 6);
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
                            className="min-w-[150px] bg-white/[0.03] border border-white/10 rounded-[2rem] p-5 snap-start active:bg-white/10 transition-colors relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-12 h-12 bg-neon-cyan/10 blur-2xl rounded-full" />
                            <div className="text-neon-cyan text-[10px] font-black mb-1.5 flex items-center gap-1.5">
                                <div className="w-1 h-1 bg-neon-cyan rounded-full animate-pulse" />
                                {new Date(event.date || event.startDate || 0).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' }).toUpperCase()}
                            </div>
                            <h3 className="text-[10px] font-black text-white line-clamp-2 uppercase italic mb-3 leading-tight tracking-tight">
                                {event.title}
                            </h3>
                            <div className="flex items-center gap-1.5 text-gray-500">
                                <MapPin className="w-2.5 h-2.5 text-neon-cyan" />
                                <span className="text-[8px] font-black uppercase truncate">{event.location}</span>
                            </div>
                        </Link>
                    ))}
                    <div className="min-w-[20px] shrink-0" />
                </div>
            </motion.section>

            {/* Social Feed - TikTok style */}
            <motion.section variants={itemVariants} className="bg-white/[0.02] py-10 border-y border-white/5">
                <div className="mobile-safe-container mb-8">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40 flex items-center gap-2.5">
                        <Star className="w-4 h-4 text-neon-pink animate-spin-slow" />
                        DROPSIDERS SOCIAL
                    </h2>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider mt-1">Les meilleurs moments en plein écran</p>
                </div>
                <div className="flex gap-6 overflow-x-auto px-5 snap-x snap-mandatory no-scrollbar pb-4">
                    {recentRecaps.map((recap, idx) => (
                        <div
                            key={recap.id}
                            className="min-w-[280px] aspect-[9/16] relative rounded-[3rem] overflow-hidden snap-center shadow-2xl group border border-white/10"
                        >
                            <img src={recap.image} className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />

                            {/* Overlay Interaction Buttons */}
                            <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center">
                                <button className="flex flex-col items-center gap-1 group/act">
                                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 transition-all">
                                        <Heart className="w-6 h-6 text-white group-hover/act:text-neon-red group-hover/act:fill-neon-red" />
                                    </div>
                                    <span className="text-[8px] font-black text-white/60">{(1.2 + idx * 0.4).toFixed(1)}K</span>
                                </button>
                                <button className="flex flex-col items-center gap-1">
                                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 transition-all">
                                        <MessageCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-[8px] font-black text-white/60">{42 + idx * 12}</span>
                                </button>
                                <button className="flex flex-col items-center gap-1">
                                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 transition-all">
                                        <Share2 className="w-6 h-6 text-white" />
                                    </div>
                                </button>
                            </div>

                            {/* Content Info */}
                            <Link to={getRecapLink(recap)} className="absolute bottom-6 left-6 right-20">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-7 h-7 rounded-lg bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center">
                                        <Play className="w-3 h-3 text-neon-purple fill-neon-purple" />
                                    </div>
                                    <span className="text-[9px] font-black text-neon-purple tracking-widest uppercase">REC’ 2025</span>
                                </div>
                                <h3 className="text-sm font-display font-black text-white uppercase italic leading-tight line-clamp-2">
                                    {recap.title}
                                </h3>
                            </Link>
                        </div>
                    ))}
                </div>
            </motion.section>

            {/* 4. The Feed - List News */}
            <motion.section variants={itemVariants} className="mobile-safe-container">
                <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/40 mb-8 flex items-center gap-2.5">
                    <Newspaper className="w-4 h-4 text-neon-red" />
                    ACTUALITÉS RÉCENTES
                </h2>
                <div className="grid grid-cols-2 gap-5">
                    {hotNews.map((news) => (
                        <Link
                            key={news.id}
                            to={getArticleLink(news)}
                            className="flex flex-col bg-white/[0.03] border border-white/5 rounded-[2.5rem] active:bg-white/10 transition-all shadow-xl overflow-hidden group"
                        >
                            <div className="h-40 overflow-hidden shrink-0 bg-black/40 relative">
                                <img src={news.image} className="w-full h-full object-cover group-active:scale-110 transition-transform duration-700" alt="" />
                                <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl">
                                    <span className="text-[8px] font-black text-neon-red uppercase tracking-wider">{news.category}</span>
                                </div>
                            </div>
                            <div className="p-5 flex flex-col gap-2">
                                <h3 className="text-[11px] font-black text-white uppercase italic leading-tight line-clamp-2 min-h-[2.2em]">{news.title}</h3>
                                <div className="flex items-center gap-1.5 text-gray-600">
                                    <div className="w-1 h-1 bg-gray-600 rounded-full" />
                                    <span className="text-[8px] font-bold uppercase tracking-wider">{news.date}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
                <Link
                    to="/news"
                    className="mt-10 w-full py-5 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-[0.25em] text-white active:scale-95 transition-all shadow-xl group"
                >
                    Toutes les actualités <ArrowRight className="w-4 h-4 text-neon-red group-hover:translate-x-1 transition-transform" />
                </Link>
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
