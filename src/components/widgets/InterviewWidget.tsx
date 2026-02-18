import { motion } from 'framer-motion';
import { ArrowUpRight, Mic2 } from 'lucide-react';
import newsData from '../../data/news.json';
import { Link } from 'react-router-dom';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useLanguage } from '../../context/LanguageContext';

export function InterviewWidget() {
    const { t, language } = useLanguage();

    const latestInterviews = (newsData as any[])
        .filter((item: any) => item.category === 'Interview' || item.category === 'Interviews')
        .slice(0, 8);

    const playHoverSound = useHoverSound();

    const locale = language === 'fr' ? 'fr-FR' : 'en-US';

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_#ffffff]" />
                    {t('home.latest_interviews')}
                </h3>
                <Link to="/interviews" className="text-sm text-neon-red hover:underline transition-all flex items-center gap-1 font-bold tracking-tight">
                    {t('home.view_all')} <ArrowUpRight className="w-4 h-4" />
                </Link>
            </div>

            {latestInterviews.length === 0 ? (
                <div className="flex-1 flex items-center justify-center border border-white/10 rounded-3xl bg-dark-bg/40 backdrop-blur-md min-h-[400px]">
                    <p className="text-gray-400 font-display uppercase tracking-widest text-sm">{t('home.no_interview')}</p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {latestInterviews.map((item: any, index: number) => (
                        <Link to={`/interviews/${item.id}`} key={item.id} className="block group">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                onMouseEnter={playHoverSound}
                                transition={{ delay: index * 0.1 }}
                                className="h-full group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border border-white/10 hover:border-neon-red/50 transition-all duration-300 shadow-xl"
                            >
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-neon-red/20 backdrop-blur-md flex items-center justify-center border border-neon-red/50 group-hover:scale-110 group-hover:bg-neon-red/40 transition-all duration-300">
                                        <Mic2 className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 bg-neon-red text-white text-[9px] font-black rounded-full shadow-[0_0_15px_rgba(255,0,51,0.5)] uppercase tracking-widest">
                                        {t('home.interview_badge')}
                                    </span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black/40 to-transparent">
                                    <h4 className="text-sm font-display font-black text-white leading-tight group-hover:text-neon-red transition-colors line-clamp-1 italic uppercase tracking-tighter">{item.title}</h4>
                                    <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-widest">{new Date(item.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</p>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
