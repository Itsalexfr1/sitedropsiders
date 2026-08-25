import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import type { DropsidersCard } from '../../context/UserContext';
import { useUser } from '../../context/UserContext';
import { DropsidersCardComponent } from './DropsidersCard';

interface CardRewardModalProps {
    card: DropsidersCard | null;
    onClaim: () => void;
    onDismiss: () => void;
}

// Floating particle
interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    delay: number;
    duration: number;
    tx: number;
    ty: number;
}

const RARITY_COLORS = {
    legendary: { glow: '#f59e0b', text: 'text-amber-300', bg: 'from-amber-500/20 to-yellow-500/10', title: 'LÉGENDAIRE !' },
    epic: { glow: '#a855f7', text: 'text-purple-300', bg: 'from-purple-500/20 to-fuchsia-500/10', title: 'ÉPIQUE !' },
    rare: { glow: '#06b6d4', text: 'text-cyan-300', bg: 'from-cyan-500/20 to-blue-500/10', title: 'RARE !' },
    common: { glow: '#94a3b8', text: 'text-slate-300', bg: 'from-slate-500/20 to-gray-500/10', title: 'NOUVELLE CARTE !' },
};

function generateParticles(count: number, rarity: DropsidersCard['rarity']): Particle[] {
    const colors = {
        legendary: ['#f59e0b', '#fbbf24', '#fde68a', '#fff'],
        epic: ['#a855f7', '#c084fc', '#e879f9', '#fff'],
        rare: ['#06b6d4', '#67e8f9', '#38bdf8', '#fff'],
        common: ['#94a3b8', '#cbd5e1', '#e2e8f0', '#fff'],
    }[rarity];

    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: 30 + Math.random() * 40,
        y: 20 + Math.random() * 60,
        size: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 1.5,
        duration: 1.5 + Math.random() * 2,
        tx: (Math.random() - 0.5) * 200,
        ty: -(50 + Math.random() * 150),
    }));
}

