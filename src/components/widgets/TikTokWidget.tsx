import { motion } from 'framer-motion';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useState, useEffect, useRef } from 'react';

export function TikTokWidget({ resolvedColor, username }: { accentColor?: string, resolvedColor?: string, username?: string }) {
    const account = (username || 'dropsiders.eu').replace('@', '');
    const tiktokUrl = `https://www.tiktok.com/@${account}`;
    const color = resolvedColor || '#00f2ea';
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

    useEffect(() => {
        if (!isInView) return;
        const script = document.createElement('script');
        script.src = "https://www.tiktok.com/embed.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');
            if (existingScript) document.body.removeChild(existingScript);
        };
    }, [isInView]);

    return (
        <div className="w-full flex flex-col" ref={containerRef}>
            <div className="w-full flex justify-between items-center mb-4 px-1">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                    <span 
                        className="w-2 h-2 rounded-full animate-pulse" 
                        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                    />
                    TIKTOK
                </h3>
            </div>

            <motion.div
                whileHover={{ scale: 1.005 }}
                onMouseEnter={playHoverSound}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[1.5rem] overflow-hidden shadow-2xl transition-all duration-300"
                style={{ height: '400px' }}
            >
                <div className="h-full w-full overflow-y-auto custom-scrollbar flex justify-center items-start">
                    <div className="w-full" style={{ marginTop: '-20px' }}>
                        {isInView && (
                            <blockquote 
                                className="tiktok-embed" 
                                cite={tiktokUrl} 
                                data-unique-id={account} 
                                data-embed-type="creator" 
                                style={{ width: '100%', margin: 0, padding: 0 }}
                            >
                                <section>
                                    <a target="_blank" href={`${tiktokUrl}?refer=creator_embed`} rel="noreferrer">@{account}</a>
                                </section>
                            </blockquote>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
