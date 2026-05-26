import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { DropsidersCard } from '../../context/UserContext';

interface DropsidersCardProps {
    card: DropsidersCard;
    /** If true, the card can be flipped on click */
    flippable?: boolean;
    /** If true, the card starts face-down (used for reveal animations) */
    startFaceDown?: boolean;
    /** Controlled flipped state — when provided, overrides internal state reactively */
    flipped?: boolean;
    /** Scale multiplier (default 1) */
    scale?: number;
    /** Show date collected */
    showDate?: boolean;
    onClick?: () => void;
}

// ─── MUSIC STYLE ENERGY BADGES (SVG) ─────────────────────────────────────────
function TechnoEnergy() {
    return (
        <div className="w-3.5 h-3.5 bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-950 rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]" title="Techno">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-current">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-10a2 2 0 1 0 2 2 2 2 0 0 0-2-2zm-5 2a5 5 0 0 1 5-5v1.5a3.5 3.5 0 0 0-3.5 3.5zm10 0a5 5 0 0 1-5 5v-1.5a3.5 3.5 0 0 0 3.5-3.5z" />
            </svg>
        </div>
    );
}

function HouseEnergy() {
    return (
        <div className="w-3.5 h-3.5 bg-gradient-to-br from-amber-400 to-orange-500 border border-orange-700 rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" title="House">
            <svg viewBox="0 0 24 24" className="w-2 h-2 text-white fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 22a10 10 0 0 1 20 0" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10H8a15.3 15.3 0 0 1 4-10z" />
                <path d="M6 12c0-3.3 2.7-6 6-6s6 2.7 6 6" />
            </svg>
        </div>
    );
}

function EdmEnergy() {
    return (
        <div className="w-3.5 h-3.5 bg-gradient-to-br from-fuchsia-500 to-pink-600 border border-pink-800 rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" title="EDM / Electro">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-current">
                <path d="M19 9h-6l3-7L5 13h6l-3 9z" />
            </svg>
        </div>
    );
}

function HardstyleEnergy() {
    return (
        <div className="w-3.5 h-3.5 bg-gradient-to-br from-lime-400 to-emerald-600 border border-emerald-800 rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" title="Hardstyle">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-slate-900 fill-current">
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z" />
            </svg>
        </div>
    );
}

function TranceEnergy() {
    return (
        <div className="w-3.5 h-3.5 bg-gradient-to-br from-indigo-500 to-purple-700 border border-purple-950 rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" title="Trance">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-current">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8.5a3.5 3.5 0 1 0 3.5 3.5A3.5 3.5 0 0 0 12 9z" />
            </svg>
        </div>
    );
}

function BassEnergy() {
    return (
        <div className="w-3.5 h-3.5 bg-gradient-to-br from-cyan-400 to-teal-600 border border-teal-800 rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" title="Bass Music">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-current">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm4-8a4 4 0 1 1-4-4 4 4 0 0 1 4 4zm-2.5 0A1.5 1.5 0 1 0 12 13.5 1.5 1.5 0 0 0 13.5 12z" />
            </svg>
        </div>
    );
}

function RetroEnergy() {
    return (
        <div className="w-3.5 h-3.5 bg-gradient-to-br from-[#d4af37] via-slate-100 to-[#aa7c11] border border-amber-800 rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]" title="Retro / Disco">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-amber-950 fill-current">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
        </div>
    );
}

function StarEnergy() {
    return (
        <div className="w-3.5 h-3.5 bg-gradient-to-br from-slate-200 to-slate-400 border border-slate-500 rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]" title="Colorless">
            <svg viewBox="0 0 24 24" className="w-2 h-2 text-slate-800 fill-current">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
        </div>
    );
}

function EnergyBadge({ type }: { type: string }) {
    if (type === 'techno') return <TechnoEnergy />;
    if (type === 'house') return <HouseEnergy />;
    if (type === 'edm') return <EdmEnergy />;
    if (type === 'hardstyle') return <HardstyleEnergy />;
    if (type === 'trance') return <TranceEnergy />;
    if (type === 'bass') return <BassEnergy />;
    if (type === 'retro') return <RetroEnergy />;
    return <StarEnergy />;
}

