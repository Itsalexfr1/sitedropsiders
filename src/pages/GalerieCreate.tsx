
import { useState } from 'react';
import { Send, Image as ImageIcon, FileText, Calendar, AlertCircle, Grid, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
import { uploadValidation, uploadToCloudinary } from '../utils/uploadService';

export function GalerieCreate() {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().getFullYear().toString());
    const [category, setCategory] = useState('Festivals');
    const [coverUrl, setCoverUrl] = useState('');
    const [imageUrls, setImageUrls] = useState(''); // Textarea content

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');


    const handleUpload = async (file: File) => {
        const validation = uploadValidation(file);
        if (!validation.valid) throw new Error(validation.error);
        return await uploadToCloudinary(file, 'galeries', (p) => setUploadProgress(p));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCover: boolean) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setStatus('loading');
        try {
            const filesArray = Array.from(files);
            for (let i = 0; i < filesArray.length; i++) {
                const file = filesArray[i];
                setUploadProgress(0);
                setMessage(isCover ? 'Upload de la couverture...' : `Upload image ${i + 1}/${filesArray.length}...`);

                const url = await handleUpload(file);
                if (isCover) {
                    setCoverUrl(url);
                } else {
                    setImageUrls(prev => prev ? prev + '\n' + url : url);
                }
            }
            setStatus('success');
            setMessage(isCover ? 'Couverture uploadée !' : `${filesArray.length} images uploadées !`);
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Erreur de connexion au serveur d\'upload');
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
            // Parse images
            const images = imageUrls.split('\n').map(url => url.trim()).filter(url => url !== '');

            if (images.length === 0) {
                throw new Error("Veuillez ajouter au moins une image.");
            }

            const finalCover = coverUrl.trim() || images[0];

            const response = await fetch('/api/galerie/create', {
                method: 'POST',
                headers: getAuthHeaders(),
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
                                <label className="px-6 py-4 bg-neon-pink/20 border border-neon-pink/50 text-neon-pink rounded-xl font-bold uppercase tracking-wider hover:bg-neon-pink/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-w-[120px]">
                                    {uploading && message.includes('couverture') ? (
                                        <>
                                            <span className="text-[10px]">{uploadProgress}%</span>
                                            <div className="w-full bg-neon-pink/20 h-1 rounded-full overflow-hidden mt-1">
                                                <div className="h-full bg-neon-pink" style={{ width: `${uploadProgress}%` }} />
                                            </div>
                                        </>
                                    ) : (
                                        '📤 Upload'
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, true)}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                </label>

                            </div>
                        </div>

                        {/* Images URLs */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Images de la Galerie (Une par ligne)</label>
                                <label className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all cursor-pointer flex items-center gap-2">
                                    {uploading ? 'Upload en cours...' : '📥 Ajouter des photos'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => handleImageUpload(e, false)}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                            <textarea
                                value={imageUrls}
                                onChange={(e) => setImageUrls(e.target.value)}
                                placeholder="https://site.com/image1.jpg&#10;https://site.com/image2.jpg"
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-4 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-all h-64 font-mono text-sm"
                                required
                            />

                            {/* Live Preview Grid */}
                            {imageUrls.trim() && (
                                <div className="mt-6 border-t border-white/10 pt-6">
                                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 block">Aperçu ({imageUrls.split('\n').filter(u => u.trim()).length} images)</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {imageUrls.split('\n').filter(u => u.trim()).map((url, idx) => (
                                            <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-white/10 bg-black/40 group hover:border-neon-pink/50 transition-colors">
                                                <img
                                                    src={url.trim()}
                                                    alt={`Preview ${idx}`}
                                                    className="w-full h-full object-cover transition-opacity duration-300"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.opacity = '0.2';
                                                    }}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity">
                                                    <span className="text-xs font-bold text-white">#{idx + 1}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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
