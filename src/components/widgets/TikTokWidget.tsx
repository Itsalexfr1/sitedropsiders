import { motion } from 'framer-motion';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useEffect } from 'react';
import { Share2 } from 'lucide-react';

export function TikTokWidget({ accentColor = 'cyan', resolvedColor }: { accentColor?: string, resolvedColor?: string }) {
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const playHoverSound = useHoverSound();

    useEffect(() => {
        // Load the TikTok embed script dynamically to ensure it runs
        const script = document.createElement('script');
        script.src = 'https://www.tiktok.com/embed.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

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
                    className="w-4 h-4 text-gray-500 transition-colors"
                    onMouseOver={(e) => e.currentTarget.style.color = color}
                    onMouseOut={(e) => e.currentTarget.style.color = 'rgb(107, 114, 128)'}
                />
            </div>

            <motion.div
                whileHover={{ scale: 1.02 }}
                onMouseEnter={playHoverSound}
                className="flex-1 bg-dark-bg/50 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-sm shadow-2xl space-y-4 sm:space-y-6 flex flex-col items-center transition-all duration-300 h-full min-h-[350px] sm:min-h-[400px]"
            >

                <div className="w-full flex-1 relative group rounded-xl overflow-hidden p-[1px] bg-white/5 flex flex-col">
                    <div
                        className="flex-1 bg-white/5 rounded-[11px] overflow-hidden flex flex-col justify-between backdrop-blur-md"
                        style={{ border: `1px solid ${color}40` }}
                    >
                        {/* The container clips the top margin */}
                        <div className="w-full px-2 pt-2 pb-0 flex-1 overflow-hidden relative min-h-[380px] sm:min-h-[480px] bg-white">
                            <div className="absolute inset-x-0" style={{ top: '-10px' }}>
                                <blockquote
                                    className="tiktok-embed"
                                    cite="https://www.tiktok.com/@dropsiders.eu"
                                    data-unique-id="dropsiders.eu"
                                    data-embed-type="creator"
                                    style={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}
                                >
                                    <section>
                                        <a target="_blank" href="https://www.tiktok.com/@dropsiders.eu?refer=creator_embed" rel="noreferrer">@dropsiders.eu</a>
                                    </section>
                                </blockquote>
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
                                href="https://www.tiktok.com/@dropsiders.eu"
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-3 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-white font-black uppercase tracking-tight rounded-xl hover:shadow-[0_0_20px_rgba(0,242,254,0.4)] transition-all duration-300 text-center text-sm"
                            >
                                S'abonner à @dropsiders.eu
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
