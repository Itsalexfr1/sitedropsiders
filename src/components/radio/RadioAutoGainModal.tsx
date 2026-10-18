import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, Sparkles, Volume2, Check, X, ShieldAlert, Zap, Radio } from 'lucide-react';
import type { RadioJingleBoostLevel } from '../../utils/radioSchedule';

interface RadioAutoGainModalProps {
    isOpen: boolean;
    onClose: () => void;
    autoGainEnabled: boolean;
    onToggleAutoGain: (enabled: boolean) => void;
    jingleBoost: RadioJingleBoostLevel;
    onChangeBoost: (boost: RadioJingleBoostLevel) => void;
    currentTrackTitle?: string;
    isCurrentTrackJingle?: boolean;
    activeGainDb?: number;
}

const BOOST_OPTIONS: {
    level: RadioJingleBoostLevel;
    label: string;
    badge: string;
    description: string;
    highlight?: boolean;
}[] = [
    {
        level: 4,
        label: 'Studio Radio',
        badge: '+4 dB (Recommandé)',
        description: 'Équilibre parfait : les jingles et voix ressortent clairement au-dessus des plus gros morceaux électro.',
        highlight: true,
    },
    {
        level: 6,
        label: 'Club Impact',
        badge: '+6 dB (Puissant)',
        description: 'Boost maximal pour environnements bruyants : voix et jingles ultra-percutants au premier plan.',
    },
    {
        level: 2,
        label: 'Modéré',
        badge: '+2 dB (Doux)',
        description: 'Léger nivellement pour une transition douce sans altérer la dynamique naturelle.',
    },
    {
        level: 0,
        label: 'Désactivé',
        badge: '0 dB (Brut)',
        description: 'Aucune correction de niveau : volumes sources d\'origine sans traitement.',
    },
];

