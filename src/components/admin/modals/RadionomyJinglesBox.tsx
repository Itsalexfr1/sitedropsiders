import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bell, Megaphone, Zap, Plus, Trash2, Clock, 
    Sparkles, ArrowRight, Play, CheckCircle2, Sliders, Radio, X
} from 'lucide-react';
import { extractYouTubeId, fetchYouTubeTitle } from './AdminTVModal';

export interface RadionomyItem {
    id: string;
    title: string;
    youtubeId: string;
    duration: number; // in seconds
    category: 'jingle' | 'pub' | 'promo' | 'chronique';
    isCustom?: boolean;
}

const DEFAULT_JINGLES_PUBS: RadionomyItem[] = [
    {
        id: 'rad_jingle_1',
        title: 'Dropsiders Radio • Official Festival ID Jingle',
        youtubeId: 'k5yQBhDnrvM', // placeholder sample ID
        duration: 15,
        category: 'jingle'
    },
    {
        id: 'rad_jingle_2',
        title: 'Dropsiders • Drop Alert & Sweeper Sound FX',
        youtubeId: 'CsRTKXYEhOM',
        duration: 10,
        category: 'jingle'
    },
    {
        id: 'rad_jingle_3',
        title: 'Dropsiders Radio • Non-Stop Club & Festival Energy',
        youtubeId: '8YbWq5urfww',
        duration: 12,
        category: 'jingle'
    },
    {
        id: 'rad_pub_1',
        title: 'Publicité Dropsiders Voyages • Packs Festivals & Bus',
        youtubeId: 'pQdsHoG2yhw',
        duration: 30,
        category: 'pub'
    },
    {
        id: 'rad_pub_2',
        title: 'Spot Partenaire • Dropsiders Shop Officiel & Goodies',
        youtubeId: '61tiIdIrjUQ',
        duration: 25,
        category: 'pub'
    },
    {
        id: 'rad_promo_1',
        title: 'Promo Dropsiders TV & Live Stream 24/7',
        youtubeId: 'DuXXMZLfAkQ',
        duration: 20,
        category: 'promo'
    }
];

const STORAGE_RADIONOMY_KEY = 'dropsiders_radionomy_palette';

interface RadionomyJinglesBoxProps {
    isOpen: boolean;
    onClose: () => void;
    currentBlockTitle?: string;
    onInsertItem: (item: RadionomyItem) => void;
    onApplyRadionomyRule?: (rule: { jingleEveryN: number; pubEveryN: number }) => void;
    onOpenYouTubeSearch?: (category: 'jingle' | 'pub') => void;
}

