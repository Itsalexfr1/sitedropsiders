import React, { useState, useEffect } from 'react';
import { 
    MessageSquare, 
    Send, 
    Star, 
    CheckCheck, 
    Trash2, 
    Pin, 
    Radio, 
    Sparkles, 
    Filter, 
    Clock, 
    User, 
    MapPin, 
    Volume2,
    RefreshCw
} from 'lucide-react';
import type { RadioDedication } from '../../../types/radioDedications';

const DEDICATIONS_STORAGE_KEY = 'dropsiders_radio_dedications';

export function RadioDedicationsPanel() {
    const [dedications, setDedications] = useState<RadioDedication[]>(() => {
        try {
            const raw = localStorage.getItem(DEDICATIONS_STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch {}
        // Dédicaces de démonstration initiales
        return [
            {
                id: 'demo-1',
                author: 'Lucas',
                location: 'Lyon, FR',
                message: 'Gros soutien à l\'équipe Dropsiders, la programmation Bassline est folle ce soir ! 🔥',
                timestamp: Date.now() - 1000 * 60 * 4,
                status: 'new',
                isPinned: true
            },
            {
                id: 'demo-2',
                author: 'Sophie & Alex',
                location: 'Bruxelles, BE',
                message: 'Une dédicace pour le set de 21h, on écoute en direct depuis la coloc ! 🎧',
                timestamp: Date.now() - 1000 * 60 * 12,
                status: 'new'
            }
        ];
    });

    const [filter, setFilter] = useState<'all' | 'new' | 'pinned' | 'on_air'>('all');
    const [hostMessage, setHostMessage] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);

    // Son de notification à l'arrivée d'une dédicace
    const playDingSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        } catch {}
    };

    // Sauvegarde et synchronisation temps réel inter-onglets et Cloud
    const saveDedications = (items: RadioDedication[]) => {
        setDedications(items);
        try {
            localStorage.setItem(DEDICATIONS_STORAGE_KEY, JSON.stringify(items));
            if (typeof BroadcastChannel !== 'undefined') {
                const bc = new BroadcastChannel('dropsiders_radio_dedications');
                bc.postMessage({ type: 'sync', dedications: items });
                bc.close();
            }
        } catch {}
    };

    // ─── SYNCHRONISATION CLOUD EN TEMPS RÉEL (TOUS LES INTERNAUTES DU MONDE) ───
    const fetchCloudDedications = async () => {
        try {
            const res = await fetch('/api/radio/dedications');
            if (res.ok) {
                const cloudItems: RadioDedication[] = await res.json();
                if (Array.isArray(cloudItems) && cloudItems.length > 0) {
                    setDedications(prev => {
                        const prevIds = new Set(prev.map(p => p.id));
                        const hasNew = cloudItems.some(c => !prevIds.has(c.id));
                        if (hasNew) {
                            playDingSound();
                        }

                        // Fusionner sans doublons en gardant le statut local si plus récent
                        const map = new Map<string, RadioDedication>();
                        cloudItems.forEach(item => map.set(item.id, item));
                        prev.forEach(item => {
                            if (!map.has(item.id)) map.set(item.id, item);
                        });
                        const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
                        try { localStorage.setItem(DEDICATIONS_STORAGE_KEY, JSON.stringify(merged)); } catch {}
                        return merged;
                    });
                }
            }
        } catch {}
    };

    // Interroge le serveur toutes les 4s pour recevoir en direct les messages de n'importe quel auditeur
    useEffect(() => {
        fetchCloudDedications();
        const timer = setInterval(fetchCloudDedications, 4000);
        return () => clearInterval(timer);
    }, []);

    // Écoute BroadcastChannel et CustomEvent pour réception instantanée en local
    useEffect(() => {
        let channel: BroadcastChannel | null = null;
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                channel = new BroadcastChannel('dropsiders_radio_dedications');
                channel.onmessage = (ev) => {
                    if (ev.data?.type === 'new_dedication' && ev.data?.dedication) {
                        const newD = ev.data.dedication;
                        setDedications(prev => {
                            if (prev.some(d => d.id === newD.id)) return prev;
                            playDingSound();
                            const updated = [newD, ...prev];
                            try { localStorage.setItem(DEDICATIONS_STORAGE_KEY, JSON.stringify(updated)); } catch {}
                            return updated;
                        });
                        setUnreadCount(c => c + 1);
                    } else if (ev.data?.type === 'sync' && Array.isArray(ev.data?.dedications)) {
                        setDedications(ev.data.dedications);
                    }
                };
            }
        } catch {}

        const onLocal = (e: any) => {
            if (e?.detail) {
                const newD = e.detail;
                setDedications(prev => {
                    if (prev.some(d => d.id === newD.id)) return prev;
                    playDingSound();
                    const updated = [newD, ...prev];
                    try { localStorage.setItem(DEDICATIONS_STORAGE_KEY, JSON.stringify(updated)); } catch {}
                    return updated;
                });
            }
        };
        window.addEventListener('dropsiders_radio_new_dedication', onLocal);

        return () => {
            if (channel) channel.close();
            window.removeEventListener('dropsiders_radio_new_dedication', onLocal);
        };
    }, []);

    // Met à jour le compteur de non-lus
    useEffect(() => {
        setUnreadCount(dedications.filter(d => d.status === 'new').length);
    }, [dedications]);

    // Marquer comme passé à l'antenne
    const handleToggleOnAir = (id: string) => {
        const updated = dedications.map(d => {
            if (d.id === id) {
                return {
                    ...d,
                    status: (d.status === 'on_air' ? 'new' : 'on_air') as 'new' | 'on_air'
                };
            }
            return d;
        });
        saveDedications(updated);
    };

    // Épingler une dédicace en haut
    const handleTogglePin = (id: string) => {
        const updated = dedications.map(d => {
            if (d.id === id) {
                return { ...d, isPinned: !d.isPinned };
            }
            return d;
        });
        saveDedications(updated);
    };

    // Supprimer une dédicace
    const handleDelete = (id: string) => {
        const updated = dedications.filter(d => d.id !== id);
        saveDedications(updated);
    };

    // Tout marquer comme lu
    const handleMarkAllRead = () => {
        const updated = dedications.map(d => ({ ...d, status: 'on_air' as const }));
        saveDedications(updated);
    };

    // Envoi d'un message broadcast de l'animateur
    const handleSendHostMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!hostMessage.trim()) return;

        const newMsg: RadioDedication = {
            id: 'host-' + Date.now(),
            author: '🎙️ ANIMATEUR (RÉGIE)',
            location: 'Studio Live',
            message: hostMessage.trim(),
            timestamp: Date.now(),
            status: 'on_air',
            isPinned: true
        };

        const updated = [newMsg, ...dedications];
        saveDedications(updated);
        setHostMessage('');

        // Notifier les auditeurs via BroadcastChannel
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                const bc = new BroadcastChannel('dropsiders_radio_dedications');
                bc.postMessage({ type: 'host_shoutout', message: newMsg });
                bc.close();
            }
        } catch {}
    };

    // Filtrage
    const filteredDedications = dedications.filter(d => {
        if (filter === 'new') return d.status === 'new';
        if (filter === 'pinned') return !!d.isPinned;
        if (filter === 'on_air') return d.status === 'on_air';
        return true;
    }).sort((a, b) => {
        // Épinglés en priorité, puis par date décroissante
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.timestamp - a.timestamp;
    });

    const formatTimestamp = (ts: number) => {
        const diffSec = Math.floor((Date.now() - ts) / 1000);
        if (diffSec < 60) return `il y a ${diffSec}s`;
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `il y a ${diffMin}m`;
        return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="rounded-3xl bg-[#0b0d14]/95 border border-white/10 shadow-2xl p-5 flex flex-col justify-between h-full min-h-[460px]">
            {/* En-tête */}
            <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400">
                            <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-display font-black text-white uppercase italic tracking-tight">
                                    Dédicaces Auditeurs en Régie
                                </h3>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-mono text-[9px] font-black animate-pulse">
                                        {unreadCount} NOUVEAU{unreadCount > 1 ? 'X' : ''}
                                    </span>
                                )}
                            </div>
                            <p className="text-[9px] font-mono text-gray-400">
                                Messages et shoutouts en direct reçus du player radio
                            </p>
                        </div>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-gray-300 hover:text-white cursor-pointer transition-colors"
                        >
                            Tout marquer lu
                        </button>
                    )}
                </div>

                {/* Filtres rapides */}
                <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 text-[10px] font-mono">
                    <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            filter === 'all' ? 'bg-purple-600 text-white border-purple-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                    >
                        Toutes ({dedications.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('new')}
                        className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            filter === 'new' ? 'bg-cyan-500 text-black font-bold border-cyan-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                    >
                        Non lues ({dedications.filter(d => d.status === 'new').length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('pinned')}
                        className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                            filter === 'pinned' ? 'bg-amber-500 text-black font-bold border-amber-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                    >
                        <Pin className="w-2.5 h-2.5" />
                        Épinglées ({dedications.filter(d => d.isPinned).length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('on_air')}
                        className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            filter === 'on_air' ? 'bg-emerald-500 text-black font-bold border-emerald-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                    >
                        Diffusées ({dedications.filter(d => d.status === 'on_air').length})
                    </button>
                </div>

                {/* Liste des dédicaces */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {filteredDedications.length === 0 ? (
                        <div className="py-12 text-center text-gray-500 text-xs font-mono border border-dashed border-white/10 rounded-2xl">
                            Aucune dédicace dans ce filtre.
                        </div>
                    ) : (
                        filteredDedications.map((ded) => {
                            const isNew = ded.status === 'new';
                            const isOnAir = ded.status === 'on_air';
                            const isHost = ded.author.includes('ANIMATEUR');

                            return (
                                <div
                                    key={ded.id}
                                    className={`p-3 rounded-2xl border transition-all relative ${
                                        ded.isPinned
                                            ? 'bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-black/60 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                                            : isNew
                                            ? 'bg-gradient-to-r from-cyan-950/40 to-black/60 border-cyan-500/40'
                                            : isOnAir
                                            ? 'bg-black/40 border-emerald-500/30 opacity-80'
                                            : 'bg-white/[0.02] border-white/10'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-display font-black uppercase tracking-tight flex items-center gap-1 ${
                                                isHost ? 'text-amber-300' : isNew ? 'text-cyan-300' : 'text-white'
                                            }`}>
                                                <User className="w-3 h-3 opacity-60" />
                                                {ded.author}
                                            </span>
                                            {ded.location && (
                                                <span className="text-[9px] font-mono text-gray-400 flex items-center gap-0.5">
                                                    <MapPin className="w-2.5 h-2.5" />
                                                    {ded.location}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <span className="text-[9px] font-mono text-gray-500">
                                                {formatTimestamp(ded.timestamp)}
                                            </span>

                                            {/* Bouton Épingler */}
                                            <button
                                                type="button"
                                                onClick={() => handleTogglePin(ded.id)}
                                                className={`p-1 rounded-md transition-colors cursor-pointer ${
                                                    ded.isPinned ? 'text-amber-400 bg-amber-400/20' : 'text-gray-500 hover:text-white'
                                                }`}
                                                title={ded.isPinned ? 'Désépingler' : 'Épingler pour la prise de parole'}
                                            >
                                                <Pin className="w-3 h-3" />
                                            </button>

                                            {/* Bouton Supprimer */}
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(ded.id)}
                                                className="p-1 rounded-md text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                                                title="Supprimer la dédicace"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <p className={`text-xs sm:text-sm font-sans leading-relaxed ${
                                        ded.isPinned ? 'text-white font-bold' : isNew ? 'text-gray-100 font-medium' : 'text-gray-300'
                                    }`}>
                                        "{ded.message}"
                                    </p>

                                    {/* Actions d'antenne */}
                                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5">
                                        <div className="flex items-center gap-1.5">
                                            {ded.isPinned && (
                                                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                                    ⭐ ÉPINGLÉE
                                                </span>
                                            )}
                                            {isNew && (
                                                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                                                    ● NON LUE
                                                </span>
                                            )}
                                            {isOnAir && (
                                                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                                                    ✓ PASSÉE À L'ANTENNE
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleToggleOnAir(ded.id)}
                                            className={`px-2.5 py-1 rounded-lg text-[9px] font-display font-black uppercase italic tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                                                isOnAir
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                                            }`}
                                        >
                                            <Radio className="w-2.5 h-2.5" />
                                            <span>{isOnAir ? 'Déjà lue à l\'antenne' : '🎙️ Marquer passée à l\'antenne'}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Envoi d'un message direct régie */}
            <form onSubmit={handleSendHostMessage} className="pt-3 mt-3 border-t border-white/10 flex items-center gap-2">
                <input
                    type="text"
                    value={hostMessage}
                    onChange={e => setHostMessage(e.target.value)}
                    placeholder="Publier un mot d'ambiance régie pour les auditeurs..."
                    className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs font-sans text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    maxLength={140}
                />
                <button
                    type="submit"
                    disabled={!hostMessage.trim()}
                    className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all cursor-pointer disabled:cursor-not-allowed shadow-md"
                    title="Envoyer le mot régie"
                >
                    <Send className="w-3.5 h-3.5" />
                </button>
            </form>
        </div>
    );
}
