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
                    <div className="absolute inset-0 bg-gradient-to-t from-neon-red/10 to-transparent pointer-events-none z-[5]" />
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
                    <div className="absolute inset-0 bg-neon-red/10 animate-pulse-slow" />

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
