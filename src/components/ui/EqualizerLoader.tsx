import { motion } from 'framer-motion';

export const EqualizerLoader = ({ count = 5, className = "" }: { count?: number, className?: string }) => {
    return (
        <div className={`flex items-end justify-center gap-[3px] h-10 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    className="w-1.5 bg-neon-cyan rounded-full shrink-0"
                    animate={{
                        height: [
                            '20%',
                            '100%',
                            '40%',
                            '90%',
                            '15%',
                            '60%',
                            '20%'
                        ]
                    }}
                    transition={{
                        duration: 0.6 + Math.random() * 0.4,
                        repeat: Infinity,
                        delay: i * 0.05,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
};
