import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';

export function CustomCursor() {
    const [isHovering, setIsHovering] = useState(false);
    const [hoverColor, setHoverColor] = useState('#FF1241'); // Default neon-red
    const [isPressed, setIsPressed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    const springConfig = { damping: 30, stiffness: 400 };
    const springX = useSpring(cursorX, springConfig);
    const springY = useSpring(cursorY, springConfig);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        if (window.innerWidth < 768) {
            setIsMobile(true);
            return () => window.removeEventListener('resize', checkMobile);
        }

        // Hide native cursor globally (Desktop only)
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
            const clickableElement = target.closest('a, button, [role="button"], .cursor-pointer') as HTMLElement;

            if (clickableElement) {
                setIsHovering(true);
                const colorAttr = clickableElement.getAttribute('data-cursor-color');
                if (colorAttr) {
                    if (colorAttr.startsWith('#')) setHoverColor(colorAttr);
                    else if (colorAttr === 'neon-red') setHoverColor('#FF1241');
                    else if (colorAttr === 'neon-green') setHoverColor('#39FF14');
                    else if (colorAttr === 'neon-cyan') setHoverColor('#00FFFF');
                    else if (colorAttr === 'neon-purple') setHoverColor('#BF00FF');
                    else if (colorAttr === 'neon-red') setHoverColor('#FF0099');
                    else if (colorAttr === 'neon-blue') setHoverColor('#00BFFF');
                    else if (colorAttr === 'neon-yellow') setHoverColor('#FFF01F');
                    else setHoverColor(colorAttr);
                } else setHoverColor('#FF1241');
            } else setIsHovering(false);
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
            window.removeEventListener('resize', checkMobile);
            document.body.style.cursor = 'auto';
            if (document.head.contains(style)) document.head.removeChild(style);
        };
    }, [cursorX, cursorY]);

    if (isMobile) return null;

    return (
        <motion.div
            className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[10000]"
            initial={{ opacity: 0 }}
            animate={{
                opacity: 1,
                scale: 1
            }}
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
                {/* Standard Neon Arrow/Dot Cursor (Premium & Clean) */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        animate={{
                            scale: isHovering ? 1.5 : 1,
                        }}
                        className="relative w-full h-full flex items-center justify-center"
                    >
                        {/* Center Dot */}
                        <div
                            className="w-2 h-2 rounded-full transition-all duration-300"
                            style={{
                                backgroundColor: isHovering ? hoverColor : '#FFFFFF',
                                boxShadow: `0 0 10px ${isHovering ? hoverColor : 'rgba(255,255,255,0.5)'}`
                            }}
                        />

                        {/* Outer Ring */}
                        <motion.div
                            animate={{
                                scale: isHovering ? 1.2 : 1,
                                opacity: isHovering ? 1 : 0.3
                            }}
                            className="absolute w-5 h-5 border rounded-full"
                            style={{
                                borderColor: isHovering ? hoverColor : '#FFFFFF',
                                boxShadow: isHovering ? `0 0 15px ${hoverColor}` : 'none'
                            }}
                        />
                    </motion.div>
                </div>

                {/* Glow effect when hovering */}
                <AnimatePresence>
                    {isHovering && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 rounded-full blur-[20px] opacity-20"
                            style={{ backgroundColor: hoverColor }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
