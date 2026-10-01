import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, Radio, Sparkles, User, MapPin } from 'lucide-react';
import type { RadioDedication } from '../../types/radioDedications';

interface RadioDedicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTrackTitle?: string;
}

export function RadioDedicationModal({
    isOpen,
    onClose,
    currentTrackTitle
}: RadioDedicationModalProps) {
    const [author, setAuthor] = useState('');
    const [location, setLocation] = useState('');
    const [message, setMessage] = useState('');
    const [isSent, setIsSent] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!author.trim() || !message.trim()) return;

        const newDedication: RadioDedication = {
            id: 'ded-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            author: author.trim(),
            location: location.trim() || undefined,
            message: message.trim(),
            timestamp: Date.now(),
            status: 'new'
        };

        // 1. Sauvegarde dans localStorage
        try {
            const raw = localStorage.getItem('dropsiders_radio_dedications');
            const existing: RadioDedication[] = raw ? JSON.parse(raw) : [];
            const updated = [newDedication, ...existing];
            localStorage.setItem('dropsiders_radio_dedications', JSON.stringify(updated));
        } catch {}

        // 2. BroadcastChannel pour alerter instantanément la régie
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                const bc = new BroadcastChannel('dropsiders_radio_dedications');
                bc.postMessage({ type: 'new_dedication', dedication: newDedication });
                bc.close();
            }
        } catch {}

        // 3. CustomEvent local au cas où
        window.dispatchEvent(new CustomEvent('dropsiders_radio_new_dedication', { detail: newDedication }));

        setIsSent(true);
        setTimeout(() => {
            setIsSent(false);
            setMessage('');
            onClose();
        }, 1800);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#111320] via-[#0b0c16] to-[#05060b] border border-cyan-500/40 p-6 shadow-[0_0_50px_rgba(0,255,255,0.15)] relative overflow-hidden"
                >
                    {/* Lueurs */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

                    {/* Bouton Fermer */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {isSent ? (
                        <div className="py-12 text-center space-y-3 animate-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400 mx-auto flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                <Sparkles className="w-8 h-8 animate-bounce" />
                            </div>
                            <h3 className="text-xl font-display font-black text-white uppercase italic">
                                Dédicace Envoyée !
                            </h3>
                            <p className="text-xs font-mono text-emerald-300">
                                Transmise en direct à la régie de l'animateur.
                            </p>
                        </div>
                    ) : (
                        <div>
                            {/* En-tête */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-display font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                                        Envoyer une Dédicace
                                    </h3>
                                    <p className="text-[10px] font-mono text-cyan-300">
                                        Passez votre mot en direct à l'antenne radio
                                    </p>
                                </div>
                            </div>

                            {currentTrackTitle && (
                                <div className="mb-4 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-[10px] font-mono text-gray-300 flex items-center gap-2">
                                    <Radio className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                    <span className="truncate">À l'antenne : <strong>{currentTrackTitle}</strong></span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                                            Votre Prénom / Pseudo *
                                        </label>
                                        <div className="relative">
                                            <User className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
                                            <input
                                                type="text"
                                                required
                                                value={author}
                                                onChange={e => setAuthor(e.target.value)}
                                                placeholder="Ex: Thomas"
                                                maxLength={30}
                                                className="w-full pl-8 pr-3 py-2 bg-black/60 border border-white/15 rounded-xl text-xs font-sans text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                                            Votre Ville (optionnel)
                                        </label>
                                        <div className="relative">
                                            <MapPin className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
                                            <input
                                                type="text"
                                                value={location}
                                                onChange={e => setLocation(e.target.value)}
                                                placeholder="Ex: Lyon, Paris..."
                                                maxLength={30}
                                                className="w-full pl-8 pr-3 py-2 bg-black/60 border border-white/15 rounded-xl text-xs font-sans text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                                            Votre Dédicace / Message *
                                        </label>
                                        <span className="text-[9px] font-mono text-gray-500">
                                            {message.length}/180
                                        </span>
                                    </div>
                                    <textarea
                                        required
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        placeholder="Un shoutout pour vos amis, une réaction sur le set, ou un mot pour l'animateur..."
                                        maxLength={180}
                                        rows={3}
                                        className="w-full p-3 bg-black/60 border border-white/15 rounded-xl text-xs font-sans text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!author.trim() || !message.trim()}
                                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/20 active:scale-95 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-4 h-4 fill-current" />
                                    <span>ENVOYER LA DÉDICACE EN DIRECT</span>
                                </button>
                            </form>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
