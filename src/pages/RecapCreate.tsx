
import { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Send, Image as ImageIcon, FileText, Calendar, AlertCircle, MapPin, Youtube, PartyPopper, ArrowLeft, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';

export function RecapCreate() {
    const location = useLocation() as any;
    const isEditing = location.state?.isEditing;
    const editingItem = location.state?.item;

    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('**Écrivez votre récap ici...**');
    const [coverImage, setCoverImage] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [festival, setFestival] = useState('');
    const [locationInput, setLocationInput] = useState('');
    const [youtubeId, setYoutubeId] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isEditing && editingItem) {
            setTitle(editingItem.title);
            setSummary(editingItem.summary);
            // Basic HTML cleanup if needed
            let c = editingItem.content || '';
            if (typeof c === 'string' && c.startsWith('<div class="markdown-content">')) {
                c = c.replace('<div class="markdown-content">', '').replace(/<\/div>$/, '').replace(/<br>/g, '\n');
            }
            setContent(c);
            setCoverImage(editingItem.image);
            setDate(editingItem.date);
            setFestival(editingItem.festival || ''); // Assume festival field exists or is derived
            setLocationInput(editingItem.location || '');
            setYoutubeId(editingItem.youtubeId || '');
        }
    }, [isEditing, editingItem]);

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('path', 'recaps');

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: getAuthHeaders(null),
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                setCoverImage(data.url);
            } else {
                alert(data.error || 'Erreur lors de l\'upload');
            }
        } catch (error) {
            alert('Erreur de connexion au serveur d\'upload');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('Publication en cours...');

        try {
            // In a real app, we send data to worker, worker handles GitHub logic
            // We'll mimic the NewsCreate pattern

            const endpoint = isEditing ? '/api/recaps/update' : '/api/recaps/create';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    id: isEditing ? editingItem.id : undefined,
                    title,
                    summary,
                    content,
                    image: coverImage,
                    date,
                    festival,
                    location: locationInput,
                    youtubeId,
                    category: 'Recaps'
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
            setMessage(isEditing ? 'Récap mis à jour avec succès !' : 'Récap publié avec succès !');
            // Reset form
            if (!isEditing) {
                setTitle('');
                setSummary('');
                setContent('');
                setCoverImage('');
                setFestival('');
                setLocationInput('');
                setYoutubeId('');
            }

        } catch (error) {
            console.error('Error creating recap:', error);
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Une erreur est survenue');
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg text-white py-32 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-6 mb-8">
                    <Link
                        to="/admin"
                        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white group"
                        title="Retour au tableau de bord"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter">
                            {isEditing ? 'Modifier le Récap' : 'Nouveau Récap'}
                        </h1>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Titre du Récap</label>
                            <div className="relative group">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: Récap : Tomorrowland 2026"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Date */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Date</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Youtube ID */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Vidéo de l'article (Youtube)</label>
                                <div className="relative group">
                                    <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                    <input
                                        type="text"
                                        value={youtubeId}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            let id = val;
                                            if (val.includes('youtube.com/watch?v=')) {
                                                id = val.split('v=')[1].split('&')[0];
                                            } else if (val.includes('youtu.be/')) {
                                                id = val.split('youtu.be/')[1];
                                            }
                                            setYoutubeId(id);
                                        }}
                                        placeholder="URL Youtube ou ID (ex: dQw4w9WgXcQ)"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Festival Name */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Festival (Optionnel)</label>
                                <div className="relative group">
                                    <PartyPopper className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                    <input
                                        type="text"
                                        value={festival}
                                        onChange={(e) => setFestival(e.target.value)}
                                        placeholder="Ex: Tomorrowland"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                    />
                                </div>
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Lieu (Optionnel)</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                    <input
                                        type="text"
                                        value={locationInput}
                                        onChange={(e) => setLocationInput(e.target.value)}
                                        placeholder="Ex: Boom, Belgique"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Image URL */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Image de couverture</label>
                            <div className="flex gap-2">
                                <div className="relative group flex-1">
                                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                    <input
                                        type="text"
                                        value={coverImage}
                                        onChange={(e) => setCoverImage(e.target.value)}
                                        placeholder="https://... ou uploadez une image"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                        required
                                    />
                                </div>
                                <label className="px-6 py-4 bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan rounded-xl font-bold uppercase tracking-wider hover:bg-neon-cyan/30 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap">
                                    {uploading ? 'Upload...' : '📤 Upload'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Résumé court</label>
                            <textarea
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="Un bref résumé pour l'aperçu..."
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-4 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all h-24"
                            />
                        </div>


                        {/* Content Editor */}
                        <div className="space-y-4 admin-editor-container" data-color-mode="dark">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> CONTENU
                                    <button
                                        type="button"
                                        onClick={() => setContent(prev => prev + '\n\n')}
                                        className="ml-2 p-1 bg-white/5 border border-white/10 rounded hover:bg-neon-cyan/20 hover:border-neon-cyan/50 hover:text-neon-cyan transition-all"
                                        title="Ajouter un nouveau paragraphe"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </label>
                            </div>
                            <div className="rounded-xl overflow-hidden border border-white/10">
                                <style>{`
                                    .admin-editor-container .w-md-editor {
                                        border: none !important;
                                        background: #000 !important;
                                    }
                                    .admin-editor-container .w-md-editor-content {
                                        flex-direction: column !important;
                                    }
                                    .admin-editor-container .w-md-editor-input {
                                        width: 100% !important;
                                        border-bottom: 1px solid rgba(255,255,255,0.1) !important;
                                    }
                                    .admin-editor-container .w-md-editor-preview {
                                        width: 100% !important;
                                        padding: 40px !important;
                                        background: #0a0a0a !important;
                                    }
                                `}</style>
                                <MDEditor
                                    value={content}
                                    onChange={(val) => setContent(val || '')}
                                    preview="edit"
                                    height={600}
                                    hideToolbar={false}
                                    visibleDragbar={false}
                                />
                            </div>
                        </div>
                        <div className="flex justify-start items-center gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    const dropCapTemplate = '\n\n<span class="drop-cap">L</span>e ';
                                    setContent(prev => prev + dropCapTemplate);
                                }}
                                className="text-[10px] font-black bg-neon-cyan/20 border border-neon-cyan/30 px-3 py-1 rounded text-neon-cyan hover:bg-neon-cyan hover:text-white transition-all uppercase tracking-widest"
                            >
                                + Ajouter une partie (Lettrine)
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${status === 'loading'
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-neon-cyan hover:bg-neon-cyan/80 text-black'
                                }`}
                        >
                            {status === 'loading' ? (
                                'Publication en cours...'
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    {isEditing ? 'Mettre à jour le Récap' : 'Publier le Récap'}
                                </>
                            )}
                        </button>

                        {/* Status Message */}
                        {status !== 'idle' && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 ${status === 'error' ? 'bg-red-500/10 text-red-500' :
                                status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                <AlertCircle className="w-5 h-5" />
                                <p>{message}</p>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
