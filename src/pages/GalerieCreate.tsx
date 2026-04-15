import { useState, useEffect, useRef } from 'react';
import { getAuthHeaders } from '../utils/auth';
import editorsData from '../data/editors.json';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Check, Send, Image as ImageIcon, FileText, Calendar, AlertCircle, Grid, ArrowLeft, Trash2, Edit2, Film, Plus, X } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams, useBlocker } from 'react-router-dom';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

const EDITOR_COLORS = [
    '#FF1241', // neon-red
    '#00FFFF', // neon-cyan
    '#BF00FF', // neon-purple
    '#39FF14', // neon-green
    '#FFF01F', // neon-yellow
    '#FF5E00', // neon-orange
    '#00BFFF', // neon-blue
    '#FF0099', // neon-red
    '#00FF88', // neon-mint
    '#7B61FF', // neon-indigo
    '#FFFFFF', // blanc
];

const getEditorColor = (username: string) => {
    const normalized = username.toLowerCase();
    // Manual overrides for core team to provide unique colors
    if (normalized === 'alex') return '#FF1241';
    if (normalized === 'tanguy') return '#00FFFF';
    if (normalized === 'julien') return '#BF00FF';
    if (normalized === 'tiffany') return '#39FF14';
    if (normalized === 'kevin') return '#FFF01F';
    if (normalized === 'guiyoome') return '#FF5E00';

    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
    }
    return EDITOR_COLORS[Math.abs(hash) % EDITOR_COLORS.length];
};

// Special style for Alex (Gradient)
const getAuthorTextStyle = (username: string) => {
    const color = getEditorColor(username);
    if (username.toLowerCase() === 'alex') {
        return {
            background: 'linear-gradient(to right, #FF1241, #FF0099, #BF00FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
        };
    }
    return { color };
};

