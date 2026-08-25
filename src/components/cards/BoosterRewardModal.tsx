import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Gift } from 'lucide-react';
import type { DropsidersCard } from '../../context/UserContext';
import { useUser } from '../../context/UserContext';
import { DropsidersCardComponent } from './DropsidersCard';
import confetti from 'canvas-confetti';

interface BoosterRewardModalProps {
    booster: DropsidersCard[] | null;
    onClaim: () => void;
    onDismiss: () => void;
}

const RARITY_COLORS = {
    legendary: '#f59e0b',
    epic: '#a855f7',
    rare: '#06b6d4',
    common: '#94a3b8'
};

export function BoosterRewardModal({ booster, onClaim, onDismiss }: BoosterRewardModalProps) {
    const { isLoggedIn, setIsAuthModalOpen } = useUser();
    const [isOpen, setIsOpen] = useState(false); // Booster pack opened state
    const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
    const [claimed, setClaimed] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Reset when booster changes
    useEffect(() => {
        if (booster) {
            setIsOpen(false);
            setRevealedIndices(new Set());
            setClaimed(false);
        }
    }, [booster]);

    const handleOpenPack = () => {
        setIsOpen(true);
        // Premium audio feedback simulation & confetti explosion
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.5 },
            colors: ['#ff0033', '#00ffff', '#ffffff', '#fbbf24']
        });

        // Cascading reveal
        if (booster) {
            booster.forEach((_, idx) => {
                setTimeout(() => {
                    setRevealedIndices(prev => new Set([...prev, idx]));
                }, 400 + idx * 250);
            });
        }
    };

    const handleClaimAll = () => {
        setClaimed(true);
        confetti({
            particleCount: 100,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#00f0ff', '#ff0033', '#ffffff']
        });
        setTimeout(() => {
            onClaim();
        }, 500);
    };

    if (!booster) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[9998] flex items-center justify-center p-4 overflow-y-auto bg-black/20 backdrop-blur-xl"
            >
                {/* Dismiss X button */}
                <button
                    onClick={onDismiss}
                    className="absolute top-6 right-6 p-2 text-white/20 hover:text-white/60 transition-colors z-[10000]"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Main Wrapper */}
                <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center py-8 min-h-screen">
                    <AnimatePresence mode="wait">
                        {!isOpen ? (
                            /* ================= 1. METALLIC SHINY BOOSTER PACK WRAPPER ================= */
                            <motion.div
                                key="booster-pack"
                                initial={{ scale: 0.8, y: 50, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.8, y: -100, opacity: 0 }}
                                transition={{ type: 'spring', damping: 15 }}
                                className="relative cursor-pointer group"
                                onClick={handleOpenPack}
                            >
                                {/* Cosmic background aura */}
                                <div className="absolute -inset-10 bg-gradient-to-tr from-neon-red/20 via-neon-purple/20 to-neon-cyan/20 rounded-full blur-[60px] group-hover:scale-110 transition-transform duration-700 pointer-events-none" />

                                {/* Glowing border pulse */}
                                <div className="absolute -inset-1.5 rounded-[2.5rem] bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan opacity-40 group-hover:opacity-100 blur-[8px] transition-opacity duration-500 animate-pulse" />

                                {/* Pack body */}
                                <div className="relative w-[300px] h-[450px] rounded-[2.2rem] bg-zinc-950 border border-white/10 overflow-hidden flex flex-col items-center justify-between p-6 shadow-2xl">
                                    {/* Metallic Foil Texture Lines */}
                                    <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                                    <div className="absolute inset-x-0 top-0 h-[20%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                                    
                                    {/* Decorative Serrated Top/Bottom edges (classic booster pack) */}
                                    <div className="absolute top-0 inset-x-0 h-4 flex overflow-hidden pointer-events-none opacity-50">
                                        {Array.from({ length: 30 }).map((_, i) => (
                                            <div key={i} className="w-3 h-3 bg-white/20 rotate-45 transform -translate-y-1.5 mx-[1px]" />
                                        ))}
                                    </div>
                                    <div className="absolute bottom-0 inset-x-0 h-4 flex overflow-hidden pointer-events-none opacity-50">
                                        {Array.from({ length: 30 }).map((_, i) => (
                                            <div key={i} className="w-3 h-3 bg-white/20 rotate-45 transform translate-y-1.5 mx-[1px]" />
                                        ))}
                                    </div>

                                    {/* Logo / Header */}
                                    <div className="flex flex-col items-center text-center mt-6 z-10">
                                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full mb-4">
                                            <Gift className="w-3.5 h-3.5 text-neon-cyan animate-bounce" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-neon-cyan">
                                                Booster Pack
                                            </span>
                                        </div>
                                        <h2 className="text-3xl font-display font-black text-white italic tracking-tighter uppercase leading-none">
                                            DROPSIDERS <br />
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan">
                                                COLLECTION
                                            </span>
                                        </h2>
                                    </div>

                                    {/* Epic Center artwork */}
                                    <div className="relative w-40 h-40 flex items-center justify-center z-10">
                                        {/* Rotating shiny halo */}
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                            className="absolute inset-0 rounded-full border-2 border-dashed border-white/5 bg-gradient-to-tr from-neon-cyan/10 to-neon-red/10 blur-[5px]"
                                        />
                                        <div className="w-24 h-24 bg-gradient-to-r from-neon-red to-neon-cyan rounded-3xl flex items-center justify-center shadow-lg relative group-hover:scale-110 transition-transform duration-500">
                                            <span className="text-white font-serif font-black text-4xl italic tracking-tighter">V2</span>
                                            {/* Sparkles */}
                                            <Sparkles className="absolute top-2 right-2 w-4 h-4 text-yellow-300 animate-pulse" />
                                            <Sparkles className="absolute bottom-2 left-2 w-4 h-4 text-neon-cyan animate-pulse [animation-delay:0.7s]" />
                                        </div>
                                    </div>

                                    {/* Bottom labels */}
                                    <div className="flex flex-col items-center text-center mb-6 z-10">
                                        <p className="text-white font-black text-xs uppercase tracking-[0.3em] group-hover:text-neon-cyan transition-colors">
                                            CLIQUEZ POUR OUVRIR
                                        </p>
                                        <p className="text-gray-500 text-[8px] font-bold uppercase tracking-widest mt-1">
                                            Contient 9 cartes aléatoires · Doubles acceptés
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            /* ================= 2. THE REVEAL GRID (9 CARDS) ================= */
                            <motion.div
                                key="revealed-grid"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="w-full flex flex-col items-center gap-8"
                            >
                                {/* Header */}
                                <div className="text-center space-y-3">
                                    <div className="flex items-center justify-center gap-2">
                                        <Sparkles className="w-4 h-4 text-neon-cyan" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neon-cyan">
                                            BOOSTER DROPSIDERS V2 OUVERT !
                                        </span>
                                        <Sparkles className="w-4 h-4 text-neon-cyan" />
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-black uppercase italic text-white tracking-tight">
                                        DÉCOUVREZ VOS 9 CARTES
                                    </h2>
                                    {/* Detailed reminder */}
                                    <div className="inline-flex flex-col items-center gap-1.5 bg-white/5 border border-neon-cyan/20 rounded-2xl px-6 py-3 mx-auto">
                                        <p className="text-neon-cyan text-[8.5px] font-black uppercase tracking-[0.3em] animate-pulse">
                                            🎴 Reviens régulièrement !
                                        </p>
                                        <p className="text-gray-400 text-[8px] font-bold leading-relaxed">
                                            Nouvelles cartes toutes les <span className="text-white font-black">5 minutes</span> · Doubles acceptés comme en vrai !
                                        </p>
                                        <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                                            {['⭐ Voter DJ', '🏟 Voter Festival', '🏠 Voter Club', '👤 Créer un compte'].map(action => (
                                                <span key={action} className="text-[7px] font-black uppercase tracking-wide bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-white/60">
                                                    {action}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-gray-600 text-[7px] font-bold">→ Chaque action débloque un nouveau booster de 9 cartes !</p>
                                    </div>
                                </div>

                                {/* 3x3 Cards Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-x-2 gap-y-8 w-full px-2 justify-center py-4">
                                    {booster.map((card, idx) => {
                                        const isRevealed = revealedIndices.has(idx);
                                        const cardRarityColor = RARITY_COLORS[card.rarity];
                                        
                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ scale: 0.5, opacity: 0, y: 30 }}
                                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.15, type: 'spring', stiffness: 80 }}
                                                className="relative flex flex-col items-center"
                                                onMouseEnter={() => setHoveredIndex(idx)}
                                                onMouseLeave={() => setHoveredIndex(null)}
                                            >
                                                {/* Sparkle background glow for high rarity cards */}
                                                {isRevealed && ['legendary', 'epic'].includes(card.rarity) && (
                                                    <motion.div
                                                        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                        className="absolute -inset-2 rounded-[18px] blur-md pointer-events-none -z-10"
                                                        style={{ background: `radial-gradient(circle, ${cardRarityColor}44 0%, transparent 70%)` }}
                                                    />
                                                )}

                                                {/* Scale & Hover dynamics wrapper */}
                                                <motion.div
                                                    animate={{ 
                                                        scale: hoveredIndex === idx ? 1.08 : 1,
                                                        z: hoveredIndex === idx ? 50 : 0
                                                    }}
                                                    className="relative cursor-pointer"
                                                >
                                                    <DropsidersCardComponent
                                                        card={card}
                                                        flippable={false}
                                                        flipped={!isRevealed}
                                                        scale={0.7}
                                                    />
                                                </motion.div>

                                                {/* Mini Rarity Badge below card */}
                                                <AnimatePresence>
                                                    {isRevealed && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.2 }}
                                                            className="mt-3 flex flex-col items-center"
                                                        >
                                                            <span 
                                                                className="text-[7.5px] font-black uppercase tracking-[0.25em] px-2 py-0.5 rounded bg-black/60 border border-white/5"
                                                                style={{ color: cardRarityColor, borderColor: `${cardRarityColor}22` }}
                                                            >
                                                                {card.rarity}
                                                            </span>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {/* Footer & Claim button */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 2.2 }}
                                    className="flex flex-col items-center gap-4 mt-6 max-w-sm w-full"
                                >
                                    {isLoggedIn ? (
                                        <motion.button
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={handleClaimAll}
                                            disabled={claimed}
                                            className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] text-black bg-gradient-to-r from-neon-cyan via-white to-neon-cyan shadow-[0_10px_30px_rgba(0,240,255,0.35)] transition-all disabled:opacity-50"
                                        >
                                            + Tout ajouter à ma collection
                                        </motion.button>
                                    ) : (
                                        <>
                                            <motion.button
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => {
                                                    handleClaimAll();
                                                    setIsAuthModalOpen(true);
                                                }}
                                                disabled={claimed}
                                                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 shadow-[0_10px_30px_rgba(245,158,11,0.35)] transition-all disabled:opacity-50"
                                            >
                                                ⚡ Sauvegarder & Créer un compte
                                            </motion.button>
                                            <button
                                                onClick={handleClaimAll}
                                                disabled={claimed}
                                                className="w-full py-3 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors border border-white/5 hover:bg-white/5 disabled:opacity-50"
                                            >
                                                Ajouter en invité (local)
                                            </button>
                                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-wider text-center max-w-[250px] mx-auto mt-0.5 leading-relaxed">
                                                Crée ton profil pour sauvegarder tes cartes en ligne de manière permanente !
                                            </p>
                                        </>
                                    )}
                                    
                                    <button
                                        onClick={onDismiss}
                                        className="py-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-gray-400 transition-colors"
                                    >
                                        Ignorer et fermer
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
