import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tv, Plus, Trash2, ChevronUp, ChevronDown, Save, ExternalLink, RotateCcw, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../../utils/auth';

export interface TVVideo {
    id: string;
    title: string;
    description: string;
    youtubeId: string;
}

const DEFAULT_PLAYLIST: TVVideo[] = [
    {
        id: '1',
        title: 'Tomorrowland 2024 – Best of Mainstage Sets',
        description: 'Les sets légendaires et les moments les plus intenses de Tomorrowland',
        youtubeId: 'H5QLyGiDr_0'
    },
    {
        id: '2',
        title: 'Martin Garrix Live @ Amsterdam Music Festival',
        description: 'Set exclusif de Martin Garrix avec tous ses hymnes',
        youtubeId: 'iyIBWoFr7DY'
    },
    {
        id: '3',
        title: 'Ultra Music Festival Miami 2024 – Main Stage Highlights',
        description: 'L\'énergie brute d\'Ultra Miami en haute définition',
        youtubeId: 'tBQsniJdWi8'
    },
    {
        id: '4',
        title: 'EDC Las Vegas 2024 – Kineticfield Stage Recap',
        description: 'Le plus grand spectacle sous le ciel électrique de Las Vegas',
        youtubeId: 'y4fR1VbCqhI'
    },
    {
        id: '5',
        title: 'HARD Summer 2024 – Official Highlights',
        description: 'Basses lourdes et ambiance estivale sur la scène de HARD Summer',
        youtubeId: 'rFQJDcNzXw0'
    }
];

