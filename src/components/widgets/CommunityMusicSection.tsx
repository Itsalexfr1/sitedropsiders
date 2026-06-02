import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Upload, Music2, Disc3, Shuffle, ExternalLink,
    X, Loader2, ChevronDown, ChevronUp, Users, Flame, Clock,
    SlidersHorizontal, Check
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type MusicType = 'mix' | 'track' | 'remix';

interface CommunityItem {
    id: string;
    type: MusicType;
    title: string;
    artist: string;
    embedUrl: string;
    coverUrl?: string;
    description?: string;
    likes: number;
    uploadedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `il y a ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `il y a ${days}j`;
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function toEmbedUrl(url: string): string {
    // SoundCloud
    if (url.includes('soundcloud.com') && !url.includes('w.soundcloud.com')) {
        return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23b000ff&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`;
    }
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Spotify
    const spMatch = url.match(/open\.spotify\.com\/(track|playlist|album|artist)\/([a-zA-Z0-9]+)/);
    if (spMatch) return `https://open.spotify.com/embed/${spMatch[1]}/${spMatch[2]}`;
    // Beatport embed
    if (url.includes('embed.beatport.com') || url.includes('embed.traxsource.com')) return url;
    return url;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-tab config
// ─────────────────────────────────────────────────────────────────────────────
const TABS: { id: MusicType; label: string; icon: any; color: string; glow: string; badge: string }[] = [
    { id: 'mix',    label: 'Mixes',   icon: SlidersHorizontal, color: 'text-neon-purple',  glow: 'rgba(176,38,255,0.4)',  badge: 'bg-neon-purple' },
    { id: 'track',  label: 'Tracks',  icon: Music2,             color: 'text-neon-cyan',    glow: 'rgba(0,229,255,0.4)',   badge: 'bg-neon-cyan' },
    { id: 'remix',  label: 'Remixes', icon: Shuffle,            color: 'text-amber-400',    glow: 'rgba(251,191,36,0.4)', badge: 'bg-amber-400' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Upload Modal
// ─────────────────────────────────────────────────────────────────────────────
function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (item: CommunityItem) => void }) {
    const [form, setForm] = useState({ type: 'mix' as MusicType, title: '', artist: '', embedUrl: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.artist.trim() || !form.embedUrl.trim()) {
            setError('Titre, Artiste et Lien sont obligatoires.');
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/community-music/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, embedUrl: toEmbedUrl(form.embedUrl) })
            });
            const data = await res.json();
            if (data.success) {
                onSuccess(data.item);
                onClose();
            } else {
                setError(data.error || 'Erreur lors de l\'envoi.');
            }
        } catch {
            setError('Erreur réseau. Réessaie plus tard.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const typeColors: Record<MusicType, string> = {
        mix: 'border-neon-purple/50 bg-neon-purple/10 text-neon-purple',
        track: 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan',
        remix: 'border-amber-400/50 bg-amber-400/10 text-amber-400',
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 30 }}
                className="relative z-10 bg-[#07070e] border border-white/10 rounded-[36px] w-full max-w-lg p-8 shadow-[0_40px_80px_rgba(0,0,0,0.7)]"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-[9px] font-black uppercase tracking-[0.35em] text-neon-purple block mb-1">COMMUNAUTÉ DROPSIDERS</span>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">Partager ma musique</h3>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/40 hover:text-white transition-all cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-5">
                    {/* Type selector */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Type de contenu</label>
                        <div className="grid grid-cols-3 gap-3">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setForm(f => ({ ...f, type: tab.id }))}
                                    className={`py-3 rounded-2xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                        form.type === tab.id
                                            ? typeColors[tab.id]
                                            : 'border-white/10 bg-white/[0.02] text-white/30 hover:text-white/60 hover:border-white/20'
                                    }`}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Inputs */}
                    {[
                        { key: 'title',     label: 'Titre',                   placeholder: 'Ex: Summer Vibes 2026' },
                        { key: 'artist',    label: 'Ton pseudo / Artiste',     placeholder: 'Ex: DJ Shadow' },
                        { key: 'embedUrl',  label: 'Lien SoundCloud / YouTube / Spotify', placeholder: 'https://soundcloud.com/...' },
                        { key: 'description', label: 'Description (optionnel)', placeholder: 'Quelques mots sur ce contenu...' },
                    ].map(field => (
                        <div key={field.key} className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/40">{field.label}</label>
                            {field.key === 'description' ? (
                                <textarea
                                    rows={2}
                                    value={(form as any)[field.key]}
                                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                                    placeholder={field.placeholder}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-purple/40 transition-all resize-none"
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={(form as any)[field.key]}
                                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                                    placeholder={field.placeholder}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-purple/40 transition-all"
                                />
                            )}
                        </div>
                    ))}

                    {error && (
                        <p className="text-neon-red text-[10px] font-black uppercase tracking-widest px-1">{error}</p>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full py-4 bg-neon-purple hover:brightness-110 text-white font-black text-xs uppercase tracking-[0.25em] rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_25px_rgba(176,38,255,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none cursor-pointer mt-2"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</>
                        ) : (
                            <><Upload className="w-4 h-4" /> Publier dans la Communauté</>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Music Card
// ─────────────────────────────────────────────────────────────────────────────
function MusicCard({ item, index }: { item: CommunityItem; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const [likes, setLikes] = useState(item.likes);
    const [liked, setLiked] = useState(() => {
        try { return (JSON.parse(localStorage.getItem('cm_liked') || '[]') as string[]).includes(item.id); } catch { return false; }
    });
    const [likeAnim, setLikeAnim] = useState(false);

    const tab = TABS.find(t => t.id === item.type) || TABS[0];

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (liked) return;
        setLikeAnim(true);
        setTimeout(() => setLikeAnim(false), 600);
        setLiked(true);
        setLikes(l => l + 1);
        // Persist liked state locally
        try {
            const arr = JSON.parse(localStorage.getItem('cm_liked') || '[]') as string[];
            localStorage.setItem('cm_liked', JSON.stringify([...arr, item.id]));
        } catch {}
        // Update server
        try {
            await fetch('/api/community-music/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id })
            });
        } catch {}
    };

    // Embed height
    const embedHeight = item.embedUrl?.includes('youtube') ? 200 : item.embedUrl?.includes('spotify') ? 80 : 120;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className={`group relative overflow-hidden rounded-[28px] border transition-all duration-500 ${
                expanded
                    ? 'bg-white/[0.04] border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.4)]'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
            }`}
        >
            {/* Left accent bar */}
            <div className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full transition-all duration-300 ${
                expanded ? `${tab.badge} shadow-[0_0_10px_${tab.glow}]` : 'bg-transparent'
            }`} />

            {/* Main row */}
            <div
                className="flex items-center gap-4 px-6 py-5 cursor-pointer select-none"
                onClick={() => setExpanded(v => !v)}
            >
                {/* Rank badge */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border text-[10px] font-black transition-all ${
                    expanded ? `${tab.badge}/20 border-${tab.badge}/30 ${tab.color}` : 'bg-white/5 border-white/5 text-white/20'
                }`}>
                    {index + 1}
                </div>

                {/* Type pill */}
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest flex-shrink-0 ${
                    expanded
                        ? `bg-white/5 border-white/10 ${tab.color}`
                        : 'bg-white/[0.02] border-white/5 text-white/20'
                }`}>
                    <tab.icon className="w-2.5 h-2.5" />
                    {tab.label}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-base font-black uppercase italic tracking-tight text-white truncate leading-none">
                        {item.title}
                    </h4>
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-0.5 transition-colors ${expanded ? tab.color : 'text-white/30'}`}>
                        {item.artist}
                    </p>
                </div>

                {/* Time */}
                <div className="hidden md:flex items-center gap-1 text-white/20 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">{timeAgo(item.uploadedAt)}</span>
                </div>

                {/* Like button */}
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer flex-shrink-0 ${
                        liked
                            ? 'bg-pink-500/10 border-pink-500/30 text-pink-500'
                            : 'bg-white/5 border-white/10 text-white/30 hover:border-pink-500/30 hover:text-pink-400 hover:bg-pink-500/5'
                    }`}
                >
                    <motion.div animate={likeAnim ? { scale: [1, 1.6, 1] } : {}}>
                        <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-pink-500' : ''}`} />
                    </motion.div>
                    <span className="text-[10px] font-black tabular-nums">{likes}</span>
                </button>

                {/* Expand toggle */}
                <button className={`p-2 rounded-xl border transition-all flex-shrink-0 ${
                    expanded ? 'bg-white/10 border-white/15 text-white' : 'bg-white/[0.02] border-white/5 text-white/20'
                }`}>
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {/* Expandable embed */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/5"
                    >
                        <div className="p-6 space-y-4">
                            {item.description && (
                                <p className="text-sm text-white/50 font-medium italic leading-relaxed border-l-2 border-white/10 pl-4">
                                    "{item.description}"
                                </p>
                            )}

                            {item.embedUrl ? (
                                <div className={`rounded-2xl overflow-hidden border border-white/10 bg-black/60 ${
                                    item.embedUrl.includes('youtube') ? 'aspect-video' : ''
                                }`}>
                                    <iframe
                                        src={item.embedUrl}
                                        width="100%"
                                        height={embedHeight}
                                        frameBorder="0"
                                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                        allowFullScreen
                                        scrolling="no"
                                        className="block w-full"
                                    />
                                </div>
                            ) : (
                                <div className="py-8 flex flex-col items-center gap-3 text-white/20">
                                    <Disc3 className="w-8 h-8 animate-spin-slow" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Aperçu non disponible</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2 text-white/20">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">{timeAgo(item.uploadedAt)}</span>
                                </div>
                                {item.embedUrl && (
                                    <a
                                        href={item.embedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        Ouvrir
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export function CommunityMusicSection() {
    const [activeType, setActiveType] = useState<MusicType>('mix');
    const [items, setItems] = useState<Record<MusicType, CommunityItem[]>>({ mix: [], track: [], remix: [] });
    const [loading, setLoading] = useState<Record<MusicType, boolean>>({ mix: true, track: true, remix: true });
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [successToast, setSuccessToast] = useState('');

    const showToast = (msg: string) => { setSuccessToast(msg); setTimeout(() => setSuccessToast(''), 4000); };

    // Fetch all three types in parallel on mount
    useEffect(() => {
        const types: MusicType[] = ['mix', 'track', 'remix'];
        types.forEach(type => {
            fetch(`/api/community-music?type=${type}&limit=5`)
                .then(r => r.json())
                .then((data: CommunityItem[]) => {
                    setItems(prev => ({ ...prev, [type]: Array.isArray(data) ? data : [] }));
                    setLoading(prev => ({ ...prev, [type]: false }));
                })
                .catch(() => setLoading(prev => ({ ...prev, [type]: false })));
        });
    }, []);

    const handleSuccess = (item: CommunityItem) => {
        setItems(prev => ({
            ...prev,
            [item.type]: [item, ...prev[item.type]].slice(0, 5)
        }));
        setActiveType(item.type);
        showToast(`"${item.title}" publié avec succès ! 🎧`);
    };

    const currentItems = items[activeType];
    const isLoading = loading[activeType];

    const totalCount = Object.values(items).reduce((sum, arr) => sum + arr.length, 0);

    return (
        <div className="space-y-8">
            {/* Section header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-neon-purple/10 rounded-xl border border-neon-purple/20 shadow-[0_0_20px_rgba(176,38,255,0.1)]">
                        <Users className="w-5 h-5 text-neon-purple" />
                    </div>
                    <div>
                        <span className="text-neon-purple font-black uppercase text-[9px] tracking-[0.35em] block">UPLOADS COMMUNAUTÉ</span>
                        <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter leading-none">
                            Mixes de la Communauté
                        </h2>
                    </div>
                </div>

                {/* Upload CTA */}
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-2.5 px-6 py-3.5 bg-neon-purple hover:brightness-110 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-[1.03] active:scale-95 shadow-[0_0_25px_rgba(176,38,255,0.25)] cursor-pointer flex-shrink-0"
                >
                    <Upload className="w-4 h-4" />
                    Partager ma musique
                </button>
            </div>

            {/* Sub-tabs: Mixes / Tracks / Remixes */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
                {TABS.map(tab => {
                    const isActive = activeType === tab.id;
                    const count = items[tab.id].length;
                    return (
                        <motion.button
                            key={tab.id}
                            onClick={() => setActiveType(tab.id)}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            className={`relative flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] border transition-all duration-300 flex-shrink-0 cursor-pointer ${
                                isActive
                                    ? `${tab.badge} text-white border-transparent shadow-[0_0_20px_${tab.glow}]`
                                    : 'bg-white/[0.03] border-white/8 text-white/40 hover:text-white/70 hover:border-white/15'
                            }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                            {/* Count badge */}
                            {count > 0 && (
                                <span className={`w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center flex-shrink-0 ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/40'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </motion.button>
                    );
                })}

                {/* Total count */}
                {totalCount > 0 && (
                    <div className="ml-auto flex items-center gap-1.5 text-white/20 flex-shrink-0">
                        <Flame className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{totalCount} uploads</span>
                    </div>
                )}
            </div>

            {/* Content area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeType}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.18 }}
                >
                    {isLoading ? (
                        <div className="py-24 flex flex-col items-center gap-4">
                            <div className="relative">
                                <Loader2 className="w-10 h-10 text-neon-purple animate-spin" />
                                <div className="absolute inset-0 rounded-full blur-lg bg-neon-purple/20 animate-pulse" />
                            </div>
                            <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Chargement des uploads...</p>
                        </div>
                    ) : currentItems.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-20 border border-dashed border-white/8 rounded-[36px] flex flex-col items-center gap-6 text-center"
                        >
                            {/* Animated empty state icon */}
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-neon-purple/5 border border-neon-purple/10 flex items-center justify-center">
                                    {(() => { const T = TABS.find(t => t.id === activeType)!; return <T.icon className={`w-8 h-8 ${T.color} opacity-40`} />; })()}
                                </div>
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-neon-purple/10 border border-neon-purple/20 rounded-full flex items-center justify-center">
                                    <Upload className="w-3 h-3 text-neon-purple/60" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-white/30 font-black uppercase tracking-widest text-sm">
                                    Aucun {activeType === 'mix' ? 'mix' : activeType === 'track' ? 'track' : 'remix'} pour l'instant
                                </p>
                                <p className="text-white/15 text-[10px] font-medium">Sois le premier à en partager un !</p>
                            </div>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="px-8 py-3.5 bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/20 text-neon-purple font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-[1.03] cursor-pointer"
                            >
                                Partager le premier →
                            </button>
                        </motion.div>
                    ) : (
                        <div className="space-y-3">
                            {currentItems.map((item, i) => (
                                <MusicCard key={item.id} item={item} index={i} />
                            ))}

                            {/* "Voir plus" teaser if exactly 5 items */}
                            {currentItems.length === 5 && (
                                <div className="pt-2 text-center">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/15">
                                        Affichage des 5 derniers uploads · Partage le tien pour qu'il apparaisse ici !
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Upload modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <UploadModal
                        onClose={() => setShowUploadModal(false)}
                        onSuccess={handleSuccess}
                    />
                )}
            </AnimatePresence>

            {/* Success toast */}
            <AnimatePresence>
                {successToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[3000] px-6 py-3.5 bg-black/90 border border-neon-purple/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-center gap-3 text-neon-purple text-xs font-black uppercase tracking-widest"
                    >
                        <Check className="w-4 h-4" />
                        <span>{successToast}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default CommunityMusicSection;
