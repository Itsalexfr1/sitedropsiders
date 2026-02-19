
import { useState, useEffect } from 'react';
import { Send, Image as ImageIcon, FileText, Calendar, AlertCircle, MapPin, Link as LinkIcon, Music, Tag, ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
import { uploadValidation, uploadToCloudinary } from '../utils/uploadService';

export function AgendaCreate() {
    const location = useLocation() as any;
    const isEditing = location.state?.isEditing;
    const editingItem = location.state?.item;

    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [locationInput, setLocationInput] = useState('');
    const [type, setType] = useState('Festival'); // Default
    const [imageUrl, setImageUrl] = useState('');
    const [url, setUrl] = useState('');
    const [genre, setGenre] = useState('Big Room'); // Default
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);


    useEffect(() => {
        if (isEditing && editingItem) {
            setTitle(editingItem.title);
            setDate(editingItem.date);
            setLocationInput(editingItem.location);
            setType(editingItem.type || 'Festival');
            setImageUrl(editingItem.image);
            setUrl(editingItem.url);
            setGenre(editingItem.genre || 'Big Room');
        }
    }, [isEditing, editingItem]);

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleUpload = async (file: File) => {
        const validation = uploadValidation(file);
        if (!validation.valid) throw new Error(validation.error);
        return await uploadToCloudinary(file, 'agenda', (p) => setUploadProgress(p));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress(0);
        setStatus('loading');
        setMessage('Upload de l\'image...');

        try {
            const url = await handleUpload(file);
            setImageUrl(url);
            setStatus('success');
            setMessage('Image uploadée !');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Erreur lors de l\'upload');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('Publication en cours...');

        try {
            const endpoint = isEditing ? '/api/agenda/update' : '/api/agenda/create';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    id: isEditing ? editingItem.id : undefined,
                    title,
                    date,
                    location: locationInput,
                    type,
                    image: imageUrl,
                    url,
                    genre,
                    month: new Date(date).toLocaleString('fr-FR', { month: 'long' }).toUpperCase()
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
            setMessage(isEditing ? 'Événement mis à jour avec succès !' : 'Événement ajouté avec succès !');
            // Reset form
            if (!isEditing) {
                setTitle('');
                setDate(new Date().toISOString().split('T')[0]);
                setLocationInput('');
                setImageUrl('');
                setUrl('');
            }

        } catch (error) {
            console.error('Error creating event:', error);
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
                            {isEditing ? 'Modifier Événement Agenda' : 'Nouvel Événement Agenda'}
                        </h1>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Titre de l'événement <span className="text-neon-red">*</span></label>
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
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Date <span className="text-neon-red">*</span></label>
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
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Lieu <span className="text-neon-red">*</span></label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                                    <input
                                        type="text"
                                        value={locationInput}
                                        onChange={(e) => setLocationInput(e.target.value)}
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
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Image <span className="text-neon-red">*</span></label>
                            <div className="flex gap-2">
                                <div className="relative group flex-1">
                                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-yellow transition-colors" />
                                    <input
                                        type="text"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="https://... ou uploadez une image"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow focus:ring-1 focus:ring-neon-yellow transition-all"
                                        required
                                    />
                                </div>
                                <label className="px-6 py-4 bg-neon-yellow/20 border border-neon-yellow/50 text-neon-yellow rounded-xl font-bold uppercase tracking-wider hover:bg-neon-yellow/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-w-[120px]">
                                    {uploading ? (
                                        <>
                                            <span className="text-[10px]">{uploadProgress}%</span>
                                            <div className="w-full bg-neon-yellow/20 h-1 rounded-full overflow-hidden mt-1">
                                                <div className="h-full bg-neon-yellow" style={{ width: `${uploadProgress}%` }} />
                                            </div>
                                        </>
                                    ) : (
                                        '📤 Upload'
                                    )}
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

                        {/* Link URL */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Lien de l'événement (Billetterie/Infos) <span className="text-neon-red">*</span></label>
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
                                    {isEditing ? 'Mettre à jour' : 'Ajouter à l\'Agenda'}
                                </>
                            )}
                        </button>

                        {/* Status Message */}
                        {status !== 'idle' && (
                            <div className={`p-4 rounded-xl flex flex-col gap-3 ${status === 'error' ? 'bg-red-500/10 text-red-500' :
                                status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5" />
                                    <p className="font-bold uppercase tracking-wider text-xs">{message}</p>
                                </div>
                                {uploading && (
                                    <div className="space-y-2">
                                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-current transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <span className="text-[10px] font-black">{uploadProgress}%</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </form>
                </div>
            </div>
        </div>
    );
}
