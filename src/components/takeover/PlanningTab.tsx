import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
    Plus, Trash2, Calendar, Clock, Instagram, 
    Image as ImageIcon, Zap, Check,
    Music, Home, MapPin, Globe, RefreshCcw, Camera, Scan, ArrowRight
} from 'lucide-react';
import { useTakeover } from '../../context/TakeoverContext';
import type { LineupItem } from '../../context/TakeoverContext';
import { resolveImageUrl } from '../../utils/image';
import { ImageUploadModal } from '../ImageUploadModal';
import { uploadFile } from '../../utils/uploadService';
import { useUser } from '../../context/UserContext';

interface PlanningTabProps {
    editLineup: LineupItem[];
    setEditLineup: React.Dispatch<React.SetStateAction<LineupItem[]>>;
}

export function PlanningTab({ editLineup, setEditLineup }: PlanningTabProps) {
    const { 
        settings, setSettings, wikiDjs, wikiClubs, wikiFestivals,
        activeStage, setActiveStage, showNotification, handleGlobalSave
    } = useTakeover();


    const [manualOffset, setManualOffset] = useState(8); 
    const [selectedTimezoneId, setSelectedTimezoneId] = useState('fr');
    const [searchTerm, setSearchTerm] = useState('');
    const [bulkDate, setBulkDate] = useState('');
    const [showWikiResults, setShowWikiResults] = useState<string | null>(null);
    const [now, setNow] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const [showBulkImport, setShowBulkImport] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

    const timezonePresets = [
        { id: 'fr', label: 'FR', tz: 'Europe/Paris', offset: 0 },
        { id: 'uk', label: 'UK', tz: 'Europe/London', offset: 1 },
        { id: 'us-east', label: 'US-EST', tz: 'America/New_York', offset: 6 },
        { id: 'us-west', label: 'COACHELLA', tz: 'America/Los_Angeles', offset: 9 },
        { id: 'us-central', label: 'US-CENTRAL', tz: 'America/Chicago', offset: 7 },
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

    const convertTimesByOffset = (offset: number) => {
        setEditLineup(prev => prev.map(item => {
            if ((item.stage || 'stage1') !== activeStage) return item;
            const shiftTime = (t: string) => {
                if (!t) return { time: '', dayShift: 0 };
                let [h, m] = t.replace('h', ':').replace('.', ':').split(':').map(Number);
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
                d.setUTCDate(d.getUTCDate() + start.dayShift);
                newDay = d.toISOString().split('T')[0];
            }
            return { ...item, startTime: start.time, endTime: end.time, day: newDay };
        }));
        showNotification(`Converti avec succès (${offset > 0 ? '+' : ''}${offset}h)`, 'success');
    };

    const convertTimesToFR = () => {
        const offset = selectedTimezoneId === 'us-west' ? 8 : (selectedTimezoneId === 'uk' ? 1 : 0);
        convertTimesByOffset(offset);
        setSelectedTimezoneId('fr');
    };

    const filteredLineup = useMemo(() => {
        const getSortValue = (time: string) => {
            if (!time) return 9999;
            let [h, m] = time.replace('h', ':').replace('.', ':').split(':').map(Number);
            if (isNaN(h)) return 9999;
            // Festival logic: hours 0-7 are part of previous night (treat as 24-31)
            let finalH = h;
            if (h < 8) finalH += 24; 
            return finalH * 60 + (m || 0);
        };

        return editLineup.filter(item => 
            (item.stage || 'stage1') === activeStage &&
            (item.artist.toLowerCase().includes(searchTerm.toLowerCase()))
        ).sort((a, b) => getSortValue(a.startTime) - getSortValue(b.startTime));
    }, [editLineup, activeStage, searchTerm]);



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
        setEditLineup(prev => prev.map(item => (item.stage || 'stage1') === activeStage ? { ...item, day: bulkDate } : item));
        showNotification(`Date appliquée !`, 'success');
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
    };

    const getProgress = (item: LineupItem) => {
        if (!item.startTime || !item.endTime || !item.day) return 0;
        try {
            const start = new Date(`${item.day}T${item.startTime}`);
            const end = new Date(`${item.day}T${item.endTime}`);
            if (end < start) end.setDate(end.getDate() + 1);
            if (now < start) return 0;
            if (now > end) return 100;
            const total = end.getTime() - start.getTime();
            const elapsed = now.getTime() - start.getTime();
            return Math.min(100, Math.max(0, (elapsed / total) * 100));
        } catch (e) { return 0; }
    };

    const handleBulkImport = () => {
        if (!bulkText || !bulkDate) {
            showNotification('Remplissez la date et le texte', 'error');
            return;
        }
        const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
        const newItems: LineupItem[] = [];
        let currentStage = activeStage;
        
        // Preparation of available stages for detection
        const availableStages = (settings.streams || []).map(s => ({ id: s.id, name: s.name.toLowerCase() }));

        lines.forEach(line => {
            const lowerLine = line.toLowerCase();
            
            // 1. Detect Stage Change
            const matchedStage = availableStages.find(s => lowerLine === s.name || lowerLine.includes(s.name));
            if (matchedStage) {
                currentStage = matchedStage.name;
                return; // Continue to next line
            }

            // 2. Detect Artist with Time (Improved RegEx)
            // Format 1: 17:20 - 18:10 : ARTISTE
            const mFull = line.match(/^(\d{1,2}[:h]\d{2})\s*[-–—]\s*(\d{1,2}[:h]\d{2})\s*[:\-]\s*(.+)$/i);
            // Format 2: 17:20 : ARTISTE (simple)
            const mSimple = line.match(/^(\d{1,2}[:h]\d{2})\s*[:\-]\s*(.+)$/i);
            // Format 3: 17:20 ARTISTE (space only)
            const mSpace = line.match(/^(\d{1,2}[:h]\d{2})\s+(.+)$/i);

            if (mFull) {
                newItems.push({
                    id: Math.random().toString(36).substr(2, 9),
                    day: bulkDate,
                    startTime: mFull[1].replace('h', ':'),
                    endTime: mFull[2].replace('h', ':'),
                    artist: mFull[3].trim().toUpperCase(),
                    stage: currentStage,
                    instagram: '', image: ''
                });
            } else if (mSimple || mSpace) {
                const match = mSimple || mSpace;
                newItems.push({
                    id: Math.random().toString(36).substr(2, 9),
                    day: bulkDate,
                    startTime: match![1].replace('h', ':'),
                    endTime: '',
                    artist: match![2].trim().toUpperCase(),
                    stage: currentStage,
                    instagram: '', image: ''
                });
            }
        });

        if (newItems.length > 0) {
            setEditLineup(prev => [...prev, ...newItems]);
            setBulkText('');
            setShowBulkImport(false);
            showNotification(`${newItems.length} artistes importés`, 'success');
        } else {
            showNotification('Format incorrect', 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="space-y-4">
                {/* Row 1: STAGES ONLY */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-3 border-r border-white/10 shrink-0">Stages</span>
                    <div className="flex items-center gap-2">
                        {(settings.streams && settings.streams.length > 0 ? settings.streams.map(s => s.name.toUpperCase()) : ['STAGE 1']).map(s => (
                            <button
                                key={s}
                                onClick={() => setActiveStage(s.toLowerCase())}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeStage === s.toLowerCase() ? 'bg-neon-cyan text-black shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1" />

                    {/* NOW INDICATOR */}
                    {(() => {
                        const currentlyPlaying = editLineup.find(item => {
                            if ((item.stage || 'stage1') !== activeStage) return false;
                            const prog = getProgress(item);
                            return prog > 0 && prog < 100;
                        });
                        if (!currentlyPlaying) return null;
                        return (
                            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/20 rounded-xl animate-pulse">
                                <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full shadow-[0_0_10px_rgba(34,211,238,1)]" />
                                <span className="text-[9px] font-black text-neon-cyan uppercase tracking-tighter italic">NOW: {currentlyPlaying.artist}</span>
                            </div>
                        );
                    })()}
                </div>

                {/* Row 2: TIMEZONES ONLY */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-3 border-r border-white/10 shrink-0">Fuseau / Festival</span>
                    <div className="flex bg-black/20 p-1 rounded-xl items-center gap-1">
                        <button onClick={() => { setSelectedTimezoneId('us-west'); convertTimesByOffset(8); }} className="px-5 py-2.5 bg-neon-purple/20 border border-neon-purple/40 text-neon-purple rounded-lg text-[9px] font-black uppercase flex items-center gap-2 hover:bg-neon-purple hover:text-white transition-all">
                            <Zap className="w-3 h-3" /> COACHELLA (+8H)
                        </button>
                        <button onClick={() => { setSelectedTimezoneId('uk'); convertTimesByOffset(1); }} className="px-5 py-2.5 bg-neon-blue/20 border border-neon-blue/40 text-neon-blue rounded-lg text-[9px] font-black uppercase flex items-center gap-2 hover:bg-neon-blue hover:text-white transition-all">
                            <Plus className="w-3 h-3" /> UK (+1H)
                        </button>
                    </div>
                    
                    <div className="h-4 w-px bg-white/10" />

                    <div className="flex bg-white/5 p-1 rounded-xl items-center gap-2 border border-white/10">
                        <span className="text-[8px] font-black text-gray-500 uppercase ml-2">Manuel</span>
                        <input 
                            type="number" 
                            value={manualOffset}
                            onChange={e => setManualOffset(Number(e.target.value))}
                            className="w-10 bg-black border border-white/10 rounded-lg py-1 px-2 text-[10px] text-white font-black text-center outline-none"
                        />
                        <button onClick={() => convertTimesByOffset(manualOffset)} className="p-2 bg-white/10 hover:bg-white text-black rounded-lg transition-all">
                            <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Row 3: DATE & ACTIONS */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-3xl p-3">
                    <div className="flex items-center gap-4 pl-2">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest border-r border-white/10 pr-4">Appliquer Date</span>
                        <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                            <input 
                                type="date" 
                                value={bulkDate}
                                onChange={e => setBulkDate(e.target.value)}
                                className="bg-transparent text-[10px] text-white font-black outline-none uppercase"
                                style={{ colorScheme: 'dark' }}
                            />
                            <button onClick={applyBulkDate} className="p-1 text-neon-cyan hover:scale-110 transition-transform" title="Appliquer à tous">
                                <Check className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setShowBulkImport(!showBulkImport)}
                            className={`h-11 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${showBulkImport ? 'bg-neon-purple border-neon-purple text-white shadow-lg' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                        >
                            📥 IMPORT MASSIF
                        </button>
                        <button 
                            onClick={addLineupItem}
                            className="h-11 px-10 bg-neon-cyan text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-neon-cyan/20 hover:scale-[1.03] active:scale-95 transition-all"
                        >
                            ➕ AJOUTER UN ARTISTE
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Import */}
            <AnimatePresence>
                {showBulkImport && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="bg-white/5 border border-neon-purple/20 rounded-3xl p-6 space-y-4">
                            <textarea 
                                value={bulkText}
                                onChange={e => setBulkText(e.target.value)}
                                className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none font-mono"
                                placeholder="20:00 - ARTISTE\n21:30 - ARTISTE..."
                            />
                            <div className="flex justify-end">
                                <button onClick={handleBulkImport} className="px-6 py-2 bg-neon-purple text-white text-[10px] font-black uppercase rounded-xl">
                                    Lancer l'import
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grid Artistes */}
            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredLineup.map((item) => (
                        <motion.div 
                            key={item.id} 
                            layout 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95 }} 
                            className="relative h-32 bg-zinc-900 border border-white/5 rounded-[2rem] overflow-hidden group hover:border-white/20 transition-all flex items-center"
                        >
                            {/* Full Background Image */}
                            {item.image ? (
                                <img 
                                    src={resolveImageUrl(item.image)} 
                                    className="absolute inset-0 w-full h-full object-cover transition-opacity" 
                                    alt="" 
                                />
                            ) : (
                                <div className="absolute inset-0 bg-red-950/20 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-red-500/30 animate-pulse">
                                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Image Requise</p>
                                </div>
                            )}
                            
                            {/* Static readability gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-[1]" />

                            {/* Progress Overlay (Full Height Darkening) */}
                            {getProgress(item) > 0 && (
                                <motion.div 
                                    className="absolute inset-y-0 left-0 bg-black/85 z-[2] pointer-events-none border-r-2 border-neon-cyan shadow-[30px_0_50px_rgba(34,211,238,0.3)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${getProgress(item)}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            )}

                            {/* Clickable Image Edit Overlay */}
                            <button 
                                onClick={() => { setUploadTargetId(item.id); setShowUploadModal(true); }}
                                className="absolute top-4 left-4 z-20 p-3 bg-black/60 backdrop-blur-md rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-neon-cyan hover:text-black border border-white/10"
                                title="Changer la photo"
                            >
                                <Camera className="w-6 h-6" />
                            </button>

                            {/* Content Overlays */}
                            <div className="flex-1 flex flex-col md:flex-row items-center gap-10 px-12 z-10 w-full">
                                {/* Center Info Section */}
                                <div className="flex-1 flex flex-col justify-center gap-0 group/info">
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={item.artist} 
                                                onChange={e => { updateItem(item.id, { artist: e.target.value.toUpperCase() }); setShowWikiResults(item.id); }} 
                                                onFocus={() => setShowWikiResults(item.id)} 
                                                className={`bg-transparent font-black text-white italic outline-none uppercase tracking-tighter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] transition-all ${
                                                    item.artist.length > 20 ? 'text-2xl md:text-3xl' : 
                                                    item.artist.length > 15 ? 'text-3xl md:text-4xl' : 
                                                    item.artist.length > 12 ? 'text-4xl md:text-5xl' : 
                                                    'text-4xl md:text-6xl'
                                                }`} 
                                            />
                                            <AnimatePresence>
                                                {showWikiResults === item.id && item.artist.length >= 2 && findWikiDj(item.artist).length > 0 && (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute left-0 right-0 top-full mt-2 z-[60] bg-gray-950/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden min-w-[250px]">
                                                        {findWikiDj(item.artist).map(dj => (
                                                            <button key={dj.id} onClick={() => autoFillFromWiki(item.id, dj)} className="w-full p-4 flex items-center gap-4 hover:bg-white/10 text-left border-b border-white/5 last:border-none">
                                                                <div className="w-10 h-10 rounded-xl bg-black border border-white/10 overflow-hidden flex-shrink-0 shadow-lg">{dj.image ? <img src={resolveImageUrl(dj.image)} className="w-full h-full object-cover" /> : <Music className="w-full h-full p-2 text-gray-800" />}</div>
                                                                <div className="flex-1"><p className="text-[12px] font-black text-white uppercase">{dj.name}</p><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{dj._type}</p></div>
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-white/60 text-[10px] font-black uppercase tracking-wider mt-2">
                                        <div className="flex items-center gap-2 drop-shadow-lg"><MapPin className="w-3 h-3 text-red-500" />{activeStage}</div>
                                        <div className="h-3 w-px bg-white/20" />
                                        <div className="flex items-center gap-2 drop-shadow-lg p-1 hover:bg-white/5 rounded-lg transition-colors">
                                            <Instagram className="w-3 h-3 text-pink-500" />
                                            <input type="text" value={item.instagram} onChange={e => updateItem(item.id, { instagram: e.target.value })} className="bg-transparent text-[9px] font-black outline-none w-20" placeholder="@INSTA" />
                                        </div>
                                        <div className="h-3 w-px bg-white/20" />
                                        <div className="flex items-center gap-2 drop-shadow-lg p-1 hover:bg-white/5 rounded-lg transition-colors">
                                            <Calendar className="w-3 h-3 text-amber-500" />
                                            <input type="date" value={item.day} onChange={e => updateItem(item.id, { day: e.target.value })} className="bg-transparent outline-none border-none p-0 text-[10px] w-24" style={{ colorScheme: 'dark' }} />
                                        </div>
                                        <div className="h-3 w-px bg-white/20" />
                                        <div className="flex items-center gap-2 drop-shadow-lg p-1 hover:bg-white/5 rounded-lg transition-colors">
                                            <Clock className="w-3 h-3 text-neon-cyan" />
                                            <input type="text" value={item.startTime} onChange={e => updateItem(item.id, { startTime: e.target.value })} className="bg-transparent text-[9px] font-black outline-none w-10 text-center" placeholder="00:00" />
                                            <span className="text-[10px] text-white/30">-</span>
                                            <input type="text" value={item.endTime} onChange={e => updateItem(item.id, { endTime: e.target.value })} className="bg-transparent text-[9px] font-black outline-none w-10 text-center" placeholder="00:00" />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Timeline Section - Keep for secondary view but slimmed down if needed */}
                                 <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-4">
                                        {getPreviewTime(item.startTime) && (
                                            <div className="flex items-center gap-2 bg-neon-cyan/10 border border-neon-cyan/20 px-3 py-1.5 rounded-lg shadow-lg shadow-neon-cyan/5">
                                                <Globe className="w-3 h-3 text-neon-cyan" />
                                                <span className="text-[10px] font-black text-neon-cyan uppercase italic">FR: {getPreviewTime(item.startTime)}</span>
                                            </div>
                                        )}
                                        <button onClick={() => removeLineupItem(item.id)} className="p-4 bg-red-500/10 text-red-500 hover:bg-neon-red hover:text-white rounded-2xl transition-all border border-red-500/10"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mr-2">Converti depuis {timezonePresets.find(p => p.id === selectedTimezoneId)?.label}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <ImageUploadModal 
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                initialImage={uploadTargetId ? editLineup.find(i => i.id === uploadTargetId)?.image : undefined}
                onUploadSuccess={(url) => {
                    const finalUrl = Array.isArray(url) ? url[0] : url;
                    if (uploadTargetId && finalUrl) {
                        updateItem(uploadTargetId, { image: finalUrl });
                        showNotification('Photo mise à jour !', 'success');
                    }
                    setShowUploadModal(false);
                }}
                accentColor="neon-cyan"
                aspect={16/9}
            />
        </div>
    );
}
