import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import newsData from '../../data/news.json';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useLanguage } from '../../context/LanguageContext';
import { getArticleLink } from '../../utils/slugify';

export function RecentNews() {
    const { t, language } = useLanguage();

    const recentNews = (newsData as any[])
        .filter((item: any) => item.category === 'News')
        .slice(1, 9); // Showing 8 items as requested by the user

    if (recentNews.length === 0) {
        return (
            <div className="h-[750px] flex flex-col overflow-hidden">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
                    <span className="w-2 h-2 bg-neon-orange rounded-full animate-pulse shadow-[0_0_10px_#ff6600]" />
                    {t('home.latest_news').toUpperCase()}
                </h3>
                <div className="flex-1 flex items-center justify-center border border-white/10 rounded-3xl bg-dark-bg/40 backdrop-blur-md">
                    <p className="text-gray-400 font-display uppercase tracking-widest text-sm">{t('home.no_article')}</p>
                </div>
            </div>
        );
    }

    const playHoverSound = useHoverSound();

    return (
        <div className="h-[750px] flex flex-col overflow-hidden">
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-3 mb-6">
                <span className="w-2 h-2 bg-neon-orange rounded-full animate-pulse shadow-[0_0_10px_#ff6600]" />
                {t('home.latest_news').toUpperCase()}
            </h3>

            <div className="flex-1 bg-dark-bg/40 border border-white/10 rounded-3xl p-5 backdrop-blur-md shadow-xl flex flex-col justify-between overflow-hidden">
                <div className="divide-y divide-white/5">
                    {recentNews.map((item, index) => (
                        <Link to={getArticleLink(item)} key={item.id} className="block group py-2.5 first:pt-0 last:pb-0">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                whileHover={{ scale: 1.05 }}
                                onMouseEnter={playHoverSound}
                                transition={{ delay: index * 0.1 }}
                                className="flex gap-4 items-center origin-left"
                            >
                                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-white/5 relative bg-black/40 flex items-center justify-center">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute top-1 left-1">
                                        <span className="px-1.5 py-0.5 bg-dark-bg/60 backdrop-blur-md border border-neon-red text-neon-red text-[7px] font-black rounded shadow-[0_0_10px_rgba(255,0,51,0.3)]">
                                            {t('home.new')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-[9px] text-neon-red font-bold tracking-[0.2em] uppercase mb-1 block leading-none">
                                        {new Date(item.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                    <h4 className="text-white font-display font-bold text-sm leading-tight group-hover:text-neon-red transition-colors line-clamp-2 uppercase italic tracking-tight">
                                        {item.title}
                                    </h4>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-gray-700 group-hover:text-neon-red transition-all" />
                            </motion.div>
                        </Link>
                    ))}
                </div>

                <Link
                    to="/news"
                    className="w-full mt-6 py-4 border border-neon-red/30 hover:border-neon-red bg-dark-bg text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 group hover:shadow-[0_0_30px_rgba(255,0,51,0.2)]"
                >
                    {t('home.all_news')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
