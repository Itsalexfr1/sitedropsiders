import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    X, Settings, Zap, Edit3, ChevronLeft, Save, Timer, 
    AlertCircle, Trash2, Plus, Music, Camera, Scan, Globe,
    ChevronRight, Calendar, RefreshCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTakeover } from '../../context/TakeoverContext';
import type { StreamItem, LineupItem } from '../../context/TakeoverContext';
import { resolveImageUrl } from '../../utils/image';
import { PlanningTab } from './PlanningTab';
import { ID, Query } from 'appwrite';
import { uploadFile } from '../../utils/uploadService';

export function AdminPanel() {
    const { 
        settings, setSettings, showAdminPanel, setShowAdminPanel, 
        handleGlobalSave, isMod, isAdmin, activeStage, setActiveStage,
        databases, DATABASE_ID, COLLECTION_CHAT, showNotification,
        triggerConfetti
    } = useTakeover();
    const navigate = useNavigate();
    
    const [adminActiveTab, setAdminActiveTab] = useState<'config' | 'planning' | 'tracklist' | 'interactif' | 'bot_drops'>('config');
    const [isSaving, setIsSaving] = useState(false);

    // Edit Buffers (Local to AdminPanel for performance)
    const [editTitle, setEditTitle] = useState(settings.title);
    const [editStreams, setEditStreams] = useState<StreamItem[]>(settings.streams || []);
    const [editActiveStreamId, setEditActiveStreamId] = useState(settings.activeStreamId || '');
    const [editAnnText, setEditAnnText] = useState(settings.tickerText);
    const [editAnnEnabled, setEditAnnEnabled] = useState(settings.showTickerBanner);
    const [editStatus, setEditStatus] = useState(settings.status);
    const [editStartDate, setEditStartDate] = useState(settings.startDate || '');
    const [editEndDate, setEditEndDate] = useState(settings.endDate || '');
    const [editTickerBg, setEditTickerBg] = useState(settings.tickerBgColor);
    const [editTickerTextC, setEditTickerTextC] = useState(settings.tickerTextColor);
    const [editInsta, setEditInsta] = useState(settings.instagramLink || '');
    const [editTiktok, setEditTiktok] = useState(settings.tiktokLink || '');
    const [editYoutube, setEditYoutube] = useState(settings.youtubeLink || '');
    const [editTwitter, setEditTwitter] = useState(settings.twitterLink || '');
    const [editFestivalLogo, setEditFestivalLogo] = useState(settings.festivalLogo || '');
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [editSponsorText, setEditSponsorText] = useState(settings.sponsorText || '');
    const [editSponsorLink, setEditSponsorLink] = useState(settings.sponsorLink || '');
    const [editShowSponsorBanner, setEditShowSponsorBanner] = useState(settings.showSponsorBanner !== undefined ? settings.showSponsorBanner : true);

    // Tracklist States
    const [newSetArtist, setNewSetArtist] = useState('');
    const [newSetTime, setNewSetTime] = useState('');
    const [tracklist, setTracklist] = useState<any[]>(() => {
        try { return JSON.parse(settings.tracklist || '[]'); } catch (e) { return []; }
    });

    // Interactif States
    const [pollInput, setPollInput] = useState('');
    const [quizInput, setQuizInput] = useState('');
    const [flashInput, setFlashInput] = useState('');
    const [takeoverInput, setTakeoverInput] = useState('');

    const [editLineup, setEditLineup] = useState<LineupItem[]>(() => {
        try { return JSON.parse(settings.lineup || '[]'); } catch (e) { return []; }
    });

    const onSave = async () => {
        // VALIDATION: Check for missing images in lineup
        const missing = editLineup.filter(item => !item.image);
        if (missing.length > 0) {
            showNotification(`SAUVEGARDE IMPOSSIBLE : ${missing.length} artistes n'ont pas de photo !`, 'error');
            setAdminActiveTab('planning'); // Switch to planning to show where the issue is
            return;
        }

        setIsSaving(true);
        const updated = {
            ...settings,
            title: editTitle,
            streams: editStreams,
            activeStreamId: editActiveStreamId,
            tickerText: editAnnText,
            showTickerBanner: editAnnEnabled,
            status: editStatus,
            startDate: editStartDate,
            endDate: editEndDate,
            tickerBgColor: editTickerBg,
            tickerTextColor: editTickerTextC,
            instagramLink: editInsta,
            tiktokLink: editTiktok,
            youtubeLink: editYoutube,
            twitterLink: editTwitter,
            sponsorText: editSponsorText,
            sponsorLink: editSponsorLink,
            showSponsorBanner: editShowSponsorBanner,
            festivalLogo: editFestivalLogo,
            lineup: JSON.stringify(editLineup)
        };
        setSettings(updated);
        await handleGlobalSave(updated);
        setIsSaving(false);
    };

    if (!showAdminPanel) return null;

    return (
        <motion.div
            key="admin-panel"
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl p-8 overflow-y-auto custom-scrollbar"
        >
            <div className="max-w-4xl mx-auto space-y-10">
                {/* Header */}
                {/* Header Row 1: Title & Close */}
                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={() => navigate('/admin')}
                            className="w-fit flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-[8px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all group"
                        >
                            <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                            Dashboard
                        </button>
                        <h2 className="text-2xl md:text-3xl font-display font-black text-white uppercase italic tracking-tighter">Configuration du <span className="text-neon-purple">Studio</span></h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onSave} 
                            disabled={isSaving} 
                            className={`h-11 px-8 ${isSaving ? 'bg-white/10 text-gray-400' : 'bg-white text-black hover:bg-neon-cyan shadow-xl shadow-white/5'} rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 hover:scale-105 active:scale-95`}
                        >
                            {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? '...' : 'SAUVEGARDER'}
                        </button>
                        <button onClick={() => setShowAdminPanel(false)} className="p-3 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 border border-white/10 rounded-2xl transition-all" title="Fermer le panel"><X className="w-6 h-6" /></button>
                    </div>
                </div>

                {/* Header Row 2: Tabs (Full Width) */}
                <div className="flex gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'config', label: '🛠️ CONFIG' },
                        { id: 'planning', label: '📅 PLANNING' },
                        { id: 'tracklist', label: '🎵 TRACKLIST' },
                        { id: 'interactif', label: '🎮 INTERACTIF' },
                        { id: 'bot_drops', label: '🤖 BOT & DROPS' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setAdminActiveTab(tab.id as any)}
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${adminActiveTab === tab.id ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30 shadow-[0_0_20px_rgba(191,0,255,0.15)]' : 'text-gray-500 hover:text-white'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="min-h-[400px]">
                    {adminActiveTab === 'config' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             {/* Multi-Stage management (MOVED TO TOP) */}
                             <div className="bg-white/5 border border-neon-blue/20 rounded-3xl p-8 space-y-8 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Globe className="w-24 h-24 text-neon-blue" />
                                </div>
                                <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-neon-blue/20 rounded-xl flex items-center justify-center">
                                            <Globe className="w-5 h-5 text-neon-blue" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic leading-tight">Gestion des Flux</h3>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase">MULTI-STAGE SETUP</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const newStream: StreamItem = { id: Math.random().toString(36).substr(2, 9), name: `STAGE ${editStreams.length + 1}`, youtubeId: '' };
                                            setEditStreams([...editStreams, newStream]);
                                            if (!editActiveStreamId) setEditActiveStreamId(newStream.id);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-neon-blue/30 transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Ajouter un flux
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-4 relative z-10">
                                    {editStreams.map((stream, idx) => (
                                        <div key={stream.id} className={`group bg-black/40 border p-6 rounded-2xl transition-all ${editActiveStreamId === stream.id ? 'border-neon-blue shadow-[0_0_20px_rgba(0,255,255,0.1)]' : 'border-white/5 hover:border-white/20'}`}>
                                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-gray-500 uppercase ml-1">Nom de la scène</label>
                                                        <input 
                                                            type="text" 
                                                            value={stream.name} 
                                                            onChange={e => {
                                                                const ns = [...editStreams];
                                                                ns[idx].name = e.target.value.toUpperCase();
                                                                setEditStreams(ns);
                                                            }}
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-black uppercase outline-none focus:border-neon-blue"
                                                            placeholder="EX: MAIN STAGE"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-gray-500 uppercase ml-1">ID YouTube / URL Live</label>
                                                        <input 
                                                            type="text" 
                                                            value={stream.youtubeId} 
                                                            onChange={e => {
                                                                const ns = [...editStreams];
                                                                ns[idx].youtubeId = e.target.value;
                                                                setEditStreams(ns);
                                                            }}
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-neon-blue"
                                                            placeholder="ID YouTube (11 chars) ou URL"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 pt-4 md:pt-0">
                                                    <button 
                                                        onClick={() => {
                                                            const ns = [...editStreams];
                                                            ns[idx].isExternalLink = !ns[idx].isExternalLink;
                                                            setEditStreams(ns);
                                                        }}
                                                        className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${stream.isExternalLink ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                                    >
                                                        Mode Externe
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setEditActiveStreamId(stream.id);
                                                        }}
                                                        className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${editActiveStreamId === stream.id ? 'bg-neon-blue text-black border-neon-blue' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                                                    >
                                                        Actif
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            const ns = editStreams.filter(s => s.id !== stream.id);
                                                            setEditStreams(ns);
                                                            if (editActiveStreamId === stream.id) {
                                                                setEditActiveStreamId(ns[0]?.id || '');
                                                            }
                                                        }}
                                                        className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 transition-all hover:text-white"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {editStreams.length === 0 && (
                                        <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-3xl">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Aucun flux configuré</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                             {/* Override Artist */}
                             <div className="bg-white/5 border border-neon-cyan/20 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Zap className="w-20 h-20 text-neon-cyan" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-neon-cyan/20 rounded-2xl flex items-center justify-center">
                                        <Edit3 className="w-6 h-6 text-neon-cyan" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">Artiste en Direct <span className="text-neon-cyan">(Override)</span></h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Changez l'artiste instantanément sans passer par le planning</p>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nom de l'artiste</label>
                                        <input 
                                            type="text" 
                                            value={editStreams.find(s => s.id === editActiveStreamId)?.overrideArtist || ''} 
                                            onChange={e => {
                                                const ns = [...editStreams];
                                                const idx = ns.findIndex(s => s.id === editActiveStreamId);
                                                if (idx !== -1) {
                                                    ns[idx].overrideArtist = e.target.value.toUpperCase();
                                                    setEditStreams(ns);
                                                }
                                            }}
                                            placeholder="EX: TIESTO, CHARLOTTE DE WITTE..." 
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-neon-cyan uppercase outline-none focus:border-neon-cyan transition-all" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Main Config Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-8">
                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic border-b border-white/5 pb-4">Identité du Live</h3>
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="block text-[10px] font-black text-gray-500 uppercase">Titre Global</label>
                                                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Logo du Festival (UPLOAD)</label>
                                                <div className="flex items-center gap-4 p-4 bg-black/40 border border-white/10 rounded-2xl group transition-all hover:border-neon-cyan/50">
                                                    <div className="w-16 h-16 rounded-xl bg-black border border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                                                        {editFestivalLogo ? (
                                                            <img src={resolveImageUrl(editFestivalLogo)} className="w-full h-full object-contain" alt="Logo preview" />
                                                        ) : (
                                                            <Camera className="w-6 h-6 text-gray-700" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex gap-2">
                                                            <button 
                                                                disabled={isUploadingLogo}
                                                                onClick={() => document.getElementById('logo-upload')?.click()}
                                                                className="flex items-center gap-2 px-4 py-2 bg-neon-cyan text-black text-[10px] font-black uppercase rounded-lg hover:bg-white transition-all disabled:opacity-50"
                                                            >
                                                                {isUploadingLogo ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                                                                {isUploadingLogo ? 'Upload...' : 'Uploader Image'}
                                                            </button>
                                                            {editFestivalLogo && (
                                                                <button 
                                                                    onClick={() => setEditFestivalLogo('')}
                                                                    className="px-4 py-2 bg-red-500/10 text-red-500 text-[10px] font-black uppercase rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                                                >
                                                                    Supprimer
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-[8px] text-gray-600 font-bold uppercase">JPG, PNG OU SVG (MAX 2MO)</p>
                                                        <input 
                                                            id="logo-upload"
                                                            type="file" 
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                setIsUploadingLogo(true);
                                                                try {
                                                                    const url = await uploadFile(file, 'festivals');
                                                                    setEditFestivalLogo(url);
                                                                    showNotification('Logo mis à jour !', 'success');
                                                                } catch (err: any) {
                                                                    showNotification(err.message, 'error');
                                                                } finally {
                                                                    setIsUploadingLogo(false);
                                                                    e.target.value = '';
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic border-b border-white/5 pb-4">Réseaux Sociaux</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-gray-500 uppercase">Instagram</label>
                                                <input type="text" value={editInsta} onChange={e => setEditInsta(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white" placeholder="dropsiders.fr" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-gray-500 uppercase">TikTok</label>
                                                <input type="text" value={editTiktok} onChange={e => setEditTiktok(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white" placeholder="dropsiders" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-gray-500 uppercase">YouTube</label>
                                                <input type="text" value={editYoutube} onChange={e => setEditYoutube(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white" placeholder="channel/..." />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-gray-500 uppercase">Twitter / X</label>
                                                <input type="text" value={editTwitter} onChange={e => setEditTwitter(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white" placeholder="dropsiders" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic border-b border-white/5 pb-4">Bandeau Défilant (Ticker)</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-gray-500 uppercase">Activer le bandeau</label>
                                                <button onClick={() => setEditAnnEnabled(!editAnnEnabled)} className={`w-12 h-6 rounded-full transition-all relative ${editAnnEnabled ? 'bg-neon-cyan' : 'bg-white/10'}`}>
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editAnnEnabled ? 'left-7' : 'left-1'}`} />
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-gray-500 uppercase">Texte</label>
                                                <input type="text" value={editAnnText} onChange={e => setEditAnnText(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-gray-500 uppercase">Couleur Fond</label>
                                                    <input type="color" value={editTickerBg} onChange={e => setEditTickerBg(e.target.value)} className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-2 py-1" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-gray-500 uppercase">Couleur Texte</label>
                                                    <input type="color" value={editTickerTextC} onChange={e => setEditTickerTextC(e.target.value)} className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-2 py-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic border-b border-white/5 pb-4">Sponsor & Partenaires</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-gray-500 uppercase">Afficher le Sponsor</label>
                                                <button onClick={() => setEditShowSponsorBanner(!editShowSponsorBanner)} className={`w-12 h-6 rounded-full transition-all relative ${editShowSponsorBanner ? 'bg-neon-cyan' : 'bg-white/10'}`}>
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editShowSponsorBanner ? 'left-7' : 'left-1'}`} />
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-gray-500 uppercase">Texte Sponsor</label>
                                                <input type="text" value={editSponsorText} onChange={e => setEditSponsorText(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white" placeholder="POWERED BY..." />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-gray-500 uppercase">Lien Sponsor</label>
                                                <input type="text" value={editSponsorLink} onChange={e => setEditSponsorLink(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white" placeholder="https://..." />
                                            </div>
                                        </div>
                                    </div>

                                     <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic border-b border-white/5 pb-4">Status & Programmation</h3>
                                        <div className="flex gap-2 p-1 bg-black/40 rounded-xl">
                                            {(['live', 'edit', 'off'] as const).map(s => (
                                                <button key={s} onClick={() => setEditStatus(s)} className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${editStatus === s ? 'bg-red-600 text-white' : 'text-gray-400'}`}>{s}</button>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-gray-500 uppercase">Début</label>
                                                <input type="datetime-local" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white" style={{ colorScheme: 'dark' }} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-gray-500 uppercase">Fin</label>
                                                <input type="datetime-local" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white" style={{ colorScheme: 'dark' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <p className="text-[9px] text-gray-500 font-bold uppercase text-center tracking-widest">Utilisez le bouton Sauvegarder en haut du panel pour appliquer les changements</p>
                            </div>
                        </div>
                    )}



                    {adminActiveTab === 'planning' && <PlanningTab editLineup={editLineup} setEditLineup={setEditLineup} />}

                    {/* Bot & Drops Tab */}
                    {adminActiveTab === 'bot_drops' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest italic border-b border-white/5 pb-4">Économie des Drops</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-500 uppercase">Montant Drop par minute</label>
                                            <input type="number" value={settings.dropsAmount || 10} onChange={e => setSettings({...settings, dropsAmount: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-500 uppercase">Intervalle (secondes)</label>
                                            <input type="number" value={settings.dropsInterval || 60} onChange={e => setSettings({...settings, dropsInterval: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-500 uppercase">Prix Highlight Message</label>
                                            <input type="number" value={settings.highlightPrice || 100} onChange={e => setSettings({...settings, highlightPrice: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                        </div>
                                    </div>
                                </div>
                                 <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest italic border-b border-white/5 pb-4">Gestion de l'Équipe & Blacklist</h3>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase">Modérateurs (Séparez par Virgule)</label>
                                            <textarea 
                                                value={(settings.moderators || []).join(', ')} 
                                                onChange={e => setSettings({...settings, moderators: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(s => s)})}
                                                className="w-full h-20 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-neon-blue font-black uppercase"
                                                placeholder="ALEX, MOD_1, MOD_2..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase">Utilisateurs Bannis (Blacklist)</label>
                                            <textarea 
                                                value={(settings.bannedPseudos || []).join(', ')} 
                                                onChange={e => setSettings({...settings, bannedPseudos: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(s => s)})}
                                                className="w-full h-20 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-red-500 font-black uppercase"
                                                placeholder="PSEUDO_PAS_COOL, TROLL_99..."
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest italic border-b border-white/5 pb-4">Filtrage du Chat</h3>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-500 uppercase">Mots Bannis (séparés par virgule)</label>
                                        <textarea 
                                            value={settings.bannedWords || ''} 
                                            onChange={e => setSettings({...settings, bannedWords: e.target.value})}
                                            className="w-full h-32 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white resize-none"
                                            placeholder="pd, fdp, salope..."
                                        />
                                    </div>
                                </div>
                             </div>
                             
                             <button onClick={onSave} disabled={isSaving} className="w-full py-6 bg-neon-cyan text-black font-black uppercase rounded-3xl transition-all shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95">
                                {isSaving ? <Timer className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                                ENREGISTRER L'ÉCONOMIE
                             </button>
                        </div>
                    )}

                    {/* Tracklist Tab */}
                    {adminActiveTab === 'tracklist' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest italic border-b border-white/5 pb-4">Nouveau Set (Artiste en Direct)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-500 uppercase">Nom de l'artiste</label>
                                        <input type="text" value={newSetArtist} onChange={e => setNewSetArtist(e.target.value.toUpperCase())} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" placeholder="EX: TIESTO" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-500 uppercase">Heure de début</label>
                                        <input type="text" value={newSetTime} onChange={e => setNewSetTime(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" placeholder="22:30" />
                                    </div>
                                </div>
                                <button 
                                    onClick={async () => {
                                        if(!newSetArtist) return;
                                        const nextSet = { id: Date.now().toString(), artist: newSetArtist, startTime: newSetTime || 'LIVE', tracks: [], stage: activeStage };
                                        const newList = [nextSet, ...tracklist];
                                        setTracklist(newList);
                                        setSettings({...settings, tracklist: JSON.stringify(newList)});
                                        handleGlobalSave();
                                        
                                        await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                                            pseudo: "BOT_SYSTEM",
                                            message: `[SYSTEM]:TRACKLIST_SET_NEW:${JSON.stringify(nextSet)}`,
                                            color: "text-neon-cyan",
                                            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                                            country: "FR"
                                        });
                                        setNewSetArtist('');
                                        setNewSetTime('');
                                        showNotification('Set activé et diffusé !', 'success');
                                    }}
                                    className="w-full py-4 bg-neon-purple text-white font-black uppercase rounded-2xl hover:scale-105 transition-all"
                                >
                                    LANCER LE SET SUR LE CHAT
                                </button>
                             </div>

                             <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest italic border-b border-white/5 pb-4">Historique des Sets</h3>
                                <div className="space-y-2">
                                    {tracklist.map((s, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                                            <div>
                                                <p className="text-xs font-black text-white uppercase">{s.artist}</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-bold">{s.startTime} - {s.stage}</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const nl = tracklist.filter((_, i) => i !== idx);
                                                    setTracklist(nl);
                                                    setSettings({...settings, tracklist: JSON.stringify(nl)});
                                                    handleGlobalSave();
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                    )}

                    {/* Interactif Tab */}
                    {adminActiveTab === 'interactif' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'CONFETTI', cmd: '[SYSTEM]:CONFETTI', color: 'bg-pink-500' },
                                    { label: 'MATRIX', cmd: '[SYSTEM]:MATRIX', color: 'bg-green-500' },
                                    { label: 'FIREWORKS', cmd: '[SYSTEM]:FIREWORKS', color: 'bg-amber-500' },
                                    { label: 'NETTOYER CHAT', cmd: 'CLEAR', color: 'bg-red-600', special: true },
                                ].map(eff => (
                                    <button 
                                        key={eff.label}
                                        onClick={async () => {
                                            if (eff.special && eff.label === 'NETTOYER CHAT') {
                                                const res = await databases.listDocuments(DATABASE_ID, COLLECTION_CHAT, [Query.limit(100)]);
                                                for (const doc of res.documents) await databases.deleteDocument(DATABASE_ID, COLLECTION_CHAT, doc.$id);
                                                showNotification('Chat vidé !', 'info');
                                                return;
                                            }
                                            await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                                                pseudo: "BOT_SYSTEM",
                                                message: eff.cmd,
                                                color: "text-neon-cyan",
                                                time: "SYSTEM",
                                                country: "FR"
                                            });
                                            if (eff.label === 'CONFETTI') triggerConfetti();
                                        }}
                                        className={`py-4 rounded-2xl ${eff.color} text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-white/5`}
                                    >
                                        {eff.label}
                                    </button>
                                ))}
                             </div>

                             <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest italic border-b border-white/5 pb-4">Actions Globales</h3>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase">Alerte Takeover (Message Flash Overlay)</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={takeoverInput} onChange={e => setTakeoverInput(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" placeholder="FLASH: BIENVENUE SUR LE LIVE !" />
                                            <button 
                                                onClick={async () => {
                                                    if(!takeoverInput) return;
                                                    await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                                                        pseudo: "BOT_SYSTEM",
                                                        message: `[SYSTEM]:TAKEOVER_ALERT:${takeoverInput}`,
                                                        color: "text-neon-cyan",
                                                        time: "SYSTEM",
                                                        country: "FR"
                                                    });
                                                    setTakeoverInput('');
                                                }}
                                                className="px-6 bg-neon-cyan text-black font-black uppercase text-[10px] rounded-xl"
                                            >DIFFUSER</button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase">Question Sondage (Poll)</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={pollInput} onChange={e => setPollInput(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" placeholder="Kiffes-tu le set ? | OUI | MOYEN | NON" />
                                            <button 
                                                onClick={async () => {
                                                    if(!pollInput) return;
                                                    const [question, ...options] = pollInput.split('|').map(s => s.trim());
                                                    const pollData = { question, options: options.map(o => ({ text: o, votes: 0 })), active: true };
                                                    await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                                                        pseudo: "BOT_SYSTEM",
                                                        message: `[SYSTEM]:POLL:${JSON.stringify(pollData)}`,
                                                        color: "text-neon-cyan",
                                                        time: "SYSTEM",
                                                        country: "FR"
                                                    });
                                                    setPollInput('');
                                                }}
                                                className="px-6 bg-neon-purple text-white font-black uppercase text-[10px] rounded-xl"
                                            >LANCER</button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase">Question Quiz (QCM)</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={quizInput} onChange={e => setQuizInput(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" placeholder="Question | Opt1 | Opt2 | Opt3 | Opt4 | IndexCorrect" />
                                            <button 
                                                onClick={async () => {
                                                    if(!quizInput) return;
                                                    await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                                                        pseudo: "BOT_SYSTEM",
                                                        message: `[QUIZ_START]:${quizInput}`,
                                                        color: "text-neon-cyan",
                                                        time: "SYSTEM",
                                                        country: "FR"
                                                    });
                                                    setQuizInput('');
                                                }}
                                                className="px-6 bg-pink-600 text-white font-black uppercase text-[10px] rounded-xl"
                                            >LANCER</button>
                                        </div>
                                    </div>
                                </div>
                             </div>

                             {/* Bot Commands Quick Edit */}
                             <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest italic flex items-center gap-3">
                                        <Music className="w-4 h-4 text-neon-blue" />
                                        Commandes Bot Personnalisées
                                    </h3>
                                    <button 
                                        onClick={() => {
                                            const updated = { ...settings, botCommands: [...(settings.botCommands || []), { command: '!', response: '' }] };
                                            setSettings(updated);
                                        }}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:text-white transition-all border border-white/5"
                                    >
                                        + Nouvelle Commande
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {(settings.botCommands || []).map((cmd, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 bg-black/40 rounded-2xl border border-white/5 group">
                                            <div className="w-1/4">
                                                <input 
                                                    type="text" 
                                                    value={cmd.command} 
                                                    onChange={e => {
                                                        const nc = [...(settings.botCommands || [])];
                                                        nc[idx].command = e.target.value.toLowerCase();
                                                        setSettings({...settings, botCommands: nc});
                                                    }}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] text-neon-blue font-black" 
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <input 
                                                    type="text" 
                                                    value={cmd.response} 
                                                    onChange={e => {
                                                        const nc = [...(settings.botCommands || [])];
                                                        nc[idx].response = e.target.value;
                                                        setSettings({...settings, botCommands: nc});
                                                    }}
                                                    placeholder="Réponse du bot..."
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] text-white" 
                                                />
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const nc = (settings.botCommands || []).filter((_, i) => i !== idx);
                                                    setSettings({...settings, botCommands: nc});
                                                }}
                                                className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {(settings.botCommands || []).length === 0 && (
                                        <p className="text-center py-4 text-[9px] text-gray-600 font-bold uppercase tracking-widest">Aucune commande personnalisée</p>
                                    )}
                                </div>
                             </div>
                        </div>
                    )}

                    {/* Placeholder for other tabs (Remaining) */}
                    {!['config', 'planning', 'bot_drops', 'tracklist', 'interactif'].includes(adminActiveTab) && (
                        <div className="p-12 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center">
                                <Zap className="w-8 h-8 text-gray-600" />
                            </div>
                            <h3 className="text-xl font-display font-black text-white uppercase italic">Onglet {adminActiveTab.toUpperCase()}</h3>
                            <p className="text-sm text-gray-500 max-w-xs uppercase font-bold leading-relaxed tracking-widest">Le contenu de cet onglet est en cours de migration...</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function Shield({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    )
}
