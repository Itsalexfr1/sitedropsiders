import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Heart, Music2, ExternalLink, User, Clock, Send, CheckCircle, Play, Pause, Loader2, Disc3, RefreshCw, Upload, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext';

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

interface CommunityMix {
    id: string;
    title: string;
    username: string;
    genre?: string;
    type?: string; // 'Mix' | 'Track' | 'Remix' | 'Edit'
    audioUrl?: string;
    url?: string;
    embedUrl?: string;
    likes: number;
    uploadDate?: string;
    description?: string;
    tracklist?: any[];
    ownerEmail?: string;
    userEmail?: string;
}

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

const typeStyles: Record<string, { bg: string; text: string; border: string }> = {
    mix: { bg: 'bg-neon-green/10', text: 'text-neon-green', border: 'border-neon-green/20' },
    track: { bg: 'bg-neon-red/10', text: 'text-neon-red', border: 'border-neon-red/20' },
    remix: { bg: 'bg-neon-purple/10', text: 'text-neon-purple', border: 'border-neon-purple/20' },
    edit: { bg: 'bg-neon-cyan/10', text: 'text-neon-cyan', border: 'border-neon-cyan/20' }
};

export function PlaylistSharing() {
    const navigate = useNavigate();
    const { playTrack, activeTrack, isPlaying } = usePlayer();
    const [entries, setEntries] = useState<PlaylistEntry[]>(getEntries);
    const [liked, setLiked] = useState<Set<string>>(getLiked);
    const [showForm, setShowForm] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    // Default to 'uploads' so uploaded mixes are shown immediately!
    const [activeTab, setActiveTab] = useState<'uploads' | 'links'>('uploads');
    const [communityMixes, setCommunityMixes] = useState<CommunityMix[]>([]);
    const [loadingCommunity, setLoadingCommunity] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'mix' | 'track' | 'remix' | 'edit'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [likedMixes, setLikedMixes] = useState<Set<string>>(() => {
        try {
            return new Set(JSON.parse(localStorage.getItem('dropsiders_mix_likes') || '[]'));
        } catch {
            return new Set();
        }
    });

    const [form, setForm] = useState({
        title: '',
        description: '',
        author: '',
        type: 'Spotify' as PlaylistEntry['type'],
        url: '',
    });

    // Fetch community mixes immediately on mount
    const fetchCommunityMixes = useCallback(async () => {
        setLoadingCommunity(true);
        try {
            const res = await fetch('/api/community/mixes');
            if (res.ok) {
                const data = await res.json();
                setCommunityMixes(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Failed to fetch community mixes', err);
        } finally {
            setLoadingCommunity(false);
        }
    }, []);

    useEffect(() => {
        fetchCommunityMixes();
        const interval = setInterval(fetchCommunityMixes, 30000);
        return () => clearInterval(interval);
    }, [fetchCommunityMixes]);

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

    const handleLikeMix = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (likedMixes.has(id)) return;

        const updated = new Set(likedMixes).add(id);
        setLikedMixes(updated);
        localStorage.setItem('dropsiders_mix_likes', JSON.stringify([...updated]));

        setCommunityMixes(prev => prev.map(m => m.id === id ? { ...m, likes: (m.likes || 0) + 1 } : m));

        try {
            await fetch('/api/community/mixes/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
        } catch (err) {
            console.error('Failed to submit like', err);
        }
    };

    const formatDate = (iso?: string) => {
        if (!iso) return '';
        try {
            return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return iso;
        }
    };

    const typeColors: Record<string, string> = {
        Spotify: 'text-[#1DB954] bg-[#1DB954]/10 border-[#1DB954]/20',
        SoundCloud: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
        YouTube: 'text-red-400 bg-red-400/10 border-red-400/20',
        Autre: 'text-gray-400 bg-white/5 border-white/10',
    };

    // Filter community mixes
    const filteredCommunityMixes = communityMixes.filter(mix => {
        const matchesFilter = activeFilter === 'all' || (mix.type && mix.type.toLowerCase() === activeFilter);
        const matchesSearch = !searchQuery.trim() ||
            mix.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (mix.username && mix.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (mix.genre && mix.genre.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
                <div>
                    <h2 className="text-3xl md:text-4xl font-display font-black text-white italic uppercase tracking-tighter">
                        Partage de Mixs & Sets
                    </h2>
                    <p className="text-gray-400 text-[11px] font-black uppercase tracking-[0.2em] mt-2">
                        {activeTab === 'uploads'
                            ? 'Tous les mixes et tracks uploadés par la communauté'
                            : 'Playlists et liens Spotify, SoundCloud et YouTube'}
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap z-20">
                    {/* Tab Switcher */}
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 shrink-0">
                        <button
                            onClick={() => { setActiveTab('uploads'); setShowForm(false); }}
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                activeTab === 'uploads'
                                    ? 'bg-white text-black shadow-lg font-black'
                                    : 'text-gray-400 hover:text-white font-medium'
                            }`}
                        >
                            <Disc3 className="w-3.5 h-3.5" />
                            Mixs Uploadés
                            {communityMixes.length > 0 && (
                                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${activeTab === 'uploads' ? 'bg-black/15 text-black' : 'bg-white/10 text-white'}`}>
                                    {communityMixes.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => { setActiveTab('links'); setShowForm(false); }}
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                activeTab === 'links'
                                    ? 'bg-white text-black shadow-lg font-black'
                                    : 'text-gray-400 hover:text-white font-medium'
                            }`}
                        >
                            <Radio className="w-3.5 h-3.5" />
                            Playlists & Liens
                        </button>
                    </div>

                    {/* Action buttons */}
                    {activeTab === 'uploads' ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchCommunityMixes}
                                title="Actualiser la liste"
                                className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <RefreshCw className={`w-4 h-4 ${loadingCommunity ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={() => navigate('/profile')}
                                className="px-5 py-3 bg-gradient-to-r from-neon-red to-neon-purple text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-95 transition-all shadow-lg shadow-neon-red/20"
                            >
                                <Upload className="w-4 h-4" />
                                UPLOADER UN SON
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="px-6 py-3 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-neon-red hover:text-white transition-all shadow-lg"
                        >
                            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {showForm ? 'ANNULER' : 'PARTAGER UN LIEN'}
                        </button>
                    )}
                </div>
            </div>

            {/* TAB 1: UPLOADS DE LA COMMUNAUTÉ */}
            {activeTab === 'uploads' && (
                <div className="space-y-6">
                    {/* Category Filter Pills & Search */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                            {[
                                { id: 'all', label: 'Tous' },
                                { id: 'mix', label: 'Mixs' },
                                { id: 'track', label: 'Tracks' },
                                { id: 'remix', label: 'Remixes' },
                                { id: 'edit', label: 'Edits' },
                            ].map(filter => {
                                const count = filter.id === 'all'
                                    ? communityMixes.length
                                    : communityMixes.filter(m => (m.type || '').toLowerCase() === filter.id).length;
                                return (
                                    <button
                                        key={filter.id}
                                        onClick={() => setActiveFilter(filter.id as any)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                                            activeFilter === filter.id
                                                ? 'bg-neon-red text-white border-neon-red shadow-lg shadow-neon-red/30'
                                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
                                        }`}
                                    >
                                        {filter.label} ({count})
                                    </button>
                                );
                            })}
                        </div>

                        <input
                            type="text"
                            placeholder="Rechercher un son, DJ, genre..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-red transition-all w-full sm:w-64"
                        />
                    </div>

                    {/* Mixes Grid */}
                    {loadingCommunity && communityMixes.length === 0 ? (
                        <div className="py-24 flex flex-col items-center gap-4">
                            <div className="relative">
                                <Loader2 className="w-10 h-10 text-neon-red animate-spin" />
                                <div className="absolute inset-0 rounded-full blur-lg bg-neon-red/20 animate-pulse" />
                            </div>
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                Chargement des sons de la communauté...
                            </p>
                        </div>
                    ) : filteredCommunityMixes.length === 0 ? (
                        <div className="py-20 border border-dashed border-white/10 rounded-3xl flex flex-col items-center gap-4 text-center px-4">
                            <Disc3 className="w-12 h-12 text-white/20 animate-spin-slow" />
                            <p className="text-white/40 font-black uppercase tracking-widest text-sm">
                                {communityMixes.length === 0
                                    ? 'Aucun son uploadé pour le moment'
                                    : 'Aucun résultat pour cette sélection'}
                            </p>
                            <p className="text-gray-500 text-xs max-w-sm">
                                Rendez-vous sur votre profil pour uploader votre premier mix, track, remix ou edit !
                            </p>
                            <button
                                onClick={() => navigate('/profile')}
                                className="mt-2 px-6 py-3 bg-neon-red text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-neon-red/80 transition-all"
                            >
                                UPLOADER MON MIX VIA MON COMPTE
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCommunityMixes.map((mix, idx) => {
                                const typeKey = (mix.type || 'mix').toLowerCase();
                                const style = typeStyles[typeKey] || typeStyles.mix;
                                const isCurrentPlaying = isPlaying && activeTrack?.id === mix.id;

                                return (
                                    <motion.div
                                        key={mix.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 hover:border-white/20 transition-all flex flex-col justify-between group"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                                                        {mix.type || 'Mix'}
                                                    </span>
                                                    {mix.genre && (
                                                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-white/10 text-white/60 bg-white/5">
                                                            {mix.genre}
                                                        </span>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={(e) => handleLikeMix(e, mix.id)}
                                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all ${
                                                        likedMixes.has(mix.id)
                                                            ? 'text-neon-red border-neon-red/30 bg-neon-red/10'
                                                            : 'text-white/30 border-white/10 hover:text-neon-red/70 hover:border-neon-red/20'
                                                    }`}
                                                >
                                                    <Heart className={`w-3.5 h-3.5 ${likedMixes.has(mix.id) ? 'fill-current' : ''}`} />
                                                    <span className="text-[9px] font-black">{mix.likes || 0}</span>
                                                </button>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-display font-black text-white uppercase italic tracking-tight group-hover:text-neon-red transition-colors line-clamp-1">
                                                    {mix.title}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1 text-[9px] font-bold text-white/40 uppercase">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3 text-white/30" />
                                                        {mix.username || 'Dropsider'}
                                                    </span>
                                                    {mix.uploadDate && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3 text-white/30" />
                                                            {mix.uploadDate.split(' ')[0]}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {mix.description && (
                                                <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed italic">
                                                    "{mix.description}"
                                                </p>
                                            )}
                                        </div>

                                        {/* Play button */}
                                        <div className="pt-2">
                                            <button
                                                onClick={() => {
                                                    playTrack({
                                                        id: mix.id,
                                                        title: mix.title,
                                                        artist: mix.username || 'Dropsider',
                                                        label: mix.genre || mix.type,
                                                        url: mix.audioUrl || mix.url || '',
                                                        embedUrl: mix.embedUrl && !mix.audioUrl ? mix.embedUrl : undefined,
                                                        tracks: mix.tracklist || [],
                                                        ownerEmail: mix.ownerEmail || mix.userEmail
                                                    });
                                                }}
                                                className={`w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2.5 transition-all ${
                                                    isCurrentPlaying
                                                        ? 'bg-neon-red text-white shadow-lg shadow-neon-red/30'
                                                        : 'bg-white/10 hover:bg-white text-white hover:text-black border border-white/10'
                                                }`}
                                            >
                                                {isCurrentPlaying ? (
                                                    <>
                                                        <Pause className="w-3.5 h-3.5 fill-current" />
                                                        EN COURS DE LECTURE
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                                        ÉCOUTER LE MORCEAU
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: PLAYLISTS & LIENS EXTERNES */}
            {activeTab === 'links' && (
                <>
                    {/* External Link Share Form */}
                    <AnimatePresence>
                        {showForm && (
                            <motion.form
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                onSubmit={handleSubmit}
                                className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-5"
                            >
                                <h3 className="text-lg font-black text-white uppercase italic flex items-center gap-2">
                                    <Music2 className="w-5 h-5 text-neon-red" />
                                    Partager une playlist ou un set externe
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Titre *</label>
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
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ton pseudo *</label>
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
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Plateforme *</label>
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
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">URL du mix ou playlist *</label>
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
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Décris l'ambiance, le style, les artistes..."
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

                    {/* External Playlists Grid */}
                    {entries.length === 0 ? (
                        <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                            <Music2 className="w-12 h-12 text-white/10 mx-auto mb-4" />
                            <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Aucune playlist externe partagée.</p>
                            <p className="text-gray-600 text-xs mt-1">Sois le premier à partager une playlist Spotify ou SoundCloud !</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {entries.map((pl, idx) => (
                                <motion.div
                                    key={pl.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4 hover:border-white/20 transition-all"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${typeColors[pl.type]}`}>{pl.type}</span>
                                                <span className="text-[8px] font-bold text-white/40 uppercase flex items-center gap-1"><User className="w-2.5 h-2.5" />{pl.author}</span>
                                                <span className="text-[8px] font-bold text-white/40 uppercase flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{formatDate(pl.timestamp)}</span>
                                            </div>
                                            <h3 className="text-xl font-display font-black text-white italic uppercase tracking-tight">{pl.title}</h3>
                                            {pl.description && <p className="text-gray-400 text-[11px] leading-relaxed">{pl.description}</p>}
                                        </div>
                                        <button
                                            onClick={() => toggleLike(pl.id)}
                                            className={`flex flex-col items-center gap-0.5 transition-all ${liked.has(pl.id) ? 'text-neon-red' : 'text-white/20 hover:text-neon-red/60'}`}
                                        >
                                            <Heart className={`w-5 h-5 ${liked.has(pl.id) ? 'fill-current' : ''}`} />
                                            <span className="text-[8px] font-black">{pl.likes}</span>
                                        </button>
                                    </div>

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
                </>
            )}
        </div>
    );
}
