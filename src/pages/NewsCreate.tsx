
import { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Send, Image as ImageIcon, FileText, Calendar, AlertCircle, ArrowLeft, Youtube, Plus, Trash2 } from 'lucide-react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';

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
    const [uploading, setUploading] = useState(false);

    // Widget System State
    const [widgets, setWidgets] = useState<{ id: string, content: string }[]>([
        { id: 'initial-1', content: '**Écrivez votre article ici...**' }
    ]);

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('path', 'news');

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: getAuthHeaders(null),
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                setImageUrl(data.url);
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

                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">

                    {/* Status Message */}
                    {status === 'error' && (
                        <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl text-red-200 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5" />
                            {message}
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="bg-green-500/20 border border-green-500/50 p-4 rounded-xl text-green-200 flex items-center gap-3">
                            <Send className="w-5 h-5" />
                            {message}
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
                                <label className="px-4 py-3 bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan rounded-lg font-bold uppercase tracking-wider hover:bg-neon-cyan/30 transition-all cursor-pointer flex items-center gap-2">
                                    {uploading ? '...' : 'Upload'}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                                </label>
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

                                    {/* Linker / Add Button between or after */}
                                    <div className="flex justify-center gap-4 mt-4">
                                        {index === widgets.length - 1 && (
                                            <>
                                                <button
                                                    onClick={addWidget}
                                                    className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-full hover:bg-neon-cyan/20 transition-all font-bold uppercase tracking-widest text-xs"
                                                >
                                                    <Plus className="w-4 h-4" /> Ajouter un bloc de texte
                                                </button>
                                                <label className="flex items-center gap-2 px-4 py-2 bg-neon-purple/10 border border-neon-purple/30 text-neon-purple rounded-full hover:bg-neon-purple/20 transition-all font-bold uppercase tracking-widest text-xs cursor-pointer">
                                                    <ImageIcon className="w-4 h-4" /> Ajouter une image
                                                    <input type="file" accept="image/*" onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const formData = new FormData();
                                                            formData.append('image', file);
                                                            formData.append('path', 'news');
                                                            fetch('/api/upload', {
                                                                method: 'POST',
                                                                headers: getAuthHeaders(null),
                                                                body: formData
                                                            }).then(res => res.json()).then(data => {
                                                                if (data.success) {
                                                                    setWidgets([...widgets, { id: Math.random().toString(36).substr(2, 9), content: `![image](${data.url})` }]);
                                                                }
                                                            });
                                                        }
                                                    }} className="hidden" />
                                                </label>
                                            </>
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
        </div >
    );
}
