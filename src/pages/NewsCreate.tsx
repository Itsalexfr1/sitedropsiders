
import { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, FileText, Calendar, AlertCircle, ArrowLeft, Youtube, Plus, Trash2, Link2, Upload, X } from 'lucide-react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
import { ImageUploadModal } from '../components/ImageUploadModal';



export function NewsCreate() {
    const [searchParams] = useSearchParams();
    const location = useLocation() as any;
    const type = searchParams.get('type') || 'News'; // 'News' or 'Interview'
    const isEditing = location.state?.isEditing;
    const editingItem = location.state?.item;

    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState(type);
    const [youtubeId, setYoutubeId] = useState('');






    // Widget System State
    const [widgets, setWidgets] = useState<{ id: string, content: string }[]>([
        { id: 'initial-1', content: '**Écrivez votre article ici...**' }
    ]);

    const [mediaModal, setMediaModal] = useState<{ show: boolean, type: 'image' | 'gallery' }>({ show: false, type: 'image' });
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        if (isEditing && editingItem) {
            setTitle(editingItem.title);
            setSummary(editingItem.summary);
            setImageUrl(editingItem.image);
            setDate(editingItem.date);
            setCategory(editingItem.category);
            setYoutubeId(editingItem.youtubeId || '');

            // Parse Content into Widgets
            let c = editingItem.content || '';
            // Basic cleanup of wrapper if present from old system
            if (typeof c === 'string' && c.startsWith('<div class="markdown-content">')) {
                c = c.replace('<div class="markdown-content">', '').replace(/<\/div>$/, '').replace(/<br>/g, '\n');
            }

            // Regex to find article sections
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
                // If no sections found, treat whole content as one widget
                setWidgets([{ id: 'legacy-1', content: c }]);
            }
        } else {
            setCategory(type);
        }
    }, [type, isEditing, editingItem]);

    const pageTitle = type === 'Interview' ? 'Ajouter une Interview' : 'Ajouter une News';

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    // const handleUpload = async (file: File) => {
    //     const validation = uploadValidation(file);
    //     if (!validation.valid) throw new Error(validation.error);
    //     return await uploadToCloudinary(file, 'news', (p) => setUploadProgress(p));
    // };





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

    const handleSubmit = async () => {
        if (!title || !imageUrl) {
            setStatus('error');
            setMessage('Veuillez remplir les champs obligatoires (Titre, Image)');
            return;
        }

        setStatus('loading');
        setMessage('Publication en cours...');

        try {
            // Construct Final Content with HTML Wrappers for Automatic Styling
            const finalContent = widgets.map(w =>
                `<div class="article-section">\n\n${w.content}\n\n</div>`
            ).join('\n\n');

            const payload = {
                id: isEditing ? editingItem.id : undefined,
                title,
                summary,
                date,
                image: imageUrl,
                category,
                content: finalContent,
                youtubeId
            };

            const endpoint = isEditing ? '/api/news/update' : '/api/news/create';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                await response.json();
                setStatus('success');
                setMessage(isEditing ? 'Article mis à jour avec succès !' : 'Article publié avec succès !');
                if (!isEditing) {
                    setTitle('');
                    setSummary('');
                    setWidgets([{ id: 'new-1', content: '' }]);
                    setImageUrl('');
                    setYoutubeId('');
                }
            } else {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { error: `Erreur ${response.status}: ${response.statusText}` };
                }
                setStatus('error');
                setMessage(errorData.error || 'Erreur lors de la publication');
            }
        } catch (e) {
            setStatus('error');
            setMessage('Erreur de connexion au serveur');
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg py-32 px-6">
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
                            {pageTitle}
                        </h1>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                    <div className="space-y-6">

                        {/* Status Message */}
                        {status !== 'idle' && (
                            <div className={`p-4 rounded-xl flex flex-col gap-3 ${status === 'error' ? 'bg-red-500/10 text-red-500' :
                                status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5" />
                                    <p className="font-bold uppercase tracking-wider text-xs">{message}</p>
                                </div>

                            </div>
                        )}

                        {/* Metadata Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Titre</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                                    placeholder="Titre de l'article"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-neon-cyan outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Résumé (Intro)</label>
                            <textarea
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                className="w-full h-24 bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none resize-none"
                                placeholder="Un court résumé..."
                            />
                        </div>

                        {/* Image & Youtube */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" /> Image
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                                        placeholder="https://..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowUploadModal(true)}
                                        className="px-6 py-4 bg-neon-red/20 border border-neon-red/50 text-neon-red rounded-xl font-bold uppercase tracking-wider hover:bg-neon-red/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-w-[120px]"
                                    >
                                        Upload
                                    </button>

                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Youtube className="w-4 h-4" /> Youtube ID
                                </label>
                                <input
                                    type="text"
                                    value={youtubeId}
                                    onChange={(e) => setYoutubeId(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                                    placeholder="ID ou URL"
                                />
                            </div>
                        </div>

                        {/* WIDGET EDITOR SECTION */}
                        <div className="pt-8 border-t border-white/10">
                            <div className="flex justify-between items-center mb-6">
                                <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-neon-cyan" /> WIDGETS DE CONTENU
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={addWidget}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-full hover:bg-neon-cyan/20 transition-all font-bold uppercase tracking-widest text-[10px]"
                                    >
                                        <Plus className="w-3 h-3" /> Bloc Texte
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowUploadModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan rounded-full hover:bg-neon-cyan/30 transition-all font-bold uppercase tracking-widest text-[10px]"
                                    >
                                        <ImageIcon className="w-3 h-3" /> Image
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMediaModal({ show: true, type: 'gallery' })}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-pink/10 border border-neon-pink/30 text-neon-pink rounded-full hover:bg-neon-pink/20 transition-all font-bold uppercase tracking-widest text-[10px]"
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
                                            const youtubeEmbed = `<div class="youtube-player-wrapper w-full relative rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 my-12" style="aspect-ratio: 16/9;">\n  <iframe src="https://www.youtube.com/embed/${videoId}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>\n</div>`;
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
                                                    onClick={() => removeWidget(widget.id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Inline Media Preview */}
                                        {(widget.content.includes('youtube-player-widget') || widget.content.includes('image-premium-wrapper') || widget.content.includes('gallery-premium-grid')) && (
                                            <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 bg-black/40 p-4">
                                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    {widget.content.includes('youtube-player-widget') ? (
                                                        <><Youtube className="w-3 h-3" /> Aperçu Vidéo</>
                                                    ) : (
                                                        <><ImageIcon className="w-3 h-3" /> Aperçu Image</>
                                                    )}
                                                </div>
                                                <div className="article-body-premium editor-preview-content" dangerouslySetInnerHTML={{ __html: widget.content }} />
                                            </div>
                                        )}

                                        {!widget.content.includes('youtube-player-widget') && !widget.content.includes('image-premium-wrapper') && !widget.content.includes('gallery-premium-grid') && (
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
                                        )}

                                        {/* Linker / Add Button between or after */}
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

                        <div className="pt-6">
                            <button
                                onClick={handleSubmit}
                                disabled={status === 'loading'}
                                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${status === 'loading'
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-neon-orange to-neon-red hover:shadow-[0_0_20px_rgba(255,102,0,0.4)]'
                                    } text-white`}
                            >
                                {status === 'loading' ? 'Publication...' : (isEditing ? 'Mettre à jour l\'article' : 'Publier l\'article')}
                            </button>
                        </div>

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
                .article-body-premium img:not(.absolute):not([class*="aspect-"]) {
                    display: block;
                    width: 100% !important;
                    height: auto !important;
                    margin: 2rem auto !important;
                    border-radius: 16px !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                .article-body-premium .grid img,
                .article-body-premium [class*="aspect-"] img {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    object-position: center !important;
                    margin: 0 !important;
                    border-radius: inherit !important;
                }
                /* Editor Preview Overrides */
                .editor-preview-content .youtube-player-wrapper {
                    width: 355px !important; 
                    height: 200px !important;
                    margin: 0 !important;
                }
            `}</style>
                {/* Media Selection Modal */}
                <AnimatePresence>
                    {mediaModal.show && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setMediaModal({ ...mediaModal, show: false })}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative w-full max-w-md bg-dark-bg border border-white/10 rounded-3xl p-8 shadow-2xl"
                            >
                                <button
                                    onClick={() => setMediaModal({ ...mediaModal, show: false })}
                                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <h3 className="text-xl font-display font-black text-white uppercase italic mb-6">
                                    {mediaModal.type === 'image' ? 'Ajouter une photo' : 'Ajouter une galerie'}
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => window.open('https://www.image2url.com/bulk-image-upload', 'ImageUpload', 'width=800,height=600')}
                                        className="flex flex-col items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-neon-red/10 hover:border-neon-red/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Upload className="w-6 h-6 text-neon-red" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest text-white">Upload</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setMediaModal({ ...mediaModal, show: false });
                                            if (mediaModal.type === 'image') {
                                                const url = prompt('Entrez l\'URL de l\'image:');
                                                if (url) {
                                                    const imgMarkdown = `<div class="image-premium-wrapper my-12">\n  <img src="${url}" class="w-full rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 transition-transform duration-700 hover:scale-[1.01] cursor-zoom-in" />\n</div>`;
                                                    setWidgets([...widgets, { id: Math.random().toString(36).substr(2, 9), content: imgMarkdown }]);
                                                }
                                            } else {
                                                const urls = prompt('Entrez les URLs séparées par des virgules:');
                                                if (urls) {
                                                    const urlList = urls.split(',').map(u => u.trim()).filter(u => u);
                                                    const galleryMarkdown = `<div class="gallery-premium-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-12">\n${urlList.map(url => `  <div class="aspect-square relative overflow-hidden rounded-2xl border border-white/10 group shadow-2xl cursor-zoom-in">\n    <img src="${url}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />\n  </div>`).join('\n')}\n</div>`;
                                                    setWidgets([...widgets, { id: Math.random().toString(36).substr(2, 9), content: galleryMarkdown }]);
                                                }
                                            }

                                        }}
                                        className="flex flex-col items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-neon-purple/10 hover:border-neon-purple/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Link2 className="w-6 h-6 text-neon-purple" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest text-white">Lien</span>
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Upload Modal */}
                <ImageUploadModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    accentColor="neon-red"
                />
            </div>
        </div>
    );
}

export default NewsCreate;
