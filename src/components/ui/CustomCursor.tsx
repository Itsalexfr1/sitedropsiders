import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';

export function CustomCursor() {
    const [isHovering, setIsHovering] = useState(false);
    const [hoverColor, setHoverColor] = useState('#FF1241'); // Default neon-red
    const [isPressed, setIsPressed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTouchActive, setIsTouchActive] = useState(false);

    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    const springConfig = { damping: 30, stiffness: 400 };
    const springX = useSpring(cursorX, springConfig);
    const springY = useSpring(cursorY, springConfig);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

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
                    else if (colorAttr === 'neon-pink') setHoverColor('#FF0099');
                    else if (colorAttr === 'neon-blue') setHoverColor('#00BFFF');
                    else if (colorAttr === 'neon-yellow') setHoverColor('#FFF01F');
                    else setHoverColor(colorAttr);
                } else setHoverColor('#FF1241');
            } else setIsHovering(false);
        };

        const handleTouchMove = (e: TouchEvent) => {
            setIsTouchActive(true);
            if (e.touches[0]) {
                const x = e.touches[0].clientX;
                const y = e.touches[0].clientY;
                cursorX.set(x);
                cursorY.set(y);

                const target = document.elementFromPoint(x, y) as HTMLElement;
                const clickableElement = target?.closest('a, button, [role="button"], .cursor-pointer') as HTMLElement;
                setIsHovering(!!clickableElement);
            }
        };

        const handleTouchEnd = () => {
            setIsTouchActive(false);
            setIsHovering(false);
        };

        const handleMouseDown = () => setIsPressed(true);
        const handleMouseUp = () => setIsPressed(false);

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchstart', handleTouchMove);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchstart', handleTouchMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('resize', checkMobile);
            document.body.style.cursor = 'auto';
            if (document.head.contains(style)) document.head.removeChild(style);
        };
    }, [cursorX, cursorY]);

    return (
        <motion.div
            className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[10000]"
            initial={{ opacity: 0 }}
            animate={{
                opacity: (isMobile && !isTouchActive) ? 0 : 1,
                scale: isMobile ? 0.7 : 1
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
                    scale: isPressed ? 0.8 : isHovering ? (isMobile ? 1.4 : 2) : 1,
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
                {/* USB Key Stylized Cursor (50% smaller and slimmer) */}
                <div className="absolute inset-0 flex items-center justify-center scale-50">
                    <motion.div
                        animate={{
                            rotate: isHovering ? 45 : 0,
                            scale: isHovering ? 1.1 : 1
                        }}
                        className="relative w-full h-full flex items-center justify-center"
                    >
                        {/* USB Metal Head - Silver */}
                        <div
                            className={`absolute top-0 w-[30%] h-[30%] border-2 rounded-t-sm transition-all duration-300 ${isHovering ? 'bg-opacity-20 shadow-lg' : 'border-white/60 bg-white/40'}`}
                            style={{
                                borderColor: isHovering ? hoverColor : undefined,
                                backgroundColor: isHovering ? `${hoverColor}33` : undefined,
                                boxShadow: isHovering ? `0 0 10px ${hoverColor}80` : undefined
                            }}
                        />

                        {/* USB Body - White */}
                        <div
                            className={`absolute top-[30%] w-[45%] h-[60%] rounded-b-md border-2 transition-all duration-300 ${isHovering ? 'bg-white shadow-lg' : 'border-white/40 bg-white'}`}
                            style={{
                                borderColor: isHovering ? hoverColor : undefined,
                                boxShadow: isHovering ? `0 0 15px ${hoverColor}4D` : undefined
                            }}
                        >
                            {/* Tiny details on USB body */}
                            <div
                                className={`absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isHovering ? 'animate-pulse' : 'bg-black/20'}`}
                                style={{ backgroundColor: isHovering ? hoverColor : undefined }}
                            />
                        </div>

                        {/* Connection pins inside head */}
                        <div className="absolute top-[5%] w-[20%] h-[15%] flex justify-between px-0.5">
                            <div
                                className={`w-[25%] h-full rounded-full ${isHovering ? '' : 'bg-black/20'}`}
                                style={{ backgroundColor: isHovering ? hoverColor : undefined }}
                            />
                            <div
                                className={`w-[25%] h-full rounded-full ${isHovering ? '' : 'bg-black/20'}`}
                                style={{ backgroundColor: isHovering ? hoverColor : undefined }}
                            />
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
                            className="absolute inset-0 rounded-full blur-[20px] opacity-20"
                            style={{ backgroundColor: hoverColor }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
