import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Mic2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useLanguage } from '../../context/LanguageContext';
import { resolveImageUrl } from '../../utils/image';
import { fetchWithFallback } from '../../utils/fetcher';

export function InterviewWidget({ accentColor = 'white', resolvedColor, featuredInterviews }: { accentColor?: string, resolvedColor?: string, featuredInterviews?: string[] }) {
    const color = resolvedColor || (accentColor === 'white' ? '#ffffff' : `var(--color-neon-${accentColor})`);
    const { t, language } = useLanguage();
    const [newsData, setNewsData] = useState<any[]>([]);

    const isLightColor = useMemo(() => {
        const c = (accentColor || '').toLowerCase();
        if (['white', 'yellow', 'lime', 'cyan', 'green', 'emerald'].includes(c)) return true;
        if (resolvedColor) {
            const rc = resolvedColor.toLowerCase();
            if (rc === 'white' || rc === '#ffffff' || rc === '#fff') return true;
            if (rc.includes('white') || rc.includes('yellow') || rc.includes('lime') || rc.includes('cyan')) return true;
            if (rc.startsWith('#') && rc.length >= 7) {
                const r = parseInt(rc.slice(1, 3), 16);
                const g = parseInt(rc.slice(3, 5), 16);
                const b = parseInt(rc.slice(5, 7), 16);
                if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                    return (0.299 * r + 0.587 * g + 0.114 * b) > 150;
                }
            }
        }
        return false;
    }, [accentColor, resolvedColor]);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const data = await fetchWithFallback('/api/news');
                if (data) setNewsData(data);
            } catch (err) {
                console.error('Failed to fetch news for interview widget:', err);
            }
        };
        fetchNews();
    }, []);

    const displayInterviews = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const all = newsData as any[];
        const baseInterviews = all.filter((item: any) => {
            if ((item.date || '').substring(0, 10) > today) return false;
            return item.category === 'Interview' ||
                item.category === 'Interviews' ||
                item.category === 'Interview Video';
        }).sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateB !== dateA) return dateB - dateA;
            return b.id - a.id;
        });

        if (featuredInterviews && featuredInterviews.length > 0) {
            const selected = featuredInterviews
                .map(id => baseInterviews.find(item => String(item.id) === String(id)))
                .filter(Boolean);

            if (selected.length < 4) {
                const remaining = baseInterviews
                    .filter(item => !featuredInterviews.includes(String(item.id)))
                    .slice(0, 4 - selected.length);
                return [...selected, ...remaining];
            }
            return selected.slice(0, 4);
        }

        return baseInterviews.slice(0, 4);
    }, [newsData, featuredInterviews]);

    const playHoverSound = useHoverSound();

    const locale = language === 'fr' ? 'fr-FR' : 'en-US';

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                    <span
                        className="w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}`
                        }}
                    />
                    {t('home.latest_interviews')}
                </h3>
                <Link
                    to="/interviews"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-[0.15em] transition-all duration-300 group bg-white/5"
                    style={{ borderColor: `${color}66`, color: 'white' }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = color;
                        e.currentTarget.style.boxShadow = `0 0 20px ${color}4D`;
                        e.currentTarget.style.backgroundColor = `${color}26`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${color}66`;
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                >
                    {t('home.view_all')} <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
            </div>

            {displayInterviews.length === 0 ? (
                <div className="flex-1 flex items-center justify-center border border-white/10 rounded-xl bg-dark-bg/40 backdrop-blur-md min-h-[200px]">
                    <p className="text-gray-400 font-display uppercase tracking-widest text-xs">{t('home.no_interview')}</p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {displayInterviews.map((item: any, index: number) => (
                        <Link to={`/interviews/${item.id}`} key={item.id} className="block group relative">
                            {/* Lueur externe derrière la carte */}
                            <div
                                className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none blur-[15px] rounded-xl z-0"
                                style={{ background: `${color}40` }}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onMouseEnter={playHoverSound}
                                transition={{ delay: index * 0.08 }}
                                className="h-full relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-white/10 transition-all duration-300 shadow-xl z-10 flex items-stretch"
                                onMouseOver={(e) => {
                                    e.currentTarget.style.borderColor = color;
                                    e.currentTarget.style.boxShadow = `0 0 20px ${color}50`;
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {/* Glow overlay */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-[1]"
                                    style={{
                                        background: `radial-gradient(circle at center, ${color}25 0%, transparent 70%)`,
                                    }}
                                />
                                <img
                                    src={resolveImageUrl(item.image)}
                                    alt={item.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center z-10">
                                    <div
                                        className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-all duration-300"
                                        style={{
                                            backgroundColor: `${color}25`,
                                            borderColor: `${color}80`
                                        }}
                                    >
                                        <Mic2 className="w-3.5 h-3.5 text-white" />
                                    </div>
                                </div>
                                <div className="absolute top-2 left-2 z-20">
                                    <span
                                        className="px-1.5 py-0.5 bg-dark-bg/80 backdrop-blur-md border text-[7px] font-black rounded uppercase tracking-tighter"
                                        style={{
                                            borderColor: color,
                                            color: color,
                                            boxShadow: `0 0 10px ${color}60`
                                        }}
                                    >
                                        {t('home.interview_badge')}
                                    </span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-20">
                                    <h4
                                        className="text-[11px] sm:text-[12px] font-display font-bold text-white leading-tight transition-colors line-clamp-2 uppercase italic tracking-tight"
                                        onMouseEnter={(e) => e.currentTarget.style.color = color}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                                    >
                                        {item.title}
                                    </h4>
                                    <p className="text-[8px] text-gray-500 mt-1 font-bold uppercase tracking-widest">
                                        {item.date && !isNaN(new Date(item.date).getTime())
                                            ? new Date(item.date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
                                            : item.date
                                        }
                                    </p>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
