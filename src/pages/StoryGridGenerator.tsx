import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Download, 
    Trash2, 
    Upload, 
    LayoutGrid, 
    Settings,
    Image as ImageIcon,
    Search,
    Eye,
    Check,
    Lock,
    Unlock,
    Sparkles,
    Loader2
} from 'lucide-react';
import { toBlob } from 'html-to-image';
import { getAuthHeaders, apiFetch } from '../utils/auth';
import { ExportSuccessModal } from '../components/ExportSuccessModal';
import { resolveImageUrl } from '../utils/image';

interface StoryItem {
    id: string;
    image: string | null;
    label: string;
    displayImage?: string | null;
}

interface StoryGridGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    embedded?: boolean;
    wikiData?: {
        djs?: any[];
        clubs?: any[];
        festivals?: any[];
        wikiDjs?: any[];
        wikiClubs?: any[];
        wikiFestivals?: any[];
    };
}

export function StoryGridGenerator({ isOpen, onClose, wikiData: rawWikiData, embedded = false }: StoryGridGeneratorProps) {
    // Normalize wikiData — support both {djs,clubs,festivals} and {wikiDjs,wikiClubs,wikiFestivals}
    const wikiData = rawWikiData ? {
        djs: rawWikiData.djs || rawWikiData.wikiDjs || [],
        clubs: rawWikiData.clubs || rawWikiData.wikiClubs || [],
        festivals: rawWikiData.festivals || rawWikiData.wikiFestivals || [],
    } : undefined;
    const [items, setItems] = useState<StoryItem[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [readyBlob, setReadyBlob] = useState<Blob | null>(null);
    const [readyUrl, setReadyUrl] = useState<string>('');
    const [readyFilename, setReadyFilename] = useState('');

    useEffect(() => {
        return () => {
            if (readyUrl) URL.revokeObjectURL(readyUrl);
        };
    }, [readyUrl]);
    const previewRef = useRef<HTMLDivElement>(null);
    const [activeTheme, setActiveTheme] = useState<'manual' | 'djs' | 'clubs' | 'festivals'>('manual');
    const [randomLimit, setRandomLimit] = useState(30);
    const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());

    // Clear items when theme changes
    useEffect(() => {
        setItems([]);
        setLockedIds(new Set());
    }, [activeTheme]);
    
    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeEditId, setActiveEditId] = useState<string | null>(null);
    const [mobileTab, setMobileTab] = useState<'config' | 'preview'>('config');

    const toggleLock = (id: string) => {
        setLockedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };
    
    // Wiki Search & Edit
    const [searchQuery, setSearchQuery] = useState('');
    const [isSavingWiki, setIsSavingWiki] = useState(false);
    const [addToWiki, setAddToWiki] = useState(false);

    const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const files = Array.from(e.target.files);

        // Read all files in parallel — each file gets its own FileReader instance
        // captured correctly inside the map closure (no shared-variable bug)
        const newItems: StoryItem[] = await Promise.all(
            files.map((file) =>
                new Promise<StoryItem>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const base64 = event.target?.result as string;
                        resolve({
                            id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            image: base64,
                            label: file.name.split('.')[0].substring(0, 15),
                            displayImage: base64
                        });
                    };
                    reader.readAsDataURL(file);
                })
            )
        );

        setItems((prev) => [...prev, ...newItems]);
        // Reset the input so the same files can be re-selected if needed
        e.target.value = '';
    };

    const handleWikiAdd = async (name: string, image: string, type: string) => {
        setIsSavingWiki(true);
        try {
            const res = await apiFetch("/api/wiki/add", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    type: type.toUpperCase() + 'S',
                    entry: { name, image }
                }),
            });
            return res.ok;
        } catch (err) {
            console.error("Wiki add failed:", err);
            return false;
        } finally {
            setIsSavingWiki(false);
        }
    };

    const generateFromWiki = useCallback(() => {
        if (!wikiData) return;
        
        // Deep copy source to avoid any reference issues
        let source: any[] = [];
        if (activeTheme === 'djs') source = JSON.parse(JSON.stringify(wikiData.djs || []));
        else if (activeTheme === 'clubs') source = JSON.parse(JSON.stringify(wikiData.clubs || []));
        else if (activeTheme === 'festivals') source = JSON.parse(JSON.stringify(wikiData.festivals || []));

        if (source.length === 0) return;

        // Fisher-Yates Shuffle (robust and unbiased)
        const shuffled = [...source];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // Filter out names that are already locked in the grid to avoid duplicates
        const currentNames = new Set(items.filter(it => lockedIds.has(it.id)).map(it => it.label.toLowerCase().trim()));
        const filteredSource = shuffled.filter(item => !currentNames.has((item.name || '').toLowerCase().trim()));

        const selected = filteredSource.slice(0, randomLimit);

        // Map to StoryItem with guaranteed unique IDs and cache-busting
        const generationTimestamp = Date.now();
        const wikiItems: StoryItem[] = selected.map((item, idx) => {
            const rawImg = resolveImageUrl(item.image || item.photo || null);
            let displayImg = rawImg;
            
            if (rawImg && rawImg.startsWith('http') && !rawImg.includes('blob:') && !rawImg.includes('data:') && !rawImg.includes('dropsiders.fr')) {
                displayImg = `https://images.weserv.nl/?url=${encodeURIComponent(rawImg)}&w=300&h=300&fit=cover&v=${generationTimestamp}-${idx}`;
            }

            return {
                id: `wiki-${generationTimestamp}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
                image: rawImg,
                label: item.name || 'Sans nom',
                displayImage: displayImg
            };
        });

        setItems(prev => {
            const lockedItems = prev.filter(it => lockedIds.has(it.id));
            const availableSlots = Math.max(0, randomLimit - lockedItems.length);
            const filteredNew = wikiItems.slice(0, availableSlots);
            
            // Log to debug if needed (user can see in console if they look)
            console.log("Generating from Wiki:", filteredNew.length, "items added");
            
            return [...lockedItems, ...filteredNew].slice(0, randomLimit);
        });
    }, [activeTheme, wikiData, randomLimit, lockedIds]);

    const randomizeSelection = () => {
        generateFromWiki();
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, updates: Partial<StoryItem>) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const newItem = { ...item, ...updates };
                if (updates.image !== undefined) {
                    const rawImg = resolveImageUrl(newItem.image);
                    newItem.image = rawImg;
                    if (rawImg && rawImg.startsWith('http') && !rawImg.includes('blob:') && !rawImg.includes('data:') && !rawImg.includes('dropsiders.fr')) {
                        newItem.displayImage = `https://images.weserv.nl/?url=${encodeURIComponent(rawImg)}&w=300&h=300&fit=cover&v=${Date.now()}-${item.id}`;
                    } else {
                        newItem.displayImage = rawImg;
                    }
                }
                return newItem;
            }
            return item;
        }));
    };

    const handleSingleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!activeEditId || !e.target.files?.[0]) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            updateItem(activeEditId, { 
                image: event.target?.result as string,
                label: file.name.split('.')[0].substring(0, 15)
            });
            setActiveEditId(null);
        };
        reader.readAsDataURL(file);
    };

    const downloadImage = async () => {
        if (!previewRef.current || items.length === 0) return;
        setIsGenerating(true);

        // Small delay to ensure all images are painted
        await new Promise(resolve => setTimeout(resolve, 600));

        try {
            const fileName = `dropsiders_grid_${Date.now()}.png`;

            const blob = await toBlob(previewRef.current, {
                pixelRatio: 2,
                backgroundColor: '#000000',
                cacheBust: true,
            });

            if (blob) {
                const url = URL.createObjectURL(blob);
                setReadyBlob(blob);
                setReadyUrl(url);
                setReadyFilename(fileName);
                setShowSuccess(true);
            }

        } catch (err: any) {
            console.error('Failed to generate image:', err);
            alert(`Erreur technique : ${err.message || 'Problème de rendu'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center md:p-4">
            <div className="bg-[#0A0A0A] w-full max-w-7xl h-full md:h-[92vh] md:rounded-[3rem] border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/20">
                            <LayoutGrid className="w-6 h-6 text-neon-cyan" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tight">Générateur <span className="text-neon-cyan">Story Grid</span></h2>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Créez des visuels de grille type Instagram</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-gray-400 hover:text-white transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Mobile Tabs */}
                <div className="lg:hidden flex border-b border-white/5 bg-black/40">
                    <button 
                        onClick={() => setMobileTab('config')}
                        className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${mobileTab === 'config' ? 'text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5' : 'text-gray-500'}`}
                    >
                        Configuration
                    </button>
                    <button 
                        onClick={() => setMobileTab('preview')}
                        className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${mobileTab === 'preview' ? 'text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5' : 'text-gray-500'}`}
                    >
                        Aperçu du Rendu
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-0">
                    {/* Controls */}
                    <div className={`${mobileTab === 'preview' ? 'hidden lg:block' : 'block'} p-8 border-r border-white/5 overflow-y-auto custom-scrollbar space-y-8 bg-black/20`}>
                        <div className="space-y-6">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Settings className="w-3 h-3 text-neon-cyan" /> Mode de génération
                            </label>

                            <div className="grid grid-cols-2 gap-2">
                                {(['manual', 'djs', 'clubs', 'festivals'] as const).map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => {
                                            setActiveTheme(t);
                                            if (t === 'manual') setItems([]);
                                        }}
                                        className={`py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${activeTheme === t ? 'bg-neon-cyan/10 border-neon-cyan/50 text-neon-cyan' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                                    >
                                        {t === 'manual' ? 'Manuel' : t}
                                    </button>
                                ))}
                            </div>

                            {activeTheme !== 'manual' && (
                                <div className="p-5 bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-neon-cyan uppercase tracking-widest">Nombre d'éléments</span>
                                        <span className="text-white font-bold text-xs">{randomLimit}</span>
                                    </div>
                                    <input 
                                        type="range" min={3} max={30}
                                        value={randomLimit}
                                        onChange={(e) => setRandomLimit(parseInt(e.target.value))}
                                        className="w-full h-1 bg-white/10 rounded-full appearance-none accent-neon-cyan cursor-pointer"
                                    />
                                    <button 
                                        onClick={randomizeSelection}
                                        className="w-full py-3 bg-neon-cyan text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all"
                                    >
                                        Générer / Mélanger
                                    </button>
                                </div>
                            )}

                        </div>

                        {/* Items List */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <LayoutGrid className="w-3 h-3 text-neon-cyan" /> Éléments ({items.length})
                                </label>
                                {activeTheme === 'manual' && (
                                    <button 
                                        onClick={() => {
                                            setActiveEditId(null);
                                            fileInputRef.current?.click();
                                        }}
                                        className="px-4 py-2 bg-neon-cyan text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-neon-cyan/20"
                                    >
                                        <Upload className="w-3 h-3" /> Importer
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={item.id} className="group bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col gap-4 hover:border-neon-cyan/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div 
                                                onClick={() => {
                                                    setActiveEditId(item.id);
                                                    setSearchQuery('');
                                                }}
                                                className="w-14 h-14 rounded-full border-2 border-white/10 bg-black/40 flex-shrink-0 cursor-pointer overflow-hidden relative group/img"
                                            >
                                                {item.image ? (
                                                    <img src={item.image} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <ImageIcon className="w-5 h-5 text-gray-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover/img:text-white transition-colors" />
                                                )}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Settings className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em]">Item #{index + 1}</span>
                                                <input 
                                                    type="text"
                                                    value={item.label}
                                                    onChange={(e) => updateItem(item.id, { label: e.target.value })}
                                                    placeholder="NOM OBLIGATOIRE"
                                                    className={`w-full bg-transparent border-none p-0 font-bold text-sm outline-none transition-colors ${!item.label.trim() ? 'text-neon-red placeholder:text-neon-red/50' : 'text-white focus:text-neon-cyan'}`}
                                                />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button 
                                                    onClick={() => toggleLock(item.id)}
                                                    className={`p-2 transition-all ${lockedIds.has(item.id) ? 'text-neon-cyan' : 'text-gray-600 hover:text-white'}`}
                                                    title={lockedIds.has(item.id) ? "Déverrouiller" : "Verrouiller (garder lors du mélange)"}
                                                >
                                                    {lockedIds.has(item.id) ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                                </button>
                                                <button 
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-2 text-gray-600 hover:text-neon-red transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {activeEditId === item.id && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="pt-4 border-t border-white/5 space-y-4"
                                            >
                                                <div className="space-y-2">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                                                        <input 
                                                            type="text"
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            placeholder="Rechercher dans le Wiki..."
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[10px] font-bold text-white outline-none focus:border-neon-cyan"
                                                        />
                                                    </div>
                                                    {searchQuery.length > 1 && wikiData && (
                                                        <div className="bg-black/60 rounded-xl max-h-40 overflow-y-auto custom-scrollbar border border-white/5">
                                                            {[...wikiData.djs, ...wikiData.clubs, ...wikiData.festivals]
                                                                .filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                                                .slice(0, 5)
                                                                .map(res => (
                                                                    <button 
                                                                        key={res.id}
                                                                        onClick={() => {
                                                                            const rawImg = res.image || res.photo;
                                                                            updateItem(item.id, { 
                                                                                image: rawImg, 
                                                                                label: res.name 
                                                                            });
                                                                            setSearchQuery('');
                                                                            setActiveEditId(null);
                                                                        }}
                                                                        className="w-full p-2 hover:bg-white/5 flex items-center gap-3 transition-colors text-left"
                                                                    >
                                                                        <img src={res.image || res.photo} className="w-6 h-6 rounded-full object-cover" alt="" />
                                                                        <span className="text-[10px] font-bold text-white">{res.name}</span>
                                                                    </button>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="flex-1 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:text-white flex items-center justify-center gap-2"
                                                    >
                                                        <Upload className="w-3 h-3" /> Changer Photo
                                                    </button>
                                                    {addToWiki && item.image && item.label && (
                                                        <button 
                                                            onClick={async () => {
                                                                const success = await handleWikiAdd(item.label, item.image!, activeTheme === 'manual' ? 'DJ' : activeTheme.slice(0, -1));
                                                                if (success) setAddToWiki(false);
                                                            }}
                                                            disabled={isSavingWiki}
                                                            className="px-4 py-2 bg-neon-cyan/20 border border-neon-cyan/50 rounded-xl text-[9px] font-black uppercase text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all flex items-center gap-2"
                                                        >
                                                            {isSavingWiki ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                            Sync Wiki
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center gap-2 px-1">
                                                    <input 
                                                        type="checkbox" 
                                                        id={`wiki-${item.id}`}
                                                        checked={addToWiki}
                                                        onChange={(e) => setAddToWiki(e.target.checked)}
                                                        className="accent-neon-cyan"
                                                    />
                                                    <label htmlFor={`wiki-${item.id}`} className="text-[9px] font-bold text-gray-500 uppercase cursor-pointer">Ajouter au Wiki</label>
                                                </div>

                                                <button 
                                                    onClick={() => setActiveEditId(null)}
                                                    className="w-full py-1 text-[8px] font-black text-gray-600 uppercase hover:text-white"
                                                >
                                                    Fermer
                                                </button>
                                            </motion.div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <input 
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple={!activeEditId}
                            className="hidden"
                            onChange={(e) => activeEditId ? handleSingleFileUpload(e) : handleBatchUpload(e)}
                        />
                    </div>

                    {/* Preview Area */}
                    <div className={`${mobileTab === 'config' ? 'hidden lg:flex' : 'flex'} p-4 md:p-12 bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden group min-h-[600px]`}>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,255,243,0.05)_0%,transparent_70%)] pointer-events-none" />
                        
                        <div className="relative mb-12 scale-[0.8] md:scale-100">
                            <div className="w-[360px] aspect-[9/16] bg-black rounded-[4rem] border-[8px] border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col">
                                <div 
                                    ref={previewRef}
                                    className="w-full h-full bg-[#050505] flex flex-col items-center p-4 pt-3 relative overflow-hidden"
                                >
                                    {/* Success Modal (Social Studio Style) */}
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,0,51,0.08)_0%,transparent_50%)]" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(0,255,243,0.05)_0%,transparent_50%)]" />
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                                    <div className="flex flex-col items-center pt-1 mb-2">
                                        <div className="relative group">
                                            <img 
                                                src="/Logo.png" 
                                                className="h-10 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                                                alt="Dropsiders" 
                                            />
                                        </div>
                                    </div>

                                    <div className="w-full flex-1 overflow-hidden relative z-10">
                                        <div className="grid gap-x-1 gap-y-1 grid-cols-5">
                                            {items.map(item => (
                                                <div key={item.id} className="flex flex-col items-center gap-1">
                                                    <div className="w-full aspect-square rounded-full border-[1.5px] border-white bg-[#111] overflow-hidden shadow-lg relative">
                                                        {item.displayImage || item.image ? (
                                                            <img 
                                                                src={item.displayImage || item.image || ''} 
                                                                className="w-full h-full object-cover" 
                                                                alt="" 
                                                                crossOrigin="anonymous"
                                                                key={item.id}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                                                                <ImageIcon className="w-3 h-3 text-white/20" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 rounded-full border-[1px] border-black/40" />
                                                    </div>
                                                    <span className="text-[7px] text-white/90 font-bold text-center leading-[1.1] uppercase tracking-tighter line-clamp-2 px-0.5">
                                                        {item.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Footer branding */}
                                    <div className="w-full mt-2 pt-2 border-t border-white/10 flex flex-col items-center gap-0.5 relative z-10">
                                        <span className="text-[6px] font-black text-white/50 uppercase tracking-widest">Faites le vôtre sur <span className="text-white">dropsiders.fr</span></span>
                                        <span className="text-[6px] font-black text-white/50 uppercase tracking-widest">Identifiez-nous <span className="text-neon-cyan">@dropsiders.eu</span> ✅</span>
                                    </div>

                                </div>
                            </div>

                            <div className="absolute -right-24 top-0 space-y-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={downloadImage}
                                    disabled={isGenerating}
                                    className="w-16 h-16 rounded-3xl bg-neon-cyan text-black flex items-center justify-center shadow-[0_0_30px_rgba(0,255,243,0.3)] hover:scale-110 transition-all disabled:opacity-50"
                                    title="Télécharger l'image"
                                >
                                    {isGenerating ? <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" /> : <Download className="w-7 h-7" />}
                                </button>
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em]">Aperçu du Rendu Final</p>
                            <p className="text-[9px] text-gray-700 font-medium italic">Format Portrait (9:16) optimisé pour les stories</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-black border-t border-white/5 flex justify-end gap-4">
                    <button 
                        onClick={onClose}
                        className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-gray-400 font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={downloadImage}
                        disabled={isGenerating || items.length === 0 || items.some(it => !it.label.trim())}
                        className="px-12 py-4 bg-neon-cyan text-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-neon-cyan/20 hover:scale-[1.02] transition-all flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isGenerating ? 'GÉNÉRATION...' : 'GÉNÉRER PNG STORY'}
                        {!isGenerating && <Download className="w-4 h-4" />}
                    </button>
                </div>
                <ExportSuccessModal 
                    isOpen={showSuccess && !!readyBlob} 
                    onClose={() => {
                        setShowSuccess(false);
                        setReadyBlob(null);
                    }}
                    readyBlob={readyBlob}
                    readyUrl={readyUrl}
                    filename={readyFilename}
                    type="image"
                    title="GÉNÉRATION RÉUSSIE !"
                    subtitle="Votre contenu est prêt"
                />
            </div>
        </div>
    );
}
