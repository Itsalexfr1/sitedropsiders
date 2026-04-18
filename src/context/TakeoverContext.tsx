import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Client, Databases, ID, Query } from 'appwrite';
import { useUser } from './UserContext';
const showNotification = (msg: string, type: 'success' | 'error' | 'info') => console.log(`[${type.toUpperCase()}] ${msg}`);

// --- Interfaces ---
export interface LineupItem {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    artist: string;
    stage: string;
    instagram: string;
    instagram2?: string;
    instagram3?: string;
    image?: string;
    wikiId?: string;
    wikiType?: 'DJS' | 'CLUBS' | 'FESTIVALS';
}

export interface StreamItem {
    id: string;
    name: string;
    youtubeId: string;
    currentTrack?: string;
    overrideArtist?: string;
    isExternalLink?: boolean;
    enabledInGrid?: boolean;
}

export interface TakeoverSettings {
    title: string;
    youtubeId: string;
    mainFluxName: string;
    currentTrack: string;
    tickerText: string;
    showTickerBanner: boolean;
    tickerBgColor: string;
    tickerTextColor: string;
    lineup: string;
    status: 'live' | 'edit' | 'off';
    startDate?: string;
    endDate?: string;
    enabled: boolean;
    streams?: StreamItem[];
    activeStreamId?: string;
    acrHost?: string;
    acrAccessKey?: string;
    acrAccessSecret?: string;
    auddToken?: string;
    highlightPrice?: number;
    lots?: any[];
    dropsAmount?: number;
    dropsInterval?: number;
    sponsorText?: string;
    sponsorLink?: string;
    showSponsorBanner?: boolean;
    instagramLink?: string;
    tiktokLink?: string;
    youtubeLink?: string;
    twitterLink?: string;
    botCommands?: { command: string, response: string }[];
    tracklist?: string;
    bannedWords?: string;
    festivalLogo?: string;
    moderators?: string[];
    bannedPseudos?: string[];
}

export interface TrackItem {
    id: string;
    time: string;
    title: string;
    user: string;
}

export interface TracklistSet {
    id: string;
    artist: string;
    startTime: string;
    tracks: TrackItem[];
    stage: string;
}

interface TakeoverContextType {
    // Auth & Moderation
    userRole: 'admin' | 'mod' | 'user';
    isMod: boolean;
    isAdmin: boolean;
    isBanned: boolean;
    moderators: string[];
    bannedPseudos: string[];
    isConnected: boolean;
    setIsConnected: (val: boolean) => void;
    
    // Config
    settings: TakeoverSettings;
    setSettings: React.Dispatch<React.SetStateAction<TakeoverSettings>>;
    activeStage: string;
    setActiveStage: (s: string) => void;
    viewMode: 'single' | 'grid';
    setViewMode: (m: 'single' | 'grid') => void;
    gridCount: number;
    setGridCount: (c: number) => void;
    accentColor: string;
    setAccentColor: (c: string) => void;
    
    // UI Panels
    showAdminPanel: boolean;
    setShowAdminPanel: (v: boolean) => void;
    activeChatTab: string;
    setActiveChatTab: (t: string) => void;
    isCinemaMode: boolean;
    setIsCinemaMode: (v: boolean) => void;
    
    // Chat & Persistence
    chatMessages: any[];
    setChatMessages: React.Dispatch<React.SetStateAction<any[]>>;
    pinnedMessage: any;
    setPinnedMessage: (m: any) => void;
    
    // Interactive
    activePoll: any;
    setActivePoll: (p: any) => void;
    activeQuiz: any;
    setActiveQuiz: (q: any) => void;
    quizTimeLeft: number | null;
    activeHeist: any;
    activeBoss: any;
    userDrops: number;
    setUserDrops: React.Dispatch<React.SetStateAction<number>>;
    
    // Appwrite helpers
    databases: Databases;
    DATABASE_ID: string;
    COLLECTION_CHAT: string;
    
    // Data
    wikiDjs: any[];
    wikiClubs: any[];
    wikiFestivals: any[];
    fetchWikiData: () => Promise<void>;

