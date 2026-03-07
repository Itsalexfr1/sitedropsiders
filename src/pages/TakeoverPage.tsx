
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, MessageSquare, Headphones, ShoppingBag, Trophy, Video,
    Zap, Shield, Clock, Plus, Hash, Mic, MicOff, Volume2, LogOut,
    Minimize, Maximize, Send, Smile, Bell, ArrowLeft, ArrowRight,
    ChevronRight, ChevronLeft, MoreHorizontal, Trash2, Pin, X,
    LayoutGrid, List, Power
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Simple mockup components to maintain structure without needing 6000 lines of logic
const GlitchTransition = ({ trigger }: { trigger: any }) => null;

export default function TakeoverPage() {
    const navigate = useNavigate();

    // --- State Mockups ---
    const [showUsersPanel, setShowUsersPanel] = useState(false);
    const [activeChatTab, setActiveChatTab] = useState('chat');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [showTopBanner, setShowTopBanner] = useState(true);
    const [isOverdrive, setIsOverdrive] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showLineup, setShowLineup] = useState(false);

    // Settings & Data Mockups
    const settings = { isOnline: true, enabled: true };
    const annBannerEnabled = true;
    const annBannerText = "BIENVENUE SUR DROPSIDERS V2 - LA PLATEFORME INTERACTIVE CONSACRÉE AUX FESTIVALS";
    const annBannerBg = "#ff0000";
    const annBannerColor = "#ffffff";
    const fluxCurrentArtist = { artist: "DEBORAH DE LUCA" };
    const viewersCount = 1245;
    const allActiveUsers = Array(12).fill({ pseudo: "User", country: "FR" });
    const isJoined = true;
    const isServerAdmin = true;
    const hasModPowers = true;
    const displayTitle = "LIVE TAKEOVER";
    const playersOption = 1;
    const getVisiblePlayers = () => [{ id: 'dQw4w9WgXcQ', title: 'Live' }];
    const videoPlayerRef = useRef(null);

    return (
        <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden font-sans selection:bg-neon-red selection:text-white">

            {/* 1. TOP TICKER BANNER (Fixed Height: 48px) */}
            {annBannerEnabled && (
                <div className="h-12 w-full bg-neon-red flex items-center overflow-hidden border-b border-white/10 z-[100] shrink-0">
                    <div className="flex whitespace-nowrap animate-ticker items-center">
                        {Array(5).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center mx-12">
                                <span className="text-[12px] font-black uppercase italic tracking-[0.3em] text-white">
                                    {annBannerText}
                                </span>
                                <div className="w-2 h-2 rounded-full bg-white/30 ml-12" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. LIVE INFO BAR (Fixed Height: 48px) */}
            <div className="h-12 w-full bg-[#080808] border-b border-white/10 px-6 flex items-center justify-between z-[90] shrink-0 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full shadow-[0_0_15px_rgba(255,0,0,0.4)]">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">LIVE</span>
                    </div>
                    <h1 className="text-xl font-display font-black italic tracking-tighter uppercase">{displayTitle}</h1>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full cursor-pointer hover:bg-white/10 transition-all"
                        onClick={() => setShowUsersPanel(!showUsersPanel)}>
                        <Users className="w-4 h-4 text-neon-red" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{viewersCount} SPECTATEURS</span>
                    </div>
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-full transition-all">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* 3. MAIN CONTENT AREA (The Flex Row for Video | Chat | Viewers) */}
            <div className="flex-1 flex flex-row overflow-hidden relative">

                {/* A. VIDEO PANEL (60%) */}
                <div className="w-[60%] h-full bg-black border-r border-white/10 relative flex flex-col shrink-0">
                    <div className="flex-1 relative group">
                        <iframe
                            className="w-full h-full border-none"
                            src={`https://www.youtube.com/embed/${getVisiblePlayers()[0].id}?autoplay=1&mute=0&rel=0&modestbranding=1`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>

                    {/* Floating Controls Over Video */}
                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                        <div className="px-3 py-1 bg-blue-600/40 backdrop-blur-md border border-blue-500/30 rounded-md">
                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">EN DIRECT:</span>
                            <span className="text-[10px] font-black text-white ml-2">{fluxCurrentArtist.artist}</span>
                        </div>
                    </div>
                </div>

                {/* B. CHAT PANEL (30% if panel open, 40% if closed) */}
                <div className="flex-1 h-full bg-[#0d0d0d] flex flex-col relative z-10 border-r border-white/10 shadow-2xl">
                    {/* Chat Tabs Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neon-red/10 border border-neon-red/20 flex items-center justify-center">
                                <MessageSquare className="w-4 h-4 text-neon-red" />
                            </div>
                            <h2 className="text-xs font-black uppercase italic tracking-tighter">CHAT EN DIRECT</h2>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all text-gray-500 hover:text-white">
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Chat Navigation Tabs */}
                    <div className="flex gap-1 p-2 bg-black/20 border-b border-white/10 overflow-x-auto no-scrollbar">
                        {['CHAT', 'SHAZAM', 'AUDIO', 'SHOP', 'TOP', 'CLIPS'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveChatTab(tab.toLowerCase())}
                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeChatTab === tab.toLowerCase() ? 'bg-white/10 text-white border border-white/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Chat Body (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        <div className="p-3 bg-neon-red/10 border border-neon-red/20 rounded-xl">
                            <p className="text-[10px] text-neon-red font-black uppercase mb-1">Épinglé</p>
                            <p className="text-xs text-white">Bienvenue sur le live ! Profitez du son et participez au chat !</p>
                        </div>

                        {/* Mock Messages */}
                        {Array(10).fill(0).map((_, i) => (
                            <div key={i} className="flex gap-3 animate-slide-in">
                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black text-neon-cyan uppercase tracking-wider mb-0.5">User_{i}</p>
                                    <p className="text-sm text-gray-300">C'est incroyable ce DJ Set ! 🔥🔥🔥</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 bg-[#080808] border-t border-white/10">
                        <div className="flex items-center gap-2 p-1 bg-black/40 border border-white/10 rounded-xl lg:rounded-2xl focus-within:border-neon-red/30 transition-all">
                            <button className="p-2 text-gray-500 hover:text-white"><Smile className="w-5 h-5" /></button>
                            <input
                                className="flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-gray-700"
                                placeholder="Écrire un message..."
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                            />
                            <button className="p-2 bg-neon-red text-white rounded-lg shadow-lg shadow-neon-red/20">
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* C. VIEWER PANEL (10%) */}
                <AnimatePresence>
                    {showUsersPanel && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: '10%', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="h-full bg-[#0a0a0a] border-l border-white/10 flex flex-col shrink-0 overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/10 shrink-0 flex justify-between items-center bg-white/[0.02]">
                                <h2 className="text-[10px] font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5 text-neon-red" /> VIEWERS
                                </h2>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {allActiveUsers.map((u, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors border border-white/[0.02]">
                                        <span className="text-[10px]">🇫🇷</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase truncate">User_{i}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Vertical Expand Tab for Viewers */}
                <button
                    onClick={() => setShowUsersPanel(!showUsersPanel)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-16 bg-white/5 hover:bg-white/10 border border-white/10 rounded-l-md flex items-center justify-center z-[100] transition-all"
                >
                    {showUsersPanel ? <ChevronRight className="w-3 h-3 text-gray-500" /> : <ChevronLeft className="w-3 h-3 text-gray-500" />}
                </button>
            </div>

            {/* 4. MOBILE NAVBAR (Hidden on desktop by default in this layout) */}
            <div className="lg:hidden h-16 bg-black border-t border-white/10 flex items-center justify-around shrink-0">
                {/* Mobile menu items here */}
            </div>

            <style>{`
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-20%); }
                }
                .animate-ticker {
                    animation: ticker 30s linear infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 17, 17, 0.5);
                }
                @font-face {
                    font-family: 'DisplayFont';
                    src: url('/fonts/Stardust.woff2') format('woff2');
                }
                .font-display {
                    font-family: 'DisplayFont', 'Inter', sans-serif;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .animate-slide-in {
                    animation: slideIn 0.3s ease-out forwards;
                }
                @keyframes slideIn {
                    from { transform: translateX(10px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>
        </div>
    );
}