// ─── MUSIC STYLE PRESETS (THEMATIC COLOR SYSTEMS) ───────────────────────────
interface CardTheme {
    styleLabel: string;
    borderFrom: string;
    borderTo: string;
    outlineColor: string;
    bgGradient: string;
    textColor: string;
    subBarBg: string;
    subBarBorder: string;
    subBarText: string;
    energyType: 'techno' | 'house' | 'edm' | 'hardstyle' | 'trance' | 'bass' | 'retro' | 'star';
    weaknessType: string;
}

const THEME_PRESETS: Record<string, CardTheme> = {
    techno: {
        styleLabel: 'TECHNO',
        borderFrom: '#1e293b',
        borderTo: '#090d16',
        outlineColor: '#020617',
        bgGradient: 'from-[#cbd5e1] via-[#94a3b8] to-[#64748b]',
        textColor: 'text-[#0f172a]',
        subBarBg: 'from-[#cbd5e1] via-[#94a3b8] to-[#cbd5e1]',
        subBarBorder: '#475569',
        subBarText: 'text-[#0f172a]',
        energyType: 'techno',
        weaknessType: 'hardstyle'
    },
    house: {
        styleLabel: 'HOUSE',
        borderFrom: '#f97316',
        borderTo: '#c2410c',
        outlineColor: '#7c2d12',
        bgGradient: 'from-[#fef3c7] via-[#fde68a] to-[#fcd34d]',
        textColor: 'text-[#7c2d12]',
        subBarBg: 'from-[#fde68a] via-[#fcd34d] to-[#fde68a]',
        subBarBorder: '#f97316',
        subBarText: 'text-[#7c2d12]',
        energyType: 'house',
        weaknessType: 'techno'
    },
    edm: {
        styleLabel: 'EDM / ELECTRO',
        borderFrom: '#ec4899',
        borderTo: '#be185d',
        outlineColor: '#700d3c',
        bgGradient: 'from-[#fce7f3] via-[#fbcfe8] to-[#f9a8d4]',
        textColor: 'text-[#831843]',
        subBarBg: 'from-[#fbcfe8] via-[#f9a8d4] to-[#fbcfe8]',
        subBarBorder: '#ec4899',
        subBarText: 'text-[#831843]',
        energyType: 'edm',
        weaknessType: 'house'
    },
    hardstyle: {
        styleLabel: 'HARDSTYLE',
        borderFrom: '#84cc16',
        borderTo: '#4d7c0f',
        outlineColor: '#365314',
        bgGradient: 'from-[#f7fee7] via-[#ecfccb] to-[#d9f99d]',
        textColor: 'text-[#365314]',
        subBarBg: 'from-[#ecfccb] via-[#d9f99d] to-[#ecfccb]',
        subBarBorder: '#84cc16',
        subBarText: 'text-[#365314]',
        energyType: 'hardstyle',
        weaknessType: 'trance'
    },
    trance: {
        styleLabel: 'TRANCE',
        borderFrom: '#6366f1',
        borderTo: '#4338ca',
        outlineColor: '#1e1b4b',
        bgGradient: 'from-[#e0e7ff] via-[#c7d2fe] to-[#a5b4fc]',
        textColor: 'text-[#1e1b4b]',
        subBarBg: 'from-[#c7d2fe] via-[#a5b4fc] to-[#c7d2fe]',
        subBarBorder: '#6366f1',
        subBarText: 'text-[#1e1b4b]',
        energyType: 'trance',
        weaknessType: 'bass'
    },
    bass: {
        styleLabel: 'BASS MUSIC',
        borderFrom: '#06b6d4',
        borderTo: '#0369a1',
        outlineColor: '#075985',
        bgGradient: 'from-[#ecfeff] via-[#cffafe] to-[#a5f3fc]',
        textColor: 'text-[#0369a1]',
        subBarBg: 'from-[#cffafe] via-[#a5f3fc] to-[#cffafe]',
        subBarBorder: '#06b6d4',
        subBarText: 'text-[#0369a1]',
        energyType: 'bass',
        weaknessType: 'edm'
    },
    retro: {
        styleLabel: 'RETRO / DISCO',
        borderFrom: '#e2e8f0',
        borderTo: '#94a3b8',
        outlineColor: '#334155',
        bgGradient: 'from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]',
        textColor: 'text-[#334155]',
        subBarBg: 'from-[#f1f5f9] via-[#e2e8f0] to-[#f1f5f9]',
        subBarBorder: '#cbd5e1',
        subBarText: 'text-[#334155]',
        energyType: 'retro',
        weaknessType: 'techno'
    }
};

