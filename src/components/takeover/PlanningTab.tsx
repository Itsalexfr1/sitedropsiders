import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Trash2, Calendar, Clock, Instagram, 
    Image as ImageIcon, Search, Zap, Check,
    Music, Home, MapPin
} from 'lucide-react';
import { useTakeover } from '../../context/TakeoverContext';
import type { LineupItem } from '../../context/TakeoverContext';
import { resolveImageUrl } from '../../utils/image';

export function PlanningTab() {
    const { 
        settings, setSettings, wikiDjs, wikiClubs, wikiFestivals,
        activeStage, setActiveStage, showNotification 
    } = useTakeover();

    const [editLineup, setEditLineup] = useState<LineupItem[]>(() => {
        try {
            return JSON.parse(settings.lineup || '[]');
        } catch (e) {
            return [];
        }
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [bulkDate, setBulkDate] = useState('');
    const [showWikiResults, setShowWikiResults] = useState<string | null>(null); // ID of lineup item being edited

    const filteredLineup = useMemo(() => {
        return editLineup.filter(item => 
            (item.stage || 'stage1') === activeStage &&
            (item.artist.toLowerCase().includes(searchTerm.toLowerCase()))
        ).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    }, [editLineup, activeStage, searchTerm]);

    const handleSaveLineup = () => {
        setSettings(prev => ({
            ...prev,
            lineup: JSON.stringify(editLineup)
        }));
        showNotification('Planning mis à jour localement. N\'oubliez pas de sauvegarder globalement !', 'info');
    };

    const addLineupItem = () => {
        const newItem: LineupItem = {
            id: Math.random().toString(36).substr(2, 9),
            day: new Date().toISOString().split('T')[0],
            startTime: '20:00',
            endTime: '21:00',
            artist: '',
            stage: activeStage,
            instagram: '',
            image: ''
        };
        setEditLineup([...editLineup, newItem]);
    };

    const removeLineupItem = (id: string) => {
        setEditLineup(editLineup.filter(item => item.id !== id));
    };

    const updateItem = (id: string, updates: Partial<LineupItem>) => {
        setEditLineup(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const applyBulkDate = () => {
        if (!bulkDate) return;
        setEditLineup(prev => prev.map(item => 
            (item.stage || 'stage1') === activeStage ? { ...item, day: bulkDate } : item
        ));
        showNotification(`Date appliquée à tout le ${activeStage}`, 'success');
    };

    const findWikiDj = (name: string) => {
        if (!name || name.length < 2) return [];
        const search = name.toLowerCase();
        
        const djs = wikiDjs.filter(dj => dj.name.toLowerCase().includes(search)).map(dj => ({ ...dj, _type: 'DJ' }));
        const clubs = wikiClubs.filter(c => c.name.toLowerCase().includes(search)).map(c => ({ ...c, _type: 'CLUB' }));
        const fests = wikiFestivals.filter(f => f.name.toLowerCase().includes(search)).map(f => ({ ...f, _type: 'FESTIVAL' }));

        return [...djs, ...fests, ...clubs].slice(0, 8);
    };

    const autoFillFromWiki = (id: string, item: any) => {
        updateItem(id, {
            artist: item.name.toUpperCase(),
            instagram: item.instagram || '',
            image: item.image || '',
            wikiId: item.id || '',
            wikiType: item._type
        });
        setShowWikiResults(null);
        showNotification(`Infos auto-remplies (${item._type}) pour ${item.name}`, 'success');
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-white/5 p-6 rounded-3xl border border-white/10">
                <div className="flex flex-wrap gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Filtrer Scène</label>
                        <div className="flex gap-2">
                            {['stage1', 'stage2', 'stage3'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setActiveStage(s)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeStage === s ? 'bg-neon-cyan text-black' : 'bg-white/5 text-gray-400'}`}
                                >
                                    {s.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Recherche Artiste</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="RECHERCHER..."
                                className="bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-[10px] text-white focus:border-neon-cyan outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-right block">Date de masse</label>
                        <div className="flex gap-2">
                            <input 
                                type="date" 
                                value={bulkDate}
                                onChange={e => setBulkDate(e.target.value)}
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] text-white outline-none"
                                style={{ colorScheme: 'dark' }}
                            />
                            <button 
                                onClick={applyBulkDate}
                                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                                title="Appliquer à toute la scène"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <button 
                        onClick={addLineupItem}
                        className="flex items-center gap-2 px-6 py-2 bg-neon-cyan text-black font-black uppercase text-[10px] rounded-xl hover:scale-105 transition-all self-end h-[38px]"
                    >
                        <Plus className="w-4 h-4" /> Ajouter
                    </button>
                    <button 
                        onClick={handleSaveLineup}
                        className="flex items-center gap-2 px-6 py-2 bg-white text-black font-black uppercase text-[10px] rounded-xl hover:scale-105 transition-all self-end h-[38px]"
                    >
                        Sauvegarder Planning
                    </button>
                </div>
            </div>

            {/* Lineup Grid */}
            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredLineup.map((item) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row gap-6 group hover:border-white/20 transition-all"
                        >
                            {/* Artist Info & Auto-fill */}
                            <div className="flex-1 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Artiste</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={item.artist}
                                            onChange={e => {
                                                updateItem(item.id, { artist: e.target.value });
                                                setShowWikiResults(item.id);
                                            }}
                                            onFocus={() => setShowWikiResults(item.id)}
                                            placeholder="NOM DE L'ARTISTE..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-white uppercase focus:border-neon-cyan outline-none transition-all"
                                        />
                                        <AnimatePresence>
                                            {showWikiResults === item.id && item.artist.length >= 2 && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute left-0 right-0 top-full mt-2 z-50 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                                                >
                                                    <div className="p-2 border-b border-white/5 bg-white/5 flex items-center gap-2">
                                                        <Zap className="w-3 h-3 text-amber-500" />
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Suggestions Wiki DJs</span>
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                        {findWikiDj(item.artist).length > 0 ? (
                                                            findWikiDj(item.artist).map(dj => (
                                                                <button
                                                                    key={dj.id}
                                                                    onClick={() => autoFillFromWiki(item.id, dj)}
                                                                    className="w-full p-3 flex  items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-none"
                                                                >
                                                                    <div className="w-8 h-8 rounded-lg bg-black/40 overflow-hidden shrink-0 flex items-center justify-center">
                                                                        {dj.image ? (
                                                                            <img src={resolveImageUrl(dj.image)} className="w-full h-full object-cover" alt="" />
                                                                        ) : (
                                                                            dj._type === 'DJ' ? <Music className="w-4 h-4 text-gray-700" /> : 
                                                                            dj._type === 'CLUB' ? <Home className="w-4 h-4 text-gray-700" /> :
                                                                            <MapPin className="w-4 h-4 text-gray-700" />
                                                                        )}
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-[10px] font-black text-white uppercase">{dj.name}</p>
                                                                            <span className={`text-[6px] font-black px-1.5 py-0.5 rounded ${
                                                                                dj._type === 'DJ' ? 'bg-neon-cyan/20 text-neon-cyan' :
                                                                                dj._type === 'FESTIVAL' ? 'bg-amber-500/20 text-amber-500' :
                                                                                'bg-pink-500/20 text-pink-500'
                                                                            }`}>
                                                                                {dj._type}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[8px] text-gray-500 uppercase">{dj.genre || dj.location || (dj._type === 'DJ' ? 'DJ/Producteur' : 'Lieu')}</p>
                                                                    </div>
                                                                    <div className="ml-auto">
                                                                        <Plus className="w-3 h-3 text-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                    </div>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center">
                                                                <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Aucun artiste trouvé dans le wiki</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1"><Instagram className="w-3 h-3" /> Instagram</label>
                                        <input 
                                            type="text" 
                                            value={item.instagram}
                                            onChange={e => updateItem(item.id, { instagram: e.target.value })}
                                            placeholder="@pseudo"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] text-white outline-none focus:border-pink-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Image URL</label>
                                        <input 
                                            type="text" 
                                            value={item.image}
                                            onChange={e => updateItem(item.id, { image: e.target.value })}
                                            placeholder="https://..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] text-white outline-none focus:border-neon-cyan/50 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Time & Date */}
                            <div className="flex flex-row md:flex-col gap-4 justify-between md:justify-center border-l border-white/5 pl-6">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</label>
                                    <input 
                                        type="date" 
                                        value={item.day}
                                        onChange={e => updateItem(item.id, { day: e.target.value })}
                                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> Début</label>
                                        <input 
                                            type="text" 
                                            value={item.startTime}
                                            onChange={e => updateItem(item.id, { startTime: e.target.value })}
                                            placeholder="20:00"
                                            className="w-20 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white text-center outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> Fin</label>
                                        <input 
                                            type="text" 
                                            value={item.endTime}
                                            onChange={e => updateItem(item.id, { endTime: e.target.value })}
                                            placeholder="21:00"
                                            className="w-20 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white text-center outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-center border-l border-white/5 pl-6">
                                <button
                                    onClick={() => removeLineupItem(item.id)}
                                    className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all"
                                    title="Supprimer"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                    {filteredLineup.length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                            <p className="text-gray-600 font-black uppercase text-xs tracking-[0.2em] italic">Aucun artiste pour le moment sur {activeStage}</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
