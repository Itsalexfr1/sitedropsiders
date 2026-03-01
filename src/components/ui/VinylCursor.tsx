import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export const VinylCursor = () => {
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 450 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const moveMouse = (e: MouseEvent) => {
            mouseX.set(e.clientX - (isHovering ? 20 : 0));
            mouseY.set(e.clientY - (isHovering ? 20 : 0));
            if (!isVisible) setIsVisible(true);
        };

        const handleHover = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isClickable = target.closest('button, a, select, input[type="button"], input[type="submit"], [role="button"], .cursor-pointer') !== null;
            setIsHovering(isClickable);
        };

        window.addEventListener('mousemove', moveMouse);
        window.addEventListener('mouseover', handleHover);

        return () => {
            window.removeEventListener('mousemove', moveMouse);
            window.removeEventListener('mouseover', handleHover);
        };
    }, [mouseX, mouseY, isHovering, isVisible]);

    if (!isVisible) return null;

    return (
        <motion.div
            className="fixed top-0 left-0 pointer-events-none z-[10000] flex items-center justify-center"
            style={{
                x: springX,
                y: springY,
                width: isHovering ? 40 : 0,
                height: isHovering ? 40 : 0,
            }}
        >
            {isHovering && (
                <motion.div
                    className="w-full h-full relative flex items-center justify-center"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                >
                    {/* Vinyl Record */}
                    <motion.div
                        className="w-full h-full rounded-full bg-black border-2 border-[#1a1a1a] shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                        {/* Grooves */}
                        <div className="absolute inset-0 border-[4px] border-white/5 rounded-full" />
                        <div className="absolute inset-[8px] border-[2px] border-white/5 rounded-full" />

                        {/* Label */}
                        <div className="w-1/3 h-1/3 bg-neon-cyan rounded-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-black rounded-full" />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </motion.div>
    );
};
