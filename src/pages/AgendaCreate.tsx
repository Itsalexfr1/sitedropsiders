
import { useState } from 'react';
import { Send, Image as ImageIcon, FileText, Calendar, AlertCircle, MapPin, Link as LinkIcon, Music, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AgendaCreate() {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [location, setLocation] = useState('');
    const [type, setType] = useState('Festival'); // Default
    const [imageUrl, setImageUrl] = useState('');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');
    const [genre, setGenre] = useState('Big Room'); // Default

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('Publication en cours...');

        try {
            const response = await fetch('/api/agenda/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    date,
                    location,
                    type,
                    image: imageUrl,
                    description,
                    url,
                    genre
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la publication');
            }

            setStatus('success');
            setMessage('Événement ajouté avec succès !');
            // Reset form
            setTitle('');
            setDate(new Date().toISOString().split('T')[0]);
            setLocation('');
            setImageUrl('');
            setDescription('');
            setUrl('');

        } catch (error) {
            console.error('Error creating event:', error);
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
                            Nouvel Événement Agenda
                        </h1>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Titre de l'événement</label>
                            <div className="relative group">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: Martin Garrix @ Ushuaïa"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow focus:ring-1 focus:ring-neon-yellow transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Date */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Date</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow focus:ring-1 focus:ring-neon-yellow transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Lieu</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Ex: Ibiza, Espagne"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow focus:ring-1 focus:ring-neon-yellow transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Type */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Type</label>
                                <div className="relative group">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full bg-gray-900 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-yellow focus:ring-1 focus:ring-neon-yellow transition-all appearance-none"
                                    >
                                        <option value="Festival">Festival</option>
                                        <option value="Showcase">Showcase</option>
                                        <option value="Résidence">Résidence</option>
                                        <option value="Opening">Opening</option>
                                        <option value="Events">Events</option>
                                    </select>
                                </div>
                            </div>

                            {/* Genre */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Genre Musical</label>
                                <div className="relative group">
                                    <Music className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                                    <select
                                        value={genre}
                                        onChange={(e) => setGenre(e.target.value)}
                                        className="w-full bg-gray-900 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-yellow focus:ring-1 focus:ring-neon-yellow transition-all appearance-none"
                                    >
                                        <option value="Big Room">Big Room</option>
                                        <option value="Tech House">Tech House</option>
                                        <option value="Techno">Techno</option>
                                        <option value="Melodic Techno">Melodic Techno</option>
                                        <option value="Multi-Genre">Multi-Genre</option>
                                        <option value="Hardstyle">Hardstyle</option>
                                        <option value="Drum & Bass">Drum & Bass</option>
                                    </select>
                                </div>
                            </div>
                        </div>


                        {/* Image URL */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">URL de l'image</label>
                            <div className="relative group">
                                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow focus:ring-1 focus:ring-neon-yellow transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Link URL */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Lien de l'événement (Billetterie/Infos)</label>
                            <div className="relative group">
                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow focus:ring-1 focus:ring-neon-yellow transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Description courte</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Une brève description..."
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-4 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow focus:ring-1 focus:ring-neon-yellow transition-all h-24"
                                required
                            />
                        </div>


                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${status === 'loading'
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-neon-yellow hover:bg-neon-yellow/80 text-black'
                                }`}
                        >
                            {status === 'loading' ? (
                                'Publication en cours...'
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Ajouter à l'Agenda
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
