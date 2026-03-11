import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Music, Youtube, ExternalLink, Clock, User as UserIcon, MessageSquare, CheckCircle, Send, Heart } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

type TrackRequest = {
    id: string;
    title: string;
    desc: string;
    author: string;
    timestamp: string;
    youtubeUrl: string;
    solved: boolean;
    result?: string;
    replies: number;
};

const STORAGE_KEY = 'dropsiders_track_requests';

function getRequests(): TrackRequest[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveRequests(reqs: TrackRequest[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reqs));
}

export function TrackIdForum() {
    const { isLoggedIn, user, toggleTrackId } = useUser();
    const [requests, setRequests] = useState<TrackRequest[]>(getRequests);
    const [showForm, setShowForm] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    useEffect(() => {
        if (isLoggedIn && user && !form.author) {
            setForm(p => ({ ...p, author: user.username }));
        }
    }, [isLoggedIn, user]);

    const [form, setForm] = useState({
        title: '',
        desc: '',
        author: '',
        youtubeUrl: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.author) return;

        setSubmitStatus('loading');

        const newRequest: TrackRequest = {
            id: `req_${Date.now()}`,
            title: form.title,
            desc: form.desc,
            author: form.author,
            youtubeUrl: form.youtubeUrl,
            timestamp: new Date().toISOString(),
            solved: false,
            replies: 0,
        };

        // Try API first, fallback local
        try {
            const res = await fetch('/api/trackid/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRequest),
            });
            if (!res.ok) throw new Error('API unavailable');
        } catch {
            // store locally
        }

        const updated = [newRequest, ...requests];
        setRequests(updated);
        saveRequests(updated);

        setSubmitStatus('success');
        setTimeout(() => {
            setSubmitStatus('idle');
            setShowForm(false);
            setForm({ title: '', desc: '', author: '', youtubeUrl: '' });
        }, 1500);
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter">Track ID Request</h2>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">C'est quoi ce son ? La communauté t'aide à trouver</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-6 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-neon-red hover:text-white transition-all"
                >
                    {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showForm ? 'ANNULER' : 'DEMANDER UN ID'}
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
                        className="bg-white/5 border border-neon-red/20 rounded-3xl p-8 space-y-5"
                    >
                        <h3 className="text-lg font-black text-white uppercase italic mb-4 flex items-center gap-2">
                            <Music className="w-5 h-5 text-neon-red" />
                            Soumettre une demande de Track ID
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Description du son *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder="Ex: Son techno avec une montée autour de 1h15..."
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
                                    placeholder="Alex"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-neon-red transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Lien YouTube (timestamp si possible)</label>
                            <input
                                type="url"
                                value={form.youtubeUrl}
                                onChange={e => setForm(p => ({ ...p, youtubeUrl: e.target.value }))}
                                placeholder="https://youtube.com/watch?v=...&t=4500"
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-neon-red transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Contexte supplémentaire</label>
                            <textarea
                                value={form.desc}
                                onChange={e => setForm(p => ({ ...p, desc: e.target.value }))}
                                placeholder="Festival ? DJ set ? Date et lieu ?"
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
                                <><CheckCircle className="w-4 h-4" />Envoyé !</>
                            ) : (
                                <><Send className="w-4 h-4" />Envoyer ma demande</>
                            )}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* List */}
            {requests.length === 0 ? (
                <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                    <Music className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Aucune demande pour l'instant.</p>
                    <p className="text-gray-600 text-xs mt-1">Sois le premier à soumettre un Track ID !</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((req, idx) => (
                        <motion.div
                            key={req.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-4 hover:border-white/20 transition-all relative overflow-hidden"
                        >
                            {req.solved && (
                                <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest rounded-bl-2xl">
                                    TROUVÉ !
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-4">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <UserIcon className="w-3 h-3" /> {req.author}
                                </span>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" /> {formatDate(req.timestamp)}
                                </span>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <MessageSquare className="w-3 h-3" /> {req.replies} réponses
                                </span>
                            </div>

                            <div>
                                <h3 className="text-lg font-display font-black text-white italic uppercase tracking-tight">{req.title}</h3>
                                {req.desc && <p className="text-gray-400 text-xs leading-relaxed mt-1">{req.desc}</p>}
                            </div>

                            {req.youtubeUrl && (
                                <a
                                    href={req.youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[9px] font-black uppercase hover:bg-red-500/20 transition-all"
                                >
                                    <Youtube className="w-3.5 h-3.5" />
                                    Écouter sur YouTube
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}

                            {req.solved && req.result && (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-emerald-500 text-black rounded-xl flex items-center justify-center shrink-0">
                                            <Music className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-[8px] font-black text-emerald-500 uppercase mb-0.5">Track Identifiée</div>
                                            <div className="text-[10px] font-black text-white uppercase">{req.result}</div>
                                        </div>
                                    </div>
                                    {isLoggedIn && (
                                        <button
                                            onClick={() => toggleTrackId(req.result!)}
                                            className={twMerge(
                                                "p-3 rounded-xl transition-all",
                                                user?.trackIds.includes(req.result!)
                                                    ? "bg-neon-red text-white shadow-[0_0_15px_rgba(255,0,51,0.4)]"
                                                    : "bg-white/5 text-gray-500 hover:text-white"
                                            )}
                                            title="Sauvegarder dans mon profil"
                                        >
                                            <Heart className={twMerge("w-4 h-4", user?.trackIds.includes(req.result!) && "fill-current")} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
