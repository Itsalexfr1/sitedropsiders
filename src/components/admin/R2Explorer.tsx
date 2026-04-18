import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Image as ImageIcon, Loader2, Trash2, ExternalLink, 
    RefreshCw, ChevronLeft, ChevronRight, Search, X,
    LayoutGrid, List as ListIcon, HardDrive as StorageIcon
} from 'lucide-react';
import { getAuthHeaders } from '../../utils/auth';

export function R2Explorer() {
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [prefix, setPrefix] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'name' | 'date'>('date');

    const fetchPhotos = async (targetCursor?: string | null) => {
        setLoading(true);
        try {
            if (prefix === 'unused') {
                const res = await fetch('/api/admin/unused-r2-images', { headers: getAuthHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    const mapped = (data.unused || []).map((obj: any) => ({
                        ...obj,
                        url: `/${obj.key}`
                    }));
                    setPhotos(mapped);
                    setCursor(null);
                }
                return;
            }

            const sortParam = sortBy === 'date' ? '&sort=date' : '';
            const url = `/api/r2/list?limit=60${targetCursor ? `&cursor=${encodeURIComponent(targetCursor)}` : ''}${prefix ? `&prefix=${encodeURIComponent(prefix)}` : ''}${sortParam}`;
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
        fetchPhotos();
        setHistory([]);
    }, [prefix, sortBy]);

    const handleNext = () => {
        if (cursor && prefix !== 'unused') {
            setHistory(prev => [...prev, cursor]);
            fetchPhotos(cursor);
        }
    };

    const handleBack = () => {
        if (prefix === 'unused') return;
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

    const folderOptions = [
        { label: 'Uploads Site', value: 'uploads/' },
        { label: 'Musiques (MP3)', value: 'mp3/' },
        { label: 'Contenu Migré', value: 'migrated/' },
        { label: 'Inutilisées 🗑️', value: 'unused' },
        { label: 'Tous les fichiers', value: '' },
    ];

    const filteredPhotos = photos.filter(p => p.key.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header / Stats Overlay */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-neon-red/5 blur-[120px] pointer-events-none" />
                
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-neon-red/20 rounded-2xl flex items-center justify-center border border-neon-red/30 shadow-[0_0_30px_rgba(255,18,65,0.2)]">
                            <StorageIcon className="w-8 h-8 text-neon-red" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter">
                                Explorer <span className="text-neon-red">Cloud R2</span>
                            </h2>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Gestionnaire d'actifs haute performance</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="bg-black/40 p-1 border border-white/5 rounded-xl flex gap-1">
                            {folderOptions.map(folder => (
                                <button
                                    key={folder.value}
                                    onClick={() => setPrefix(folder.value)}
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${prefix === folder.value ? 'bg-neon-red text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {folder.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-black/40 border border-white/5 p-4 rounded-3xl backdrop-blur-md">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-red transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Rechercher un fichier..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-neon-red transition-all font-bold placeholder:text-gray-600"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-all"
                        >
                            <X className="w-4 h-4 text-gray-500 hover:text-white" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="bg-white/5 p-1 rounded-xl flex border border-white/10">
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-transparent border-none rounded-lg px-2 py-1 text-[10px] font-bold text-white outline-none focus:ring-0 uppercase cursor-pointer"
                        >
                            <option value="date" className="bg-[#0a0a0a]">Tri : Récent</option>
                            <option value="name" className="bg-[#0a0a0a]">Tri : Nom</option>
                        </select>
                        <div className="w-px h-100% bg-white/5 mx-1" />
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <ListIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <button 
                        onClick={() => fetchPhotos()} 
                        className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all flex items-center gap-2 group"
                        title="Rafraîchir"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {loading && photos.length === 0 ? (
                    <div className="py-40 flex flex-col items-center justify-center gap-6">
                        <div className="relative">
                            <Loader2 className="w-16 h-16 animate-spin text-neon-red" />
                            <div className="absolute inset-0 blur-xl bg-neon-red/20 animate-pulse" />
                        </div>
                        <p className="text-gray-500 font-black uppercase tracking-[0.3em] italic animate-pulse">Scanning Cloud Bucket...</p>
                    </div>
                ) : filteredPhotos.length === 0 ? (
                    <div className="py-40 flex flex-col items-center justify-center gap-6 opacity-30">
                        <div className="p-8 bg-white/5 rounded-full border border-dashed border-white/20">
                            <ImageIcon className="w-20 h-20 text-gray-500" />
                        </div>
                        <p className="text-2xl font-black uppercase italic tracking-tighter text-gray-500">Aucun actif trouvé dans ce dossier</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {filteredPhotos.map((photo, idx) => (
                            <motion.div 
                                key={photo.key}
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                                className="group relative aspect-square bg-white/5 border border-white/5 rounded-3xl overflow-hidden hover:border-white/20 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-pointer"
                            >
                                <img 
                                    src={photo.url} 
                                    alt={photo.key} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                    loading="lazy"
                                    onError={(e) => {
                                        (e.currentTarget as any).src = 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?q=80&w=300&auto=format&fit=crop';
                                        (e.currentTarget as any).className = "w-full h-full object-cover grayscale opacity-30 p-8";
                                    }}
                                />
                                
                                {/* Status Indicator */}
                                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-neon-green shadow-[0_0_10px_#22c55e] opacity-0 group-hover:opacity-100 transition-opacity" />

                                {/* Overlay info */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-5">
                                    <p className="text-[10px] font-black text-white truncate uppercase tracking-widest mb-1">{photo.key.split('/').pop()}</p>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase mb-4">{(photo.size / 1024).toFixed(1)} KB • {new Date(photo.uploaded).toLocaleDateString()}</p>
                                    
                                    <div className="flex gap-2">
                                        <a 
                                            href={photo.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex-1 py-2 bg-white/10 hover:bg-white text-white hover:text-black rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span className="text-[8px] font-black uppercase">Voir</span>
                                        </a>
                                        <button 
                                            onClick={() => handleDelete(photo.key)}
                                            className="p-2 bg-neon-red/20 hover:bg-neon-red text-neon-red hover:text-white rounded-xl transition-all border border-neon-red/30"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    /* LIST VIEW */
                    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.02] border-b border-white/5">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Aperçu</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Nom de fichier</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Taille</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Date</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredPhotos.map((photo) => (
                                    <tr key={photo.key} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-4">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 border border-white/10">
                                                <img 
                                                    src={photo.url} 
                                                    alt="" 
                                                    className="w-full h-full object-cover group-hover:scale-125 transition-transform" 
                                                    loading="lazy"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <p className="text-sm font-bold text-white uppercase italic tracking-tight truncate max-w-sm">{photo.key}</p>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <span className="text-[10px] font-mono text-gray-400">{(photo.size / 1024).toFixed(1)} KB</span>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">{new Date(photo.uploaded).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex justify-end gap-2">
                                                <a 
                                                    href={photo.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-2.5 bg-white/5 hover:bg-white hover:text-black rounded-xl text-gray-400 transition-all border border-white/10"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                                <button 
                                                    onClick={() => handleDelete(photo.key)}
                                                    className="p-2.5 bg-neon-red/10 hover:bg-neon-red text-neon-red hover:text-white rounded-xl transition-all border border-neon-red/20"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination / Footer */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-white/5">
                <div className="flex items-center gap-4">
                    <button 
                        disabled={history.length === 0}
                        onClick={handleBack}
                        className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-[0.2em] disabled:opacity-20 transition-all flex items-center gap-3 group"
                    >
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Précédent
                    </button>
                    <button 
                        disabled={!cursor}
                        onClick={handleNext}
                        className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-[0.2em] disabled:opacity-20 transition-all flex items-center gap-3 group"
                    >
                        Suivant <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="text-center">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.4em]">
                        DROPSIDERS ASSETS ENGINE • {filteredPhotos.length} OBJETS AFFICHÉS
                    </p>
                </div>

                <div className="hidden lg:block">
                    <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_10px_#00ffff]" />
                        <span className="text-[9px] text-neon-cyan font-black uppercase tracking-widest">Connecté à Cloudflare R2</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
