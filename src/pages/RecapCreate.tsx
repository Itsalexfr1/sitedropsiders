
import { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Send, Image as ImageIcon, FileText, Calendar, AlertCircle, MapPin, Youtube, PartyPopper, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';

export function RecapCreate() {
    const location = useLocation() as any;
    const isEditing = location.state?.isEditing;
    const editingItem = location.state?.item;

    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [festival, setFestival] = useState('');
    const [locationInput, setLocationInput] = useState('');
    const [youtubeId, setYoutubeId] = useState('');
    const [uploading, setUploading] = useState(false);

    // Widget System State
    const [widgets, setWidgets] = useState<{ id: string, content: string }[]>([
        { id: 'initial-1', content: '**Écrivez votre récap ici...**' }
    ]);

    useEffect(() => {
        if (isEditing && editingItem) {
            setTitle(editingItem.title);
            setSummary(editingItem.summary);
            setCoverImage(editingItem.image);
            setDate(editingItem.date);
            setFestival(editingItem.festival || '');
            setLocationInput(editingItem.location || '');
            setYoutubeId(editingItem.youtubeId || '');

            // Parse Content into Widgets
            let c = editingItem.content || '';
            if (typeof c === 'string' && c.startsWith('<div class="markdown-content">')) {
                c = c.replace('<div class="markdown-content">', '').replace(/<\/div>$/, '').replace(/<br>/g, '\n');
            }

            const sectionRegex = /<div class="article-section">\s*([\s\S]*?)\s*<\/div>/g;
            const foundWidgets = [];
            let match;
            while ((match = sectionRegex.exec(c)) !== null) {
                foundWidgets.push({
                    id: Math.random().toString(36).substr(2, 9),
                    content: match[1].trim()
                });
            }

            if (foundWidgets.length > 0) {
                setWidgets(foundWidgets);
            } else {
                setWidgets([{ id: 'legacy-1', content: c }]);
            }
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

    const addWidget = () => {
        setWidgets([...widgets, { id: Math.random().toString(36).substr(2, 9), content: '' }]);
    };

    const updateWidget = (id: string, newContent: string) => {
        setWidgets(widgets.map(w => w.id === id ? { ...w, content: newContent } : w));
    };

    const removeWidget = (id: string) => {
        if (widgets.length > 1) {
            setWidgets(widgets.filter(w => w.id !== id));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('Publication en cours...');

        try {
            const finalContent = widgets.map(w =>
                `<div class="article-section">\n\n${w.content}\n\n</div>`
            ).join('\n\n');

            const endpoint = isEditing ? '/api/recaps/update' : '/api/recaps/create';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    id: isEditing ? editingItem.id : undefined,
                    title,
                    summary,
                    content: finalContent,
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
            if (!isEditing) {
                setTitle('');
                setSummary('');
                setWidgets([{ id: 'new-1', content: '' }]);
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
            <div className="max-w-5xl mx-auto">
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

                        {/* Status Message */}
                        {status !== 'idle' && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 ${status === 'error' ? 'bg-red-500/10 text-red-500' :
                                status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                <AlertCircle className="w-5 h-5" />
                                <p>{message}</p>
                            </div>
                        )}

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

                        {/* Date & Youtube */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Vidéo Youtube</label>
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
                                        placeholder="URL Youtube ou ID"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Festival & Location */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Festival (Opt)</label>
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
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Lieu (Opt)</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                    <input
                                        type="text"
                                        value={locationInput}
                                        onChange={(e) => setLocationInput(e.target.value)}
                                        placeholder="Ex: Boom"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Cover Image */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Image de couverture</label>
                            <div className="flex gap-2">
                                <div className="relative group flex-1">
                                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                    <input
                                        type="text"
                                        value={coverImage}
                                        onChange={(e) => setCoverImage(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                        required
                                    />
                                </div>
                                <label className="px-6 py-4 bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan rounded-xl font-bold uppercase tracking-wider hover:bg-neon-cyan/30 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap">
                                    {uploading ? '...' : 'Upload'}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                                </label>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Résumé court</label>
                            <textarea
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="Un bref résumé..."
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-4 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all h-24"
                            />
                        </div>


                        {/* WIDGET EDITOR SECTION */}
                        <div className="pt-8 border-t border-white/10">
                            <div className="flex justify-between items-center mb-6">
                                <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-neon-cyan" /> WIDGETS DE CONTENU
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={addWidget}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-full hover:bg-neon-cyan/20 transition-all font-bold uppercase tracking-widest text-[10px]"
                                    >
                                        <Plus className="w-3 h-3" /> Bloc Texte
                                    </button>
                                    <label className="flex items-center gap-2 px-4 py-2 bg-neon-purple/10 border border-neon-purple/30 text-neon-purple rounded-full hover:bg-neon-purple/20 transition-all font-bold uppercase tracking-widest text-[10px] cursor-pointer relative">
                                        {uploading ? 'Chargement...' : <><ImageIcon className="w-3 h-3" /> Image</>}
                                        <input type="file" accept="image/*" onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setUploading(true);
                                                setStatus('loading');
                                                setMessage('Upload de l\'image...');
                                                const formData = new FormData();
                                                formData.append('image', file);
                                                formData.append('path', 'recaps');
                                                fetch('/api/upload', {
                                                    method: 'POST',
                                                    headers: getAuthHeaders(null),
                                                    body: formData
                                                }).then(res => res.json()).then(data => {
                                                    if (data.success) {
                                                        setWidgets([...widgets, { id: Math.random().toString(36).substr(2, 9), content: `![image](${data.url})` }]);
                                                        setStatus('success');
                                                        setMessage('Image ajoutée avec succès !');
                                                        setTimeout(() => setStatus('idle'), 3000);
                                                    } else {
                                                        setStatus('error');
                                                        setMessage(data.error || 'Erreur lors de l\'upload');
                                                    }
                                                }).finally(() => setUploading(false));
                                            }
                                        }} className="hidden" disabled={uploading} />
                                    </label>
                                    <button
                                        type="button"
                                        disabled={uploading}
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.multiple = true;
                                            input.accept = 'image/*';
                                            input.onchange = async (e: any) => {
                                                const files = e.target.files;
                                                if (!files || files.length === 0) return;

                                                setUploading(true);
                                                setStatus('loading');
                                                setMessage(`Upload de ${files.length} images...`);

                                                const uploadedUrls = [];
                                                for (let i = 0; i < files.length; i++) {
                                                    const formData = new FormData();
                                                    formData.append('image', files[i]);
                                                    formData.append('path', 'recaps');
                                                    try {
                                                        const res = await fetch('/api/upload', {
                                                            method: 'POST',
                                                            headers: getAuthHeaders(null),
                                                            body: formData
                                                        });
                                                        const data = await res.json();
                                                        if (data.success) uploadedUrls.push(data.url);
                                                    } catch (err) {
                                                        console.error('Upload failed for file', i);
                                                    }
                                                }

                                                if (uploadedUrls.length > 0) {
                                                    const galleryMarkdown = `<div class="grid grid-cols-2 md:grid-cols-3 gap-4 my-8">\n${uploadedUrls.map(url => `  <img src="${url}" class="aspect-square object-cover rounded-xl" />`).join('\n')}\n</div>`;
                                                    setWidgets([...widgets, { id: Math.random().toString(36).substr(2, 9), content: galleryMarkdown }]);
                                                    setStatus('success');
                                                    setMessage(`${uploadedUrls.length} images ajoutées à la galerie !`);
                                                    setTimeout(() => setStatus('idle'), 3000);
                                                } else {
                                                    setStatus('error');
                                                    setMessage('Aucune image n\'a pu être uploadée');
                                                }
                                                setUploading(false);
                                            };
                                            input.click();
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-pink/10 border border-neon-pink/30 text-neon-pink rounded-full hover:bg-neon-pink/20 transition-all font-bold uppercase tracking-widest text-[10px] disabled:opacity-50"
                                    >
                                        <Plus className="w-3 h-3" /> Galerie
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const val = prompt('URL ou ID YouTube (ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ)');
                                            if (!val) return;
                                            let videoId = val.trim();
                                            if (val.includes('youtube.com/watch?v=')) {
                                                videoId = val.split('v=')[1].split('&')[0];
                                            } else if (val.includes('youtu.be/')) {
                                                videoId = val.split('youtu.be/')[1].split('?')[0];
                                            }
                                            const youtubeEmbed = `<div class="youtube-player-widget" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;my-8">\n  <iframe src="https://www.youtube.com/embed/${videoId}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>\n</div>`;
                                            setWidgets([...widgets, { id: Math.random().toString(36).substr(2, 9), content: youtubeEmbed }]);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/30 text-red-400 rounded-full hover:bg-red-600/20 transition-all font-bold uppercase tracking-widest text-[10px]"
                                    >
                                        <Youtube className="w-3 h-3" /> Player YT
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {widgets.map((widget, index) => (
                                    <div key={widget.id} className="relative group">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Bloc {index + 1}</span>
                                            {widgets.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeWidget(widget.id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="admin-editor-container" data-color-mode="dark">
                                            <MDEditor
                                                value={widget.content}
                                                onChange={(val) => updateWidget(widget.id, val || '')}
                                                height={300}
                                                preview="edit"
                                                hideToolbar={false}
                                                visibleDragbar={false}
                                                extraCommands={[]}
                                            />
                                        </div>

                                        <div className="flex justify-center gap-4 mt-4">
                                            {index === widgets.length - 1 && (
                                                <div className="h-px w-full bg-white/5" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* LIVE PREVIEW SECTION */}
                        <div className="pt-8 border-t border-white/10">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Prévisualisation du rendu</h3>
                            <div className="bg-black border border-white/10 rounded-2xl p-8 article-body-premium">
                                {widgets.map(w => (
                                    <div key={w.id} className="article-section">
                                        <MDEditor.Markdown source={w.content} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
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
                        </div>
                    </form>
                </div>
            </div>
            <style>{`
                .admin-editor-container .w-md-editor {
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    background: #000 !important;
                    border-radius: 8px;
                }
                .admin-editor-container .w-md-editor-toolbar {
                    background: #000 !important;
                    border-bottom: 1px solid rgba(255,255,255,0.05) !important;
                }
                .admin-editor-container .w-md-editor-content {
                    background: #000 !important;
                }
                .article-body-premium .article-section {
                    margin-bottom: 40px;
                }
                .article-body-premium .article-section > p:first-of-type::first-letter {
                    float: left;
                    font-family: 'Orbitron', monospace;
                    font-weight: 900;
                    font-size: 80px;
                    line-height: 0.8;
                    padding-right: 12px;
                    padding-top: 8px;
                    color: #ff0033;
                    text-shadow: 0 0 15px rgba(255, 0, 51, 0.4);
                    margin-right: 4px;
                }
            `}</style>
        </div>
    );
}
