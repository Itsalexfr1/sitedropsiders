import { motion, AnimatePresence } from 'framer-motion';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useEffect, useState } from 'react';
import { Share2, Music } from 'lucide-react';

export function TikTokWidget({ accentColor = 'cyan', resolvedColor, username }: { accentColor?: string, resolvedColor?: string, username?: string }) {
    const account = (username || 'dropsiders.eu').replace('@', '');
    const tiktokUrl = `https://www.tiktok.com/@${account}`;
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const playHoverSound = useHoverSound();

    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        if (!isInView) return;
        
        // Load the TikTok embed script dynamically only when in view
        const script = document.createElement('script');
        script.src = 'https://www.tiktok.com/embed.js';
        script.async = true;
        // Listen for script load to potentially hide skeleton
        script.onload = () => {
            // TikTok script doesn't have a callback for "render finish" 
            // but usually takes ~1s after script load
            setTimeout(() => setIsLoaded(true), 1500);
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, [isInView]);

    return (
        <div className="h-full flex flex-col">
            <div className="w-full flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}`
                        }}
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
                whileHover={{ scale: 1.01 }}
                onMouseEnter={playHoverSound}
                onViewportEnter={() => setIsInView(true)}
                className="flex-1 bg-dark-bg/50 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-sm shadow-2xl space-y-4 sm:space-y-6 flex flex-col items-center transition-all duration-300 h-full min-h-[450px] sm:min-h-[550px]"
            >

                <div className="w-full flex-1 relative group rounded-xl overflow-hidden p-[1px] bg-white/5 flex flex-col min-h-[380px]">
                    {/* Skeleton / Placeholder */}
                    <AnimatePresence>
                        {!isLoaded && (
                            <motion.div 
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white"
                            >
                                <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center animate-pulse">
                                    <Music className="w-8 h-8 text-cyan-400" />
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
                        {/* The container clips the top margin */}
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

                        {/* Premium CTA to perfectly align with Instagram */}
                        <div className="w-full p-4 sm:p-6 relative z-10 bg-gradient-to-t from-black/90 to-black/60 border-t border-white/10 flex-none flex flex-col justify-center items-center">
                            <h4 className="text-white font-display font-bold text-lg mb-2 uppercase tracking-wide">
                                Rejoignez la communauté
                            </h4>
                            <p className="text-gray-400 text-sm text-center mb-4">
                                Ne manquez aucune actu, festival et exclusivité sur notre compte TikTok.
                            </p>
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
