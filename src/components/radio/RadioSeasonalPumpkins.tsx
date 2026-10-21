import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PumpkinItem {
    id: number;
    xPercent: number; // position horizontale en % (entre 10% et 85%)
    size: number;     // taille en px (26 à 38)
    variant: 'peek' | 'float' | 'bounce';
    rotation: number;
    delay: number;
    speed: number;
}

export function RadioJackOLantern({ size = 32, glowing = true }: { size?: number; glowing?: boolean }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter transition-transform hover:scale-125"
            style={{
                filter: glowing
                    ? 'drop-shadow(0 0 10px rgba(255, 115, 0, 0.85)) drop-shadow(0 0 20px rgba(255, 60, 0, 0.45))'
                    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            }}
        >
            {/* Tige de la citrouille */}
            <path
                d="M48 24C46 16 52 8 58 7C59 11 55 18 52 23Z"
                fill="#2e7d32"
                stroke="#1b5e20"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            {/* Petite vrille verte */}
            <path
                d="M56 12C61 10 65 14 63 17"
                stroke="#66bb6a"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
            />

            {/* Corps de la citrouille (lobes latéraux et central) */}
            {/* Lobe arrière gauche */}
            <ellipse cx="28" cy="56" rx="18" ry="25" fill="#e65100" />
            {/* Lobe arrière droit */}
            <ellipse cx="72" cy="56" rx="18" ry="25" fill="#e65100" />
            {/* Lobes avant gauche et droit */}
            <ellipse cx="38" cy="58" rx="19" ry="27" fill="#f57c00" />
            <ellipse cx="62" cy="58" rx="19" ry="27" fill="#f57c00" />
            {/* Lobe avant central */}
            <ellipse cx="50" cy="60" rx="18" ry="28" fill="#ff9800" />

            {/* Yeux lumineux sculptés */}
            {/* Œil gauche */}
            <polygon
                points="34,46 44,48 38,56"
                fill="#fff176"
                style={{ filter: 'drop-shadow(0 0 4px #ffe082)' }}
            />
            {/* Œil droit */}
            <polygon
                points="66,46 56,48 62,56"
                fill="#fff176"
                style={{ filter: 'drop-shadow(0 0 4px #ffe082)' }}
            />

            {/* Nez triangulaire sculpté */}
            <polygon
                points="50,56 46,63 54,63"
                fill="#ffe082"
                style={{ filter: 'drop-shadow(0 0 2px #ffca28)' }}
            />

            {/* Bouche grimaçante sculptée avec dents de vampire */}
            <path
                d="M30 68 Q50 82 70 68 C66 73 63 71 61 74 C59 71 56 71 54 75 C52 71 48 71 46 75 C44 71 41 72 39 74 C36 71 33 72 30 68 Z"
                fill="#ffe082"
                style={{ filter: 'drop-shadow(0 0 5px #ffd54f)' }}
            />
            {/* Intérieur sombre bouche */}
            <path
                d="M33 69 Q50 80 67 69 Q50 74 33 69 Z"
                fill="#bf360c"
                opacity="0.85"
            />
        </svg>
    );
}

/**
 * Composant RadioSeasonalPumpkins
 * Fait apparaître des citrouilles d'Halloween de manière périodique et organique
 * dans le player radio, avec de douces animations de surgissement (peek-a-boo)
 * ou de lévitation flottante avec braises magiques.
 */
