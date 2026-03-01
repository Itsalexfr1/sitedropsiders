import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';

export function CustomCursor() {
    const [isHovering, setIsHovering] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    const springConfig = { damping: 30, stiffness: 400 };
    const springX = useSpring(cursorX, springConfig);
    const springY = useSpring(cursorY, springConfig);

    useEffect(() => {
        // Hide native cursor globally
        document.body.style.cursor = 'none';
        const style = document.createElement('style');
        style.innerHTML = `
            * { cursor: none !important; }
            a, button, select, input, [role="button"], .cursor-pointer { cursor: none !important; }
        `;
        document.head.appendChild(style);

        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);

            const target = e.target as HTMLElement;
            const isClickable =
                target.closest('a') ||
                target.closest('button') ||
                target.closest('input[type="submit"]') ||
                target.closest('input[type="button"]') ||
                target.closest('.cursor-pointer') ||
                window.getComputedStyle(target).cursor === 'pointer';

            setIsHovering(!!isClickable);
        };

        const handleMouseDown = () => setIsPressed(true);
        const handleMouseUp = () => setIsPressed(false);

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'auto';
            document.head.removeChild(style);
        };
    }, [cursorX, cursorY]);

    return (
        <motion.div
            className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[10000] hidden md:block"
            style={{
                x: springX,
                y: springY,
                translateX: '-50%',
                translateY: '-50%',
            }}
        >
            <motion.div
                animate={{
                    scale: isPressed ? 0.8 : isHovering ? 2 : 1,
                    rotate: 360,
                    opacity: 1
                }}
                transition={{
                    rotate: { duration: isHovering ? 1.5 : 4, repeat: Infinity, ease: "linear" },
                    scale: { type: "spring", damping: 20, stiffness: 300 },
                    opacity: { duration: 0.2 }
                }}
                className="relative w-full h-full"
            >
                {/* High Fidelity Vinyl Disc */}
                <div className="absolute inset-0 bg-[#050505] rounded-full border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden">
                    {/* Concentric Grooves */}
                    {[10, 20, 30, 40, 50, 60, 70, 80].map((inset) => (
                        <div key={inset} className="absolute rounded-full border border-white/5" style={{ inset: `${inset / 2}%` }} />
                    ))}

                    {/* Central Label */}
                    <div className={`absolute inset-[30%] rounded-full flex items-center justify-center transition-all duration-300 shadow-inner ${isHovering ? 'bg-neon-cyan' : 'bg-[#121212]'}`}>
                        <div className={`w-2 h-2 rounded-full border border-black/20 ${isHovering ? 'bg-black' : 'bg-neon-cyan opacity-40'}`} />

                        {/* Tiny Text on Label */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-[80%] h-[80%] border border-black/10 rounded-full" />
                        </div>
                    </div>

                    {/* Dynamic Reflection / Shine */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                </div>

                {/* Tonearm shadow or extra detail when hovering */}
                <AnimatePresence>
                    {isHovering && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute -right-2 -top-2 w-4 h-4 bg-neon-red rounded-full blur-[8px] opacity-30"
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
