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
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[1.5rem] overflow-hidden shadow-2xl transition-all duration-300"
                style={{ height: '400px' }}
            >
                <div className="h-full w-full overflow-y-auto custom-scrollbar flex justify-center items-start">
                    <div className="w-full" style={{ marginTop: '-50px' }}>
                        {isInView && (
                            <InstagramEmbed 
                                url={instagramUrl} 
                                width="100%" 
                                style={{ borderRadius: '0px' }}
                            />
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
