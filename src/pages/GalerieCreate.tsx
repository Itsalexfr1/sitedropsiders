import { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, FileText, Calendar, AlertCircle, Grid, ArrowLeft, Trash2, Edit2, Film, Plus } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams, useBlocker } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
// import { uploadValidation, uploadToCloudinary } from '../utils/uploadService'; // Unused
import { ImageUploadModal } from '../components/ImageUploadModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

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
                } catch (e) {
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


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
                    date,
                    category,
                    cover: finalCover,
                    hoverMedia: hoverMediaUrl,
                    images: images
                }),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
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
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                setTimeout(() => navigate('/admin/manage'), 2000);
            }

        } catch (error) {
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
        <div className="min-h-screen bg-dark-bg text-white py-32 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white group"
                            title="Retour"
                        >
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <h1 className="text-2xl md:text-3xl font-display font-black text-white uppercase italic tracking-tighter">
                            {isEditing ? 'Modifier l\'Album' : 'Créer un Album'}
                        </h1>
                    </div>
                    {isEditing && (
                        <div className="flex-1 flex justify-end">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={status === 'loading'}
                                className={`px-6 py-2.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${status === 'loading'
                                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                    : 'bg-neon-pink hover:scale-105 active:scale-95 text-black shadow-lg shadow-neon-pink/20'
                                    }`}
                            >
                                <Send className="w-4 h-4" />
                                {status === 'loading' ? 'EN COURS...' : 'METTRE À JOUR'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Titre de l'Album <span className="text-neon-red">*</span></label>
                            <div className="relative group">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-pink transition-colors" />
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: TOMORROWLAND 2026"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Date (Year) */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Année <span className="text-neon-red">*</span></label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-pink transition-colors" />
                                    <input
                                        type="number"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        placeholder="2026"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Catégorie</label>
                                <div className="relative group">
                                    <Grid className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-pink transition-colors" />
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-gray-900 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-all appearance-none"
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
                                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-pink transition-colors" />
                                    <input
                                        type="text"
                                        value={coverUrl}
                                        onChange={(e) => setCoverUrl(e.target.value)}
                                        placeholder="Laisser vide pour la 1ère image ou uploadez"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-all"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUploadTarget('cover');
                                        setShowUploadModal(true);
                                    }}
                                    className="px-6 py-4 bg-neon-pink/20 border border-neon-pink/50 text-neon-pink rounded-xl font-bold uppercase tracking-wider hover:bg-neon-pink/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-w-[120px]"
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
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                                    />
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
                                        className="px-4 py-2 bg-neon-pink/20 border border-neon-pink/50 text-neon-pink rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-neon-pink/30 transition-all cursor-pointer flex items-center gap-2"
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
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-all h-48 font-mono text-sm"
                                />
                            )}

                            {/* Live Preview Grid - PRIMARY INTERFACE */}
                            <div className="mt-8 bg-black/40 border border-white/10 rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-display font-black text-white uppercase italic italic tracking-tighter">Gestion Visuelle ({imageUrls.split('\n').filter(u => u.trim()).length} photos)</h3>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                                    {imageUrls.split('\n').filter(u => u.trim()).map((url, idx) => (
                                        <div key={idx} className="aspect-square relative rounded-2xl overflow-hidden border-2 border-white/5 bg-black/40 group hover:border-neon-pink transition-all">
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
                                        className="aspect-square border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 hover:border-neon-pink/50 transition-all group"
                                    >
                                        <Plus className="w-8 h-8 text-gray-700 group-hover:text-neon-pink transition-colors" />
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ajouter</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${status === 'loading'
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-neon-pink hover:bg-neon-pink/80 text-black'
                                }`}
                        >
                            {status === 'loading' ? (
                                'Publication en cours...'
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    {isEditing ? 'Mettre à jour l\'Album' : 'Créer l\'Album'}
                                </>
                            )}
                        </button>

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
                onUploadSuccess={(url) => {
                    if (uploadTarget === 'cover') {
                        setCoverUrl(url);
                    } else if (uploadTarget === 'hover') {
                        setHoverMediaUrl(url);
                    } else if (uploadTarget === 'gallery') {
                        if (replaceIndex !== null) {
                            const lines = imageUrls.split('\n');
                            lines[replaceIndex] = url;
                            setImageUrls(lines.join('\n'));
                            setReplaceIndex(null);
                        } else {
                            setImageUrls(prev => prev ? prev + '\n' + url : url);
                        }
                    }
                }}
                accentColor="neon-pink"
            />

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
