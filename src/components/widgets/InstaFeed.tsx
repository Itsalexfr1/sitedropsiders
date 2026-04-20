import { InstagramEmbed } from 'react-social-media-embed';
import { motion } from 'framer-motion';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useState, useEffect, useRef } from 'react';

export function InstaFeed({ resolvedColor, username }: { accentColor?: string, resolvedColor?: string, username?: string }) {
    const account = (username || 'dropsiders.eu').replace('@', '');
    const instagramUrl = `https://www.instagram.com/${account}/`;
    const color = resolvedColor || '#ff1241';
    const playHoverSound = useHoverSound();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsInView(true);
                observer.disconnect();
            }
        }, { threshold: 0.1 });
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="w-full flex flex-col" ref={containerRef}>
            <div className="w-full flex justify-between items-center mb-4 px-1">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                    <span 
                        className="w-2 h-2 rounded-full animate-pulse" 
                        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                    />
                    INSTAGRAM
                </h3>
            </div>

            <motion.div
                whileHover={{ scale: 1.005 }}
                onMouseEnter={playHoverSound}
                className="w-full bg-black border border-white/10 rounded-[1.5rem] overflow-hidden shadow-2xl transition-all duration-300"
                style={{ height: '600px' }}
            >
                <div className="h-full w-full overflow-y-auto custom-scrollbar flex justify-center items-start bg-black">
                    <div className="w-[325px] flex-none origin-top" style={{ marginTop: '-150px', transform: 'scale(1.8)' }}>
                        {isInView && (
                            <InstagramEmbed 
                                url={instagramUrl} 
                                width="100%" 
                                style={{ borderRadius: '0px', border: 'none' }}
                            />
                        )}
                    </div>
                </div>

                <div className="w-full p-4 sm:p-6 relative z-10 bg-gradient-to-t from-black/90 to-black/60 border-t border-white/10 flex-none flex flex-col justify-center items-center">
                    <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/btn relative px-8 py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 overflow-hidden w-full text-center"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#ff1241] via-[#ff4066] to-[#ff8c00] opacity-100 group-hover/btn:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                        <span className="relative z-10 text-white flex items-center justify-center gap-2">
                            S'ABONNER À @{account}
                        </span>
                    </a>
                </div>
            </motion.div>
        </div>
    );
}
