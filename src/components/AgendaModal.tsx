import { useState, useEffect } from 'react';
import { Calendar, MapPin, Send, AlertCircle, FileText, X } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';
import { ImageUploadModal } from './ImageUploadModal';
import { motion, AnimatePresence } from 'framer-motion';

interface AgendaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingItem?: any;
}

export function AgendaModal({ isOpen, onClose, onSuccess, editingItem }: AgendaModalProps) {
    const isEditing = !!editingItem;

    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [locationInput, setLocationInput] = useState('');
    const [type, setType] = useState('Festival');
    const [imageUrl, setImageUrl] = useState('');
    const [url, setUrl] = useState('');
    const [genre, setGenre] = useState('Big Room');
    const [isWeekly, setIsWeekly] = useState(false);
    const [isSoldOut, setIsSoldOut] = useState(false);
    const [isLiveDropsiders, setIsLiveDropsiders] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (isEditing && editingItem) {
            setTitle(editingItem.title || '');
            setStartDate(editingItem.startDate || editingItem.date || new Date().toISOString().split('T')[0]);
            setEndDate(editingItem.endDate || editingItem.date || new Date().toISOString().split('T')[0]);
            setLocationInput(editingItem.location || '');
            setType(editingItem.type || 'Festival');
            setImageUrl(editingItem.image || '');
            setUrl(editingItem.url || '');
            setGenre(editingItem.genre || 'Big Room');
            setIsWeekly(editingItem.isWeekly || false);
            setIsSoldOut(editingItem.isSoldOut || false);
            setIsLiveDropsiders(editingItem.isLiveDropsiders || false);
        } else {
            setTitle('');
            setStartDate(new Date().toISOString().split('T')[0]);
            setEndDate(new Date().toISOString().split('T')[0]);
            setLocationInput('');
            setType('Festival');
            setImageUrl('');
            setUrl('');
            setGenre('Big Room');
            setIsWeekly(false);
            setIsSoldOut(false);
            setIsLiveDropsiders(false);
        }
        setStatus('idle');
        setMessage('');
    }, [isEditing, editingItem, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('Action en cours...');

        try {
            const endpoint = isEditing ? '/api/agenda/update' : '/api/agenda/create';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    id: isEditing ? editingItem.id : undefined,
                    title,
                    date: startDate,
                    startDate,
                    endDate: endDate || startDate,
                    location: locationInput,
                    type,
                    image: imageUrl,
                    url,
                    genre,
                    isWeekly,
                    isSoldOut,
                    isLiveDropsiders,
                    month: new Date(startDate).toLocaleString('fr-FR', { month: 'long' }).toUpperCase()
                }),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (err) {
                    errorData = { error: `Erreur ${response.status}` };
                }
                throw new Error(errorData.error || 'Erreur lors de la publication');
            }

            setStatus('success');
            setMessage(isEditing ? 'Événement mis à jour !' : 'Événement ajouté !');

            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);

        } catch (error) {
            console.error('Error saving agenda item:', error);
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Une erreur est survenue');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-4xl bg-dark-bg border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter">
                            {isEditing ? 'Modifier Événement' : 'Nouvel Événement'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Scrollable Form */}
                    <div className="overflow-y-auto p-8">
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
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-yellow transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Date de début <span className="text-neon-red">*</span></label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-yellow transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Date de fin</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-yellow transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Lieu <span className="text-neon-red">*</span></label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="text"
                                            value={locationInput}
                                            onChange={(e) => setLocationInput(e.target.value)}
                                            placeholder="Ex: Ibiza, Espagne"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon-yellow transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Type</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full bg-gray-900 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-neon-yellow appearance-none"
                                    >
                                        <option value="Festival">Festival</option>
                                        <option value="Showcase">Showcase</option>
                                        <option value="Résidence">Résidence</option>
                                        <option value="Opening">Opening</option>
                                        <option value="Events">Events</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Genre Musical</label>
                                    <select
                                        value={genre}
                                        onChange={(e) => setGenre(e.target.value)}
                                        className="w-full bg-gray-900 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-neon-yellow appearance-none"
                                    >
                                        <option value="Big Room">Big Room</option>
                                        <option value="Tech House">Tech House</option>
                                        <option value="Techno">Techno</option>
                                        <option value="Melodic Techno">Melodic Techno</option>
                                        <option value="Trance">Trance</option>
                                        <option value="Progressive House">Progressive House</option>
                                        <option value="Multi Styles">Multi Styles</option>
                                        <option value="Hybride">Hybride</option>
                                        <option value="Hardstyle">Hardstyle</option>
                                        <option value="Drum & Bass">Drum & Bass</option>
                                        <option value="House">House</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-xl flex-1">
                                    <input type="checkbox" checked={isWeekly} onChange={(e) => setIsWeekly(e.target.checked)} className="w-5 h-5 rounded border-white/10 bg-dark-bg text-neon-yellow" />
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">Hebdomadaire</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-xl flex-1 text-neon-red">
                                    <input type="checkbox" checked={isSoldOut} onChange={(e) => setIsSoldOut(e.target.checked)} className="w-5 h-5 rounded border-white/10 bg-dark-bg text-neon-red" />
                                    <span className="text-xs font-bold uppercase tracking-wider">SOLD OUT</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-xl flex-1 text-neon-cyan">
                                    <input type="checkbox" checked={isLiveDropsiders} onChange={(e) => setIsLiveDropsiders(e.target.checked)} className="w-5 h-5 rounded border-white/10 bg-dark-bg text-neon-cyan" />
                                    <span className="text-xs font-bold uppercase tracking-wider">LIVE TAKEOVER</span>
                                </label>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Image <span className="text-neon-red">*</span></label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="flex-1 bg-black/20 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-neon-yellow"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowUploadModal(true)}
                                        className="px-6 bg-neon-yellow/20 border border-neon-yellow/50 text-neon-yellow rounded-xl font-bold uppercase text-xs hover:bg-neon-yellow/30"
                                    >
                                        Upload
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Lien <span className="text-neon-red">*</span></label>
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-neon-yellow"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all gap-2 flex items-center justify-center ${status === 'loading' ? 'bg-gray-600' : 'bg-neon-yellow text-black'}`}
                            >
                                {status === 'loading' ? 'Action...' : <><Send className="w-5 h-5" /> {isEditing ? 'Mettre à jour' : 'Ajouter'}</>}
                            </button>

                            {status !== 'idle' && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 ${status === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                    <AlertCircle className="w-5 h-5" />
                                    <p className="font-bold uppercase tracking-wider text-xs">{message}</p>
                                </div>
                            )}
                        </form>
                    </div>
                </motion.div>

                <ImageUploadModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    onUploadSuccess={(url) => setImageUrl(url)}
                    accentColor="neon-yellow"
                />
            </div>
        </AnimatePresence>
    );
}
