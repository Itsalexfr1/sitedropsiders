
import { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Send, Image as ImageIcon, FileText, Calendar, AlertCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export function NewsCreate() {
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'News'; // 'News' or 'Interview'

    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('**Écrivez votre article ici...**');
    const [imageUrl, setImageUrl] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState(type); // Initial state from URL

    useEffect(() => {
        setCategory(type);
    }, [type]);

    const pageTitle = type === 'Interview' ? 'Ajouter une Interview' : 'Ajouter une News';
    // ...

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async () => {
        if (!title || !content || !imageUrl) {
            setStatus('error');
            setMessage('Veuillez remplir tous les champs obligatoires (Titre, Image, Contenu)');
            return;
        }

        setStatus('loading');
        setMessage('Publication en cours...');

        try {
            // Convert markdown to HTML logic could be here if needed for legacy compatibility, 
            // but we'll store whatever the editor produces or even raw markdown if the frontend supports it.
            // For now, let's assume we send the MDEditor output which is markdown text.
            // However, previous news.json has HTML content. Let's wrap it in a div or convert specific markdown to HTML if necessary.
            // The MDEditor output is markdown string. 
            // We might want to convert newline to <br> or use a markdown library on display. 
            // Given the existing project uses HTML in JSON, let's just send the content as is, 
            // and assume we will move towards Markdown or just use the text.
            // Wait, previous file view showed HTML with specific classes. 
            // For simplicity, we will save the content as HTML-like string if we want consistency, 
            // OR we accept that new news will be Markdown. 
            // Let's wrap the markdown content in a simple div for now.

            const payload = {
                title,
                summary,
                date,
                image: imageUrl,
                category,
                content: `<div class="markdown-content">${content.replace(/\n/g, '<br>')}</div>` // Very basic conversion for now
            };

            const response = await fetch('/api/news/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Password': localStorage.getItem('admin_password') || ''
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage('Article publié avec succès ! Il sera visible dans quelques minutes.');
                // Reset form
                setTitle('');
                setSummary('');
                setContent('');
                setImageUrl('');
            } else {
                setStatus('error');
                setMessage(data.error || 'Erreur lors de la publication');
            }
        } catch (e) {
            setStatus('error');
            setMessage('Erreur de connexion au serveur');
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg py-32 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link to="/admin" className="text-gray-400 hover:text-white mb-2 block text-sm">
                            ← Retour Admin
                        </Link>
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

                    {/* Form Fields */}
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
                            placeholder="Un court résumé pour la liste des news..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> Image URL
                        </label>
                        <input
                            type="text"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                            placeholder="https://..."
                        />
                        {imageUrl && (
                            <div className="mt-2 h-40 rounded-lg overflow-hidden border border-white/10">
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>

                    <div data-color-mode="dark">
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Contenu de l'article
                        </label>
                        <div className="wmde-markdown-var">
                            <MDEditor
                                value={content}
                                onChange={(val) => setContent(val || '')}
                                height={400}
                                style={{ backgroundColor: '#000', color: '#fff', borderColor: '#333' }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={status === 'loading'}
                        className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${status === 'loading'
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-neon-orange to-neon-red hover:shadow-[0_0_20px_rgba(255,102,0,0.4)]'
                            } text-white`}
                    >
                        {status === 'loading' ? 'Publication...' : 'Publier l\'article'}
                    </button>

                </div>
            </div>
        </div>
    );
}