const getCardTheme = (card: DropsidersCard): CardTheme => {
    const name = card.name.toLowerCase();
    
    // Explicit overrides for popular names
    if (name.includes('tomorrowland') || name.includes('ultra') || name.includes('creamfields') || name.includes('edc') || name.includes('electric daisy') || name.includes('electro')) {
        return THEME_PRESETS.edm;
    }
    if (name.includes('berghain') || name.includes('awakenings') || name.includes('printworks') || name.includes('time warp') || name.includes('fabric') || name.includes('rex') || name.includes('techno')) {
        return THEME_PRESETS.techno;
    }
    if (name.includes('ibiza') || name.includes('hï') || name.includes('ushuaïa') || name.includes('beach') || name.includes('house') || name.includes('groove')) {
        return THEME_PRESETS.house;
    }
    if (name.includes('defqon') || name.includes('hardstyle') || name.includes('hardcore') || name.includes('decibel') || name.includes('kick')) {
        return THEME_PRESETS.hardstyle;
    }
    if (name.includes('trance') || name.includes('state of') || name.includes('asot') || name.includes('psy') || name.includes('cosmic') || name.includes('astral') || name.includes('dream')) {
        return THEME_PRESETS.trance;
    }
    if (name.includes('bass') || name.includes('dubstep') || name.includes('dnb') || name.includes('drum') || name.includes('sound') || name.includes('sub')) {
        return THEME_PRESETS.bass;
    }
    if (name.includes('retro') || name.includes('disco') || name.includes('vintage') || name.includes('classic') || name.includes('club')) {
        return THEME_PRESETS.retro;
    }

    // Fallback: Deterministic selection based on card ID/name hash
    let hash = 0;
    const key = card.id || card.name;
    for (let i = 0; i < key.length; i++) {
        hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const presets = Object.values(THEME_PRESETS);
    const index = Math.abs(hash) % presets.length;
    return presets[index];
};

// ─── ATTACKS CONFIGURATION ────────────────────────────────────────────────────
interface Attack {
    cost: string[];
    name: string;
    damage: string;
    text: string;
}

const getCardAttacks = (card: DropsidersCard, theme: CardTheme): Attack[] => {
    const attacks: Attack[] = [];
    const energy = theme.energyType;

    // First attack: basic music driver
    if (card.type === 'festival') {
        attacks.push({
            cost: ['star', 'star'],
            name: 'Main Stage Bass',
            damage: '40',
            text: "Projette des ondes de basses progressives survoltées, soulevant tout le public."
        });
    } else if (card.type === 'dj') {
        attacks.push({
            cost: ['star'],
            name: 'Drop Mix',
            damage: '30',
            text: 'Lance un drop explosif qui électrise instantanément la foule et chamboule le dancefloor.'
        });
    } else {
        attacks.push({
            cost: ['star'],
            name: 'Midnight Groove',
            damage: '20',
            text: 'Joue une boucle rythmique hypnotique qui force le public à danser en continu.'
        });
    }

    // Second attack: themed exactly around the musical style
    if (card.rarity === 'epic' || card.rarity === 'legendary') {
        const damageVal = card.rarity === 'legendary' ? '120' : '90';
        
        switch (energy) {
            case 'techno':
                attacks.push({
                    cost: ['techno', 'techno', 'star'],
                    name: 'Dark Warehouse',
                    damage: damageVal,
                    text: 'Sombre sous les infra-basses souterraines d\'un hangar obscur. Ignore toutes les résistances.'
                });
                break;
            case 'house':
                attacks.push({
                    cost: ['house', 'house', 'star'],
                    name: 'Sunset Piano',
                    damage: damageVal,
                    text: 'Joue un riff de piano de plage euphorique et ensoleillé. Soigne 30 PV de vos festivals.'
                });
                break;
            case 'edm':
                attacks.push({
                    cost: ['edm', 'edm', 'star'],
                    name: 'Laser Symphony',
                    damage: damageVal,
                    text: 'Déclenche un show visuel incandescent de 500 000 watts. Défaussez une énergie pour paralyser.'
                });
                break;
            case 'hardstyle':
                attacks.push({
                    cost: ['hardstyle', 'hardstyle', 'star'],
                    name: 'Melodic Climax',
                    damage: damageVal,
                    text: 'Délivre des kicks distordus à 150 BPM. Inflige double dégâts si l\'adversaire a moins de 50 PV.'
                });
                break;
            case 'trance':
                attacks.push({
                    cost: ['trance', 'trance', 'star'],
                    name: 'Psy-Vibration',
                    damage: damageVal,
                    text: 'Induit une transe psychédélique planante. L\'adversaire s\'inflige 30 dégâts à lui-même.'
                });
                break;
            case 'bass':
                attacks.push({
                    cost: ['bass', 'bass', 'star'],
                    name: 'Subwoofer Blast',
                    damage: damageVal,
                    text: 'Libère une onde infrabasse dévastatrice à pleine puissance, brisant le soundsystem adverse.'
                });
                break;
            case 'retro':
                attacks.push({
                    cost: ['retro', 'retro', 'star'],
                    name: 'Disco Inferno',
                    damage: damageVal,
                    text: 'Déclenche un hymne disco légendaire des années 70, embrasant immédiatement le dancefloor.'
                });
                break;
            default:
                attacks.push({
                    cost: ['star', 'star', 'star'],
                    name: 'Generic Banger',
                    damage: damageVal,
                    text: 'Joue une boucle rythmique efficace sans thématique spécifique.'
                });
        }
    }
    
    return attacks;
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function DropsidersCardComponent({ card, flippable = false, startFaceDown = false, flipped: controlledFlipped, scale = 1, showDate = false, onClick }: DropsidersCardProps) {
    const [flipped, setFlipped] = useState(controlledFlipped !== undefined ? controlledFlipped : startFaceDown);
    const [hovered, setHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Sync with controlled flipped prop when parent changes it
    useEffect(() => {
        if (controlledFlipped !== undefined) {
            setFlipped(controlledFlipped);
        }
    }, [controlledFlipped]);

    // Dynamic Level, HP, and Musical Genre Theme
    const level = 101 - card.djmag_rank;
    const hp = card.rarity === 'legendary' ? 150 : card.rarity === 'epic' ? 120 : card.rarity === 'rare' ? 90 : 70;
    const theme = getCardTheme(card);
    const attacks = getCardAttacks(card, theme);

    // Dynamic Holographic gradient
    const holoBg = card.rarity === 'legendary'
        ? 'linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(253,224,71,0.15) 50%, rgba(217,119,6,0.25) 100%)'
        : card.rarity === 'epic'
        ? 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(244,63,94,0.1) 50%, rgba(107,33,168,0.2) 100%)'
        : 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(52,211,153,0.05) 50%, rgba(37,99,235,0.15) 100%)';

    // 3D Motion dynamics
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springConfig = { stiffness: 180, damping: 15 };
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), springConfig);
    
    // Holographic sheen position
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
                rotateX: flipped ? 0 : rotateX,
                rotateY: flipped ? 0 : rotateY,
                transformStyle: 'preserve-3d',
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            whileTap={{ scale: 0.97 }}
            className="select-none relative"
        >
            <motion.div
                style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d', position: 'relative' }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
            >
                {/* ─────────────────────────────────────────────────────────────
                    FRONT FACE (RECTO)
                    ───────────────────────────────────────────────────────────── */}
                <div
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    className="absolute inset-0 z-10 w-full h-full p-[1px]"
                >
                    {/* Golden Pokémon Card frame */}
                    <div
                        className="relative w-full h-full rounded-[24px] overflow-hidden border-[11px] flex flex-col p-[5px] shadow-[0_15px_35px_rgba(0,0,0,0.8)] select-none"
                        style={{
                            borderColor: theme.borderFrom,
                            background: `linear-gradient(135deg, ${theme.borderFrom}, ${theme.borderTo})`,
                            outline: `1px solid ${theme.outlineColor}`,
                            outlineOffset: '-11px',
                        }}
                    >
                        {/* Inner light hairline border */}
                        <div className="absolute inset-[1px] border border-white/30 rounded-[11px] pointer-events-none z-30" />

                        {/* Parchment background body */}
                        <div className={`w-full h-full rounded-[10px] bg-gradient-to-br ${theme.bgGradient} flex flex-col p-2.5 relative overflow-hidden z-10 shadow-[inset_0_0_15px_rgba(0,0,0,0.15)]`}>
                            
                            {/* Subtle scanline overlay for retro print feel */}
                            <div className="absolute inset-0 bg-[radial-gradient(#151525_0.8px,transparent_0.8px)] [background-size:8px_8px] opacity-5 pointer-events-none" />

                            {/* Holographic Overlays for rare/epic/legendary cards */}
                            {card.rarity !== 'common' && (
                                <motion.div
                                    className="absolute inset-0 pointer-events-none z-20 mix-blend-color-dodge transition-opacity duration-300"
                                    style={{
                                        opacity: hovered ? 0.8 : 0.3,
                                        background: holoBg,
                                        backgroundPosition: `${shineX.get()} ${shineY.get()}`,
                                    }}
                                />
                            )}

                            {/* Metallic Shine Reflection Line on hover */}
                            <div
                                className="absolute inset-0 z-30 pointer-events-none transition-all duration-800 ease-out"
                                style={{
                                    background: 'linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
                                    backgroundSize: '200% 200%',
                                    transform: hovered ? 'translateX(100%)' : 'translateX(-100%)',
                                }}
                            />

                            {/* Card Content Layout */}
                            <div className="relative z-40 flex flex-col h-full justify-between">
                                
                                {/* 1. HEADER PANEL */}
                                <div className="flex items-end justify-between border-b border-[#a8905a]/50 pb-0.5">
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-[5px] font-black uppercase tracking-tighter slanted opacity-85 ${theme.textColor}`}>
                                            {theme.styleLabel}
                                        </span>
                                        <h3 
                                            className={`font-serif font-black uppercase italic tracking-tight leading-none ${theme.textColor}`}
                                            style={{ fontSize: Math.max(9, 13 * scale) }}
                                        >
                                            {card.name}
                                        </h3>
                                        <span className={`font-sans font-bold tracking-tighter opacity-70 ${theme.textColor}`} style={{ fontSize: Math.max(6, 8 * scale) }}>
                                            LV.{level}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-serif font-black text-red-600 leading-none tracking-tighter" style={{ fontSize: Math.max(8, 12 * scale) }}>
                                            HP <span className={`font-sans font-extrabold ${theme.textColor}`} style={{ fontSize: Math.max(9, 13 * scale) }}>{hp}</span>
                                        </span>
                                        <EnergyBadge type={theme.energyType} />
                                    </div>
                                </div>

                                {/* 2. DJ IMAGE BOX */}
                                <div className="relative w-full mt-1.5 rounded-[5px] overflow-hidden border-[3px] border-double border-[#bfab76] bg-black shadow-[2px_2px_5px_rgba(0,0,0,0.15)] flex-grow" style={{ minHeight: 0, maxHeight: '65%' }}>
                                    <img
                                        src={card.image}
                                        alt={card.name}
                                        className="w-full h-full object-cover scale-100 group-hover:scale-102 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                                </div>

                                {/* 3. SUB-STAT BAR */}
                                <div 
                                    className="w-[96%] mx-auto bg-gradient-to-r border-b shadow-sm py-0.5 text-center mt-1 select-none"
                                    style={{
                                        borderImage: `linear-gradient(to right, transparent, ${theme.subBarBorder}, transparent) 1`,
                                        background: `linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)`,
                                    }}
                                >
                                    <p className={`font-serif italic font-bold tracking-tight uppercase ${theme.subBarText}`} style={{ fontSize: Math.max(5, 7 * scale) }}>
                                        N° {card.djmag_rank.toString().padStart(3, '0')} · {card.type === 'festival' ? 'Festival' : card.type === 'dj' ? 'DJ' : 'Club'} · {card.city}, {card.country}
                                    </p>
                                </div>

                                {/* 4. ATTACKS / DESCRIPTION SECTION */}
                                <div className="flex-grow flex flex-col justify-center mt-2.5 space-y-2.5">
                                    {attacks.map((att, idx) => (
                                        <div key={idx} className="flex flex-col">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    <div className="flex gap-0.5 select-none">
                                                        {att.cost.map((c, i) => <EnergyBadge key={i} type={c === 'star' ? 'star' : theme.energyType} />)}
                                                    </div>
                                                    <h4 className={`font-sans font-black tracking-tight ml-1 leading-none uppercase ${theme.textColor}`} style={{ fontSize: Math.max(7, 10 * scale) }}>
                                                        {att.name}
                                                    </h4>
                                                </div>
                                                <span className={`font-sans font-black leading-none ${theme.textColor}`} style={{ fontSize: Math.max(8, 11 * scale) }}>
                                                    {att.damage}
                                                </span>
                                            </div>
                                            <p className="text-slate-700 font-medium leading-tight mt-0.5 pl-1.5" style={{ fontSize: Math.max(6, 8 * scale) }}>
                                                {att.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* 5. FLAVOR TEXT / TOP 3 TRACKS */}
                                <div className="mt-auto border-t border-[#c2b085]/60 pt-1 px-1 flex flex-col items-center w-full">
                                    {card.type === 'dj' ? (
                                        <div className="w-full px-1">
                                            <p className={`font-serif italic font-bold text-center leading-normal ${theme.textColor}`} style={{ fontSize: Math.max(5, 7 * scale) }}>
                                                Top 3 des titres les plus écoutés :
                                            </p>
                                            <div className="font-sans font-medium text-slate-600 text-center leading-tight mt-0.5" style={{ fontSize: Math.max(4.5, 6 * scale) }}>
                                                <p>1. {card.top_tracks?.[0] || 'Titre Inconnu 1'}</p>
                                                <p>2. {card.top_tracks?.[1] || 'Titre Inconnu 2'}</p>
                                                <p>3. {card.top_tracks?.[2] || 'Titre Inconnu 3'}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full px-1 flex flex-col items-center gap-0.5">
                                            <p className="font-serif italic text-slate-500 text-center leading-normal" style={{ fontSize: Math.max(5, 7.5 * scale) }}>
                                                "Ce temple légendaire de la culture électronique rassemble des milliers d'adeptes sous les vibrations du soundsystem Dropsiders."
                                            </p>
                                            {card.attendees_label && (
                                                <p className={`font-sans font-black text-center leading-tight mt-0.5 ${theme.textColor}`} style={{ fontSize: Math.max(4.5, 6.5 * scale) }}>
                                                    🎟 {card.attendees_label}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* 6. CARD FOOTER INFO */}
                                <div className={`border-t border-[#9e8853]/40 mt-1.5 pt-1 flex justify-between items-center font-sans font-black select-none ${theme.textColor}`} style={{ fontSize: Math.max(5, 6.5 * scale) }}>
                                    <div className="flex gap-3">
                                        <div className="flex items-center gap-1">
                                            <span className="opacity-80">weakness</span>
                                            <EnergyBadge type={theme.weaknessType} />
                                            <span className="ml-0.5">x2</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="opacity-80">resistance</span>
                                            <StarEnergy />
                                            <span className="ml-0.5">-30</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="opacity-80">retreat cost</span>
                                        <div className="flex gap-0.5">
                                            <StarEnergy />
                                        </div>
                                    </div>
                                </div>

                                {/* Copyright info block */}
                                <div className="flex justify-between items-center mt-1 text-slate-400 font-sans font-semibold select-none" style={{ fontSize: Math.max(4, 5.5 * scale) }}>
                                    <span>Illus. AI Dropsiders</span>
                                    <span>©2026 Dropsiders Card System</span>
                                    <span>{card.djmag_rank}/100 ★</span>
                                </div>

                                {showDate && card.collectedAt && (
                                    <p className="text-slate-500 font-bold uppercase tracking-wider mt-0.5 text-center" style={{ fontSize: 5.5 * scale }}>
                                        Obtenue le {new Date(card.collectedAt).toLocaleDateString('fr-FR')}
                                    </p>
                                )}

                            </div>
                        </div>

                    </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    BACK FACE (VERSO) - STYLISH DROPSIDERS DESIGN
                    ───────────────────────────────────────────────────────────── */}
                <div
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    className="absolute inset-0 w-full h-full p-[1px]"
                >
                    {/* Dark Premium Frame */}
                    <div 
                        className="w-full h-full rounded-[24px] overflow-hidden border-[11px] border-[#07070a] bg-[#07070a] flex flex-col p-[4px] shadow-[0_15px_40px_rgba(0,0,0,0.9)] relative"
                        style={{
                            outline: '1px solid rgba(255,255,255,0.1)',
                            outlineOffset: '-11px',
                            boxShadow: 'inset 0 0 20px rgba(34,211,238,0.15)'
                        }}
                    >
                        {/* Main canvas interior */}
                        <div className="w-full h-full rounded-[12px] bg-[#030305] overflow-hidden relative flex flex-col items-center justify-center border border-white/10 shadow-[inset_0_0_30px_rgba(0,0,0,1)]">
                            
                            {/* Background Ambient Glow */}
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.15)_0%,rgba(34,211,238,0.1)_50%,transparent_100%)] opacity-80" />
                            
                            {/* Futuristic Hex Grid Pattern */}
                            <div 
                                className="absolute inset-0 opacity-[0.03]"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l20 10v20L20 40 0 30V10z' fill-rule='evenodd' stroke='%23ffffff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
                                    backgroundSize: '30px 30px',
                                }}
                            />

                            {/* Diagonal Neon Accents */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
                                <div className="absolute top-1/4 left-[-20%] w-[140%] h-[1px] rotate-[-35deg] bg-gradient-to-r from-transparent via-neon-cyan to-transparent shadow-[0_0_10px_rgba(34,211,238,1)]" />
                                <div className="absolute top-3/4 left-[-20%] w-[140%] h-[1px] rotate-[-35deg] bg-gradient-to-r from-transparent via-neon-purple to-transparent shadow-[0_0_10px_rgba(168,85,247,1)]" />
                            </div>

                            {/* Central Dropsiders Emblem */}
                            <div className="relative z-10 flex flex-col items-center mt-[-10px]">
                                {/* Glowing backdrop for logo */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-neon-cyan/20 blur-2xl rounded-full" />
                                
                                <img src="/Logo.png" alt="Dropsiders" className="w-16 h-auto drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] relative z-20" />

                                {/* Title */}
                                <div className="mt-8 text-center flex flex-col items-center">
                                    <h2 className="text-xl font-black uppercase tracking-[0.25em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] leading-none">
                                        DROPSIDERS
                                    </h2>
                                    <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent mt-2 mb-1" />
                                    <p className="text-[6px] font-bold uppercase tracking-[0.4em] text-white/50">
                                        Exclusive Collection
                                    </p>
                                </div>
                            </div>

                            {/* Tech Borders */}
                            <div className="absolute top-4 left-4 w-6 h-6 border-t-[1.5px] border-l-[1.5px] border-neon-cyan/40" />
                            <div className="absolute top-4 right-4 w-6 h-6 border-t-[1.5px] border-r-[1.5px] border-neon-purple/40" />
                            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-[1.5px] border-l-[1.5px] border-neon-red/40" />
                            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-[1.5px] border-r-[1.5px] border-neon-cyan/40" />
                        </div>
                    </div>
                </div>

            </motion.div>
        </motion.div>
    );
}
