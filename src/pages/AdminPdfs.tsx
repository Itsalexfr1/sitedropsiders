import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, Upload, Trash2, Search, ArrowLeft, 
    Loader2, CheckCircle2, AlertCircle, Plus, 
    File, Download, ExternalLink, X, Info, Copy, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
import { uploadFile } from '../utils/uploadService';

interface PDF {
    id: string;
    title: string;
    url: string;
    size: string;
    category: string;
    date: string;
}

export function AdminPdfs() {
    const [pdfs, setPdfs] = useState<PDF[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading' | 'idle', message: string }>({ type: 'idle', message: '' });
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    
    // New PDF state
    const [newPdfTitle, setNewPdfTitle] = useState('');
    const [newPdfCategory, setNewPdfCategory] = useState('Général');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const fetchPdfs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/pdfs', { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setPdfs(data);
            }
        } catch (error) {
            console.error('Error fetching PDFs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPdfs();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                setStatus({ type: 'error', message: 'Seuls les fichiers PDF sont acceptés.' });
                return;
            }
            setSelectedFile(file);
            if (!newPdfTitle) {
                // Remove extension for title
                setNewPdfTitle(file.name.replace(/\.[^/.]+$/, ""));
            }
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setStatus({ type: 'loading', message: 'Upload en cours...' });

        try {
            const uploadRes = await uploadFile(selectedFile, 'pdfs');
            if (uploadRes) {
                // 2. Save metadata to pdfs.json
                const saveRes = await fetch('/api/pdfs/create', {
                    method: 'POST',
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title: newPdfTitle,
                        url: uploadRes,
                        size: formatSize(selectedFile.size),
                        category: newPdfCategory
                    })
                });

                if (saveRes.ok) {
                    setStatus({ type: 'success', message: 'PDF ajouté avec succès !' });
                    setIsUploadModalOpen(false);
                    setSelectedFile(null);
                    setNewPdfTitle('');
                    fetchPdfs();
                } else {
                    const error = await saveRes.json();
                    setStatus({ type: 'error', message: error.error || 'Erreur lors de la sauvegarde.' });
                }
            } else {
                setStatus({ type: 'error', message: 'Erreur lors de l\'upload du fichier.' });
            }
        } catch (error) {
            console.error('Upload failed:', error);
            setStatus({ type: 'error', message: 'Une erreur est survenue.' });
        } finally {
            setUploading(false);
            setTimeout(() => setStatus({ type: 'idle', message: '' }), 3000);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

        try {
            const res = await fetch('/api/pdfs/delete', {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                setPdfs(prev => prev.filter(p => p.id !== id));
                setStatus({ type: 'success', message: 'PDF supprimé.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Erreur lors de la suppression.' });
        } finally {
            setTimeout(() => setStatus({ type: 'idle', message: '' }), 3000);
        }
    };

    const copyToClipboard = (url: string, id: string) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredPdfs = pdfs.filter(pdf => 
        pdf.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pdf.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-dark-bg py-32 px-4 md:px-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div className="flex items-center gap-6">
                        <Link to="/admin" className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white group">
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter">
                                GESTION <span className="text-neon-cyan">DES PDF</span>
                            </h1>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                <Info className="w-4 h-4 text-neon-cyan" />
                                Hébergement cloud direct (R2)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Rechercher un document..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-neon-cyan transition-colors w-full md:w-80"
                            />
                        </div>
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="p-4 bg-neon-cyan text-black rounded-full hover:bg-white transition-all shadow-lg shadow-neon-cyan/20 group"
                        >
                            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {status.type !== 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`mb-8 p-4 rounded-xl flex items-center gap-3 border ${
                                status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                status.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                'bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan'
                            }`}
                        >
                            {status.type === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                             status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                             <AlertCircle className="w-5 h-5" />}
                            <span className="font-bold">{status.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="w-12 h-12 text-neon-cyan animate-spin" />
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Chargement des documents...</p>
                    </div>
                ) : filteredPdfs.length === 0 ? (
                    <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-24 text-center">
                        <FileText className="w-16 h-16 text-gray-700 mx-auto mb-6" />
                        <h3 className="text-2xl font-display font-black text-white uppercase mb-2">Aucun document</h3>
                        <p className="text-gray-500 text-sm max-w-md mx-auto">
                            Commencez par uploader votre premier fichier PDF. Il sera stocké sur nos serveurs et accessible via un lien direct.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPdfs.map((pdf) => (
                            <motion.div
                                key={pdf.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 bg-neon-cyan/10 rounded-xl flex items-center justify-center text-neon-cyan group-hover:scale-110 transition-transform">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => copyToClipboard(pdf.url, pdf.id)}
                                                className={`p-2 rounded-lg transition-all ${copiedId === pdf.id ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}
                                                title="Copier le lien"
                                            >
                                                {copiedId === pdf.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(pdf.id)}
                                                className="p-2 bg-white/5 rounded-lg text-gray-500 hover:text-neon-red hover:bg-neon-red/10 transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="py-2">
                                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{pdf.title}</h3>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-neon-cyan uppercase tracking-widest bg-neon-cyan/5 px-2 py-1 rounded">
                                                {pdf.category}
                                            </span>
                                            <span className="text-gray-500 text-xs font-medium">{pdf.size}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
                                        <span className="text-[10px] text-gray-600 uppercase tracking-widest">
                                            {new Date(pdf.date).toLocaleDateString('fr-FR')}
                                        </span>
                                        <a
                                            href={pdf.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/20 rounded-lg text-neon-cyan text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neon-cyan hover:text-black transition-all"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            Voir en ligne
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsUploadModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-xl bg-dark-bg border border-white/10 p-8 md:p-12 rounded-[3rem] shadow-2xl"
                        >
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="text-center mb-10">
                                <div className="w-20 h-20 bg-neon-cyan/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-neon-cyan border border-neon-cyan/20">
                                    <Upload className="w-10 h-10" />
                                </div>
                                <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">
                                    UPLOADER <span className="text-neon-cyan">UN PDF</span>
                                </h2>
                            </div>

                            <div className="space-y-6">
                                {!selectedFile ? (
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center hover:border-neon-cyan/50 hover:bg-white/5 transition-all">
                                            <File className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">
                                                Cliquez ou glissez un PDF ici
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                                        <div className="w-12 h-12 bg-neon-cyan/20 rounded-xl flex items-center justify-center text-neon-cyan">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-white font-bold truncate">{selectedFile.name}</p>
                                            <p className="text-xs text-gray-500">{formatSize(selectedFile.size)}</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedFile(null)}
                                            className="p-2 text-gray-500 hover:text-neon-red transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Titre du document</label>
                                        <input
                                            type="text"
                                            value={newPdfTitle}
                                            onChange={(e) => setNewPdfTitle(e.target.value)}
                                            placeholder="Ex: Dossier de Presse 2025"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Catégorie</label>
                                        <select
                                            value={newPdfCategory}
                                            onChange={(e) => setNewPdfCategory(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-cyan transition-colors appearance-none"
                                        >
                                            <option value="Général">Général</option>
                                            <option value="Presse">Presse</option>
                                            <option value="Partenaires">Partenaires</option>
                                            <option value="Artistes">Artistes</option>
                                            <option value="Règlements">Règlements</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleUpload}
                                    disabled={!selectedFile || !newPdfTitle || uploading}
                                    className="w-full py-5 bg-neon-cyan text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white disabled:opacity-30 disabled:hover:bg-neon-cyan transition-all flex items-center justify-center gap-3 shadow-xl shadow-neon-cyan/20"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Upload en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5" />
                                            Ajouter le document
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
