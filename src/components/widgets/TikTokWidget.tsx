import { motion, AnimatePresence } from 'framer-motion';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useEffect, useState, useRef } from 'react';
import { Share2 } from 'lucide-react';

export function TikTokWidget({ accentColor = 'cyan', resolvedColor, username }: { accentColor?: string, resolvedColor?: string, username?: string }) {
    const account = (username || 'dropsiders.eu').replace('@', '');
    const tiktokUrl = `https://www.tiktok.com/@${account}`;
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const playHoverSound = useHoverSound();
    const containerRef = useRef<HTMLDivElement>(null);

    const [isInView, setIsInView] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Use IntersectionObserver – fires even if already visible on mount
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Inject TikTok embed script after blockquote is in the DOM
    useEffect(() => {
        if (!isInView) return;

        // Small delay to ensure React has rendered the blockquote
        const timer = setTimeout(() => {
            const existing = document.getElementById('tiktok-embed-script');
            if (existing) {
                // Script already loaded – try to trigger re-render of new blockquotes
                (window as any).tiktokEmbed?.render?.();
                setTimeout(() => setIsLoaded(true), 2000);
            } else {
                const script = document.createElement('script');
                script.id = 'tiktok-embed-script';
                script.src = 'https://www.tiktok.com/embed.js';
                script.async = true;
                script.onload = () => setTimeout(() => setIsLoaded(true), 2000);
                script.onerror = () => setIsLoaded(true);
                document.body.appendChild(script);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [isInView]);

    return (
        <div className="h-full flex flex-col">
            <div className="w-full flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                    />
                    TIKTOK
                </h3>
                <Share2
                    className="w-4 h-4 text-gray-500 transition-colors cursor-pointer hover:text-white"
                    onMouseOver={(e) => e.currentTarget.style.color = color}
                    onMouseOut={(e) => e.currentTarget.style.color = 'rgb(107, 114, 128)'}
                />
            </div>

            <motion.div
                ref={containerRef}
                whileHover={{ scale: 1.01 }}
                onMouseEnter={playHoverSound}
                className="flex-1 bg-dark-bg/50 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-sm shadow-2xl space-y-4 sm:space-y-6 flex flex-col items-center transition-all duration-300 h-full min-h-[450px] sm:min-h-[550px]"
            >
                <div className="w-full flex-1 relative group rounded-xl overflow-hidden p-[1px] bg-white/5 flex flex-col min-h-[380px]">
                    {/* Skeleton */}
                    <AnimatePresence>
                        {!isLoaded && (
                            <motion.div
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white rounded-xl"
                            >
                                <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center animate-pulse">
                                    <svg viewBox="0 0 24 24" fill="white" className="w-9 h-9">
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V7.82a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.25z" />
                                    </svg>
                                </div>
                                <div className="mt-4 flex flex-col items-center gap-2">
                                    <div className="h-2 w-24 bg-gray-100 rounded-full animate-pulse" />
                                    <div className="h-2 w-16 bg-gray-50 rounded-full animate-pulse" />
                                </div>
                                <span className="absolute bottom-4 text-[9px] font-black text-gray-300 uppercase tracking-widest animate-pulse">Chargement TikTok...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div
                        className="flex-1 bg-white rounded-[11px] overflow-hidden flex flex-col justify-between"
                        style={{ border: `1px solid ${color}20` }}
                    >
                        <div className="w-full px-2 pt-2 pb-0 flex-1 overflow-hidden relative min-h-[380px] sm:min-h-[480px] bg-white">
                            <div className="absolute inset-x-0" style={{ top: '-10px' }}>
                                {isInView && (
                                    <blockquote
                                        className="tiktok-embed"
                                        cite={tiktokUrl}
                                        data-unique-id={account}
                                        data-embed-type="creator"
                                        style={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}
                                    >
                                        <section>
                                            <a target="_blank" href={`${tiktokUrl}?refer=creator_embed`} rel="noreferrer">@{account}</a>
                                        </section>
                                    </blockquote>
                                )}
                            </div>
                        </div>

                        <div className="w-full p-4 sm:p-6 relative z-10 bg-gradient-to-t from-black/90 to-black/60 border-t border-white/10 flex-none flex flex-col justify-center items-center">
                            <h4 className="text-white font-display font-bold text-lg mb-2 uppercase tracking-wide">Rejoignez la communauté</h4>
                            <p className="text-gray-400 text-sm text-center mb-4">Ne manquez aucune actu, festival et exclusivité sur notre compte TikTok.</p>
                            <a
                                href={tiktokUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-3 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-white font-black uppercase tracking-tight rounded-xl hover:shadow-[0_0_20px_rgba(0,242,254,0.4)] transition-all duration-300 text-center text-sm"
                            >
                                S'abonner à @{account}
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
