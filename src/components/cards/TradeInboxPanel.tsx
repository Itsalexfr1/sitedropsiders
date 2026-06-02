import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeftRight, Check, XCircle, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useUser } from '../../context/UserContext';

interface TradeInboxPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TradeInboxPanel({ isOpen, onClose }: TradeInboxPanelProps) {
    const { trades, respondToTrade } = useUser();
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
    const [actionId, setActionId] = useState<string | null>(null);

    const pendingReceivedCount = trades.received.filter((t: any) => t.status === 'pending').length;

    const handleResponse = async (tradeId: string, response: 'accepted' | 'rejected') => {
        setActionId(tradeId);
        await respondToTrade(tradeId, response);
        setActionId(null);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> En attente
                    </span>
                );
            case 'accepted':
                return (
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Accepté
                    </span>
                );
            case 'rejected':
                return (
                    <span className="text-[10px] px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full font-bold flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Refusé
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="text-[10px] px-2 py-0.5 bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 rounded-full font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Annulé
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Sliding Panel */}
                    <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-screen max-w-md bg-zinc-950/95 border-l border-white/10 shadow-2xl flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-neon-purple/20 to-neon-red/20 border border-neon-purple/30 rounded-xl text-neon-purple">
                                        <ArrowLeftRight className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black uppercase tracking-wider text-white">Centre d'Échanges</h3>
                                        <p className="text-xs text-white/50">Gérez vos demandes de cartes</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-white/5 p-2 bg-black/20 gap-1">
                                <button
                                    onClick={() => setActiveTab('received')}
                                    className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                        activeTab === 'received'
                                            ? 'bg-white/5 border border-white/10 text-white'
                                            : 'text-white/40 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    Offres Reçues
                                    {pendingReceivedCount > 0 && (
                                        <span className="w-4 h-4 bg-neon-cyan text-black rounded-full flex items-center justify-center text-[9px] font-black animate-pulse">
                                            {pendingReceivedCount}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('sent')}
                                    className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                                        activeTab === 'sent'
                                            ? 'bg-white/5 border border-white/10 text-white'
                                            : 'text-white/40 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    Offres Envoyées
                                </button>
                            </div>

                            {/* Inbox Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {activeTab === 'received' ? (
                                    trades.received.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center text-white/30 p-8">
                                            <ArrowLeftRight className="w-10 h-10 mb-4 opacity-10" />
                                            <p className="text-sm font-bold uppercase tracking-wider">Aucun échange reçu</p>
                                            <p className="text-xs text-white/40 mt-1">Vous n'avez pas encore d'offres d'échange de la part des autres membres.</p>
                                        </div>
                                    ) : (
                                        trades.received.map((trade: any) => (
                                            <div
                                                key={trade.id}
                                                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-4 shadow-lg hover:border-white/20 transition-all relative overflow-hidden"
                                            >
                                                {/* Header trade */}
                                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                                    <div>
                                                        <p className="text-xs text-white/50">
                                                            Proposé par <strong className="text-white">@{trade.fromHandle}</strong>
                                                        </p>
                                                        <p className="text-[10px] text-white/30">
                                                            {new Date(trade.createdAt).toLocaleDateString()} à {new Date(trade.createdAt).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                    {getStatusBadge(trade.status)}
                                                </div>

                                                {/* Swap cards preview */}
                                                <div className="flex items-center justify-around gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
                                                    {/* Offered (Receiving from Alice) */}
                                                    <div className="flex flex-col items-center text-center flex-1 min-w-0">
                                                        <span className="text-[7px] font-black uppercase text-neon-purple tracking-widest mb-1.5">Vous recevez</span>
                                                        <div className="w-16 aspect-[3/4] rounded-lg overflow-hidden border border-white/10 relative">
                                                            <img src={trade.offeredCard.image} alt={trade.offeredCard.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <p className="text-[8px] font-black text-white truncate mt-1 uppercase w-full">{trade.offeredCard.name}</p>
                                                    </div>

                                                    <ArrowLeftRight className="w-4 h-4 text-neon-cyan flex-shrink-0" />

                                                    {/* Wanted (Giving Bob's card) */}
                                                    <div className="flex flex-col items-center text-center flex-1 min-w-0">
                                                        <span className="text-[7px] font-black uppercase text-neon-cyan tracking-widest mb-1.5">Vous donnez</span>
                                                        <div className="w-16 aspect-[3/4] rounded-lg overflow-hidden border border-white/10 relative">
                                                            <img src={trade.wantedCard.image} alt={trade.wantedCard.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <p className="text-[8px] font-black text-white truncate mt-1 uppercase w-full">{trade.wantedCard.name}</p>
                                                    </div>
                                                </div>

                                                {/* Response Actions */}
                                                {trade.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleResponse(trade.id, 'rejected')}
                                                            disabled={actionId !== null}
                                                            className="flex-1 py-2 bg-red-950/20 border border-red-500/30 hover:bg-red-500/10 text-red-400 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                                                        >
                                                            Refuser
                                                        </button>
                                                        <button
                                                            onClick={() => handleResponse(trade.id, 'accepted')}
                                                            disabled={actionId !== null}
                                                            className="flex-1 py-2 bg-emerald-500 text-black hover:opacity-90 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                                        >
                                                            Accepter
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )
                                ) : (
                                    trades.sent.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center text-white/30 p-8">
                                            <ArrowLeftRight className="w-10 h-10 mb-4 opacity-10" />
                                            <p className="text-sm font-bold uppercase tracking-wider">Aucun échange envoyé</p>
                                            <p className="text-xs text-white/40 mt-1">Vous n'avez pas encore envoyé d'offres d'échange à d'autres membres.</p>
                                        </div>
                                    ) : (
                                        trades.sent.map((trade: any) => (
                                            <div
                                                key={trade.id}
                                                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-4 shadow-lg hover:border-white/20 transition-all relative overflow-hidden"
                                            >
                                                {/* Header trade */}
                                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                                    <div>
                                                        <p className="text-xs text-white/50">
                                                            Envoyé à <strong className="text-white">@{trade.toHandle}</strong>
                                                        </p>
                                                        <p className="text-[10px] text-white/30">
                                                            {new Date(trade.createdAt).toLocaleDateString()} à {new Date(trade.createdAt).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                    {getStatusBadge(trade.status)}
                                                </div>

                                                {/* Swap cards preview */}
                                                <div className="flex items-center justify-around gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
                                                    {/* Offered */}
                                                    <div className="flex flex-col items-center text-center flex-1 min-w-0">
                                                        <span className="text-[7px] font-black uppercase text-neon-purple tracking-widest mb-1.5">Vous offrez</span>
                                                        <div className="w-16 aspect-[3/4] rounded-lg overflow-hidden border border-white/10 relative">
                                                            <img src={trade.offeredCard.image} alt={trade.offeredCard.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <p className="text-[8px] font-black text-white truncate mt-1 uppercase w-full">{trade.offeredCard.name}</p>
                                                    </div>

                                                    <ArrowLeftRight className="w-4 h-4 text-neon-purple flex-shrink-0" />

                                                    {/* Wanted */}
                                                    <div className="flex flex-col items-center text-center flex-1 min-w-0">
                                                        <span className="text-[7px] font-black uppercase text-neon-cyan tracking-widest mb-1.5">Vous demandez</span>
                                                        <div className="w-16 aspect-[3/4] rounded-lg overflow-hidden border border-white/10 relative">
                                                            <img src={trade.wantedCard.image} alt={trade.wantedCard.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <p className="text-[8px] font-black text-white truncate mt-1 uppercase w-full">{trade.wantedCard.name}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}
