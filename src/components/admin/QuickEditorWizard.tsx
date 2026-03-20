import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Wand2, Trash2, 
    Loader2, Plus, Type,
    ChevronRight, ChevronLeft, MapPin
} from 'lucide-react';
import { uploadFile } from '../../utils/uploadService';
import { useNavigate } from 'react-router-dom';
import { fixEncoding } from '../../utils/standardizer';

interface QuickEditorWizardProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QuickEditorWizard({ isOpen, onClose }: QuickEditorWizardProps) {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('News');
    const [locationInput, setLocationInput] = useState('');
    const [text, setText] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    if (!isOpen) return null;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);

        const newImages: string[] = [];
        for (let i = 0; i < files.length; i++) {
            try {
                const url = await uploadFile(files[i], 'news', (p) => {
                    setUploadProgress(Math.round(((i / files.length) * 100) + (p / files.length)));
                });
                newImages.push(url);
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }

        setImages(prev => [...prev, ...newImages]);
        setIsUploading(false);
        setUploadProgress(0);
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const generateArticle = async () => {
        setIsGenerating(true);
        
        // Simuler une "IA" d'analyse
        await new Promise(r => setTimeout(r, 1500));

        const cleanTitle = fixEncoding(title.trim().toUpperCase());
        const cleanText = fixEncoding(text.trim());
        
        // 1. Create the base article object
        const newArticle: any = {
            title: cleanTitle,
            location: locationInput.toUpperCase(),
            country: 'FRANCE',
            category: category,
            date: new Date().toISOString(),
            image: images[0] || '',
            author: localStorage.getItem('admin_name') || 'Alex',
            status: 'draft',
            isFeatured: false,
            content: '' // Will use widgets
        };

        // 2. Generate Widgets (Layout Magique)
        const foundWidgets: { id: string, content: string }[] = [];
        
        // Widget 0: Title Section
        foundWidgets.push({ 
            id: Math.random().toString(36).substring(2, 9), 
            content: `<h2 class="premium-section-title">${cleanTitle}</h2>` 
        });

        // Split text into paragraphs
        const paragraphs = cleanText.split('\n').filter(p => p.trim().length > 0);
        
        if (paragraphs.length > 0) {
            paragraphs.forEach((p, idx) => {
                const trimmed = p.trim();
                
                // Détection d'un titre : Commence par # ou ##, ou est court et tout en MAJUSCULES
                const isTitle = trimmed.startsWith('#') || 
                               (trimmed.length < 60 && trimmed === trimmed.toUpperCase() && trimmed.length > 3);
                
                let content = '';
                if (isTitle) {
                    const cleanTitleText = trimmed.replace(/^#+\s*/, '');
                    content = `<h2 class="premium-section-title">${cleanTitleText}</h2>`;
                } else {
                    content = `<p class="article-text">${trimmed}</p>`;
                }

                foundWidgets.push({ 
                    id: Math.random().toString(36).substring(2, 9), 
                    content: content 
                });

                // Intercaler les médias après le premier bloc (si ce n'est pas déjà fait)
                if (idx === 0 && images.length > 0) {
                    let mediaHtml = '';
                    if (images.length === 1) {
                        mediaHtml = `<div class="image-premium-wrapper premium-shadow"><img src="${images[0]}" class="article-image-premium" loading="lazy" /></div>`;
                    } else if (images.length === 2) {
                        mediaHtml = `<div class="duo-photos-premium"><div class="duo-photo-box"><img src="${images[0]}" loading="lazy" /></div><div class="duo-photo-box"><img src="${images[1]}" loading="lazy" /></div></div>`;
                    } else {
                        const galleryItems = images.map(img => `<div class="gallery-premium-item"><img src="${img}" loading="lazy" /></div>`).join('');
                        mediaHtml = `<div class="gallery-premium-grid cols-3">${galleryItems}</div>`;
                    }
                    
                    foundWidgets.push({
                        id: Math.random().toString(36).substring(2, 9),
                        content: mediaHtml
                    });
                }
            });
        } else if (images.length > 0) {
            // Uniquement des images si pas de texte
            const galleryItems = images.map(img => `<div class="gallery-premium-item"><img src="${img}" loading="lazy" /></div>`).join('');
            foundWidgets.push({
                id: Math.random().toString(36).substring(2, 9),
                content: `<div class="gallery-premium-grid cols-3">${galleryItems}</div>`
            });
        }

        // 3. Wrap all widgets in article-section and set to state
        const contentHtml = foundWidgets.map(w => `<section class="article-section">${w.content}</section>`).join('');
        newArticle.content = contentHtml;
        newArticle.widgets = foundWidgets.map(w => ({ ...w, content: `<section class="article-section">${w.content}</section>` }));

        setIsGenerating(false);

        // Close and redirect
        onClose();
        navigate(`/admin/news/create?type=${category}`, { state: { item: newArticle } });
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/98 backdrop-blur-3xl"
            />

            {/* Modal Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                className="relative w-full h-[100dvh] md:h-auto md:max-w-xl md:max-h-[90vh] bg-[#080808] md:border md:border-white/10 md:rounded-[3rem] overflow-hidden flex flex-col shadow-2xl"
            >
                {/* Header Section */}
                <div className="flex-shrink-0 px-8 py-8 md:py-6 border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-neon-red/20 rounded-2xl border border-neon-red/30">
                            <Wand2 className="w-6 h-6 text-neon-red" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-black text-white italic tracking-tighter uppercase leading-none">
                                Générateur <span className="text-neon-red">Express</span>
                            </h2>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Édition Mobile • Layout Auto-Magique</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 md:p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Bar (at top of body) */}
                <div className="h-1 w-full bg-white/5 overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(step / 3) * 100}%` }}
                        className="h-full bg-neon-red shadow-[0_0_15px_rgba(255,18,65,0.5)]"
                    />
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">L'Actu en une ligne</label>
                                    <textarea
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Ex: DJ SNAKE EXPLOSE LE MAIN STAGE DE L'ELECTROBEACH..."
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-xl font-bold text-white placeholder-white/10 focus:border-neon-red outline-none transition-all resize-none shadow-inner"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Catégorie</label>
                                        <div className="relative">
                                            <select 
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold appearance-none outline-none focus:border-neon-red transition-all"
                                            >
                                                <option value="News">NEWS</option>
                                                <option value="Focus">FOCUS</option>
                                                <option value="Chronique">CHRONIQUE</option>
                                                <option value="Interview">INTERVIEW</option>
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                <ChevronRight className="w-4 h-4 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Lieu (Optionnel)</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="text"
                                                value={locationInput}
                                                onChange={(e) => setLocationInput(e.target.value)}
                                                placeholder="PARIS / LYON..."
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white font-bold outline-none focus:border-neon-red transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tes Photos ({images.length})</label>
                                    <p className="text-[9px] text-gray-600 font-bold italic">La 1ère sera la couverture</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {images.map((url, idx) => (
                                        <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                                            <img src={url} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button onClick={() => removeImage(idx)} className="p-3 bg-red-500 text-white rounded-xl shadow-xl hover:scale-110 active:scale-90 transition-all">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                            {idx === 0 && (
                                                <div className="absolute top-3 left-3 px-2 py-1 bg-neon-red text-white text-[7px] font-black uppercase rounded shadow-lg">Cover</div>
                                            )}
                                        </div>
                                    ))}
                                    
                                    <label className="relative aspect-square rounded-[2rem] border-2 border-dashed border-white/10 hover:border-neon-red/50 hover:bg-neon-red/[0.03] transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group overflow-hidden">
                                        {isUploading ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="w-8 h-8 text-neon-red animate-spin" />
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{uploadProgress}%</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-neon-red/10 transition-colors">
                                                    <Plus className="w-8 h-8 text-gray-600 group-hover:text-neon-red" />
                                                </div>
                                                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">DÉPOSER DES PHOTOS</span>
                                            </>
                                        )}
                                        <input 
                                            type="file" 
                                            multiple 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={handleImageUpload}
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Le Corps de l'Article</label>
                                    <button 
                                        onClick={() => setText(prev => prev + "\n")}
                                        className="text-[9px] text-neon-red font-black uppercase tracking-widest hover:underline"
                                    >
                                        Nouvel Alinéa
                                    </button>
                                </div>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Écris ton article ici, comme tu le sens. Je m'occupe de la découpe en paragraphes et de l'intercalage des photos..."
                                    rows={12}
                                    className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-sm font-medium leading-relaxed text-gray-300 placeholder-white/5 focus:border-neon-red outline-none transition-all resize-none"
                                />
                                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
                                    <div className="p-2 bg-neon-cyan/20 rounded-lg">
                                        <Type className="w-4 h-4 text-neon-cyan" />
                                    </div>
                                    <p className="text-[9px] text-gray-400 font-bold leading-relaxed uppercase">
                                        Astuce : Pour un <span className="text-neon-cyan">titre de chapitre</span>, mets un <span className="text-white">#</span> devant ou écris le en <span className="text-white">MAJUSCULES</span> sur une ligne seule.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Buttons */}
                <div className="flex-shrink-0 p-8 pt-4 border-t border-white/5 bg-gradient-to-t from-white/[0.02] to-transparent flex gap-4">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(prev => prev - 1)}
                            className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            RETOUR
                        </button>
                    )}
                    
                    {step < 3 ? (
                        <button
                            onClick={() => setStep(prev => prev + 1)}
                            disabled={step === 1 && !title.trim()}
                            className="flex-[2] py-5 bg-white text-black hover:bg-neon-red hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 disabled:opacity-20 disabled:grayscale"
                        >
                            CONTINUER
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={generateArticle}
                            disabled={isGenerating || !text.trim()}
                            className="flex-[2] py-5 bg-neon-red text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,18,65,0.4)] hover:scale-105 active:scale-95"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    ANALYSE...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-5 h-5" />
                                    GÉNÉRER MON ARTICLE
                                </>
                            )}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