export const RadioAutoGainModal: React.FC<RadioAutoGainModalProps> = ({
    isOpen,
    onClose,
    autoGainEnabled,
    onToggleAutoGain,
    jingleBoost,
    onChangeBoost,
    currentTrackTitle,
    isCurrentTrackJingle,
    activeGainDb = 0,
}) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100050] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#10101c] via-[#090913] to-[#05050a] border border-white/10 shadow-[0_0_50px_rgba(0,255,255,0.15)] overflow-hidden p-6 text-white z-10"
                >
                    {/* Glow décoratif */}
                    <div className="absolute top-0 right-1/4 w-48 h-32 bg-neon-cyan/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-32 bg-neon-purple/15 rounded-full blur-3xl pointer-events-none" />

                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-5 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/40 text-neon-cyan shadow-[0_0_15px_rgba(0,255,255,0.25)]">
                                <Sliders className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-display font-black uppercase italic tracking-tight text-white">
                                        Égalisation & Réglage Son
                                    </h3>
                                    <span className="px-2 py-0.5 rounded-full bg-neon-cyan/15 border border-neon-cyan/40 text-[9px] font-black uppercase text-neon-cyan">
                                        AUTO-GAIN
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 font-medium mt-0.5">
                                    Harmonisation automatique du volume des jingles et des sons
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                            title="Fermer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Explication concrète */}
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-gray-300 mb-5 relative z-10 leading-relaxed">
                        <p>
                            <span className="text-white font-bold">💡 Pourquoi cette fonction ?</span> Les morceaux électro (YouTube / SoundCloud) ont un mastering très fort (0 dB / loudness club). Les jingles voix et promos sont naturellement moins forts. Ce système ajuste le gain automatiquement en temps réel pour que les jingles soient toujours au premier plan, sans surprise sonore.
                        </p>
                    </div>

                    {/* Switcher principal Auto-Gain */}
                    <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 mb-5 relative z-10 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2.5 rounded-xl border transition-all ${
                                autoGainEnabled
                                    ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40 shadow-[0_0_12px_rgba(0,255,255,0.3)]'
                                    : 'bg-white/5 text-gray-500 border-white/10'
                            }`}>
                                <Zap className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-display font-black uppercase tracking-wide text-white">
                                        Normalisation Automatique
                                    </h4>
                                    {autoGainEnabled && (
                                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase">
                                            ACTIF
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-gray-400">
                                    Régule dynamiquement chaque morceau et booste les jingles à l'antenne
                                </p>
                            </div>
                        </div>

                        {/* Toggle button */}
                        <button
                            type="button"
                            onClick={() => onToggleAutoGain(!autoGainEnabled)}
                            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                autoGainEnabled ? 'bg-neon-cyan shadow-[0_0_15px_rgba(0,255,255,0.4)]' : 'bg-white/20'
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                                    autoGainEnabled ? 'translate-x-6' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>

                    {/* Monitoring en direct */}
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 mb-5 relative z-10">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                            <span className="flex items-center gap-1.5 text-neon-cyan">
                                <Radio className="w-3 h-3 animate-pulse" /> MONITEUR EN DIRECT
                            </span>
                            <span className="font-mono text-gray-300">
                                {isCurrentTrackJingle ? 'MODE JINGLE / PARLÉ' : 'MODE MUSIQUE ÉLECTRO'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-xs font-black text-white truncate">
                                    {currentTrackTitle || 'Dropsiders Radio Live'}
                                </p>
                                <p className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                                    {isCurrentTrackJingle ? (
                                        <span className="text-amber-400 font-bold flex items-center gap-1">
                                            🔔 Jingle / Promo détecté • Boost actif
                                        </span>
                                    ) : (
                                        <span className="text-blue-400 font-bold flex items-center gap-1">
                                            🎵 Musique • Loudness normalisé
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div className="shrink-0 text-right">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono font-black border ${
                                    isCurrentTrackJingle
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                        : 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40'
                                }`}>
                                    {autoGainEnabled ? (
                                        isCurrentTrackJingle ? `+${jingleBoost} dB` : '-3 dB (normalisé)'
                                    ) : '0 dB'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Options de niveau de Boost des Jingles */}
                    <div className="space-y-2 mb-6 relative z-10">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block px-1">
                            Niveau de présence & Boost des Jingles
                        </label>

                        <div className="grid grid-cols-1 gap-2">
                            {BOOST_OPTIONS.map(opt => {
                                const isSelected = autoGainEnabled && jingleBoost === opt.level;
                                return (
                                    <button
                                        key={opt.level}
                                        type="button"
                                        disabled={!autoGainEnabled}
                                        onClick={() => onChangeBoost(opt.level)}
                                        className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                            !autoGainEnabled
                                                ? 'opacity-40 cursor-not-allowed bg-white/[0.02] border-white/5 text-gray-500'
                                                : isSelected
                                                ? 'bg-neon-cyan/15 border-neon-cyan/60 text-white shadow-[0_0_20px_rgba(0,255,255,0.2)]'
                                                : 'bg-white/[0.03] border-white/10 hover:border-white/20 text-gray-300'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-display font-black uppercase italic tracking-wide text-white">
                                                    {opt.label}
                                                </span>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                                                    isSelected
                                                        ? 'bg-neon-cyan text-black border-neon-cyan'
                                                        : 'bg-white/5 text-gray-400 border-white/10'
                                                }`}>
                                                    {opt.badge}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">
                                                {opt.description}
                                            </p>
                                        </div>

                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition-all ${
                                            isSelected
                                                ? 'bg-neon-cyan border-neon-cyan text-black'
                                                : 'border-white/20 bg-transparent'
                                        }`}>
                                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 relative z-10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-2.5 px-4 rounded-xl bg-neon-cyan hover:bg-neon-cyan/90 text-black font-display font-black text-xs uppercase italic tracking-wider shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all cursor-pointer active:scale-95"
                        >
                            Appliquer & Fermer
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