export function GalerieCreate() {
    const navigate = useNavigate();
    const location = useLocation() as any;
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const isEditing = !!id;
    const editingItem = location.state?.item;

    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().getFullYear().toString());
    const [category, setCategory] = useState('Festivals');
    const [coverUrl, setCoverUrl] = useState('');
    const [hoverMediaUrl, setHoverMediaUrl] = useState(''); // Video or Image for hover
    const [imageUrls, setImageUrls] = useState(''); // Textarea content
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadTarget, setUploadTarget] = useState<'cover' | 'gallery' | 'hover'>('cover');
    const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(isEditing && !editingItem);
    const [showRawLinks, setShowRawLinks] = useState(false);

    const [author, setAuthor] = useState(() => {
        const stored = localStorage.getItem('admin_name') || localStorage.getItem('admin_user') || 'Alex';
        const found = (editorsData as any[]).find(e =>
            e.name.toLowerCase() === stored.toLowerCase() ||
            e.username.toLowerCase() === stored.toLowerCase()
        );
        return found ? found.name : 'Alex';
    });
    const [isAuthorConfirmed, setIsAuthorConfirmed] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    // Fetch item if missing from state but ID is present
    useEffect(() => {
        const id = searchParams.get('id');
        if (isEditing && !editingItem && id) {
            setIsLoading(true);
            const fetchItem = async () => {
                try {
                    const response = await fetch('/api/galerie', { headers: getAuthHeaders(null) });
                    if (response.ok) {
                        const allAlbums = await response.json();
                        const item = allAlbums.find((a: any) => String(a.id) === String(id));
                        if (item) {
                            setTitle(item.title);
                            setDate(item.date);
                            setCategory(item.category);
                            setCoverUrl(item.cover);
                            setHoverMediaUrl(item.hoverMedia || '');
                            setImageUrls(item.images?.join('\n') || '');
                        }
                    }
                } catch (e: any) {
                    console.error("Failed to fetch gallery item for edit", e);
                } finally {
                    console.log('[GalerieCreate] Fetch complete');
                    setIsLoading(false);
                    initialDataLoaded.current = true;
                }
            };
            fetchItem();
        } else {
            setIsLoading(false);
        }
    }, [isEditing, editingItem, searchParams]);

    useEffect(() => {
        if (isEditing && editingItem) {
            setTitle(editingItem.title);
            setDate(editingItem.date);
            setCategory(editingItem.category);
            setCoverUrl(editingItem.cover);
            setHoverMediaUrl(editingItem.hoverMedia || '');
            setImageUrls(editingItem.images?.join('\n') || '');
        }
    }, [isEditing, editingItem]);

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const [isDirty, setIsDirty] = useState(false);
    const initialDataLoaded = useRef(false);

    // Track changes
    useEffect(() => {
        if (isEditing && editingItem && !initialDataLoaded.current) {
            if (title === editingItem.title && coverUrl === editingItem.cover) {
                initialDataLoaded.current = true;
            }
            return;
        }
        if (!isEditing && !initialDataLoaded.current) {
            if (title || coverUrl || imageUrls) {
                initialDataLoaded.current = true;
            }
            return;
        }
        if (initialDataLoaded.current) {
            setIsDirty(true);
        }
    }, [title, date, category, coverUrl, imageUrls, hoverMediaUrl]);



    // Prompt before internal React Router navigation
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    // Confirm navigation handled by ConfirmationModal component in JSX

    // Prompt before window reload/close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);


    // Upload functions removed in favor of external link


    const handleSubmit = async (e?: React.FormEvent | React.MouseEvent | any, publishNow = false, scheduleDate?: string) => {
        if (e && (e as any).preventDefault) (e as any).preventDefault();

        let finalDate = scheduleDate || date;
        if (publishNow) {
            // Keep year as is or set to current year
            finalDate = new Date().getFullYear().toString();
            setDate(finalDate);
        }

        if (!isAuthorConfirmed) {
            setStatus('error');
            setMessage("Veuillez confirmer l'éditeur de l'album en cochant la case correspondante.");
            return;
        }

        setStatus('loading');
        setMessage('Publication en cours...');

        try {
            // Parse images
            const images = imageUrls.split('\n').map(url => url.trim()).filter(url => url !== '');

            if (images.length === 0) {
                throw new Error("Veuillez ajouter au moins une image.");
            }

            const finalCover = coverUrl.trim() || images[0];
            const endpoint = isEditing ? '/api/galerie/update' : '/api/galerie/create';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    id: isEditing ? id : undefined,
                    title,
                    date: finalDate,
                    category,
                    cover: finalCover,
                    hoverMedia: hoverMediaUrl,
                    images: images,
                    author: author
                }),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e: any) {
                    errorData = { error: `Erreur ${response.status}: ${response.statusText}` };
                }
                throw new Error(errorData.error || 'Erreur lors de la publication');
            }

            await response.json();

            setStatus('success');
            setIsDirty(false);
            setMessage(isEditing ? 'Album mis à jour avec succès !' : 'Album créé avec succès !');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Reset form if not editing
            if (!isEditing) {
                setTitle('');
                setDate(new Date().getFullYear().toString());
                setCoverUrl('');
                setHoverMediaUrl('');
                setImageUrls('');
                setIsAuthorConfirmed(false);
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                setTimeout(() => navigate('/admin/manage'), 2000);
            }

        } catch (error: any) {
            console.error('Error creating album:', error);
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Une erreur est survenue');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-white">
                    <div className="w-12 h-12 border-4 border-neon-red/20 border-t-neon-red rounded-full animate-spin" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">Chargement des données...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg py-32">
            <div className="max-w-full mx-auto px-4 md:px-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
                    <div className="flex items-center gap-4 md:gap-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all text-white group"
                            title="Retour"
                        >
                            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${isEditing ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan' : 'bg-neon-green/10 border-neon-green/30 text-neon-green'}`}>
                                    {isEditing ? 'Mode Édition' : 'Nouvel Album'}
                                </span>
                                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                                    <User className="w-3 h-3 text-gray-500" />
                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">
                                        Éditeur : <span style={getAuthorTextStyle(((editorsData as any[]).find(e => e.name === author)?.username || author).toLowerCase())}>{author}</span>
                                    </span>
                                    {isAuthorConfirmed ? (
                                        <Check className="w-3 h-3 text-neon-green" />
                                    ) : (
                                        <div className="w-1.5 h-1.5 rounded-full bg-neon-red animate-pulse" />
                                    )}
                                </div>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                Studio <span className="text-neon-red">Gallery</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <button
                            type="button"
                            onClick={() => handleSubmit(null, true)}
                            disabled={status === 'loading'}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${status === 'loading'
                                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:scale-105 active:scale-95'
                                }`}
                        >
                            <Send className="w-4 h-4" />
                            <span>{status === 'loading' ? 'EN COURS...' : (isEditing ? 'METTRE À JOUR' : 'PUBLIER')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowScheduleModal(true)}
                            disabled={status === 'loading'}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${status === 'loading'
                                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                : 'bg-neon-red hover:scale-105 active:scale-95 text-black shadow-[0_0_20px_rgba(255,0,149,0.4)]'
                                }`}
                        >
                            <Calendar className="w-4 h-4" />
                            <span>{status === 'loading' ? 'EN COURS...' : (isEditing ? 'CHANGER ANNÉE' : 'PROGRAMMER')}</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Author Selector */}
                        <div data-section="editor-selection" className="space-y-6 pb-8 border-b border-white/10 mb-8">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <User className="w-3 h-3 text-neon-red" /> Choisir l'Éditeur <span className="text-neon-red">*</span>
                            </label>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {(editorsData as any[]).map((editor: any) => {
                                    const editorColor = getEditorColor(editor.username.toLowerCase());
                                    const isSelected = author === editor.name;
                                    return (
                                        <button
                                            key={editor.username}
                                            type="button"
                                            onClick={() => {
                                                setAuthor(editor.name);
                                                setIsAuthorConfirmed(false);
                                            }}
                                            className={`group relative p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 ${isSelected
                                                ? 'bg-white/10'
                                                : 'bg-black/40 border-white/10 hover:border-white/20'
                                                }`}
                                            style={{
                                                borderColor: isSelected ? editorColor : 'rgba(255,255,255,0.1)',
                                                boxShadow: isSelected ? `0 0 20px ${editorColor}20` : 'none'
                                            }}
                                        >
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                                                style={{
                                                    backgroundColor: isSelected ? editorColor : 'rgba(255,255,255,0.05)',
                                                    color: isSelected ? '#000' : '#666'
                                                }}
                                            >
                                                <User className="w-5 h-5" />
                                            </div>
                                            <span
                                                className="text-[10px] font-black uppercase tracking-widest transition-colors"
                                                style={getAuthorTextStyle(editor.username)}
                                            >
                                                {editor.name}
                                            </span>
                                            {isSelected && (
                                                <div className="absolute top-2 right-2">
                                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: editorColor }} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div
                                className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border ${isAuthorConfirmed
                                    ? 'bg-neon-red/5 border-neon-red/30'
                                    : 'bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20 animate-pulse'
                                    }`}
                                onClick={() => setIsAuthorConfirmed(!isAuthorConfirmed)}
                            >
                                <button
                                    type="button"
                                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isAuthorConfirmed
                                        ? 'bg-neon-red border-neon-red shadow-[0_0_10px_rgba(255,18,65,0.3)]'
                                        : 'bg-black/40 border-white/20'
                                        }`}
                                >
                                    {isAuthorConfirmed && <Check className="w-4 h-4 text-black" />}
                                </button>
                                <div className="flex flex-col">
                                    <span className={`text-xs font-black uppercase tracking-widest transition-colors ${isAuthorConfirmed ? 'text-white' : 'text-gray-400'}`}>
                                        Confirmer l'Éditeur
                                    </span>
                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                        Je certifie que <span className="font-black" style={{ color: getEditorColor(((editorsData as any[]).find(e => e.name === author)?.username || author).toLowerCase()) }}>{author}</span> est bien l'auteur de cet album
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Titre de l'Album <span className="text-neon-red">*</span></label>
                            <div className="relative group">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-red transition-colors" />
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: TOMORROWLAND 2024"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-red focus:ring-1 focus:ring-neon-red transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Category */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Catégorie</label>
                                <div className="relative group">
                                    <Grid className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-red transition-colors" />
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-gray-900 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-red focus:ring-1 focus:ring-neon-red transition-all appearance-none"
                                    >
                                        <option value="Festivals">Festivals</option>
                                        <option value="Clubs & Events">Clubs & Events</option>
                                        <option value="Others">Others</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Cover Image URL */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Image de couverture (Optionnel)</label>
                            <div className="flex gap-2">
                                <div className="relative group flex-1">
                                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-red transition-colors" />
                                    <input
                                        type="text"
                                        value={coverUrl}
                                        onChange={(e) => setCoverUrl(e.target.value)}
                                        placeholder="Laisser vide pour la 1ère image ou uploadez"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-10 text-white placeholder-gray-600 focus:outline-none focus:border-neon-red focus:ring-1 focus:ring-neon-red transition-all"
                                    />
                                    {coverUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setCoverUrl('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-red-500 transition-colors"
                                            title="Effacer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUploadTarget('cover');
                                        setShowUploadModal(true);
                                    }}
                                    className="px-6 py-4 bg-neon-red/20 border border-neon-red/50 text-neon-red rounded-xl font-bold uppercase tracking-wider hover:bg-neon-red/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-w-[120px]"
                                >
                                    Upload
                                </button>

                            </div>
                        </div>

                        {/* Hover Media URL */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Média au survol (Vidéo ou Image)</label>
                            <div className="flex gap-2">
                                <div className="relative group flex-1">
                                    <Film className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-blue transition-colors" />
                                    <input
                                        type="text"
                                        value={hoverMediaUrl}
                                        onChange={(e) => setHoverMediaUrl(e.target.value)}
                                        placeholder="URL vidéo (.mp4) ou Image pour l'effet de hover"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-10 text-white placeholder-gray-600 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                                    />
                                    {hoverMediaUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setHoverMediaUrl('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-red-500 transition-colors"
                                            title="Effacer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUploadTarget('hover');
                                        setShowUploadModal(true);
                                    }}
                                    className="px-6 py-4 bg-neon-blue/20 border border-neon-blue/50 text-neon-blue rounded-xl font-bold uppercase tracking-wider hover:bg-neon-blue/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-w-[120px]"
                                >
                                    Upload
                                </button>
                            </div>
                        </div>

                        {/* Images URLs */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Images de la Galerie</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowRawLinks(!showRawLinks)}
                                        className="px-4 py-2 bg-white/5 border border-white/10 text-gray-400 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all cursor-pointer"
                                    >
                                        {showRawLinks ? '👁️ Masquer les liens' : '🔗 Gérer par liens'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUploadTarget('gallery');
                                            setShowUploadModal(true);
                                        }}
                                        className="px-4 py-2 bg-neon-red/20 border border-neon-red/50 text-neon-red rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-neon-red/30 transition-all cursor-pointer flex items-center gap-2"
                                    >
                                        📥 Ajouter des photos
                                    </button>
                                </div>
                            </div>

                            {showRawLinks && (
                                <textarea
                                    value={imageUrls}
                                    onChange={(e) => setImageUrls(e.target.value)}
                                    placeholder="https://site.com/image1.jpg&#10;https://site.com/image2.jpg"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-red focus:ring-1 focus:ring-neon-red transition-all h-48 font-mono text-sm"
                                />
                            )}

                            {/* Live Preview Grid - PRIMARY INTERFACE */}
                            <div className="mt-8 bg-black/40 border border-white/10 rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-display font-black text-white uppercase italic italic tracking-tighter">Gestion Visuelle ({imageUrls.split('\n').filter(u => u.trim()).length} photos)</h3>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                                    {imageUrls.split('\n').filter(u => u.trim()).map((url, idx) => (
                                        <div key={idx} className="aspect-square relative rounded-2xl overflow-hidden border-2 border-white/5 bg-black/40 group hover:border-neon-red transition-all">
                                            <img
                                                src={url.trim()}
                                                alt={`Preview ${idx}`}
                                                className="w-full h-full object-cover transition-opacity duration-300"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.opacity = '0.2';
                                                }}
                                            />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 bg-black/80 transition-opacity">
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const lines = imageUrls.split('\n');
                                                            if (idx > 0) {
                                                                [lines[idx - 1], lines[idx]] = [lines[idx], lines[idx - 1]];
                                                                setImageUrls(lines.join('\n'));
                                                            }
                                                        }}
                                                        disabled={idx === 0}
                                                        className="p-2 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition-all disabled:opacity-20"
                                                        title="Déplacer vers la gauche"
                                                    >
                                                        <ArrowLeft className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setUploadTarget('gallery');
                                                            setReplaceIndex(idx);
                                                            setShowUploadModal(true);
                                                        }}
                                                        className="p-2 bg-neon-blue/20 text-neon-blue rounded-lg border border-neon-blue/50 hover:bg-neon-blue hover:text-white transition-all"
                                                        title="Remplacer cette photo"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const lines = imageUrls.split('\n');
                                                            if (idx < lines.length - 1) {
                                                                [lines[idx], lines[idx + 1]] = [lines[idx + 1], lines[idx]];
                                                                setImageUrls(lines.join('\n'));
                                                            }
                                                        }}
                                                        disabled={idx === imageUrls.split('\n').filter(u => u.trim()).length - 1}
                                                        className="p-2 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition-all disabled:opacity-20"
                                                        title="Déplacer vers la droite"
                                                    >
                                                        <ArrowLeft className="w-4 h-4 rotate-180" />
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const lines = imageUrls.split('\n');
                                                        lines.splice(idx, 1);
                                                        setImageUrls(lines.join('\n'));
                                                    }}
                                                    className="px-4 py-2 bg-neon-red text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-neon-red/80 transition-all flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Supprimer
                                                </button>
                                            </div>
                                            <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[9px] font-black text-white/50">
                                                #{idx + 1}
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUploadTarget('gallery');
                                            setShowUploadModal(true);
                                        }}
                                        className="aspect-square border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 hover:border-neon-red/50 transition-all group"
                                    >
                                        <Plus className="w-8 h-8 text-gray-700 group-hover:text-neon-red transition-colors" />
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ajouter</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => handleSubmit(null, true)}
                                disabled={status === 'loading'}
                                className={`py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${status === 'loading'
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-[1.02] text-white'
                                    }`}
                            >
                                <Send className="w-5 h-5" />
                                {status === 'loading' ? 'Publication...' : (isEditing ? 'Mettre à jour' : 'Publier Maintenant')}
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowScheduleModal(true)}
                                disabled={status === 'loading'}
                                className={`py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${status === 'loading'
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-neon-red text-black hover:shadow-[0_0_20px_rgba(255,0,149,0.4)] hover:scale-[1.02]'
                                    }`}
                            >
                                <Calendar className="w-5 h-5" />
                                {status === 'loading' ? 'Programmation...' : (isEditing ? 'Changer l\'Année' : 'Programmer l\'Album')}
                            </button>
                        </div>

                        {/* Status Message */}
                        {status !== 'idle' && message && (
                            <div className={`p-4 rounded-xl flex flex-col gap-3 ${status === 'error' ? 'bg-red-500/10 text-red-500' :
                                status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5" />
                                    <p className="font-bold uppercase tracking-wider text-xs">{message}</p>
                                </div>
                            </div>
                        )}

                    </form>
                </div>
            </div>

            <ImageUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                allowMultiple={uploadTarget === 'gallery' && replaceIndex === null}
                watermark={uploadTarget === 'gallery'}
                initialImage={
                    uploadTarget === 'cover' ? coverUrl :
                        uploadTarget === 'hover' ? hoverMediaUrl :
                            (uploadTarget === 'gallery' && replaceIndex !== null) ? imageUrls.split('\n')[replaceIndex] : undefined
                }
                onUploadSuccess={(urlOrUrls) => {
                    const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
                    
                    if (uploadTarget === 'cover') {
                        setCoverUrl(urls[0]);
                    } else if (uploadTarget === 'hover') {
                        setHoverMediaUrl(urls[0]);
                    } else if (uploadTarget === 'gallery') {
                        if (replaceIndex !== null) {
                            const lines = imageUrls.split('\n');
                            lines[replaceIndex] = urls[0];
                            setImageUrls(lines.join('\n'));
                            setReplaceIndex(null);
                        } else {
                            const newUrls = urls.join('\n');
                            setImageUrls(prev => prev ? prev + '\n' + newUrls : newUrls);
                        }
                    }
                }}
                onClear={() => {
                    if (uploadTarget === 'cover') {
                        setCoverUrl('');
                    } else if (uploadTarget === 'hover') {
                        setHoverMediaUrl('');
                    } else if (uploadTarget === 'gallery' && replaceIndex !== null) {
                        const lines = imageUrls.split('\n');
                        lines.splice(replaceIndex, 1);
                        setImageUrls(lines.join('\n'));
                        setReplaceIndex(null);
                    }
                    setShowUploadModal(false);
                }}
                accentColor="neon-red"
            />

            {/* Schedule Modal (Year Selection) */}
            <AnimatePresence>
                {showScheduleModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowScheduleModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-dark-bg border border-white/10 rounded-3xl p-8 shadow-2xl"
                        >
                            <button
                                onClick={() => setShowScheduleModal(false)}
                                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-12 h-12 bg-neon-red/10 rounded-2xl flex items-center justify-center border border-neon-red/30 mb-6">
                                <Calendar className="w-6 h-6 text-neon-red" />
                            </div>

                            <h3 className="text-xl font-display font-black text-white uppercase italic mb-2">
                                Année de l'Album
                            </h3>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-6">
                                Choisissez l'année d'affichage de l'album
                            </p>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Année</label>
                                        <button
                                            type="button"
                                            onClick={() => setDate(new Date().getFullYear().toString())}
                                            className="text-[9px] font-black text-neon-cyan hover:text-white uppercase tracking-widest transition-colors"
                                        >
                                            Cette année
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-neon-red transition-colors" />
                                        <input
                                            type="number"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            placeholder="2024"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-neon-red outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <button
                                        onClick={(e) => {
                                            setShowScheduleModal(false);
                                            handleSubmit(e, false);
                                        }}
                                        className="w-full py-4 bg-neon-red text-black rounded-xl font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,0,149,0.3)]"
                                    >
                                        Confirmer & Publier
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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

export default GalerieCreate;
