import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeftRight, Plus, X, Search, RefreshCw,
    Sparkles, Trophy, Clock, Check, AlertCircle,
    ChevronRight, Star, Zap, Shield, Globe, Filter
} from 'lucide-react';
import { useUser, type DropsidersCard } from '../../context/UserContext';
import { DropsidersCardComponent } from '../cards/DropsidersCard';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface TradeOffer {
    id: string;
    fromUser: string;
    fromEmail: string;
    fromAvatar?: string;
    offeredCards: DropsidersCard[];
    wantedCards: DropsidersCard[]; // cards they want (by id)
    wantedCardNames: string[];     // display names of wanted cards
    message: string;
    status: 'open' | 'accepted' | 'rejected' | 'cancelled';
    createdAt: string;
    acceptedBy?: string;
    acceptedByEmail?: string;
}

// ─── Rarity colors ─────────────────────────────────────────────────────────────
const RARITY_COLORS = {
    legendary: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
    epic:      'text-purple-400 border-purple-400/30 bg-purple-400/10',
    rare:      'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
    common:    'text-slate-400 border-slate-400/30 bg-slate-400/10',
};

// ─── Card Thumbnail ─────────────────────────────────────────────────────────────
function CardThumb({ card, size = 'sm', selected = false, onClick }: { card: DropsidersCard; size?: 'sm' | 'md'; selected?: boolean; onClick?: () => void }) {
    const rarityColor = RARITY_COLORS[card.rarity] || RARITY_COLORS.common;
    const w = size === 'sm' ? 'w-16 h-24' : 'w-24 h-36';
    return (
        <div
            className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border-2 ${selected ? 'border-neon-cyan scale-105 shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'border-white/10 hover:border-white/30'} ${w}`}
            onClick={onClick}
        >
            <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-1">
                <p className="text-[6px] font-black uppercase text-white leading-tight line-clamp-1">{card.name}</p>
                <span className={`text-[5px] font-black uppercase tracking-widest px-1 py-0.5 rounded border ${rarityColor}`}>
                    {card.rarity}
                </span>
            </div>
            {selected && (
                <div className="absolute top-1 right-1 bg-neon-cyan text-black rounded-full w-4 h-4 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                </div>
            )}
        </div>
    );
}

// ─── Create Trade Modal ─────────────────────────────────────────────────────────
function CreateTradeModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (offer: Omit<TradeOffer, 'id' | 'status' | 'createdAt'>) => void }) {
    const { user, collectedCards } = useUser();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedOffer, setSelectedOffer] = useState<DropsidersCard[]>([]);
    const [wantedText, setWantedText] = useState('');
    const [message, setMessage] = useState('');

    // Unique cards user has
    const uniqueCards = useMemo(() => {
        const seen = new Set<string>();
        return (collectedCards || []).filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
    }, [collectedCards]);

    const toggleOffer = (card: DropsidersCard) => {
        setSelectedOffer(prev => prev.find(c => c.id === card.id)
            ? prev.filter(c => c.id !== card.id)
            : prev.length < 3 ? [...prev, card] : prev
        );
    };

    const handleSubmit = () => {
        if (!user || selectedOffer.length === 0) return;
        onSubmit({
            fromUser: user.username,
            fromEmail: user.email,
            fromAvatar: user.avatar,
            offeredCards: selectedOffer,
            wantedCards: [],
            wantedCardNames: wantedText.split(',').map(s => s.trim()).filter(Boolean),
            message,
        });
        setStep(1);
        setSelectedOffer([]);
        setWantedText('');
        setMessage('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    className="relative w-full max-w-lg bg-[#06060a] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.9)]"
                >
                    {/* Top gradient bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-red via-neon-cyan to-neon-purple" />

                    {/* Header */}
                    <div className="p-6 border-b border-white/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-2xl flex items-center justify-center border border-neon-cyan/20">
                                    <ArrowLeftRight className="w-5 h-5 text-neon-cyan" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-white">Proposer un échange</h2>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Étape {step} / 3</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Step indicators */}
                        <div className="flex gap-2 mt-4">
                            {[1, 2, 3].map(s => (
                                <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'bg-neon-cyan' : 'bg-white/10'}`} />
                            ))}
                        </div>
                    </div>

                    {/* Step 1: Select cards to offer */}
                    {step === 1 && (
                        <div className="p-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-white/70 mb-1">
                                Choisir vos cartes à offrir <span className="text-neon-cyan">(max 3)</span>
                            </h3>
                            <p className="text-[10px] text-white/30 mb-4">Sélectionnez les cartes que vous souhaitez proposer en échange.</p>

                            {uniqueCards.length === 0 ? (
                                <div className="text-center py-8 text-white/30">
                                    <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-xs">Vous n'avez pas encore de cartes.<br />Visitez le site pendant 5 min pour en gagner !</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1">
                                    {uniqueCards.map(card => (
                                        <CardThumb
                                            key={card.id}
                                            card={card}
                                            size="sm"
                                            selected={selectedOffer.some(c => c.id === card.id)}
                                            onClick={() => toggleOffer(card)}
                                        />
                                    ))}
                                </div>
                            )}

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => selectedOffer.length > 0 && setStep(2)}
                                    disabled={selectedOffer.length === 0}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neon-cyan transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Suivant <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: What you want */}
                    {step === 2 && (
                        <div className="p-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-white/70 mb-1">
                                Ce que vous recherchez
                            </h3>
                            <p className="text-[10px] text-white/30 mb-4">Précisez les cartes ou la rareté souhaitée (séparées par des virgules).</p>

                            <textarea
                                value={wantedText}
                                onChange={e => setWantedText(e.target.value)}
                                placeholder="Ex: Tomorrowland, Legendary, Berghain..."
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-neon-cyan resize-none"
                            />

                            <div className="mt-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-2">Message (optionnel)</label>
                                <input
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="Un mot pour la communauté..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-neon-cyan"
                                />
                            </div>

                            {/* Preview of offered cards */}
                            <div className="mt-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Vos cartes proposées :</p>
                                <div className="flex gap-2">
                                    {selectedOffer.map(card => (
                                        <CardThumb key={card.id} card={card} size="sm" />
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3 justify-between">
                                <button onClick={() => setStep(1)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                                    Retour
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neon-cyan transition-all"
                                >
                                    Suivant <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Confirm */}
                    {step === 3 && (
                        <div className="p-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-white/70 mb-4">
                                Confirmer votre offre
                            </h3>

                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3 mb-4">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-neon-cyan mb-2">Vous offrez :</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {selectedOffer.map(card => (
                                            <span key={card.id} className="text-[10px] bg-white/10 text-white px-2 py-1 rounded-lg">{card.name}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="border-t border-white/10 pt-3">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-2">Vous cherchez :</p>
                                    <p className="text-xs text-white/60">{wantedText || 'Non précisé'}</p>
                                </div>
                                {message && (
                                    <div className="border-t border-white/10 pt-3">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Message :</p>
                                        <p className="text-xs text-white/60 italic">"{message}"</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-3 mb-4">
                                <div className="flex gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-amber-400/80 leading-relaxed">
                                        En publiant cette offre, vos cartes seront visibles mais restent en votre possession jusqu'à ce qu'un membre accepte l'échange.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-between">
                                <button onClick={() => setStep(2)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                                    Retour
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-neon-cyan to-neon-purple text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                                >
                                    <Check className="w-4 h-4" />
                                    Publier l'offre
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// ─── Trade Offer Card ───────────────────────────────────────────────────────────
function TradeOfferCard({ offer, currentUserEmail, onAccept, onCancel }: {
    offer: TradeOffer;
    currentUserEmail?: string;
    onAccept: (offer: TradeOffer) => void;
    onCancel: (offerId: string) => void;
}) {
    const isOwn = offer.fromEmail === currentUserEmail;
    const timeAgo = (() => {
        const diff = Date.now() - new Date(offer.createdAt).getTime();
        const h = Math.floor(diff / 3600000);
        const d = Math.floor(h / 24);
        if (d > 0) return `Il y a ${d}j`;
        if (h > 0) return `Il y a ${h}h`;
        return 'À l\'instant';
    })();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-[#07070d] border border-white/8 hover:border-white/15 rounded-[24px] p-5 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden"
        >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/3 via-transparent to-neon-purple/3 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Header */}
            <div className="relative flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-red/20 to-neon-purple/20 border border-white/10 flex items-center justify-center overflow-hidden">
                        {offer.fromAvatar ? (
                            <img src={offer.fromAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-sm font-black text-white/60">{offer.fromUser.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div>
                        <p className="text-xs font-black text-white">{offer.fromUser}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-2.5 h-2.5 text-white/30" />
                            <span className="text-[9px] text-white/30 uppercase tracking-widest">{timeAgo}</span>
                            {isOwn && <span className="text-[8px] bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 px-1.5 py-0.5 rounded-lg uppercase tracking-widest">Ma proposition</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 bg-white/5 rounded-xl px-2.5 py-1.5 border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Actif</span>
                </div>
            </div>

            {/* Cards exchange display */}
            <div className="relative flex items-center gap-3">
                {/* Offered cards */}
                <div className="flex-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-neon-cyan/70 mb-2 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Offre
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                        {offer.offeredCards.slice(0, 3).map(card => (
                            <CardThumb key={card.id} card={card} size="sm" />
                        ))}
                    </div>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
                        <ArrowLeftRight className="w-3.5 h-3.5 text-white/40" />
                    </div>
                </div>

                {/* Wanted */}
                <div className="flex-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-amber-400/70 mb-2 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5" />
                        Recherche
                    </p>
                    <div className="bg-white/5 border border-white/8 rounded-xl p-2.5 min-h-[60px]">
                        {offer.wantedCardNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {offer.wantedCardNames.map((name, i) => (
                                    <span key={i} className="text-[8px] bg-amber-400/10 text-amber-400 border border-amber-400/20 px-1.5 py-0.5 rounded-lg">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[9px] text-white/25 italic">Open à toutes offres</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Message */}
            {offer.message && (
                <div className="mt-3 bg-white/3 border border-white/5 rounded-xl px-3 py-2">
                    <p className="text-[10px] text-white/40 italic">"{offer.message}"</p>
                </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex gap-2">
                {isOwn ? (
                    <button
                        onClick={() => onCancel(offer.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                        <X className="w-3 h-3" />
                        Annuler l'offre
                    </button>
                ) : (
                    <button
                        onClick={() => onAccept(offer)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 hover:from-neon-cyan/30 hover:to-neon-purple/30 border border-neon-cyan/30 text-neon-cyan rounded-xl text-[9px] font-black uppercase tracking-widest transition-all group/btn"
                    >
                        <ArrowLeftRight className="w-3 h-3 group-hover/btn:rotate-180 transition-transform duration-300" />
                        Accepter l'échange
                    </button>
                )}
            </div>
        </motion.div>
    );
}

// ─── Accept Trade Modal ─────────────────────────────────────────────────────────
function AcceptTradeModal({ offer, isOpen, onClose, onConfirm }: {
    offer: TradeOffer | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (myCards: DropsidersCard[]) => void;
}) {
    const { collectedCards } = useUser();
    const [selectedMyCards, setSelectedMyCards] = useState<DropsidersCard[]>([]);

    const uniqueCards = useMemo(() => {
        const seen = new Set<string>();
        return (collectedCards || []).filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
    }, [collectedCards]);

    const toggleCard = (card: DropsidersCard) => {
        setSelectedMyCards(prev => prev.find(c => c.id === card.id)
            ? prev.filter(c => c.id !== card.id)
            : prev.length < 3 ? [...prev, card] : prev
        );
    };

    if (!isOpen || !offer) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative w-full max-w-md bg-[#06060a] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.9)]"
                >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan to-neon-purple" />

                    <div className="p-6 border-b border-white/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-neon-cyan/10 rounded-2xl flex items-center justify-center border border-neon-cyan/20">
                                    <ArrowLeftRight className="w-5 h-5 text-neon-cyan" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-white">Accepter l'échange</h2>
                                    <p className="text-[10px] text-white/30">avec {offer.fromUser}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* What they offer */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-neon-cyan mb-2">
                                <span className="text-white/50">{offer.fromUser}</span> vous offre :
                            </p>
                            <div className="flex gap-2 flex-wrap">
                                {offer.offeredCards.map(card => (
                                    <CardThumb key={card.id} card={card} size="sm" />
                                ))}
                            </div>
                        </div>

                        {/* What they want */}
                        <div className="border-t border-white/5 pt-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-2">Il/Elle recherche :</p>
                            <div className="flex flex-wrap gap-1.5">
                                {offer.wantedCardNames.length > 0 ? offer.wantedCardNames.map((n, i) => (
                                    <span key={i} className="text-[9px] bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-1 rounded-xl">{n}</span>
                                )) : (
                                    <span className="text-[9px] text-white/30 italic">Open à toutes offres</span>
                                )}
                            </div>
                        </div>

                        {/* Select your cards to give */}
                        <div className="border-t border-white/5 pt-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-2">
                                Vos cartes à donner en échange <span className="text-neon-cyan">(max 3)</span>
                            </p>
                            {uniqueCards.length === 0 ? (
                                <p className="text-xs text-white/30 text-center py-4">Aucune carte disponible.</p>
                            ) : (
                                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                    {uniqueCards.map(card => (
                                        <CardThumb
                                            key={card.id}
                                            card={card}
                                            size="sm"
                                            selected={selectedMyCards.some(c => c.id === card.id)}
                                            onClick={() => toggleCard(card)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={onClose} className="flex-1 py-2.5 bg-white/5 border border-white/10 text-white/50 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                Annuler
                            </button>
                            <button
                                onClick={() => { onConfirm(selectedMyCards); setSelectedMyCards([]); }}
                                disabled={selectedMyCards.length === 0}
                                className="flex-1 py-2.5 bg-gradient-to-r from-neon-cyan to-neon-purple text-black rounded-2xl text-[9px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                            >
                                Confirmer l'échange
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// ─── Main TradeMarketplace Component ───────────────────────────────────────────
export function TradeMarketplace() {
    const { user, isLoggedIn, collectedCards, addCard, removeCard, showNotification } = useUser();
    const [offers, setOffers] = useState<TradeOffer[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [acceptingOffer, setAcceptingOffer] = useState<TradeOffer | null>(null);
    const [filter, setFilter] = useState<'all' | 'mine' | 'legendary' | 'epic' | 'rare'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Load offers from localStorage (simulated backend)
    const loadOffers = () => {
        setLoading(true);
        try {
            const stored = JSON.parse(localStorage.getItem('dropsiders_trades') || '[]') as TradeOffer[];
            const open = stored.filter(o => o.status === 'open');
            setOffers(open);
        } catch (e) {
            console.error('Failed to load trades', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadOffers(); }, []);

    const saveOffer = (newOffer: Omit<TradeOffer, 'id' | 'status' | 'createdAt'>) => {
        const offer: TradeOffer = {
            ...newOffer,
            id: crypto.randomUUID(),
            status: 'open',
            createdAt: new Date().toISOString(),
        };
        try {
            const stored = JSON.parse(localStorage.getItem('dropsiders_trades') || '[]') as TradeOffer[];
            stored.unshift(offer);
            localStorage.setItem('dropsiders_trades', JSON.stringify(stored));
            setOffers(prev => [offer, ...prev]);
            showNotification('Votre offre d\'échange a été publiée !', 'success');
        } catch (e) {
            showNotification('Erreur lors de la publication.', 'error');
        }
    };

    const cancelOffer = (offerId: string) => {
        try {
            const stored = JSON.parse(localStorage.getItem('dropsiders_trades') || '[]') as TradeOffer[];
            const updated = stored.map(o => o.id === offerId ? { ...o, status: 'cancelled' as const } : o);
            localStorage.setItem('dropsiders_trades', JSON.stringify(updated));
            setOffers(prev => prev.filter(o => o.id !== offerId));
            showNotification('Offre annulée.', 'info');
        } catch (e) { console.error(e); }
    };

    const acceptOffer = (offer: TradeOffer, myCards: DropsidersCard[]) => {
        if (!user) return;
        try {
            // 1. Mark offer as accepted
            const stored = JSON.parse(localStorage.getItem('dropsiders_trades') || '[]') as TradeOffer[];
            const updated = stored.map(o => o.id === offer.id ? {
                ...o,
                status: 'accepted' as const,
                acceptedBy: user.username,
                acceptedByEmail: user.email,
            } : o);
            localStorage.setItem('dropsiders_trades', JSON.stringify(updated));

            // 2. Deduct given cards from the current user (User B)
            myCards.forEach(card => {
                removeCard(card.id);
            });

            // 3. Add offered cards to the current user (User B)
            offer.offeredCards.forEach(card => {
                addCard({ ...card, collectedAt: new Date().toISOString() });
            });

            // 4. Update the Offer Creator (User A) collection in registered users
            const registeredUsers: any[] = JSON.parse(localStorage.getItem('dropsiders_registered_users') || '[]');
            const creatorIndex = registeredUsers.findIndex(u => u.email === offer.fromEmail);
            if (creatorIndex !== -1) {
                const creator = registeredUsers[creatorIndex];
                let creatorCards = creator.collectedCards || [];
                
                // Remove User A's offered cards from their collection
                offer.offeredCards.forEach(offeredCard => {
                    const idx = creatorCards.findIndex((c: any) => c.id === offeredCard.id);
                    if (idx !== -1) {
                        creatorCards = [...creatorCards];
                        creatorCards.splice(idx, 1);
                    }
                });

                // Add User B's given cards to User A's collection
                myCards.forEach(card => {
                    creatorCards = [...creatorCards, { ...card, collectedAt: new Date().toISOString() }];
                });

                creator.collectedCards = creatorCards;
                registeredUsers[creatorIndex] = creator;
                localStorage.setItem('dropsiders_registered_users', JSON.stringify(registeredUsers));
            }

            setOffers(prev => prev.filter(o => o.id !== offer.id));
            setAcceptingOffer(null);
            showNotification(`🎉 Échange accepté ! Vous avez obtenu ${offer.offeredCards.map(c => c.name).join(', ')} !`, 'success');
        } catch (e) {
            showNotification('Erreur lors de l\'échange.', 'error');
        }
    };

    // Filter offers
    const filteredOffers = useMemo(() => {
        let result = offers;
        if (filter === 'mine') result = result.filter(o => o.fromEmail === user?.email);
        else if (['legendary', 'epic', 'rare'].includes(filter)) {
            result = result.filter(o => o.offeredCards.some(c => c.rarity === filter));
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(o =>
                o.fromUser.toLowerCase().includes(q) ||
                o.offeredCards.some(c => c.name.toLowerCase().includes(q)) ||
                o.wantedCardNames.some(n => n.toLowerCase().includes(q))
            );
        }
        return result;
    }, [offers, filter, searchQuery, user?.email]);

    const hasCards = (collectedCards || []).length > 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2">
                        <ArrowLeftRight className="w-5 h-5 text-neon-cyan" />
                        Trade Market
                    </h2>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">
                        {offers.length} offres actives · Échangez vos cartes Dropsiders
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadOffers}
                        className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/40 hover:text-white transition-all"
                        title="Rafraîchir"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    {isLoggedIn && (
                        <button
                            onClick={() => {
                                if (!hasCards) {
                                    showNotification('Vous n\'avez pas encore de cartes à échanger !', 'error');
                                    return;
                                }
                                setIsCreateOpen(true);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-neon-cyan to-neon-purple text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,240,255,0.25)]"
                        >
                            <Plus className="w-4 h-4" />
                            Proposer un échange
                        </button>
                    )}
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Offres actives', value: offers.length, color: 'text-neon-cyan', icon: Zap },
                    { label: 'Membres actifs', value: new Set(offers.map(o => o.fromEmail)).size, color: 'text-neon-purple', icon: Shield },
                    { label: 'Pays représentés', value: new Set(offers.flatMap(o => o.offeredCards.map(c => c.country))).size, color: 'text-amber-400', icon: Globe },
                ].map(stat => (
                    <div key={stat.label} className="bg-white/3 border border-white/8 rounded-2xl p-3 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-current/10`}>
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <div>
                            <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                            <p className="text-[8px] font-bold uppercase tracking-widest text-white/30">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Rechercher une carte, un membre..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-neon-cyan"
                    />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {[
                        { id: 'all', label: 'Tous' },
                        { id: 'mine', label: 'Mes offres' },
                        { id: 'legendary', label: '★ Légendaire' },
                        { id: 'epic', label: '★ Épique' },
                        { id: 'rare', label: '★ Rare' },
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id as any)}
                            className={`flex-shrink-0 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === f.id ? 'bg-white text-black' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Login CTA */}
            {!isLoggedIn && (
                <div className="bg-gradient-to-r from-neon-cyan/5 to-neon-purple/5 border border-neon-cyan/20 rounded-2xl p-4 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-neon-cyan flex-shrink-0" />
                    <div>
                        <p className="text-xs font-black text-white uppercase tracking-widest">Connectez-vous pour échanger</p>
                        <p className="text-[10px] text-white/40 mt-0.5">Créez un compte pour proposer et accepter des échanges de cartes.</p>
                    </div>
                </div>
            )}

            {/* Cards grid */}
            {loading ? (
                <div className="text-center py-16 text-white/30">
                    <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin opacity-40" />
                    <p className="text-xs uppercase tracking-widest">Chargement des offres...</p>
                </div>
            ) : filteredOffers.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16 bg-white/3 border border-white/5 border-dashed rounded-[24px]"
                >
                    <ArrowLeftRight className="w-10 h-10 mx-auto mb-4 text-white/20" />
                    <p className="text-sm font-black uppercase tracking-widest text-white/30 mb-2">Aucune offre active</p>
                    <p className="text-[10px] text-white/20 max-w-xs mx-auto">
                        {filter === 'mine' ? 'Vous n\'avez pas encore proposé d\'échange.' : 'Soyez le premier à proposer un échange de cartes !'}
                    </p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {filteredOffers.map(offer => (
                            <TradeOfferCard
                                key={offer.id}
                                offer={offer}
                                currentUserEmail={user?.email}
                                onAccept={o => setAcceptingOffer(o)}
                                onCancel={cancelOffer}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Modals */}
            <CreateTradeModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={saveOffer}
            />
            <AcceptTradeModal
                offer={acceptingOffer}
                isOpen={!!acceptingOffer}
                onClose={() => setAcceptingOffer(null)}
                onConfirm={(myCards) => acceptingOffer && acceptOffer(acceptingOffer, myCards)}
            />
        </div>
    );
}
