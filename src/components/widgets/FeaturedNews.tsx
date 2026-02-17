import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import newsData from '../../data/news.json';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useLanguage } from '../../context/LanguageContext';

export function FeaturedNews() {
    const { t } = useLanguage();

    const latestNews = (newsData as any[])
        .filter((item: any) => item.category === 'News')
        .slice(0, 1);

    const heroNews = latestNews[0];

    if (!heroNews) {
        return (
            <div className="h-[750px] flex flex-col">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-3 mb-6">
                    <span className="w-2 h-2 bg-neon-red rounded-full animate-pulse shadow-[0_0_10px_#ff0033]" />
                    {t('home.featured')}
                </h3>
                <div className="flex-1 flex items-center justify-center border border-white/10 rounded-3xl bg-dark-bg/40 backdrop-blur-md">
                    <p className="text-gray-400 font-display uppercase tracking-widest text-sm">{t('home.no_article')}</p>
                </div>
            </div>
        );
    }



    const playHoverSound = useHoverSound();

    return (
        <div className="h-[750px] flex flex-col">
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-3 mb-6">
                <span className="w-2 h-2 bg-neon-red rounded-full animate-pulse shadow-[0_0_10px_#ff0033]" />
                {t('home.featured')}
            </h3>

            <Link to={`/news/${heroNews.id}`} className="flex-1 block group relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.05 }}
                    onMouseEnter={playHoverSound}
                    className="h-full relative rounded-3xl overflow-hidden border border-white/10 bg-dark-bg/40 backdrop-blur-md transition-all duration-500 hover:border-neon-red/50 shadow-2xl"
                >
                    <img
                        src={heroNews.image}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Overlay Content */}
                    <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-transparent">
                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                            <span className="text-neon-red font-black">{heroNews.category}</span>
                            <span>•</span>
                            <span>{heroNews.date}</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white leading-tight group-hover:text-neon-red transition-colors">
                            {heroNews.title}
                        </h2>
                    </div>

                    <div className="absolute top-6 left-6">
                        <span className="px-4 py-1.5 bg-dark-bg/60 backdrop-blur-md border border-neon-red text-neon-red text-[10px] font-black uppercase tracking-tighter rounded-full shadow-[0_0_15px_rgba(255,0,51,0.3)]">
                            {t('home.hot')}
                        </span>
                    </div>
                </motion.div>
            </Link>
        </div>
    );
}
