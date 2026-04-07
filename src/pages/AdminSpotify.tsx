import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, ArrowLeft, Save, Loader2, CheckCircle2, AlertCircle, Trash2, Plus } from 'lucide-react';
import { Link, useBlocker } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
import { ConfirmationModal } from '../components/ConfirmationModal';
import spotifyData from '../data/spotify.json';

export function AdminSpotify() {
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    // Prompt before internal React Router navigation
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            hasChanges && currentLocation.pathname !== nextLocation.pathname
    );

    // Confirm navigation handled by ConfirmationModal component in JSX

    // Prompt before window reload/close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasChanges]);

    useEffect(() => {
        const fetchPlaylists = async () => {
            try {
                const response = await fetch(`/api/spotify?t=${Date.now()}`);
                if (response.ok) {
                    const data = await response.json();
                    setPlaylists(data);
                } else {
                    setPlaylists(spotifyData);
                }
            } catch (error: any) {
                setPlaylists(spotifyData);
            }
        };
        fetchPlaylists();
    }, []);

    const handleUpdateUrl = (id: number, url: string) => {
        let finalUrl = url;
        // Transform standard share link to embed link if needed
        if (url.includes('open.spotify.com') && !url.includes('/embed/')) {
            finalUrl = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
            if (!finalUrl.includes('?')) {
                finalUrl += '?utm_source=generator&theme=0';
            }
        }

        setPlaylists((prev: any[]) => prev.map((p: any) => p.id === id ? { ...p, url: finalUrl } : p));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setStatus('loading');
        setMessage('Sauvegarde en cours...');

        try {
            const response = await fetch('/api/spotify/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ playlists })
            });

            if (response.ok) {
                setStatus('success');
                setMessage('Playlists mises à jour avec succès !');
                setHasChanges(false);
                // Force a small delay then refresh or just keep status
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                const err = await response.json();
                setStatus('error');
                setMessage(err.error || 'Erreur lors de la sauvegarde');
            }
        } catch (error: any) {
            setStatus('error');
            setMessage('Erreur de connexion');
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg py-32">
            <div className="max-w-full mx-auto px-4 md:px-12">
                <div className="flex items-center gap-6 mb-12">
                    <Link to="/admin" className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white group">
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-neon-green/10 rounded-2xl">
                            <Music className="w-8 h-8 text-neon-green" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter">
                                Gestion <span className="text-neon-green">Spotify</span>
                            </h1>
                            <p className="text-gray-400">Configurez ou supprimez vos playlists d'accueil</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Status Message */}
                    {status !== 'idle' && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl flex items-center gap-3 border ${status === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                            {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <span className="font-bold uppercase tracking-widest text-xs">{message}</span>
                        </motion.div>
                    )}

                    <div className="flex flex-col gap-6">
                        {playlists.map((playlist: any, index: number) => (
                            <motion.div
                                key={playlist.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="border border-white/10 rounded-3xl p-6 space-y-4 w-full transition-all hover:border-white/20"
                                style={{ backgroundColor: `${playlist.color}11` }}
                            >
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
                                            style={{
                                                backgroundColor: `${playlist.color}33`,
                                                color: playlist.color
                                            }}
                                        >
                                            {index + 1}
                                        </div>
                                        <h3 className="text-white font-display font-bold uppercase italic">{playlist.title || `Playlist ${index + 1}`}</h3>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setPlaylists((prev: any[]) => prev.filter((p: any) => p.id !== playlist.id));
                                            setHasChanges(true);
                                        }}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors group"
                                        title="Supprimer la playlist"
                                    >
                                        <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Titre de la Playlist</label>
                                        <input
                                            type="text"
                                            value={playlist.title}
                                            onChange={(e) => {
                                                setPlaylists((prev: any[]) => prev.map((p: any) => p.id === playlist.id ? { ...p, title: e.target.value } : p));
                                                setHasChanges(true);
                                            }}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none transition-colors"
                                            style={{ accentColor: playlist.color }}
                                            onFocus={(e) => (e.target.style.borderColor = playlist.color)}
                                            onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                                            placeholder="Ex: PLAYLIST 1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Lien de partage Spotify</label>
                                        <input
                                            type="text"
                                            value={playlist.url}
                                            onChange={(e) => handleUpdateUrl(playlist.id, e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none transition-colors"
                                            style={{ accentColor: playlist.color }}
                                            onFocus={(e) => (e.target.style.borderColor = playlist.color)}
                                            onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                                            placeholder="https://open.spotify.com/playlist/..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Couleur d'accentuation</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={playlist.color || '#1DB954'}
                                                onChange={(e) => {
                                                    setPlaylists((prev: any[]) => prev.map((p: any) => p.id === playlist.id ? { ...p, color: e.target.value } : p));
                                                    setHasChanges(true);
                                                }}
                                                className="w-12 h-12 rounded-xl border border-white/10 bg-black/40 p-1 cursor-pointer outline-none overflow-hidden"
                                            />
                                            <input
                                                type="text"
                                                value={playlist.color || '#1DB954'}
                                                onChange={(e) => {
                                                    setPlaylists((prev: any[]) => prev.map((p: any) => p.id === playlist.id ? { ...p, color: e.target.value } : p));
                                                    setHasChanges(true);
                                                }}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none uppercase font-mono"
                                                placeholder="#000000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {playlist.url && (
                                    <div className="pt-4 mt-4 border-t border-white/5 pointer-events-none">
                                        <p className="text-[10px] font-black text-gray-600 uppercase mb-2">Aperçu</p>
                                        <iframe
                                            src={playlist.url}
                                            width="100%"
                                            height="80"
                                            frameBorder="0"
                                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                            className="rounded-lg bg-black/20"
                                        />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    <div className="pt-8 flex flex-col gap-4">
                        <button
                            onClick={() => {
                                const newId = playlists.length > 0 ? Math.max(...playlists.map((p: any) => p.id)) + 1 : 1;
                                setPlaylists((prev: any[]) => [...prev, { id: newId, title: `PLAYLIST ${newId}`, url: '', color: '#1DB954' }]);
                                setHasChanges(true);
                            }}
                            className="w-full py-4 border-2 border-dashed border-white/10 text-gray-400 font-display font-black text-lg uppercase italic tracking-tighter rounded-2xl hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-3"
                        >
                            <Plus className="w-6 h-6" /> Ajouter un encart Playlist dynamique
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={status === 'loading'}
                            className="w-full py-4 bg-neon-green text-black font-display font-black text-lg uppercase italic tracking-tighter rounded-2xl hover:bg-neon-green/80 transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(57,255,20,0.2)] disabled:opacity-50"
                        >
                            {status === 'loading' ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                            Enregistrer les modifications
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={blocker.state === "blocked"}
                message="Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter la page ?"
                onConfirm={() => blocker.proceed?.()}
                onCancel={() => blocker.reset?.()}
                accentColor="neon-red"
            />
        </div>
    );
}
