import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CheckSquare, Trash2, Camera, User, Instagram, Clock, MapPin, MessageSquare, BookOpen, Upload, Plus } from 'lucide-react';
import { getAuthHeaders } from '../../utils/auth';
import { PromptModal } from '../ui/PromptModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ImageUploadModal } from '../ImageUploadModal';


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
    onSuccess?: () => void;
}

export function ModerationModal({ isOpen, onClose, onSuccess }: ModerationModalProps) {
    const [tab, setTab] = useState<'photos' | 'wiki'>('photos');
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [wikiWaiting, setWikiWaiting] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [promptState, setPromptState] = useState<{
        isOpen: boolean;
        itemId: string;
        itemType: string;
        itemName: string;
    }>({
        isOpen: false,
        itemId: '',
        itemType: '',
        itemName: ''
    });
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isAddingWiki, setIsAddingWiki] = useState(false);
    const [newWikiType, setNewWikiType] = useState<'DJS' | 'CLUBS' | 'FESTIVALS'>('DJS');
    const [newWikiForm, setNewWikiForm] = useState({
        name: '',
        city: '',
        country: 'Intl',
        image: '',
        instagram: '',
        website: '',
        spotify: '',
        bio: ''
    });
    const [isSavingNewWiki, setIsSavingNewWiki] = useState(false);

    // ─── Multi-select state ───────────────────────────────────────────────────
    const [selectMode, setSelectMode] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'danger' | 'warning' | 'info';
        isConfirm: boolean;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger',
        isConfirm: false,
        onConfirm: () => {}
    });

    const showAlert = (message: string, title = 'DROPSIDERS.FR INDIQUE', type: 'danger' | 'warning' | 'info' = 'danger') => {
        setAlertConfig({
            isOpen: true,
            title,
            message,
            type,
            isConfirm: false,
            onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false }))
        });
    };

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
            
            // Fetch wiki live data for real-time moderation
            const [djsRes, clubsRes, festsRes] = await Promise.all([
                fetch('/api/wiki/list?type=DJS'),
                fetch('/api/wiki/list?type=CLUBS'),
                fetch('/api/wiki/list?type=FESTIVALS')
            ]);
            
            let djs: any[] = [];
            let clubs: any[] = [];
            let fests: any[] = [];
            
            if (djsRes.ok) djs = (await djsRes.json()).filter((d: any) => d.status === 'waiting').map((d: any) => ({ ...d, type: 'DJS' }));
            if (clubsRes.ok) clubs = (await clubsRes.json()).filter((c: any) => c.status === 'waiting').map((c: any) => ({ ...c, type: 'CLUBS' }));
            if (festsRes.ok) fests = (await festsRes.json()).filter((f: any) => f.status === 'waiting').map((f: any) => ({ ...f, type: 'FESTIVALS' }));
            
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

    useEffect(() => { if (!selectMode) setSelected(new Set()); }, [selectMode]);
    useEffect(() => { setSelectMode(false); setSelected(new Set()); }, [tab]);

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAll = () => setSelected(new Set(submissions.map(s => s.id)));
    const deselectAll = () => setSelected(new Set());

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
                setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
                if (onSuccess) onSuccess();
            } else {
                const err = await response.json();
                showAlert('Erreur lors de la modération : ' + (err.error || 'Erreur inconnue'));
            }
        } catch (error) {
            console.error('Moderation error:', error);
            showAlert('Erreur réseau lors de la mise à jour');
        }
    };

    const handleBulkAction = async (action: 'approve' | 'reject') => {
        if (selected.size === 0) return;
        setIsBulkProcessing(true);
        const ids = Array.from(selected);
        try {
            await Promise.all(ids.map(id =>
                fetch('/api/photos/moderate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify({ id, action })
                })
            ));
            setSubmissions(prev => prev.filter(s => !ids.includes(s.id)));
            setSelected(new Set());
            setSelectMode(false);
            if (onSuccess) onSuccess();
        } catch {
            showAlert('Erreur lors de la modération en masse');
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handleDeleteWiki = async (id: string, type: string, name: string) => {
        setAlertConfig({
            isOpen: true,
            title: 'Confirmation',
            message: `Supprimer définitivement "${name}" du Wiki ?`,
            type: 'warning',
            isConfirm: true,
            onConfirm: async () => {
                setAlertConfig(prev => ({ ...prev, isOpen: false }));
                try {
                    const response = await fetch('/api/wiki/delete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...getAuthHeaders()
                        },
                        body: JSON.stringify({ id, type })
                    });

                    if (response.ok) {
                        setWikiWaiting(prev => prev.filter(item => item.id !== id));
                        if (onSuccess) onSuccess();
                    } else {
                        const err = await response.json();
                        showAlert('Erreur : ' + (err.error || 'Inconnue'));
                    }
                } catch (error) {
                    console.error('Delete error:', error);
                    showAlert('Erreur réseau lors de la suppression');
                }
            }
        });
    };

    const [activeItem, setActiveItem] = useState<{ id: string, type: string, name: string } | null>(null);

    const handleUpdateWikiPhoto = (id: string, type: string, name: string) => {
        setActiveItem({ id, type, name });
        setIsUploadModalOpen(true);
    };

    const confirmWikiPhoto = async (imageUrl: string, overrideId?: string, overrideType?: string) => {
        const id = overrideId || activeItem?.id || promptState.itemId;
        const type = overrideType || activeItem?.type || promptState.itemType;
        
        if (!id || !type) {
            showAlert('Erreur: ID ou Type manquant');
            return;
        }

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
                if (onSuccess) onSuccess();
            } else {
                const err = await response.json();
                showAlert('Erreur : ' + (err.error || 'Inconnue'));
            }
        } catch (error) {
            console.error('Update error:', error);
            showAlert('Erreur de connexion lors de la validation');
        }
    };

    const handleAddWiki = async () => {
        if (!newWikiForm.name || !newWikiForm.image || !newWikiForm.instagram || (!newWikiForm.website && !newWikiForm.spotify)) {
            showAlert('Veuillez remplir les champs obligatoires : Nom, Photo, Instagram et Site/Spotify.', 'CHAMPS MANQUANTS', 'warning');
            return;
        }

        setIsSavingNewWiki(true);
        try {
            const entry = {
                ...newWikiForm,
                website: newWikiType !== 'DJS' ? newWikiForm.website : (newWikiForm.website || newWikiForm.spotify),
                description: newWikiForm.bio,
                description_en: newWikiForm.bio
            };

            const response = await fetch('/api/wiki/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ type: newWikiType, entry })
            });

            if (response.ok) {
                setIsAddingWiki(false);
                setNewWikiForm({ name: '', city: '', country: 'Intl', image: '', instagram: '', website: '', spotify: '', bio: '' });
                fetchPending();
                if (onSuccess) onSuccess();
            } else {
                const err = await response.json();
                showAlert('Erreur : ' + (err.error || 'Inconnue'));
            }
        } catch (error) {
            console.error('Add error:', error);
        } finally {
            setIsSavingNewWiki(false);
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
                                <div className="flex items-center gap-4 mb-10">
                                <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => setTab('photos')}
                                    className={`relative px-8 py-3 rounded-2xl font-black uppercase italic tracking-widest text-xs transition-all ${tab === 'photos' ? 'bg-neon-red text-white shadow-[0_0_20px_rgba(255,0,0,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                                    MODÉRATION PHOTOS ({submissions.length})
                                </motion.button>
                                <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => setTab('wiki')}
                                    className={`relative px-8 py-3 rounded-2xl font-black uppercase italic tracking-widest text-xs transition-all ${tab === 'wiki' ? 'bg-neon-purple text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                                    VÉRIFIER PHOTOS ({wikiWaiting.length})
                                </motion.button>
                                
                                <div className="ml-auto">
                                    <button 
                                        onClick={() => setIsAddingWiki(true)}
                                        className="px-6 py-3 bg-white/5 border border-white/10 hover:border-neon-red/50 text-white rounded-2xl font-black uppercase italic tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-xl"
                                    >
                                        <Plus className="w-3.5 h-3.5 text-neon-red" />
                                        Ajouter au Wiki
                                    </button>
                                </div>
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
                                <div className="space-y-4">
                                    {/* ── Toolbar ── */}
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <button
                                            onClick={() => setSelectMode(s => !s)}
                                            className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all flex items-center gap-2 ${selectMode ? 'bg-neon-orange/20 border-neon-orange/50 text-neon-orange' : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30'}`}
                                        >
                                            <CheckSquare className="w-3.5 h-3.5" />
                                            {selectMode ? 'Quitter sélection' : 'Sélection multiple'}
                                        </button>

                                        <AnimatePresence>
                                            {selectMode && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -8 }}
                                                    className="flex items-center gap-2 flex-wrap"
                                                >
                                                    <button onClick={selectAll} className="px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all">
                                                        Tout ({submissions.length})
                                                    </button>
                                                    {selected.size > 0 && (
                                                        <button onClick={deselectAll} className="px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all">
                                                            Désélectionner
                                                        </button>
                                                    )}
                                                    {selected.size > 0 && (
                                                        <>
                                                            <button
                                                                onClick={() => handleBulkAction('approve')}
                                                                disabled={isBulkProcessing}
                                                                className="px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest bg-neon-green/20 border border-neon-green/50 text-neon-green hover:bg-neon-green hover:text-black transition-all disabled:opacity-50"
                                                            >
                                                                <Check className="w-3.5 h-3.5 inline-block mr-1" />
                                                                Approuver ({selected.size})
                                                            </button>
                                                            <button
                                                                onClick={() => handleBulkAction('reject')}
                                                                disabled={isBulkProcessing}
                                                                className="px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest bg-neon-red/20 border border-neon-red/50 text-neon-red hover:bg-neon-red hover:text-white transition-all disabled:opacity-50"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5 inline-block mr-1" />
                                                                Rejeter ({selected.size})
                                                            </button>
                                                        </>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {selected.size > 0 && (
                                            <span className="ml-1 px-3 py-1 bg-neon-orange/20 text-neon-orange rounded-full text-[10px] font-black">
                                                {selected.size} sélectionnée{selected.size > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>

                                    {/* ── Grid ── */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <AnimatePresence>
                                            {submissions.map((sub) => {
                                                const isSelected = selected.has(sub.id);
                                                return (
                                                    <motion.div
                                                        key={sub.id}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        className={`group relative bg-white/[0.02] border rounded-[32px] overflow-hidden transition-all duration-300 ${isSelected ? 'border-neon-orange/60 shadow-[0_0_20px_rgba(255,140,0,0.15)]' : 'border-white/5 hover:border-white/20'}`}
                                                    >
                                                        {/* Checkbox */}
                                                        {selectMode && (
                                                            <button
                                                                onClick={() => toggleSelect(sub.id)}
                                                                className="absolute top-3 left-3 z-10"
                                                            >
                                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shadow-lg ${isSelected ? 'bg-neon-orange border-neon-orange' : 'bg-black/70 border-white/50 hover:border-white'}`}>
                                                                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                                                </div>
                                                            </button>
                                                        )}

                                                        <div
                                                            className={`aspect-video relative overflow-hidden ${selectMode ? 'cursor-pointer' : ''}`}
                                                            onClick={() => selectMode && toggleSelect(sub.id)}
                                                        >
                                                            <img src={sub.imageUrl} alt="Submission" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            {isSelected && <div className="absolute inset-0 bg-neon-orange/10" />}
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
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1 flex items-center gap-2">
                                                                        <MessageSquare className="w-3 h-3 text-neon-green" />
                                                                        ANECDOTE :
                                                                    </p>
                                                                    <p className="text-[11px] text-white italic leading-relaxed">"{sub.anecdote}"</p>
                                                                </div>
                                                            )}

                                                            {!selectMode && (
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
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>
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
                                                <button 
                                                    onClick={() => handleDeleteWiki(item.id, item.type, item.name)}
                                                    className="p-1 px-2.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500/60 rounded-lg text-[8px] font-black uppercase transition-all flex items-center gap-1 group/del"
                                                    title="Supprimer l'entrée"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    <span className="hidden group-hover/del:inline">Supprimer</span>
                                                </button>
                                            </div>
                                            <div className="aspect-[4/5] bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-600">
                                                <Upload className="w-8 h-8 opacity-20" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">En attente de photo officielle</span>
                                            </div>
                                            <button 
                                                onClick={() => handleUpdateWikiPhoto(item.id, item.type, item.name)}
                                                className="group relative w-full h-14 bg-neon-purple text-white font-black rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 overflow-hidden"
                                            >
                                                <span className="relative z-10 flex items-center gap-2">
                                                    <Upload className="w-3.5 h-3.5" /> UPLOADER LA PHOTO
                                                </span>
                                                <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[12px] border-r-[12px] border-b-transparent border-r-white/40" />
                                            </button>
                                            <button 
                                                onClick={() => setPromptState({ isOpen: true, itemId: item.id, itemType: item.type, itemName: item.name })}
                                                className="w-full py-2 text-[8px] font-black uppercase text-gray-600 hover:text-white transition-colors"
                                            >
                                                OU SAISIR UNE URL
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>

                    <PromptModal
                        isOpen={promptState.isOpen}
                        onClose={() => setPromptState(prev => ({ ...prev, isOpen: false }))}
                        onConfirm={(url) => {
                            confirmWikiPhoto(url, promptState.itemId, promptState.itemType);
                            setPromptState(prev => ({ ...prev, isOpen: false }));
                        }}
                        title={promptState.itemName}
                        message={`URL de la photo officielle pour ${promptState.itemName} :`}
                    />

                    <ImageUploadModal 
                        isOpen={isUploadModalOpen}
                        onClose={() => {
                            setIsUploadModalOpen(false);
                            setActiveItem(null);
                        }}
                        onUploadSuccess={(url) => {
                            confirmWikiPhoto(url);
                            setIsUploadModalOpen(false);
                            setActiveItem(null);
                        }}
                        accentColor="neon-purple"
                        aspect={4/5}
                    />

                    {/* Footer */}
                    <div className="p-6 bg-black/40 border-t border-white/5 text-center">
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-600">
                            DROPSIDERS MODERATION SYSTEM V2
                        </p>
                    </div>

                    {/* Quick Add Wiki Modal */}
                    <AnimatePresence>
                        {isAddingWiki && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#0a0a0a] border border-white/10 rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl">
                                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">Nouvelle Entrée Wiki</h3>
                                            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-neon-red mt-1">Ajout manuel direct</p>
                                        </div>
                                        <button onClick={() => setIsAddingWiki(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-6 h-6 text-white" /></button>
                                    </div>
                                    
                                    <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                                        <div className="grid grid-cols-3 gap-3">
                                            {(['DJS', 'CLUBS', 'FESTIVALS'] as const).map(t => (
                                                <button key={t} onClick={() => setNewWikiType(t)} className={`py-4 rounded-3xl font-black uppercase italic tracking-widest text-[10px] border transition-all ${newWikiType === t ? 'bg-neon-red border-neon-red text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}>
                                                    {t}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Nom de l'entrée *</label>
                                                <input type="text" value={newWikiForm.name} onChange={e => setNewWikiForm(p => ({ ...p, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none focus:border-neon-red transition-all" placeholder="Ex: Sebastian Ingrosso" />
                                            </div>
                                            {newWikiType !== 'DJS' && (
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Ville *</label>
                                                    <input type="text" value={newWikiForm.city} onChange={e => setNewWikiForm(p => ({ ...p, city: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none focus:border-neon-red transition-all" placeholder="Ex: Paris" />
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">URL de la photo *</label>
                                                <input type="text" value={newWikiForm.image} onChange={e => setNewWikiForm(p => ({ ...p, image: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none focus:border-neon-red transition-all" placeholder="https://..." />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Lien Instagram *</label>
                                                <input type="text" value={newWikiForm.instagram} onChange={e => setNewWikiForm(p => ({ ...p, instagram: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none focus:border-neon-red transition-all" placeholder="https://instagram.com/..." />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Site Officiel / Spotify *</label>
                                                <input type="text" value={newWikiForm.website} onChange={e => setNewWikiForm(p => ({ ...p, website: e.target.value, spotify: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none focus:border-neon-red transition-all" placeholder="https://..." />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 border-t border-white/5 bg-black/40">
                                        <button 
                                            onClick={handleAddWiki}
                                            disabled={isSavingNewWiki}
                                            className="w-full py-5 bg-neon-red text-white font-black uppercase italic tracking-[0.3em] rounded-3xl shadow-[0_0_30px_rgba(255,0,0,0.2)] hover:shadow-[0_0_40px_rgba(255,0,0,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                                        >
                                            {isSavingNewWiki ? 'CRÉATION EN COURS...' : 'CONFIRMER L\'AJOUT'}
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            <ConfirmModal
                isOpen={alertConfig.isOpen}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                hideCancel={!alertConfig.isConfirm}
                onConfirm={alertConfig.onConfirm}
                onCancel={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                confirmText={alertConfig.isConfirm ? "Confirmer" : "OK"}
            />
        </div>
    );
}
