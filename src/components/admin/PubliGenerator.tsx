import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Sparkles, Copy, Check, Instagram, Facebook, Twitter,
    RefreshCw, Pencil, Image as ImageIcon, Upload, Trash2,
    Layout, Heart, MessageCircle, Repeat2, Bookmark, Share2,
    ThumbsUp, Globe, ChevronDown, MoreHorizontal
} from 'lucide-react';
import { uploadFile } from '../../utils/uploadService';
import { fixEncoding } from '../../utils/standardizer';
import { R2PhotosMenuModal } from './modals/R2PhotosMenuModal';

interface PubliGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenSocialStudio?: (text: string, imageUrl: string) => void;
}

type Platform = 'instagram' | 'facebook' | 'twitter';

const platformConfig = {
    instagram: {
        icon: <Instagram className="w-4 h-4" />,
        label: 'Instagram',
        color: 'from-purple-500 to-pink-500',
        accent: '#e1306c',
        charLimit: 2200,
    },
    facebook: {
        icon: <Facebook className="w-4 h-4" />,
        label: 'Facebook',
        color: 'from-blue-600 to-blue-400',
        accent: '#1877f2',
        charLimit: 63206,
    },
    twitter: {
        icon: <Twitter className="w-4 h-4" />,
        label: 'X / Twitter',
        color: 'from-sky-400 to-sky-600',
        accent: '#1d9bf0',
        charLimit: 280,
    },
};

function InstagramPreview({ text, imageUrl }: { text: string; imageUrl: string }) {
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    return (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden font-sans">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px] flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center">
                        <span className="text-[8px] font-black text-white">DS</span>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white leading-tight">dropsiders_official</p>
                    <p className="text-[9px] text-gray-500">Sponsorisé</p>
                </div>
                <MoreHorizontal className="w-4 h-4 text-gray-500 flex-shrink-0" />
            </div>
            {/* Image */}
            {imageUrl ? (
                <img src={imageUrl} alt="Post" className="w-full aspect-square object-cover" />
            ) : (
                <div className="w-full aspect-square bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-600" />
                </div>
            )}
            {/* Actions */}
            <div className="px-4 pt-3 pb-2 flex items-center gap-4">
                <button onClick={() => setLiked(l => !l)} className="transition-transform active:scale-75">
                    <Heart className={`w-5 h-5 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                </button>
                <MessageCircle className="w-5 h-5 text-white" />
                <Share2 className="w-5 h-5 text-white" />
                <div className="flex-1" />
                <button onClick={() => setSaved(s => !s)} className="transition-transform active:scale-75">
                    <Bookmark className={`w-5 h-5 transition-colors ${saved ? 'fill-white text-white' : 'text-white'}`} />
                </button>
            </div>
            <div className="px-4 pb-3">
                <p className="text-[10px] font-bold text-white mb-1">1 247 J'aime</p>
                {text ? (
                    <p className="text-[10px] text-gray-300 leading-relaxed">
                        <span className="font-bold text-white">dropsiders_official </span>
                        {text.length > 120 ? `${text.substring(0, 120)}... ` : text}
                        {text.length > 120 && <span className="text-gray-500">plus</span>}
                    </p>
                ) : (
                    <p className="text-[10px] text-gray-600 italic">Aucun texte saisi...</p>
                )}
            </div>
        </div>
    );
}

function FacebookPreview({ text, imageUrl }: { text: string; imageUrl: string }) {
    const [liked, setLiked] = useState(false);
    return (
        <div className="bg-[#1c1e21] border border-white/10 rounded-2xl overflow-hidden font-sans">
            <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-orange to-orange-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-black text-white">DS</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white leading-tight">Dropsiders Official</p>
                    <div className="flex items-center gap-1">
                        <p className="text-[9px] text-gray-400">À l'instant ·</p>
                        <Globe className="w-2.5 h-2.5 text-gray-400" />
                    </div>
                </div>
                <MoreHorizontal className="w-4 h-4 text-gray-500 flex-shrink-0" />
            </div>
            {text ? (
                <p className="px-4 pb-3 text-[11px] text-gray-200 leading-relaxed">
                    {text.length > 150 ? `${text.substring(0, 150)}... ` : text}
                    {text.length > 150 && <span className="text-[#1877f2] cursor-pointer">Voir plus</span>}
                </p>
            ) : (
                <p className="px-4 pb-3 text-[11px] text-gray-600 italic">Aucun texte saisi...</p>
            )}
            {imageUrl ? (
                <img src={imageUrl} alt="Post" className="w-full aspect-video object-cover" />
            ) : (
                <div className="mx-4 mb-3 aspect-video bg-[#2d2e32] rounded-xl flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-600" />
                </div>
            )}
            <div className="px-4 py-2 border-t border-white/5 flex items-center gap-1">
                {['👍', '❤️', '😂'].map((e, i) => (
                    <span key={i} className="text-[10px] -ml-1 first:ml-0">{e}</span>
                ))}
                <p className="text-[9px] text-gray-500 ml-1">3,4k</p>
                <div className="flex-1" />
                <p className="text-[9px] text-gray-500">147 commentaires</p>
            </div>
            <div className="px-2 py-1 border-t border-white/5 flex items-center gap-1">
                <button
                    onClick={() => setLiked(l => !l)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all text-[10px] font-bold ${liked ? 'text-[#1877f2]' : 'text-gray-400 hover:bg-white/5'}`}
                >
                    <ThumbsUp className={`w-3.5 h-3.5 ${liked ? 'fill-[#1877f2]' : ''}`} />
                    J'aime
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-gray-400 hover:bg-white/5 transition-all text-[10px] font-bold">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Commenter
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-gray-400 hover:bg-white/5 transition-all text-[10px] font-bold">
                    <Share2 className="w-3.5 h-3.5" />
                    Partager
                </button>
            </div>
        </div>
    );
}

