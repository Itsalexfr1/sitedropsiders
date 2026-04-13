import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Settings, Users, MessageSquare, Send, Zap,
    Save, AlertCircle, Music, Trash2, Plus,
    Pin, Star, ShieldCheck, Ban, Megaphone, User,
    BarChart3, Clock, Sword, Crown, Maximize2, Minimize2,
    Trophy, Stars, Heart, Timer, ShieldAlert, Calendar, Edit2, Edit3,
    Languages, Instagram, MapPin, ShoppingBag, Square, Sparkles,
    Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Camera, Check, Coins, Shield,
    Scan, Wand2, Globe, Volume2, VolumeX
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import confetti from 'canvas-confetti';
import { Client, Databases, ID, Query } from 'appwrite';
import { FlagIcon } from '../components/ui/FlagIcon';
import { ModerationModal } from '../components/admin/ModerationModal';
import { ImageCropper } from '../components/ImageCropper';

interface LineupItem {
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
}

interface StreamItem {
    id: string;
    name: string;
    youtubeId: string;
    currentTrack?: string;
    overrideArtist?: string;
    isExternalLink?: boolean;
}

interface TakeoverSettings {
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

interface TrackItem {
    id: string;
    time: string;
    title: string;
    user: string;
}

interface TracklistSet {
    id: string;
    artist: string;
    startTime: string;
    tracks: TrackItem[];
    stage: string;
}


export const TakeoverPage = ({ initialSettings }: { initialSettings?: any }) => {
    const navigate = useNavigate();

    // Appwrite Config
    const client = new Client()
        .setEndpoint('https://fra.cloud.appwrite.io/v1')
        .setProject('69adc19b0027cb3b46d4');
    const databases = new Databases(client);
    const DATABASE_ID = 'live_chat';
    const COLLECTION_CHAT = 'live_messages';
    const COLLECTION_BANS = 'bans';

    const isAdmin = localStorage.getItem('admin_auth') === 'true';
    const adminUser = localStorage.getItem('admin_user');
    const storedPseudo = localStorage.getItem('chat_pseudo');
    
    // Si on est admin mais qu'aucun pseudo de chat n'est défini ou qu'on a le pseudo par défaut 'simon', on utilise le pseudo admin
    if (isAdmin && adminUser && (!storedPseudo || storedPseudo === 'simon')) {
        localStorage.setItem('chat_pseudo', adminUser);
    }

    const isSpecialAdmin = storedPseudo && ['alex', 'alexf', 'itsalexfr1', 'contact@dropsiders.fr', 'contact@dropsiders.fr'].includes(storedPseudo.toLowerCase());
    const userRole: 'admin' | 'mod' | 'user' = (isAdmin || isSpecialAdmin) ? 'admin' : 'user';

    // Moderation States
    const [moderators, setModerators] = useState<string[]>([]);
    const [bannedPseudos, setBannedPseudos] = useState<string[]>([]);
    const [isBanned, setIsBanned] = useState(false);

    const isMod = useMemo(() => {
        const currentPs = (storedPseudo || '').toUpperCase();
        return userRole !== 'user' || moderators.includes(currentPs);
    }, [userRole, storedPseudo, moderators]);

    const isUserBanned = useMemo(() => {
        const currentPs = (storedPseudo || '').toUpperCase();
        return isBanned || bannedPseudos.includes(currentPs);
    }, [isBanned, storedPseudo, bannedPseudos]);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [activeChatTab, setActiveChatTab] = useState('chat');
    const [newMessage, setNewMessage] = useState('');
    const [isHighlightChecked, setIsHighlightChecked] = useState(false);
    const [highlightColor, setHighlightColor] = useState('#f59e0b');
    const [isConnected, setIsConnected] = useState(!!localStorage.getItem('chat_pseudo'));
    const [activeAudioIdx, setActiveAudioIdx] = useState(0);
    const [pingAudio] = useState(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

    const renderMessageContent = (content: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return content.split(urlRegex).map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-neon-cyan underline hover:text-white transition-colors" onClick={(e) => e.stopPropagation()}>
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    // Form States
    const [loginPseudo, setLoginPseudo] = useState('');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginCountry, setLoginCountry] = useState('FR');
    const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);

    const countries = [
        { code: 'FR', name: 'France' },
        { code: 'BE', name: 'Belgique' },
        { code: 'CH', name: 'Suisse' },
        { code: 'CA', name: 'Canada' },
        { code: 'ES', name: 'Espagne' },
        { code: 'PT', name: 'Portugal' },
        { code: 'IT', name: 'Italie' },
        { code: 'DE', name: 'Allemagne' },
        { code: 'GB', name: 'UK' },
        { code: 'US', name: 'USA' },
        { code: 'MA', name: 'Maroc' },
        { code: 'DZ', name: 'Algérie' },
        { code: 'TN', name: 'Tunisie' }
    ];

    const [pinnedMessage, setPinnedMessage] = useState<any>(null);
    const [tracklist, setTracklist] = useState<TracklistSet[]>([]);
    const [newSetArtist, setNewSetArtist] = useState('');
    const [newSetTime, setNewSetTime] = useState('');
    const [trackSuggestion, setTrackSuggestion] = useState('');
    const [expandedSets, setExpandedSets] = useState<string[]>([]);
    // Chat State
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [userCountry, setUserCountry] = useState('FR');
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
    const [slowModeEnabled, setSlowModeEnabled] = useState(false);
    const [lastMessageTime, setLastMessageTime] = useState(0);
    const [activeQuiz, setActiveQuiz] = useState<any>(null);
    const [quizTimeLeft, setQuizTimeLeft] = useState<number | null>(null);
    const [userHasAnswered, setUserHasAnswered] = useState(false);
    const [predefinedQuizzes, setPredefinedQuizzes] = useState<any[]>([]);

    useEffect(() => {
        if (quizTimeLeft === null || quizTimeLeft <= 0) return;
        const timer = setTimeout(() => {
            if (quizTimeLeft === 1) {
                setActiveQuiz(null);
                setQuizTimeLeft(null);
            } else {
                setQuizTimeLeft(prev => prev! - 1);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [quizTimeLeft]);

    // DB Settings
    const [settings, setSettings] = useState<TakeoverSettings>({
        title: initialSettings?.title || 'LIVESTREAM',
        youtubeId: initialSettings?.youtubeId || '',
        mainFluxName: initialSettings?.mainFluxName || 'MAIN STAGE',
        currentTrack: initialSettings?.currentTrack || 'ID - UNRELEASED',
        tickerText: initialSettings?.tickerText || 'BIENVENUE SUR LE LIVE DROPSIDERS ! PROFITEZ DE LA MUSIQUE 24/7',
        showTickerBanner: initialSettings?.showTickerBanner !== undefined ? initialSettings.showTickerBanner : true,
        tickerBgColor: initialSettings?.tickerBgColor || '#ff0033',
        tickerTextColor: initialSettings?.tickerTextColor || '#ffffff',
        lineup: initialSettings?.lineup || '',
        status: 'live',
        enabled: initialSettings?.enabled !== undefined ? initialSettings.enabled : true,
        streams: initialSettings?.streams || [], activeStreamId: initialSettings?.activeStreamId || '',
        highlightPrice: initialSettings?.highlightPrice || 100,
        lots: initialSettings?.lots || [],
        sponsorText: initialSettings?.sponsorText || 'LIVE RENDU POSSIBLE GRÂCE À NOS PARTENAIRES !',
        sponsorLink: initialSettings?.sponsorLink || 'https://dropsiders.fr',
        showSponsorBanner: initialSettings?.showSponsorBanner !== undefined ? initialSettings.showSponsorBanner : true
    });

    const isPopout = new URLSearchParams(window.location.search).get('popout') === 'true';

    const [activeStage, setActiveStage] = useState<string>('stage1');
    const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
    const [gridCount, setGridCount] = useState<number>(4);

    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    const [accentColor, setAccentColor] = useState(localStorage.getItem('chat_accent_color') || '#ff0033');
    const [isModChat, setIsModChat] = useState(false);
    const [activePoll, setActivePoll] = useState<any>(null);
    const [userVoted, setUserVoted] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<any>(null);
    const [mentionNotify, setMentionNotify] = useState(false);
    const [isCinemaMode, setIsCinemaMode] = useState(false);

    const [showBadgesAdmin] = useState(() => {
        const saved = localStorage.getItem('chat_show_badges');
        return saved !== null ? saved === 'true' : true;
    });
    const [marqueeItems, setMarqueeItems] = useState<{ text: string, link: string }[]>([]);
    const [editMarqueeItems, setEditMarqueeItems] = useState<{ text: string, link: string }[]>([]);
    const [editingLineupId, setEditingLineupId] = useState<string | null>(null);

    // Fetch real site news to populate the marquee
    useEffect(() => {
        fetch('/api/news')
            .then(r => r.json())
            .then((data: any[]) => {
                if (Array.isArray(data) && data.length > 0) {
                    const items = data.slice(0, 8).map((n: any) => ({
                        text: n.title || n.name || '',
                        link: n.slug ? `/news/${n.slug}` : (n.url || '')
                    })).filter(i => i.text);
                    if (items.length > 0) {
                        setMarqueeItems(items);
                        setEditMarqueeItems(items);
                    }
                }
            })
            .catch(() => { });
    }, []);
    const [leaderboard] = useState<{ pseudo: string, drops: number, country: string }[]>([
        { pseudo: 'ALEX_FR1', drops: 15400, country: 'FR' },
        { pseudo: 'DJ_KOROS', drops: 12200, country: 'BE' },
        { pseudo: 'RAVER_99', drops: 9800, country: 'DE' }
    ]);
    const [newArrival, setNewArrival] = useState<string | null>(null);
    const [setRatings, setSetRatings] = useState<{ [artist: string]: number }>({});
    const [showRatingPrompt, setShowRatingPrompt] = useState(false);
    const [isTTSActive] = useState(false);

    const [vipsList, setVipsList] = useState<string[]>([]);
    const [showViewersList, setShowViewersList] = useState(false);
    const [flashMessage, setFlashMessage] = useState<{ text: string, type: 'info' | 'warn' | 'success' } | null>(null);
    const [isMatrixActive, setIsMatrixActive] = useState(false);
    const [userXP, setUserXP] = useState(() => parseInt(localStorage.getItem('user_xp') || '0'));
    const [userLevel, setUserLevel] = useState(() => parseInt(localStorage.getItem('user_level') || '1'));
    const [activeHeist, setActiveHeist] = useState<{ participants: { pseudo: string, bet: number }[], timeLeft: number } | null>(null);
    const [activeBoss, setActiveBoss] = useState<{ hp: number, maxHp: number, name: string } | null>(null);
    const [captchaChallenge, setCaptchaChallenge] = useState<{ q: string, a: number } | null>(null);
    const [captchaInput, setCaptchaInput] = useState('');
    const [userCity, setUserCity] = useState('📍 PARIS');
    const [hypeTrain, setHypeTrain] = useState({ active: false, level: 0, progress: 0 });
    const [isMuted, setIsMuted] = useState(false);
    const [muteTimeLeft, setMuteTimeLeft] = useState(0);

    const [profileBorder, setProfileBorder] = useState(localStorage.getItem('user_profile_border') || 'none');
    const [pseudoColor, setPseudoColor] = useState(localStorage.getItem('user_pseudo_color') || '#ffffff');
    const [specialFontStyle, setSpecialFontStyle] = useState(localStorage.getItem('user_font_style') || 'normal');
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [gifSearch, setGifSearch] = useState('');
    const [gifResults, setGifResults] = useState<string[]>([
        'https://i.giphy.com/l41lTfuxVpT6DhjPy.gif',
        'https://i.giphy.com/3o7TKMGpxVfPtoog3m.gif',
        'https://i.giphy.com/clotJgshs6nUUXf2i6.gif'
    ]);
    const [activeQTE, setActiveQTE] = useState<{ id: string, type: 'click', reward: number } | null>(null);
    const [achievements, setAchievements] = useState<string[]>(JSON.parse(localStorage.getItem('user_achievements') || '[]'));
    const [isPacmanActive, setIsPacmanActive] = useState(false);
    const [showHeistOverlay, setShowHeistOverlay] = useState(false);
    const [activeSlots, setActiveSlots] = useState<{ id: string, participants: string[], timeLeft: number } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ show: boolean, title: string, text: string, onConfirm: () => void } | null>(null);
    const [takeoverAlert, setTakeoverAlert] = useState<{ text: string, type: 'alert' | 'heist' } | null>(null);
    const [userWarnings, setUserWarnings] = useState<{ [pseudo: string]: number }>({});
    const [isRouletteTimeout, setIsRouletteTimeout] = useState(false);
    const [topTalkers, setTopTalkers] = useState<{ pseudo: string, count: number }[]>([]);
    const [isPremsAwarded, setIsPremsAwarded] = useState(false);
    const [clashPoll, setClashPoll] = useState<{ active: boolean, teamA: string, teamB: string, votesA: string[], votesB: string[] } | null>(null);
    const [shopItems, setShopItems] = useState<any[]>([]);
    const groupedShopItems = useMemo(() => {
        const groups: Record<string, any[]> = {};
        shopItems.forEach(item => {
            const cat = item.category || 'Autres';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });
        return groups;
    }, [shopItems]);
    const [showLegendsWall, setShowLegendsWall] = useState(false);
    const [qteActive, setQteActive] = useState(false);
    const [isModerationModalOpen, setIsModerationModalOpen] = useState(false);
    const [moderationTab] = useState<'photos' | 'wiki'>('photos');

    const fetchPhotosCount = async () => {
        try {
            const wikiRes = await fetch('/api/wiki/list');
            await wikiRes.json();
            // Count logic removed as redundant
        } catch (e) {
            console.error("Error fetching photos count:", e);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchPhotosCount();
            const interval = setInterval(fetchPhotosCount, 30000);
            return () => clearInterval(interval);
        }
    }, [isAdmin]);

    // ✨ New State Features
    const [userInstagram, setUserInstagram] = useState(localStorage.getItem('user_instagram') || '');
    const [timeOnSite, setTimeOnSite] = useState(() => parseInt(localStorage.getItem('time_on_site') || '0'));
    const [showAchievementPopup, setShowAchievementPopup] = useState<string | null>(null);

    const [loginInstagram, setLoginInstagram] = useState('');
    const [loginPseudoColor, setLoginPseudoColor] = useState('#ffffff');
    const [loginCountrySearch, setLoginCountrySearch] = useState('');

    // 🎁 RECOMPENSE QUOTIDIENNE (Paliers)
    useEffect(() => {
        const lastLogin = localStorage.getItem('last_daily_reward');
        const today = new Date().toLocaleDateString();
        if (lastLogin !== today && isConnected) {
            let streak = parseInt(localStorage.getItem('login_streak') || '0');
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);

            if (lastLogin === yesterday.toLocaleDateString()) {
                streak += 1;
            } else {
                streak = 1;
            }
            localStorage.setItem('login_streak', streak.toString());

            const baseReward = 200;
            const streakBonus = Math.min(streak * 50, 1000);
            const totalReward = baseReward + streakBonus;

            setUserDrops(prev => {
                const next = prev + totalReward;
                localStorage.setItem('user_drops', next.toString());
                return next;
            });
            localStorage.setItem('last_daily_reward', today);
            showNotification(`🎁 CADEAU SUR LE LIVE (PALIER ${streak}) : +${totalReward} DROPS !`, 'success');
        }
    }, [isConnected]);

    // ⏱️ HEIST & BOSS TIMERS
    useEffect(() => {
        if (activeHeist && activeHeist.timeLeft > 0) {
            const timer = setTimeout(() => {
                setActiveHeist(prev => prev ? { ...prev, timeLeft: prev.timeLeft - 1 } : null);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (activeHeist && activeHeist.timeLeft === 0) {
            const success = Math.random() > 0.4;
            const myPseudo = localStorage.getItem('chat_pseudo');

            if (success) {
                const totalBet = activeHeist.participants.reduce((acc, p) => acc + (p?.bet || 0), 0);
                const winFactor = 1.5 + Math.random();
                const totalPrize = Math.floor(totalBet * winFactor);

                // Show win notification if current user participated
                const myParticipation = activeHeist.participants.find(p => p?.pseudo === myPseudo);
                if (myParticipation) {
                    const myShare = Math.floor((myParticipation.bet / totalBet) * totalPrize);
                    setUserDrops(prev => prev + myShare);
                    showNotification(`💰 BRAQUAGE RÉUSSI ! Tu gagnes ${myShare} DROPS !`, 'success');
                }

                if (isMod) {
                    databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                        pseudo: "BOT_SYSTEM",
                        message: `💰 BRAQUAGE RÉUSSI ! Le gang se partage ${totalPrize} DROPS ! 💰`,
                        color: "text-amber-500",
                        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                        country: "FR"
                    });
                }
            } else {
                if (activeHeist.participants.some(p => p?.pseudo === myPseudo)) {
                    showNotification(`👮 ALERTE POLICE : Le braquage a échoué !`, 'error');
                }
                if (isMod) {
                    databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                        pseudo: "BOT_SYSTEM",
                        message: `👮 ÉCHEC DU BRAQUAGE : Tout le monde a été arrêté !`,
                        color: "text-red-500",
                        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                        country: "FR"
                    });
                }
            }
            setActiveHeist(null);
            setShowHeistOverlay(false);
        }
    }, [activeHeist]);

    useEffect(() => {
        if (activeBoss && activeBoss.hp === 0) {
            showNotification(`🎉 BOSS VAINCU ! +500 DROPS POUR TOUS !`, 'success');
            setUserDrops(prev => prev + 500);
            setActiveBoss(null);
        }
    }, [activeBoss]);

    const triggerFlash = (text: string, type: 'info' | 'warn' | 'success' = 'info') => {
        setFlashMessage({ text, type });
        setTimeout(() => setFlashMessage(null), 5000);
    };

    const triggerMatrix = () => {
        setIsMatrixActive(true);
        setTimeout(() => setIsMatrixActive(false), 8000);
    };

    // ⏱️ Hourly Slot Machine (Jackpot) Timer
    // Désactivé à la demande du client pour éviter l'apparition aléatoire. 
    // Peut toujours être déclenché via !jackpot par les modérateurs.
    /*
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            // Trigger every hour at :00
            if (now.getMinutes() === 0 && !activeSlots) {
                setActiveSlots({ id: Math.random().toString(), participants: [], timeLeft: 60 });
                showNotification("🎰 JACKPOT TICKET : UN MINI-JEU APPARAÎT !", 'success');
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [activeSlots]);
    */

    useEffect(() => {
        if (activeSlots && activeSlots.timeLeft > 0) {
            const timer = setTimeout(() => {
                setActiveSlots(prev => prev ? { ...prev, timeLeft: prev.timeLeft - 1 } : null);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (activeSlots && activeSlots.timeLeft === 0) {
            // Draw winner if participants
            if (activeSlots.participants.length > 0) {
                const winner = activeSlots.participants[Math.floor(Math.random() * activeSlots.participants.length)];
                const prize = activeSlots.participants.length * 50 * 2; // Double the pool
                if (winner === localStorage.getItem('chat_pseudo')) {
                    setUserDrops(prev => prev + prize);
                    showNotification(`🎰 TU AS GAGNÉ LE JACKPOT : +${prize} DROPS !`, 'success');
                }
                databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                    pseudo: "BOT_SYSTEM",
                    message: `🎰 JACKPOT : @${winner} a gagné le gros lot de ${prize} DROPS ! 🥳`,
                    color: "text-amber-500",
                    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    country: "FR"
                });
            }
            setActiveSlots(null);
        }
    }, [activeSlots]);

    // ⏱️ Clock & Time on Site
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
            if (isConnected) {
                setTimeOnSite(prev => {
                    const next = prev + 60;
                    localStorage.setItem('time_on_site', next.toString());
                    return next;
                });
            }
        }, 60000);
        return () => clearInterval(timer);
    }, [isConnected]);

    const unlockAchievement = (name: string) => {
        if (!achievements.includes(name)) {
            const next = [...achievements, name];
            setAchievements(next);
            localStorage.setItem('user_achievements', JSON.stringify(next));
            setShowAchievementPopup(name);
            setTimeout(() => setShowAchievementPopup(null), 5000);
            showNotification(`🎉 SUCCÈS : ${name}`, 'success');
        }
    };

    // Daily Jackpot
    useEffect(() => {
        if (!isConnected) return;
        const lastJackpot = localStorage.getItem('last_jackpot');
        const today = new Date().toDateString();
        if (lastJackpot !== today) {
            const bonus = 500;
            setUserDrops(prev => {
                const next = prev + bonus;
                localStorage.setItem('user_drops', next.toString());
                return next;
            });
            localStorage.setItem('last_jackpot', today);
            showNotification(`JACKPOT QUOTIDIEN : +${bonus} DROPS ! 🎁`, 'success');
        }
    }, [isConnected]);

    const [hasAutoTriggered, setHasAutoTriggered] = useState(false);

    // Admin Panel States
    const [editTitle, setEditTitle] = useState(settings.title);
    const [editStreams, setEditStreams] = useState<StreamItem[]>(settings.streams || []);
    const [editActiveStreamId, setEditActiveStreamId] = useState(settings.activeStreamId || '');
    const [editAnnText, setEditAnnText] = useState(settings.tickerText);
    const [editAnnEnabled, setEditAnnEnabled] = useState(settings.showTickerBanner);
    const [editStatus, setEditStatus] = useState(settings.status);
    const [editStartDate, setEditStartDate] = useState(settings.startDate || '');
    const [editEndDate, setEditEndDate] = useState(settings.endDate || '');

    // 📅 Auto-Trigger Live based on Schedule
    useEffect(() => {
        const checkSchedule = () => {
            if (!editStartDate || !editEndDate || editStatus === 'off' || hasAutoTriggered) return;
            
            const now = new Date();
            const start = new Date(editStartDate);
            const end = new Date(editEndDate);
            
            if (now >= start && now <= end) {
                if (editStatus !== 'live') {
                    setEditStatus('live');
                    setSettings(prev => ({ ...prev, status: 'live' }));
                    setHasAutoTriggered(true);
                    showNotification("🚀 PROGRAMMATION : LE LIVE PASSE EN DIRECT !", 'success');
                }
            }
        };

        const timer = setInterval(checkSchedule, 10000); 
        checkSchedule();
        return () => clearInterval(timer);
    }, [editStartDate, editEndDate, editStatus, hasAutoTriggered]);
    const [editTickerBg, setEditTickerBg] = useState(settings.tickerBgColor);
    const [editTickerTextC, setEditTickerTextC] = useState(settings.tickerTextColor);
    const [editDropsAmount, setEditDropsAmount] = useState(settings.dropsAmount || 10);
    const [editDropsInterval, setEditDropsInterval] = useState(settings.dropsInterval || 5);
    const [adminActiveTab, setAdminActiveTab] = useState<'config' | 'planning' | 'tracklist' | 'interactif' | 'bot_drops'>('config');
    const [interactivityDuration, setInteractivityDuration] = useState(30);

    // 🎰 Lottery (Tirage au sort)
    const [editBannedWords] = useState(settings.bannedWords || '');

    const handleAdminCommand = async (cmd: string) => {
        await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
            pseudo: "BOT_SYSTEM",
            message: `[SYSTEM]:COMMAND:${cmd}`,
            color: "text-neon-red",
            time: new Date().toLocaleTimeString(),
            country: "FR",
            stage: activeStage
        });
        showNotification(`Commande ${cmd} envoyée`, 'success');
    };

    const [editInsta, setEditInsta] = useState(settings.instagramLink || '');
    const [editTiktok, setEditTiktok] = useState(settings.tiktokLink || '');
    const [editYoutube, setEditYoutube] = useState(settings.youtubeLink || '');
    const [editTwitter, setEditTwitter] = useState(settings.twitterLink || '');
    const [editFestivalLogo, setEditFestivalLogo] = useState(settings.festivalLogo || '');
    const [isSaving, setIsSaving] = useState(false);

    const [dropsLots, setDropsLots] = useState<any[]>(settings.lots || []);
    const [pollQuestion, setPollQuestion] = useState('');
    const [botCommands, setBotCommands] = useState<{ command: string, response: string }[]>(settings.botCommands || [
        { command: "!insta", response: "Suivez-nous sur @dropsiders.fr !" },
        { command: "!lineup", response: "La lineup est disponible dans l'onglet PLANNING." }
    ]);
    const [editSponsorText, setEditSponsorText] = useState(settings.sponsorText || '');
    const [editSponsorLink, setEditSponsorLink] = useState(settings.sponsorLink || '');
    const [editShowSponsorBanner, setEditShowSponsorBanner] = useState(settings.showSponsorBanner !== undefined ? settings.showSponsorBanner : true);
    const [newCmd, setNewCmd] = useState({ command: '', response: '' });

    const [lineupItems, setLineupItems] = useState<LineupItem[]>(() => {
        try {
            return JSON.parse(settings.lineup || '[]');
        } catch (e) { return []; }
    });

    const [userDrops, setUserDrops] = useState(() => {
        const saved = localStorage.getItem('user_drops');
        return saved ? Number(saved) : 0;
    });

    // 🎆 Special Effects Logic
    const triggerConfetti = () => {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff0033', '#00ffff', '#ffffff']
        });
    };

    const triggerFireworks = () => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    const triggerPACMAN = () => {
        setIsPacmanActive(true);
        setIsMatrixActive(true);
        setTimeout(() => {
            setIsPacmanActive(false);
            setIsMatrixActive(false);
        }, 5000);
        showNotification("PACMAN TRAVERSE LE CHAT !", 'success');
    };

    const speakMessage = (text: string, voiceType: 'normal' | 'robot' | 'monster' | 'echo' = 'normal') => {
        if (!isTTSActive || !window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';

        if (voiceType === 'robot') {
            utterance.pitch = 0.5;
            utterance.rate = 0.8;
        } else if (voiceType === 'monster') {
            utterance.pitch = 0.1;
            utterance.rate = 0.5;
        } else if (voiceType === 'echo') {
            // Echo simulation by repeating with delay (basic)
            window.speechSynthesis.speak(utterance);
            setTimeout(() => {
                const echo = new SpeechSynthesisUtterance(text);
                echo.volume = 0.3;
                window.speechSynthesis.speak(echo);
            }, 300);
            return;
        }

        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (!isConnected) return;
        const intervalMs = (settings.dropsInterval || 5) * 60 * 1000;
        const timer = setInterval(() => {
            setUserDrops(prev => {
                const next = prev + (settings.dropsAmount || 10);
                localStorage.setItem('user_drops', next.toString());
                return next;
            });
        }, intervalMs);
        return () => clearInterval(timer);
    }, [isConnected, settings.dropsInterval, settings.dropsAmount]);

    const [newLineupItem, setNewLineupItem] = useState<LineupItem>({
        id: '', day: '', startTime: '', endTime: '', artist: '', stage: '', instagram: '', instagram2: '', instagram3: '', image: ''
    });

    const [planningActiveDay, setPlanningActiveDay] = useState<string>('');
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [newModo, setNewModo] = useState('');
    const [newBanned, setNewBanned] = useState('');
    const [showCustomDuration, setShowCustomDuration] = useState(false);
    const [isScanningImage, setIsScanningImage] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [ocrImage, setOcrImage] = useState<string | null>(null);
    const [scanStage, setScanStage] = useState('');

    // Bulk Import states
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [bulkStage, setBulkStage] = useState('');
    const [bulkDate, setBulkDate] = useState('');
    const [bulkPreview, setBulkPreview] = useState<{ startTime: string; endTime?: string; artist: string; image?: string }[]>([]);
    const [bulkCropIndex, setBulkCropIndex] = useState<number | null>(null);
    const [bulkRequireEndTime, setBulkRequireEndTime] = useState(false);
    const [selectedTimezoneId, setSelectedTimezoneId] = useState<string>('fr');
    const [autoRemoveFinished, setAutoRemoveFinished] = useState(() => {
        const saved = localStorage.getItem('lineup_auto_remove');
        return saved !== null ? saved === 'true' : true;
    });
    const [editingBulkTime, setEditingBulkTime] = useState<{ index: number; start: string; end: string } | null>(null);
    const [bulkDateFrom, setBulkDateFrom] = useState('');
    const [bulkDateTo, setBulkDateTo] = useState('');

    const handleBulkDateChange = () => {
        if (!bulkDateFrom || !bulkDateTo) {
            setToast({ show: true, message: 'Veuillez remplir les deux dates (De -> Vers)', type: 'error' });
            return;
        }
        const count = lineupItems.filter(i => i.day === bulkDateFrom).length;
        if (count === 0) {
            setToast({ show: true, message: 'Aucun artiste trouvé à cette date', type: 'error' });
            return;
        }
        setLineupItems(prev => prev.map(item => 
            item.day === bulkDateFrom ? { ...item, day: bulkDateTo } : item
        ));
        setToast({ show: true, message: `✅ ${count} artistes déplacés du ${bulkDateFrom} au ${bulkDateTo}`, type: 'success' });
        setBulkDateFrom('');
        setBulkDateTo('');
    };


    const timezonePresets = [
        { id: 'fr', label: '🇫🇷 Heure Française (pas de conversion)', tz: 'Europe/Paris', group: '🌍 Europe' },
        { id: 'uk', label: 'Londres / Creamfields / Drumsheds', tz: 'Europe/London', group: '🇬🇧 Royaume-Uni' },
        { id: 'us-east-miami', label: 'Ultra Music Festival Miami / NY', tz: 'America/New_York', group: '🌴 US - Côte Est' },
        { id: 'us-east-lost', label: 'Lost Lands (Ohio)', tz: 'America/New_York', group: '🌴 US - Côte Est' },
        { id: 'us-east-orlando', label: 'EDC Orlando / EDSea', tz: 'America/New_York', group: '🌴 US - Côte Est' },
        { id: 'us-west-vegas', label: 'EDC Las Vegas', tz: 'America/Los_Angeles', group: '🎡 US - Côte Ouest' },
        { id: 'us-west-coachella', label: 'Coachella', tz: 'America/Los_Angeles', group: '🎡 US - Côte Ouest' },
        { id: 'us-west-la', label: 'Day Trip Festival (Los Angeles)', tz: 'America/Los_Angeles', group: '🎡 US - Côte Ouest' },
        { id: 'us-central-chicago', label: 'Lollapalooza Chicago', tz: 'America/Chicago', group: '🤠 US - Centre' },
        { id: 'us-central-texas', label: 'Ubbi Dubbi (Texas)', tz: 'America/Chicago', group: '🤠 US - Centre' },
    ];

    const calculateDynamicOffset = (dateStr: string, tzId: string) => {
        try {
            if (tzId === 'Europe/Paris') return 0;
            // On crée une date de référence à midi pour éviter les chevauchements de bordure de jour
            const testDate = new Date(`${dateStr || new Date().toISOString().split('T')[0]}T12:00:00Z`);
            
            const parisStr = testDate.toLocaleString('en-US', { timeZone: 'Europe/Paris', hour12: false });
            const targetStr = testDate.toLocaleString('en-US', { timeZone: tzId, hour12: false });
            
            const pDate = new Date(parisStr);
            const tDate = new Date(targetStr);
            
            return Math.round((pDate.getTime() - tDate.getTime()) / (1000 * 60 * 60));
        } catch (e) {
            return 0;
        }
    };

    const eventTimezoneOffset = (() => {
        const preset = timezonePresets.find(p => p.id === selectedTimezoneId);
        if (preset) return calculateDynamicOffset(bulkDate || newLineupItem.day, preset.tz);
        
        if (selectedTimezoneId === 'm1') return 1;
        if (selectedTimezoneId === 'm2') return 2;
        if (selectedTimezoneId === 'm-1') return -1;
        return 0;
    })();

    const parseBulkSchedule = (text: string): { startTime: string; endTime?: string; artist: string }[] => {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const results: { startTime: string; endTime?: string; artist: string }[] = [];
        // Matches "16:00 - 17:00 - Artist" or "16:00 - Artist"
        const regex = /^(\d{1,2})[:\s.h]?(\d{2})?\s*(am|pm)?\s*[-–—]\s*(?:(\d{1,2})[:\s.h]?(\d{2})?\s*(am|pm)?\s*)?[-–—]?\s*(.+)$/i;
        
        for (const line of lines) {
            const m = line.match(regex);
            if (!m) continue;
            
            // Start Time
            let h1 = parseInt(m[1], 10);
            const m1 = parseInt(m[2] || '0', 10);
            const p1 = (m[3] || '').toLowerCase();
            if (p1 === 'pm' && h1 < 12) h1 += 12;
            if (p1 === 'am' && h1 === 12) h1 = 0;
            const startTime = `${h1.toString().padStart(2, '0')}:${m1.toString().padStart(2, '0')}`;
            
            // End Time (optional)
            let endTime: string | undefined = undefined;
            if (m[4]) {
                let h2 = parseInt(m[4], 10);
                const m2 = parseInt(m[5] || '0', 10);
                const p2 = (m[6] || '').toLowerCase();
                if (p2 === 'pm' && h2 < 12) h2 += 12;
                if (p2 === 'am' && h2 === 12) h2 = 0;
                endTime = `${h2.toString().padStart(2, '0')}:${m2.toString().padStart(2, '0')}`;
            }
            
            const artist = m[7].trim();
            results.push({ startTime, endTime, artist });
        }
        return results;
    };

    const handleBulkImport = () => {
        if (!bulkStage || !bulkDate || bulkPreview.length === 0) {
            showNotification('Veuillez remplir la date, la scène et coller un planning', 'error');
            return;
        }
        const missingPhotos = bulkPreview.filter(e => !e.image);
        if (missingPhotos.length > 0) {
            showNotification(`📷 Photo obligatoire — ${missingPhotos.length} artiste(s) sans photo`, 'error');
            return;
        }

        if (bulkRequireEndTime) {
            const missingEndTimes = bulkPreview.filter(e => !e.endTime);
            if (missingEndTimes.length > 0) {
                showNotification(`⏰ Heure de fin manquante pour ${missingEndTimes.length} artiste(s)`, 'error');
                return;
            }
        }
        const newItems: LineupItem[] = bulkPreview.map((entry, idx) => {
            // End time = parsed endTime OR start of next slot, OR start + 1h for last
            const nextEntry = bulkPreview[idx + 1];
            let rawEndH, rawEndM;

            if (entry.endTime) {
                const parts = entry.endTime.split(':');
                rawEndH = parseInt(parts[0], 10);
                rawEndM = parseInt(parts[1], 10);
            } else {
                rawEndH = nextEntry
                    ? parseInt(nextEntry.startTime.split(':')[0], 10)
                    : parseInt(entry.startTime.split(':')[0], 10) + 1;
                rawEndM = nextEntry
                    ? parseInt(nextEntry.startTime.split(':')[1], 10)
                    : parseInt(entry.startTime.split(':')[1], 10);
            }

            // Apply timezone offset (same logic as individual form)
            const applyOff = (dateStr: string, h: number, m: number, off: number, nextDay: boolean) => {
                const [y, mo, d] = dateStr.split('-').map(Number);
                const dt = new Date(y, mo - 1, d, h, m, 0);
                if (nextDay) dt.setDate(dt.getDate() + 1);
                dt.setHours(dt.getHours() + off);
                const nd = `${dt.getFullYear()}-${(dt.getMonth() + 1).toString().padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')}`;
                const nt = `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`;
                return { nd, nt };
            };

            const [sh, sm] = entry.startTime.split(':').map(Number);
            const isNextDay = rawEndH >= 24;
            const adjEndH = rawEndH % 24;

            const startConv = applyOff(bulkDate, sh, sm, eventTimezoneOffset, false);
            const endConv = applyOff(bulkDate, adjEndH, rawEndM, eventTimezoneOffset, isNextDay || (rawEndH < sh));

            return {
                id: ID.unique(),
                day: startConv.nd,
                startTime: startConv.nt,
                endTime: endConv.nt,
                artist: entry.artist.toUpperCase(),
                stage: bulkStage.toUpperCase(),
                instagram: '',
                instagram2: '',
                instagram3: '',
                image: entry.image || ''
            };
        });
        setLineupItems(prev => [...prev, ...newItems]);
        showNotification(`✅ ${newItems.length} artiste(s) importé(s) !`, 'success');
        setBulkText('');
        setBulkPreview([]);
        setShowBulkImport(false);
    };

    // ⏰ Auto-remove finished artists & Persist
    useEffect(() => {
        if (!autoRemoveFinished || !isAdmin) return;
        
        const checkAndCleanup = async () => {
            const now = new Date();
            const nowMins = now.getHours() * 60 + now.getMinutes();
            const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
            
            let removedCount = 0;
            const cleanedLineup = lineupItems.filter(item => {
                if (!item.day || !item.endTime) return true;
                
                // Si le jour est strictement passé
                if (item.day < todayStr) {
                    removedCount++;
                    return false;
                }
                
                // Si c'est aujourd'hui, vérifier l'heure de fin
                if (item.day === todayStr) {
                    const [sh, sm] = (item.startTime || '00:00').replace(/[h.]/g, ':').split(':').map(Number);
                    const [eh, em] = (item.endTime || '00:00').replace(/[h.]/g, ':').split(':').map(Number);
                    
                    let endMins = eh * 60 + em;
                    let startMins = sh * 60 + sm;
                    
                    // Gestion du passage à minuit (ex: 23:00 -> 01:00)
                    // Si l'heure de fin est inférieure à l'heure de début, 
                    // cela signifie que le set se termine le lendemain matin.
                    if (endMins < startMins) {
                        // Le set n'est pas encore fini car il se finit demain
                        return true; 
                    }
                    
                    if (nowMins >= endMins) {
                        removedCount++;
                        return false;
                    }
                }
                return true;
            });

            if (removedCount > 0) {
                console.log(`[CLEANUP] Removing ${removedCount} finished artists...`);
                setLineupItems(cleanedLineup);
                
                // Persist to server if we are admin
                try {
                    const currentSettings = {
                        ...settings,
                        lineup: JSON.stringify(cleanedLineup)
                    };
                    await fetch('/api/takeover-settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(currentSettings)
                    });
                    setSettings(currentSettings);
                    showNotification(`${removedCount} artiste(s) terminé(s) supprimé(s) automatiquement.`, 'success');
                } catch (err) {
                    console.error("Auto-cleanup save failed", err);
                }
            }
        };

        const interval = setInterval(checkAndCleanup, 60000); // Check every minute
        checkAndCleanup();
        return () => clearInterval(interval);
    }, [autoRemoveFinished, isAdmin, lineupItems, settings]);

    const extractYoutubeId = (url: string) => {
        if (!url) return '';
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
        return match ? match[1] : url.trim();
    };
    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({
        show: false, message: '', type: 'success'
    });

    const handleAddLineupItem = async () => {
        if (!newLineupItem.artist || !newLineupItem.day || !newLineupItem.startTime || !newLineupItem.endTime || !newLineupItem.image) {
            showNotification('Veuillez remplir tous les champs obligatoires (Photo incluse)', 'error');
            return;
        }

        const parseRawTime = (timeStr: string) => {
            let cleaned = timeStr.trim().toLowerCase();
            const isPM = cleaned.includes('pm') || cleaned.includes(' p.m');
            cleaned = cleaned.replace('am', '').replace('pm', '').replace(' a.m', '').replace(' p.m', '').trim();
            cleaned = cleaned.replace('.', ':').replace('h', ':');

            let [hStr, mStr] = cleaned.split(':');
            let h = parseInt(hStr || '0', 10);
            let m = parseInt(mStr || '0', 10);
            if (isNaN(h)) h = 0;
            if (isNaN(m)) m = 0;
            if (isPM && h < 12) h += 12;
            if (!isPM && h === 12) h = 0;
            return { h, m };
        };

        const localStart = parseRawTime(newLineupItem.startTime);
        const localEnd = parseRawTime(newLineupItem.endTime);

        const applyOffset = (dateStr: string, hour: number, min: number, offsetHours: number, nextDay: boolean) => {
            const [year, month, day] = dateStr.split('-').map(Number);
            const dt = new Date(year, month - 1, day, hour, min, 0);
            if (nextDay) dt.setDate(dt.getDate() + 1);
            dt.setHours(dt.getHours() + offsetHours);

            const newDate = `${dt.getFullYear()}-${(dt.getMonth() + 1).toString().padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')}`;
            const newTime = `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`;
            return { newDate, newTime };
        };

        const isNextDayLocal = localEnd.h < localStart.h;

        const startConverted = applyOffset(newLineupItem.day, localStart.h, localStart.m, eventTimezoneOffset, false);
        const endConverted = applyOffset(newLineupItem.day, localEnd.h, localEnd.m, eventTimezoneOffset, isNextDayLocal);

        const item = { 
            ...newLineupItem, 
            id: editingLineupId || ID.unique(),
            day: startConverted.newDate,
            startTime: startConverted.newTime,
            endTime: endConverted.newTime
        };
        let next;
        if (editingLineupId) {
            next = lineupItems.map(i => i.id === editingLineupId ? item : i);
        } else {
            next = [...lineupItems, item];
        }

        setLineupItems(next);
        setNewLineupItem({ id: '', day: '', startTime: '', endTime: '', artist: '', stage: '', instagram: '', instagram2: '', instagram3: '', image: '' });
        setEditingLineupId(null);
        showNotification(editingLineupId ? 'Session modifiée' : 'Session ajoutée', 'success');
    };

    const handleGlobalSave = async () => {
        setIsSaving(true);
        try {
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
                bannedWords: editBannedWords,
                dropsAmount: editDropsAmount,
                dropsInterval: editDropsInterval,
                lots: dropsLots,
                botCommands: botCommands,
                festivalLogo: editFestivalLogo,
                lineup: JSON.stringify(lineupItems),
                tracklist: JSON.stringify(tracklist),
                moderators,
                bannedPseudos
            };
            await fetch('/api/takeover-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
            setSettings(updated);
            showNotification('Configuration enregistrée !', 'success');
        } catch (e) {
            showNotification('Erreur lors de la sauvegarde', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            fetchSettings();
            fetchShop();
            fetchInitialMessages();
            fetchPredefinedQuizzes();

            const savedPseudo = localStorage.getItem('chat_pseudo');
            const savedEmail = localStorage.getItem('chat_email');
            const savedCountry = localStorage.getItem('chat_country');

            if (savedPseudo) {
                setIsConnected(true);
                setLoginPseudo(savedPseudo);
                if (savedEmail) setLoginEmail(savedEmail);
                if (savedCountry) {
                    setLoginCountry(savedCountry);
                    setUserCountry(savedCountry);
                }
            } else if (isMod) {
                // Auto-connect admins/mods with defaults
                const defaultPseudo = "ALEX_FR1";
                localStorage.setItem('chat_pseudo', defaultPseudo);
                localStorage.setItem('chat_email', 'admin@dropsiders.fr');
                localStorage.setItem('chat_country', 'FR');
                setLoginPseudo(defaultPseudo);
                setLoginEmail('admin@dropsiders.fr');
                setLoginCountry('FR');
                setUserCountry('FR');
                setIsConnected(true);
            }

            if (!savedCountry && !isMod) fetchUserCountry();
            checkBanStatus();
            generateCaptcha();
        };
        init();

        // Appwrite Realtime Subscription
        const unsubscribe = client.subscribe(
            `databases.${DATABASE_ID}.collections.${COLLECTION_CHAT}.documents`,
            (response: any) => {
                if (response.events.includes('databases.*.collections.*.documents.*.create')) {
                    const msgText = response.payload.message;
                    if (msgText.startsWith('[SYSTEM]:')) {
                        // Handle System Commands
                        if (msgText.startsWith('[SYSTEM]:REACTION:')) {
                            const parts = msgText.replace('[SYSTEM]:REACTION:', '').split(':');
                            const msgId = parts[0];
                            const emoji = parts[1];
                            setChatMessages(prev => prev.map(m =>
                                m.id === msgId ? { ...m, reactions: { ...(m.reactions || {}), [emoji]: (m.reactions?.[emoji] || 0) + 1 } } : m
                            ));
                        }
                    } else {
                        setChatMessages(prev => {
                            if (prev.find(m => m.id === response.payload.$id)) return prev;
                            return [...prev, {
                                id: response.payload.$id,
                                pseudo: response.payload.pseudo,
                                message: response.payload.message,
                                color: response.payload.color,
                                time: response.payload.time,
                                country: response.payload.country,
                                bgColor: response.payload.bgColor,
                                xp: response.payload.xp || 0,
                                stage: response.payload.stage || 'stage1',
                                isModOnly: response.payload.isModOnly || false,
                                geo: response.payload.geo || '',
                                isPrems: response.payload.isPrems || false,
                                isHolo: response.payload.isHolo || false,
                                userTitle: response.payload.userTitle || '',
                                profileBorder: response.payload.profileBorder || 'none',
                                pseudoColor: response.payload.pseudoColor || '#ffffff',
                                specialFontStyle: response.payload.specialFontStyle || 'normal',
                                instagram: response.payload.instagram || ''
                            }];
                        });
                    }

                    // Update Hype Train
                    setHypeTrain(prev => {
                        let boost = 2; // Default per message
                        if (msgText.includes('donné') && msgText.includes('DROPS')) boost = 25; // Donation boost

                        const newProgress = prev.progress + boost;
                        if (newProgress >= 100) {
                            showNotification(`🔥 TRAIN DE LA HYPE NIVEAU ${prev.level + 1} ! 🥳`, 'success');
                            triggerFireworks();
                            return { active: true, level: prev.level + 1, progress: 0 };
                        }
                        return { ...prev, active: true, progress: newProgress };
                    });

                    if (msgText.startsWith('[SYSTEM]:')) {
                        const cmd = msgText.replace('[SYSTEM]:', '');
                        if (cmd === 'SLOW_ON') setSlowModeEnabled(true);
                        if (cmd === 'SLOW_OFF') setSlowModeEnabled(false);
                        if (cmd === 'CLEAR_QUIZ') {
                            setActiveQuiz(null);
                        } else if (cmd.startsWith('POLL:')) {
                            const pollData = JSON.parse(cmd.replace('POLL:', ''));
                            setActivePoll(pollData);
                            // If we already voted in a previous session of the same poll (question), keep userVoted
                            const lastVotedPoll = localStorage.getItem('last_voted_poll');
                            if (lastVotedPoll === pollData.question) {
                                setUserVoted(true);
                            } else {
                                setUserVoted(false);
                            }
                        } else if (cmd.startsWith('VOTE:')) {
                            const voteIdx = parseInt(cmd.replace('VOTE:', ''));
                            setActivePoll((prev: any) => {
                                if (!prev) return prev;
                                const next = JSON.parse(JSON.stringify(prev)); // Deep clone
                                if (next.options[voteIdx]) {
                                    next.options[voteIdx].votes = (next.options[voteIdx] || 0) + 1;
                                }
                                return next;
                            });
                        } else if (cmd.startsWith('QUIZ_VOTE:')) {
                            const choiceIdx = parseInt(cmd.replace('QUIZ_VOTE:', ''));
                            setActiveQuiz((prev: any) => {
                                if (!prev) return prev;
                                const next = { ...prev };
                                const newVotes = [...(prev.votes || [0, 0, 0, 0])];
                                if (choiceIdx >= 0 && choiceIdx < 4) {
                                    newVotes[choiceIdx] = (newVotes[choiceIdx] || 0) + 1;
                                }
                                next.votes = newVotes;
                                return next;
                            });
                        } else if (cmd === 'CLEAR_POLL') {
                            setActivePoll(null);
                        } else if (cmd === 'CONFETTI') {
                            triggerConfetti();
                        } else if (cmd === 'FIREWORKS') {
                            triggerFireworks();
                        } else if (cmd === 'RATE_SET') {
                            setShowRatingPrompt(true);
                        } else if (cmd.startsWith('ARRIVAL:')) {
                            const pseudo = cmd.replace('ARRIVAL:', '');
                            setNewArrival(pseudo);
                            setTimeout(() => setNewArrival(null), 5000);
                        } else if (cmd.startsWith('NEWS:')) {
                            // kept for backwards compat
                        } else if (cmd.startsWith('MARQUEE_UPDATE:')) {
                            try {
                                const parsed = JSON.parse(cmd.replace('MARQUEE_UPDATE:', ''));
                                setMarqueeItems(parsed);
                                setEditMarqueeItems(parsed);
                            } catch (e) { }
                        } else if (cmd === 'MATRIX') {
                            triggerMatrix();
                        } else if (cmd.startsWith('FLASH:')) {
                            triggerFlash(cmd.replace('FLASH:', ''), 'warn');
                        } else if (cmd.startsWith('BOSS_SPAWN')) {
                            setActiveBoss({ hp: 1000, maxHp: 1000, name: 'MEGABOT 3000' });
                            setTimeout(() => setActiveBoss(prev => {
                                if (prev && prev.hp > 0) showNotification("LE BOSS S'EST ÉCHAPPÉ ! 🚨", 'error');
                                return null;
                            }), 60000);
                        } else if (cmd.startsWith('BOSS_HIT:')) {
                            const dmg = parseInt(cmd.replace('BOSS_HIT:', ''));
                            setActiveBoss(prev => {
                                if (!prev) return null;
                                const nextHp = Math.max(0, prev.hp - dmg);
                                if (nextHp === 0 && prev.hp > 0) {
                                    showNotification("VICTOIRE ! PLUIE DE DROPS (+500) ! 🏆", 'success');
                                    triggerFireworks();
                                    setUserDrops(d => d + 500);
                                }
                                return { ...prev, hp: nextHp };
                            });
                        } else if (cmd === 'QTE_SPAWN') {
                            setQteActive(true);
                            setTimeout(() => setQteActive(false), 5000);
                        } else if (cmd.startsWith('MUTE_USER:')) {
                            const target = cmd.replace('MUTE_USER:', '');
                            const myPs = localStorage.getItem('chat_pseudo') || '';
                            if (target === myPs && !isMod && !vipsList.includes(myPs)) {
                                setIsMuted(true);
                                setMuteTimeLeft(60);
                                showNotification("🚫 TU AS ÉTÉ MUTE PENDANT 60S !", 'error');
                            }
                        } else if (cmd.startsWith('HEIST_START')) {
                            setActiveHeist({ participants: [], timeLeft: 30 });
                            setShowHeistOverlay(true);
                        } else if (cmd.startsWith('HEIST_JOIN:')) {
                            const data = JSON.parse(cmd.replace('HEIST_JOIN:', ''));
                            setActiveHeist(prev => prev ? { ...prev, participants: [...prev.participants, data] } : null);
                        } else if (cmd.startsWith('TTS:')) {
                            const [v, ...t] = cmd.replace('TTS:', '').split(':');
                            const voice = ['robot', 'monster', 'echo'].includes(v) ? v as any : 'normal';
                            const finalMsg = voice === 'normal' ? cmd.replace('TTS:', '') : t.join(':');
                            speakMessage(finalMsg, voice);
                        } else if (cmd.startsWith('QTE_SPAWN:')) {
                            const data = JSON.parse(cmd.replace('QTE_SPAWN:', ''));
                            setActiveQTE(data);
                            setTimeout(() => setActiveQTE(null), 10000);
                        } else if (cmd.startsWith('REACTION:')) {
                            const [msgId, emoji] = cmd.replace('REACTION:', '').split(':');
                            setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: { ...(m.reactions || {}), [emoji]: (m.reactions?.[emoji] || 0) + 1 } } : m));
                        } else if (cmd.startsWith('PURGE:')) {
                            const target = cmd.replace('PURGE:', '');
                            setChatMessages(prev => prev.filter(m => m.pseudo !== target));
                        } else if (cmd.startsWith('TAKEOVER_ALERT:')) {
                            const text = cmd.replace('TAKEOVER_ALERT:', '');
                            setTakeoverAlert({ text, type: 'alert' });
                            setTimeout(() => setTakeoverAlert(null), 5000);
                        } else if (cmd.startsWith('JACKPOT_SPAWN')) {
                            setActiveSlots({ id: Math.random().toString(), participants: [], timeLeft: 60 });
                        } else if (cmd.startsWith('JACKPOT_JOIN:')) {
                            const joiner = cmd.replace('JACKPOT_JOIN:', '');
                            setActiveSlots(prev => prev ? { ...prev, participants: [...new Set([...prev.participants, joiner])] } : null);
                        } else if (cmd.startsWith('CLASH_START:')) {
                            const data = JSON.parse(cmd.replace('CLASH_START:', ''));
                            setClashPoll({ active: true, teamA: data.teamA, teamB: data.teamB, votesA: [], votesB: [] });
                        } else if (cmd.startsWith('CLASH_VOTE:')) {
                            const [team, ps] = cmd.replace('CLASH_VOTE:', '').split(':');
                            setClashPoll(prev => {
                                if (!prev) return null;
                                const next = { ...prev };
                                if (team === 'A') next.votesA = [...new Set([...next.votesA, ps])];
                                else next.votesB = [...new Set([...next.votesB, ps])];
                                return next;
                            });
                        } else if (cmd.startsWith('TRACKLIST_SET_NEW:')) {
                            try {
                                const nextSet = JSON.parse(cmd.replace('TRACKLIST_SET_NEW:', ''));
                                setTracklist(prev => [nextSet, ...prev]);
                            } catch (e) { }
                        } else if (cmd.startsWith('TRACKLIST_TRACK_NEW:')) {
                            try {
                                const { setId, track } = JSON.parse(cmd.replace('TRACKLIST_TRACK_NEW:', ''));
                                setTracklist(prev => prev.map(s => s.id === setId ? { ...s, tracks: [...s.tracks, track] } : s));
                            } catch (e) { }
                        }
                        else if (cmd === 'LEGENDS_WALL') {
                            setShowLegendsWall(true);
                            setTimeout(() => setShowLegendsWall(false), 15000);
                        }
                    } else if (msgText.startsWith('[QUIZ_START]:')) {
                        const content = msgText.replace('[QUIZ_START]:', '');
                        const parts = content.split('|').map((p: string) => p.trim());
                        if (parts.length >= 6) {
                            setActiveQuiz({
                                question: parts[0],
                                options: [parts[1], parts[2], parts[3], parts[4]],
                                correct: parts[5],
                                votes: [0, 0, 0, 0]
                            });
                            setUserHasAnswered(false);
                            setQuizTimeLeft(30);
                        }
                    }

                    // Mention detection
                    const myPseudo = localStorage.getItem('chat_pseudo');
                    if (myPseudo && msgText.toLowerCase().includes(`@${myPseudo.toLowerCase()}`)) {
                        setMentionNotify(true);
                        pingAudio.play().catch(() => { });
                        setTimeout(() => setMentionNotify(false), 5000);
                    }
                }

                if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
                    setChatMessages(prev => prev.filter(m => m.id !== response.payload.$id));
                }
            }
        );

        return () => unsubscribe();
    }, []);

    // ⏱️ Quiz Auto-Timer (30s)
    useEffect(() => {
        if (activeQuiz && activeQuiz.question) {
            const timer = setTimeout(() => {
                setActiveQuiz(null);
            }, 30000);
            return () => clearTimeout(timer);
        }
    }, [activeQuiz]);

    // 🗓️ Auto-Cleanup Planning (DÉSACTIVÉ : On garde tout l'historique de la journée)
    /*
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            
            setLineupItems(prev => {
                let shouldUpdate = false;
                const filtered = prev.filter(item => {
                    if (!item.endTime || !item.day) return true;
                    
                    try {
                        const normalizedEnd = item.endTime.toLowerCase().replace('h', ':').replace(' ', '').replace('.', ':');
                        const endParts = normalizedEnd.split(':');
                        const endH = parseInt(endParts[0] || "0", 10);
                        const endM = parseInt(endParts[1] || "0", 10);
                        
                        let startH = 12;
                        if (item.startTime) {
                            const startStr = item.startTime.toLowerCase().replace('h', ':').replace(' ', '').replace('.', ':');
                            startH = parseInt(startStr.split(':')[0] || "12", 10);
                        }

                        const dateParts = item.day.split('-');
                        const year = parseInt(dateParts[0], 10);
                        const month = parseInt(dateParts[1], 10) - 1; 
                        const day = parseInt(dateParts[2], 10);
                        
                        const endDateTime = new Date(year, month, day, endH, endM, 0);

                        if (!isNaN(startH) && endH < startH) {
                            endDateTime.setDate(endDateTime.getDate() + 1);
                        }
                        
                        const isFuture = endDateTime > now;
                        if (!isFuture) shouldUpdate = true;
                        
                        return isFuture;
                    } catch (e) {
                        return true;
                    }
                });
                
                return shouldUpdate ? filtered : prev;
            });
        }, 60000); 
        return () => clearInterval(interval);
    }, []);
    */

    // 🏆 Top Talkers Tracking
    useEffect(() => {
        const counts: { [pseudo: string]: number } = {};
        chatMessages.forEach(m => {
            if (m.pseudo && !m.pseudo.startsWith('BOT_')) {
                counts[m.pseudo] = (counts[m.pseudo] || 0) + 1;
            }
        });
        const sorted = Object.entries(counts)
            .map(([pseudo, count]) => ({ pseudo, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        setTopTalkers(sorted);
    }, [chatMessages]);

    const generateCaptcha = () => {
        const a = Math.floor(Math.random() * 10);
        const b = Math.floor(Math.random() * 10);
        setCaptchaChallenge({ q: `${a} + ${b} = ?`, a: a + b });
    };

    const fetchUserCountry = async () => {
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            if (data.country_code) setUserCountry(data.country_code);
            if (data.city) setUserCity(`📍 ${data.city.toUpperCase()}`);
        } catch (e) { console.error("Could not fetch country", e); }
    };

    const checkBanStatus = async () => {
        const pseudo = localStorage.getItem('chat_pseudo');
        if (!pseudo) return;
        try {
            const res = await databases.listDocuments(DATABASE_ID, COLLECTION_BANS, [
                Query.equal('pseudo', pseudo)
            ]);
            if (res.documents.length > 0) setIsBanned(true);
        } catch (e) { console.error("Ban check failed", e); }
    };

    const fetchInitialMessages = async () => {
        try {
            const res = await databases.listDocuments(DATABASE_ID, COLLECTION_CHAT, [
                Query.orderDesc('$createdAt'),
                Query.limit(50)
            ]);
            const msgs = res.documents
                .filter(doc => !doc.message?.startsWith('[SYSTEM]:'))
                .reverse()
                .map(doc => ({
                    id: doc.$id,
                    pseudo: doc.pseudo,
                    message: doc.message,
                    color: doc.color,
                    time: doc.time,
                    country: doc.country,
                    bgColor: doc.bgColor,
                    stage: doc.stage || 'stage1',
                    isModOnly: doc.isModOnly || false,
                    isPrems: doc.isPrems || false,
                    isHolo: doc.isHolo || false,
                    profileBorder: doc.profileBorder || 'none',
                    pseudoColor: doc.pseudoColor || '#ffffff',
                    specialFontStyle: doc.specialFontStyle || 'normal',
                    instagram: doc.instagram || ''
                }));
            setChatMessages(msgs);
        } catch (e) { console.error("Error fetching initial chat messages:", e); }
    };

    const fetchPredefinedQuizzes = async () => {
        try {
            const res = await fetch('/api/quiz/active');
            if (res.ok) {
                const data = await res.json();
                setPredefinedQuizzes(Array.isArray(data) ? data.filter((q: any) => ['QCM', 'BLIND_TEST', 'IMAGE'].includes(q.type)) : []);
            }
        } catch (e) {
            console.error("Error fetching quizzes:", e);
        }
    };

    const fetchShop = async () => {
        try {
            const res = await fetch('/api/shop');
            if (res.ok) {
                const data = await res.json();
                setShopItems(Array.isArray(data) ? data : []);
            }
        } catch (e) { console.error("Error loading shop:", e); }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/takeover-settings');
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setSettings(data);
                    setEditTitle(data.title);
                    setEditStreams(data.streams || []);
                    setEditActiveStreamId(data.activeStreamId || '');
                    setEditAnnText(data.tickerText);
                    setEditAnnEnabled(data.showTickerBanner);
                    setEditTickerBg(data.tickerBgColor || '#ff0033');
                    setEditTickerTextC(data.tickerTextColor || '#ffffff');
                    setEditStatus(data.status);
                    try {
                        const parsed = JSON.parse(data.lineup || '[]');
                        setLineupItems(Array.isArray(parsed) ? parsed : []);
                    } catch (e) { setLineupItems([]); }
                    if (data.lots) setDropsLots(data.lots);
                    if (data.dropsAmount) setEditDropsAmount(data.dropsAmount);
                    if (data.dropsInterval) setEditDropsInterval(data.dropsInterval);
                    if (data.instagramLink) setEditInsta(data.instagramLink);
                    if (data.tiktokLink) setEditTiktok(data.tiktokLink);
                    if (data.youtubeLink) setEditYoutube(data.youtubeLink);
                    if (data.twitterLink) setEditTwitter(data.twitterLink);
                    if (data.botCommands) setBotCommands(data.botCommands);
                    if (data.tracklist) {
                        try {
                            const parsed = JSON.parse(data.tracklist);
                            setTracklist(Array.isArray(parsed) ? parsed : []);
                        } catch (e) { setTracklist([]); }
                    }
                    if (data.festivalLogo) setEditFestivalLogo(data.festivalLogo);
                    if (data.sponsorText) setEditSponsorText(data.sponsorText);
                    if (data.sponsorLink) setEditSponsorLink(data.sponsorLink);
                    if (data.showSponsorBanner !== undefined) setEditShowSponsorBanner(data.showSponsorBanner);
                }
            }
        } catch (e) { console.error("Error loading settings:", e); }
    };

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginPseudo.trim() || !loginEmail.trim() || !loginCountry.trim() || !captchaInput.trim()) {
            showNotification('Veuillez remplir tous les champs', 'error');
            return;
        }

        localStorage.setItem('chat_pseudo', loginPseudo.trim());
        localStorage.setItem('chat_email', loginEmail.trim());
        localStorage.setItem('chat_country', loginCountry);
        localStorage.setItem('user_instagram', loginInstagram.trim());
        localStorage.setItem('user_pseudo_color', loginPseudoColor);

        if (parseInt(captchaInput) !== captchaChallenge?.a) {
            showNotification('CAPTCHA INCORRECT ! 🤖', 'error');
            generateCaptcha();
            return;
        }

        setUserCountry(loginCountry);
        setUserInstagram(loginInstagram.trim());
        setPseudoColor(loginPseudoColor);
        setIsConnected(true);

        if (subscribeNewsletter) {
            try {
                await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: loginEmail, firstName: loginPseudo })
                });
            } catch (e) { console.error("Newsletter sub failed", e); }
        }

        showNotification('Connexion réussie !', 'success');
    };

    const handleImageOCR = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setOcrImage(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleOcrCropComplete = async (croppedImage: string) => {
        setOcrImage(null);
        setIsScanningImage(true);
        setScanProgress(0);

        try {
            const result = await Tesseract.recognize(croppedImage, 'eng+fra', {
                logger: (m: any) => {
                    if (m.status === 'recognizing text') {
                        setScanProgress(Math.floor(m.progress * 100));
                    }
                }
            });

            const text = result.data.text;
            console.log("OCR Debug:", text);

            const lines = text.split('\n');
            const foundArtists: string[] = [];
            const timeRangeRegex = /(\d{1,2}:\d{2})\s*([-–\D—]+)\s*(\d{1,2}:\d{2})/; // Improved regex for various dashes

            let currentText = '';
            lines.forEach((line: string) => {
                const trimmed = line.trim();
                if (!trimmed) return;

                // Cleanup common OCR artifacts
                const cleanLine = trimmed.replace(/[|] /g, '');

                const timeMatch = cleanLine.match(timeRangeRegex);
                if (timeMatch) {
                    let artist = currentText.trim();
                    if (!artist) {
                        // Sometimes the artist is on the same line as time
                        artist = cleanLine.replace(timeMatch[0], '').trim();
                    }
                    if (artist && artist.length > 2) {
                        const lineText = `${timeMatch[1]} - ${artist}`;
                        foundArtists.push(scanStage ? `[${scanStage}] ${lineText}` : lineText);
                    }
                    currentText = '';
                } else {
                    if (trimmed.length > 2 && !trimmed.match(/^\d+$/)) {
                        currentText += ' ' + trimmed;
                    }
                }
            });

            if (foundArtists.length > 0) {
                const newText = (bulkText ? bulkText + '\n' : '') + foundArtists.join('\n');
                setBulkText(newText);
                setBulkPreview(parseBulkSchedule(newText));
                showNotification(`${foundArtists.length} artistes détectés !`, 'success');
            } else {
                showNotification("Aucun artiste détecté. Cadrez bien les horaires.", 'error');
            }
        } catch (error) {
            console.error(error);
            showNotification("Erreur lors de l'analyse", 'error');
        } finally {
            setIsScanningImage(false);
            setScanProgress(0);
        }
    };

    const handleAddSet = async () => {
        if (!newSetArtist) return;
        const nextSet: TracklistSet = {
            id: Date.now().toString(),
            artist: newSetArtist.toUpperCase(),
            startTime: newSetTime || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            tracks: [],
            stage: activeStage
        };
        const newList = [nextSet, ...tracklist];
        setTracklist(newList);
        setNewSetArtist('');
        setNewSetTime('');
        
        // Auto-save settings if admin/mod
        if (isMod) {
            const updated = { ...settings, tracklist: JSON.stringify(newList) };
            try {
                await fetch('/api/takeover-settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updated)
                });
                setSettings(updated);
            } catch (e) {
                console.error("Auto-save failed", e);
            }
        }

        // Broadcast
        await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
            pseudo: "BOT_SYSTEM",
            message: `[SYSTEM]:TRACKLIST_SET_NEW:${JSON.stringify(nextSet)}`,
            color: "text-neon-cyan",
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            country: "FR"
        });
        showNotification("Nouveau set ajouté !", "success");
    };

    const handleSuggestTrack = async (setId: string) => {
        if (!trackSuggestion.trim()) return;
        const pseudo = localStorage.getItem('chat_pseudo') || "Anonyme";
        const newTrack: TrackItem = {
            id: Date.now().toString(),
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            title: trackSuggestion.trim().toUpperCase(),
            user: pseudo
        };

        const newList = tracklist.map(s => s.id === setId ? { ...s, tracks: [...s.tracks, newTrack] } : s);
        setTracklist(newList);
        setTrackSuggestion('');

        // 1. Broadcast Realtime via Appwrite (Chat)
        try {
            await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                pseudo: "BOT_SYSTEM",
                message: `[SYSTEM]:TRACKLIST_TRACK_NEW:${JSON.stringify({ setId, track: newTrack })}`,
                color: "text-neon-cyan",
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                stage: activeStage,
                country: "FR"
            });
        } catch (e) {
            console.error("Broadcast failed", e);
        }

        // 2. Persist to Backend JSON (Proxy) - NO isMod check to allow all viewers
        try {
            const updated = { ...settings, tracklist: JSON.stringify(newList) };
            await fetch('/api/takeover-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
            setSettings(updated);
            showNotification(`MERCI @${pseudo} ! Track identifiée 🔥`, "success");
        } catch (e) {
            console.error("Save failed", e);
            showNotification("Erreur lors de l'enregistrement", "error");
        }
    };





    const clearChat = async () => {
        setConfirmModal({
            show: true,
            title: 'Vider le Chat',
            text: 'Voulez-vous vraiment supprimer définitivement tous les messages du chat ?',
            onConfirm: async () => {
                try {
                    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_CHAT, [Query.limit(100)]);
                    for (const doc of res.documents) {
                        await databases.deleteDocument(DATABASE_ID, COLLECTION_CHAT, doc.$id);
                    }
                    setChatMessages([]);
                    showNotification('Chat vidé avec succès !', 'success');
                } catch (e) {
                    console.error("Clear chat error:", e);
                    showNotification('Erreur lors du nettoyage', 'error');
                }
                setConfirmModal(null);
            }
        });
    };

    const showNotification = (message: string, type: 'success' | 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };




    const fetchGifs = async (query: string) => {
        setGifSearch(query);
        if (!query.trim()) {
            setGifResults([
                'https://i.giphy.com/l41lTfuxVpT6DhjPy.gif',
                'https://i.giphy.com/3o7TKMGpxVfPtoog3m.gif',
                'https://i.giphy.com/clotJgshs6nUUXf2i6.gif'
            ]);
            return;
        }

        try {
            const apiKey = import.meta.env.VITE_GIPHY_API_KEY || '';
            const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=12&rating=g`);
            const data = await res.json();
            if (data.data) {
                // Utilisation du format i.giphy.com/${id}.gif qui est plus robuste
                setGifResults(data.data.map((g: any) => `https://i.giphy.com/${g.id}.gif`));
            }
        } catch (e) {
            console.error("Giphy fetch error:", e);
        }
    };

    const handleSendMessage = async (customText?: string) => {
        const messageToSend = customText || newMessage;
        if (!messageToSend.trim() || isBanned || isMuted || isRouletteTimeout) {
            if (isRouletteTimeout) showNotification("TIMEOUT (ROULETTE) 🚫", 'error');
            else if (isMuted) showNotification(`MUTE : Encore ${muteTimeLeft}s`, 'error');
            return;
        }

        const price = settings.highlightPrice || 100;
        if (isHighlightChecked && userDrops < price) {
            showNotification(`Pas assez de DROPS (${price} requis)`, 'error');
            return;
        }

        const pseudo = localStorage.getItem('chat_pseudo') || (isMod ? "ALEX_FR1" : "VISITEUR");
        let messageText = messageToSend.trim();

        // 🚨 Auto-Mod Intelligence
        if (!isMod) {
            const badWords = ['pd', 'fdp', 'salope', 'connard', 'pute', 'enculé', 'merde', 'tg', 'ta gueule', 'hitler', 'nazi'];
            if (badWords.some(w => messageText.toLowerCase().includes(w))) {
                const warnings = (userWarnings[pseudo] || 0) + 1;
                setUserWarnings(prev => ({ ...prev, [pseudo]: warnings }));

                if (warnings >= 3) {
                    handleBanUser(pseudo);
                    showNotification("VOUS AVEZ ÉTÉ BANNI : 3 AVERTISSEMENTS (LANGAGE)", 'error');
                    return;
                }

                showNotification(`ALERTE : Langage inapproprié (${warnings}/3) ⚠️`, 'error');
                return;
            }
            if (/(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9-]+\.[a-z]{2,10}(\/|$))/gi.test(messageText)) {
                showNotification("MESSAGE BLOQUÉ : Liens interdits", 'error');
                return;
            }
            const capsCount = (messageText.match(/[A-Z]/g) || []).length;
            if (messageText.length > 10 && capsCount > messageText.length * 0.7) {
                showNotification("MESSAGE BLOQUÉ : Trop de MAJUSCULES", 'error');
                return;
            }

            // Slow Mode Logic
            const now = Date.now();
            if (slowModeEnabled) {
                const diff = (now - lastMessageTime) / 1000;
                if (diff < 10) {
                    showNotification(`MODE LENT : Attendez ${Math.ceil(10 - diff)}s ➡️`, 'error');
                    return;
                }
            }
            setLastMessageTime(now);
        }

        // Command Interception
        if (messageText.startsWith('!')) {
            const cmdParts = messageText.split(' ');
            const mainCmd = cmdParts[0].toLowerCase();

            if (mainCmd === '!roulette') {
                const dead = Math.floor(Math.random() * 6) === 0;
                if (dead) {
                    messageText = `🚫 ROULETTE RUSSE : @${pseudo} a perdu ! MUTE 60s !`;
                    setIsRouletteTimeout(true);
                    setIsMuted(true);
                    setMuteTimeLeft(60);
                } else {
                    messageText = `🔫 ROULETTE RUSSE : @${pseudo} a survécu... pour l'instant.`;
                }
            } else if (mainCmd === '!clash' && isMod) {
                const [teamA, teamB] = messageText.replace('!clash ', '').split(' vs ');
                if (teamA && teamB) messageText = `[SYSTEM]:CLASH_START:${JSON.stringify({ teamA, teamB })}`;
                else { showNotification("Usage: !clash TeamA vs TeamB", 'error'); return; }
            } else if (mainCmd === '!top') {
                const tText = topTalkers.slice(0, 3).map((t, i) => `${i + 1}. ${t.pseudo}`).join(' | ');
                messageText = `👑 TOP TALKERS : ${tText || 'Aucun message.'}`;
            } else if (mainCmd === '!legends' && isMod) {
                messageText = `[SYSTEM]:LEGENDS_WALL`;
            } else if (mainCmd === '!dé') {
                const res = Math.floor(Math.random() * 20) + 1;
                if (res === 20) {
                    setUserDrops(prev => prev + 1000);
                    messageText = `🎲 DÉ DE LA DESTINÉE : CRITIQUE ! @${pseudo} gagne 1000 DROPS !`;
                } else if (res === 1) {
                    messageText = `🎲 DÉ DE LA DESTINÉE : ÉCHEC CRITIQUE ! @${pseudo} est banni... (nan je rigole)`;
                } else {
                    messageText = `🎲 DÉ DE LA DESTINÉE : Résultat ${res}.`;
                }
            } else if (mainCmd === '!lineup') {
                const artistQuery = cmdParts.slice(1).join(' ').toLowerCase();
                if (artistQuery) {
                    const match = lineupItems.find(item => item.artist.toLowerCase().includes(artistQuery));
                    const streamMatch = settings.streams?.find((s: any) => s.name.toLowerCase().includes(artistQuery));

                    if (match) {
                        messageText = `🗓️ LINEUP : @${pseudo}, ${match.artist} passera sur ${match.stage} à ${match.startTime} (${match.day}).`;
                    } else if (streamMatch) {
                        messageText = `🗓️ LIVE : @${pseudo}, ${streamMatch.name} est disponible dans la liste des flux !`;
                    } else {
                        showNotification(`Artiste "${artistQuery}" non trouvé dans la lineup.`, 'error');
                        return;
                    }
                } else {
                    messageText = `🗓️ LINEUP : @${pseudo}, consulte l'onglet PLANNING pour voir toute la programmation !`;
                }
            } else if (mainCmd === '!insta') {
                const query = cmdParts.slice(1).join(' ');
                messageText = query
                    ? `📸 INSTAGRAM : @${pseudo}, voici le profil de ${query} -> https://instagram.com/${query.replace('@', '')}`
                    : `📸 INSTAGRAM : @${pseudo}, suis-nous sur @dropsiders.fr -> https://instagram.com/dropsiders.fr`;
            } else if (mainCmd === '!holo') {
                if (userDrops < 3000) {
                    showNotification("Pas assez de Drops ! (3000 requis)", 'error');
                    return;
                }
                setUserDrops(prev => prev - 3000);
                localStorage.setItem('user_holo_pseudo', 'true');
                showNotification("PSEUDO HOLOGRAPHIQUE ACTIVÉ ! ✨", 'success');
                messageText = `✨ @${pseudo} vient de débloquer le PSEUDO HOLOGRAPHIQUE !`;
            } else if (mainCmd === '!purge' && isMod) {
                const target = cmdParts[1]?.replace('@', '') || '';
                if (target) {
                    handlePurgeTarget(target);
                }
            } else if (mainCmd === '!matrix') {
                messageText = `[SYSTEM]:MATRIX`;
            } else if (mainCmd === '!flash' && isMod) {
                messageText = `[SYSTEM]:FLASH:${messageText.replace('!flash ', '')}`;
            } else if (mainCmd === '!takeover' && isMod) {
                messageText = `[SYSTEM]:TAKEOVER_ALERT:${messageText.replace('!takeover ', '')}`;
            } else if (mainCmd === '!boss' && isMod) {
                messageText = `[SYSTEM]:BOSS_SPAWN`;
            } else if (mainCmd === '!braquage') {
                const amount = parseInt(cmdParts[1]) || 50;
                if (userDrops < amount) {
                    showNotification("Pas assez de Drops !", 'error');
                    return;
                }
                setUserDrops(prev => prev - amount);
                messageText = `[SYSTEM]:HEIST_JOIN:${JSON.stringify({ pseudo, bet: amount })}`;
            } else if (mainCmd === '!heist' && isMod) {
                messageText = `[SYSTEM]:HEIST_START`;
            } else if (mainCmd === '!hit' && activeBoss) {
                const dmg = Math.floor(Math.random() * 25) + 5;
                messageText = `[SYSTEM]:BOSS_HIT:${dmg}`;
            } else if (mainCmd === '!vip' && isMod) {
                const userVIP = cmdParts[1]?.replace('@', '').trim();
                if (userVIP) {
                    setVipsList(prev => [...prev.filter(u => u !== userVIP), userVIP]);
                    showNotification(`${userVIP} a été promu VIP !`, 'success');
                }
                setNewMessage('');
                return;
            } else if (mainCmd === '!unvip' && isMod) {
                const userVIP = cmdParts[1]?.replace('@', '').trim();
                if (userVIP) {
                    setVipsList(prev => prev.filter(u => u !== userVIP));
                    showNotification(`${userVIP} n'est plus VIP.`, 'success');
                }
                setNewMessage('');
                return;
            } else if (mainCmd === '!vol') {
                const target = cmdParts[1]?.replace('@', '').trim();
                if (!target || target.toLowerCase() === pseudo.toLowerCase()) {
                    showNotification("Cible invalide !", 'error');
                    return;
                }
                if (userDrops < 100) {
                    showNotification("Minimum 100 DROPS requis pour voler !", 'error');
                    return;
                }
                const success = Math.random() > 0.6;
                const amount = Math.floor(Math.random() * 200) + 50;
                if (success) {
                    setUserDrops(prev => prev + amount);
                    messageText = `💸 @${pseudo} a volé ${amount} DROPS à @${target} !`;
                } else {
                    setUserDrops(prev => Math.max(0, prev - amount));
                    messageText = `❌ @${pseudo} a été attrapé ! Retrait de ${amount} DROPS.`;
                }
            } else if (mainCmd === '!dons') {
                const target = cmdParts[1]?.replace('@', '');
                const amount = parseInt(cmdParts[2]);
                if (target && !isNaN(amount) && amount > 0 && userDrops >= amount) {
                    setUserDrops(prev => prev - amount);
                    messageText = `🎁 @${pseudo} a donné ${amount} DROPS à @${target} !`;
                } else {
                    showNotification("Don invalide ou fonds insuffisants", "error");
                    return;
                }
            } else if (mainCmd === '!rps') {
                const choices = ['pierre', 'papier', 'ciseau'];
                const userChoice = cmdParts[1]?.toLowerCase();
                if (choices.includes(userChoice)) {
                    const botChoice = choices[Math.floor(Math.random() * 3)];
                    const win = (userChoice === 'pierre' && botChoice === 'ciseau') || (userChoice === 'papier' && botChoice === 'pierre') || (userChoice === 'ciseau' && botChoice === 'papier');
                    const draw = userChoice === botChoice;
                    const result = draw ? 'ÉGALITÉ' : win ? 'GAGNÉ (+50 DROPS)' : 'PERDU';
                    if (win) setUserDrops(prev => prev + 50);
                    messageText = `✊ @${pseudo} joue ${userChoice} vs BOT ${botChoice} -> ${result}`;
                } else {
                    showNotification("Usage: !rps [pierre|papier|ciseau]", "error");
                    return;
                }
            } else if (mainCmd === '!slow' && isMod) {
                const toggle = cmdParts[1]?.toLowerCase();
                messageText = toggle === 'on' ? '[SYSTEM]:SLOW_ON' : '[SYSTEM]:SLOW_OFF';
            } else if (mainCmd === '!poll' && isMod) {
                const pollStr = messageText.replace('!poll ', '');
                const [question, ...options] = pollStr.split('|').map(s => s.trim());
                if (question && options.length >= 2) {
                    const pollData = { question, options: options.map(o => ({ text: o, votes: 0 })), active: true };
                    messageText = `[SYSTEM]:POLL:${JSON.stringify(pollData)}`;
                }
            } else if (mainCmd === '!pollstop' && isMod) {
                messageText = '[SYSTEM]:CLEAR_POLL';
            } else if (mainCmd === '!quizz' && isMod) {
                const args = messageText.replace('!quizz', '').trim();
                let quizMsg = '';
                if (args) {
                    quizMsg = args;
                } else {
                    if (predefinedQuizzes.length === 0) {
                        showNotification("Aucun QCM chargé !", "error");
                        return;
                    }
                    const randomQ = predefinedQuizzes[Math.floor(Math.random() * predefinedQuizzes.length)];
                    const correctIdx = randomQ.options.findIndex((o: string) => o === randomQ.correctAnswer) + 1;
                    quizMsg = `${randomQ.question} | ${randomQ.options[0] || '?'} | ${randomQ.options[1] || '?'} | ${randomQ.options[2] || '?'} | ${randomQ.options[3] || '?'} | ${correctIdx || 1}`;
                }
                messageText = `[QUIZ_START]:${quizMsg}`;
            } else if (mainCmd === '!stop' && isMod) {
                messageText = '[SYSTEM]:CLEAR_QUIZ';
            } else if (mainCmd === '!mute') {
                const target = cmdParts[1]?.replace('@', '').trim();
                const cost = 5000;
                if (target && userDrops >= cost) {
                    setUserDrops(prev => prev - cost);
                    messageText = `[SYSTEM]:MUTE_USER:${target}`;
                    showNotification(`MUTE ACHETÉ pour @${target} ! (-5000 Drops)`, 'success');
                } else {
                    showNotification("Besoin de 5000 DROPS pour mute !", 'error');
                    return;
                }
            } else if (mainCmd === '!pacman') {
                messageText = `👾 WAKA WAKA ! [PACMAN INCOMING]`;
                triggerPACMAN();
            } else if (mainCmd === '!jackpot' && isMod) {
                messageText = `[SYSTEM]:JACKPOT_SPAWN`;
            } else if (mainCmd === '!ticket' && activeSlots) {
                if (userDrops < 50) {
                    showNotification("Pas assez de Drops ! (50 requis)", 'error');
                    return;
                }
                setUserDrops(prev => prev - 50);
                messageText = `[SYSTEM]:JACKPOT_JOIN:${pseudo}`;
                showNotification("Ticket de Jackpot acheté ! 🎰", 'success');
            } else if (mainCmd === '!dé') {
                const roll = Math.floor(Math.random() * 6) + 1;
                const outcomes = [
                    { msg: `🎲 @${pseudo} lance le Dé de la Destinée... et gagne 100 DROPS !`, action: () => setUserDrops(prev => prev + 100) },
                    { msg: `🎲 @${pseudo} lance le Dé de la Destinée... et perd 50 DROPS ! 📉`, action: () => setUserDrops(prev => Math.max(0, prev - 50)) },
                    { msg: `🎲 @${pseudo} lance le Dé de la Destinée... et se fait MUTE 10s pour l'audace ! 👮`, action: () => { setIsMuted(true); setMuteTimeLeft(10); } },
                    { msg: `🎲 @${pseudo} lance le Dé de la Destinée... et obtient un bonus d'XP ! 📈`, action: () => setUserXP(prev => prev + 50) },
                    { msg: `🎲 @${pseudo} lance le Dé de la Destinée... et ne gagne absolument rien. Dommage !`, action: () => { } },
                    { msg: `🎲 @${pseudo} lance le Dé de la Destinée... et déclenche des CONFETTIS ! 🥳`, action: () => triggerConfetti() }
                ];
                const finalOutcome = outcomes[roll - 1];
                finalOutcome.action();
                messageText = finalOutcome.msg;
            } else if (mainCmd === '!qte' && isMod) {
                messageText = `[SYSTEM]:QTE_SPAWN`;
            }

            // Dynamic Bot Commands
            const customCmd = botCommands.find(c => c.command.toLowerCase() === mainCmd);
            if (customCmd) {
                messageText = `[BOT]: ${customCmd.response}`;
            }
        }

        // 🤖 ChatGPT Dropsiders Bot-4 Logic
        if (messageText.toLowerCase().includes('@botdrops') || messageText.toLowerCase().includes('@bot')) {
            const lowMsg = messageText.toLowerCase();
            setTimeout(async () => {
                let botReply = '';
                if (lowMsg.includes('blague') || lowMsg.includes('joke')) {
                    botReply = "Pourquoi les plongeurs plongent-ils toujours en arrière et jamais en avant ? Parce que sinon ils tombent dans le bateau ! 😂";
                } else if (lowMsg.includes('festival') || lowMsg.includes('ambiance')) {
                    botReply = "L'ambiance est au max ici ! On est les Dropsiders ou on l'est pas ? 🔥";
                } else if (lowMsg.includes('qui es-tu')) {
                    botReply = "Je suis BotDrops-4, ton IA préférée, plus rapide qu'un mix d'AlexFR ! 🤖";
                } else {
                    botReply = "Bip Boup... Je t'écoute ! Dis-moi tout. 💬";
                }

                await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                    pseudo: "DROPS_BOT_4",
                    message: botReply,
                    color: "text-neon-cyan",
                    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    country: "FR",
                    stage: activeStage
                });
            }, 1000);
        }

        // 💡 Intelligent FAQ Assistant
        const faqTriggers = ['quand', 'heure', 'artist', 'dj', 'lineup', 'programme'];
        if (faqTriggers.some(t => messageText.toLowerCase().includes(t)) && !messageText.startsWith('!')) {
            setTimeout(async () => {
                const nextArtist = lineupItems[0]?.artist || "Bientôt annoncé";
                const botReply = `🤖 [FAQ]: @${pseudo}, consulte l'onglet PLANNING pour voir toute la programmation. Prochainement : ${nextArtist} !`;
                await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                    pseudo: "BOT_FAQ",
                    message: botReply,
                    color: "text-amber-500",
                    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    country: "FR",
                    stage: activeStage
                });
            }, 2000);
        }

        // 👾 Pixel Art PACMAN trigger
        if (messageText.toLowerCase().includes('pacman')) {
            triggerPACMAN();
        }

        // Quiz participation (non-commands)
        if (activeQuiz && !isMod && !userHasAnswered && /^[1-4]$/.test(messageText)) {
            const choiceIdx = parseInt(messageText) - 1;
            setUserHasAnswered(true);
            await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                pseudo: "BOT_SYSTEM",
                message: `[SYSTEM]:QUIZ_VOTE:${choiceIdx}`,
                color: "text-neon-purple",
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                country: "FR",
                stage: activeStage
            });

            if (messageText === activeQuiz.correct) {
                const reward = 100;
                setUserDrops(prev => {
                    const next = prev + reward;
                    localStorage.setItem('user_drops', next.toString());
                    return next;
                });
                showNotification(`BRAVO ! +${reward} DROPS !`, 'success');
            } else {
                showNotification(`MAUVAISE RÉPONSE ! C'était le n°${activeQuiz.correct}`, 'error');
            }
        }

        try {
            if (isHighlightChecked) {
                setUserDrops(prev => prev - price);
                localStorage.setItem('user_drops', (userDrops - price).toString());
                setHypeTrain(prev => ({ ...prev, progress: Math.min(100, prev.progress + 10), active: true }));
            }

            // Award PREMS badge locally (Logic retained for notification, but not sent to DB)
            if (!isPremsAwarded && chatMessages.length === 0) {
                setIsPremsAwarded(true);
            }

            await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                pseudo: pseudo,
                message: messageText,
                color: isHighlightChecked ? highlightColor : (isMod ? "text-neon-red" : pseudoColor),
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                country: userCountry || "FR",
                stage: activeStage,
                isModOnly: isModChat
            });

            // Leveling System
            if (!isMod) {
                const xpGain = 10;
                const nextXP = userXP + xpGain;
                const nextLevel = Math.floor(Math.sqrt(nextXP / 100)) + 1;
                setUserXP(nextXP);
                localStorage.setItem('user_xp', nextXP.toString());
                if (nextLevel > userLevel) {
                    setUserLevel(nextLevel);
                    localStorage.setItem('user_level', nextLevel.toString());
                    showNotification(`🌟 NIVEAU SUPÉRIEUR ! Niveau ${nextLevel} !`, 'success');
                    unlockAchievement(`Niveau ${nextLevel}`);
                }
            }

            setNewMessage('');
            setIsHighlightChecked(false);
            setLastMessageTime(Date.now());

        } catch (e: any) {
            console.error("Appwrite send error details:", e);
            showNotification(`Erreur d'envoi: ${e.message || 'Problème serveur'}`, 'error');
        }
    };

    const handleBanUser = async (pseudo: string) => {
        if (!isAdmin) return;
        try {
            await databases.createDocument(DATABASE_ID, COLLECTION_BANS, ID.unique(), { pseudo });
            showNotification(`Utilisateur ${pseudo} banni !`, 'success');
        } catch (e) {
            showNotification('Erreur bannissement', 'error');
        }
    };

    const deleteMessage = async (id: string) => {
        if (!isMod) return;
        try {
            await databases.deleteDocument(DATABASE_ID, COLLECTION_CHAT, id);
        } catch (e) {
            showNotification('Erreur suppression', 'error');
        }
    };

    const fluxCurrentArtist = lineupItems.find(item => {
        if (!item.day || !item.startTime || !item.endTime) return false;
        const now = new Date();
        const curDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        if (item.day !== curDay) return false;

        const [sh, sm] = item.startTime.replace('.', ':').replace('h', ':').split(':').map(Number);
        const [eh, em] = item.endTime.replace('.', ':').replace('h', ':').split(':').map(Number);
        
        const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm, 0);
        const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em, 0);
        
        if (eh < sh) endTime.setDate(endTime.getDate() + 1);
        
        // Stage filtering
        const itemStage = item.stage.toUpperCase();
        const stageMapping: Record<string, string> = {};
        settings.streams?.forEach((s: any, idx: number) => {
            stageMapping[`stage${idx + 1}`] = (s.name || `STAGE ${idx + 1}`).toUpperCase();
        });

        const targetStageName = stageMapping[activeStage as string] || activeStage.toUpperCase();
        if (itemStage !== targetStageName && itemStage !== activeStage.toUpperCase()) return false;

        return now >= startTime && now <= endTime;
    }) || { artist: 'DROPSIDERS LIVE', stage: 'MAIN STAGE' };

    const handlePurgeTarget = async (target: string) => {
        if (!isMod) return;
        setChatMessages(prev => prev.filter(m => m.pseudo !== target));
        try {
            await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                pseudo: "BOT_SYSTEM",
                message: `[SYSTEM]:PURGE:${target}`,
                color: "text-red-500",
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                country: "FR"
            });
            showNotification(`Chat nettoyé pour @${target}`, 'success');
        } catch (e) {
            console.error(e);
        }
    };

    // Planning derived state (computed before render, avoids IIFE in JSX)
    const normalizedLineup = lineupItems.map(item => ({
        ...item,
        logicalDay: item.day
    }));

    const planDays = Array.from(new Set(normalizedLineup.map(i => i.logicalDay).filter(Boolean))) as string[];
    planDays.sort(); 
    const planMulti = planDays.length > 1;
    const nowLocal = new Date();
    const currentDayStr = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`;
    const planActive = planningActiveDay || (
        planDays.includes(currentDayStr) ? currentDayStr : 
        (currentDayStr > (planDays[planDays.length - 1] || '') ? planDays[planDays.length - 1] : planDays[0])
    ) || '';
    const planItems = (planMulti ? normalizedLineup.filter(i => i.logicalDay === planActive) : normalizedLineup)
        .filter(i => {
            // Filter by activeStage (mapping stage1 -> index 0 of streams name, or literal match)
            if (!i.stage) return true; // Default to all if not set
            const itemStage = i.stage.toUpperCase();
            
            // Map stage1, stage2... to stream indices if needed, or just match names
            const stageMapping: Record<string, string> = {};
            settings.streams?.forEach((s: any, idx: number) => {
                stageMapping[`stage${idx + 1}`] = (s.name || `STAGE ${idx + 1}`).toUpperCase();
            });


            const targetStageName = stageMapping[activeStage as string] || activeStage.toUpperCase();
            return itemStage === targetStageName || itemStage === activeStage.toUpperCase();
        })
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    const fmtPlanDay = (d: string) => {
        const s = d.match(/^(\d{1,2})[\/-](\d{1,2})/);
        if (s) return `${s[1].padStart(2,'0')}/${s[2].padStart(2,'0')}`;
        const iso = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (iso) return `${iso[3]}/${iso[2]}`;
        return d.toUpperCase().slice(0, 8);
    };

    return (
        <div className="fixed inset-0 bg-dark-bg flex flex-col font-sans select-none overflow-hidden z-[100]">
            {/* Background Ambient Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-neon-red/10 animate-pulse transition-all duration-1000" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-neon-cyan/5 animate-pulse [animation-delay:2s] transition-all duration-1000" />
            </div>
            <style>
                {`
                    .italic-bold { font-style: italic; font-weight: 900 !important; }
                    .pixel-font { font-family: 'Courier New', Courier, monospace; letter-spacing: -1px; }
                    .animate-gradient {
                        background-size: 200% 200%;
                        animation: gradient-move 3s linear infinite;
                    }
                    @keyframes gradient-move {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    .holo-pseudo {
                        background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
                        background-size: 400% 400%;
                        animation: gradient-move 10s ease infinite;
                        -webkit-background-clip: text;
                        background-clip: text;
                        color: transparent !important;
                        font-weight: 900;
                        text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
                    }
                `}
            </style>
            {/* 1. TOP ANNOUNCER (Ticker Removed) */}
            {!isPopout && (
                <>

                    {/* 2. HEADER */}
                    <div className="h-20 lg:h-16 border-b border-white/5 flex flex-col lg:flex-row items-stretch lg:items-center justify-start px-2 lg:px-6 bg-black/40 backdrop-blur-md relative z-40 shrink-0">
                        <div className="flex flex-1 lg:flex-none items-center justify-between lg:justify-start gap-4 min-w-0">
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2 lg:gap-4">
                                    <div className="flex flex-col items-start pr-2 lg:pr-4 border-r border-white/10 shrink-0">
                                        <span className="text-[8px] lg:text-[14px] font-black text-white italic tracking-tighter tabular-nums leading-none">{currentTime}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 lg:gap-3">
                                        <div className="flex items-center gap-1 px-1 py-0.5 bg-red-500/10 border border-red-500/20 rounded-md shrink-0">
                                            <span className="w-1 h-1 bg-red-600 rounded-full animate-pulse" />
                                            <span className="text-[6px] lg:text-[9px] font-black text-red-500 uppercase tracking-tighter">LIVE</span>
                                        </div>
                                        <h1 className="text-[12px] sm:text-xs lg:text-[24px] xl:text-[28px] font-display font-black text-white italic tracking-tighter leading-none sm:max-w-none">{settings.title.toUpperCase()}</h1>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 lg:gap-2 mt-1 lg:mt-2">
                                    <Music className="w-2.5 h-2.5 lg:w-4 lg:h-4 text-neon-cyan animate-pulse shrink-0" />
                                    <span className="text-[7px] lg:text-[10px] font-black text-neon-cyan uppercase tracking-widest leading-none shrink-0 border-r border-neon-cyan/20 pr-1.5 mr-1.5">NOW</span>
                                    <span className="text-[10px] lg:text-[16px] font-black text-white uppercase italic tracking-tighter sm:max-w-none">
                                        {settings.streams?.find(s => s.id === settings.activeStreamId)?.overrideArtist || fluxCurrentArtist.artist} {settings.streams?.find(s => s.id === settings.activeStreamId)?.currentTrack ? ` - ${settings.streams.find(s => s.id === settings.activeStreamId)?.currentTrack}` : ''}
                                    </span>
                                </div>
                            </div>

                            {/* Mobile specific controls for header top right */}
                            <div className="flex lg:hidden items-center gap-2">
                                <button
                                    onClick={() => setShowViewersList(!showViewersList)}
                                    className={`p-1.5 rounded-lg border ${showViewersList ? 'bg-pink-600 border-pink-500 text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                >
                                    <Users className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => navigate('/')} className="p-1 hover:bg-white/5 rounded-full">
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {settings.streams && settings.streams.length > 1 && (
                            <div className="flex lg:absolute lg:left-1/2 lg:-translate-x-1/2 gap-0 border-t lg:border-t-0 border-white/5 overflow-x-auto no-scrollbar">
                                {settings.streams.map((s: any, idx: number) => {
                                    const isActive = settings.activeStreamId === s.id;
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => {
                                                setSettings(prev => ({ ...prev, activeStreamId: s.id }));
                                                setActiveStage(`stage${idx + 1}` as any);
                                            }}
                                            className={`relative px-3 py-2 lg:px-5 lg:py-3 text-[7px] lg:text-[10px] font-black uppercase flex items-center gap-1.5 shrink-0 border-b-2 transition-colors duration-150 ${isActive ? 'text-white border-neon-red' : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-white/20'}`}
                                        >
                                            {isActive && (
                                                <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-neon-red rounded-none shrink-0" style={{ boxShadow: '0 0 6px rgba(255,0,51,0.8)' }} />
                                            )}
                                            <span className="truncate max-w-[60px] lg:max-w-none">{s.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Desktop Only Buttons moved to a container */}
                        <div className="hidden lg:flex items-center gap-4 ml-auto">
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white hover:bg-white/10 transition-all group"
                            >
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                RETOUR AU SITE
                            </button>
                            <button
                                onClick={() => {
                                    if (isMod) {
                                        setShowAdminPanel(true);
                                        setAdminActiveTab('config');
                                    }
                                }}
                                className={`flex items-center gap-4 px-4 py-2 bg-white/5 border border-white/10 rounded-xl transition-all ${isMod ? 'hover:bg-white/10 cursor-pointer' : ''}`}
                            >
                                <Users className="w-4 h-4 text-neon-cyan" />
                                <span className="text-xs font-black text-white">{settings.status === 'off' ? 0 : Array.from(new Set(chatMessages.filter(m => m.pseudo && m.pseudo !== 'BOT_SYSTEM').map(m => m.pseudo))).length}</span>
                            </button>
                            <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
                                <button
                                    onClick={() => setViewMode('single')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'single' ? 'bg-neon-cyan text-black' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <Square className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-neon-cyan text-black' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <BarChart3 className="w-4 h-4 rotate-90" />
                                </button>
                                {viewMode === 'grid' && (
                                    <select
                                        value={gridCount}
                                        onChange={(e) => setGridCount(Number(e.target.value))}
                                        className="bg-black/40 border border-white/10 rounded-lg px-2 text-[10px] font-black text-white outline-none focus:border-neon-cyan"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                            <option key={n} value={n}>{n} STAGES</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <button
                                onClick={() => setIsCinemaMode(!isCinemaMode)}
                                className={`p-3 rounded-xl transition-all border ${isCinemaMode ? 'bg-neon-cyan border-neon-cyan shadow-[0_0_15px_rgba(0,255,255,0.4)] text-black' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                            >
                                {isCinemaMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                            </button>
                            {isMod && (
                                <button onClick={() => setShowAdminPanel(!showAdminPanel)} className={`p-3 rounded-xl transition-all border ${showAdminPanel ? 'bg-neon-purple border-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.4)] text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
                                    <Settings className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* TOP NEWS MARQUEE (Hidden on Mobile) */}
                    <div className="hidden lg:flex h-6 lg:h-10 bg-neon-red/10 backdrop-blur-md border-b border-neon-red/30 items-center overflow-hidden group shrink-0">
                        <div className="bg-neon-red px-2 lg:px-3 h-full flex items-center shrink-0 z-10 relative shadow-[0_0_15px_rgba(255,0,51,0.5)]">
                            <Megaphone className="w-3 lg:w-3.5 h-3 lg:h-3.5 text-white" />
                            <span className="ml-1 lg:ml-2 text-[7px] lg:text-[9px] font-black text-white uppercase tracking-tighter cursor-default">NEWS FLUX</span>
                        </div>
                        <motion.div
                            animate={{ x: [0, -2000] }}
                            transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
                            className="flex items-center gap-16 whitespace-nowrap pl-6 group-hover:[animation-play-state:paused]"
                        >
                            {[...Array(3)].map((_, loopIdx) => (
                                <div key={loopIdx} className="flex gap-16">
                                    {(marqueeItems.length > 0 ? marqueeItems : [{ text: settings.tickerText, link: '#' }]).filter(i => i.text).map((item, idx) => {
                                        const isExternal = item.link?.startsWith('http') || item.link?.startsWith('www');
                                        const fullLink = isExternal ? (item.link?.startsWith('http') ? item.link : `https://${item.link}`) : item.link;
                                        return (
                                            <a
                                                key={`${loopIdx}-${idx}`}
                                                href={fullLink}
                                                target={isExternal ? "_blank" : "_self"}
                                                rel={isExternal ? "noopener noreferrer" : ""}
                                                className="text-[10px] lg:text-xs font-black text-white/90 uppercase italic tracking-widest flex items-center gap-2 hover:text-neon-red transition-colors drop-shadow-md cursor-pointer group/newsitem"
                                            >
                                                <Sparkles className="w-3 h-3 text-neon-red group-hover/newsitem:text-white transition-colors" />
                                                <span className="group-hover/newsitem:text-neon-red transition-colors">{item.text}</span>
                                            </a>
                                        );
                                    })}
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Viewers List Overlay (Mobile / Desktop floating) */}
                    <AnimatePresence>
                        {showViewersList && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-4 top-24 w-80 max-h-[60vh] bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl z-50 flex flex-col shadow-2xl overflow-hidden"
                            >
                                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-pink-500" />
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Viewers</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500">{Array.from(new Set(chatMessages.filter(m => m.pseudo && m.pseudo !== 'BOT_SYSTEM').map(m => m.pseudo))).length} en ligne</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
                                    {Array.from(new Set(chatMessages.filter(m => m.pseudo && !m.pseudo.startsWith('BOT_')).map(m => m.pseudo))).map((viewer: any, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition-all group">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                    <span className="text-[10px] font-bold text-gray-400">{viewer[0]}</span>
                                                </div>
                                                <span className="text-xs font-bold text-white uppercase">{viewer}</span>
                                                {/* Status badges */}
                                                {vipsList.includes(viewer) && <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                                {viewer === 'ALEX_FR1' && <Star className="w-3 h-3 text-neon-cyan fill-neon-cyan" />}
                                            </div>
                                            {isMod && (
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => showNotification(`Logs de ${viewer} consultés`, 'success')}
                                                        className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                                                        title="Logs Chat"
                                                    >
                                                        <MessageSquare className="w-3 h-3 text-gray-400 hover:text-neon-cyan" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (vipsList.includes(viewer)) {
                                                                setVipsList(prev => prev.filter(u => u !== viewer));
                                                                showNotification(`${viewer} n'est plus VIP`, 'success');
                                                            } else {
                                                                setVipsList(prev => [...prev, viewer]);
                                                                showNotification(`${viewer} promu VIP`, 'success');
                                                            }
                                                        }}
                                                        className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                                                    >
                                                        <Crown className={`w-3 h-3 ${vipsList.includes(viewer) ? 'text-amber-500 fill-amber-500' : 'text-gray-500 hover:text-amber-500'}`} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {chatMessages.filter(m => m.pseudo && !m.pseudo.startsWith('BOT_')).length === 0 && (
                                        <div className="text-center p-8 text-gray-500 text-xs italic uppercase">Aucun viewer détecté</div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}

            {/* 3. MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
                {/* A. VIDEO PANEL (35% Mobile / 60% Desktop) */}
                <div className={`transition-all duration-700 ease-in-out ${isPopout ? 'hidden' : (isCinemaMode ? 'w-full lg:w-full h-full lg:h-full' : 'w-full lg:w-[60%] h-[35%] lg:h-full')} bg-black lg:border-r border-b lg:border-b-0 border-white/10 relative flex flex-col shrink-0 overflow-hidden`}>
                    <div className="absolute inset-0 z-0">
                        {viewMode === 'single' ? (
                            (() => {
                                const activeStream = settings.streams?.find((s: any) => s.id === settings.activeStreamId);
                                const activeYtId = activeStream?.youtubeId || settings.youtubeId;
                                const isExternal = activeStream?.isExternalLink;

                                if (isExternal && activeYtId) {
                                    const videoId = extractYoutubeId(activeYtId);
                                    return (
                                        <div className="w-full h-full bg-black flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-black via-zinc-900 to-black">
                                            <div className="relative group cursor-pointer max-w-2xl w-full" onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')}>
                                                <div className="absolute inset-0 bg-neon-red/20 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                                                <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                                                    <img 
                                                        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
                                                        className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-100" 
                                                        alt="YouTube Preview"
                                                    />
                                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-6 group-hover:bg-black/40 transition-colors">
                                                        <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-neon-red group-hover:border-neon-red transition-all duration-500 shadow-[0_0_30px_rgba(255,0,51,0)] group-hover:shadow-[0_0_50px_rgba(255,0,51,0.5)]">
                                                            <svg className="w-8 h-8 text-white fill-current translate-x-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <h3 className="text-xl font-display font-black text-white italic tracking-tighter uppercase whitespace-pre-wrap">{activeStream?.name || settings.title}</h3>
                                                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">FLUX RÉSERVÉ À YOUTUBE</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')}
                                                className="mt-12 px-8 py-4 bg-neon-red rounded-2xl flex items-center gap-4 text-white font-black italic tracking-tighter hover:bg-white hover:text-black transition-all duration-300 shadow-[0_0_30px_rgba(255,0,51,0.3)]"
                                            >
                                                <span className="text-lg">REGARDER SUR YOUTUBE</span>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            </button>
                                        </div>
                                    );
                                }

                                return activeYtId ? (
                                    <iframe 
                                        className="w-full h-full border-none" 
                                        src={`https://www.youtube.com/embed/${extractYoutubeId(activeYtId)}?autoplay=1&mute=0&rel=0&modestbranding=1&origin=${window.location.origin}`} 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen 
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-black gap-4">
                                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                                            <span className="text-2xl">📺</span>
                                        </div>
                                        <p className="text-white/30 text-xs font-black uppercase tracking-[0.3em]">Stream bientôt en ligne</p>
                                    </div>
                                );
                            })()
                        ) : (
                            <div className={`grid h-full w-full gap-1 p-1 bg-black ${gridCount === 1 ? 'grid-cols-1' : gridCount === 2 ? 'grid-cols-2' : gridCount <= 4 ? 'grid-cols-2' : gridCount <= 6 ? 'grid-cols-3' : gridCount <= 8 ? 'grid-cols-4' : 'grid-cols-5'}`}>
                                {Array.from({ length: gridCount }).map((_, idx) => {
                                    const s = settings.streams?.[idx];
                                    return (
                                        <div key={s?.id || `empty-${idx}`} className="relative group overflow-hidden bg-black/20 border border-white/5 rounded-xl flex items-center justify-center">
                                            {s ? (
                                                s.isExternalLink ? (
                                                    <div className="relative group w-full h-full overflow-hidden bg-black/40 flex flex-col items-center justify-center p-4 cursor-pointer" onClick={() => window.open(`https://www.youtube.com/watch?v=${extractYoutubeId(s.youtubeId)}`, '_blank')}>
                                                        <img 
                                                            src={`https://img.youtube.com/vi/${extractYoutubeId(s.youtubeId)}/0.jpg`} 
                                                            className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity grayscale" 
                                                            alt=""
                                                        />
                                                        <div className="relative z-10 flex flex-col items-center gap-3">
                                                            <div className="w-12 h-12 rounded-full bg-neon-red/20 border border-neon-red/30 flex items-center justify-center text-neon-red group-hover:bg-neon-red group-hover:text-white transition-all">
                                                                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-[10px] font-black text-white uppercase italic truncate max-w-[150px]">{s.name}</div>
                                                                <div className="text-[7px] font-black text-gray-500 uppercase tracking-widest mt-1">LIEN EXTERNE</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <iframe
                                                            className="w-full h-full border-none"
                                                            src={`https://www.youtube.com/embed/${extractYoutubeId(s.youtubeId)}?autoplay=${idx === activeAudioIdx ? 1 : 0}&mute=${idx === activeAudioIdx ? 0 : 1}&rel=0&modestbranding=1&origin=${window.location.origin}`}
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        />
                                                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-md text-[8px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                                                            {s.name}
                                                        </div>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setActiveAudioIdx(idx); }}
                                                            className={`absolute top-2 right-2 p-1.5 rounded-lg border transition-all ${idx === activeAudioIdx ? 'bg-neon-green/20 border-neon-green text-neon-green shadow-[0_0_15px_rgba(57,255,20,0.4)] opacity-100' : 'bg-black/60 border-white/10 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white'}`}
                                                            title={idx === activeAudioIdx ? "Son activé" : "Activer le son"}
                                                        >
                                                            {idx === activeAudioIdx ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                                        </button>
                                                    </>
                                                )
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-[#050505]">
                                                    <img 
                                                        src="/Logo.png" 
                                                        className="w-28 opacity-40 grayscale hover:opacity-80 transition-opacity drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                                                        alt="Dropsiders" 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {takeoverAlert && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1.2 }}
                            exit={{ opacity: 0, scale: 1.5 }}
                            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md px-10 pointer-events-none"
                        >
                            <div className="text-center space-y-6">
                                <Megaphone className="w-24 h-24 text-neon-red mx-auto animate-bounce" />
                                <h2 className="text-5xl lg:text-8xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_0_50px_#ff0033]">
                                    {takeoverAlert.text}
                                </h2>
                                <div className="h-2 w-48 bg-neon-red mx-auto rounded-full animate-pulse shadow-[0_0_20px_#ff0033]" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showAdminPanel && (
                        <motion.div
                            key="admin-panel"
                            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                            animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
                            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl p-8 overflow-y-auto custom-scrollbar"
                        >
                            <div className="max-w-4xl mx-auto space-y-10">
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
                                    {adminActiveTab === 'config' ? (
                                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            {/* ⚡ Quick Override Control */}
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
                                                            className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-neon-cyan uppercase outline-none focus:border-neon-cyan focus:ring-4 focus:ring-neon-cyan/5 transition-all" 
                                                        />
                                                    </div>
                                                    <div className="w-full md:w-48 space-y-2">
                                                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Choix Stage</label>
                                                         <select 
                                                            value={editActiveStreamId}
                                                            onChange={e => setEditActiveStreamId(e.target.value)}
                                                            className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-4 text-xs font-black text-white outline-none focus:border-neon-cyan cursor-pointer"
                                                         >
                                                             {editStreams.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                                         </select>
                                                    </div>
                                                </div>
                                                
                                                <p className="text-[10px] text-amber-500 font-bold uppercase italic flex items-center gap-2">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Ce champ annule l'affichage du planning pour ce stage. Laissez vide pour revenir au planning auto.
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-8">
                                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                                                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                                            <div className="w-10 h-10 bg-neon-purple/20 rounded-xl flex items-center justify-center">
                                                                <Settings className="w-5 h-5 text-neon-purple" />
                                                            </div>
                                                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Identité du Live</h3>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Titre Global</label>
                                                                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-neon-purple" placeholder="EX: TAKEOVER #42" />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-1">
                                                                     <label className="text-[8px] font-black text-gray-500 uppercase">Instagram</label>
                                                                     <input type="text" value={editInsta} onChange={e => setEditInsta(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white" placeholder="INSTAGRAM" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                     <label className="text-[8px] font-black text-gray-500 uppercase">TikTok</label>
                                                                     <input type="text" value={editTiktok} onChange={e => setEditTiktok(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white" placeholder="TIKTOK" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                                                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                                            <div className="flex items-center gap-3">
                                                                <Trophy className="w-5 h-5 text-amber-500" />
                                                                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Partenaire / Sponsor</h3>
                                                            </div>
                                                            <button onClick={() => setEditShowSponsorBanner(!editShowSponsorBanner)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${editShowSponsorBanner ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-white/5 text-gray-400 opacity-50'}`}>{editShowSponsorBanner ? 'ACTIVÉ' : 'DÉSACTIVÉ'}</button>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Nom du Partenaire</label>
                                                                <input type="text" value={editSponsorText} onChange={e => setEditSponsorText(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-neon-purple" placeholder="EX: LIVE RENDU POSSIBLE PAR..." />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Lien de Destination</label>
                                                                <input type="text" value={editSponsorLink} onChange={e => setEditSponsorLink(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-neon-purple" placeholder="https://..." />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-neon-cyan/20 rounded-xl flex items-center justify-center">
                                                                <Camera className="w-5 h-5 text-neon-cyan" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Logo du Festival / Live</h3>
                                                                <p className="text-[8px] text-gray-500 font-bold uppercase">S'affichera sur l'agenda en page d'accueil</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="relative group">
                                                                <div className="w-20 h-20 rounded-2xl bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center relative shadow-xl">
                                                                    {editFestivalLogo ? (
                                                                        <img src={editFestivalLogo} alt="Logo" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <Camera className="w-8 h-8 text-gray-700" />
                                                                    )}
                                                                    <label htmlFor="festival-logo-upload" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
                                                                        <Plus className="w-6 h-6 text-white" />
                                                                    </label>
                                                                </div>
                                                                <input 
                                                                    id="festival-logo-upload" 
                                                                    type="file" 
                                                                    className="hidden" 
                                                                    accept="image/*" 
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            const reader = new FileReader();
                                                                            reader.onload = (re) => {
                                                                                setCropImageSrc(re.target?.result as string);
                                                                                setEditingLineupId('FESTIVAL_LOGO'); 
                                                                            };
                                                                            reader.readAsDataURL(file);
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            {editFestivalLogo && (
                                                                <button onClick={() => setEditFestivalLogo('')} className="text-[10px] font-black text-red-500 hover:text-white uppercase tracking-widest border border-red-500/20 px-4 py-2 rounded-xl hover:bg-red-500/20 transition-all">Supprimer</button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                                                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Flux Vidéo</h3>
                                                            <button onClick={() => setEditStreams([...editStreams, { id: Math.random().toString(36).substr(2, 9), name: '', youtubeId: '' }])} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg"><Plus className="w-4 h-4 text-white" /></button>
                                                        </div>
                                                        <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                            {editStreams.map((stream, idx) => (
                                                                <div key={stream.id || idx} className={`p-4 rounded-2xl border transition-all ${editActiveStreamId === stream.id ? 'bg-neon-purple/10 border-neon-purple' : 'bg-black/20 border-white/5'}`}>
                                                                    <div className="flex items-center justify-between gap-3 mb-2">
                                                                        <input type="text" value={stream.name} onChange={e => {
                                                                            const ns = [...editStreams];
                                                                            ns[idx].name = e.target.value.toUpperCase();
                                                                            setEditStreams(ns);
                                                                        }} className="flex-1 bg-transparent border-none text-[10px] font-black text-white p-0 outline-none" placeholder="NOM STAGE" />
                                                                        <div className="flex items-center gap-2">
                                                                            <button 
                                                                                onClick={() => {
                                                                                    const ns = [...editStreams];
                                                                                    ns[idx].isExternalLink = !ns[idx].isExternalLink;
                                                                                    setEditStreams(ns);
                                                                                }} 
                                                                                className={`px-3 py-1 rounded-xl text-[8px] font-black border transition-all ${stream.isExternalLink ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                                                                                title="Détourner vers YouTube (flux protégés)"
                                                                            >
                                                                                {stream.isExternalLink ? 'MODE LIEN 🔗' : 'MODE INTEGRÉ 📺'}
                                                                            </button>
                                                                            <button onClick={() => setEditActiveStreamId(stream.id)} className={`px-2 py-1 rounded text-[8px] font-black ${editActiveStreamId === stream.id ? 'bg-neon-purple text-white' : 'text-gray-500 hover:text-white'}`}>ACTIF</button>
                                                                            <button onClick={() => setEditStreams(editStreams.filter(s => s.id !== stream.id))} className="text-gray-600 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <input type="text" value={stream.youtubeId} onChange={e => {
                                                                            const ns = [...editStreams];
                                                                            ns[idx].youtubeId = extractYoutubeId(e.target.value);
                                                                            setEditStreams(ns);
                                                                        }} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:border-neon-purple outline-none" placeholder="Lien YouTube ou ID" />
                                                                        <input type="text" value={stream.overrideArtist || ''} onChange={e => {
                                                                            const ns = [...editStreams];
                                                                            ns[idx].overrideArtist = e.target.value.toUpperCase();
                                                                            setEditStreams(ns);
                                                                        }} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:border-neon-cyan outline-none" placeholder="Artiste actuel (Manuel: Force l'affichage au lieu du planning)" />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-8">
                                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                                                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Status & News</h3>
                                                        <div className="space-y-4">
                                                            <div className="flex gap-2 p-1 bg-black/40 rounded-xl">
                                                                {(['live', 'edit', 'off'] as const).map(s => (
                                                                    <button key={s} onClick={() => setEditStatus(s)} className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${editStatus === s ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>{s}</button>
                                                                ))}
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-1">
                                                                    <label className="text-[8px] font-black text-gray-500 uppercase">Début Programmation</label>
                                                                    <input type="datetime-local" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:border-neon-purple outline-none" style={{ colorScheme: 'dark' }} />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[8px] font-black text-gray-500 uppercase">Fin Programmation</label>
                                                                    <input type="datetime-local" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:border-neon-purple outline-none" style={{ colorScheme: 'dark' }} />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <label className="block text-[10px] font-black text-gray-500 uppercase">Bandeau News (Défilant)</label>
                                                                {editMarqueeItems.map((item, idx) => (
                                                                    <div key={idx} className="flex gap-2">
                                                                        <input type="text" value={item.text} onChange={e => { const next = [...editMarqueeItems]; next[idx].text = e.target.value; setEditMarqueeItems(next); }} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white" placeholder="INFO" />
                                                                        <input type="text" value={item.link} onChange={e => { const next = [...editMarqueeItems]; next[idx].link = e.target.value; setEditMarqueeItems(next); }} className="w-20 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white" placeholder="URL" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* SAUVEGARDE GLOBALE */}
                                            <div className="pt-8 mb-12">
                                                <button 
                                                    onClick={handleGlobalSave}
                                                    disabled={isSaving}
                                                    className={`w-full py-6 bg-neon-cyan text-black font-black uppercase rounded-3xl transition-all shadow-2xl flex items-center justify-center gap-4 ${isSaving ? 'opacity-50' : 'hover:scale-[1.02] active:scale-95 shadow-neon-cyan/20 cursor-pointer'}`}
                                                >
                                                    {isSaving ? <Timer className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                                                    {isSaving ? 'ENREGISTREMENT...' : 'SAUVEGARDER TOUTE LA CONFIGURATION'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : adminActiveTab === 'planning' ? (
                                        <div className="space-y-6 animate-in fade-in duration-500">
                                            {/* Quick Save Planning Button */}
                                            <button 
                                                onClick={handleGlobalSave}
                                                disabled={isSaving}
                                                className={`w-full py-5 bg-gradient-to-r from-neon-cyan/80 to-blue-600/80 text-white font-black uppercase rounded-3xl transition-all shadow-xl flex items-center justify-center gap-3 ${isSaving ? 'opacity-50' : 'hover:scale-[1.01] active:scale-95 shadow-neon-cyan/10 cursor-pointer'}`}
                                            >
                                                {isSaving ? <Timer className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                                {isSaving ? 'SAUVEGARDE...' : 'Enregistrer le Planning'}
                                            </button>

                                            {/* ── BULK IMPORT PANEL ── */}
                                            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                                                            <Zap className="w-6 h-6 text-purple-400" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">Import groupé</h3>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase">Collez un planning entier d'une scène en un clic</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => { setShowBulkImport(v => !v); setBulkPreview([]); }}
                                                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                                                            showBulkImport
                                                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                                : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                                                        }`}
                                                    >
                                                        {showBulkImport ? '✕ Fermer' : '+ Ouvrir'}
                                                    </button>
                                                </div>

                                                {showBulkImport && (
                                                    <div className="space-y-5 border-t border-white/5 pt-6">
                                                        {/* ÉTAPE 1 : INFOS DE BASE */}
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${bulkDate && bulkStage ? 'bg-green-500 text-white' : 'bg-purple-500 text-white'}`}>1</span>
                                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Infos de base</span>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
                                                                <div className="space-y-2">
                                                                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest pl-1">Date de la journée</label>
                                                                    <input
                                                                        type="date"
                                                                        value={bulkDate}
                                                                        onChange={e => setBulkDate(e.target.value)}
                                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest pl-1">Scène</label>
                                                                    <select
                                                                        value={bulkStage}
                                                                        onChange={e => setBulkStage(e.target.value)}
                                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white"
                                                                    >
                                                                        <option value="">CHOISIR SCÈNE</option>
                                                                        {editStreams.map(s => <option key={s.id} value={s.name.toUpperCase()}>{s.name.toUpperCase()}</option>)}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* ÉTAPE 2 : RÉGLAGES TEMPS */}
                                                        <div className={`space-y-4 transition-all ${(!bulkDate || !bulkStage) ? 'opacity-20 pointer-events-none' : ''}`}>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${selectedTimezoneId ? 'bg-green-500 text-white' : 'bg-purple-500 text-white'}`}>2</span>
                                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Réglages Temps</span>
                                                            </div>
                                                            <div className="space-y-4 ml-7">
                                                                <div className="space-y-2">
                                                                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest pl-1">
                                                                        Fuseau Horaire (Auto-détection Saison)
                                                                        {eventTimezoneOffset !== 0 && <span className="ml-2 text-neon-cyan font-bold">(Calculé : {eventTimezoneOffset > 0 ? '+' : ''}{eventTimezoneOffset}h)</span>}
                                                                    </label>
                                                                    <select
                                                                        value={selectedTimezoneId}
                                                                        onChange={e => setSelectedTimezoneId(e.target.value)}
                                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white"
                                                                    >
                                                                        {Array.from(new Set(timezonePresets.map(p => p.group))).map(group => (
                                                                            <optgroup key={group} label={group}>
                                                                                {timezonePresets.filter(p => p.group === group).map(p => (
                                                                                    <option key={p.id} value={p.id}>{p.label}</option>
                                                                                ))}
                                                                            </optgroup>
                                                                        ))}
                                                                        <optgroup label="⚙️ Manuel">
                                                                            <option value="m1">+1h</option>
                                                                            <option value="m2">+2h</option>
                                                                            <option value="m-1">-1h</option>
                                                                        </optgroup>
                                                                    </select>
                                                                </div>
                                                                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                                                                    <button 
                                                                        onClick={() => setBulkRequireEndTime(!bulkRequireEndTime)}
                                                                        className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all border ${bulkRequireEndTime ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-white/5 border-white/10 text-gray-400'}`}
                                                                    >
                                                                        {bulkRequireEndTime ? '🔒 Fin Obligatoire' : '🔓 Fin Optionnelle'}
                                                                    </button>
                                                                    <p className="text-[10px] text-gray-500 font-bold leading-tight">
                                                                        {bulkRequireEndTime 
                                                                            ? "L'importation sera bloquée si une heure de fin est manquante dans le texte."
                                                                            : "Si l'heure de fin manque, elle sera estimée selon le set suivant."}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* ÉTAPE 3 : CONTENU */}
                                                        <div className={`space-y-4 transition-all ${(!bulkDate || !bulkStage) ? 'opacity-20 pointer-events-none' : ''}`}>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${bulkText.length > 5 ? 'bg-green-500 text-white' : 'bg-purple-500 text-white'}`}>3</span>
                                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Contenu (Texte ou Image)</span>
                                                            </div>
                                                            <div className="space-y-4 ml-7">
                                                                <div className="flex gap-4">
                                                                    <div className="flex-1 space-y-1">
                                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Nom du stage pour le scan</label>
                                                                        <input
                                                                            type="text"
                                                                            value={scanStage}
                                                                            onChange={e => setScanStage(e.target.value)}
                                                                            placeholder="STAGE NAME..."
                                                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white uppercase font-black"
                                                                        />
                                                                    </div>
                                                                    <div className="flex flex-col justify-end">
                                                                        <button 
                                                                            onClick={() => (document.getElementById('poster-scan') as HTMLInputElement)?.click()}
                                                                            disabled={isScanningImage}
                                                                            className={`px-6 h-[44px] bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase text-purple-300 transition-all ${isScanningImage ? 'opacity-50' : 'hover:bg-purple-500/30'}`}
                                                                        >
                                                                            {isScanningImage ? <Timer className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                                                                            {isScanningImage ? `Analyse ${scanProgress}%` : 'Scanner une affiche'}
                                                                        </button>
                                                                        <input id="poster-scan" type="file" accept="image/*" onChange={handleImageOCR} className="hidden" onClick={(e) => (e.target as any).value = null} />
                                                                    </div>
                                                                </div>

                                                                <textarea
                                                                    rows={6}
                                                                    value={bulkText}
                                                                    onChange={e => {
                                                                        setBulkText(e.target.value);
                                                                        setBulkPreview(parseBulkSchedule(e.target.value));
                                                                    }}
                                                                    placeholder={`Exemple :\n16:00 - 17:00 Tijuana Panthers\n17:00 - 18:00 Wet Leg`}
                                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-xs text-white font-mono resize-none outline-none focus:border-purple-500/50 transition-all"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* ÉTAPE 4 : VALIDATION */}
                                                        {bulkPreview.length > 0 && (
                                                            <div className="space-y-4 pt-4 border-t border-white/5">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="w-5 h-5 rounded-full bg-neon-cyan text-black flex items-center justify-center text-[10px] font-black">4</span>
                                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Aperçu & Validation</span>
                                                                </div>
                                                                
                                                                <div className="space-y-2 ml-7">
                                                                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest pl-1">Aperçu — {bulkPreview.length} session(s) détectée(s)</p>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                        {bulkPreview.map((entry, idx) => {
                                                                            const next = bulkPreview[idx + 1];
                                                                            const [hh, mm] = entry.startTime.split(':').map(Number);
                                                                            const autoEnd = next ? next.startTime : `${((hh + 1) % 24).toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
                                                                            const displayEnd = entry.endTime || autoEnd;
                                                                            return (
                                                                                <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl group relative overflow-hidden transition-all ${
                                                                                    entry.image
                                                                                        ? 'bg-purple-500/10 border border-purple-500/20'
                                                                                        : 'bg-red-500/10 border border-red-500/40'
                                                                                }`}>
                                                                                    {entry.image && (
                                                                                        <>
                                                                                            <img src={entry.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none" />
                                                                                            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent pointer-events-none" />
                                                                                        </>
                                                                                    )}
                                                                                    <div className="flex flex-col relative z-10">
                                                                                        <span 
                                                                                            onClick={() => {
                                                                                                setEditingBulkTime({
                                                                                                    index: idx,
                                                                                                    start: entry.startTime,
                                                                                                    end: displayEnd
                                                                                                });
                                                                                            }}
                                                                                            className={`font-mono text-[10px] font-black cursor-pointer hover:underline decoration-dotted ${entry.endTime ? 'text-neon-cyan' : 'text-amber-500/70 italic'}`}
                                                                                        >
                                                                                            {entry.startTime}–{displayEnd}
                                                                                            {!entry.endTime && <span className="ml-1 text-[7px] opacity-50 uppercase tracking-tighter">(Est.)</span>}
                                                                                        </span>
                                                                                        {eventTimezoneOffset !== 0 && (() => {
                                                                                            const [sh, sm] = entry.startTime.split(':').map(Number);
                                                                                            const [eh, em] = displayEnd.split(':').map(Number);
                                                                                            const frS = `${((sh + eventTimezoneOffset) % 24).toString().padStart(2, '0')}:${sm.toString().padStart(2, '0')}`;
                                                                                            const frE = `${((eh + eventTimezoneOffset) % 24).toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`;
                                                                                            return (
                                                                                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-tighter leading-none flex items-center gap-1 mt-0.5">
                                                                                                    <Globe className="w-2.5 h-2.5" />
                                                                                                    FR: {frS}–{frE}
                                                                                                </span>
                                                                                            );
                                                                                        })()}
                                                                                    </div>
                                                                                    <span className="text-white text-xs font-black uppercase truncate relative z-10 flex-1">{entry.artist}</span>
                                                                                    <label
                                                                                        htmlFor={`bulk-img-${idx}`}
                                                                                        className={`relative z-10 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                                                                                            entry.image
                                                                                                ? 'bg-neon-cyan/20 border border-neon-cyan/40'
                                                                                                : 'bg-white/10 border border-white/10 hover:border-purple-400/60'
                                                                                        }`}
                                                                                    >
                                                                                        {entry.image
                                                                                            ? <img src={entry.image} alt="" className="w-full h-full object-cover rounded-lg" />
                                                                                            : <Camera className="w-3.5 h-3.5 text-gray-400" />}
                                                                                    </label>
                                                                                    <input
                                                                                        id={`bulk-img-${idx}`}
                                                                                        type="file"
                                                                                        accept="image/*"
                                                                                        className="hidden"
                                                                                        onChange={e => {
                                                                                            const file = e.target.files?.[0];
                                                                                            if (file) {
                                                                                                const reader = new FileReader();
                                                                                                reader.onload = ev => {
                                                                                                    const dataUrl = ev.target?.result as string;
                                                                                                    setBulkCropIndex(idx);
                                                                                                    setCropImageSrc(dataUrl);
                                                                                                };
                                                                                                reader.readAsDataURL(file);
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={handleBulkImport}
                                                            disabled={bulkPreview.length === 0 || !bulkDate || !bulkStage || bulkPreview.some(e => !e.image)}
                                                            className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase rounded-2xl transition-all shadow-xl shadow-purple-500/20 flex items-center justify-center gap-3"
                                                        >
                                                            <Wand2 className="w-5 h-5" />
                                                            Importer {bulkPreview.length > 0 ? `(${bulkPreview.length} artiste${bulkPreview.length > 1 ? 's' : ''})` : ''} dans le planning
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6" id="planning-form">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-neon-cyan/20 rounded-2xl flex items-center justify-center">
                                                        {editingLineupId ? <Edit3 className="w-6 h-6 text-amber-500" /> : <Plus className="w-6 h-6 text-neon-cyan" />}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">{editingLineupId ? 'Modifier Session' : 'Nouvelle Session'}</h3>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Ajoutez un artiste au planning du takeover</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest pl-1">
                                                        Fuseau Horaire (Auto-détection Saison)
                                                        {eventTimezoneOffset !== 0 && <span className="ml-2 text-neon-cyan font-bold">(Calculé : {eventTimezoneOffset > 0 ? '+' : ''}{eventTimezoneOffset}h)</span>}
                                                    </label>
                                                    <select 
                                                        value={selectedTimezoneId} 
                                                        onChange={e => setSelectedTimezoneId(e.target.value)} 
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white"
                                                    >
                                                        {Array.from(new Set(timezonePresets.map(p => p.group))).map(group => (
                                                            <optgroup key={group} label={group}>
                                                                {timezonePresets.filter(p => p.group === group).map(p => (
                                                                    <option key={p.id} value={p.id}>{p.label}</option>
                                                                ))}
                                                            </optgroup>
                                                        ))}
                                                        <optgroup label="⚙️ Manuel">
                                                            <option value="m1">+1h</option>
                                                            <option value="m2">+2h</option>
                                                            <option value="m-1">-1h</option>
                                                        </optgroup>
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest pl-1">Date</label>
                                                        <input type="date" value={newLineupItem.day} onChange={e => setNewLineupItem({ ...newLineupItem, id: editingLineupId || '', day: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest pl-1">Début</label>
                                                        <input type="text" placeholder="21:00" value={newLineupItem.startTime} onChange={e => setNewLineupItem({ ...newLineupItem, id: editingLineupId || '', startTime: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest pl-1">Fin</label>
                                                        <input type="text" placeholder="22:30" value={newLineupItem.endTime} onChange={e => setNewLineupItem({ ...newLineupItem, id: editingLineupId || '', endTime: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest pl-1">Artiste</label>
                                                        <input type="text" placeholder="NOM DE L'ARTISTE" value={newLineupItem.artist} onChange={e => setNewLineupItem({ ...newLineupItem, id: editingLineupId || '', artist: e.target.value.toUpperCase() })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                                    </div>
                                                    <div className="col-span-2 md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest pl-1">Scène (Stage)</label>
                                                            <select value={newLineupItem.stage} onChange={e => setNewLineupItem({ ...newLineupItem, id: editingLineupId || '', stage: e.target.value.toUpperCase() })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white">
                                                                <option value="">CHOISIR SCÈNE</option>
                                                                {editStreams.map(s => <option key={s.id} value={s.name.toUpperCase()}>{s.name.toUpperCase()}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest pl-1">Instagram (@pseudo)</label>
                                                            <input type="text" placeholder="@artist_name" value={newLineupItem.instagram} onChange={e => setNewLineupItem({ ...newLineupItem, id: editingLineupId || '', instagram: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Upload Image Section */}
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest pl-1">Photo de l'artiste <span className="text-neon-red">*</span></label>
                                                    <div className="flex gap-4 items-center">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onload = (event) => setCropImageSrc(event.target?.result as string);
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                            className="hidden"
                                                            id="lineup-image-upload"
                                                        />
                                                        <label htmlFor="lineup-image-upload" className="flex-1 py-3 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black text-gray-500 hover:border-neon-cyan hover:text-white transition-all cursor-pointer uppercase">
                                                            <Camera className="w-4 h-4" />
                                                            {newLineupItem.image ? 'Changer la photo' : 'Charger une photo'}
                                                        </label>
                                                        {newLineupItem.image && (
                                                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/20">
                                                                <img src={newLineupItem.image} alt="" className="w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex gap-4">
                                                     <button onClick={handleAddLineupItem} className="flex-1 py-4 bg-neon-cyan text-black font-black uppercase rounded-2xl hover:bg-neon-cyan/80 transition-all shadow-xl shadow-neon-cyan/20">{editingLineupId ? 'Mettre à jour' : 'Ajouter au Planning'}</button>
                                                     {editingLineupId && <button onClick={() => { setEditingLineupId(null); setNewLineupItem({ id: '', day: '', startTime: '', endTime: '', artist: '', stage: '', instagram: '', instagram2: '', instagram3: '', image: '' }); }} className="px-8 py-4 bg-white/5 text-gray-500 rounded-2xl hover:text-white transition-all">Annuler</button>}
                                                </div>
                                            </div>



                                            <div className="space-y-4">
                                                {/* Auto-remove toggle */}
                                                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <Timer className="w-4 h-4 text-amber-400" />
                                                        <div>
                                                            <p className="text-xs font-black text-white uppercase tracking-widest">Suppression automatique</p>
                                                            <p className="text-[10px] text-gray-500">Retire les artistes du jour quand leur set est terminé</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const next = !autoRemoveFinished;
                                                            setAutoRemoveFinished(next);
                                                            localStorage.setItem('lineup_auto_remove', next.toString());
                                                            showNotification(next ? '⏰ Suppression auto activée' : 'Suppression auto désactivée', 'success');
                                                        }}
                                                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                                                            autoRemoveFinished ? 'bg-amber-500' : 'bg-white/10'
                                                        }`}
                                                    >
                                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                                                            autoRemoveFinished ? 'left-7' : 'left-1'
                                                        }`} />
                                                    </button>
                                                </div>

                                                {/* MODIFIER DATES GROUPÉES */}
                                                <div className="p-5 bg-purple-500/10 border border-purple-500/20 rounded-2xl space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-purple-400" />
                                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Modifier les dates par lot</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 space-y-1">
                                                            <label className="text-[8px] font-bold text-gray-500 uppercase ml-1 block">De (Date à corriger)</label>
                                                            <input type="date" value={bulkDateFrom} onChange={e => setBulkDateFrom(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] text-white outline-none focus:border-purple-500/50 transition-all font-mono" />
                                                        </div>
                                                        <div className="flex flex-col justify-end pb-2.5">
                                                            <ChevronRight className="w-4 h-4 text-gray-600" />
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <label className="text-[8px] font-bold text-gray-500 uppercase ml-1 block">Vers (Nouvelle date)</label>
                                                            <input type="date" value={bulkDateTo} onChange={e => setBulkDateTo(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] text-white outline-none focus:border-purple-500/50 transition-all font-mono" />
                                                        </div>
                                                        <div className="flex flex-col justify-end">
                                                            <button 
                                                                onClick={handleBulkDateChange}
                                                                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                                                            >
                                                                Mettre à jour
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {lineupItems.map((item, i) => (
                                                    <div key={item.id || i} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between group hover:border-white/20 transition-all relative overflow-hidden">
                                                        {item.image && (
                                                            <>
                                                                <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" />
                                                                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent pointer-events-none" />
                                                            </>
                                                        )}
                                                        <div className="flex items-center gap-6 relative z-10">
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-[10px] font-black text-neon-cyan uppercase">{fmtPlanDay(item.day)}</span>
                                                                <span className="text-lg font-black text-white">{item.startTime}</span>
                                                            </div>
                                                            <div className="w-px h-10 bg-white/10" />
                                                            <div>
                                                                <p className="text-xl font-display font-black text-white uppercase italic tracking-tighter">{item.artist}</p>
                                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.stage}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 relative z-10">
                                                            <button onClick={() => { setEditingLineupId(item.id || null); setNewLineupItem({ ...item }); document.getElementById('planning-form')?.scrollIntoView({ behavior: 'smooth' }); }} className="p-3 bg-white/5 text-gray-500 hover:text-white rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => setLineupItems(lineupItems.filter((_, idx) => idx !== i))} className="p-3 bg-white/5 text-gray-500 hover:text-red-500 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : adminActiveTab === 'tracklist' ? (
                                        <div className="space-y-8 animate-in fade-in duration-500">
                                            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-neon-cyan/20 rounded-2xl flex items-center justify-center">
                                                        <Music className="w-6 h-6 text-neon-cyan" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">Gestion Tracklist</h3>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Ajoutez des sets et gérez les tracks</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input type="text" value={newSetArtist} onChange={e => setNewSetArtist(e.target.value)} placeholder="NOM DE L'ARTISTE" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-neon-cyan transition-all" />
                                                    <input type="text" value={newSetTime} onChange={e => setNewSetTime(e.target.value)} placeholder="00:00" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-neon-cyan transition-all" />
                                                </div>
                                                <button onClick={handleAddSet} className="w-full py-4 bg-neon-cyan text-black font-black uppercase rounded-2xl hover:bg-neon-cyan/80 transition-all shadow-xl shadow-neon-cyan/20">Lancer un nouveau Set</button>
                                            </div>
                                            <div className="space-y-4">
                                                {tracklist.filter(s => (s.stage || 'stage1') === activeStage).map(set => (
                                                    <div key={set.id} className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h4 className="text-white font-black uppercase text-sm tracking-widest">{set.artist}</h4>
                                                                <p className="text-[10px] text-gray-500 font-mono">Début : {set.startTime}</p>
                                                            </div>
                                                            <button onClick={() => setTracklist(prev => prev.filter(s => s.id !== set.id))} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                        <div className="space-y-1">
                                                            {set.tracks.map(track => (
                                                                <div key={track.id} className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                                                                    <span className="text-[10px] font-bold text-white uppercase">{track.title}</span>
                                                                    <span className="text-[9px] text-neon-cyan font-black uppercase">@{track.user}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : adminActiveTab === 'interactif' ? (
                                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            {/* SÉLECTEUR DE DURÉE PARTAGÉ */}
                                            <div className="p-6 bg-neon-purple/20 border border-neon-purple/40 rounded-3xl flex items-center justify-between shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                                                <div className="flex items-center gap-4">
                                                    <Timer className="w-6 h-6 text-neon-purple" />
                                                    <div>
                                                        <p className="text-[10px] font-black text-neon-purple uppercase tracking-widest">Durée des Interactions</p>
                                                        <p className="text-[8px] text-gray-500 font-bold uppercase italic">Affichage des Sondages & Quiz</p>
                                                    </div>
                                                </div>
                                                <select value={showCustomDuration ? "custom" : interactivityDuration} onChange={e => {
                                                    if (e.target.value === "custom") {
                                                        setShowCustomDuration(true);
                                                    } else {
                                                        setShowCustomDuration(false);
                                                        setInteractivityDuration(Number(e.target.value));
                                                    }
                                                }} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-black text-white outline-none focus:border-neon-purple">
                                                    <option value={60}>1 MINUTE</option>
                                                    <option value={120}>2 MINUTES</option>
                                                    <option value={180}>3 MINUTES</option>
                                                    <option value={300}>5 MINUTES</option>
                                                    <option value="custom">PERSONNALISÉ</option>
                                                </select>
                                                {showCustomDuration && (
                                                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-2">
                                                        <input 
                                                            type="number" 
                                                            value={interactivityDuration} 
                                                            onChange={e => setInteractivityDuration(Number(e.target.value))} 
                                                            className="w-16 bg-transparent text-xs font-black text-white p-2 outline-none"
                                                            placeholder="SEC"
                                                        />
                                                        <span className="text-[8px] font-black text-gray-500 mr-1">SEC</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* SONDAGES & QUIZ */}
                                                <div className="space-y-8">
                                                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                                                        <div className="flex items-center gap-3">
                                                            <BarChart3 className="w-6 h-6 text-neon-cyan" />
                                                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Sondages Express</h3>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <input type="text" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder="QUESTION (OUI/NON) ?" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white uppercase" />
                                                            <button onClick={async () => { if(!pollQuestion) return; const pollData = { question: pollQuestion, options: [{text:'OUI',votes:0},{text:'NON',votes:0}], active: true }; await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), { pseudo: "BOT_POLL", message: `[SYSTEM]:POLL:${JSON.stringify(pollData)}`, color: "text-neon-purple", time: new Date().toLocaleTimeString(), country: "FR", stage: activeStage }); setPollQuestion(''); setTimeout(() => handleAdminCommand('!clearpoll'), interactivityDuration * 1000); }} className="w-full py-4 bg-neon-cyan text-black font-black uppercase rounded-2xl">LANCER LE VOTE 📊</button>
                                                        </div>
                                                    </div>

                                                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                                                        <div className="flex items-center gap-3">
                                                            <Zap className="w-6 h-6 text-neon-purple" />
                                                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Quiz Aléatoire</h3>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase italic text-center">Une question choisie aléatoirement</p>
                                                        <button onClick={async () => { const q = predefinedQuizzes[Math.floor(Math.random() * predefinedQuizzes.length)]; const msg = `[QUIZ_START]:${q.question}|${q.options.join('|')}|${q.correct}`; await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), { pseudo: "BOT_QUIZ", message: msg, color: "text-neon-purple", time: new Date().toLocaleTimeString(), country: "FR", stage: activeStage }); setTimeout(() => handleAdminCommand('!clearquiz'), interactivityDuration * 1000); }} className="w-full py-6 bg-neon-purple text-white font-black uppercase rounded-2xl shadow-xl shadow-neon-purple/20">Lancer Question 🎲</button>
                                                    </div>
                                                </div>

                                                {/* LOTERIE & EFFETS */}
                                                <div className="space-y-8">
                                                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                                                        <div className="flex items-center gap-3">
                                                            <Trophy className="w-6 h-6 text-amber-500" />
                                                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Tirage au Sort</h3>
                                                        </div>
                                                         <div className="space-y-4">
                                                             {null}
                                                         </div>
                                                    </div>

                                                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                                                        <div className="flex items-center gap-3">
                                                            <Sparkles className="w-6 h-6 text-pink-500" />
                                                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Effets en Direct</h3>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <button onClick={() => triggerConfetti()} className="py-4 bg-neon-purple/10 border border-neon-purple/30 text-neon-purple rounded-xl font-black uppercase text-[10px]">Confettis</button>
                                                            <button onClick={() => triggerFireworks()} className="py-4 bg-pink-600/10 border border-pink-500/30 text-pink-500 rounded-xl font-black uppercase text-[10px]">Artifices</button>
                                                            <button onClick={() => handleAdminCommand('!rate')} className="col-span-2 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-black uppercase text-[10px]">Avis (!rate)</button>
                                                        </div>
                                                    </div>

                                                    <div className="p-8 bg-neon-red/5 border border-neon-red/20 rounded-[2.5rem] space-y-6">
                                                        <div className="flex items-center gap-3">
                                                            <Shield className="w-6 h-6 text-neon-red" />
                                                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Admin Chat & Modération</h3>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <button onClick={clearChat} className="py-4 bg-red-600/10 border border-red-500/30 text-red-500 rounded-xl font-black uppercase text-[10px] hover:bg-red-500 hover:text-white transition-all">Vider Chat</button>
                                                            <button 
                                                                onClick={async () => {
                                                                    const sysMsg = slowModeEnabled ? '[SYSTEM]:SLOW_OFF' : '[SYSTEM]:SLOW_ON';
                                                                    await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                                                                        pseudo: "BOT_SYSTEM",
                                                                        message: sysMsg,
                                                                        color: "text-neon-purple",
                                                                        time: new Date().toLocaleTimeString(),
                                                                        country: "FR",
                                                                        stage: activeStage
                                                                    });
                                                                }}
                                                                className={`py-4 ${slowModeEnabled ? 'bg-amber-600 text-black' : 'bg-amber-600/10 border border-amber-600/30 text-amber-500'} rounded-xl font-black uppercase text-[10px] transition-all`}
                                                            >
                                                                {slowModeEnabled ? 'LENT ACTIVÉ' : 'MODE LENT'}
                                                            </button>
                                                        </div>

                                                        {/* Moderation quick list */}
                                                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                                                            <div className="space-y-4">
                                                                <h4 className="text-[10px] font-black text-neon-cyan uppercase tracking-widest">🛡️ Modérateurs</h4>
                                                                <div className="flex gap-2">
                                                                    <input type="text" placeholder="PSEUDO" value={newModo} onChange={e => setNewModo(e.target.value.toUpperCase())} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white" />
                                                                    <button onClick={() => { if(newModo) { setModerators([...moderators, newModo]); setNewModo(''); }}} className="px-3 bg-neon-cyan text-black rounded-lg text-[10px] font-black">+</button>
                                                                </div>
                                                                <div className="max-h-[100px] overflow-y-auto pr-2 custom-scrollbar space-y-1">
                                                                    {moderators.map((m, i) => (
                                                                        <div key={i} className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                                                                            <span className="text-[9px] font-bold text-white uppercase">{m}</span>
                                                                            <button onClick={() => setModerators(moderators.filter((_, idx) => idx !== i))} className="text-gray-600 hover:text-red-500"><X className="w-3 h-3" /></button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <h4 className="text-[10px] font-black text-neon-red uppercase tracking-widest">🚫 Bannis</h4>
                                                                <div className="flex gap-2">
                                                                    <input type="text" placeholder="PSEUDO" value={newBanned} onChange={e => setNewBanned(e.target.value.toUpperCase())} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white" />
                                                                    <button onClick={() => { if(newBanned) { setBannedPseudos([...bannedPseudos, newBanned]); setNewBanned(''); }}} className="px-3 bg-neon-red text-white rounded-lg text-[10px] font-black">+</button>
                                                                </div>
                                                                <div className="max-h-[100px] overflow-y-auto pr-2 custom-scrollbar space-y-1">
                                                                    {bannedPseudos.map((p, i) => (
                                                                        <div key={i} className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                                                                            <span className="text-[9px] font-bold text-white uppercase">{p}</span>
                                                                            <button onClick={() => setBannedPseudos(bannedPseudos.filter((_, idx) => idx !== i))} className="text-gray-600 hover:text-red-500"><X className="w-3 h-3" /></button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* NEW SECTION: Bot Commands moved here for quick access */}
                                                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                                                        <div className="flex items-center gap-3">
                                                            <MessageSquare className="w-6 h-6 text-neon-cyan" />
                                                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Commandes Bot</h3>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-4">
                                                            <div className="space-y-3">
                                                                <input type="text" placeholder="!COMMANDE" value={newCmd.command} onChange={e => setNewCmd({ ...newCmd, command: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] text-white outline-none focus:border-neon-cyan" />
                                                                <textarea placeholder="RÉPONSE" value={newCmd.response} onChange={e => setNewCmd({ ...newCmd, response: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] text-white min-h-[50px]" />
                                                                <button onClick={() => { if (newCmd.command) { setBotCommands([...botCommands, { command: newCmd.command, response: newCmd.response }]); setNewCmd({ command: '', response: '' }); } }} className="w-full py-3 bg-neon-cyan text-black font-black text-[10px] rounded-xl uppercase">Ajouter la commande</button>
                                                            </div>
                                                            <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth grid grid-cols-2 gap-2">
                                                                {botCommands.map((cmd, idx) => (
                                                                    <div key={idx} className="flex justify-between items-center p-2.5 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                                                                        <span className="text-neon-cyan font-black text-[9px] uppercase tracking-tighter truncate max-w-[100px]">{cmd.command}</span>
                                                                        <button onClick={() => setBotCommands(botCommands.filter((_, i) => i !== idx))} className="text-gray-600 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : adminActiveTab === 'bot_drops' ? (
                                        <div className="space-y-12 animate-in fade-in duration-500">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* SECTION BOT */}
                                                <div className="space-y-8">
                                                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                                                        <div className="flex items-center gap-3">
                                                            <MessageSquare className="w-6 h-6 text-neon-cyan" />
                                                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Commandes Bot</h3>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <input type="text" placeholder="!COMMANDE" value={newCmd.command} onChange={e => setNewCmd({ ...newCmd, command: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-neon-cyan" />
                                                            <textarea placeholder="RÉPONSE" value={newCmd.response} onChange={e => setNewCmd({ ...newCmd, response: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white min-h-[60px]" />
                                                            <button onClick={() => { if (newCmd.command) { setBotCommands([...botCommands, { command: newCmd.command, response: newCmd.response }]); setNewCmd({ command: '', response: '' }); } }} className="w-full py-3 bg-neon-cyan text-black font-black text-[10px] rounded-xl uppercase">Ajouter</button>
                                                        </div>
                                                        <div className="max-h-[160px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                                            {botCommands.map((cmd, idx) => (
                                                                <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                                                    <span className="text-neon-cyan font-black text-[10px] uppercase">{cmd.command}</span>
                                                                    <button onClick={() => setBotCommands(botCommands.filter((_, i) => i !== idx))} className="text-gray-500 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* SECTION ECONOMIE */}
                                                <div className="space-y-8">
                                                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                                                        <div className="flex items-center gap-3">
                                                            <Coins className="w-6 h-6 text-neon-red" />
                                                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Économie Drops</h3>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[9px] font-black text-gray-500 uppercase ml-1 tracking-widest">Montant (💧)</label>
                                                                <input type="number" value={editDropsAmount} onChange={e => setEditDropsAmount(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] font-black text-gray-500 uppercase ml-1 tracking-widest">Intervalle (Min)</label>
                                                                <input type="number" value={editDropsInterval} onChange={e => setEditDropsInterval(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                                                            </div>
                                                        </div>
                                                        <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                                            {dropsLots.map((lot, idx) => (
                                                                <div key={idx} className="flex justify-between items-center p-2 bg-black/20 rounded-lg">
                                                                    <span className="text-[10px] font-bold text-white uppercase">{lot.name}</span>
                                                                    <span className="text-[10px] font-black text-neon-red">{lot.price} 💧</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                                <ModerationModal 
                                    isOpen={isModerationModalOpen} 
                                    onClose={() => setIsModerationModalOpen(false)} 
                                    initialTab={moderationTab}
                                    onSuccess={() => {
                                        // Update counts if needed
                                    }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>



                {/* Profile Overlay Card */}
                <AnimatePresence>
                    {selectedProfile && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
                            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute bottom-6 left-6 z-[100] w-72 bg-black/90 backdrop-blur-2xl border-2 border-white/10 rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-neon-cyan to-neon-purple" />
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className={`w-20 h-20 rounded-3xl border-2 flex items-center justify-center bg-white/5 relative overflow-hidden`} style={{ borderColor: selectedProfile.color || '#fff' }}>
                                    <FlagIcon location={selectedProfile.country} className="absolute inset-0 w-full h-full opacity-30 object-cover" />
                                    <span className="text-3xl font-black text-white relative z-10">{selectedProfile.pseudo[0]}</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-display font-black text-white italic tracking-tighter uppercase">{selectedProfile.pseudo}</h3>
                                    <div className="flex items-center justify-center gap-2 mt-1">
                                        <FlagIcon location={selectedProfile.country} className="w-4 h-3" />
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{countries.find(c => c.code === selectedProfile.country)?.name || 'Unknown'}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                                        <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Niveau</p>
                                        <p className="text-lg font-black text-neon-cyan">
                                            {Math.floor(Math.sqrt((chatMessages.find(m => m.pseudo === selectedProfile.pseudo)?.xp || 0) / 100)) + 1}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                                        <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Ratio Crédibilité</p>
                                        <p className="text-lg font-black text-amber-500">
                                            {selectedProfile.pseudo === localStorage.getItem('chat_pseudo')
                                                ? (userDrops / Math.max(1, timeOnSite / 3600)).toFixed(1)
                                                : (Math.random() * 500).toFixed(1)}
                                        </p>
                                    </div>
                                </div>

                                {/* Instagram Button if available */}
                                {(selectedProfile.pseudo === localStorage.getItem('chat_pseudo') ? userInstagram : "dropsiders.fr") && (
                                    <button
                                        onClick={() => window.open(`https://instagram.com/${(selectedProfile.pseudo === localStorage.getItem('chat_pseudo') ? userInstagram : "dropsiders.fr").replace('@', '')}`, '_blank')}
                                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black uppercase rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg"
                                    >
                                        <Instagram className="w-4 h-4" /> Instagram
                                    </button>
                                )}

                                <div className="flex gap-2 w-full">
                                    <button onClick={() => setSelectedProfile(null)} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-black uppercase rounded-xl transition-all">Fermer</button>
                                    {isMod && selectedProfile.pseudo !== 'ALEX_FR1' && (
                                        <button onClick={() => handleBanUser(selectedProfile.pseudo)} className="px-4 py-3 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-xl transition-all"><Ban className="w-5 h-5" /></button>
                                    )}
                                </div></div></motion.div>)}</AnimatePresence>

                {/* B. CHAT PANEL (Full height fix for mobile/desktop) */}
                <div className={`${isCinemaMode ? 'hidden' : 'w-full lg:w-[40%] flex-1 lg:h-full'} bg-black/60 backdrop-blur-2xl flex flex-col relative border-l border-white/5 shadow-2xl z-10 min-h-0 overflow-hidden`}>
                    {/* Chat Tabs */}
                    <div className="p-2 lg:p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <MessageSquare className="w-3 h-3 text-neon-red" />
                                <h3 className="text-[10px] md:text-2xl font-black text-white uppercase italic tracking-tighter">LIVE CHAT</h3>
                            </div>
                            {settings.showSponsorBanner && settings.sponsorText && (
                                <div className="hidden sm:flex items-center gap-2">
                                    <div className="h-3 w-[1px] bg-white/10" />
                                    <a href={settings.sponsorLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 group">
                                        <div className="px-2 py-1 bg-neon-purple/20 border border-neon-purple/50 rounded-lg text-[8px] font-black text-neon-purple uppercase tracking-widest italic group-hover:bg-neon-purple/40 transition-all shadow-[0_0_10px_rgba(168,85,247,0.2)]">PARTENAIRE</div>
                                        <span className="text-[10px] font-black text-white group-hover:text-neon-cyan transition-all uppercase italic truncate max-w-[200px] drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{settings.sponsorText}</span>
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {isMod && (
                                <button onClick={() => setIsModChat(!isModChat)} className={`px-2 py-1 rounded-md text-[8px] font-black uppercase flex items-center gap-1.5 transition-all ${isModChat ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}>
                                    <ShieldCheck className="w-3 h-3" /> CANAL MODOS
                                </button>
                            )}
                            <input type="color" value={accentColor} onChange={(e) => { setAccentColor(e.target.value); localStorage.setItem('chat_accent_color', e.target.value); }} className="w-6 h-6 rounded-full border-none p-0 cursor-pointer overflow-hidden bg-transparent" />
                        </div>
                    </div>

                    {
                        isConnected && (
                            <div className="flex items-center justify-between px-2 lg:px-4 bg-black/20 border-b border-white/10 overflow-x-auto scollbar-hide no-scrollbar">
                                <div className="flex gap-1 p-1 lg:p-2">
                                    {['CHAT', 'PLANNING', 'TRACKLIST', 'SHOP', 'DROPS'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveChatTab(tab === 'SHOP' ? 'shop' : tab === 'DROPS' ? 'drops' : tab.toLowerCase())}
                                            className={`px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg text-[8px] lg:text-[9px] font-black uppercase tracking-widest transition-all ${activeChatTab === (tab === 'SHOP' ? 'shop' : tab === 'DROPS' ? 'drops' : tab.toLowerCase()) ? 'bg-white/10 text-white border border-white/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                        >
                                            {tab === 'SHOP' ? 'SHOP OFFICIEL' : tab === 'DROPS' ? 'BOUTIQUE DROPS' : tab}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )
                    }

                    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 custom-scrollbar scroll-smooth flex flex-col gap-4 relative transition-all duration-500 bg-black/20 backdrop-blur-3xl min-h-0">

                        <div className="flex items-center justify-end mb-2">
                            <div className="bg-white/5 px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                                <span className="text-[8px] font-black uppercase text-gray-500">Hype Train</span>
                                <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div animate={{ width: `${hypeTrain.progress}%` }} className="h-full bg-neon-cyan" />
                                </div>
                            </div>
                        </div>


                        <AnimatePresence>
                            {mentionNotify && (
                                <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="absolute bottom-4 right-4 z-[50] bg-neon-red text-white text-[10px] font-black px-4 py-2 rounded-full shadow-[0_0_20px_rgba(255,0,51,0.5)]">
                                    ON T'A CITÉ ! 👇
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ⚡ Clash Poll Banner */}
                        <AnimatePresence>
                            {clashPoll && clashPoll.active && (
                                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="sticky top-0 z-[45] bg-black/95 border-2 border-white/20 rounded-3xl p-6 mb-6 shadow-2xl relative overflow-hidden">
                                    <div className="absolute inset-x-0 top-0 h-1 flex">
                                        <div className="flex-1 bg-red-600 shadow-[0_0_10px_#ef4444]" />
                                        <div className="flex-1 bg-blue-600 shadow-[0_0_10px_#2563eb]" />
                                    </div>
                                    <div className="flex items-center justify-between gap-6">
                                        <div className="flex-1 text-center space-y-2">
                                            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">{clashPoll.teamA}</p>
                                            <div className="text-xl font-black text-white uppercase italic">{clashPoll.votesA.length}</div>
                                            <button onClick={() => handleSendMessage(`!voter A`)} className="w-full py-2 bg-red-600/20 border border-red-600/40 text-red-500 text-[10px] font-black rounded-xl hover:bg-red-600/30 transition-all uppercase">VOTER A</button>
                                        </div>
                                        <div className="text-2xl font-black text-white italic opacity-20">VS</div>
                                        <div className="flex-1 text-center space-y-2">
                                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{clashPoll.teamB}</p>
                                            <div className="text-xl font-black text-white uppercase italic">{clashPoll.votesB.length}</div>
                                            <button onClick={() => handleSendMessage(`!voter B`)} className="w-full py-2 bg-blue-600/20 border border-blue-600/40 text-blue-500 text-[10px] font-black rounded-xl hover:bg-blue-600/30 transition-all uppercase">VOTER B</button>
                                        </div>
                                    </div>
                                    {isMod && (
                                        <button onClick={() => setClashPoll(null)} className="absolute top-2 right-2 text-[8px] text-gray-600 font-bold uppercase hover:text-white transition-all">STOP</button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ⚡ Quick Time Event (QTE) */}
                        <AnimatePresence>
                            {qteActive && (
                                <motion.div initial={{ scale: 0, rotate: -20, x: '-50%', y: '-50%' }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} className="fixed top-1/2 left-1/2 z-[200]">
                                    <button
                                        onClick={async () => {
                                            const myPseudo = localStorage.getItem('chat_pseudo') || "VISITEUR";
                                            setQteActive(false);
                                            showNotification("TU AS GAGNÉ LE QTE ! ⚡ (+500 DROPS)", 'success');
                                            triggerConfetti();
                                            setUserDrops(prev => prev + 500);
                                            await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                                                pseudo: "BOT_SYSTEM",
                                                message: `[SYSTEM]:QTE_WINNER:${myPseudo}`,
                                                color: "text-neon-cyan",
                                                time: new Date().toLocaleTimeString(),
                                                country: "FR"
                                            });
                                        }}
                                        className="w-32 h-32 bg-neon-cyan rounded-full border-8 border-white animate-bounce shadow-[0_0_50px_#00ffff] flex items-center justify-center group"
                                    >
                                        <Zap className="w-16 h-16 text-black group-active:scale-150 transition-transform" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {activePoll && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="sticky top-0 z-[40] bg-[#0a0a0a] border-2 border-neon-cyan/50 rounded-2xl p-4 mb-4">
                                    <p className="text-[10px] font-black text-neon-cyan uppercase tracking-widest mb-2">SONDAGE EN DIRECT</p>
                                    <h4 className="text-xs font-black text-white uppercase italic mb-4">{activePoll.question}</h4>
                                    <div className="space-y-2">
                                        {activePoll.options.map((opt: any, idx: number) => {
                                            const totalVotes = activePoll.options.reduce((sum: number, o: any) => sum + (o.votes || 0), 0);
                                            const percentage = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;

                                            return (
                                                <button
                                                    key={idx}
                                                    disabled={userVoted}
                                                    onClick={async () => {
                                                        if (!userVoted) {
                                                            setUserVoted(true);
                                                            localStorage.setItem('last_voted_poll', activePoll.question);
                                                            // Send vote to system
                                                            await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                                                                pseudo: "BOT_SYSTEM",
                                                                message: `[SYSTEM]:VOTE:${idx}`,
                                                                color: "text-neon-purple",
                                                                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                                                                country: "FR"
                                                            });
                                                        }
                                                    }}
                                                    className={`w-full relative h-10 bg-white/5 border border-white/10 rounded-xl overflow-hidden group transition-all ${userVoted ? 'cursor-default' : 'hover:border-neon-cyan/50 hover:bg-white/10'}`}
                                                >
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                        transition={{ duration: 1.2, ease: "easeOut" }}
                                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-cyan/10 to-neon-cyan/30"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-between px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-6 h-6 rounded-lg bg-neon-cyan/20 flex items-center justify-center text-[10px] font-black text-neon-cyan border border-neon-cyan/30">{idx + 1}</div>
                                                            <span className="text-[10px] font-bold text-white uppercase tracking-tight">{opt.text}</span>
                                                        </div>
                                                        {userVoted && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-neon-cyan">{percentage}%</span>
                                                                <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-2 text-[7px] font-black text-gray-500 uppercase text-right tracking-widest">
                                        {activePoll.options.reduce((sum: number, o: any) => sum + (o.votes || 0), 0)} VOTES TOTAL
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ⚡ Quick Time Event (QTE) */}
                        <AnimatePresence>
                            {qteActive && (
                                <motion.div initial={{ scale: 0, rotate: -20, x: '-50%', y: '-50%' }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} className="fixed top-1/2 left-1/2 z-[200]">
                                    <button
                                        onClick={async () => {
                                            const myPseudo = localStorage.getItem('chat_pseudo') || "VISITEUR";
                                            setQteActive(false);
                                            showNotification("TU AS GAGNÉ LE QTE ! ⚡ (+500 DROPS)", 'success');
                                            triggerConfetti();
                                            setUserDrops(prev => prev + 500);
                                            await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                                                pseudo: "BOT_SYSTEM",
                                                message: `[SYSTEM]:QTE_WINNER:${myPseudo}`,
                                                color: "text-neon-cyan",
                                                time: new Date().toLocaleTimeString(),
                                                country: "FR"
                                            });
                                        }}
                                        className="w-32 h-32 bg-neon-cyan rounded-full border-8 border-white animate-bounce shadow-[0_0_50px_#00ffff] flex items-center justify-center group"
                                    >
                                        <Zap className="w-16 h-16 text-black group-active:scale-150 transition-transform" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Simple Quiz Banner */}
                        <AnimatePresence>
                            {activeQuiz && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="sticky top-0 z-[40] bg-[#0a0a0a] border-2 border-neon-purple/50 rounded-3xl p-5 mb-6 shadow-[0_0_40px_rgba(168,85,247,0.2)] overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
                                        <motion.div
                                            initial={{ width: "100%" }}
                                            animate={{ width: "0%" }}
                                            transition={{ duration: 30, ease: "linear" }}
                                            className="h-full bg-neon-purple shadow-[0_0_10px_#a855f7]"
                                        />
                                    </div>
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-neon-purple flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                                                <Zap className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-neon-purple uppercase tracking-[0.2em] mb-1">QUIZ DROPSIDERS</p>
                                                <h4 className="text-sm font-black text-white uppercase italic leading-tight">{activeQuiz.question}</h4>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <div className="px-3 py-1 bg-amber-500 text-black text-[9px] font-black rounded-lg uppercase animate-pulse">100 DROPS</div>
                                            {quizTimeLeft !== null && (
                                                <div className="px-3 py-1 bg-red-600/20 border border-red-500/50 text-red-400 text-[10px] font-black rounded-lg uppercase flex items-center gap-1">
                                                    <Timer className="w-3 h-3" /> {quizTimeLeft}s
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                        {activeQuiz.options.map((opt: string, idx: number) => {
                                            const v = activeQuiz.votes || [0, 0, 0, 0];
                                            const total = v.reduce((a: number, b: number) => a + b, 0);
                                            const percentage = total > 0 ? Math.round((v[idx] / total) * 100) : 0;

                                            return (
                                                <div key={idx} className="relative group overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-4 transition-all hover:bg-white/10">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                        transition={{ duration: 1.2, ease: "easeOut" }}
                                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-purple/5 to-neon-purple/20"
                                                    />
                                                    <div className="flex items-center justify-between relative z-10">
                                                        <div className="flex items-center gap-4">
                                                            <span className="w-8 h-8 rounded-xl bg-neon-purple/20 flex items-center justify-center text-xs font-black text-neon-purple border border-neon-purple/30 group-hover:scale-110 transition-transform">
                                                                {idx + 1}
                                                            </span>
                                                            <span className="text-xs font-bold text-white uppercase tracking-tight">{opt}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[11px] font-black text-neon-purple">{percentage}%</span>
                                                            <span className="text-[7px] font-bold text-gray-600 uppercase tracking-tighter">{v[idx]} REP.</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Répondez par 1, 2, 3 ou 4 dans le chat</p>
                                        {userHasAnswered && (
                                            <span className="text-[8px] font-black text-neon-cyan uppercase">Participation enregistrée ✅ </span>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ⭐ Artist Rating Prompt */}
                        <AnimatePresence>
                            {showRatingPrompt && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute bottom-24 left-6 right-6 z-[80] bg-black/95 backdrop-blur-2xl border-2 border-neon-cyan/30 rounded-[2.5rem] p-8 text-center shadow-[0_0_50px_rgba(0,255,255,0.2)]"
                                >
                                    <div className="w-16 h-16 bg-neon-cyan/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Heart className="w-8 h-8 text-neon-cyan animate-pulse" />
                                    </div>
                                    <h4 className="text-xl font-display font-black text-white uppercase italic tracking-tighter mb-2">NOTE LE SET DE <span className="text-neon-cyan">{fluxCurrentArtist.artist}</span></h4>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-6">Partage ton avis avec la communauté !</p>

                                    <div className="flex justify-center gap-3 mb-8">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                onClick={async () => {
                                                    setSetRatings(prev => ({ ...prev, [fluxCurrentArtist.artist]: star }));
                                                    setShowRatingPrompt(false);
                                                    showNotification(`VOTE ENREGISTRÉ : ${star}/5 ⭐`, 'success');

                                                    // Broadcast rating via Appwrite
                                                    await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                                                        pseudo: "BOT_SYSTEM",
                                                        message: `[SYSTEM]:RATING:${fluxCurrentArtist.artist}:${star}`,
                                                        color: "text-neon-cyan",
                                                        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                                                        country: "FR",
                                                        stage: activeStage
                                                    });
                                                }}
                                                className="group relative"
                                            >
                                                <Star className={`w-10 h-10 transition-all ${star <= (setRatings[fluxCurrentArtist.artist] || 0) ? 'text-amber-500 fill-amber-500 scale-110 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-white/10 hover:text-amber-500/50 hover:scale-105'}`} />
                                            </button>
                                        ))}
                                    </div>

                                    <button onClick={() => setShowRatingPrompt(false)} className="text-[10px] font-black text-gray-500 uppercase hover:text-white transition-colors">Plus tard</button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {!isConnected ? (
                                <motion.div
                                    key="login-screen"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-[100] bg-[#0a0a0a]/95 backdrop-blur-xl flex items-center justify-center p-6"
                                >
                                    <div className="w-full max-w-md space-y-8">
                                        <div className="text-center space-y-3">
                                            <div className="w-20 h-20 bg-neon-red/10 border-2 border-neon-red rounded-[2.5rem] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(255,0,51,0.2)]">
                                                <MessageSquare className="w-10 h-10 text-neon-red animate-pulse" />
                                            </div>
                                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-black text-white uppercase italic tracking-tighter">Live Chat</h2>
                                            <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em]">Connectez-vous pour participer</p>
                                        </div>

                                        <form onSubmit={handleConnect} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4 italic">Pseudo</label>
                                                    <input
                                                        value={loginPseudo}
                                                        onChange={e => setLoginPseudo(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-black uppercase outline-none focus:border-neon-red/50 transition-all placeholder:text-gray-700"
                                                        placeholder="DX_RAVER"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4 italic">Pseudo Color</label>
                                                    <div className="flex gap-2 h-[58px]">
                                                        <input
                                                            type="color"
                                                            value={loginPseudoColor}
                                                            onChange={e => setLoginPseudoColor(e.target.value)}
                                                            className="w-full h-full bg-white/5 border border-white/10 rounded-2xl p-1 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4 italic">Email (Newsletter)</label>
                                                <input
                                                    type="email"
                                                    value={loginEmail}
                                                    onChange={e => setLoginEmail(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-neon-red/50 transition-all placeholder:text-gray-700"
                                                    placeholder="vibe@dropsiders.fr"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5 relative">
                                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4 italic">Pays (Auto-Flag)</label>
                                                    <input
                                                        value={loginCountrySearch}
                                                        onChange={e => {
                                                            setLoginCountrySearch(e.target.value);
                                                            const found = countries.find(c => c.name.toLowerCase().includes(e.target.value.toLowerCase()) || c.code.toLowerCase() === e.target.value.toLowerCase());
                                                            if (found) setLoginCountry(found.code);
                                                        }}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-black outline-none focus:border-neon-red/50 transition-all placeholder:text-gray-700"
                                                        placeholder="France, Canada..."
                                                    />
                                                    <div className="absolute right-4 top-10">
                                                        <FlagIcon location={loginCountry} className="w-6 h-4 rounded shadow-sm" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4 italic">Instagram</label>
                                                    <input
                                                        value={loginInstagram}
                                                        onChange={e => setLoginInstagram(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-neon-red/50 transition-all placeholder:text-gray-700"
                                                        placeholder="@user"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4 italic">Captcha : {captchaChallenge?.q}</label>
                                                <input
                                                    value={captchaInput}
                                                    onChange={e => setCaptchaInput(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-black outline-none focus:border-neon-red/50 transition-all placeholder:text-gray-700"
                                                    placeholder="Résultat..."
                                                />
                                            </div>

                                            {/* Newsletter Checkbox */}
                                            <div 
                                                onClick={() => setSubscribeNewsletter(!subscribeNewsletter)}
                                                className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer group hover:border-neon-red/30 transition-all"
                                            >
                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${subscribeNewsletter ? 'bg-neon-red border-neon-red shadow-[0_0_15px_rgba(255,0,51,0.4)]' : 'border-white/20 group-hover:border-white/40'}`}>
                                                    {subscribeNewsletter && <Check className="w-4 h-4 text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-white uppercase italic tracking-wider">S'inscrire à la Newsletter</p>
                                                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-tight">Actu, Line-ups & Exclusivités</p>
                                                </div>
                                            </div>

                                            <button type="submit" className="w-full bg-gradient-to-r from-neon-red to-pink-600 py-4 rounded-2xl text-white font-black uppercase italic tracking-widest shadow-lg shadow-neon-red/20 hover:scale-[1.02] active:scale-95 transition-all">
                                                Rejoindre le live
                                            </button>
                                        </form>
                                    </div>
                                </motion.div>
                            ) : activeChatTab === 'chat' ? (
                                <motion.div key="chat-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                    {pinnedMessage && (
                                        <div className="p-3 bg-neon-red/10 border border-neon-red/20 rounded-xl relative overflow-hidden group">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-[10px] text-neon-red font-black uppercase flex items-center gap-2">
                                                    <Pin className="w-3 h-3" /> Message Épinglé
                                                </p>
                                                {isMod && (
                                                    <button onClick={() => setPinnedMessage(null)} className="text-[9px] text-gray-500 hover:text-white font-bold uppercase transition-all">
                                                        Désépingler
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-white">
                                                <span className="font-black italic mr-2 text-neon-red">{pinnedMessage.user} :</span>
                                                {pinnedMessage.text}
                                            </p>
                                        </div>
                                    )}

                                    <AnimatePresence initial={false}>
                                        {chatMessages.filter(m => (isModChat || m.isModOnly ? m.isModOnly : true) && (m.stage || 'stage1') === activeStage && !m.message?.startsWith('[SYSTEM]:')).map((msg, idx) => {
                                            const isHovered = hoveredMessageId === msg.id;
                                            const isDimmed = hoveredMessageId !== null && !isHovered;

                                            return (
                                                <motion.div
                                                    key={msg.id || idx}
                                                    layout
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{
                                                        opacity: isDimmed ? 0.3 : 1,
                                                        y: 0,
                                                        scale: 1,
                                                        filter: isDimmed ? 'grayscale(0.5) blur(0.5px)' : 'none'
                                                    }}
                                                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                                                    onMouseLeave={() => setHoveredMessageId(null)}
                                                    onDoubleClick={() => setSelectedProfile({ pseudo: msg.pseudo, country: msg.country, color: msg.color })}
                                                    className={`group flex flex-col gap-0.5 relative px-2 py-0.5 lg:p-3 rounded-xl transition-all duration-300 cursor-pointer ${clashPoll?.active
                                                        ? (clashPoll.votesA.includes(msg.pseudo) ? 'mr-12 border-l-2 border-red-500' : clashPoll.votesB.includes(msg.pseudo) ? 'ml-12 border-r-2 border-blue-500 text-right items-end' : 'hover:bg-white/[0.02]')
                                                        : (msg.pseudo === localStorage.getItem('chat_pseudo') ? 'bg-white/5 ml-4 lg:ml-8' : 'hover:bg-white/[0.02]')
                                                        }`}
                                                    style={{
                                                        backgroundColor: msg.bgColor ? `${msg.bgColor}10` : undefined,
                                                        borderColor: msg.pseudo === localStorage.getItem('chat_pseudo') && profileBorder !== 'none' ? profileBorder : (msg.bgColor ? `${msg.bgColor}20` : undefined),
                                                        borderWidth: (msg.pseudo === localStorage.getItem('chat_pseudo') && profileBorder !== 'none') || msg.bgColor ? '1px' : '0px',
                                                        boxShadow: 'none'
                                                    }}
                                                >
                                                    {/* Mention highlighting */}
                                                    {localStorage.getItem('chat_pseudo') && msg.message.toLowerCase().includes(`@${localStorage.getItem('chat_pseudo')?.toLowerCase()}`) && (
                                                        <div className="absolute inset-0 bg-neon-red/10 border border-neon-red/30 rounded-2xl animate-pulse pointer-events-none" />
                                                    )}
                                                    <div className="flex gap-3 relative">
                                                        <div className={`w-9 h-9 rounded-xl border border-white/10 shrink-0 flex items-center justify-center bg-white/5 relative overflow-hidden group-hover:border-neon-red/30 transition-all ${(msg.isMod || msg.role === 'admin' || msg.pseudo === 'ALEX_FR1') ? 'border-neon-red/50 shadow-[0_0_10px_rgba(255,0,51,0.2)]' : ''}`}>
                                                            <FlagIcon 
                                                                location={(msg.isMod || msg.role === 'admin' || msg.pseudo === 'ALEX_FR1') ? 'FR' : msg.country} 
                                                                className={`absolute inset-0 w-full h-full object-cover ${(msg.isMod || msg.role === 'admin' || msg.pseudo === 'ALEX_FR1') ? '' : 'grayscale'}`} 
                                                            />
                                                            <div className="absolute inset-0 bg-black/20" />
                                                            {isHovered && <motion.div layoutId="bg-glow" className="absolute inset-0 bg-neon-red/5 blur-md" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                {(msg.isMod || msg.role === 'admin' || msg.pseudo === 'ALEX_FR1') ? <FlagIcon location="FR" className="w-3 h-2" /> : (msg.country && <FlagIcon location={msg.country} className="w-3 h-2" />)}
                                                                {(msg.geo || userCity) && (
                                                                    <span className="text-[7px] font-black text-gray-500 bg-white/5 px-1 rounded flex items-center gap-0.5">
                                                                        <MapPin className="w-2 h-2" /> {msg.geo || userCity}
                                                                    </span>
                                                                )}
                                                                <span className="text-[9px] font-black text-neon-cyan/60 shrink-0 uppercase tracking-tighter mr-1 text-xs">[Lvl {Math.floor(Math.sqrt((msg.xp || 0) / 100)) + 1}]</span>
                                                                <span className={`text-[11px] font-black uppercase italic tracking-tight ${msg.isHolo ? 'holo-pseudo' : (msg.xp > 5000 ? 'bg-gradient-to-r from-red-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent animate-gradient' : msg.color || 'text-white')}`}>{msg.pseudo || msg.user}</span>
                                                                {msg.isPrems && (
                                                                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-neon-red text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(255,0,51,0.5)] animate-pulse flex items-center gap-1">
                                                                        <Zap className="w-2 h-2" /> PREMS
                                                                    </motion.span>
                                                                )}
                                                                {topTalkers[0]?.pseudo === msg.pseudo && <Crown className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500 animate-bounce" />}
                                                                {topTalkers[1]?.pseudo === msg.pseudo && <Trophy className="w-2.5 h-2.5 text-gray-300 fill-gray-300" />}
                                                                {topTalkers[2]?.pseudo === msg.pseudo && <Trophy className="w-2.5 h-2.5 text-amber-600 fill-amber-600" />}


                                                                {/* Mod/VIP Badges */}
                                                                {showBadgesAdmin && msg.isMod && <Sword className="w-2.5 h-2.5 text-neon-red" />}
                                                                {showBadgesAdmin && msg.isVip && <Crown className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
                                                                {showBadgesAdmin && msg.pseudo === 'ALEX_FR1' && <Star className="w-2.5 h-2.5 text-neon-cyan fill-neon-cyan" />}

                                                                {/* Animated Badges */}
                                                                {showBadgesAdmin && (msg.role === 'admin' || msg.pseudo === 'ALEX_FR1') && (
                                                                    <motion.div
                                                                        animate={{ rotate: [0, 10, -10, 0] }}
                                                                        transition={{ repeat: Infinity, duration: 2 }}
                                                                        className="flex items-center gap-1 px-1 py-1 rounded-md bg-neon-purple/20 border border-neon-purple/30"
                                                                    >
                                                                        <ShieldCheck className="w-3 h-3" />
                                                                    </motion.div>
                                                                )}
                                                                {msg.bgColor && (
                                                                    <motion.div
                                                                        animate={{ scale: [1, 1.1, 1] }}
                                                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                                                    >
                                                                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                                    </motion.div>
                                                                )}

                                                                {msg.time && <span className="text-[8px] text-gray-600 font-mono ml-auto opacity-0 group-hover:opacity-100 transition-opacity">{msg.time}</span>}
                                                            </div>
                                                            {/* Reply support removed */}
                                                            <p className={`text-[11px] leading-relaxed break-all font-medium transition-all ${isHovered ? 'text-white' : 'text-gray-400'} ${msg.pseudo === localStorage.getItem('chat_pseudo') ? specialFontStyle : ''}`}>
                                                                {msg.translated ? (
                                                                    <span className="italic">
                                                                        <span className="text-[8px] bg-white/10 px-1 rounded mr-1">TRAD</span>
                                                                        {renderMessageContent(msg.translated)}
                                                                    </span>
                                                                ) : renderMessageContent(msg.message || msg.text)}
                                                            </p>
                                                            <div className="flex gap-1 mt-2">
                                                                {['👍', '🔥', '😂', '👀', '💎'].map(emoji => (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                                                                                pseudo: "BOT_SYSTEM",
                                                                                message: `[SYSTEM]:REACTION:${msg.id}:${emoji}`,
                                                                                color: "text-neon-purple",
                                                                                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                                                                                country: "FR"
                                                                            });
                                                                        }}
                                                                        className="px-1 py-0 bg-white/5 border border-white/5 rounded-md text-[8px] hover:bg-white/20 transition-all flex items-center gap-1"
                                                                    >
                                                                        {emoji} <span className="opacity-40">{msg.reactions?.[emoji] || 0}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="absolute right-0 top-0 hidden group-hover:flex items-center gap-1 bg-black/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10 z-20 shadow-2xl">
                                                            {/* Reply capability removed as DB schema doesn't support it */}
                                                            <button onClick={(e) => { e.stopPropagation(); setPinnedMessage(msg); }} title="Épingler" className="p-1.5 text-gray-400 hover:text-neon-cyan transition-all"><Pin className="w-3 h-3" /></button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setChatMessages(prev => prev.map(m => m.id === msg.id ? { ...m, translated: `[Traduction simulée]: ${m.message}` } : m));
                                                                }}
                                                                title="Traduire"
                                                                className="p-1.5 text-gray-400 hover:text-neon-cyan transition-all"
                                                            >
                                                                <Languages className="w-3 h-3" />
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }} title="Supprimer" className="p-1.5 text-gray-400 hover:text-red-500 transition-all"><X className="w-3 h-3" /></button>
                                                            {isAdmin && msg.pseudo !== 'ALEX_FR1' && (
                                                                <button onClick={(e) => { e.stopPropagation(); handleBanUser(msg.pseudo); }} title="Bannir" className="p-1.5 text-gray-400 hover:text-orange-500 transition-all border-l border-white/10 ml-1"><Ban className="w-3 h-3" /></button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                    {/* HEIST Overlay */}
                                    <AnimatePresence>
                                        {showHeistOverlay && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 20 }}
                                                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                                            >
                                                <motion.div
                                                    initial={{ scale: 0.8 }}
                                                    animate={{ scale: 1 }}
                                                    exit={{ scale: 0.8 }}
                                                    className="bg-gradient-to-br from-gray-900 to-black border border-neon-red/50 rounded-3xl p-8 text-center shadow-2xl max-w-md w-full relative"
                                                >
                                                    <button
                                                        onClick={() => setShowHeistOverlay(false)}
                                                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                                                    >
                                                        <X className="w-6 h-6" />
                                                    </button>
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <ShieldAlert className="w-16 h-16 text-neon-red animate-pulse" />
                                                        <h3 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">ALERTE BRAQUAGE !</h3>
                                                        <p className="text-sm text-gray-300">
                                                            Un braquage est en cours ! Participez pour tenter de gagner des DROPS.
                                                            Tapez <span className="font-mono text-neon-cyan">/braquage [montant]</span> dans le chat pour rejoindre.
                                                        </p>
                                                        <button
                                                            onClick={() => {
                                                                setShowHeistOverlay(false);
                                                                triggerPACMAN();
                                                                handleSendMessage("!braquage");
                                                            }}
                                                            className="mt-6 px-8 py-3 bg-neon-red text-white font-black uppercase italic tracking-widest rounded-xl hover:shadow-[0_0_25px_rgba(255,0,51,0.4)] transition-all transform active:scale-95"
                                                        >
                                                            Participer !
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div >
                            ) : activeChatTab === 'tracklist' ? (
                                <motion.div key="tracklist-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] text-center space-y-2">
                                        <Music className="w-8 h-8 text-neon-cyan mx-auto mb-2" />
                                        <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">Tracklist Live</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Identifiez les pépites en temps réel</p>
                                    </div>

                                    <div className="space-y-4">
                                        {tracklist.filter(s => (s.stage || 'stage1') === activeStage).length === 0 ? (
                                            <div className="py-20 text-center space-y-4 bg-white/5 border border-white/5 rounded-[2.5rem] border-dashed">
                                                <Search className="w-12 h-12 text-gray-800 mx-auto" />
                                                <p className="text-gray-600 font-black uppercase text-[10px] tracking-widest italic">Aucun morceau répertorié</p>
                                            </div>
                                        ) : (
                                            tracklist.filter(s => (s.stage || 'stage1') === activeStage).map((set, i) => {
                                                const isCurrent = i === 0;
                                                const isExpanded = isCurrent || expandedSets.includes(set.id);

                                                return (
                                                    <div key={set.id} className={`bg-white/5 border border-white/10 rounded-3xl overflow-hidden transition-all duration-500 ${isCurrent ? 'ring-1 ring-neon-cyan/30' : 'opacity-60'}`}>
                                                        <button 
                                                            onClick={() => {
                                                                if (!isCurrent) {
                                                                    setExpandedSets(prev => prev.includes(set.id) ? prev.filter(id => id !== set.id) : [...prev, set.id]);
                                                                }
                                                            }}
                                                            className="w-full p-4 flex items-center justify-between bg-white/[0.02] cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-neon-cyan animate-pulse shadow-[0_0_10px_#00ffff]' : 'bg-gray-600'}`} />
                                                                <div className="text-left">
                                                                    <h4 className="text-xs font-black text-white uppercase">{set.artist}</h4>
                                                                    <p className="text-[8px] text-gray-500 font-mono uppercase">Début du set : {set.startTime}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {isCurrent && (
                                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-neon-cyan/10 rounded-lg">
                                                                        <span className="text-[8px] font-black text-neon-cyan uppercase">EN DIRECT</span>
                                                                    </div>
                                                                )}
                                                                {!isCurrent && (
                                                                    <div className="text-gray-500">
                                                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </button>

                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div 
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="p-4 space-y-3 overflow-hidden border-t border-white/5"
                                                                >
                                                                    {set.tracks.length === 0 ? (
                                                                        <p className="text-[9px] text-gray-600 font-black uppercase italic text-center py-4">Soyez le premier à  indiquer un titre !</p>
                                                                    ) : (
                                                                        set.tracks.map(track => (
                                                                            <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={track.id} className="flex items-center justify-between gap-4 p-3 bg-black/40 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                                                                                <div className="flex items-center gap-3 min-w-0">
                                                                                    <span className="text-[9px] font-mono text-gray-600 group-hover:text-neon-cyan transition-colors">{track.time}</span>
                                                                                    <p className="text-[10px] font-bold text-white uppercase truncate">{track.title}</p>
                                                                                </div>
                                                                                <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                                                                                    <span className="text-[8px] font-black text-gray-500 uppercase">@{track.user}</span>
                                                                                </div>
                                                                            </motion.div>
                                                                        ))
                                                                    )}
                                                                    <div className="pt-4 border-t border-white/5">
                                                                        <div className="flex gap-2">
                                                                            <input 
                                                                                type="text" 
                                                                                placeholder="ID DU MORCEAU ?" 
                                                                                value={trackSuggestion}
                                                                                onChange={e => setTrackSuggestion(e.target.value)}
                                                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] text-white font-bold outline-none focus:border-neon-cyan/50"
                                                                            />
                                                                            <button 
                                                                                onClick={() => handleSuggestTrack(set.id)}
                                                                                className="px-4 py-2 bg-neon-cyan text-black font-black uppercase text-[10px] rounded-xl hover:scale-105 transition-all"
                                                                            >
                                                                                ENVOYER
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </motion.div>
                            ) : activeChatTab === 'planning' ? (
                                <motion.div key="planning-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                    {lineupItems.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-white/5 rounded-[2.5rem] border-dashed">
                                            <Calendar className="w-12 h-12 text-gray-700 mb-4" />
                                            <p className="text-gray-500 font-black uppercase text-[10px] tracking-widest italic">Aucun planning programm&#233;</p>
                                        </div>
                                    ) : (
                                        <>
                                            {planMulti && (
                                                <div className="flex gap-1.5 flex-wrap pb-1">
                                                    {planDays.map(day => (
                                                        <button key={day} onClick={() => setPlanningActiveDay(day)} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${day === planActive ? 'bg-neon-cyan/15 border-neon-cyan/40 text-neon-cyan' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
                                                            <Calendar className="w-2.5 h-2.5 inline mr-1 -mt-px" />{fmtPlanDay(day)}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {planItems.map(item => {
                                                const now = new Date();
                                                const [h, m] = (item.startTime || '00:00').replace('.', ':').replace('h', ':').split(':').map(Number);
                                                const [eh, em] = (item.endTime || '00:00').replace('.', ':').replace('h', ':').split(':').map(Number);
                                                
                                                // Construction de la date exacte du set
                                                const dateParts = item.day.split('-');
                                                const year = parseInt(dateParts[0]);
                                                const month = parseInt(dateParts[1]) - 1;
                                                const day = parseInt(dateParts[2]);

                                                const start = new Date(year, month, day, h, m, 0);
                                                const end = new Date(year, month, day, eh, em, 0);
                                                
                                                // Gérer les sets qui finissent après minuit
                                                if (eh < h) {
                                                    end.setDate(end.getDate() + 1);
                                                }

                                                const isNow = now >= start && now <= end;
                                                const isPast = now > end;
                                                const progress = isNow ? Math.min(100, Math.max(0, ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100)) : 0;
                                                return (
                                                    <div key={item.id} className={`p-4 border rounded-2xl space-y-3 transition-all relative overflow-hidden group ${isNow ? 'bg-neon-cyan/5 border-neon-cyan/30 shadow-[0_0_20px_rgba(0,255,255,0.05)]' : isPast ? 'opacity-40 grayscale-[0.5] bg-black/20 border-white/5' : 'bg-white/5 border-white/10'}`}>
                                                        {item.image && (<img src={item.image} alt="" className={`absolute inset-0 w-full h-full object-cover object-center ${isPast ? 'opacity-10' : 'opacity-30'} group-hover:opacity-45 group-hover:scale-105 transition-all duration-700 pointer-events-none`} />)}
                                                        <div className="flex items-center justify-between relative z-10">
                                                            <div className="flex items-center gap-2"><Calendar className="w-3 h-3 text-gray-500" /><span className={`text-[10px] font-black uppercase ${isNow ? 'text-neon-cyan' : 'text-gray-500'}`}>{item.stage}</span></div>
                                                            <div className="flex flex-col items-end">{!planMulti && <span className="text-[10px] font-mono text-white/80">{item.day}</span>}<span className="text-[10px] font-mono text-gray-500">{item.startTime} - {item.endTime}</span></div>
                                                        </div>
                                                        <div className="space-y-2 relative z-10">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="text-lg font-display font-black text-white uppercase italic tracking-tighter flex items-center gap-2">{isNow && <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />}{item.artist}</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {[item.instagram, item.instagram2, item.instagram3].map((insta, idx) => insta ? (
                                                                        <a key={idx} href={insta.startsWith('http') ? insta : `https://instagram.com/${insta.replace('@','')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-purple-600/20 to-pink-500/20 border border-pink-500/30 rounded-lg hover:border-pink-500/60 hover:scale-105 transition-all shrink-0"><Instagram className="w-3 h-3 text-pink-400" /><span className="text-[9px] font-black text-pink-300 uppercase hidden sm:block">{insta.replace('@','').replace('https://instagram.com/','').replace('https://www.instagram.com/','')}</span></a>
                                                                    ) : null)}
                                                                </div>
                                                            </div>
                                                            {isNow && (<div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2"><div className="h-full bg-neon-cyan shadow-[0_0_10px_#00ffff] transition-all duration-1000" style={{ width: `${progress}%` }} /></div>)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                                </motion.div>
                            ) : activeChatTab === 'shop' ? (
                                <motion.div key="shop-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto space-y-6 py-6 px-4 custom-scrollbar">
                                    <div className="text-center mb-8">
                                        <ShoppingBag className="w-12 h-12 text-neon-cyan mx-auto mb-4" />
                                        <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">Shop Officiel Dropsiders</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">Merchandising & Accessoires</p>
                                    </div>
                                    <div className="space-y-12">
                                        {Object.entries(groupedShopItems).map(([category, items]) => (
                                            <div key={category} className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                    <h4 className="text-[10px] font-black text-neon-cyan uppercase tracking-[0.4em] italic whitespace-nowrap">{category}</h4>
                                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                                                    {(items as any[]).map((item: any) => (
                                                        <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col group hover:border-neon-cyan/30 transition-all cursor-pointer shadow-xl relative overflow-hidden">
                                                            <div className="aspect-square rounded-xl bg-black/40 overflow-hidden mb-3 border border-white/10">
                                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                            </div>
                                                            <div className="flex-1 flex flex-col justify-between">
                                                                <div>
                                                                    <p className="text-[9px] lg:text-[10px] font-black text-white uppercase mb-1 leading-tight">{item.name}</p>
                                                                    <p className="text-[11px] font-black text-neon-cyan">{item.price} €</p>
                                                                </div>
                                                                <button 
                                                                    onClick={() => item.url ? window.open(item.url, '_blank') : showNotification(`ACHETER : ${item.name}`, 'success')} 
                                                                    className="w-full mt-3 py-1.5 bg-white/5 border border-white/10 text-[8px] font-black uppercase rounded-lg hover:bg-white/10 text-white transition-all"
                                                                >
                                                                    {item.url ? 'VOIR/ACHETER' : 'BIENTÔT'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl mt-8">
                                        <p className="text-[8px] font-bold text-neon-cyan/60 uppercase text-center leading-relaxed">Les articles officiels sont expédiés sous 48h. Paiement sécurisé.</p>
                                    </div>
                                </motion.div>
                            ) : activeChatTab === 'drops' ? (
                                <motion.div key="drops-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto space-y-4 text-center py-6 px-4 custom-scrollbar">
                                    <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-bounce" />
                                    <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">Shop des Drops</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-8">Améliorez votre profil avec vos drops</p>

                                    {/* 🏆 Leaderboard Section */}
                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 text-left space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Trophy className="w-5 h-5 text-amber-500" />
                                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Top 3 des plus riches</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {leaderboard.map((user, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-black/40 rounded-2xl border border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' : i === 1 ? 'bg-gray-300 text-black' : 'bg-amber-800 text-white'}`}>
                                                            {i === 0 ? <Crown className="w-4 h-4" /> : i + 1}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <FlagIcon location={user.country} className="w-3 h-2" />
                                                                <span className="text-xs font-black text-white uppercase italic tracking-tighter">{user.pseudo}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-neon-cyan/10 rounded-lg border border-neon-cyan/20">
                                                        <Zap className="w-3 h-3 text-neon-cyan" />
                                                        <span className="text-[10px] font-black text-neon-cyan tabular-nums">{user.drops.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500 font-bold uppercase mb-8">Obtenez des récompenses virtuelles avec vos drops !</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                                        <button
                                            onClick={() => {
                                                setActiveChatTab('chat');
                                                setIsHighlightChecked(true);
                                                showNotification("Activez l'éclair dans le chat pour choisir votre couleur !", 'success');
                                            }}
                                            className="aspect-square bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-amber-500/20 transition-all border-dashed relative overflow-hidden group shadow-xl"
                                        >
                                            <Zap className="w-6 h-6 text-amber-500 animate-pulse" />
                                            <div>
                                                <p className="text-[8px] font-black text-white uppercase tracking-tighter">MESSAGE COULEUR</p>
                                                <div className="mt-1 px-2 py-0.5 bg-amber-500 text-black text-[8px] font-black rounded uppercase mx-auto w-fit">{settings.highlightPrice || 100} DROPS</div>
                                            </div>
                                        </button>

                                        {(dropsLots.length > 0 ? dropsLots : [
                                            { id: 'sh3', name: 'BORDURE: NEON', price: 3000 },
                                            { id: 'sh4', name: 'STYLE: ITALIC', price: 1500 },
                                            { id: 'sh5', name: 'STYLE: PIXEL', price: 1500 }
                                        ]).map(lot => {
                                            const isTitle = lot.name.includes('TITRE');
                                            const isBorder = lot.name.includes('BORDURE');
                                            const Icon = isTitle ? User : isBorder ? Square : Sparkles;

                                            return (
                                                <button
                                                    key={lot.id}
                                                    onClick={() => {
                                                        if (userDrops < lot.price) {
                                                            showNotification(`Pas assez de DROPS (${lot.price} requis)`, 'error');
                                                            return;
                                                        }
                                                        setUserDrops(prev => {
                                                            const next = prev - lot.price;
                                                            localStorage.setItem('user_drops', next.toString());
                                                            return next;
                                                        });

                                                        if (lot.name.startsWith('TITRE:')) {
                                                            const t = lot.name.replace('TITRE: ', '');
                                                            // setUserTitle(t); // Désactivé car les titres ont été remplacés par les drapeaux
                                                            localStorage.setItem('user_chat_title', t);
                                                            showNotification(`Titre équipé : ${t}`, 'success');
                                                        } else if (lot.name.startsWith('BORDURE:')) {
                                                            const color = lot.name.includes('NEON') ? 'neon-cyan' : 'amber-500';
                                                            setProfileBorder(color);
                                                            localStorage.setItem('user_profile_border', color);
                                                            showNotification(`Bordure équipée !`, 'success');
                                                        } else if (lot.name.includes('PIXEL')) {
                                                            setSpecialFontStyle('pixel-font');
                                                            localStorage.setItem('user_font_style', 'pixel-font');
                                                            showNotification(`Police Pixel activée !`, 'success');
                                                        } else if (lot.name.includes('STYLE') || lot.name.includes('FONTS')) {
                                                            setSpecialFontStyle('italic-bold');
                                                            localStorage.setItem('user_font_style', 'italic-bold');
                                                            showNotification(`Style de police activé !`, 'success');
                                                        } else {
                                                            showNotification(`Achat réussi: ${lot.name}`, 'success');
                                                        }
                                                    }}
                                                    className="aspect-square bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-amber-500/30 hover:bg-white/10 transition-all group shadow-xl relative overflow-hidden"
                                                >
                                                    <Icon className="w-6 h-6 text-gray-500 group-hover:text-amber-500 transition-colors" />
                                                    <div className="px-2">
                                                        <p className="text-[8px] font-black text-white uppercase tracking-tighter leading-tight">{lot.name}</p>
                                                        <div className="mt-1 px-2 py-0.5 bg-white/10 text-white text-[8px] font-black rounded uppercase mx-auto w-fit group-hover:bg-amber-500 group-hover:text-black transition-all font-mono">{lot.price}</div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>

                    {
                        isConnected && activeChatTab === 'chat' && (
                            <div className="p-4 bg-black/40 border-t border-white/5 space-y-3">
                                {/* Reply support removed from footer */}
                                {isHighlightChecked && (
                                    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg transition-all border" style={{ backgroundColor: `${highlightColor}20`, borderColor: `${highlightColor}40` }}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase" style={{ color: highlightColor }}>Mise en avant</span>
                                            <input type="color" value={highlightColor} onChange={(e) => setHighlightColor(e.target.value)} className="w-5 h-4 bg-transparent border-none outline-none cursor-pointer p-0" />
                                        </div>
                                        <span className="text-[10px] font-black" style={{ color: highlightColor }}>{settings.highlightPrice || 100} DROPS</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 group focus-within:border-opacity-100 transition-all" style={{ borderColor: `${accentColor}40` }}>
                                    {slowModeEnabled && !isMod && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full animate-pulse">
                                            <Clock className="w-3 h-3 text-amber-500" />
                                            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Mode Lent (10s)</span>
                                        </div>
                                    )}
                                    <input
                                        type="text"
                                        value={isUserBanned ? "VOUS ÊTES BANNI" : newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        disabled={isUserBanned}
                                        onKeyDown={e => e.key === 'Enter' && handleSendMessage(newMessage)}
                                        placeholder={isUserBanned ? "ACCÈS REFUSÉ..." : slowModeEnabled && !isMod ? "MODE LENT ACTIF..." : "VOTRE MESSAGE..."}
                                        className={`flex-1 bg-transparent text-xs font-bold outline-none uppercase tracking-wider ${isUserBanned ? 'text-red-500' : 'text-white placeholder:text-gray-600'}`}
                                    />
                                    <button onClick={() => setShowGifPicker(!showGifPicker)} className="p-2 text-gray-500 hover:text-white transition-all">
                                        <Stars className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setIsHighlightChecked(!isHighlightChecked)} className={`p-2 rounded-lg transition-all ${isHighlightChecked ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                                        <Zap className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => window.open(window.location.href, 'Chat', 'width=400,height=800')} className="p-2 text-gray-500 hover:text-white transition-all" title="Détacher le chat">
                                        <Maximize2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleSendMessage(newMessage)} className="p-2 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all" style={{ backgroundColor: accentColor }}>
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                                {showGifPicker && (
                                    <div className="flex flex-col gap-3 p-3 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-2 max-h-72">
                                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-neon-cyan transition-all">
                                            <Search className="w-3.5 h-3.5 text-gray-500" />
                                            <input 
                                                type="text" 
                                                placeholder="RECHERCHER UN GIF..." 
                                                value={gifSearch}
                                                onChange={(e) => fetchGifs(e.target.value)}
                                                className="flex-1 bg-transparent text-[10px] font-black text-white outline-none uppercase tracking-widest"
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 overflow-y-auto custom-scrollbar pr-1 min-h-[120px]">
                                            {gifResults.map((gif, i) => (
                                                <img 
                                                    key={i} 
                                                    src={gif} 
                                                    onClick={() => { handleSendMessage(gif); setShowGifPicker(false); }} 
                                                    className="w-full h-16 object-cover rounded-lg cursor-pointer hover:scale-110 active:scale-95 transition-all bg-white/5" 
                                                />
                                            ))}
                                            {gifResults.length === 0 && <p className="col-span-3 text-center text-[8px] font-black text-gray-500 uppercase py-8 tracking-widest">Aucun résultat</p>}
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80" onClick={() => setActiveChatTab('drops')}>
                                        <Trophy className="w-3 h-3 text-amber-500" />
                                        <span className="text-[10px] font-black text-white">{userDrops} <span className="text-gray-600 ml-0.5 uppercase tracking-tighter">DROPS</span></span>
                                    </div>
                                    <span className="text-[8px] text-gray-700 font-bold uppercase tracking-widest">Powered by Dropsiders</span>
                                </div>
                            </div>
                        )
                    }
                </div>

                {/* Flash Message Overlay */}
                <AnimatePresence>
                    {
                        flashMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -50 }}
                                className="fixed top-24 left-1/2 -translate-x-1/2 z-[200]"
                            >
                                <div className={`px-8 py-4 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl border-2 flex items-center gap-4 ${flashMessage.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500 shadow-green-500/20' :
                                    flashMessage.type === 'warn' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-amber-500/20' :
                                        'bg-blue-500/10 border-blue-500/20 text-blue-500 shadow-blue-500/20'
                                    }`}>
                                    {flashMessage.type === 'success' ? <ShieldCheck className="w-6 h-6" /> :
                                        flashMessage.type === 'warn' ? <AlertCircle className="w-6 h-6 animate-pulse" /> :
                                            <Megaphone className="w-6 h-6" />}
                                    <span className="text-sm font-black uppercase tracking-widest">{flashMessage.text}</span>
                                </div>
                            </motion.div>
                        )
                    }
                </AnimatePresence >

                {/* Notification Toast */}
                <AnimatePresence>
                    {
                        toast.show && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200]">
                                <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                    {toast.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
                                </div>
                            </motion.div>
                        )
                    }
                </AnimatePresence >

                {/* 🚀 Arrival Animation */}
                <AnimatePresence>
                    {
                        newArrival && (
                            <motion.div
                                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 1.1 }}
                                className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
                            >
                                <div className="bg-black/80 backdrop-blur-xl border border-neon-cyan/30 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
                                    <div className="w-10 h-10 bg-neon-cyan/20 rounded-full flex items-center justify-center relative overflow-hidden">
                                        <User className="w-6 h-6 text-neon-cyan" />
                                        <motion.div
                                            animate={{ x: ['-100%', '100%'] }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-neon-cyan uppercase tracking-widest leading-none">Nouvel arrivant</p>
                                        <p className="text-sm font-black text-white uppercase italic tracking-tighter">{newArrival} vient d'arriver !</p>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    }
                </AnimatePresence >

                {/* PACMAN ANIMATION */}
                <AnimatePresence>
                    {
                        isPacmanActive && (
                            <motion.div
                                initial={{ x: '110vw' }}
                                animate={{ x: '-110vw' }}
                                transition={{ duration: 5, ease: "linear" }}
                                className="fixed top-1/2 left-0 z-[2000] pointer-events-none"
                            >
                                <div className="flex items-center gap-4 text-yellow-400">
                                    <motion.div
                                        animate={{ rotate: [0, 30, 0] }}
                                        transition={{ repeat: Infinity, duration: 0.2 }}
                                        className="w-16 h-16 bg-yellow-400 rounded-full relative"
                                        style={{ clipPath: 'polygon(100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 50%)' }}
                                    />
                                    <div className="flex gap-8">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="w-4 h-4 bg-white rounded-full opacity-50" />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    }
                </AnimatePresence>

                {/* MATRIX OVERLAY */}
                <AnimatePresence>
                    {
                        isMatrixActive && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[1000] pointer-events-none overflow-hidden bg-black/20"
                            >
                                <div className="absolute inset-0 opacity-40 font-mono text-[10px] text-[#00ff41] flex flex-wrap gap-2 p-4 leading-none select-none">
                                    {[...Array(2000)].map((_, i) => (
                                        <motion.span
                                            key={i}
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: [0, 1, 0], y: [0, 500] }}
                                            transition={{
                                                duration: Math.random() * 3 + 2,
                                                repeat: Infinity,
                                                delay: Math.random() * 5
                                            }}
                                        >
                                            {Math.random() > 0.5 ? '1' : '0'}
                                        </motion.span>
                                    ))}
                                </div>
                            </motion.div>
                        )
                    }
                </AnimatePresence>

                {/* BOSS FIGHT OVERLAY */}
                <AnimatePresence>
                    {
                        activeBoss && (
                            <motion.div
                                initial={{ y: 200, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 200, opacity: 0 }}
                                className="fixed bottom-20 left-4 z-[150] bg-black/80 backdrop-blur-xl border-2 border-neon-red p-4 rounded-3xl w-64 shadow-[0_0_30px_rgba(255,0,0,0.3)]"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Sword className="w-6 h-6 text-neon-red animate-pulse" />
                                    <div>
                                        <p className="text-[10px] font-black text-neon-red uppercase tracking-widest">BOSS APPARU !</p>
                                        <p className="text-sm font-black text-white uppercase italic">{activeBoss.name}</p>
                                    </div>
                                </div>
                                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        animate={{ width: `${(activeBoss.hp / activeBoss.maxHp) * 100}%` }}
                                        className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                                    />
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-[9px] font-black text-white/50">{activeBoss.hp} HP</span>
                                    <span className="text-[9px] font-black text-neon-red uppercase">TAPEZ !HIT</span>
                                </div>
                            </motion.div>
                        )
                    }
                </AnimatePresence>

                {/* HEIST OVERLAY */}
                <AnimatePresence>
                    {
                        activeHeist && (
                            <motion.div
                                initial={{ x: -200, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -200, opacity: 0 }}
                                className="fixed top-24 left-4 z-[150] bg-black/80 backdrop-blur-xl border-2 border-neon-cyan p-4 rounded-3xl w-64 shadow-[0_0_30px_rgba(0,255,255,0.2)]"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <ShieldCheck className="w-6 h-6 text-neon-cyan animate-bounce" />
                                    <div>
                                        <p className="text-[10px] font-black text-neon-cyan uppercase tracking-widest">BRAQUAGE EN COURS</p>
                                        <p className="text-xs font-bold text-white uppercase">{activeHeist?.participants?.length || 0} Braqueurs prêts</p>
                                    </div>
                                </div>
                                <div className="text-[9px] font-black text-white/50 mb-2 uppercase">TOTAL MISÉ : {activeHeist?.participants?.reduce((a, b) => a + (b?.bet || 0), 0) || 0} DROPS</div>
                                <div className="text-center py-1 bg-neon-cyan/10 rounded-lg">
                                    <span className="text-neon-cyan font-black animate-pulse">!braquage [montant] pour rejoindre</span>
                                </div>
                            </motion.div>
                        )
                    }
                </AnimatePresence>

                {/* QTE (Quick Time Event) Overlay */}
                <AnimatePresence>
                    {
                        activeQTE && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1.2 }} exit={{ scale: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[500]">
                                <button
                                    onClick={() => {
                                        const reward = activeQTE?.reward || 0;
                                        const isVipReward = Math.random() > 0.8;
                                        if (isVipReward) {
                                            setVipsList(prev => [...prev, localStorage.getItem('chat_pseudo') || '']);
                                            showNotification(`⚡ RÉFLEXE DE GÉNIE ! TU ES VIP TEMPORAIRE ! 👀`, 'success');
                                        } else {
                                            setUserDrops(prev => prev + reward);
                                            showNotification(`⚡ FAST CLICK ! +${reward} DROPS ! ⚡`, 'success');
                                        }
                                        setActiveQTE(null);
                                    }}
                                    className="p-10 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-full shadow-[0_0_50px_#00ffff] animate-pulse group"
                                >
                                    <Zap className="w-12 h-12 text-white group-hover:scale-125 transition-transform" />
                                    <p className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white font-black uppercase italic tracking-widest whitespace-nowrap">CLIQUE VITE !</p>
                                </button>
                            </motion.div>
                        )
                    }
                </AnimatePresence >

                {/* Achievement Popup */}
                <AnimatePresence>
                    {
                        showAchievementPopup && (
                            <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} className="fixed top-24 right-4 z-[300] bg-black/90 border-2 border-amber-500 p-4 rounded-2xl flex items-center gap-4 shadow-[#f59e0b20] shadow-2xl">
                                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                                    <Trophy className="w-7 h-7 text-black" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Succès Débloqué !</p>
                                    <p className="text-xs font-black text-white uppercase italic">{showAchievementPopup}</p>
                                </div>
                            </motion.div>
                        )
                    }
                </AnimatePresence >

                {/* SLOT MACHINE JACKPOT OVERLAY */}
                <AnimatePresence>
                    {
                        activeSlots && (
                            <motion.div
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 100, opacity: 0 }}
                                className="fixed bottom-24 right-4 z-[150] bg-black/80 backdrop-blur-xl border-2 border-amber-500 p-6 rounded-3xl w-72 shadow-[0_0_40px_rgba(245,158,11,0.3)]"
                            >
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                                            <Star className="w-6 h-6 text-black animate-spin" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">MINI-JEU JACKPOT</p>
                                            <p className="text-xl font-black text-white italic">LOTERIE !</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 justify-center py-4">
                                        {['🎰', '🍒', '7️⃣'].map((emoji, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ y: [0, -10, 0] }}
                                                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                                className="w-12 h-16 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-2xl"
                                            >
                                                {emoji}
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="space-y-2 w-full">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                                            {activeSlots.participants.length} JOUEURS • TICKET 50 DROPS
                                        </p>
                                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                animate={{ width: `${(activeSlots.timeLeft / 60) * 100}%` }}
                                                className="h-full bg-amber-500"
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleSendMessage("!ticket")}
                                            className="w-full py-3 bg-amber-500 text-black font-black uppercase rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
                                        >
                                            Prendre un ticket !
                                        </button>
                                        <p className="text-[8px] text-amber-500/50 font-black uppercase tracking-tighter italic">FIN DANS {activeSlots.timeLeft}S</p>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    }
                </AnimatePresence>

                {/* MUR DES LÉGENDES (Legends Wall Overlay) */}
                <AnimatePresence>
                    {
                        showLegendsWall && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/95 flex flex-col items-center justify-center overflow-hidden">
                                <div className="absolute top-10 flex flex-col items-center">
                                    <Crown className="w-16 h-16 text-amber-500 mb-4 animate-bounce" />
                                    <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-[0.5em] mb-2">Mur des Légendes</h2>
                                    <p className="text-amber-500/50 text-[10px] font-black uppercase tracking-[0.5em]">Dropsiders Hall of Fame</p>
                                </div>
                                <div className="flex-1 w-full max-w-4xl relative">
                                    <motion.div animate={{ y: [-1000, 1000] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="flex flex-col items-center space-y-12 py-32">
                                        {(topTalkers.length > 0 ? topTalkers : leaderboard).map((user: any, i) => (
                                            <div key={i} className="flex flex-col items-center group">
                                                {i < 3 && <Trophy className={`w-8 h-8 mb-2 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : 'text-amber-700'}`} />}
                                                <span className="text-3xl font-black text-white hover:text-amber-500 transition-colors uppercase italic">{user.pseudo}</span>
                                                <div className="flex items-center gap-2 text-white/30 text-[10px] font-black uppercase tracking-widest mt-1">
                                                    <span>{user.drops || user.count || 5000}+ DROPS</span>
                                                    <div className="w-1 h-1 rounded-full bg-white/20" />
                                                    <span>LÉGENDE ACTIVE</span>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="h-64" />
                                        <p className="text-white/20 text-xs font-black uppercase tracking-[1em] italic">Merci d'avoir fait partie de l'expérience Dropsiders</p>
                                    </motion.div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />
                                <button onClick={() => setShowLegendsWall(false)} className="absolute bottom-10 px-8 py-3 bg-white/10 border border-white/20 text-white text-[10px] font-black rounded-full hover:bg-white/20 transition-all uppercase tracking-widest">Fermer</button>
                            </motion.div>
                        )}
                </AnimatePresence>

                <AnimatePresence>
                    {toast.show && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300]"
                        >
                            <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                {toast.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ======= CUSTOM CONFIRM MODAL ======= */}
                <AnimatePresence>
                    {confirmModal && (
                        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                onClick={() => setConfirmModal(null)}
                                className="absolute inset-0 bg-black/90 backdrop-blur-2xl" 
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                                className="bg-[#0a0a0a] border-2 border-white/10 rounded-[3rem] p-10 max-w-md w-full relative z-10 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-neon-red via-neon-cyan to-neon-purple shadow-[0_0_15px_#ff0033]" />
                                
                                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                    <div className="w-20 h-20 bg-neon-red/10 border-2 border-neon-red/30 rounded-[2rem] flex items-center justify-center animate-pulse">
                                        <AlertCircle className="w-10 h-10 text-neon-red" />
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <h3 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">
                                            {confirmModal.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                                            {confirmModal.text}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 w-full pt-4">
                                        <button
                                            onClick={() => setConfirmModal(null)}
                                            className="px-6 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={() => {
                                                confirmModal.onConfirm();
                                                setConfirmModal(null);
                                            }}
                                            className="px-6 py-5 bg-neon-red hover:bg-red-700 shadow-[0_15px_40px_rgba(255,0,51,0.3)] rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all transform active:scale-95"
                                        >
                                            Confirmer
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* IMAGE CROPPER GLOBAL — accessible depuis tous les onglets (config logo, planning artiste) */}
            {cropImageSrc && (
                <ImageCropper
                    image={cropImageSrc}
                    aspect={editingLineupId === 'FESTIVAL_LOGO' ? 1 / 1 : 8 / 1}
                    onCropComplete={(croppedImage) => {
                        if (editingLineupId === 'FESTIVAL_LOGO') {
                            setEditFestivalLogo(croppedImage);
                            setEditingLineupId(null);
                        } else if (bulkCropIndex !== null) {
                            setBulkPreview(prev => prev.map((item, i) => i === bulkCropIndex ? { ...item, image: croppedImage } : item));
                            setBulkCropIndex(null);
                        } else {
                            setNewLineupItem({ ...newLineupItem, id: editingLineupId || '', image: croppedImage });
                        }
                        setCropImageSrc(null);
                    }}
                    onCancel={() => {
                        setCropImageSrc(null);
                        if (editingLineupId === 'FESTIVAL_LOGO') setEditingLineupId(null);
                        if (bulkCropIndex !== null) setBulkCropIndex(null);
                    }}
                />
            )}

            {ocrImage && (
                <ImageCropper
                    image={ocrImage}
                    onCropComplete={handleOcrCropComplete}
                    onCancel={() => setOcrImage(null)}
                />
            )}

            {/* Custom Time Edit Modal */}
            <AnimatePresence>
                {editingBulkTime && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-neon-cyan/5 pointer-events-none" />
                            
                            <div className="relative z-10 space-y-6 text-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-purple-600/20 rounded-[1.5rem] flex items-center justify-center">
                                        <Clock className="w-8 h-8 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter">Heure du Set</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{bulkPreview[editingBulkTime.index]?.artist}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Début</label>
                                        <input 
                                            type="time" 
                                            value={editingBulkTime.start}
                                            onChange={e => setEditingBulkTime({ ...editingBulkTime, start: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-xl font-mono text-white outline-none focus:border-purple-500 transition-all font-black text-center"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Fin</label>
                                        <input 
                                            type="time" 
                                            value={editingBulkTime.end}
                                            onChange={e => setEditingBulkTime({ ...editingBulkTime, end: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-xl font-mono text-white outline-none focus:border-neon-cyan/50 transition-all font-black text-center"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button 
                                        onClick={() => setEditingBulkTime(null)}
                                        className="flex-1 py-4 bg-white/5 text-white font-black uppercase rounded-2xl border border-white/10 hover:bg-white/10 transition-all text-sm tracking-widest"
                                    >
                                        NON
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const next = [...bulkPreview];
                                            next[editingBulkTime.index].startTime = editingBulkTime.start;
                                            next[editingBulkTime.index].endTime = editingBulkTime.end;
                                            setBulkPreview(next);
                                            setEditingBulkTime(null);
                                        }}
                                        className="flex-[1.5] py-4 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase rounded-2xl transition-all shadow-xl shadow-purple-500/20 text-sm tracking-widest"
                                    >
                                        VALIDER
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TakeoverPage;
/ /   r e - t r i g g e r   b u i l d  
 