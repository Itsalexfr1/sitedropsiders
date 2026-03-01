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
                {/* USB Key Stylized Cursor */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        animate={{
                            rotate: isHovering ? 45 : 0,
                            scale: isHovering ? 1.2 : 1
                        }}
                        className="relative w-full h-full flex items-center justify-center"
                    >
                        {/* USB Metal Head */}
                        <div className={`absolute top-0 w-[40%] h-[30%] border-2 rounded-t-sm transition-all duration-300 ${isHovering ? 'border-neon-red bg-neon-red/20 shadow-[0_0_15px_rgba(255,17,17,0.5)]' : 'border-white/40 bg-white/10'}`} />

                        {/* USB Body */}
                        <div className={`absolute top-[30%] w-[60%] h-[60%] rounded-b-md border-2 transition-all duration-300 ${isHovering ? 'border-neon-red bg-black shadow-[0_0_20px_rgba(255,17,17,0.3)]' : 'border-white/20 bg-[#050505]'}`}>
                            {/* Tiny details/logo on USB body */}
                            <div className={`absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isHovering ? 'bg-neon-red animate-pulse' : 'bg-white/20'}`} />
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[40%] h-0.5 bg-white/10 rounded-full" />
                        </div>

                        {/* Connection pins inside head */}
                        <div className="absolute top-[5%] w-[30%] h-[15%] flex justify-between px-0.5">
                            <div className={`w-[20%] h-full rounded-full ${isHovering ? 'bg-neon-red' : 'bg-white/20'}`} />
                            <div className={`w-[20%] h-full rounded-full ${isHovering ? 'bg-neon-red' : 'bg-white/20'}`} />
                        </div>
                    </motion.div>
                </div>

                {/* Glow effect when hovering */}
                <AnimatePresence>
                    {isHovering && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 bg-neon-red rounded-full blur-[20px] opacity-20"
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
