import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export function CustomCursor() {
    const [isHovering, setIsHovering] = useState(false);
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    const springConfig = { damping: 25, stiffness: 200 };
    const springX = useSpring(cursorX, springConfig);
    const springY = useSpring(cursorY, springConfig);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);

            const target = e.target as HTMLElement;
            const isClickable =
                target.closest('a') ||
                target.closest('button') ||
                target.style.cursor === 'pointer' ||
                window.getComputedStyle(target).cursor === 'pointer';

            setIsHovering(!!isClickable);
        };

        window.addEventListener('mousemove', moveCursor);
        return () => window.removeEventListener('mousemove', moveCursor);
    }, [cursorX, cursorY]);

    return (
        <motion.div
            className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[1000] hidden md:block"
            style={{
                x: springX,
                y: springY,
                translateX: '-50%',
                translateY: '-50%',
            }}
        >
            <motion.div
                animate={{
                    scale: isHovering ? 2 : 0,
                    opacity: isHovering ? 1 : 0,
                    rotate: isHovering ? 360 : 0
                }}
                transition={{
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { type: "spring", damping: 15 }
                }}
                className="relative w-full h-full"
            >
                {/* Vinyl Disc */}
                <div className="absolute inset-0 bg-black rounded-full border-2 border-white/20 shadow-2xl">
                    {/* Grooves */}
                    <div className="absolute inset-1 border border-white/5 rounded-full" />
                    <div className="absolute inset-2 border border-white/5 rounded-full" />
                    {/* Central Label */}
                    <div className="absolute inset-[35%] bg-neon-cyan rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-black rounded-full" />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
