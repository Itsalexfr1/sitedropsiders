import { InstagramEmbed } from 'react-social-media-embed';
import { Instagram as InstagramIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useState, useEffect, useRef } from 'react';

export function InstagramWidget({ accentColor = 'pink', resolvedColor, username }: { accentColor?: string, resolvedColor?: string, username?: string }) {
    const account = (username || 'dropsiders.fr').replace('@', '');
    const instagramUrl = `https://www.instagram.com/${account}/`;
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const playHoverSound = useHoverSound();
    const containerRef = useRef<HTMLDivElement>(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);

    // Use IntersectionObserver – fires even if element is already visible on mount
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

    // Hide skeleton after embed has had time to load
    useEffect(() => {
        if (!isInView) return;
        const timer = setTimeout(() => setIsLoaded(true), 2500);
        return () => clearTimeout(timer);
    }, [isInView]);

    return (
        <div className="w-full flex flex-col pt-3">
            {/* Widget Title Bar */}
            <div className="w-full flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                    />
                    INSTAGRAM
                </h3>
                <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-black tracking-widest text-pink-400 hover:text-white uppercase transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 hover:border-pink-500/50"
                >
                    <InstagramIcon className="w-3 h-3" />
                    <span>@{account}</span>
                </a>
            </div>

            <motion.div
                ref={containerRef}
                whileHover={{ scale: 1.005 }}
                onMouseEnter={playHoverSound}
                className="w-full bg-dark-bg/50 border border-white/10 rounded-2xl p-0 backdrop-blur-sm shadow-2xl flex flex-col items-center transition-all duration-300 min-h-[580px] overflow-hidden"
            >
                <div className="w-full relative group rounded-2xl p-0 bg-white/5 flex flex-col">
                    {/* Skeleton Loading State */}
                    <AnimatePresence>
                        {!isLoaded && (
                            <motion.div
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md rounded-2xl min-h-[540px]"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 p-0.5 animate-pulse">
                                    <div className="w-full h-full bg-black/60 rounded-[14px] flex items-center justify-center">
                                        <InstagramIcon className="w-8 h-8 text-pink-500" />
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-col items-center gap-2">
                                    <div className="h-2 w-28 bg-white/10 rounded-full animate-pulse" />
                                    <div className="h-2 w-20 bg-white/5 rounded-full animate-pulse" />
                                </div>
                                <span className="absolute bottom-6 text-[9px] font-black text-white/30 uppercase tracking-widest animate-pulse">Chargement publications officielles...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div
                        className="w-full bg-black/30 rounded-2xl flex flex-col justify-between"
                        style={{ border: `1px solid ${color}20` }}
                    >
                        {/* Official Instagram Embed Container - Calibrated height so the 2nd row is 100% visible */}
                        <div className="w-full px-0 pt-1 pb-0 flex justify-center min-h-[500px] sm:min-h-[530px]">
                            {isInView && (
                                <InstagramEmbed
                                    url={instagramUrl}
                                    width="100%"
                                    style={{
                                        borderRadius: '14px',
                                        minHeight: '490px',
                                        width: '100%'
                                    }}
                                />
                            )}
                        </div>

                        {/* Bottom Subscribe Button */}
                        <div className="w-full p-3 sm:p-3.5 relative z-10 bg-gradient-to-t from-black/95 to-black/75 flex flex-col justify-center items-center border-t border-white/5">
                            <a
                                href={instagramUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white font-black uppercase tracking-wider rounded-xl hover:shadow-[0_0_20px_rgba(236,72,153,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 text-center text-xs sm:text-sm flex items-center justify-center gap-2"
                            >
                                <InstagramIcon className="w-4 h-4" />
                                <span>S'abonner à @{account}</span>
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
