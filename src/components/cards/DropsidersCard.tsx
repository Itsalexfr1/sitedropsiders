import { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { DropsidersCard } from '../../context/UserContext';

interface DropsidersCardProps {
    card: DropsidersCard;
    /** If true, the card starts face-down and can be flipped on click */
    flippable?: boolean;
    /** Scale multiplier (default 1) */
    scale?: number;
    /** Show date collected */
    showDate?: boolean;
    onClick?: () => void;
}

const RARITY_CONFIG = {
    legendary: {
        label: 'LÉGENDAIRE',
        stars: 4,
        textClass: 'text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
        borderColor: 'from-amber-400 via-yellow-200 to-amber-600',
        glowColor: 'rgba(245, 158, 11, 0.7)',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        holoBg: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(253,224,71,0.1) 50%, rgba(217,119,6,0.2) 100%)',
        bgGradient: 'from-amber-950/40 to-black',
        stampBg: 'bg-gradient-to-br from-amber-300 to-amber-600 text-amber-950 font-black',
    },
    epic: {
        label: 'ÉPIQUE',
        stars: 3,
        textClass: 'text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]',
        borderColor: 'from-purple-400 via-fuchsia-300 to-pink-500',
        glowColor: 'rgba(168, 85, 247, 0.6)',
        badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        holoBg: 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(244,63,94,0.1) 50%, rgba(107,33,168,0.2) 100%)',
        bgGradient: 'from-purple-950/40 to-black',
        stampBg: 'bg-gradient-to-br from-purple-300 to-fuchsia-600 text-white font-black',
    },
    rare: {
        label: 'RARE',
        stars: 2,
        textClass: 'text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]',
        borderColor: 'from-cyan-400 via-emerald-300 to-blue-500',
        glowColor: 'rgba(6, 182, 212, 0.5)',
        badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        holoBg: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(52,211,153,0.05) 50%, rgba(37,99,235,0.15) 100%)',
        bgGradient: 'from-cyan-950/40 to-black',
        stampBg: 'bg-gradient-to-br from-cyan-300 to-blue-600 text-cyan-950 font-black',
    },
    common: {
        label: 'COMMUN',
        stars: 1,
        textClass: 'text-slate-400',
        borderColor: 'from-slate-400 via-slate-200 to-slate-600',
        glowColor: 'rgba(148, 163, 184, 0.3)',
        badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        holoBg: 'linear-gradient(135deg, rgba(148,163,184,0.1) 0%, rgba(241,245,249,0.02) 50%, rgba(71,85,105,0.1) 100%)',
        bgGradient: 'from-slate-900/40 to-black',
        stampBg: 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-950 font-black',
    },
};

