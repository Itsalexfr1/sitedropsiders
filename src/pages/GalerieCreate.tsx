
import { useState } from 'react';
import { Send, Image as ImageIcon, FileText, Calendar, AlertCircle, Grid } from 'lucide-react';
import { Link } from 'react-router-dom';

export function GalerieCreate() {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().getFullYear().toString());
    const [category, setCategory] = useState('Festivals');
    const [coverUrl, setCoverUrl] = useState('');
    const [imageUrls, setImageUrls] = useState(''); // Textarea content

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

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

            const response = await fetch('/api/galerie/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Password': localStorage.getItem('admin_password') || ''
                },
                body: JSON.stringify({
                    title,
                    date,
                    category,
                    cover: finalCover,
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
            setMessage('Album créé avec succès !');
            // Reset form
            setTitle('');
            setDate(new Date().getFullYear().toString());
            setCoverUrl('');
            setImageUrls('');

        } catch (error) {
            console.error('Error creating album:', error);
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
                            Nouvel Album Photo
                        </h1>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Titre de l'Album</label>
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
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Année</label>
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
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">URL de la couverture (Optionnel)</label>
                            <div className="relative group">
                                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-pink transition-colors" />
                                <input
                                    type="text"
                                    value={coverUrl}
                                    onChange={(e) => setCoverUrl(e.target.value)}
                                    placeholder="Laisser vide pour utiliser la première image"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-all"
                                />
                            </div>
                        </div>

                        {/* Images URLs */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">URLs des images (Une par ligne)</label>
                            <textarea
                                value={imageUrls}
                                onChange={(e) => setImageUrls(e.target.value)}
                                placeholder="https://site.com/image1.jpg&#10;https://site.com/image2.jpg"
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-4 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-all h-64 font-mono text-sm"
                                required
                            />
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
                                    Créer l'Album
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
