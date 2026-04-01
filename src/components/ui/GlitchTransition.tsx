import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export const GlitchTransition = ({ trigger }: { trigger: any }) => {
    const [isGlitching, setIsGlitching] = useState(false);

    useEffect(() => {
        setIsGlitching(true);
        const timer = setTimeout(() => setIsGlitching(false), 250);
        return () => clearTimeout(timer);
    }, [trigger]);

    return (
        <AnimatePresence>
            {isGlitching && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[200] pointer-events-none overflow-hidden mix-blend-overlay"
                >
                    {/* Horizontal Slice Glitch */}
                    <div className="absolute inset-0 flex flex-col">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="flex-1 bg-white/[0.05] border-y border-white/10"
                                animate={{
                                    x: [0, (Math.random() > 0.5 ? 20 : -20), 0, (Math.random() > 0.5 ? 10 : -10), 0],
                                    filter: [
                                        'none',
                                        'hue-rotate(90deg) brightness(1.5)',
                                        'none',
                                        'invert(0.2)',
                                        'none'
                                    ]
                                }}
                                transition={{ duration: 0.2, ease: "linear" }}
                            />
                        ))}
                    </div>

                    {/* Digital Noise Overlay */}
                    <div 
                        className="absolute inset-0 opacity-40 mix-blend-color-dodge" 
                        style={{ backgroundImage: `url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20200%20200%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noiseFilter%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.65%22%20numOctaves=%223%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')` }} 
                    />

                    {/* RGB Split */}
                    <motion.div
                        className="absolute inset-0 bg-red-500/10"
                        animate={{ x: [-2, 2, -1, 0], y: [1, -1, 0] }}
                        transition={{ duration: 0.15 }}
                    />
                    <motion.div
                        className="absolute inset-0 bg-cyan-500/10"
                        animate={{ x: [2, -2, 1, 0], y: [-1, 1, 0] }}
                        transition={{ duration: 0.15 }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