export function RadioSeasonalPumpkins({ compact = false }: { compact?: boolean }) {
    const [pumpkins, setPumpkins] = useState<PumpkinItem[]>([]);
    const [poppedIds, setPoppedIds] = useState<{ [id: number]: string }>({});

    // Génère une nouvelle citrouille à intervalles aléatoires
    const spawnPumpkin = useCallback(() => {
        const id = Date.now() + Math.random();
        const xPercent = compact ? 50 : Math.floor(Math.random() * 70) + 15; // 15% à 85% pour éviter les bords extrêmes
        const size = compact ? 22 : Math.floor(Math.random() * 12) + 26; // 26px à 38px
        const variants: ('peek' | 'float' | 'bounce')[] = compact ? ['peek'] : ['peek', 'float', 'bounce'];
        const variant = variants[Math.floor(Math.random() * variants.length)];
        const rotation = (Math.random() - 0.5) * 24; // -12deg à +12deg
        const speed = variant === 'float' ? 6 : 4;

        setPumpkins(prev => [...prev.slice(-2), { id, xPercent, size, variant, rotation, delay: 0, speed }]);

        // Disparaît automatiquement après quelques secondes
        setTimeout(() => {
            setPumpkins(prev => prev.filter(p => p.id !== id));
        }, speed * 1000 + 500);
    }, [compact]);

    useEffect(() => {
        // Première citrouille après 2.5s
        const initialTimer = setTimeout(() => {
            spawnPumpkin();
        }, 2500);

        // Puis toutes les 8 à 14 secondes
        let intervalTimer: ReturnType<typeof setTimeout>;
        const scheduleNext = () => {
            const delay = Math.floor(Math.random() * 6000) + 8000; // 8s à 14s
            intervalTimer = setTimeout(() => {
                spawnPumpkin();
                scheduleNext();
            }, delay);
        };

        scheduleNext();

        return () => {
            clearTimeout(initialTimer);
            clearTimeout(intervalTimer);
        };
    }, [spawnPumpkin]);

    const handlePumpkinClick = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const emojis = ['✨', '🍬', '👻', '🦇', '🔥'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        setPoppedIds(prev => ({ ...prev, [id]: randomEmoji }));

        setTimeout(() => {
            setPumpkins(prev => prev.filter(p => p.id !== id));
        }, 800);
    };

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            <AnimatePresence>
                {pumpkins.map(p => {
                    const isPopped = Boolean(poppedIds[p.id]);

                    if (isPopped) {
                        return (
                            <motion.div
                                key={`pop-${p.id}`}
                                initial={{ opacity: 1, scale: 1, y: 0 }}
                                animate={{ opacity: 0, scale: 2.2, y: -30 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.6 }}
                                style={{ left: `${p.xPercent}%` }}
                                className="absolute bottom-3 transform -translate-x-1/2 flex items-center justify-center font-bold text-lg select-none"
                            >
                                <span className="drop-shadow-[0_0_10px_rgba(255,140,0,0.9)]">
                                    {poppedIds[p.id]}
                                </span>
                            </motion.div>
                        );
                    }

                    if (p.variant === 'peek') {
                        // Surgit du bas ou du haut de la barre
                        return (
                            <motion.div
                                key={p.id}
                                initial={{ y: 35, opacity: 0, rotate: p.rotation * 2 }}
                                animate={{
                                    y: [35, -4, 0, 0, 35],
                                    opacity: [0, 1, 1, 1, 0],
                                    rotate: [p.rotation, -p.rotation, p.rotation, -p.rotation, p.rotation],
                                }}
                                transition={{
                                    duration: p.speed,
                                    times: [0, 0.2, 0.35, 0.8, 1],
                                    ease: 'easeInOut',
                                }}
                                style={{ left: `${p.xPercent}%` }}
                                onClick={(e) => handlePumpkinClick(p.id, e)}
                                className="absolute bottom-0 -mb-1 transform -translate-x-1/2 pointer-events-auto cursor-pointer select-none group"
                                title="Joyeux Halloween ! Clique-moi 🎃"
                            >
                                <RadioJackOLantern size={p.size} glowing={true} />
                            </motion.div>
                        );
                    }

                    if (p.variant === 'bounce') {
                        // Petite citrouille qui rebondit gentiment
                        return (
                            <motion.div
                                key={p.id}
                                initial={{ y: 25, opacity: 0, scale: 0.7 }}
                                animate={{
                                    y: [25, -12, -2, -10, 0, 30],
                                    opacity: [0, 1, 1, 1, 1, 0],
                                    scale: [0.7, 1.1, 0.95, 1.05, 1, 0.7],
                                    rotate: [0, -10, 12, -6, 0, 10],
                                }}
                                transition={{
                                    duration: p.speed,
                                    times: [0, 0.25, 0.45, 0.65, 0.85, 1],
                                    ease: 'easeInOut',
                                }}
                                style={{ left: `${p.xPercent}%` }}
                                onClick={(e) => handlePumpkinClick(p.id, e)}
                                className="absolute bottom-2 transform -translate-x-1/2 pointer-events-auto cursor-pointer select-none"
                                title="🎃 Boo !"
                            >
                                <RadioJackOLantern size={p.size} glowing={true} />
                            </motion.div>
                        );
                    }

                    // Mode 'float': flotte vers le haut doucement en oscillant
                    return (
                        <motion.div
                            key={p.id}
                            initial={{ y: 30, opacity: 0, x: 0 }}
                            animate={{
                                y: [30, 0, -18, -35],
                                opacity: [0, 0.95, 0.9, 0],
                                x: [0, 15, -12, 10],
                                rotate: [p.rotation, -p.rotation, p.rotation, -p.rotation],
                            }}
                            transition={{
                                duration: p.speed,
                                times: [0, 0.25, 0.65, 1],
                                ease: 'easeOut',
                            }}
                            style={{ left: `${p.xPercent}%` }}
                            onClick={(e) => handlePumpkinClick(p.id, e)}
                            className="absolute bottom-1 transform -translate-x-1/2 pointer-events-auto cursor-pointer select-none"
                            title="🎃 Citrouille flottante"
                        >
                            <RadioJackOLantern size={p.size} glowing={true} />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