    // Handlers
    handleGlobalSave: (data?: TakeoverSettings) => Promise<void>;
    triggerConfetti: () => void;
    showNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const TakeoverContext = createContext<TakeoverContextType | undefined>(undefined);

export const TakeoverProvider: React.FC<{ children: React.ReactNode, initialSettings?: any }> = ({ children, initialSettings }) => {
    // Appwrite Config
    const client = useMemo(() => new Client()
        .setEndpoint('https://fra.cloud.appwrite.io/v1')
        .setProject('69adc19b0027cb3b46d4'), []);
        
    const databases = useMemo(() => new Databases(client), [client]);
    const DATABASE_ID = 'live_chat';
    const COLLECTION_CHAT = 'live_messages';
    const COLLECTION_BANS = 'bans';

    const localIsAdmin = localStorage.getItem('admin_auth') === 'true';
    const adminUser = localStorage.getItem('admin_user');
    const storedPseudo = localStorage.getItem('chat_pseudo');
    
    const isSpecialAdmin = useMemo(() => {
        return !!(storedPseudo && ['alex', 'alexf', 'itsalexfr1', 'contact@dropsiders.fr'].includes(storedPseudo.toLowerCase()));
    }, [storedPseudo]);

    const userRole: 'admin' | 'mod' | 'user' = (localIsAdmin || isSpecialAdmin) ? 'admin' : 'user';

    // Basic States
    const [moderators, setModerators] = useState<string[]>([]);
    const [bannedPseudos, setBannedPseudos] = useState<string[]>([]);
    const [isBanned, setIsBanned] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [activeChatTab, setActiveChatTab] = useState('chat');
    const [isConnected, setIsConnected] = useState(!!localStorage.getItem('chat_pseudo'));
    const [activeStage, setActiveStage] = useState<string>('stage1');
    const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
    const [gridCount, setGridCount] = useState<number>(4);
    const [isCinemaMode, setIsCinemaMode] = useState(false);
    const [accentColor, setAccentColor] = useState(localStorage.getItem('chat_accent_color') || '#ff0033');
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [pinnedMessage, setPinnedMessage] = useState<any>(null);
    const [activePoll, setActivePoll] = useState<any>(null);
    const [activeQuiz, setActiveQuiz] = useState<any>(null);
    const [quizTimeLeft, setQuizTimeLeft] = useState<number | null>(null);
    const [activeHeist, setActiveHeist] = useState<any>(null);
    const [activeBoss, setActiveBoss] = useState<any>(null);
    const [userDrops, setUserDrops] = useState(() => {
        const saved = localStorage.getItem('user_drops');
        return saved ? Number(saved) : 0;
    });
    const [wikiDjs, setWikiDjs] = useState<any[]>([]);
    const [wikiClubs, setWikiClubs] = useState<any[]>([]);
    const [wikiFestivals, setWikiFestivals] = useState<any[]>([]);

    const [settings, setSettings] = useState<TakeoverSettings>({
        title: initialSettings?.title || 'LIVESTREAM',
        youtubeId: initialSettings?.youtubeId || '',
        mainFluxName: initialSettings?.mainFluxName || 'MAIN STAGE',
        currentTrack: initialSettings?.currentTrack || 'ID - UNRELEASED',
        tickerText: initialSettings?.tickerText || 'BIENVENUE SUR LE LIVE DROPSIDERS !',
        showTickerBanner: initialSettings?.showTickerBanner ?? true,
        tickerBgColor: initialSettings?.tickerBgColor || '#ff0033',
        tickerTextColor: initialSettings?.tickerTextColor || '#ffffff',
        lineup: initialSettings?.lineup || '[]',
        status: 'live',
        enabled: initialSettings?.enabled ?? true,
        streams: initialSettings?.streams || [],
        activeStreamId: initialSettings?.activeStreamId || '',
    });

    const isMod = useMemo(() => {
        const currentPs = (storedPseudo || '').toUpperCase();
        return userRole !== 'user' || moderators.includes(currentPs);
    }, [userRole, storedPseudo, moderators]);

    const fetchWikiData = useCallback(async () => {
        try {
            const [djs, clubs, fests] = await Promise.all([
                fetch('/api/wiki/list?type=DJS').then(r => r.ok ? r.json() : []),
                fetch('/api/wiki/list?type=CLUBS').then(r => r.ok ? r.json() : []),
                fetch('/api/wiki/list?type=FESTIVALS').then(r => r.ok ? r.json() : [])
            ]);
            setWikiDjs(Array.isArray(djs) ? djs : []);
            setWikiClubs(Array.isArray(clubs) ? clubs : []);
            setWikiFestivals(Array.isArray(fests) ? fests : []);
        } catch (e) {
            console.error('Failed to fetch wiki data', e);
        }
    }, []);

    useEffect(() => {
        if (localIsAdmin || isSpecialAdmin) {
            fetchWikiData();
        }
    }, [localIsAdmin, isSpecialAdmin, fetchWikiData]);

    // Handlers
    const handleGlobalSave = async (data?: TakeoverSettings) => {
        try {
            const toSave = data || settings;
            const res = await fetch('/api/takeover-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(toSave)
            });
            if (!res.ok) throw new Error('Failed to save');
            showNotification('Configuration enregistrée sur le serveur !', 'success');
        } catch (e) {
            console.error('Save failed', e);
            showNotification('Erreur de sauvegarde serveur', 'error');
        }
    };

    const triggerConfetti = useCallback(() => {
        // Needs window.confetti which is usually imported globally or via script
        (window as any).confetti?.({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff0033', '#00ffff', '#ffffff']
        });
    }, []);

    const value = {
        userRole,
        isMod,
        isAdmin: localIsAdmin || isSpecialAdmin,
        isBanned: isBanned || bannedPseudos.includes((storedPseudo || '').toUpperCase()),
        moderators,
        bannedPseudos,
        isConnected,
        setIsConnected,
        settings,
        setSettings,
        activeStage,
        setActiveStage,
        viewMode,
        setViewMode,
        gridCount,
        setGridCount,
        accentColor,
        setAccentColor,
        showAdminPanel,
        setShowAdminPanel,
        activeChatTab,
        setActiveChatTab,
        isCinemaMode,
        setIsCinemaMode,
        chatMessages,
        setChatMessages,
        pinnedMessage,
        setPinnedMessage,
        activePoll,
        setActivePoll,
        activeQuiz,
        setActiveQuiz,
        quizTimeLeft,
        activeHeist,
        activeBoss,
        userDrops,
        setUserDrops,
        wikiDjs,
        wikiClubs,
        wikiFestivals,
        fetchWikiData,
        databases,
        DATABASE_ID,
        COLLECTION_CHAT,
        handleGlobalSave,
        triggerConfetti,
        showNotification
    };

    return (
        <TakeoverContext.Provider value={value}>
            {children}
        </TakeoverContext.Provider>
    );
};

export const useTakeover = () => {
    const context = useContext(TakeoverContext);
    if (!context) throw new Error('useTakeover must be used within TakeoverProvider');
    return context;
};
