import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Trash2, Calendar, Clock, Instagram, 
    Image as ImageIcon, Zap, Check,
    Music, Home, MapPin, Globe, RefreshCcw, Camera, Scan
} from 'lucide-react';
import { useTakeover } from '../../context/TakeoverContext';
import type { LineupItem } from '../../context/TakeoverContext';
import { resolveImageUrl } from '../../utils/image';
import { ImageUploadModal } from '../ImageUploadModal';
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
    const [showWikiResults, setShowWikiResults] = useState<string | null>(null);
    const [selectedTimezoneId, setSelectedTimezoneId] = useState('fr');
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
        { id: 'us-west', label: 'US-WEST', tz: 'America/Los_Angeles', offset: 9 },
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
            return { ...item, startTime: start.time, endTime: end.time, day: newDay };
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
        const updated = { ...settings, lineup: JSON.stringify(editLineup) };
        setSettings(updated);
        await handleGlobalSave(updated);
        showNotification('Planning enregistré !', 'success');
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
        const regex = /^(\d{1,2})[h:.\s](\d{2})?\s*[-–—]\s*(.+)$/i;
        const preset = timezonePresets.find(p => p.id === selectedTimezoneId);
        const offset = selectedTimezoneId !== 'fr' ? calculateDynamicOffset(preset?.tz || 'Europe/Paris') : 0;

        lines.forEach(line => {
            const m = line.match(regex);
            if (m) {
                let h = parseInt(m[1]);
                let min = m[2] || '00';
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
                    endTime: '',
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
            showNotification(`${newItems.length} artistes importés`, 'success');
        } else {
            showNotification('Format incorrect', 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-4 flex flex-col xl:flex-row gap-4">
                {/* Stages Selection */}
                <div className="flex items-center gap-3 bg-black/40 border border-white/5 p-2 rounded-3xl h-14">
                    <div className="flex gap-1 bg-white/5 p-1 rounded-2xl">
                        {(settings.streams && settings.streams.length > 0 ? settings.streams.map(s => s.name.toLowerCase()) : ['stage1']).map(s => (
                            <button
                                key={s}
                                onClick={() => setActiveStage(s)}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all ${activeStage === s ? 'bg-neon-cyan text-black shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'text-gray-500'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fuseau Horaire & Date Group */}
                <div className="flex-1 flex items-center gap-2 bg-white/5 p-2 rounded-3xl h-14 overflow-x-auto no-scrollbar">
                    <div className="flex gap-1 px-1">
                        {timezonePresets.map(tz => (
                            <button
                                key={tz.id}
                                onClick={() => setSelectedTimezoneId(tz.id)}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${selectedTimezoneId === tz.id ? 'bg-neon-purple text-white shadow-[0_0_10px_rgba(191,0,255,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                {tz.label}
                            </button>
                        ))}
                    </div>
                    
                    <div className="h-4 w-px bg-white/10 flex-shrink-0 mx-1" />
                    
                    <button 
                        onClick={convertTimesToFR}
                        disabled={selectedTimezoneId === 'fr'}
                        className={`p-2 rounded-xl transition-all ${selectedTimezoneId === 'fr' ? 'text-gray-700 opacity-20' : 'text-neon-purple hover:bg-neon-purple/10'}`}
                        title="Convertir en heure FR"
                    >
                        <RefreshCcw className="w-4 h-4" />
                    </button>

                    <div className="h-4 w-px bg-white/10 flex-shrink-0 mx-1" />

                    <div className="flex items-center gap-2 pr-2">
                        <input 
                            type="date" 
                            value={bulkDate}
                            onChange={e => setBulkDate(e.target.value)}
                            className="bg-transparent text-[9px] text-gray-400 font-black outline-none uppercase"
                        />
                        <button onClick={applyBulkDate} className="p-2 text-white/20 hover:text-neon-cyan">
                            <Check className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Primary Actions */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowBulkImport(!showBulkImport)}
                        className={`h-14 px-6 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${showBulkImport ? 'bg-neon-purple border-neon-purple text-white' : 'bg-white/5 border-white/5 text-gray-500'}`}
                    >
                        IMPORT
                    </button>
                    <button 
                        onClick={addLineupItem}
                        className="h-14 px-6 bg-neon-cyan text-black text-[9px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-neon-cyan/10"
                    >
                        AJOUTER
                    </button>
                    <button 
                        onClick={handleSaveLineup}
                        className="h-14 px-6 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-2xl transition-all"
                    >
                        SAUVEGARDER
                    </button>
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
                            {item.image && (
                                <img 
                                    src={resolveImageUrl(item.image)} 
                                    className="absolute inset-0 w-full h-full object-cover transition-opacity" 
                                    alt="" 
                                />
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
                                                className="bg-transparent text-4xl md:text-6xl font-black text-white italic outline-none uppercase tracking-tighter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" 
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
                                    <div className="flex items-center gap-6 text-white/60 text-[11px] font-black uppercase tracking-[0.2em] mt-2">
                                        <div className="flex items-center gap-2 drop-shadow-lg"><MapPin className="w-4 h-4 text-red-500" />{activeStage}</div>
                                        <div className="h-4 w-px bg-white/20" />
                                        <div className="flex items-center gap-2 drop-shadow-lg p-1 hover:bg-white/5 rounded-lg transition-colors">
                                            <Instagram className="w-4 h-4 text-pink-500" />
                                            <input type="text" value={item.instagram} onChange={e => updateItem(item.id, { instagram: e.target.value })} className="bg-transparent text-[9px] font-black outline-none w-24" placeholder="@INSTA" />
                                        </div>
                                        <div className="h-4 w-px bg-white/20" />
                                        <div className="flex items-center gap-2 drop-shadow-lg">
                                            <Calendar className="w-4 h-4 text-amber-500" />
                                            <input type="date" value={item.day} onChange={e => updateItem(item.id, { day: e.target.value })} className="bg-transparent outline-none border-none p-0 text-[10px]" style={{ colorScheme: 'dark' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Timeline Section */}
                                <div className="flex items-center gap-10">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <span className="text-[9px] font-black text-neon-cyan uppercase tracking-widest">DEBUT</span>
                                            <input type="text" value={item.startTime} onChange={e => updateItem(item.id, { startTime: e.target.value })} className="w-20 bg-black/70 border border-white/10 rounded-2xl py-3 text-[14px] font-black text-white text-center outline-none backdrop-blur-xl hover:border-neon-cyan transition-colors" />
                                            {getPreviewTime(item.startTime) && <span className="text-[8px] font-black text-cyan-400 italic">FR {getPreviewTime(item.startTime)}</span>}
                                        </div>
                                        <div className="flex flex-col items-center gap-1.5">
                                            <span className="text-[9px] font-black text-neon-red uppercase tracking-widest">FIN</span>
                                            <input type="text" value={item.endTime} onChange={e => updateItem(item.id, { endTime: e.target.value })} className="w-20 bg-black/70 border border-white/10 rounded-2xl py-3 text-[14px] font-black text-white text-center outline-none backdrop-blur-xl hover:border-red-500 transition-colors" />
                                            {getPreviewTime(item.endTime) && <span className="text-[8px] font-black text-red-400 italic">FR {getPreviewTime(item.endTime)}</span>}
                                        </div>
                                    </div>
                                    <button onClick={() => removeLineupItem(item.id)} className="p-5 bg-red-500/10 text-red-500 hover:bg-neon-red hover:text-white rounded-[2rem] transition-all shadow-lg hover:shadow-neon-red/30"><Trash2 className="w-6 h-6" /></button>
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
