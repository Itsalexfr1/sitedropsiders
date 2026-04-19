import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Loader2, Trash2, ExternalLink, HardDrive, RefreshCw, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { getAuthHeaders } from '../../../utils/auth';

interface R2PhotosMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (url: string) => void;
    mode?: 'view' | 'select';
}

export function R2PhotosMenuModal({ isOpen, onClose, onSelect, mode = 'view' }: R2PhotosMenuModalProps) {
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUnused, setShowUnused] = useState(false);

    const fetchPhotos = async (targetCursor?: string | null) => {
        setLoading(true);
        try {
            if (showUnused) {
                const res = await fetch('/api/admin/unused-r2-images', { headers: getAuthHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    setPhotos((data.unused || []).map((p: any) => ({ ...p, url: `/${p.key}` })));
                    setCursor(null);
                }
                return;
            }

            const url = `/api/r2/list?limit=40&sort=date${targetCursor ? `&cursor=${encodeURIComponent(targetCursor)}` : ''}`;
            const res = await fetch(url, { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setPhotos(data.objects || []);
                setCursor(data.cursor || null);
            }
        } catch (err) {
            console.error('Failed to fetch R2 photos', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchPhotos();
            setHistory([]);
        }
    }, [isOpen, showUnused]);

    const handleNext = () => {
        if (cursor && !showUnused) {
            setHistory(prev => [...prev, cursor]);
            fetchPhotos(cursor);
        }
    };

    const handleBack = () => {
        if (showUnused) return;
        const newHistory = [...history];
        newHistory.pop(); // remove current
        const prevCursor = newHistory[newHistory.length - 1] || null;
        setHistory(newHistory);
        fetchPhotos(prevCursor);
    };

    const handleDelete = async (key: string) => {
        if (!confirm('Supprimer définitivement cette photo de R2 ?')) return;
        try {
            const res = await fetch('/api/r2/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ key })
            });
            if (res.ok) {
                setPhotos(prev => prev.filter(p => p.key !== key));
            }
        } catch (err) {
            console.error('Failed to delete photo', err);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/r2/upload', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                const newPhoto = { key: data.key, url: data.url, size: file.size, uploaded: new Date().toISOString() };
                setPhotos(prev => [newPhoto, ...prev]);
                if (mode === 'select' && onSelect) {
                    onSelect(data.url);
                }
            }
        } catch (err) {
            console.error('Upload failed', err);
        } finally {
            setIsUploading(false);
        }
    };

    const filteredPhotos = photos.filter(p => p.key.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-2xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        className="bg-[#050505] border border-white/10 rounded-[2rem] md:rounded-[3rem] w-full h-full max-w-7xl flex flex-col shadow-[0_0_100px_rgba(255,51,102,0.15)] relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-white to-neon-red opacity-50" />
                        
                        <div className="p-6 md:p-10 flex flex-col md:flex-row justify-between items-start gap-6 border-b border-white/5 relative z-10">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                    EXPLORATEUR <span className="text-neon-red shadow-[0_0_20px_rgba(255,18,65,0.4)]">R2 CLOUD</span>
                                </h2>
                                <div className="flex items-center gap-3">
                                    <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                                        <HardDrive className="w-3 h-3 text-neon-red" />
                                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Bucket: dropsiders-assets</span>
                                    </div>
                                    <button 
                                        onClick={() => setShowUnused(!showUnused)}
                                        className={`px-3 py-1 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest ${showUnused ? 'bg-neon-red text-white border-neon-red shadow-[0_0_15px_rgba(255,18,65,0.3)]' : 'bg-white/5 text-gray-500 border-white/10 hover:text-white'}`}
                                    >
                                        Images Non Utilisées {showUnused ? 'Activé' : 'Off'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                <div className="relative flex-grow md:flex-initial">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input 
                                        type="text" 
                                        placeholder="Filtrer dans la page..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full md:w-48 pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:ring-1 focus:ring-neon-red outline-none transition-all"
                                    />
                                </div>

                                <label className="flex items-center gap-2 px-4 py-2 bg-neon-red hover:bg-red-600 text-white rounded-xl cursor-pointer transition-all shadow-lg shadow-neon-red/20 group">
                                    {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{isUploading ? 'Chargement...' : 'Upload'}</span>
                                    <input type="file" onChange={handleUpload} className="hidden" accept="image/*" />
                                </label>

                                <button 
                                    onClick={() => fetchPhotos()} 
                                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all scale-110 md:scale-100"
                                    title="Rafraîchir"
                                >
                                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all hover:rotate-90"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto p-6 md:p-10 custom-scrollbar">
                            {loading && photos.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-500">
                                    <Loader2 className="w-12 h-12 animate-spin text-neon-red" />
                                    <p className="font-black uppercase tracking-widest animate-pulse">Scan du bucket R2...</p>
                                </div>
                            ) : filteredPhotos.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-500 opacity-20">
                                    <ImageIcon className="w-20 h-20" />
                                    <p className="text-2xl font-black uppercase italic tracking-tighter">Aucune photo trouvée</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-12">
                                    {filteredPhotos.map((photo) => (
                                        <motion.div 
                                            key={photo.key}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="group relative aspect-square bg-white/5 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all hover:shadow-2xl hover:shadow-black"
                                        >
                                            <img 
                                                src={photo.url} 
                                                alt={photo.key} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                loading="lazy"
                                                onError={(e) => {
                                                    (e.currentTarget as any).src = 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?q=80&w=300&auto=format&fit=crop';
                                                    (e.currentTarget as any).className = "w-full h-full object-cover grayscale opacity-30";
                                                }}
                                            />
                                            
                                            {/* Overlay info */}
                                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/90 to-transparent translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                {mode === 'select' ? (
                                                    <button 
                                                        onClick={() => onSelect?.(photo.url)}
                                                        className="w-full py-2 bg-neon-red text-white text-[9px] font-black uppercase rounded-lg mb-2 shadow-lg shadow-neon-red/30 hover:scale-105 active:scale-95 transition-all"
                                                    >
                                                        Sélectionner
                                                    </button>
                                                ) : (
                                                    <p className="text-[8px] font-black text-white truncate uppercase tracking-widest mb-2">{photo.key.split('/').pop()}</p>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[7px] text-gray-400 font-bold">{(photo.size / 1024).toFixed(1)} KB</span>
                                                    <div className="flex gap-1.5">
                                                        <a 
                                                            href={photo.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="p-1 px-1.5 bg-white/10 hover:bg-neon-red text-white rounded-md transition-colors"
                                                            title="Ouvrir original"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                        <button 
                                                            onClick={() => handleDelete(photo.key)}
                                                            className="p-1 px-1.5 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-md transition-colors"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Date badge */}
                                            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[6px] text-white font-black uppercase tracking-tighter">
                                                    {new Date(photo.uploaded).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 md:p-8 border-t border-white/5 bg-black/40 flex flex-col md:flex-row items-center justify-between gap-6 relative z-20">
                            <div className="flex items-center gap-4 order-2 md:order-1">
                                <button 
                                    disabled={history.length === 0}
                                    onClick={handleBack}
                                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-black uppercase tracking-widest disabled:opacity-20 transition-all flex items-center gap-2 group"
                                >
                                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Précédent
                                </button>
                                <button 
                                    disabled={!cursor}
                                    onClick={handleNext}
                                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-black uppercase tracking-widest disabled:opacity-20 transition-all flex items-center gap-2 group"
                                >
                                    Suivant <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>

                            <div className="text-center order-1 md:order-2">
                                <span className="text-[9px] font-black text-gray-700 uppercase tracking-[0.4em] opacity-50">DROPSIDERS R2 CLOUD ASSETS ENGINE v2.5</span>
                            </div>
                            
                            <div className="hidden md:block order-3">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                    Page actuelle : {filteredPhotos.length} fichiers
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
