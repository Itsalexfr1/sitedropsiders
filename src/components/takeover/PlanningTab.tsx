import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Trash2, Calendar, Clock, Instagram, 
    Image as ImageIcon, Search, Zap, Check,
    Music, Home, MapPin, Globe, RefreshCcw, Camera
} from 'lucide-react';
import { useTakeover } from '../../context/TakeoverContext';
import type { LineupItem } from '../../context/TakeoverContext';
import { resolveImageUrl } from '../../utils/image';
import { uploadFile } from '../../utils/uploadService';
import { useUser } from '../../context/UserContext';

export function PlanningTab() {
    const { 
        settings, setSettings, wikiDjs, wikiClubs, wikiFestivals,
        activeStage, setActiveStage, showNotification, handleGlobalSave
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
    const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
    const [isSavingLineup, setIsSavingLineup] = useState(false);

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

    const handleSaveLineup = async () => {
        const updated = {
            ...settings,
            lineup: JSON.stringify(editLineup)
        };
        setSettings(updated);
        await handleGlobalSave(updated);
        showNotification('Planning enregistré sur le serveur !', 'success');
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

    const getPreviewTime = (time: string) => {
        const preset = timezonePresets.find(p => p.id === selectedTimezoneId);
        if (!preset || preset.id === 'fr' || !time) return null;
        
        const offset = calculateDynamicOffset(preset.tz);
        let [h, m] = time.split(':').map(Number);
        if (isNaN(h)) return null;
        
        let newH = h + offset;
        while (newH >= 24) newH -= 24;
        while (newH < 0) newH += 24;
        return `${newH.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`;
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Main Header Controls */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-4 flex flex-col xl:flex-row gap-4 items-center">
                {/* Search & Stage Group */}
                <div className="flex flex-1 items-center gap-3 bg-black/40 border border-white/5 p-2 rounded-3xl w-full">
                    <div className="flex gap-1 bg-white/5 p-1 rounded-2xl">
                        {(settings.streams && settings.streams.length > 0 ? settings.streams.map(s => s.name.toLowerCase()) : ['stage1']).map(s => (
                            <button
                                key={s}
                                onClick={() => setActiveStage(s)}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all ${activeStage === s ? 'bg-neon-cyan text-black shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'text-gray-500 hover:text-white'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <div className="h-4 w-[1px] bg-white/10 mx-1" />
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 group-focus-within:text-neon-cyan transition-colors" />
                        <input 
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="RECHERCHER UN ARTISTE..."
                            className="w-full bg-transparent pl-10 pr-4 py-2 text-[10px] text-white font-black uppercase tracking-widest outline-none"
                        />
                    </div>
                </div>

                {/* Automation Group */}
                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-3xl w-full xl:w-auto">
                    {/* Timezone */}
                    <div className="flex items-center gap-2 pl-2">
                        <Globe className="w-3.5 h-3.5 text-neon-purple" />
                        <select 
                            value={selectedTimezoneId}
                            onChange={e => setSelectedTimezoneId(e.target.value)}
                            className="bg-transparent text-[9px] font-black uppercase text-gray-400 outline-none hover:text-white transition-colors cursor-pointer"
                        >
                            {timezonePresets.map(tz => (
                                <option key={tz.id} value={tz.id} className="bg-gray-950">{tz.label}</option>
                            ))}
                        </select>
                        <button 
                            onClick={convertTimesToFR}
                            disabled={selectedTimezoneId === 'fr'}
                            className={`p-2 rounded-xl transition-all ${selectedTimezoneId === 'fr' ? 'text-gray-700 opacity-20' : 'text-neon-purple hover:bg-neon-purple/20 shadow-lg shadow-neon-purple/5'}`}
                            title="Convertir Tout"
                        >
                            <RefreshCcw className={`w-4 h-4 ${selectedTimezoneId !== 'fr' ? 'animate-spin-slow' : ''}`} />
                        </button>
                    </div>

                    <div className="h-4 w-[1px] bg-white/10 mx-1" />

                    {/* Mass Date */}
                    <div className="flex items-center gap-2">
                        <input 
                            type="date" 
                            value={bulkDate}
                            onChange={e => setBulkDate(e.target.value)}
                            className="bg-transparent text-[10px] text-gray-400 font-bold outline-none"
                            style={{ colorScheme: 'dark' }}
                        />
                        <button 
                            onClick={applyBulkDate}
                            className="p-2 text-white/40 hover:text-white transition-colors"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Primary Actions Group */}
                <div className="flex items-center gap-2 w-full xl:w-auto">
                    <button 
                        onClick={() => setShowBulkImport(!showBulkImport)}
                        className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all flex-1 xl:flex-none ${showBulkImport ? 'bg-neon-purple border-neon-purple text-white' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'}`}
                    >
                        IMPORT RAPIDE
                    </button>
                    <button 
                        onClick={addLineupItem}
                        className="px-5 py-3 bg-neon-cyan text-black text-[9px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-lg shadow-neon-cyan/10 flex-1 xl:flex-none"
                    >
                        AJOUTER
                    </button>
                    <button 
                        onClick={handleSaveLineup}
                        className="px-5 py-3 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all flex-1 xl:flex-none"
                    >
                        SAUVEGARDER
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
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 flex flex-col lg:flex-row gap-8 group hover:border-white/20 hover:bg-white/[0.07] transition-all relative overflow-hidden"
                        >
                            {/* Backdrop Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />

                            {/* Image Section */}
                            <div className="flex-shrink-0 relative group/img cursor-pointer" onClick={() => document.getElementById(`upload-${item.id}`)?.click()}>
                                <div className="w-24 h-24 rounded-3xl bg-black border border-white/10 overflow-hidden shadow-2xl transition-all group-hover/img:scale-105 group-hover/img:border-neon-cyan/30">
                                    {item.image ? (
                                        <img src={resolveImageUrl(item.image)} className="w-full h-full object-cover" alt={item.artist} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                                            <Music className="w-8 h-8 text-gray-800" />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center rounded-3xl backdrop-blur-sm">
                                    <Camera className="w-6 h-6 text-white" />
                                </div>
                                <input 
                                    id={`upload-${item.id}`}
                                    type="file" 
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setUploadingItemId(item.id);
                                        try {
                                            const url = await uploadFile(file, 'artists');
                                            updateItem(item.id, { image: url });
                                            showNotification('Image mise à jour !', 'success');
                                        } catch (err: any) {
                                            showNotification(err.message, 'error');
                                        } finally {
                                            setUploadingItemId(null);
                                        }
                                    }}
                                />
                            </div>

                            {/* Info Section */}
                            <div className="flex-1 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                                        <Music className="w-3 h-3 text-neon-cyan" /> Artiste
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={item.artist}
                                            onChange={e => {
                                                updateItem(item.id, { artist: e.target.value.toUpperCase() });
                                                setShowWikiResults(item.id);
                                            }}
                                            onFocus={() => setShowWikiResults(item.id)}
                                            placeholder="NOM DE L'ARTISTE..."
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 text-xs font-black text-white placeholder-gray-700 outline-none focus:border-neon-cyan/30 transition-all shadow-inner"
                                        />
                                        <AnimatePresence>
                                            {showWikiResults === item.id && item.artist.length >= 2 && findWikiDj(item.artist).length > 0 && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute left-0 right-0 top-full mt-3 z-50 bg-gray-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                                                >
                                                    <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Zap className="w-3 h-3 text-neon-cyan" />
                                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Base de Données Wiki</span>
                                                        </div>
                                                        <button onClick={() => setShowWikiResults(null)} className="text-[7px] font-black text-gray-600 hover:text-white uppercase">Fermer</button>
                                                    </div>
                                                    <div className="max-h-56 overflow-y-auto custom-scrollbar">
                                                        {findWikiDj(item.artist).map(dj => (
                                                            <button
                                                                key={dj.id}
                                                                onClick={() => autoFillFromWiki(item.id, dj)}
                                                                className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-all text-left border-b border-white/5 last:border-none group/row"
                                                            >
                                                                <div className="w-10 h-10 rounded-xl bg-black border border-white/10 overflow-hidden flex-shrink-0">
                                                                    {dj.image ? <img src={resolveImageUrl(dj.image)} className="w-full h-full object-cover" alt="" /> : <Music className="w-full h-full p-3 text-gray-800" />}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-[10px] font-black text-white group-hover/row:text-neon-cyan transition-colors">{dj.name}</p>
                                                                        <span className="text-[6px] font-black px-1.5 py-0.5 bg-white/5 rounded text-gray-400">{dj._type}</span>
                                                                    </div>
                                                                    <p className="text-[8px] text-gray-600 font-bold mt-0.5">{dj.genre || dj.location || 'Artiste'}</p>
                                                                </div>
                                                                <Plus className="w-4 h-4 text-neon-cyan opacity-0 group-hover/row:opacity-100 transition-all" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    <div className="flex-1 space-y-2 min-w-[140px]">
                                        <div className="flex items-center gap-2 text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                                            <Instagram className="w-3 h-3 text-pink-500" /> Instagram
                                        </div>
                                        <input 
                                            type="text" 
                                            value={item.instagram}
                                            onChange={e => updateItem(item.id, { instagram: e.target.value })}
                                            placeholder="@PSEUDO..."
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-[10px] text-white font-bold outline-none focus:border-pink-500/20 transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pt-6">
                                        <button 
                                            onClick={() => updateItem(item.id, { image: '' })}
                                            className={`p-3 rounded-2xl transition-all ${item.image ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'opacity-0 pointer-events-none'}`}
                                            title="Supprimer Image"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline Section */}
                            <div className="flex lg:flex-col gap-6 items-center lg:items-end justify-between border-l border-white/5 pl-8 min-w-[200px]">
                                <div className="space-y-2 w-full lg:w-auto">
                                    <div className="flex items-center gap-2 text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] lg:justify-end">
                                        <Calendar className="w-3 h-3 text-amber-500" /> Date
                                    </div>
                                    <input 
                                        type="date" 
                                        value={item.day}
                                        onChange={e => updateItem(item.id, { day: e.target.value })}
                                        className="w-full lg:text-right bg-transparent text-[11px] font-black text-white outline-none cursor-pointer"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>

                                <div className="flex gap-4">
                                    {/* Start Time */}
                                    <div className="space-y-2 text-center">
                                        <div className="flex items-center gap-2 text-[8px] font-black text-gray-500 uppercase tracking-widest justify-center">
                                            <Clock className="w-3 h-3 text-neon-cyan" /> DEBUT
                                        </div>
                                        <input 
                                            type="text" 
                                            value={item.startTime}
                                            onChange={e => updateItem(item.id, { startTime: e.target.value })}
                                            placeholder="20:00"
                                            className="w-16 bg-white/5 border border-white/10 rounded-xl px-2 py-3 text-[11px] font-black text-white text-center outline-none focus:border-neon-cyan/50"
                                        />
                                        {getPreviewTime(item.startTime) && (
                                            <div className="text-[7px] font-black text-neon-purple uppercase mt-1 animate-pulse">
                                                FR: <span className="text-white">{getPreviewTime(item.startTime)}</span>
                                            </div>
                                        )}
                                    </div>
                                    {/* End Time */}
                                    <div className="space-y-2 text-center">
                                        <div className="flex items-center gap-2 text-[8px] font-black text-gray-500 uppercase tracking-widest justify-center">
                                            <Clock className="w-3 h-3 text-neon-red" /> FIN
                                        </div>
                                        <input 
                                            type="text" 
                                            value={item.endTime}
                                            onChange={e => updateItem(item.id, { endTime: e.target.value })}
                                            placeholder="21:00"
                                            className="w-16 bg-white/5 border border-white/10 rounded-xl px-2 py-3 text-[11px] font-black text-white text-center outline-none focus:border-neon-red/50"
                                        />
                                        {getPreviewTime(item.endTime) && (
                                            <div className="text-[7px] font-black text-neon-purple uppercase mt-1 animate-pulse">
                                                FR: <span className="text-white">{getPreviewTime(item.endTime)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Trash */}
                                <button
                                    onClick={() => removeLineupItem(item.id)}
                                    className="p-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-[1.25rem] transition-all self-center lg:self-end"
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