function TwitterPreview({ text, imageUrl }: { text: string; imageUrl: string }) {
    const [liked, setLiked] = useState(false);
    const [retweeted, setRetweeted] = useState(false);
    const truncated = text.length > 280 ? text.substring(0, 280) : text;
    return (
        <div className="bg-black border border-white/10 rounded-2xl p-4 font-sans">
            <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-black text-white">DS</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-[11px] font-bold text-white">Dropsiders</p>
                        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-sky-400"><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91-1.01-1-2.52-1.27-3.91-.81-.66-1.31-2-2.19-3.34-2.19-1.43 0-2.67.88-3.34 2.19-1.39-.46-2.9-.2-3.91.81-1 1.01-1.27 2.52-.81 3.91-1.31.67-2.19 1.91-2.19 3.34 0 1.43.88 2.67 2.19 3.34-.46 1.39-.2 2.9.81 3.91 1.01 1 2.52 1.27 3.91.81.67 1.31 1.91 2.19 3.34 2.19 1.43 0 2.67-.88 3.34-2.19 1.39.46 2.9.2 3.91-.81 1-1.01 1.27-2.52.81-3.91 1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/></svg>
                        <p className="text-[9px] text-gray-500">@dropsiders_off · maintenant</p>
                    </div>
                    {truncated ? (
                        <p className="text-[11px] text-white leading-relaxed mb-2">{truncated}</p>
                    ) : (
                        <p className="text-[11px] text-gray-600 italic mb-2">Aucun texte saisi...</p>
                    )}
                    {text.length > 280 && (
                        <p className="text-[9px] text-sky-400 mb-2">Tronqué à 280 caractères</p>
                    )}
                    {imageUrl && (
                        <img src={imageUrl} alt="Post" className="w-full rounded-xl aspect-video object-cover mb-2" />
                    )}
                    <div className="flex items-center gap-5 mt-1">
                        <button className="flex items-center gap-1 text-gray-500 hover:text-sky-400 transition-colors">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="text-[9px]">84</span>
                        </button>
                        <button onClick={() => setRetweeted(r => !r)} className={`flex items-center gap-1 transition-colors ${retweeted ? 'text-green-400' : 'text-gray-500 hover:text-green-400'}`}>
                            <Repeat2 className="w-3.5 h-3.5" />
                            <span className="text-[9px]">421</span>
                        </button>
                        <button onClick={() => setLiked(l => !l)} className={`flex items-center gap-1 transition-colors ${liked ? 'text-pink-400' : 'text-gray-500 hover:text-pink-400'}`}>
                            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-pink-400' : ''}`} />
                            <span className="text-[9px]">1.2k</span>
                        </button>
                        <button className="flex items-center gap-1 text-gray-500 hover:text-sky-400 transition-colors">
                            <Share2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const previews: Record<Platform, React.FC<{ text: string; imageUrl: string }>> = {
    instagram: InstagramPreview,
    facebook: FacebookPreview,
    twitter: TwitterPreview,
};

export function PubliGenerator({ isOpen, onClose, onOpenSocialStudio }: PubliGeneratorProps) {
    const [sourceText, setSourceText] = useState('');
    const [liveText, setLiveText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [isR2ModalOpen, setIsR2ModalOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram');
    const [generated, setGenerated] = useState(false);
    const [editedTexts, setEditedTexts] = useState<Record<Platform, string>>({
        instagram: '',
        facebook: '',
        twitter: '',
    });

    // Live preview updates as user types, before generation
    useEffect(() => {
        if (!generated) {
            setLiveText(sourceText);
        }
    }, [sourceText, generated]);

    const handleGenerate = () => {
        if (!sourceText.trim()) return;
        setIsGenerating(true);
        setGenerated(false);
        setTimeout(() => {
            const cleanText = fixEncoding(sourceText.trim());
            setSourceText(cleanText);
            const twitterText = cleanText.length > 280 ? `${cleanText.substring(0, 280)}` : cleanText;
            setEditedTexts({
                instagram: cleanText,
                facebook: cleanText,
                twitter: twitterText,
            });
            setLiveText(cleanText);
            setGenerated(true);
            setIsGenerating(false);
        }, 1000);
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

    const currentText = generated ? editedTexts[selectedPlatform] : liveText;
    const PreviewComponent = previews[selectedPlatform];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 md:p-6">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ type: 'spring', damping: 26, stiffness: 260 }}
                className="relative w-full max-w-6xl bg-[#0d0d0d] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
                style={{ maxHeight: '92vh' }}
            >
                {/* Header */}
                <div className="flex-shrink-0 px-8 py-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-neon-orange/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-neon-orange/20 rounded-xl border border-neon-orange/30">
                            <Sparkles className="w-5 h-5 text-neon-orange" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                GÉNERATEUR <span className="text-neon-orange">PUBLI</span> & <span className="text-green-400">CORRECTEUR</span>
                            </h2>
                            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">Social Studio Engine • Alex • Correction Auto ON</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 min-h-0 flex flex-col md:flex-row">
                    {/* LEFT — Inputs */}
                    <div className="md:w-[38%] flex-shrink-0 flex flex-col gap-0 border-r border-white/5 overflow-y-auto custom-scrollbar">
                        <div className="p-6 flex flex-col gap-5 flex-1">

                            {/* Text input */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Pencil className="w-3 h-3" /> Texte source / Idée
                                </label>
                                <textarea
                                    value={sourceText}
                                    onChange={(e) => setSourceText(e.target.value)}
                                    placeholder="Colle ici l'actu, le nom du DJ ou l'évènement à promouvoir..."
                                    rows={7}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-neon-orange/60 focus:bg-white/[0.07] transition-all resize-none font-medium leading-relaxed placeholder:text-gray-600"
                                />
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-gray-600">
                                        {sourceText.length} caractères
                                    </span>
                                    {sourceText.length > 280 && (
                                        <span className="text-[9px] text-amber-500 font-bold">
                                            ⚠ Trop long pour X/Twitter
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3" /> Photo associée
                                </label>
                                <div className="flex items-center gap-4">
                                    {imageUrl ? (
                                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/20 group flex-shrink-0">
                                            <img src={imageUrl} alt="Uploaded" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setImageUrl('')}
                                                className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setIsR2ModalOpen(true)}
                                            className="w-24 h-24 rounded-xl border-2 border-dashed border-white/10 hover:border-neon-orange/50 hover:bg-neon-orange/[0.04] transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer group flex-shrink-0"
                                        >
                                            {isUploading ? (
                                                <RefreshCw className="w-5 h-5 text-neon-orange animate-spin" />
                                            ) : (
                                                <>
                                                    <Upload className="w-5 h-5 text-gray-500 group-hover:text-neon-orange transition-colors" />
                                                    <span className="text-[7px] font-black text-gray-600 uppercase tracking-wider">Cloud Upload</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                    <p className="text-[10px] text-gray-500 leading-relaxed">Ajoute une photo pour les templates Social Studio</p>
                                </div>
                            </div>

                            {/* Generate button */}
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !sourceText.trim()}
                                className="w-full h-12 bg-neon-orange text-white font-black rounded-xl shadow-[0_0_24px_rgba(255,140,0,0.25)] hover:shadow-[0_0_36px_rgba(255,140,0,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-40 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <><RefreshCw className="w-4 h-4 animate-spin" /> Analyse & Correction...</>
                                ) : (
                                    <><Sparkles className="w-4 h-4" /> Corriger & Générer</>
                                )}
                            </button>

                            {/* Edited texts (post generation) */}
                            <AnimatePresence>
                                {generated && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex flex-col gap-3 overflow-hidden"
                                    >
                                        <div className="h-px bg-white/5" />
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Éditer par réseau</p>
                                        {(Object.keys(platformConfig) as Platform[]).map(p => {
                                            const c = platformConfig[p];
                                            const isSelected = selectedPlatform === p;
                                            return (
                                                <div key={p} className={`rounded-2xl border transition-all ${isSelected ? 'border-white/20 bg-white/[0.04]' : 'border-white/5 bg-white/[0.02]'}`}>
                                                    <button
                                                        onClick={() => setSelectedPlatform(p)}
                                                        className="w-full flex items-center gap-2 px-4 py-2.5"
                                                    >
                                                        <span className={`bg-gradient-to-r ${c.color} p-1.5 rounded-lg`}>
                                                            {c.icon}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-white">{c.label}</span>
                                                        <span className="ml-auto text-[9px] text-gray-600">
                                                            {editedTexts[p].length}/{c.charLimit > 9999 ? '∞' : c.charLimit}
                                                        </span>
                                                        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    <AnimatePresence>
                                                        {isSelected && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="px-4 pb-3 flex flex-col gap-2">
                                                                    <textarea
                                                                        value={editedTexts[p]}
                                                                        onChange={(e) => setEditedTexts(prev => ({ ...prev, [p]: e.target.value }))}
                                                                        rows={4}
                                                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-[11px] focus:outline-none focus:border-white/30 transition-all resize-none font-medium leading-relaxed"
                                                                        maxLength={p === 'twitter' ? 280 : undefined}
                                                                    />
                                                                    <button
                                                                        onClick={() => copyToClipboard(editedTexts[p], p)}
                                                                        className={`self-end flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${copied === p ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                                                    >
                                                                        {copied === p ? <><Check className="w-3 h-3" /> Copié</> : <><Copy className="w-3 h-3" /> Copier</>}
                                                                    </button>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}

                                        {onOpenSocialStudio && (
                                            <button
                                                onClick={() => onOpenSocialStudio(editedTexts[selectedPlatform] || sourceText, imageUrl)}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-neon-red/10 to-purple-500/10 border border-neon-red/20 rounded-xl text-neon-red text-[10px] font-black uppercase tracking-widest hover:from-neon-red/20 hover:to-purple-500/20 transition-all"
                                            >
                                                <Layout className="w-3.5 h-3.5" />
                                                Ouvrir dans Social Studio
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* RIGHT — Live Preview */}
                    <div className="flex-1 flex flex-col bg-[#080808] overflow-hidden">
                        {/* Platform tabs */}
                        <div className="flex-shrink-0 flex items-center gap-1.5 px-6 py-4 border-b border-white/5">
                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mr-2">Aperçu ·</span>
                            {(Object.keys(platformConfig) as Platform[]).map(p => {
                                const c = platformConfig[p];
                                const isSelected = selectedPlatform === p;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setSelectedPlatform(p)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${isSelected
                                            ? `bg-gradient-to-r ${c.color} text-white shadow-lg`
                                            : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                    >
                                        {c.icon}
                                        <span className="hidden sm:inline">{c.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Preview content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex items-start justify-center">
                            <AnimatePresence mode="wait">
                                {isGenerating ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="w-full max-w-sm space-y-3"
                                    >
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4 animate-pulse">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-8 h-8 bg-white/10 rounded-full" />
                                                    <div className="w-24 h-3 bg-white/10 rounded" />
                                                </div>
                                                <div className="w-full h-32 bg-white/5 rounded-xl mb-3" />
                                                <div className="space-y-1.5">
                                                    <div className="w-full h-2.5 bg-white/10 rounded" />
                                                    <div className="w-4/5 h-2.5 bg-white/10 rounded" />
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key={selectedPlatform}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                        className="w-full max-w-sm"
                                    >
                                        <PreviewComponent text={currentText} imageUrl={imageUrl} />
                                        {!sourceText && !generated && (
                                            <p className="text-center text-[10px] text-gray-600 mt-4 font-medium">
                                                Commence à taper pour voir l'aperçu en direct →
                                            </p>
                                        )}
                                        {sourceText && !generated && (
                                            <div className="mt-3 flex items-center justify-center gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                                <p className="text-[9px] text-green-400 font-bold uppercase tracking-widest">Aperçu en direct</p>
                                            </div>
                                        )}
                                        {generated && (
                                            <div className="mt-3 flex items-center justify-center gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-neon-orange rounded-full" />
                                                <p className="text-[9px] text-neon-orange font-bold uppercase tracking-widest">Publication générée</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 px-6 py-3 bg-black/40 border-t border-white/5 text-center">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-700">
                        DROPSIDERS CONTENT ENGINE • POWERED BY ALEXFR1
                    </p>
                </div>
            </motion.div>

            <R2PhotosMenuModal 
                isOpen={isR2ModalOpen} 
                onClose={() => setIsR2ModalOpen(false)}
                onSelect={(url) => {
                    setImageUrl(url);
                    setIsR2ModalOpen(false);
                }}
            />
        </div>
    );
}