export function CardRewardModal({ card, onClaim, onDismiss }: CardRewardModalProps) {
    const { isLoggedIn, setIsAuthModalOpen } = useUser();
    const [revealed, setRevealed] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [claimed, setClaimed] = useState(false);

    const rarity = card ? RARITY_COLORS[card.rarity] : RARITY_COLORS.common;

    // Reset state whenever a new card arrives
    useEffect(() => {
        if (card) {
            setRevealed(false);
            setClaimed(false);
            setParticles([]);
            // Auto-reveal after a short delay
            const t = setTimeout(() => {
                setRevealed(true);
                setParticles(generateParticles(20, card.rarity));
            }, 600);
            return () => clearTimeout(t);
        }
    }, [card?.id]);

    const handleClaim = () => {
        setClaimed(true);
        setTimeout(() => {
            onClaim();
        }, 500);
    };

    return (
        <AnimatePresence>
            {card && (
                <motion.div
                    key="overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/20 backdrop-blur-xl"
                >
                    {/* Radial glow behind card */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `radial-gradient(ellipse 500px 400px at 50% 45%, ${rarity.glow}22 0%, transparent 70%)`,
                        }}
                    />

                    {/* Dismiss button */}
                    <button
                        onClick={onDismiss}
                        className="absolute top-6 right-6 p-2 text-white/20 hover:text-white/60 transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Particles */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <AnimatePresence>
                            {revealed && particles.map((p) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, x: `${p.x}%`, y: `${p.y}%`, scale: 0 }}
                                    animate={{ opacity: [0, 1, 1, 0], x: `calc(${p.x}% + ${p.tx}px)`, y: `calc(${p.y}% + ${p.ty}px)`, scale: [0, 1, 0.8, 0] }}
                                    transition={{ delay: p.delay, duration: p.duration, ease: 'easeOut' }}
                                    className="absolute rounded-full"
                                    style={{ width: p.size, height: p.size, background: p.color, boxShadow: `0 0 ${p.size * 2}px ${p.color}` }}
                                />
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Main content */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 40 }}
                        animate={{ scale: claimed ? 0.8 : 1, opacity: claimed ? 0 : 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="relative flex flex-col items-center gap-6 max-w-sm w-full"
                    >
                        {/* Header */}
                        <AnimatePresence>
                            {revealed && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center"
                                >
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Sparkles className={`w-4 h-4 ${rarity.text}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${rarity.text}`}>
                                            Nouvelle carte débloquée
                                        </span>
                                        <Sparkles className={`w-4 h-4 ${rarity.text}`} />
                                    </div>
                                    <h2 className={`text-2xl font-black uppercase italic tracking-tight text-white`}>
                                        {rarity.title}
                                    </h2>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Card (face-down → flip reveal) */}
                        <div className="relative">
                            {/* Glow pulse around card */}
                            {revealed && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute -inset-4 rounded-[28px] blur-xl pointer-events-none"
                                    style={{ background: `radial-gradient(ellipse, ${rarity.glow}55 0%, transparent 70%)` }}
                                />
                            )}

                            <DropsidersCardComponent
                                card={card}
                                flippable={false}
                                flipped={!revealed}
                                scale={1.4}
                            />

                            {/* "Tap to reveal" hint when not yet flipped */}
                            <AnimatePresence>
                                {!revealed && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.3em] text-white/30"
                                    >
                                        Chargement...
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Card info + buttons */}
                        <AnimatePresence>
                            {revealed && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="w-full flex flex-col items-center gap-3"
                                >
                                    {/* Card name */}
                                    <div className="text-center space-y-1">
                                        <p className="text-white font-black uppercase italic text-lg tracking-tight">{card.name}</p>
                                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{card.city} · {card.country}</p>
                                    </div>

                                    {/* Return reminder banner */}
                                    <div className="w-full rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5 px-4 py-3 flex flex-col items-center gap-1.5 text-center">
                                        <p className="text-neon-cyan text-[9px] font-black uppercase tracking-[0.25em] animate-pulse">
                                            🎴 Reviens régulièrement !
                                        </p>
                                        <p className="text-gray-400 text-[8px] font-bold leading-relaxed">
                                            De nouvelles cartes apparaissent toutes les <span className="text-white">5 minutes</span> sur le site.
                                        </p>
                                        <div className="flex flex-col gap-0.5 mt-0.5 w-full">
                                            <p className="text-gray-500 text-[7.5px] font-bold uppercase tracking-wider">Gagne un booster de 9 cartes en :</p>
                                            <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                                                {['⭐ Voter pour un DJ', '🏟 Voter pour un Festival', '🏠 Voter pour un Club', '👤 Créer un compte'].map(action => (
                                                    <span key={action} className="text-[7px] font-black uppercase tracking-wide bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-white/70">
                                                        {action}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex flex-col gap-2.5 w-full max-w-[250px]">
                                        {isLoggedIn ? (
                                            <motion.button
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={handleClaim}
                                                className="w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-black bg-gradient-to-r from-white to-gray-100 shadow-lg transition-all"
                                                style={{ boxShadow: `0 8px 30px ${rarity.glow}44` }}
                                            >
                                                + Ajouter à ma collection
                                            </motion.button>
                                        ) : (
                                            <>
                                                <motion.button
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={() => {
                                                        handleClaim();
                                                        setIsAuthModalOpen(true);
                                                    }}
                                                    className="w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 shadow-lg transition-all"
                                                    style={{ boxShadow: `0 8px 30px rgba(245,158,11,0.4)` }}
                                                >
                                                    ⚡ Créer un compte & Sauvegarder
                                                </motion.button>
                                                <button
                                                    onClick={handleClaim}
                                                    className="w-full py-2 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors border border-white/5 hover:bg-white/5"
                                                >
                                                    Continuer en invité (local)
                                                </button>
                                                <p className="text-[7.5px] text-gray-500 font-bold uppercase tracking-wider text-center max-w-[220px] mx-auto mt-0.5 leading-relaxed">
                                                    Crée ton profil pour sauvegarder tes cartes en ligne de manière permanente !
                                                </p>
                                            </>
                                        )}
                                        <button
                                            onClick={onDismiss}
                                            className="w-full py-2 rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] text-gray-600 hover:text-gray-400 transition-colors"
                                        >
                                            Ignorer
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
