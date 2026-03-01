import { motion } from 'framer-motion';

export const EqualizerLoader = ({ count = 5, className = "" }: { count?: number; className?: string }) => {
    return (
        <div className={`flex items-end gap-1.5 h-16 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    className="w-3 bg-neon-cyan rounded-t-sm"
                    initial={{ height: "20%" }}
                    animate={{
                        height: [
                            `${Math.random() * 40 + 20}%`,
                            `${Math.random() * 40 + 60}%`,
                            `${Math.random() * 40 + 20}%`
                        ],
                    }}
                    transition={{
                        duration: 0.6 + Math.random() * 0.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.05
                    }}
                    style={{
                        boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)'
                    }}
                />
            ))}
        </div>
    );
};
