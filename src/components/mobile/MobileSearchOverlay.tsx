import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, TrendingUp, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface MobileSearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileSearchOverlay({ isOpen, onClose }: MobileSearchOverlayProps) {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const trendingTags = ['Tomorrowland', 'David Guetta', 'Ibiza 2025', 'Afterlife', 'Techno', 'Interviews'];

    const handleSearch = (q: string) => {
        if (!q.trim()) return;
        navigate(`/news?search=${encodeURIComponent(q)}`);
        onClose();
    };

    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex flex-col p-6"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-neon-red/10 border border-neon-red/30 flex items-center justify-center">
                                <Search className="w-5 h-5 text-neon-red" />
                            </div>
                            <span className="text-sm font-black text-white uppercase tracking-widest italic">Recherche Express</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-all"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative mb-12">
                        <input
                            autoFocus
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                            placeholder="Artiste, Festival, News..."
                            className="w-full bg-white/[0.03] border-b-2 border-white/10 px-0 py-5 text-xl font-black text-white placeholder:text-white/20 focus:outline-none focus:border-neon-red transition-all uppercase italic"
                        />
                        {query && (
                            <button
                                onClick={() => handleSearch(query)}
                                className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-neon-red flex items-center justify-center shadow-[0_0_20px_rgba(255,0,51,0.5)] active:scale-90 transition-all"
                            >
                                <ArrowRight className="w-6 h-6 text-white" />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto space-y-10 no-scrollbar">
                        {/* Trending */}
                        <section>
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-5 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> TRENDING NOW
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {trendingTags.map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => handleSearch(tag)}
                                        className="px-5 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-xs font-bold text-white/70 hover:text-white hover:border-white/30 transition-all active:scale-95"
                                    >
                                        #{tag.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Recent History Prompt */}
                        <section className="p-8 border border-white/5 rounded-[2.5rem] bg-gradient-to-br from-white/[0.02] to-transparent">
                            <h4 className="text-xl font-display font-black text-white italic uppercase mb-2">Pas d'idée ?</h4>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed mb-6">Explorez les dernières exclusivités<br />et interviews premium du moment.</p>
                            <button
                                onClick={() => { navigate('/news'); onClose(); }}
                                className="w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                            >
                                Découvrir les news
                            </button>
                        </section>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
