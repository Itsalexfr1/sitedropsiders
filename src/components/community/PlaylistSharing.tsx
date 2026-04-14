import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Heart, Music2, ExternalLink, User, Clock, Send, CheckCircle } from 'lucide-react';

type PlaylistEntry = {
    id: string;
    title: string;
    description: string;
    author: string;
    type: 'Spotify' | 'SoundCloud' | 'YouTube' | 'Autre';
    url: string;
    embedUrl: string;
    timestamp: string;
    likes: number;
};

const STORAGE_KEY = 'dropsiders_mixes';
const LIKES_KEY = 'dropsiders_mix_likes';

function getEntries(): PlaylistEntry[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveEntries(e: PlaylistEntry[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(e)); }
function getLiked(): Set<string> {
    try { return new Set(JSON.parse(localStorage.getItem(LIKES_KEY) || '[]')); } catch { return new Set(); }
}
function saveLiked(s: Set<string>) { localStorage.setItem(LIKES_KEY, JSON.stringify([...s])); }

function toEmbedUrl(url: string, type: string): string {
    if (type === 'Spotify') {
        // Handle https://open.spotify.com/playlist/ID?si=... -> https://open.spotify.com/embed/playlist/ID
        // Also handle international codes like open.spotify.com/intl-fr/playlist/ID
        let cleanUrl = url.split('?')[0];
        if (cleanUrl.includes('open.spotify.com/')) {
            const parts = cleanUrl.split('open.spotify.com/')[1].split('/');
            const id = parts[parts.length - 1];
            const itemType = parts.includes('album') ? 'album' : parts.includes('track') ? 'track' : 'playlist';
            return `https://open.spotify.com/embed/${itemType}/${id}`;
        }
        return url;
    }
    if (type === 'SoundCloud') {
        return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff0033&auto_play=false&visual=true`;
    }
    if (type === 'YouTube') {
        const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
        if (match) return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
}

export function PlaylistSharing() {
    const [entries, setEntries] = useState<PlaylistEntry[]>(getEntries);
    const [liked, setLiked] = useState<Set<string>>(getLiked);
    const [showForm, setShowForm] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const [form, setForm] = useState({
        title: '',
        description: '',
        author: '',
        type: 'Spotify' as PlaylistEntry['type'],
        url: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.author || !form.url) return;
        setSubmitStatus('loading');

        const newEntry: PlaylistEntry = {
            id: `mix_${Date.now()}`,
            title: form.title,
            description: form.description,
            author: form.author,
            type: form.type,
            url: form.url,
            embedUrl: toEmbedUrl(form.url, form.type),
            timestamp: new Date().toISOString(),
            likes: 0,
        };

        const updated = [newEntry, ...entries];
        setEntries(updated);
        saveEntries(updated);
        setSubmitStatus('success');
        setTimeout(() => {
            setSubmitStatus('idle');
            setShowForm(false);
            setForm({ title: '', description: '', author: '', type: 'Spotify', url: '' });
        }, 1500);
    };

    const toggleLike = (id: string) => {
        const newLiked = new Set(liked);
        if (newLiked.has(id)) newLiked.delete(id);
        else newLiked.add(id);
        setLiked(newLiked);
        saveLiked(newLiked);
        setEntries(prev => prev.map(e => e.id === id ? { ...e, likes: e.likes + (newLiked.has(id) ? 1 : -1) } : e));
        saveEntries(entries.map(e => e.id === id ? { ...e, likes: e.likes + (newLiked.has(id) ? 1 : -1) } : e));
    };

    const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

    const typeColors: Record<string, string> = {
        Spotify: 'text-[#1DB954] bg-[#1DB954]/10 border-[#1DB954]/20',
        SoundCloud: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
        YouTube: 'text-red-400 bg-red-400/10 border-red-400/20',
        Autre: 'text-gray-400 bg-white/5 border-white/10',
    };

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter">Partage de Mixs</h2>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Tes meilleures playlists Spotify &amp; SoundCloud</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-6 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-neon-red hover:text-white transition-all"
                >
                    {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showForm ? 'ANNULER' : 'PARTAGER UN MIX'}
                </button>
            </div>

            {/* Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.form
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        onSubmit={handleSubmit}
                        className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-5"
                    >
                        <h3 className="text-lg font-black text-white uppercase italic flex items-center gap-2">
                            <Music2 className="w-5 h-5 text-neon-red" />
                            Partager un mix ou une playlist
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Titre *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder="Mon mix techno du samedi"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-neon-red transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Ton pseudo *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.author}
                                    onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
                                    placeholder="DJ Alex"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-neon-red transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Plateforme *</label>
                                <select
                                    value={form.type}
                                    onChange={e => setForm(p => ({ ...p, type: e.target.value as PlaylistEntry['type'] }))}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-neon-red transition-all"
                                >
                                    <option value="Spotify">Spotify</option>
                                    <option value="SoundCloud">SoundCloud</option>
                                    <option value="YouTube">YouTube</option>
                                    <option value="Autre">Autre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">URL du mix *</label>
                                <input
                                    type="url"
                                    required
                                    value={form.url}
                                    onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                                    placeholder="https://open.spotify.com/playlist/..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-neon-red transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Description</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Décris l'ambiance, le genre, l'occasion..."
                                rows={2}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-neon-red transition-all resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitStatus === 'loading'}
                            className="flex items-center gap-2 px-6 py-3 bg-neon-red text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-neon-red/80 transition-all disabled:opacity-50"
                        >
                            {submitStatus === 'success' ? (
                                <><CheckCircle className="w-4 h-4" />Partagé !</>
                            ) : (
                                <><Send className="w-4 h-4" />Partager</>
                            )}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* List */}
            {entries.length === 0 ? (
                <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                    <Music2 className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Aucun mix partagé pour l'instant.</p>
                    <p className="text-gray-600 text-xs mt-1">Sois le premier à partager un mix !</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {entries.map((pl, idx) => (
                        <motion.div
                            key={pl.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-5 hover:border-white/20 transition-all"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${typeColors[pl.type]}`}>{pl.type}</span>
                                        <span className="text-[8px] font-bold text-white/30 uppercase flex items-center gap-1"><User className="w-2.5 h-2.5" />{pl.author}</span>
                                        <span className="text-[8px] font-bold text-white/30 uppercase flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{formatDate(pl.timestamp)}</span>
                                    </div>
                                    <h3 className="text-xl font-display font-black text-white italic uppercase tracking-tight">{pl.title}</h3>
                                    {pl.description && <p className="text-gray-500 text-[11px] leading-relaxed">{pl.description}</p>}
                                </div>
                                <button
                                    onClick={() => toggleLike(pl.id)}
                                    className={`flex flex-col items-center gap-0.5 transition-all ${liked.has(pl.id) ? 'text-neon-red' : 'text-white/20 hover:text-neon-red/60'}`}
                                >
                                    <Heart className={`w-5 h-5 ${liked.has(pl.id) ? 'fill-current' : ''}`} />
                                    <span className="text-[8px] font-black">{pl.likes}</span>
                                </button>
                            </div>

                            {/* Embed */}
                            {pl.embedUrl && (
                                <div className={`rounded-2xl overflow-hidden border border-white/5 bg-black ${pl.type === 'Spotify' ? 'h-24' : 'aspect-video'}`}>
                                    <iframe
                                        src={pl.embedUrl}
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                        title={pl.title}
                                        loading="lazy"
                                    />
                                </div>
                            )}

                            <a
                                href={pl.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all"
                            >
                                <ExternalLink className="w-3 h-3" />
                                Ouvrir sur {pl.type}
                            </a>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
