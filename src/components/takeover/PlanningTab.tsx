import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Trash2, Calendar, Clock, Instagram, 
    Image as ImageIcon, Search, Zap, Check,
    Music, Home, MapPin, Globe, RefreshCcw
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
    const [selectedTimezoneId, setSelectedTimezoneId] = useState('fr');
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [bulkText, setBulkText] = useState('');

    const timezonePresets = [
        { id: 'fr', label: 'Heure Française (pas de conversion)', tz: 'Europe/Paris', offset: 0 },
        { id: 'uk', label: 'Londres (Creamfields/Drumsheds)', tz: 'Europe/London', offset: 1 },
        { id: 'us-east', label: 'US Est (Miami/Ultra/NY)', tz: 'America/New_York', offset: 6 },
        { id: 'us-west', label: 'US Ouest (Coachella/EDC Vegas)', tz: 'America/Los_Angeles', offset: 9 },
        { id: 'us-central', label: 'US Centre (Chicago/Texas)', tz: 'America/Chicago', offset: 7 },
    ];

    const calculateDynamicOffset = (tzId: string) => {
        try {
            if (tzId === 'Europe/Paris') return 0;
            const now = new Date();
            const parisStr = now.toLocaleString('en-US', { timeZone: 'Europe/Paris', hour12: false });
            const targetStr = now.toLocaleString('en-US', { timeZone: tzId, hour12: false });
            
            const pDate = new Date(parisStr);
            const tDate = new Date(targetStr);
            
            return Math.round((pDate.getTime() - tDate.getTime()) / (1000 * 60 * 60));
        } catch (e) {
            return 0;
        }
    };

    const convertTimesToFR = () => {
        const preset = timezonePresets.find(p => p.id === selectedTimezoneId);
        if (!preset || preset.id === 'fr') return;

        const offset = calculateDynamicOffset(preset.tz);
        
        setEditLineup(prev => prev.map(item => {
            if ((item.stage || 'stage1') !== activeStage) return item;

            const shiftTime = (t: string) => {
                if (!t) return { time: '', dayShift: 0 };
                let [h, m] = t.split(':').map(Number);
                let dayShift = 0;
                let newH = h + offset;
                while (newH >= 24) { newH -= 24; dayShift++; }
                while (newH < 0) { newH += 24; dayShift--; }
                return { 
                    time: `${newH.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`,
                    dayShift 
                };
            };

            const start = shiftTime(item.startTime);
            const end = shiftTime(item.endTime);

            let newDay = item.day;
            if (start.dayShift !== 0 && item.day) {
                const d = new Date(item.day);
                d.setDate(d.getDate() + start.dayShift);
                newDay = d.toISOString().split('T')[0];
            }

            return {
                ...item,
                startTime: start.time,
                endTime: end.time,
                day: newDay
            };
        }));

        setSelectedTimezoneId('fr');
        showNotification(`Converti avec succès (+${offset}h)`, 'success');
    };

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

    const handleBulkImport = () => {
        if (!bulkText || !bulkDate) {
            showNotification('Veuillez remplir la date et coller le texte du planning', 'error');
            return;
        }

        const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
        const newItems: LineupItem[] = [];
        const regex = /^(\d{1,2})[h:.\s](\d{2})?\s*[-–—]\s*(.+)$/i;
        
        const preset = timezonePresets.find(p => p.id === selectedTimezoneId);
        const offset = selectedTimezoneId !== 'fr' ? calculateDynamicOffset(preset?.tz || 'Europe/Paris') : 0;

        lines.forEach(line => {
            const m = line.match(regex);
            if (m) {
                let h = parseInt(m[1]);
                let min = m[2] || '00';
                
                // Shift time
                let dayShift = 0;
                let newH = h + offset;
                while (newH >= 24) { newH -= 24; dayShift++; }
                while (newH < 0) { newH += 24; dayShift--; }

                let finalDay = bulkDate;
                if (dayShift !== 0) {
                    const d = new Date(bulkDate);
                    d.setDate(d.getDate() + dayShift);
                    finalDay = d.toISOString().split('T')[0];
                }

                newItems.push({
                    id: Math.random().toString(36).substr(2, 9),
                    day: finalDay,
                    startTime: `${newH.toString().padStart(2, '0')}:${min.padStart(2, '0')}`,
                    endTime: '', // User will fill end times
                    artist: m[3].trim().toUpperCase(),
                    stage: activeStage,
                    instagram: '',
                    image: ''
                });
            }
        });

        if (newItems.length > 0) {
            setEditLineup(prev => [...prev, ...newItems]);
            setBulkText('');
            setShowBulkImport(false);
            showNotification(`${newItems.length} artistes importés sur ${activeStage} (${offset > 0 ? '+'+offset+'h' : offset+'h'})`, 'success');
        } else {
            showNotification('Format non reconnu. Utilisez "20:00 - Artiste"', 'error');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-white/5 p-6 rounded-3xl border border-white/10">
                <div className="flex flex-wrap gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Filtrer Scène</label>
                        <div className="flex gap-2">
                            {(settings.streams && settings.streams.length > 0 ? settings.streams.map(s => s.name.toLowerCase()) : ['stage1']).map(s => (
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

                <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                            <Globe className="w-3 h-3 text-neon-purple" /> 
                            Conversion US/International {"->"} FR
                        </label>
                        <div className="flex gap-2">
                            <select 
                                value={selectedTimezoneId}
                                onChange={e => setSelectedTimezoneId(e.target.value)}
                                className="bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-[10px] text-white outline-none focus:border-neon-purple transition-all hover:border-white/20"
                            >
                                {timezonePresets.map(tz => (
                                    <option key={tz.id} value={tz.id} className="bg-gray-900">{tz.label}</option>
                                ))}
                            </select>
                            <button 
                                onClick={convertTimesToFR}
                                disabled={selectedTimezoneId === 'fr'}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-lg ${
                                    selectedTimezoneId === 'fr' 
                                    ? 'bg-white/5 text-gray-600 opacity-50 cursor-not-allowed' 
                                    : 'bg-neon-purple text-white hover:scale-105 active:scale-95 shadow-neon-purple/20'
                                }`}
                                title="Convertir tout le planning de cette scène"
                            >
                                <RefreshCcw className={`w-3.5 h-3.5 ${selectedTimezoneId !== 'fr' ? 'animate-spin-slow' : ''}`} />
                                Convertir
                            </button>
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
                        onClick={() => setShowBulkImport(!showBulkImport)}
                        className={`flex items-center gap-2 px-6 py-2 border font-black uppercase text-[10px] rounded-xl transition-all self-end h-[38px] ${showBulkImport ? 'bg-neon-purple text-white border-neon-purple' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        {showBulkImport ? 'Annuler Import' : 'Import Rapide'}
                    </button>
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

            {/* Bulk Import Area */}
            <AnimatePresence>
                {showBulkImport && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white/5 border border-neon-purple/20 rounded-3xl p-8 space-y-6 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-neon-purple/20 rounded-xl flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-neon-purple" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic leading-tight">Importation Groupée</h3>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase">Copiez-collez le planning (Format: 22:30 - TIESTO)</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-gray-500 uppercase">Input TZ:</span>
                                        <select 
                                            value={selectedTimezoneId}
                                            onChange={e => setSelectedTimezoneId(e.target.value)}
                                            className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-neon-purple outline-none"
                                        >
                                            {timezonePresets.map(tz => (
                                                <option key={tz.id} value={tz.id} className="bg-gray-900">{tz.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button 
                                        onClick={handleBulkImport}
                                        className="px-6 py-2 bg-neon-purple text-white text-[10px] font-black uppercase rounded-xl hover:scale-105 transition-all"
                                    >
                                        LANCER L'IMPORT SUR {activeStage.toUpperCase()}
                                    </button>
                                </div>
                            </div>
                            <textarea 
                                value={bulkText}
                                onChange={e => setBulkText(e.target.value)}
                                className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-6 text-xs text-white outline-none focus:border-neon-purple resize-none font-mono"
                                placeholder={"20:00 - ARTISTE 1\n21:00 - ARTISTE 2\n..."}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