const TYPE_CONFIG = {
    festival: { label: 'FESTIVAL', color: 'bg-neon-red/10 text-neon-red border-neon-red/30 shadow-[0_0_8px_rgba(255,0,51,0.2)]' },
    club: { label: 'CLUB', color: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30 shadow-[0_0_8px_rgba(0,240,255,0.2)]' },
};

export function DropsidersCardComponent({ card, flippable = false, scale = 1, showDate = false, onClick }: DropsidersCardProps) {
    const [flipped, setFlipped] = useState(flippable);
    const [hovered, setHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const rarity = RARITY_CONFIG[card.rarity] || RARITY_CONFIG.common;
    const type = TYPE_CONFIG[card.type] || TYPE_CONFIG.club;

    // Motion values for realistic 3D tilt
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    
    // Smooth springs
    const springConfig = { stiffness: 180, damping: 15 };
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), springConfig);

    // Holographic sheen position linked to mouse
    const shineX = useSpring(useTransform(mouseX, [-0.5, 0.5], ['0%', '100%']), springConfig);
    const shineY = useSpring(useTransform(mouseY, [-0.5, 0.5], ['0%', '100%']), springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
        mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
        setHovered(false);
    };

    const handleClick = () => {
        if (flippable) setFlipped((f) => !f);
        onClick?.();
    };

    const W = Math.round(240 * scale);
    const H = Math.round(350 * scale);

    return (
        <motion.div
            ref={cardRef}
            style={{
                width: W,
                height: H,
                perspective: 1200,
                cursor: flippable ? 'pointer' : onClick ? 'pointer' : 'default',
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            whileTap={{ scale: 0.96 }}
            className="select-none relative"
        >
            {/* Card flip container */}
            <motion.div
                style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d', position: 'relative' }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
            >
                {/* === FRONT FACE === */}
                <div
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    className="absolute inset-0 z-10 w-full h-full"
                >
                    {/* Outer Glow / Aura */}
                    <div
                        className="absolute -inset-[4px] rounded-[24px] blur-md transition-opacity duration-300"
                        style={{
                            background: `radial-gradient(circle at center, ${rarity.glowColor} 0%, transparent 70%)`,
                            opacity: hovered ? 1 : 0.4,
                        }}
                    />

                    {/* Main Card Frame */}
                    <div
                        className={`relative w-full h-full rounded-[22px] overflow-hidden bg-black border-[3px] flex flex-col p-2.5 shadow-[0_15px_35px_rgba(0,0,0,0.8)]`}
                        style={{
                            borderColor: 'transparent',
                            background: `linear-gradient(#08080a, #030305) padding-box, linear-gradient(135deg, var(--tw-gradient-stops)) border-box`,
                            borderImage: `linear-gradient(135deg, var(--tw-gradient-stops)) 1`,
                        }}
                    >
                        {/* Metallic Gradient Border */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${rarity.borderColor} opacity-90 pointer-events-none p-[2px] rounded-[19px]`}>
                            <div className="w-full h-full rounded-[17px] bg-[#050508]" />
                        </div>

                        {/* Tech Noise / Grid Overlay Background */}
                        <div className="absolute inset-0 bg-[radial-gradient(#151525_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

                        {/* Dynamic Holographic Foil Overlay */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none z-20 mix-blend-color-dodge transition-opacity duration-300"
                            style={{
                                opacity: hovered ? 0.85 : 0.35,
                                background: rarity.holoBg,
                                backgroundPosition: `${shineX.get()} ${shineY.get()}`,
                            }}
                        />

                        {/* Dynamic Reflection Reflection Line */}
                        <div
                            className="absolute inset-0 z-30 pointer-events-none transition-all duration-700 ease-out"
                            style={{
                                background: 'linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
                                backgroundSize: '200% 200%',
                                transform: hovered ? 'translateX(100%)' : 'translateX(-100%)',
                            }}
                        />

                        {/* Inner Layout Content */}
                        <div className="relative z-40 flex flex-col h-full justify-between">
                            {/* 1. Header Bar */}
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[8px] font-black uppercase tracking-[0.25em] px-2 py-0.5 rounded-md border backdrop-blur-md ${rarity.badgeColor}`}>
                                    {rarity.label}
                                </span>
                                
                                {/* Star Rating Icons */}
                                <div className="flex gap-0.5">
                                    {Array.from({ length: rarity.stars }).map((_, i) => (
                                        <svg key={i} className={`w-2.5 h-2.5 fill-current ${rarity.textClass}`} viewBox="0 0 24 24">
                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                        </svg>
                                    ))}
                                </div>

                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border backdrop-blur-md ${type.color}`}>
                                    {type.label}
                                </span>
                            </div>

                            {/* 2. DJ / Club Image Panel */}
                            <div className="flex-1 relative rounded-[14px] overflow-hidden border border-white/5 shadow-inner" style={{ minHeight: 0 }}>
                                <img
                                    src={card.image}
                                    alt={card.name}
                                    className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-700"
                                    loading="lazy"
                                />
                                
                                {/* Futuristic Overlay Gradients */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent opacity-80" />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

                                {/* DJ Mag Rank Stamp Badge */}
                                <div className="absolute top-2 right-2 flex flex-col items-center justify-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-sm ${rarity.stampBg}`}>
                                        <span className="text-[10px] tracking-tighter">#{card.djmag_rank}</span>
                                    </div>
                                    <span className="text-[5px] font-black uppercase tracking-widest text-white/50 mt-0.5">RANK</span>
                                </div>
                            </div>

                            {/* 3. Footer / Details Section */}
                            <div className="mt-2.5 px-1 pb-1 flex flex-col justify-end">
                                {/* Title / Name */}
                                <h3 className="text-white font-black uppercase italic leading-none tracking-tight font-display mb-0.5" style={{ fontSize: Math.max(12, 16 * scale) }}>
                                    {card.name}
                                </h3>
                                
                                {/* Location */}
                                <p className="text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ fontSize: Math.max(7, 9 * scale) }}>
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                                    {card.city} · {card.country}
                                </p>

                                {showDate && card.collectedAt && (
                                    <p className="text-gray-600 font-bold uppercase tracking-wider mt-1 text-[8px]" style={{ fontSize: 7 * scale }}>
                                        Débloquée le {new Date(card.collectedAt).toLocaleDateString('fr-FR')}
                                    </p>
                                )}
                                
                                {/* Holographic accent stripe */}
                                <div className={`mt-2 h-[3px] rounded-full bg-gradient-to-r ${rarity.borderColor} opacity-80 shadow-[0_0_8px_var(--tw-gradient-stops)]`} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* === BACK FACE === */}
                {flippable && (
                    <div
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        className="absolute inset-0 w-full h-full"
                    >
                        <div className="w-full h-full rounded-[22px] bg-[#040407] border-[3px] border-white/10 flex flex-col items-center justify-center overflow-hidden relative p-6">
                            <div className="absolute inset-0 bg-[radial-gradient(#151525_1px,transparent_1px)] [background-size:12px_12px] opacity-20" />
                            <div className="absolute inset-0 bg-gradient-to-br from-neon-red/10 via-transparent to-neon-cyan/10" />
                            
                            <div className="absolute inset-4 rounded-[16px] border border-white/5 bg-black/40 flex flex-col items-center justify-center">
                                {/* Futuristic Logo Graphic */}
                                <div className="relative mb-3">
                                    <div className="absolute -inset-1.5 bg-neon-red/20 blur-md rounded-full animate-pulse" />
                                    <div className="relative w-16 h-16 rounded-full border-2 border-neon-red/40 flex items-center justify-center bg-neon-red/10 shadow-[0_0_15px_rgba(255,0,51,0.2)]">
                                        <span className="text-neon-red font-black text-2xl tracking-tighter italic">D</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">Dropsiders</span>
                                <span className="text-[6px] font-bold uppercase tracking-[0.2em] text-white/20 mt-1">TRADING CARD SYSTEM</span>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
