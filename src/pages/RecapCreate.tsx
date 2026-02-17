
import { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Send, Image as ImageIcon, FileText, Calendar, AlertCircle, MapPin, Youtube, PartyPopper } from 'lucide-react';
import { Link } from 'react-router-dom';

export function RecapCreate() {
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('**Écrivez votre récap ici...**');
    const [coverImage, setCoverImage] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [festival, setFestival] = useState('');
    const [location, setLocation] = useState('');
    const [youtubeId, setYoutubeId] = useState('');

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('Publication en cours...');

        try {
            // In a real app, we send data to worker, worker handles GitHub logic
            // We'll mimic the NewsCreate pattern

            const response = await fetch('/api/recaps/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Password': localStorage.getItem('admin_password') || ''
                },
                body: JSON.stringify({
                    title,
                    summary,
                    content,
                    image: coverImage,
                    date,
                    festival,
                    location,
                    youtubeId,
                    category: 'Recaps'
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la publication');
            }

            setStatus('success');
            setMessage('Récap publié avec succès !');
            // Reset form
            setTitle('');
            setSummary('');
            setContent('');
            setCoverImage('');
            setFestival('');
            setLocation('');
            setYoutubeId('');

        } catch (error) {
            console.error('Error creating recap:', error);
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Une erreur est survenue');
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg text-white py-32 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link to="/admin" className="text-gray-400 hover:text-white mb-2 block text-sm">
                            ← Retour Admin
                        </Link>
                        <h1 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter">
                            Nouveau Récap
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
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">ID Youtube (Optionnel)</label>
                                <div className="relative group">
                                    <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                    <input
                                        type="text"
                                        value={youtubeId}
                                        onChange={(e) => setYoutubeId(e.target.value)}
                                        placeholder="Ex: dQw4w9WgXcQ"
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
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Ex: Boom, Belgique"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Image URL */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">URL de l'image de couverture</label>
                            <div className="relative group">
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Contenu (Markdown)</label>
                            <div className="rounded-xl overflow-hidden border border-white/10">
                                <MDEditor
                                    value={content}
                                    onChange={(val) => setContent(val || '')}
                                    preview="live"
                                    height={400}
                                    className="!bg-dark-bg !text-white"
                                />
                            </div>
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
                                    Publier le Récap
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
