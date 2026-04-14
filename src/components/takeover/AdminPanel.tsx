import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    X, Settings, Zap, Edit3, ChevronLeft, Save, Timer, 
    AlertCircle, Trash2, Plus, Music, Camera, Scan, Globe,
    ChevronRight, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTakeover } from '../../context/TakeoverContext';
import type { StreamItem, LineupItem } from '../../context/TakeoverContext';
import { resolveImageUrl } from '../../utils/image';
import { PlanningTab } from './PlanningTab';

export function AdminPanel() {
    const { 
        settings, setSettings, showAdminPanel, setShowAdminPanel, 
        handleGlobalSave, isMod, isAdmin, activeStage, setActiveStage
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
    const [editSponsorText, setEditSponsorText] = useState(settings.sponsorText || '');
    const [editSponsorLink, setEditSponsorLink] = useState(settings.sponsorLink || '');
    const [editShowSponsorBanner, setEditShowSponsorBanner] = useState(settings.showSponsorBanner !== undefined ? settings.showSponsorBanner : true);

    const onSave = async () => {
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
        };
        setSettings(updated);
        // The handleGlobalSave in context expects settings to be updated
        // or we could pass updated to it.
        // For now, let's assume it works with the context state.
        setTimeout(async () => {
            await handleGlobalSave();
            setIsSaving(false);
        }, 100);
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
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-6 gap-6">
                    <div className="flex flex-col gap-4">
                        <button 
                            onClick={() => navigate('/admin')}
                            className="w-fit flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all group"
                        >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Tableau Admin
                        </button>
                        <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">Configuration du <span className="text-neon-purple">Studio</span></h2>
                    </div>
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
                                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${adminActiveTab === tab.id ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30 shadow-[0_0_20px_rgba(191,0,255,0.15)]' : 'text-gray-500 hover:text-white'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setShowAdminPanel(false)} className="p-3 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 border border-white/10 rounded-2xl transition-all" title="Fermer le panel"><X className="w-6 h-6" /></button>
                </div>

                <div className="min-h-[400px]">
                    {adminActiveTab === 'config' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                            <label className="block text-[10px] font-black text-gray-500 uppercase">Titre Global</label>
                                            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic border-b border-white/5 pb-4">Socials</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="text" value={editInsta} onChange={e => setEditInsta(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white" placeholder="Instagram" />
                                            <input type="text" value={editTiktok} onChange={e => setEditTiktok(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white" placeholder="TikTok" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
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

                            <button onClick={onSave} disabled={isSaving} className="w-full py-6 bg-neon-cyan text-black font-black uppercase rounded-3xl transition-all shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95">
                                {isSaving ? <Timer className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                                {isSaving ? 'ENREGISTREMENT...' : 'SAUVEGARDER LES MODIFICATIONS'}
                            </button>
                        </div>
                    )}

                    {adminActiveTab === 'planning' && <PlanningTab />}

                    {/* Placeholder for other tabs */}
                    {!['config', 'planning'].includes(adminActiveTab) && (
                        <div className="p-12 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center">
                                <Shield className="w-8 h-8 text-gray-600" />
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
