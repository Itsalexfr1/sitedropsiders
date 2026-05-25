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
        stars: '★★★★',
        borderColor: 'from-amber-300 via-yellow-400 to-amber-300',
        glowColor: 'rgba(251,191,36,0.6)',
        badgeColor: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
        holoBg: 'from-amber-400/20 via-yellow-300/10 to-orange-400/20',
    },
    epic: {
        label: 'ÉPIQUE',
        stars: '★★★',
        borderColor: 'from-purple-400 via-fuchsia-400 to-purple-400',
        glowColor: 'rgba(192,38,211,0.5)',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        holoBg: 'from-purple-400/20 via-fuchsia-300/10 to-violet-400/20',
    },
    rare: {
        label: 'RARE',
        stars: '★★',
        borderColor: 'from-cyan-400 via-blue-400 to-cyan-400',
        glowColor: 'rgba(6,182,212,0.4)',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        holoBg: 'from-cyan-400/20 via-blue-300/10 to-sky-400/20',
    },
    common: {
        label: 'COMMUN',
        stars: '★',
        borderColor: 'from-gray-400 via-slate-300 to-gray-400',
        glowColor: 'rgba(148,163,184,0.3)',
        badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
        holoBg: 'from-slate-400/10 via-gray-300/5 to-slate-400/10',
    },
};

const TYPE_CONFIG = {
    festival: { label: 'FESTIVAL', color: 'bg-neon-red/20 text-neon-red border-neon-red/30' },
    club: { label: 'CLUB', color: 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30' },
};

export function DropsidersCardComponent({ card, flippable = false, scale = 1, showDate = false, onClick }: DropsidersCardProps) {
    const [flipped, setFlipped] = useState(flippable);
    const [hovered, setHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const rarity = RARITY_CONFIG[card.rarity];
    const type = TYPE_CONFIG[card.type];

    // Tilt effect on mouse move
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springConfig = { stiffness: 200, damping: 20 };
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

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

    const W = Math.round(200 * scale);
    const H = Math.round(290 * scale);

    return (
        <motion.div
            ref={cardRef}
            style={{
                width: W,
                height: H,
                perspective: 1000,
                cursor: flippable ? 'pointer' : onClick ? 'pointer' : 'default',
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            whileTap={{ scale: 0.97 }}
        >
            {/* Card flip container */}
            <motion.div
                style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d', position: 'relative' }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
                {/* === FRONT FACE === */}
                <div
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    className="absolute inset-0"
                >
                    {/* Outer glow */}
                    <div
                        className="absolute -inset-[3px] rounded-[18px] blur-sm animate-pulse"
                        style={{ background: `linear-gradient(135deg, ${rarity.glowColor}, transparent, ${rarity.glowColor})`, opacity: hovered ? 1 : 0.5, transition: 'opacity 0.3s' }}
                    />

                    {/* Card body */}
                    <div
                        className={`relative w-full h-full rounded-[16px] overflow-hidden bg-[#0a0a0f] border-2`}
                        style={{ borderColor: 'transparent', background: `linear-gradient(#0a0a0f, #0a0a0f) padding-box, linear-gradient(135deg, var(--tw-gradient-stops)) border-box` }}
                    >
                        {/* Gradient border effect */}
                        <div className={`absolute inset-0 rounded-[16px] bg-gradient-to-br ${rarity.borderColor} opacity-40 pointer-events-none`} style={{ padding: 2 }}>
                            <div className="w-full h-full rounded-[14px] bg-[#0a0a0f]" />
                        </div>

                        {/* Holographic shimmer overlay */}
                        <div
                            className={`absolute inset-0 rounded-[16px] bg-gradient-to-br ${rarity.holoBg} pointer-events-none z-10 transition-opacity duration-300`}
                            style={{ opacity: hovered ? 0.6 : 0.2 }}
                        />
                        {hovered && (
                            <div
                                className="absolute inset-0 rounded-[16px] pointer-events-none z-20"
                                style={{
                                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
                                    backgroundSize: '200% 200%',
                                    animation: 'shimmer 1.5s infinite linear',
                                }}
                            />
                        )}

                        {/* Inner content */}
                        <div className="relative z-30 flex flex-col h-full p-[6px]">
                            {/* Top header */}
                            <div className="flex items-center justify-between px-1 mb-1">
                                <span className={`text-[7px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-full border ${rarity.badgeColor}`}>
                                    {rarity.label} {rarity.stars}
                                </span>
                                <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${type.color}`}>
                                    {type.label}
                                </span>
                            </div>

                            {/* Image */}
                            <div className="flex-1 relative rounded-[10px] overflow-hidden mx-0.5" style={{ minHeight: 0 }}>
                                <img
                                    src={card.image}
                                    alt={card.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                {/* Image gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-60" />
                                {/* DJ Mag rank badge */}
                                <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-1.5 py-0.5">
                                    <span className="text-[7px] font-black text-white/80 uppercase tracking-wider">#{card.djmag_rank}</span>
                                </div>
                            </div>

                            {/* Bottom info */}
                            <div className="mt-1.5 px-1 pb-0.5">
                                <h3 className="text-white font-black uppercase italic leading-tight truncate" style={{ fontSize: Math.max(8, 11 * scale) }}>
                                    {card.name}
                                </h3>
                                <p className="text-gray-400 font-bold uppercase tracking-wider truncate" style={{ fontSize: Math.max(6, 8 * scale) }}>
                                    {card.city} · {card.country}
                                </p>
                                {showDate && card.collectedAt && (
                                    <p className="text-gray-600 font-bold uppercase tracking-wider mt-0.5" style={{ fontSize: 6 * scale }}>
                                        {new Date(card.collectedAt).toLocaleDateString('fr-FR')}
                                    </p>
                                )}
                                {/* Decorative line */}
                                <div className={`mt-1 h-[2px] rounded-full bg-gradient-to-r ${rarity.borderColor} opacity-50`} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* === BACK FACE === */}
                {flippable && (
                    <div
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        className="absolute inset-0"
                    >
                        <div className="w-full h-full rounded-[16px] bg-[#0a0a0f] border border-white/10 flex items-center justify-center overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-neon-red/10 via-transparent to-neon-cyan/10" />
                            <div className="relative z-10 flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full border-2 border-neon-red/40 flex items-center justify-center bg-neon-red/10">
                                    <span className="text-neon-red font-black text-xl">D</span>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">Dropsiders</span>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
