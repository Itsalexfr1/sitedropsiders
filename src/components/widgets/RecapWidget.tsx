import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowUpRight, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useLanguage } from '../../context/LanguageContext';
import { getRecapLink, getGalleryLink } from '../../utils/slugify';
import { translateText } from '../../utils/translate';
import { resolveImageUrl } from '../../utils/image';

export function RecapWidget({ accentColor = 'orange', resolvedColor }: { accentColor?: string, resolvedColor?: string }) {
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const { t, language } = useLanguage();
    const [recapsData, setRecapsData] = useState<any[]>([]);
    const [galerieData, setGalerieData] = useState<any[]>([]);

    const latestRecaps = useMemo(() => {
        // Combine recaps and gallery items
        const combined = [
            ...(recapsData as any[]).map(item => {
                let title = item.title || "";
                if (!title.toLowerCase().startsWith('récap') && !title.toLowerCase().startsWith('recap')) {
                    title = `Récap : ${title}`;
                }
                return { ...item, contentType: 'recap', title: title.toUpperCase() };
            }),
            ...(galerieData as any[]).map(item => {
                let title = item.title || "";
                if (!title.toLowerCase().startsWith('récap') && !title.toLowerCase().startsWith('recap')) {
                    title = `Récap : ${title}`;
                }
                return { 
                    ...item, 
                    contentType: 'gallery',
                    image: item.cover, // Gallery uses 'cover', Recap uses 'image'
                    title: title.toUpperCase()
                };
            })
        ];

        return combined
            .filter(item => {
                if (!item) return false;
                // Removed the restrictive 'today' filter to ensure all recaps are visible
                return true;
            })
            .sort((a, b) => {
                const dateA = new Date(a.date).getTime() || 0;
                const dateB = new Date(b.date).getTime() || 0;
                
                // If years are different, sort by year
                const yearA = Number(a.year) || (isNaN(dateA) ? Number(a.date) : new Date(a.date).getFullYear());
                const yearB = Number(b.year) || (isNaN(dateB) ? Number(b.date) : new Date(b.date).getFullYear());
                
                if (yearB !== yearA) return yearB - yearA;
                
                // If same year, try full date comparison
                if (!isNaN(dateA) && !isNaN(dateB)) {
                    return dateB - dateA;
                }
                
                // Fallback to ID for stable sorting if dates are same or missing
                return String(b.id).localeCompare(String(a.id));
            })
            .slice(0, 12);
    }, [recapsData, galerieData]);

    const [translatedTitles, setTranslatedTitles] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchRecaps = async () => {
            try {
                const [r, g] = await Promise.all([
                    fetch('/api/recaps'),
                    fetch('/api/galerie')
                ]);
                if (r.ok) setRecapsData(await r.json());
                if (g.ok) setGalerieData(await g.json());
            } catch (err) {
                console.error('Failed to fetch recap widget data:', err);
            }
        };
        fetchRecaps();
    }, []);

    useEffect(() => {
        if (language === 'en') {
            Promise.all(
                latestRecaps.map(item =>
                    translateText(item.title, 'en').then(translated => ({ id: item.id, title: translated }))
                )
            ).then(results => {
                const titleMap: Record<string, string> = {};
                results.forEach(res => {
                    titleMap[res.id] = res.title;
                });
                setTranslatedTitles(titleMap);
            });
        }
    }, [language, latestRecaps]);

    const playHoverSound = useHoverSound();

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}`
                        }}
                    />
                    {t('home.latest_recaps').toUpperCase()}
                </h3>
                <Link
                    to="/recaps"
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

            {latestRecaps.length === 0 ? (
                <div className="flex-1 flex items-center justify-center border border-white/10 rounded-lg bg-dark-bg/40 backdrop-blur-md min-h-[400px]">
                    <p className="text-gray-400 font-display uppercase tracking-widest text-sm">{t('home.no_recap')}</p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {latestRecaps.map((item: any, index: number) => (
                        <Link 
                            to={item.contentType === 'gallery' ? getGalleryLink(item) : getRecapLink(item)} 
                            key={`${item.contentType}-${item.id}`} 
                            className="block group"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                onMouseEnter={playHoverSound}
                                transition={{ delay: index * 0.1 }}
                                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-white/50 transition-all duration-300 shadow-xl flex items-stretch glow-card-${item.contentType === 'gallery' ? 'blue' : accentColor}`}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = color}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                            >
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-[-1]"
                                    style={{
                                        background: `radial-gradient(circle at center, ${color}33 0%, transparent 70%)`,
                                        filter: 'blur(20px)'
                                    }}
                                />
                                <img
                                    src={resolveImageUrl(item.image || item.cover)}
                                    alt={item.title || ""}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center z-10">
                                    <div
                                        className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-all duration-300"
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = `${color}33`}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                    >
                                        {item.contentType === 'gallery' ? (
                                            <Camera className="w-4 h-4 text-white fill-white/20" />
                                        ) : (
                                            <Play className="w-4 h-4 text-white fill-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                                        )}
                                    </div>
                                </div>
                                <div className="absolute top-2 left-2 z-20">
                                    <span
                                        className="px-1.5 py-0.5 bg-dark-bg/80 backdrop-blur-md border text-[7px] font-black rounded uppercase tracking-tighter"
                                        style={{
                                            borderColor: item.contentType === 'gallery' ? 'var(--color-neon-blue)' : color,
                                            color: item.contentType === 'gallery' ? 'var(--color-neon-blue)' : color,
                                            boxShadow: `0 0 10px ${item.contentType === 'gallery' ? 'var(--color-neon-blue)4D' : color + '4D'}`
                                        }}
                                    >
                                        {item.contentType === 'gallery' ? 'Photo' : t('home.recap_badge')}
                                    </span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-20">
                                    <h4
                                        className="text-[13px] font-display font-bold text-white leading-tight transition-colors line-clamp-2 uppercase italic tracking-tighter"
                                        onMouseEnter={(e) => e.currentTarget.style.color = color}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                                    >
                                        {translatedTitles[item.id] || item.title}
                                    </h4>
                                    <p className="text-[8px] text-gray-500 mt-1 font-bold uppercase tracking-widest">
                                        {item.date && !isNaN(new Date(item.date).getTime()) 
                                            ? new Date(item.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                                            : item.date // Fallback for just year
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