export function RadionomyJinglesBox({
    isOpen,
    onClose,
    currentBlockTitle,
    onInsertItem,
    onApplyRadionomyRule,
    onOpenYouTubeSearch
}: RadionomyJinglesBoxProps) {
    const [items, setItems] = useState<RadionomyItem[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_RADIONOMY_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return DEFAULT_JINGLES_PUBS;
    });

    const [activeFilter, setActiveFilter] = useState<'all' | 'jingle' | 'pub' | 'promo'>('all');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newDuration, setNewDuration] = useState('15');
    const [newCategory, setNewCategory] = useState<'jingle' | 'pub' | 'promo'>('jingle');
    const [isFetchingTitle, setIsFetchingTitle] = useState(false);

    // Rule Generator State
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [jingleFrequency, setJingleFrequency] = useState(2); // 1 jingle every 2 tracks
    const [pubFrequency, setPubFrequency] = useState(4); // 1 pub every 4 tracks

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_RADIONOMY_KEY, JSON.stringify(items));
        } catch {}
    }, [items]);

    const handleUrlBlur = async () => {
        if (!newUrl.trim() || newTitle.trim()) return;
        setIsFetchingTitle(true);
        try {
            const t = await fetchYouTubeTitle(newUrl);
            if (t) setNewTitle(t);
        } catch {}
        setIsFetchingTitle(false);
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        const ytid = extractYouTubeId(newUrl) || newUrl.trim();
        if (!ytid) return;

        const newItem: RadionomyItem = {
            id: `rad_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            title: newTitle.trim() || `Élément ${newCategory.toUpperCase()}`,
            youtubeId: ytid,
            duration: parseInt(newDuration, 10) || 20,
            category: newCategory,
            isCustom: true
        };

        setItems(prev => [newItem, ...prev]);
        setNewTitle('');
        setNewUrl('');
        setNewDuration('15');
        setShowAddForm(false);
    };

    const handleDeleteItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const filteredItems = items.filter(item => {
        if (activeFilter === 'all') return true;
        return item.category === activeFilter;
    });

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div 
                className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#0a0a14]/98 border border-white/10 rounded-3xl w-full max-w-4xl h-[90vh] max-h-[850px] shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden relative"
                >
                    {/* Top radionomy signature bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-amber-400 to-neon-cyan" />

                    {/* Header */}
                    <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-amber-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                <Radio className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-display font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                                    Bac Radionomy <span className="text-purple-400">Jingles & Pubs</span>
                                </h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                    Format Radionomy • Cartouchier d'habillage antenne {currentBlockTitle ? `pour "${currentBlockTitle}"` : ''}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {onApplyRadionomyRule && (
                                <button
                                    onClick={() => setShowRuleModal(!showRuleModal)}
                                    className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md"
                                >
                                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="hidden sm:inline">Règle Horloge</span>
                                </button>
                            )}

                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Radionomy Clock Rule Configurator Banner */}
                    <AnimatePresence>
                        {showRuleModal && onApplyRadionomyRule && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 sm:p-5 bg-gradient-to-r from-purple-950/60 to-black/80 border-b border-purple-500/30 shrink-0 space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-400" />
                                        <h4 className="text-xs font-black uppercase tracking-wider text-purple-200">
                                            Règle d'Horloge Radionomy Automatique
                                        </h4>
                                    </div>
                                    <span className="text-[10px] text-gray-400">
                                        Alterne vos musiques avec vos jingles et spots publicitaires
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-gray-300">🔔 Fréquence des Jingles :</span>
                                            <span className="font-black text-purple-400">Toutes les {jingleFrequency} musiques</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={1}
                                            max={5}
                                            value={jingleFrequency}
                                            onChange={(e) => setJingleFrequency(parseInt(e.target.value, 10))}
                                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-400"
                                        />
                                    </div>

                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-gray-300">📢 Fréquence des Pubs :</span>
                                            <span className="font-black text-amber-400">Toutes les {pubFrequency} musiques</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={2}
                                            max={8}
                                            value={pubFrequency}
                                            onChange={(e) => setPubFrequency(parseInt(e.target.value, 10))}
                                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowRuleModal(false)}
                                        className="px-4 py-2 rounded-xl bg-white/5 text-xs font-bold text-gray-400 hover:text-white"
                                    >
                                        Fermer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onApplyRadionomyRule({ jingleEveryN: jingleFrequency, pubEveryN: pubFrequency });
                                            setShowRuleModal(false);
                                        }}
                                        className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Appliquer l'Horloge à l'Émission</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Filter & Action Tabs */}
                    <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/30 shrink-0">
                        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10">
                            {[
                                { id: 'all', label: 'Tout voir' },
                                { id: 'jingle', label: '🔔 Jingles', count: items.filter(i => i.category === 'jingle').length },
                                { id: 'pub', label: '📢 Pubs', count: items.filter(i => i.category === 'pub').length },
                                { id: 'promo', label: '⚡ Promos', count: items.filter(i => i.category === 'promo').length },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveFilter(tab.id as any)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                        activeFilter === tab.id
                                            ? 'bg-white text-black shadow-md'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {tab.label} {tab.count !== undefined ? `(${tab.count})` : ''}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            {onOpenYouTubeSearch && (
                                <button
                                    type="button"
                                    onClick={() => onOpenYouTubeSearch('jingle')}
                                    className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                    <span>🔍 Chercher Jingle sur YT</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="px-3.5 py-2 rounded-xl bg-neon-cyan/20 hover:bg-neon-cyan/30 border border-neon-cyan/40 text-neon-cyan text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Créer Jingle / Pub</span>
                            </button>
                        </div>
                    </div>

                    {/* Add Form Drawer */}
                    <AnimatePresence>
                        {showAddForm && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                onSubmit={handleAddItem}
                                className="p-4 sm:p-5 bg-[#0f111a] border-b border-white/10 shrink-0 space-y-3"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                    <div className="sm:col-span-3">
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Catégorie</label>
                                        <select
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value as any)}
                                            className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                                        >
                                            <option value="jingle">🔔 Jingle / Sweeper</option>
                                            <option value="pub">📢 Publicité / Sponsor</option>
                                            <option value="promo">⚡ Promo / Teaser</option>
                                        </select>
                                    </div>

                                    <div className="sm:col-span-4">
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Lien YouTube ou ID</label>
                                        <input
                                            type="text"
                                            value={newUrl}
                                            onChange={(e) => setNewUrl(e.target.value)}
                                            onBlur={handleUrlBlur}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Titre de l'habillage</label>
                                        <input
                                            type="text"
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            placeholder={isFetchingTitle ? "Récupération..." : "Ex: Jingle Dropsiders Festival 2026"}
                                            className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Durée (sec)</label>
                                        <input
                                            type="number"
                                            value={newDuration}
                                            onChange={(e) => setNewDuration(e.target.value)}
                                            className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                                            min={1}
                                            max={300}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddForm(false)}
                                        className="px-4 py-2 rounded-xl bg-white/5 text-xs font-bold text-gray-400 hover:text-white"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 rounded-xl bg-neon-cyan text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Sauvegarder dans le Bac</span>
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Cartouchier Items Grid */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredItems.map((item) => {
                                const isJingle = item.category === 'jingle';
                                const isPub = item.category === 'pub';
                                const badgeColor = isJingle 
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                                    : isPub 
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                        : 'bg-red-500/20 text-red-300 border-red-500/30';

                                return (
                                    <div
                                        key={item.id}
                                        className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-3 group relative"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${badgeColor}`}>
                                                    {isJingle ? '🔔 Jingle' : isPub ? '📢 Publicité' : '⚡ Promo'}
                                                </span>
                                                <span className="text-[10px] font-mono text-gray-400 font-bold">
                                                    {item.duration}s
                                                </span>
                                            </div>

                                            <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-neon-cyan transition-colors">
                                                {item.title}
                                            </h4>
                                            <p className="text-[9px] text-gray-500 font-mono mt-1">
                                                YT: {item.youtubeId}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                                            {item.isCustom && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                    title="Supprimer du bac"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => onInsertItem(item)}
                                                className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-neon-cyan hover:text-black text-white text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-md ml-auto"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Insérer dans l'Émission</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
