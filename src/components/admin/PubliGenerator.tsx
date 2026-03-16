import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Copy, Check, Instagram, Facebook, Twitter, Send, RefreshCw, Pencil, Image as ImageIcon, Upload, Trash2, Layout } from 'lucide-react';
import { uploadFile } from '../../utils/uploadService';
import { fixEncoding } from '../../utils/standardizer';

interface PubliGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenSocialStudio?: (text: string, imageUrl: string) => void;
}

export function PubliGenerator({ isOpen, onClose, onOpenSocialStudio }: PubliGeneratorProps) {
    const [sourceText, setSourceText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [results, setResults] = useState<{
        instagram: string;
        facebook: string;
        twitter: string;
        threads: string;
    } | null>(null);

    const handleGenerate = () => {
        if (!sourceText.trim()) return;
        setIsGenerating(true);
        
        // Mock generation logic - Simple and effective, no emojis/hashtags as requested
        setTimeout(() => {
            // On nettoie le texte (correction encodage et fautes communes)
            const cleanText = fixEncoding(sourceText.trim());
            setSourceText(cleanText); // Mise à jour du champ texte avec la version propre
            
            setResults({
                instagram: cleanText,
                facebook: cleanText,
                twitter: cleanText.length > 270 ? `${cleanText.substring(0, 270)}...` : cleanText,
                threads: cleanText
            });
            setIsGenerating(false);
        }, 1200);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadFile(file);
            setImageUrl(url);
        } catch (error) {
            console.error('Error uploading image:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-neon-orange/10 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-neon-orange/20 rounded-2xl border border-neon-orange/30">
                            <Sparkles className="w-6 h-6 text-neon-orange" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">
                                GÉNÉRATEUR <span className="text-neon-orange">PUBLI</span>
                            </h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">Outil réservé à Alex • Social Studio Engine</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 h-full">
                        {/* Input Section */}
                        <div className="flex flex-col gap-10">
                            <div className="flex-1 flex flex-col gap-10">
                                <div className="flex-1 flex flex-col">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-5 flex items-center gap-3">
                                        <Pencil className="w-4 h-4" /> TEXTE SOURCE / IDÉE
                                    </label>
                                    <textarea
                                        value={sourceText}
                                        onChange={(e) => setSourceText(e.target.value)}
                                        placeholder="Colle ici l'actu, le nom du DJ ou l'évènement à promouvoir..."
                                        className="flex-1 w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white text-sm focus:outline-none focus:border-neon-orange transition-all resize-none font-medium leading-relaxed"
                                    />
                                </div>

                                {/* Image Upload Component */}
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6 block flex items-center gap-3">
                                        <ImageIcon className="w-4 h-4" /> PHOTO ASSOCIÉE
                                    </label>
                                    
                                    <div className="flex items-center gap-4">
                                        {imageUrl ? (
                                            <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-white/20 group">
                                                <img src={imageUrl} alt="Uploaded" className="w-full h-full object-cover" />
                                                <button 
                                                    onClick={() => setImageUrl('')}
                                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-neon-red"
                                                >
                                                    <Trash2 className="w-6 h-6" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="w-32 h-32 rounded-2xl border-2 border-dashed border-white/10 hover:border-neon-orange/50 hover:bg-neon-orange/5 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group">
                                                {isUploading ? (
                                                    <RefreshCw className="w-6 h-6 text-neon-orange animate-spin" />
                                                ) : (
                                                    <>
                                                        <Upload className="w-6 h-6 text-gray-500 group-hover:text-neon-orange transition-colors" />
                                                        <span className="text-[8px] font-black text-gray-600 uppercase">Upload</span>
                                                    </>
                                                )}
                                                <input type="file" onChange={handleImageUpload} accept="image/*" className="hidden" />
                                            </label>
                                        )}
                                        <div className="flex-1 flex flex-col gap-2">
                                            <p className="text-[10px] text-gray-500 font-medium">Ajoute une photo pour l'utiliser avec les templates Social Studio.</p>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                                    {isUploading && <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1, repeat: Infinity }} className="w-1/2 h-full bg-neon-orange" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !sourceText.trim()}
                                className="w-full h-16 bg-neon-orange text-white font-black rounded-2xl shadow-[0_0_20px_rgba(255,165,0,0.2)] hover:shadow-[0_0_30px_rgba(255,165,0,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                            >
                                {isGenerating ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                                {isGenerating ? ' GÉNÉRATION EN COURS...' : 'GÉNÉRER LES PUBLICATIONS'}
                            </button>
                        </div>

                        {/* Results Section */}
                        <div className="space-y-6">
                            {!results && !isGenerating ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 px-8">
                                    <Sparkles className="w-16 h-16 mb-6" />
                                    <p className="text-white font-black uppercase italic tracking-widest leading-tight">
                                        Entre un texte à gauche pour générer les formats réseaux
                                    </p>
                                </div>
                            ) : isGenerating ? (
                                <div className="space-y-6">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-6 animate-pulse">
                                            <div className="w-24 h-4 bg-white/10 rounded mb-4" />
                                            <div className="w-full h-12 bg-white/5 rounded" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Aperçus générés</span>
                                            {onOpenSocialStudio && (
                                                <button
                                                    onClick={() => onOpenSocialStudio(results?.instagram || sourceText, imageUrl)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-neon-pink/10 border border-neon-pink/30 rounded-xl text-neon-pink text-[9px] font-black uppercase tracking-widest hover:bg-neon-pink hover:text-white transition-all shadow-lg shadow-neon-pink/5"
                                                >
                                                    <Layout className="w-3.5 h-3.5" />
                                                    Ouvrir dans Social Studio
                                                </button>
                                            )}
                                        </div>

                                        {[
                                            { id: 'instagram', icon: <Instagram className="w-4 h-4 text-pink-500" />, title: 'Instagram', text: results?.instagram },
                                            { id: 'facebook', icon: <Facebook className="w-4 h-4 text-blue-500" />, title: 'Facebook', text: results?.facebook },
                                            { id: 'twitter', icon: <Twitter className="w-4 h-4 text-sky-400" />, title: 'X / Twitter', text: results?.twitter },
                                        ].map((platform) => (
                                            <motion.div
                                                key={platform.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="bg-white/5 border border-white/10 rounded-3xl p-10 group hover:border-white/20 transition-all"
                                            >
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-2">
                                                        {platform.icon}
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{platform.title}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => copyToClipboard(platform.text || '', platform.id)}
                                                        className={`p-2 rounded-xl transition-all ${copied === platform.id ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}
                                                    >
                                                        {copied === platform.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                <p className="text-[11px] text-gray-400 font-medium leading-relaxed whitespace-pre-wrap">
                                                    {platform.text}
                                                </p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-black/40 border-t border-white/5 text-center">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-600">
                        DROPSIDERS CONTENT ENGINE • POWERED BY ALEXFR1
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

