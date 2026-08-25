import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowLeftRight, Loader2, UserCheck } from 'lucide-react';
import { useUser, type DropsidersCard } from '../../context/UserContext';
import { DropsidersCardComponent } from './DropsidersCard';

interface CardTradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialOfferedCard?: DropsidersCard;
}

export function CardTradeModal({ isOpen, onClose, initialOfferedCard }: CardTradeModalProps) {
    const { user, collectedCards, createTradeOffer } = useUser();
    const [searchHandle, setSearchHandle] = useState('');
    const [searching, setSearching] = useState(false);
    const [targetUser, setTargetUser] = useState<{
        id: string;
        username: string;
        avatar: string | null;
        handle: string;
        collectedCards: DropsidersCard[];
    } | null>(null);
    const [searchError, setSearchError] = useState('');

    const [selectedOfferedCard, setSelectedOfferedCard] = useState<DropsidersCard | null>(initialOfferedCard || null);
    const [selectedWantedCard, setSelectedWantedCard] = useState<DropsidersCard | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Reset state on close
    const handleClose = () => {
        setSearchHandle('');
        setTargetUser(null);
        setSearchError('');
        setSelectedOfferedCard(initialOfferedCard || null);
        setSelectedWantedCard(null);
        onClose();
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchHandle.trim()) return;

        setSearching(true);
        setSearchError('');
        setTargetUser(null);
        setSelectedWantedCard(null);

        try {
            const cleanHandle = searchHandle.trim().replace(/^@/, '');
            const res = await fetch(`/api/users/by-handle?handle=${encodeURIComponent(cleanHandle)}`);
            const data = await res.json();

            if (res.ok) {
                if (data.handle === user?.handle) {
                    setSearchError('Vous ne pouvez pas faire d\'échange avec vous-même.');
                } else {
                    setTargetUser(data);
                }
            } else {
                setSearchError(data.error || 'Membre introuvable');
            }
        } catch (err) {
            console.error(err);
            setSearchError('Erreur de connexion au serveur.');
        } finally {
            setSearching(false);
        }
    };

    const handleSubmit = async () => {
        if (!targetUser || !selectedOfferedCard || !selectedWantedCard) return;

        setSubmitting(true);
        const res = await createTradeOffer(
            targetUser.handle,
            selectedOfferedCard.id,
            selectedWantedCard.id
        );

        setSubmitting(false);
        if (res.success) {
            handleClose();
        } else {
            alert(res.error || 'Erreur lors de la proposition d\'échange');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-2xl"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-5xl bg-zinc-950/90 border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 rounded-2xl text-neon-cyan">
                                <ArrowLeftRight className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-wider text-white">Proposer un Échange</h3>
                                <p className="text-xs text-white/50">Échangez vos cartes avec d'autres membres du site</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: Search & Select Member's Card */}
                        <div className="lg:col-span-7 flex flex-col border-r border-white/5 pr-0 lg:pr-8">
                            <h4 className="text-sm font-black uppercase tracking-wider text-neon-cyan mb-4">
                                1. Trouver un membre & choisir sa carte
                            </h4>

                            {/* Search Form */}
                            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                                <div className="relative flex-1">
                                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-white/40 font-bold text-sm">
                                        @
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="handle_du_membre"
                                        value={searchHandle}
                                        onChange={(e) => setSearchHandle(e.target.value.replace(/\s+/g, ''))}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-8 pr-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 transition-all font-medium"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={searching || !searchHandle.trim()}
                                    className="px-5 bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-2 transition-all"
                                >
                                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    Rechercher
                                </button>
                            </form>

                            {/* Error State */}
                            {searchError && (
                                <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-2xl text-red-400 text-sm font-semibold mb-6 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                    {searchError}
                                </div>
                            )}

                            {/* Target Member Profile & Cards */}
                            {targetUser ? (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl mb-6">
                                        {targetUser.avatar ? (
                                            <img
                                                src={targetUser.avatar}
                                                alt={targetUser.username}
                                                className="w-12 h-12 rounded-full border border-white/10"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-white/50 font-bold text-lg">
                                                {targetUser.username.substring(0, 1).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h5 className="font-black text-white">{targetUser.username}</h5>
                                                <span className="text-[10px] px-2 py-0.5 bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan rounded-full font-bold flex items-center gap-1">
                                                    <UserCheck className="w-2.5 h-2.5" /> Membre
                                                </span>
                                            </div>
                                            <p className="text-xs text-white/40">@{targetUser.handle}</p>
                                        </div>
                                    </div>

                                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                                        Collection de {targetUser.username} ({targetUser.collectedCards.length} cartes)
                                    </p>

                                    {targetUser.collectedCards.length === 0 ? (
                                        <div className="flex-1 flex items-center justify-center p-8 bg-white/5 border border-dashed border-white/10 rounded-2xl text-white/30 text-xs text-center">
                                            Ce membre ne possède aucune carte pour le moment.
                                        </div>
                                    ) : (
                                        <div className="max-h-[300px] overflow-y-auto pr-2 grid grid-cols-3 sm:grid-cols-4 gap-3 bg-black/40 border border-white/5 p-3 rounded-2xl">
                                            {targetUser.collectedCards.map((card) => {
                                                const isSelected = selectedWantedCard?.id === card.id;
                                                return (
                                                    <div
                                                        key={card.id}
                                                        onClick={() => setSelectedWantedCard(card)}
                                                        className={`relative cursor-pointer transition-all hover:scale-105 active:scale-95 border rounded-2xl overflow-hidden p-1 bg-zinc-900/60 ${
                                                            isSelected
                                                                ? 'border-neon-cyan shadow-[0_0_15px_rgba(34,211,238,0.3)] bg-neon-cyan/5'
                                                                : 'border-white/5 hover:border-white/20'
                                                        }`}
                                                    >
                                                        <div className="aspect-[3/4] relative rounded-xl overflow-hidden">
                                                            <img
                                                                src={card.image}
                                                                alt={card.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                                                                <div className="min-w-0">
                                                                    <p className="text-[8px] font-black text-white truncate uppercase tracking-wider">{card.name}</p>
                                                                    <p className="text-[6px] text-white/40 truncate">{card.rarity.toUpperCase()}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="absolute top-2 right-2 w-4 h-4 bg-neon-cyan text-black rounded-full flex items-center justify-center text-[10px] font-black">
                                                                ✓
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white/5 border border-dashed border-white/10 rounded-3xl text-center text-white/30">
                                    <Search className="w-8 h-8 mb-3 opacity-20" />
                                    <p className="text-xs font-medium">Recherchez un membre par son handle unique pour voir ses cartes et faire une proposition.</p>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: Select My Offered Card & Review Trade */}
                        <div className="lg:col-span-5 flex flex-col">
                            <h4 className="text-sm font-black uppercase tracking-wider text-neon-purple mb-4">
                                2. Choisir votre carte à offrir
                            </h4>

                            {collectedCards.length === 0 ? (
                                <div className="p-6 bg-white/5 border border-dashed border-white/10 rounded-2xl text-center text-white/30 text-xs mb-6">
                                    Vous n'avez pas encore de cartes à échanger.
                                </div>
                            ) : (
                                <div className="mb-6">
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                                        Vos cartes ({collectedCards.length})
                                    </p>
                                    <div className="max-h-[160px] overflow-y-auto pr-2 grid grid-cols-4 gap-2 bg-black/40 border border-white/5 p-3 rounded-2xl">
                                        {collectedCards.map((card) => {
                                            const isSelected = selectedOfferedCard?.id === card.id;
                                            return (
                                                <div
                                                    key={card.id}
                                                    onClick={() => setSelectedOfferedCard(card)}
                                                    className={`relative cursor-pointer transition-all hover:scale-105 active:scale-95 border rounded-xl overflow-hidden p-0.5 bg-zinc-900/60 ${
                                                        isSelected
                                                            ? 'border-neon-purple shadow-[0_0_10px_rgba(168,85,247,0.3)] bg-neon-purple/5'
                                                            : 'border-white/5 hover:border-white/20'
                                                    }`}
                                                >
                                                    <div className="aspect-[3/4] relative rounded-lg overflow-hidden">
                                                        <img
                                                            src={card.image}
                                                            alt={card.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                                                            <p className="text-[7px] font-black text-white truncate uppercase tracking-wider w-full">{card.name}</p>
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-neon-purple text-white rounded-full flex items-center justify-center text-[8px] font-black">
                                                            ✓
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Trade Preview Summary */}
                            <h4 className="text-sm font-black uppercase tracking-wider text-white mb-4">
                                Récapitulatif de l'échange
                            </h4>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-1 flex flex-col justify-between gap-4">
                                <div className="flex items-center justify-around gap-4 py-2">
                                    {/* Offered Card */}
                                    <div className="text-center flex-1 flex flex-col items-center">
                                        <p className="text-[9px] font-black uppercase text-neon-purple tracking-widest mb-2">Vous offrez</p>
                                        {selectedOfferedCard ? (
                                            <div className="w-24 border border-white/10 rounded-xl overflow-hidden bg-zinc-900 p-1 shadow-lg">
                                                <div className="aspect-[3/4] rounded-lg overflow-hidden relative">
                                                    <img src={selectedOfferedCard.image} alt={selectedOfferedCard.name} className="w-full h-full object-cover" />
                                                </div>
                                                <p className="text-[8px] font-black text-white truncate mt-1 uppercase tracking-wider">{selectedOfferedCard.name}</p>
                                            </div>
                                        ) : (
                                            <div className="w-24 aspect-[3/4] border border-dashed border-white/10 rounded-xl flex items-center justify-center text-[10px] text-white/20 text-center px-2 bg-black/40">
                                                Sélectionnez une carte
                                            </div>
                                        )}
                                    </div>

                                    {/* Arrow */}
                                    <div className="p-3 bg-white/5 border border-white/10 rounded-full text-white/50">
                                        <ArrowLeftRight className="w-5 h-5 animate-pulse text-neon-cyan" />
                                    </div>

                                    {/* Wanted Card */}
                                    <div className="text-center flex-1 flex flex-col items-center">
                                        <p className="text-[9px] font-black uppercase text-neon-cyan tracking-widest mb-2">Vous demandez</p>
                                        {selectedWantedCard ? (
                                            <div className="w-24 border border-white/10 rounded-xl overflow-hidden bg-zinc-900 p-1 shadow-lg">
                                                <div className="aspect-[3/4] rounded-lg overflow-hidden relative">
                                                    <img src={selectedWantedCard.image} alt={selectedWantedCard.name} className="w-full h-full object-cover" />
                                                </div>
                                                <p className="text-[8px] font-black text-white truncate mt-1 uppercase tracking-wider">{selectedWantedCard.name}</p>
                                            </div>
                                        ) : (
                                            <div className="w-24 aspect-[3/4] border border-dashed border-white/10 rounded-xl flex items-center justify-center text-[10px] text-white/20 text-center px-2 bg-black/40">
                                                Sélectionnez une carte
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !targetUser || !selectedOfferedCard || !selectedWantedCard}
                                    className="w-full py-3.5 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-red hover:opacity-90 disabled:opacity-40 text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Proposition en cours...
                                        </>
                                    ) : (
                                        <>Proposer l'échange</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
