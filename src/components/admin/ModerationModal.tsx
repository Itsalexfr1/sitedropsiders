import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Trash2, Camera, User, Instagram, Clock, MapPin, MessageSquare, BookOpen, Edit2, Upload } from 'lucide-react';
import { getAuthHeaders } from '../../utils/auth';
import WIKI_DJS from '../../data/wiki_djs.json';
import WIKI_CLUBS from '../../data/wiki_clubs.json';
import WIKI_FESTIVALS from '../../data/wiki_festivals.json';

interface Submission {
    id: string;
    userName: string;
    festivalName: string;
    instagram?: string;
    anecdote?: string;
    imageUrl: string;
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
}

interface ModerationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ModerationModal({ isOpen, onClose }: ModerationModalProps) {
    const [tab, setTab] = useState<'photos' | 'wiki'>('photos');
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [wikiWaiting, setWikiWaiting] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPending = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/photos/pending', {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setSubmissions(Array.isArray(data) ? data : []);
            }
            
            // Fetch wiki waiting items
            const djs = (WIKI_DJS as any[]).filter(d => d.status === 'waiting').map(d => ({ ...d, type: 'DJS' }));
            const clubs = (WIKI_CLUBS as any[]).filter(c => c.status === 'waiting').map(c => ({ ...c, type: 'CLUBS' }));
            const fests = (WIKI_FESTIVALS as any[]).filter(f => f.status === 'waiting').map(f => ({ ...f, type: 'FESTIVALS' }));
            setWikiWaiting([...djs, ...clubs, ...fests]);

        } catch (error) {
            console.error('Error fetching pending photos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchPending();
        }
    }, [isOpen]);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            const response = await fetch('/api/photos/moderate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ id, action })
            });

            if (response.ok) {
                setSubmissions(prev => prev.filter(s => s.id !== id));
            } else {
                const err = await response.json();
                alert('Erreur lors de la modération : ' + (err.error || 'Erreur inconnue'));
            }
        } catch (error) {
            console.error('Moderation error:', error);
            alert('Erreur de connexion lors de la modération');
        }
    };

    const handleUpdateWikiPhoto = async (id: string, type: string) => {
        const imageUrl = prompt('Entrez l\'URL de la photo officielle :');
        if (!imageUrl) return;

        try {
            const response = await fetch('/api/wiki/update-photo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ id, type, imageUrl })
            });

            if (response.ok) {
                setWikiWaiting(prev => prev.filter(item => item.id !== id));
                // Optionnel: rafraîchir les données locales si nécessaire
            } else {
                const err = await response.json();
                alert('Erreur : ' + (err.error || 'Inconnue'));
            }
        } catch (error) {
            console.error('Update error:', error);
            alert('Erreur de connexion');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/90 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-left my-8"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-neon-green/10 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-neon-green/20 rounded-2xl">
                                <Camera className="w-6 h-6 text-neon-green" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                                    MODÉRATION <span className="text-neon-green">COMMUNAUTÉ</span>
                                </h2>
                                <div className="flex gap-4 mt-2">
                                    <button 
                                        onClick={() => setTab('photos')} 
                                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${tab === 'photos' ? 'bg-neon-green text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                                    >
                                        Photos Viewers ({submissions.length})
                                    </button>
                                    <button 
                                        onClick={() => setTab('wiki')} 
                                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${tab === 'wiki' ? 'bg-neon-red text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                                    >
                                        Wiki Waiting ({wikiWaiting.length})
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {isLoading ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-neon-green border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Chargement...</span>
                            </div>
                        ) : tab === 'photos' ? (
                            submissions.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-6 opacity-30">
                                    <Check className="w-16 h-16 text-neon-green" />
                                    <span className="text-xl font-black uppercase italic text-white tracking-widest">Toutes les photos sont modérées</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <AnimatePresence>
                                        {submissions.map((sub) => (
                                            <motion.div
                                                key={sub.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="group relative bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden hover:border-white/20 transition-all duration-500"
                                            >
                                                <div className="aspect-video relative overflow-hidden">
                                                    <img src={sub.imageUrl} alt="Submission" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>

                                                <div className="p-6 space-y-4">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <User className="w-3 h-3 text-neon-green" />
                                                                <span className="text-xs font-black text-white uppercase">{sub.userName}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="w-3 h-3 text-gray-500" />
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{sub.festivalName}</span>
                                                            </div>
                                                            {sub.instagram && (
                                                                <div className="flex items-center gap-2">
                                                                    <Instagram className="w-3 h-3 text-pink-500" />
                                                                    <span className="text-[10px] font-bold text-pink-500 uppercase tracking-tight">{sub.instagram}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[8px] font-bold text-gray-600 uppercase">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(sub.timestamp).toLocaleDateString()}
                                                        </div>
                                                    </div>

                                                    {sub.anecdote && (
                                                        <div className="p-3 bg-white/5 border-l-2 border-neon-green rounded-r-xl">
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1 flex items-center gap-2 items-center">
                                                                <MessageSquare className="w-3 h-3 text-neon-green" />
                                                                ANECDOTE :
                                                            </p>
                                                            <p className="text-[11px] text-white italic leading-relaxed">
                                                                "{sub.anecdote}"
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2 pt-2">
                                                        <button
                                                            onClick={() => handleAction(sub.id, 'approve')}
                                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-neon-green text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all"
                                                        >
                                                            <Check className="w-4 h-4" /> ACCEPTER
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(sub.id, 'reject')}
                                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-neon-red text-white hover:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" /> REJETER
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )
                        ) : (
                            /* WIKI TAB */
                            wikiWaiting.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-6 opacity-30">
                                    <BookOpen className="w-16 h-16 text-neon-red" />
                                    <span className="text-xl font-black uppercase italic text-white tracking-widest">Tout est à jour</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {wikiWaiting.map((item) => (
                                        <div key={item.id} className="bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden p-6 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-black text-white uppercase italic">{item.name}</h3>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.city}, {item.country}</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${
                                                    item.type === 'CLUBS' ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30' : 
                                                    item.type === 'FESTIVALS' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 
                                                    'bg-neon-red/20 text-neon-red border border-neon-red/30'}`}>
                                                    {item.type}
                                                </span>
                                            </div>
                                            <div className="aspect-video bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-600">
                                                <Upload className="w-8 h-8 opacity-20" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">En attente de photo officielle</span>
                                            </div>
                                            <button 
                                                onClick={() => handleUpdateWikiPhoto(item.id, item.type)}
                                                className="w-full py-3 bg-white/5 border border-white/10 hover:bg-neon-red/10 hover:border-neon-red/30 hover:text-neon-red text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" /> METTRE À JOUR LA PHOTO
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-black/40 border-t border-white/5 text-center">
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-600">
                            DROPSIDERS MODERATION SYSTEM V2 • 01061988
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
