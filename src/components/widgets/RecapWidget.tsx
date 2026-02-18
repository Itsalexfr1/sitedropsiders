import { motion } from 'framer-motion';
import { Play, ArrowUpRight } from 'lucide-react';
import recapsData from '../../data/recaps.json';
import { Link } from 'react-router-dom';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useLanguage } from '../../context/LanguageContext';
import { getRecapLink } from '../../utils/slugify';

export function RecapWidget() {
    const { t, language } = useLanguage();

    const latestRecaps = (recapsData as any[])
        .slice(0, 6);

    const playHoverSound = useHoverSound();

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
                    <span className="w-2 h-2 bg-neon-orange rounded-full animate-pulse shadow-[0_0_10px_#ff6600]" />
                    {t('home.latest_recaps').toUpperCase()}
                </h3>
                <Link to="/recaps" className="text-sm text-neon-orange hover:underline transition-all flex items-center gap-1 font-bold tracking-tight">
                    {t('home.view_all')} <ArrowUpRight className="w-4 h-4" />
                </Link>
            </div>

            {latestRecaps.length === 0 ? (
                <div className="flex-1 flex items-center justify-center border border-white/10 rounded-lg bg-dark-bg/40 backdrop-blur-md">
                    <p className="text-gray-400 font-display uppercase tracking-widest text-sm">{t('home.no_recap')}</p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-2 gap-3">
                    {latestRecaps.map((item: any, index: number) => (
                        <Link to={getRecapLink(item)} key={item.id} className="block group">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                onMouseEnter={playHoverSound}
                                transition={{ delay: index * 0.1 }}
                                className="h-full group relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-white/10 hover:border-neon-orange/50 transition-all duration-300 shadow-md"
                            >
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 group-hover:bg-neon-orange/20 transition-all duration-300">
                                        <Play className="w-4 h-4 text-white fill-white" />
                                    </div>
                                </div>
                                <div className="absolute top-2 left-2">
                                    <span className="px-1 py-0.5 bg-dark-bg/60 backdrop-blur-md border border-neon-orange text-neon-orange text-[6px] font-black rounded shadow-[0_0_10px_rgba(255,102,0,0.3)] uppercase tracking-tighter">
                                        {t('home.recap_badge')}
                                    </span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                                    <h4 className="text-[11px] font-bold text-white leading-tight group-hover:text-neon-orange transition-colors line-clamp-1">{item.title}</h4>
                                    <p className="text-[9px] text-gray-400 mt-0.5 font-medium">{new Date(item.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })}</p>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