function extractYouTubeId(input: string): string | null {
    if (!input) return null;
    const trimmed = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const match = trimmed.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/|watch\?v=|\&v=)([^#\&\?]{11})/);
    return match ? match[1] : null;
}

interface AdminTVModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AdminTVModal({ isOpen, onClose }: AdminTVModalProps) {
    const [playlist, setPlaylist] = useState<TVVideo[]>(DEFAULT_PLAYLIST);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [newUrl, setNewUrl] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        const fetchSettings = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await apiFetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data?.tv_playlist) && data.tv_playlist.length > 0) {
                        setPlaylist(data.tv_playlist);
                    } else {
                        setPlaylist(DEFAULT_PLAYLIST);
                    }
                }
            } catch (e: any) {
                console.error("Erreur chargement playlist TV:", e);
                setError("Impossible de charger la playlist");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [isOpen]);

    const handleAddVideo = (e: React.FormEvent) => {
        e.preventDefault();
        const ytid = extractYouTubeId(newUrl);
        if (!ytid) {
            alert('Lien YouTube invalide. Exemples : https://youtube.com/watch?v=... ou https://youtu.be/...');
            return;
        }

        const newVid: TVVideo = {
            id: `tv_${Date.now()}`,
            title: newTitle.trim() || `Vidéo ${playlist.length + 1}`,
            description: newDesc.trim() || 'Diffusé sur DropsidersTV',
            youtubeId: ytid
        };

        setPlaylist(prev => [...prev, newVid]);
        setNewUrl('');
        setNewTitle('');
        setNewDesc('');
    };

    const handleDelete = (id: string) => {
        if (playlist.length <= 1) {
            alert('Il doit rester au moins une vidéo dans la programmation.');
            return;
        }
        setPlaylist(prev => prev.filter(v => v.id !== id));
    };

    const handleMoveUp = (index: number) => {
        if (index <= 0) return;
        setPlaylist(prev => {
            const next = [...prev];
            const temp = next[index - 1];
            next[index - 1] = next[index];
            next[index] = temp;
            return next;
        });
    };

    const handleMoveDown = (index: number) => {
        if (index >= playlist.length - 1) return;
        setPlaylist(prev => {
            const next = [...prev];
            const temp = next[index + 1];
            next[index + 1] = next[index];
            next[index] = temp;
            return next;
        });
    };

    const handleReset = () => {
        if (confirm('Restaurer la liste par défaut des sets de festivals ?')) {
            setPlaylist(DEFAULT_PLAYLIST);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await apiFetch('/api/settings/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tv_playlist: playlist })
            });
            if (res.ok) {
                setSaveSuccess(true);
                // Also update localStorage cache for instant refresh
                try {
                    localStorage.setItem('dropsiders_tv_playlist_v2', JSON.stringify(playlist));
                } catch {}
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                setError("Erreur lors de l'enregistrement");
            }
        } catch (e: any) {
            console.error("Erreur sauvegarde TV:", e);
            setError("Erreur réseau lors de la sauvegarde");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-2xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-6 md:p-10 max-w-3xl w-full shadow-[0_0_100px_rgba(255,18,65,0.15)] relative overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan" />
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon-red/10 blur-[100px] rounded-full pointer-events-none" />

                        {/* Header */}
                        <div className="flex justify-between items-start mb-6 relative z-10 shrink-0">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-neon-red/10 border border-neon-red/20 flex items-center justify-center text-neon-red">
                                        <Tv className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-display font-black text-white uppercase italic tracking-tighter">
                                            DROPSIDERS <span className="text-neon-red">TV</span>
                                        </h2>
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                            Programmation des liens YouTube enchaînés
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href="/tv"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-all flex items-center gap-1.5"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Voir la TV
                                </a>
                                <button
                                    onClick={onClose}
                                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Add Video Form */}
                        <form onSubmit={handleAddVideo} className="mb-6 p-4 md:p-5 rounded-2xl bg-white/5 border border-white/10 shrink-0 space-y-3">
                            <div className="text-[10px] font-black uppercase tracking-widest text-neon-red flex items-center gap-2">
                                <Plus className="w-3.5 h-3.5" />
                                Ajouter un lien YouTube à la chaîne
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                <input
                                    type="text"
                                    placeholder="Lien YouTube (ex: https://youtube.com/watch?v=... ou https://youtu.be/...)"
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    className="md:col-span-6 bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-red"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Titre du set ou vidéo"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="md:col-span-4 bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-red"
                                />
                                <button
                                    type="submit"
                                    className="md:col-span-2 py-2.5 rounded-xl bg-neon-red text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-neon-red/90 transition-all active:scale-95"
                                >
                                    <Plus className="w-4 h-4" />
                                    Ajouter
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="Description (optionnel)"
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"
                            />
                        </form>

                        {/* List of videos */}
                        <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 min-h-[220px]">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 px-1">
                                <span>Ordre de passage ({playlist.length} vidéos)</span>
                                <span>Action</span>
                            </div>

                            {loading ? (
                                <div className="py-16 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="w-8 h-8 text-neon-red animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                                        Chargement de la programmation...
                                    </span>
                                </div>
                            ) : playlist.length === 0 ? (
                                <div className="py-12 text-center text-white/30 text-xs font-bold">
                                    Aucune vidéo dans la programmation.
                                </div>
                            ) : (
                                playlist.map((vid, idx) => (
                                    <div
                                        key={vid.id}
                                        className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 transition-all group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-[11px] font-black text-white/30 w-5 text-center">
                                                #{idx + 1}
                                            </span>
                                            <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-white/10">
                                                <img
                                                    src={`https://img.youtube.com/vi/${vid.youtubeId}/mqdefault.jpg`}
                                                    alt={vid.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-bold text-white truncate group-hover:text-neon-red transition-colors">
                                                    {vid.title}
                                                </h4>
                                                <p className="text-[10px] text-white/40 truncate">
                                                    ID: {vid.youtubeId} {vid.description ? `· ${vid.description}` : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleMoveUp(idx)}
                                                disabled={idx === 0}
                                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-20 transition-all"
                                                title="Monter"
                                            >
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleMoveDown(idx)}
                                                disabled={idx === playlist.length - 1}
                                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-20 transition-all"
                                                title="Descendre"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(vid.id)}
                                                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all ml-1"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer Controls */}
                        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="text-[10px] font-bold text-white/40 hover:text-white flex items-center gap-1.5 transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Réinitialiser avec les sets par défaut
                            </button>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                {saveSuccess && (
                                    <div className="flex items-center gap-1.5 text-xs text-neon-green font-bold animate-fade-in">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Enregistré !
                                    </div>
                                )}
                                {error && (
                                    <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-neon-red to-neon-purple text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-lg shadow-neon-red/20 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Enregistrer la programmation
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
