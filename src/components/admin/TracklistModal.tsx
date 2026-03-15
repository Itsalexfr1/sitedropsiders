import { useState } from 'react';

import { motion } from 'framer-motion';
import { 
    X, Trash2, Music, 
    Search, Plus, Layout
} from 'lucide-react';


interface Track {
    title: string;
    artist: string;
    time: string;
    label?: string;
}

interface TracklistSubmission {
    id: string;
    title: string;
    artist: string;
    event?: string;
    date?: string;
    image?: string;
    tracks: Track[];
    status: 'pending' | 'validated';
    createdAt: string;
    validatedAt?: string;
    embedUrl?: string;
}

interface TracklistModalProps {
    isOpen: boolean;
    onClose: () => void;
    pendingTracklists: TracklistSubmission[];
    activeTracklists: TracklistSubmission[];
    onModerate: (id: string, action: 'approve' | 'delete' | 'update_validated' | 'delete_validated', updates?: any) => void;
    isLoading: boolean;
}


export function TracklistModal({ 
    isOpen, 
    onClose, 
    pendingTracklists, 
    activeTracklists, 
    onModerate,
    isLoading 
}: TracklistModalProps) {
    const [tab, setTab] = useState<'pending' | 'active'>('pending');
    const [editingTracklist, setEditingTracklist] = useState<TracklistSubmission | null>(null);
    const [search, setSearch] = useState('');

    const filteredList = (tab === 'pending' ? pendingTracklists : activeTracklists).filter(t => 
        t.title.toLowerCase().includes(search.toLowerCase()) || 
        t.artist.toLowerCase().includes(search.toLowerCase())
    );

    const handleEdit = (tracklist: TracklistSubmission) => {
        setEditingTracklist({ ...tracklist });
    };

    const handleSaveEdit = () => {
        if (!editingTracklist) return;
        const action = editingTracklist.status === 'validated' ? 'update_validated' : 'approve';
        onModerate(editingTracklist.id, action, editingTracklist);
        setEditingTracklist(null);
    };

    const addTrack = () => {
        if (!editingTracklist) return;
        const newTrack: Track = { title: '', artist: '', time: '', label: '' };
        setEditingTracklist({
            ...editingTracklist,
            tracks: [...editingTracklist.tracks, newTrack]
        });
    };

    const removeTrack = (index: number) => {
        if (!editingTracklist) return;
        const newTracks = [...editingTracklist.tracks];
        newTracks.splice(index, 1);
        setEditingTracklist({
            ...editingTracklist,
            tracks: newTracks
        });
    };

    const updateTrack = (index: number, field: keyof Track, value: string) => {
        if (!editingTracklist) return;
        const newTracks = [...editingTracklist.tracks];
        newTracks[index] = { ...newTracks[index], [field]: value };
        setEditingTracklist({
            ...editingTracklist,
            tracks: newTracks
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[90vh]"
            >
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-neon-purple/10 rounded-2xl border border-neon-purple/20">
                            <Music className="w-8 h-8 text-neon-purple" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tight">Gestion <span className="text-neon-purple">Tracklists</span></h2>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Validation et archivage des sets</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                            <button 
                                onClick={() => setTab('pending')}
                                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'pending' ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/20' : 'text-gray-500 hover:text-white'}`}
                            >
                                En Attente ({pendingTracklists.length})
                            </button>
                            <button 
                                onClick={() => setTab('active')}
                                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'active' ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/20' : 'text-gray-500 hover:text-white'}`}
                            >
                                Validées ({activeTracklists.length})
                            </button>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-gray-400 hover:text-white transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* List Aspect */}
                    <div className="w-1/3 border-r border-white/5 flex flex-col">
                        <div className="p-4 bg-white/[0.02]">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input 
                                    type="text" 
                                    placeholder="Rechercher un artiste, un titre..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs text-white placeholder:text-gray-600 focus:border-neon-purple/50 transition-all outline-none"
                                />
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-40">
                                    <div className="w-8 h-8 border-4 border-neon-purple/20 border-t-neon-purple rounded-full animate-spin" />
                                </div>
                            ) : filteredList.length === 0 ? (
                                <div className="text-center py-20">
                                    <Music className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Aucune tracklist trouvée</p>
                                </div>
                            ) : (
                                filteredList.map(t => (
                                    <button 
                                        key={t.id}
                                        onClick={() => handleEdit(t)}
                                        className={`w-full p-4 rounded-2xl border text-left transition-all ${editingTracklist?.id === t.id ? 'bg-neon-purple/10 border-neon-purple/40 shadow-lg shadow-neon-purple/5' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-[10px] font-black text-neon-purple uppercase tracking-widest">{t.artist}</p>
                                            <p className="text-[8px] font-bold text-gray-600">{new Date(t.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <h4 className="text-sm font-display font-black text-white uppercase italic leading-tight truncate">{t.title}</h4>
                                        <div className="mt-3 flex items-center gap-2">
                                            <div className="px-2 py-0.5 bg-black/40 rounded-md border border-white/5">
                                                <span className="text-[8px] font-black text-gray-400 uppercase">{t.tracks.length} TITRES</span>
                                            </div>
                                            {t.status === 'validated' && (
                                                <div className="px-2 py-0.5 bg-neon-green/10 rounded-md border border-neon-green/20">
                                                    <span className="text-[8px] font-black text-neon-green uppercase">VALIDÉE</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Edit Aspect */}
                    <div className="flex-1 bg-black/20 overflow-y-auto custom-scrollbar p-10">
                        {editingTracklist ? (
                            <div className="max-w-3xl mx-auto space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Titre de la tracklist</label>
                                            <input 
                                                type="text" 
                                                value={editingTracklist.title}
                                                onChange={(e) => setEditingTracklist({...editingTracklist, title: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xl font-display font-black text-white uppercase italic focus:border-neon-purple/50 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Artiste / DJ</label>
                                            <input 
                                                type="text" 
                                                value={editingTracklist.artist}
                                                onChange={(e) => setEditingTracklist({...editingTracklist, artist: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:border-neon-purple/50 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Événement</label>
                                                <input 
                                                    type="text" 
                                                    value={editingTracklist.event || ''}
                                                    onChange={(e) => setEditingTracklist({...editingTracklist, event: e.target.value})}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-neon-purple/50 transition-all outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Date du set</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="JJ/MM/AAAA"
                                                    value={editingTracklist.date || ''}
                                                    onChange={(e) => setEditingTracklist({...editingTracklist, date: e.target.value})}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-neon-purple/50 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Embed URL (Youtube/Soundcloud)</label>
                                            <input 
                                                type="text" 
                                                value={editingTracklist.embedUrl || ''}
                                                onChange={(e) => setEditingTracklist({...editingTracklist, embedUrl: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-neon-purple/50 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tracklist */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">Liste des <span className="text-neon-purple">Morceaux</span></h3>
                                        <button 
                                            onClick={addTrack}
                                            className="flex items-center gap-2 px-4 py-2 bg-neon-purple/10 border border-neon-purple/20 rounded-xl text-neon-purple text-[10px] font-black uppercase tracking-widest hover:bg-neon-purple hover:text-white transition-all shadow-lg shadow-neon-purple/10"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Ajouter Titre
                                        </button>
                                    </div>
                                    
                                    <div className="bg-black/40 border border-white/5 rounded-[2rem] overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-white/10 bg-white/[0.02]">
                                                    <th className="px-6 py-4 text-[9px] font-black text-gray-600 uppercase tracking-widest w-20">Time</th>
                                                    <th className="px-6 py-4 text-[9px] font-black text-gray-600 uppercase tracking-widest">Artiste</th>
                                                    <th className="px-6 py-4 text-[9px] font-black text-gray-600 uppercase tracking-widest">Titre</th>
                                                    <th className="px-6 py-4 text-[9px] font-black text-gray-600 uppercase tracking-widest">Label</th>
                                                    <th className="px-6 py-4 text-[9px] font-black text-gray-600 uppercase tracking-widest w-16"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {editingTracklist.tracks.map((track, idx) => (
                                                    <tr key={idx} className="group hover:bg-white/[0.02]">
                                                        <td className="px-4 py-3">
                                                            <input 
                                                                type="text" 
                                                                value={track.time}
                                                                onChange={(e) => updateTrack(idx, 'time', e.target.value)}
                                                                placeholder="00:00"
                                                                className="w-full bg-transparent border-none text-[10px] font-black text-neon-purple outline-none focus:text-white"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input 
                                                                type="text" 
                                                                value={track.artist}
                                                                onChange={(e) => updateTrack(idx, 'artist', e.target.value)}
                                                                placeholder="Artiste"
                                                                className="w-full bg-transparent border-none text-[11px] font-bold text-white outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input 
                                                                type="text" 
                                                                value={track.title}
                                                                onChange={(e) => updateTrack(idx, 'title', e.target.value)}
                                                                placeholder="Titre"
                                                                className="w-full bg-transparent border-none text-[11px] font-bold text-white outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input 
                                                                type="text" 
                                                                value={track.label || ''}
                                                                onChange={(e) => updateTrack(idx, 'label', e.target.value)}
                                                                placeholder="Label"
                                                                className="w-full bg-transparent border-none text-[10px] font-bold text-gray-500 outline-none focus:text-gray-300"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <button 
                                                                onClick={() => removeTrack(idx)}
                                                                className="p-2 text-gray-700 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-10 border-t border-white/5 flex justify-between items-center">
                                    <button 
                                        onClick={() => {
                                            if (confirm('Supprimer cette tracklist ?')) {
                                                const action = editingTracklist.status === 'validated' ? 'delete_validated' : 'delete';
                                                onModerate(editingTracklist.id, action);
                                                setEditingTracklist(null);
                                            }
                                        }}
                                        className="px-8 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/10"
                                    >
                                        Supprimer
                                    </button>
                                    
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => setEditingTracklist(null)}
                                            className="px-8 py-4 bg-white/5 border border-white/10 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
                                        >
                                            Annuler
                                        </button>
                                        <button 
                                            onClick={handleSaveEdit}
                                            className="px-10 py-4 bg-neon-green text-black font-black uppercase tracking-[0.2em] rounded-2xl text-[11px] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-neon-green/30"
                                        >
                                            {editingTracklist.status === 'validated' ? 'Mettre à jour' : 'Approuver & Publier'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center space-y-6">
                                    <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto blur-sm">
                                        <Layout className="w-10 h-10 text-gray-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter opacity-50">Sélectionnez une tracklist</h3>
                                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-2">Pour la visualiser ou la modifier</p>
                                    </div>
                                    <button 
                                        onClick={() => setEditingTracklist({
                                            id: 'new',
                                            title: 'NOUVELLE TRACKLIST',
                                            artist: '',
                                            tracks: [],
                                            status: 'pending',
                                            createdAt: new Date().toISOString()
                                        })}
                                        className="px-8 py-4 bg-neon-purple text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-neon-purple/30 hover:scale-105 transition-all"
                                    >
                                        + Créer manuellement
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
