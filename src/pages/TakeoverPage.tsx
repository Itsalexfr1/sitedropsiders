import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Settings, Users, MessageSquare, Send, Zap, Video,
    Save, AlertCircle, Music, Trash2, Plus,
    Pin, Star, ShieldCheck, Ban, Megaphone, User,
    BarChart3, Bell, Clock, Sword, Crown, Maximize2, Minimize2,
    Trophy, Stars, Heart, Volume2, Timer, ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Client, Databases, ID, Query } from 'appwrite';
import { FlagIcon } from '../components/ui/FlagIcon';

interface LineupItem {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    artist: string;
    stage: string;
    instagram: string;
}

interface StreamItem {
    id: string;
    name: string;
    youtubeId: string;
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
}

interface ShazamTrack {
    id: number;
    artist: string;
    title: string;
    time: string;
    image: string;
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
    const [userRole] = useState<'admin' | 'mod' | 'user'>(isAdmin ? 'admin' : 'user');
    const isMod = userRole === 'admin' || userRole === 'mod';
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [viewersCount] = useState(Math.floor(Math.random() * 50) + 10);
    const [activeChatTab, setActiveChatTab] = useState('chat');
    const [newMessage, setNewMessage] = useState('');
    const [isHighlightChecked, setIsHighlightChecked] = useState(false);
    const [highlightColor, setHighlightColor] = useState('#f59e0b');
    const [isConnected, setIsConnected] = useState(!!localStorage.getItem('chat_pseudo'));

    // Form States
    const [loginPseudo, setLoginPseudo] = useState('');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginCountry, setLoginCountry] = useState('FR');
    const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);

    const countryOptions = [
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

    const [shazamStatus, setShazamStatus] = useState<'idle' | 'listening' | 'processing' | 'found'>('idle');
    const [shazamHistory, setShazamHistory] = useState<ShazamTrack[]>(() => {
        const saved = localStorage.getItem('shazam_history');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('shazam_history', JSON.stringify(shazamHistory));
    }, [shazamHistory]);

    // Chat State
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [userCountry, setUserCountry] = useState('FR');
    const [isBanned, setIsBanned] = useState(false);
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
        title: initialSettings?.title || 'LIVE TAKEOVER',
        youtubeId: initialSettings?.youtubeId || '',
        mainFluxName: initialSettings?.mainFluxName || 'MAIN STAGE',
        currentTrack: initialSettings?.currentTrack || 'ID - UNRELEASED',
        tickerText: initialSettings?.tickerText || 'BIENVENUE SUR LE LIVE DROPSIDERS ! PROFITEZ DE LA MUSIQUE 24/7',
        showTickerBanner: initialSettings?.showTickerBanner !== undefined ? initialSettings.showTickerBanner : true,
        tickerBgColor: initialSettings?.tickerBgColor || '#ff0033',
        tickerTextColor: initialSettings?.tickerTextColor || '#ffffff',
        lineup: initialSettings?.lineup || '',
        status: initialSettings?.status || 'live',
        enabled: initialSettings?.enabled !== undefined ? initialSettings.enabled : true,
        streams: initialSettings?.streams || [],
        activeStreamId: initialSettings?.activeStreamId || '',
        highlightPrice: initialSettings?.highlightPrice || 100,
        lots: initialSettings?.lots || []
    });

    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    const [accentColor, setAccentColor] = useState(localStorage.getItem('chat_accent_color') || '#ff0033');
    const [isModChat, setIsModChat] = useState(false);
    const [activePoll, setActivePoll] = useState<any>(null);
    const [userVoted, setUserVoted] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<any>(null);
    const [mentionNotify, setMentionNotify] = useState(false);
    const [isCinemaMode, setIsCinemaMode] = useState(false);
    const [showBadgesAdmin, setShowBadgesAdmin] = useState(() => {
        const saved = localStorage.getItem('chat_show_badges');
        return saved !== null ? saved === 'true' : true;
    });
    const [marqueeItems, setMarqueeItems] = useState<{ text: string, link: string }[]>([]);
    const [editMarqueeItems, setEditMarqueeItems] = useState<{ text: string, link: string }[]>([]);

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
    const [isTTSActive, setIsTTSActive] = useState(false);
    const [vipsList, setVipsList] = useState<string[]>([]);
    const [showViewersList, setShowViewersList] = useState(false);
    const [flashMessage, setFlashMessage] = useState<{ text: string, type: 'info' | 'warn' | 'success' } | null>(null);
    const [isMatrixActive, setIsMatrixActive] = useState(false);
    const [pingAudio] = useState(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
    const [userXP, setUserXP] = useState(() => parseInt(localStorage.getItem('user_xp') || '0'));
    const [userLevel, setUserLevel] = useState(() => parseInt(localStorage.getItem('user_level') || '1'));
    const [activeHeist, setActiveHeist] = useState<{ participants: { pseudo: string, bet: number }[], timeLeft: number } | null>(null);
    const [activeBoss, setActiveBoss] = useState<{ hp: number, maxHp: number, name: string } | null>(null);
    const [chatTheme, setChatTheme] = useState<'neon' | 'synthwave' | 'cyberpunk'>('neon');
    const [captchaChallenge, setCaptchaChallenge] = useState<{ q: string, a: number } | null>(null);
    const [captchaInput, setCaptchaInput] = useState('');
    const [isFirstConnection, setIsFirstConnection] = useState(false);
    const [userCity, setUserCity] = useState('📍 PARIS');
    const [hypeTrain, setHypeTrain] = useState({ active: false, level: 0, progress: 0 });
    const [isMuted, setIsMuted] = useState(false);
    const [muteTimeLeft, setMuteTimeLeft] = useState(0);
    const [userTitle, setUserTitle] = useState(localStorage.getItem('user_chat_title') || '');
    const [profileBorder, setProfileBorder] = useState(localStorage.getItem('user_profile_border') || 'none');
    const [specialFontStyle, setSpecialFontStyle] = useState(localStorage.getItem('user_font_style') || 'normal');
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [activeQTE, setActiveQTE] = useState<{ id: string, type: 'click', reward: number } | null>(null);
    const [achievements, setAchievements] = useState<string[]>(JSON.parse(localStorage.getItem('user_achievements') || '[]'));
    const [isPacmanActive, setIsPacmanActive] = useState(false);
    const [showHeistOverlay, setShowHeistOverlay] = useState(false);
    const [activeSlots, setActiveSlots] = useState<{ id: string, participants: string[], timeLeft: number } | null>(null);

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

    // ⏲️ HEIST & BOSS TIMERS
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
            showNotification(`🏆 BOSS VAINCU ! +500 DROPS POUR TOUS !`, 'success');
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

    // ⏲️ Hourly Slot Machine (Jackpot) Timer
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
                    message: `🎰 JACKPOT : @${winner} a gagné le gros lot de ${prize} DROPS ! 💰`,
                    color: "text-amber-500",
                    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    country: "FR"
                });
            }
            setActiveSlots(null);
        }
    }, [activeSlots]);

    // ⏲️ Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })), 60000);
        return () => clearInterval(timer);
    }, []);

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

    // Admin Panel States
    const [editTitle, setEditTitle] = useState(settings.title);
    const [editStreams, setEditStreams] = useState<StreamItem[]>(settings.streams || []);
    const [editActiveStreamId, setEditActiveStreamId] = useState(settings.activeStreamId || '');
    const [editAnnText, setEditAnnText] = useState(settings.tickerText);
    const [editAnnEnabled, setEditAnnEnabled] = useState(settings.showTickerBanner);
    const [editStatus, setEditStatus] = useState(settings.status);
    const [editTickerBg, setEditTickerBg] = useState(settings.tickerBgColor);
    const [editTickerTextC, setEditTickerTextC] = useState(settings.tickerTextColor);
    const [editHighlightPrice, setEditHighlightPrice] = useState(settings.highlightPrice || 100);
    const [editAuddToken, setEditAuddToken] = useState(settings.auddToken || '');
    const [editDropsAmount, setEditDropsAmount] = useState(settings.dropsAmount || 10);
    const [editDropsInterval, setEditDropsInterval] = useState(settings.dropsInterval || 5);
    const [adminActiveTab, setAdminActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);

    const clearShazamHistory = async () => {
        if (!confirm('Voulez-vous vraiment vider l\'historique Shazam ?')) return;
        try {
            await fetch('/api/shazam/history', { method: 'DELETE' });
            setShazamHistory([]);
            localStorage.removeItem('shazam_history');
            showNotification('Historique Shazam vidé !', 'success');
        } catch (e) {
            showNotification('Erreur nettoyage history', 'error');
        }
    };

    const [dropsLots, setDropsLots] = useState<any[]>(settings.lots || []);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [botCommands, setBotCommands] = useState([
        { command: "!insta", response: "Suivez-nous sur @dropsiders.eu !" },
        { command: "!lineup", response: "La lineup est disponible dans l'onglet PLANNING." }
    ]);

    // Admin Form States
    const [newLot, setNewLot] = useState({ name: '', price: '', stock: '' });
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

    // 🎉 Special Effects Logic
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
        id: '', day: '', startTime: '', endTime: '', artist: '', stage: '', instagram: ''
    });

    const extractYoutubeId = (url: string) => {
        if (!url) return '';
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
        return match ? match[1] : url.trim();
    };

    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({
        show: false, message: '', type: 'success'
    });

    useEffect(() => {
        const init = async () => {
            fetchSettings();
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

            // First Connect Badge Check
            const isFirst = localStorage.getItem('is_first_connect') === null;
            if (isFirst) {
                setIsFirstConnection(true);
                localStorage.setItem('is_first_connect', 'done');
            }
        };
        init();

        // Appwrite Realtime Subscription
        const unsubscribe = client.subscribe(
            `databases.${DATABASE_ID}.collections.${COLLECTION_CHAT}.documents`,
            (response: any) => {
                if (response.events.includes('databases.*.collections.*.documents.*.create')) {
                    // Handle System / Logic Commands from Chat
                    const msgText = response.payload.message;

                    if (msgText.startsWith('[SYSTEM]:REACTION:')) {
                        const parts = msgText.replace('[SYSTEM]:REACTION:', '').split(':');
                        const msgId = parts[0];
                        const emoji = parts[1];
                        setChatMessages(prev => prev.map(m =>
                            m.id === msgId ? { ...m, reactions: { ...(m.reactions || {}), [emoji]: (m.reactions?.[emoji] || 0) + 1 } } : m
                        ));
                        return; // Don't add to chat
                    }

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
                            xp: response.payload.xp || 0
                        }];
                    });

                    // Update Hype Train
                    setHypeTrain(prev => {
                        let boost = 2; // Default per message
                        if (msgText.includes('donné') && msgText.includes('DROPS')) boost = 25; // Donation boost

                        const newProgress = prev.progress + boost;
                        if (newProgress >= 100) {
                            showNotification(`🔥 TRAIN DE LA HYPE NIVEAU ${prev.level + 1} ! 🎉`, 'success');
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
                                    next.options[voteIdx].votes = (next.options[voteIdx].votes || 0) + 1;
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
                        } else if (cmd === 'CONFETHI') {
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
                        } else if (cmd.startsWith('BOSS_HIT:')) {
                            const dmg = parseInt(cmd.replace('BOSS_HIT:', ''));
                            setActiveBoss(prev => prev ? { ...prev, hp: Math.max(0, prev.hp - dmg) } : null);
                        } else if (cmd.startsWith('MUTE_USER:')) {
                            const target = cmd.replace('MUTE_USER:', '');
                            const myPs = localStorage.getItem('chat_pseudo') || '';
                            if (target === myPs && !isMod && !vipsList.includes(myPs)) {
                                setIsMuted(true);
                                setMuteTimeLeft(60);
                                showNotification("🔇 TU AS ÉTÉ MUTE PENDANT 60S !", 'error');
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
                        } else if (cmd.startsWith('JACKPOT_SPAWN')) {
                            setActiveSlots({ id: Math.random().toString(), participants: [], timeLeft: 60 });
                        } else if (cmd.startsWith('JACKPOT_JOIN:')) {
                            const joiner = cmd.replace('JACKPOT_JOIN:', '');
                            setActiveSlots(prev => prev ? { ...prev, participants: [...new Set([...prev.participants, joiner])] } : null);
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

    // ⏲️ Quiz Auto-Timer (30s)
    useEffect(() => {
        if (activeQuiz && activeQuiz.question) {
            const timer = setTimeout(() => {
                setActiveQuiz(null);
            }, 30000);
            return () => clearTimeout(timer);
        }
    }, [activeQuiz]);

    // 📅 Auto-Cleanup Planning
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const currentTimeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

            setLineupItems(prev => {
                const filtered = prev.filter(item => {
                    // Expecting format HH:MM
                    if (!item.endTime) return true;
                    return item.endTime > currentTimeStr;
                });
                if (filtered.length !== prev.length) {
                    localStorage.setItem('takeover_lineup', JSON.stringify(filtered));
                }
                return filtered;
            });
        }, 60000);
        return () => clearInterval(interval);
    }, []);

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
            const msgs = res.documents.reverse().map(doc => ({
                id: doc.$id,
                pseudo: doc.pseudo,
                message: doc.message,
                color: doc.color,
                time: doc.time,
                country: doc.country,
                bgColor: doc.bgColor
            }));
            setChatMessages(msgs);
        } catch (e) { console.error("Error fetching initial chat messages:", e); }
    };

    const fetchPredefinedQuizzes = async () => {
        try {
            const res = await fetch('/api/quiz/active');
            if (res.ok) {
                const data = await res.json();
                setPredefinedQuizzes(Array.isArray(data) ? data.filter((q: any) => q.type === 'QCM') : []);
            }
        } catch (e) {
            console.error("Error fetching quizzes:", e);
        }
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
                    if (data.highlightPrice) setEditHighlightPrice(data.highlightPrice);
                    if (data.auddToken) setEditAuddToken(data.auddToken);
                    if (data.dropsAmount) setEditDropsAmount(data.dropsAmount);
                    if (data.dropsInterval) setEditDropsInterval(data.dropsInterval);
                }
            }
        } catch (e) { console.error("Error loading settings:", e); }
    };

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginPseudo.trim() || !loginEmail.trim()) {
            showNotification('Veuillez remplir tous les champs', 'error');
            return;
        }

        localStorage.setItem('chat_pseudo', loginPseudo.trim());
        localStorage.setItem('chat_email', loginEmail.trim());
        localStorage.setItem('chat_country', loginCountry);

        if (parseInt(captchaInput) !== captchaChallenge?.a) {
            showNotification('CAPTCHA INCORRECT ! 🤖', 'error');
            generateCaptcha();
            return;
        }

        setUserCountry(loginCountry);
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

    const handleSaveSettings = async () => {
        setIsSaving(true);
        const activeStream = editStreams.find(s => s.id === editActiveStreamId);
        const updatedTakeover: TakeoverSettings = {
            title: editTitle,
            youtubeId: activeStream?.youtubeId || '',
            mainFluxName: activeStream?.name || '',
            currentTrack: 'ID - UNRELEASED',
            tickerText: editAnnText,
            showTickerBanner: editAnnEnabled,
            tickerBgColor: editTickerBg,
            tickerTextColor: editTickerTextC,
            lineup: JSON.stringify(lineupItems),
            status: editStatus,
            enabled: editStatus !== 'off',
            streams: editStreams,
            activeStreamId: editActiveStreamId,
            highlightPrice: Number(editHighlightPrice),
            lots: dropsLots,
            auddToken: editAuddToken,
            dropsAmount: Number(editDropsAmount),
            dropsInterval: Number(editDropsInterval)
        };

        try {
            const saveRes = await fetch('/api/takeover-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTakeover)
            });
            if (saveRes.ok) {
                setSettings(updatedTakeover);
                showNotification('Paramètres mis à jour !', 'success');
            } else {
                showNotification('Erreur lors de la sauvegarde', 'error');
            }
        } catch (e) {
            showNotification('Erreur de connexion', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const clearChat = async () => {
        if (!confirm('Voulez-vous vraiment vider tout le chat ?')) return;
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
    };

    const showNotification = (message: string, type: 'success' | 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const unlockAchievement = (name: string) => {
        if (!achievements.includes(name)) {
            const next = [...achievements, name];
            setAchievements(next);
            localStorage.setItem('user_achievements', JSON.stringify(next));
            showNotification(`🏆 SUCCÈS : ${name}`, 'success');
        }
    };

    const handleSendMessage = async (customText?: string) => {
        const messageToSend = customText || newMessage;
        if (!messageToSend.trim() || isBanned || isMuted) {
            if (isMuted) showNotification(`MUTE : Encore ${muteTimeLeft}s`, 'error');
            return;
        }

        const price = settings.highlightPrice || 100;
        if (isHighlightChecked && userDrops < price) {
            showNotification(`Pas assez de DROPS (${price} requis)`, 'error');
            return;
        }

        const pseudo = localStorage.getItem('chat_pseudo') || (isMod ? "ALEX_FR1" : "VISITEUR");
        let messageText = messageToSend.trim();

        // 🛡️ Auto-Mod Intelligence
        if (!isMod) {
            const badWords = ['pd', 'fdp', 'salope', 'connard', 'pute'];
            if (badWords.some(w => messageText.toLowerCase().includes(w))) {
                showNotification("MESSAGE BLOQUÉ : Langage inapproprié", 'error');
                return;
            }
            if (/(https?:\/\/[^\s]+)/g.test(messageText)) {
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
                    showNotification(`MODE LENT : Attendez ${Math.ceil(10 - diff)}s ⌛`, 'error');
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
                    messageText = `💥 ROULETTE RUSSE : @${pseudo} a perdu ! MUTE 60s !`;
                    setIsMuted(true);
                    setMuteTimeLeft(60);
                } else {
                    messageText = `🔫 ROULETTE RUSSE : @${pseudo} a survécu... pour l'instant.`;
                }
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
            } else if (mainCmd === '!purge' && isMod) {
                const target = cmdParts[1]?.replace('@', '') || '';
                if (target) {
                    setChatMessages(prev => prev.filter(m => m.pseudo !== target));
                    messageText = `[SYSTEM]:PURGE:${target}`;
                }
            } else if (mainCmd === '!matrix') {
                messageText = `[SYSTEM]:MATRIX`;
            } else if (mainCmd === '!flash' && isMod) {
                messageText = `[SYSTEM]:FLASH:${messageText.replace('!flash ', '')}`;
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
                    messageText = `💰 @${pseudo} a volé ${amount} DROPS à @${target} !`;
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
                    messageText = `🎮 @${pseudo} joue ${userChoice} vs BOT ${botChoice} -> ${result}`;
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
                    showNotification("Besoin de 5000 DROPS pour mute !", "error");
                    return;
                }
            } else if (mainCmd === '!tts') {
                const voice = ['robot', 'monster', 'echo'].includes(cmdParts[1]) ? cmdParts[1] : 'normal';
                const cost = voice === 'normal' ? 50 : 200;
                if (userDrops >= cost) {
                    setUserDrops(prev => prev - cost);
                    if (voice !== 'normal') setHypeTrain(prev => ({ ...prev, progress: Math.min(100, prev.progress + 5), active: true }));
                    const text = voice === 'normal' ? cmdParts.slice(1).join(' ') : cmdParts.slice(2).join(' ');
                    messageText = `[SYSTEM]:TTS:${voice}:${text}`;
                } else {
                    showNotification(`TTS nécessite ${cost} Drops !`, 'error');
                    return;
                }
            } else if (mainCmd === '!pacman') {
                messageText = `🍕 WAKA WAKA ! [PACMAN INCOMING]`;
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
                    { msg: `🎲 @${pseudo} lance le Dé de la Destinée... et se fait MUTE 10s pour l'audace ! 🤐`, action: () => { setIsMuted(true); setMuteTimeLeft(10); } },
                    { msg: `🎲 @${pseudo} lance le Dé de la Destinée... et obtient un bonus d'XP ! ✨`, action: () => setUserXP(prev => prev + 50) },
                    { msg: `🎲 @${pseudo} lance le Dé de la Destinée... et ne gagne absolument rien. Dommage !`, action: () => { } },
                    { msg: `🎲 @${pseudo} lance le Dé de la Destinée... et déclenche des CONFETTIS ! 🎉`, action: () => triggerConfetti() }
                ];
                const finalOutcome = outcomes[roll - 1];
                finalOutcome.action();
                messageText = finalOutcome.msg;
            } else if (mainCmd === '!qte' && isMod) {
                const data = { id: Math.random().toString(), type: 'click', reward: 500 };
                messageText = `[SYSTEM]:QTE_SPAWN:${JSON.stringify(data)}`;
            }
        }

        // 🤖 ChatGPT Dropsiders Bot-4 Logic
        if (messageText.toLowerCase().includes('@botdrops') || messageText.toLowerCase().includes('@bot')) {
            setTimeout(async () => {
                const responses = [
                    "Je suis là ! On fait quoi ? 😎",
                    "Les Dropsiders sont les meilleurs, non ? 🔥",
                    "Désolé, je suis occupé à miner des Drops. 💎",
                    "C'est moi l'IA du futur ! 🤖",
                    "Bip Boup... Message reçu !"
                ];
                const botReply = responses[Math.floor(Math.random() * responses.length)];
                await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                    pseudo: "DROPS_BOT_4",
                    message: botReply,
                    color: "text-neon-cyan",
                    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    country: "FR"
                });
            }, 1000);
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
                country: "FR"
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

            await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                pseudo: userTitle ? `[${userTitle}] ${pseudo}` : pseudo,
                message: messageText,
                color: isHighlightChecked ? highlightColor : (isMod ? "text-neon-red" : "text-white"),
                bgColor: isHighlightChecked ? highlightColor : null,
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                country: userCountry || "FR",
                xp: userXP
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

            // 📣 TTS Broadcast
            if (isTTSActive && !messageText.startsWith('[SYSTEM]') && !messageText.startsWith('!')) {
                await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                    pseudo: "BOT_TTS",
                    message: `[SYSTEM]:TTS:${pseudo} dit : ${messageText}`,
                    color: "text-neon-cyan",
                    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    country: "FR"
                });
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

    const handleShazamAction = async () => {
        try {
            setShazamStatus('listening');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks: Blob[] = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                setShazamStatus('processing');
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const formData = new FormData();
                formData.append('audio', audioBlob, 'shazam.wav');

                try {
                    const res = await fetch('/api/shazam/identify', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await res.json();
                    if (data.status === 'success') {
                        const track: ShazamTrack = {
                            id: Date.now(),
                            artist: data.metadata.artist,
                            title: data.metadata.title,
                            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                            image: data.metadata.image || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=cover"
                        };
                        setShazamHistory(prev => [track, ...prev.slice(0, 19)]);
                        setShazamStatus('found');
                        setTimeout(() => setShazamStatus('idle'), 3000);

                        // Enregistrer dans l'historique serveur
                        fetch('/api/shazam/history', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...data.metadata, user: 'Alex' })
                        });
                    } else {
                        showNotification(data.error || 'Non identifié', 'error');
                        setShazamStatus('idle');
                    }
                } catch (e) {
                    showNotification('Erreur identification', 'error');
                    setShazamStatus('idle');
                } finally {
                    stream.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start();
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, 6000); // 6 secondes d'écoute
        } catch (err) {
            console.error(err);
            showNotification('Erreur: Micro non accessible', 'error');
            setShazamStatus('idle');
        }
    };

    const fluxCurrentArtist = lineupItems.find(item => {
        const now = new Date();
        const [h, m] = item.startTime.split(':').map(Number);
        const [eh, em] = item.endTime.split(':').map(Number);
        const startTime = new Date(); startTime.setHours(h, m, 0);
        const endTime = new Date(); endTime.setHours(eh, em, 0);
        return now >= startTime && now <= endTime;
    }) || { artist: 'DROPSIDERS LIVE', stage: 'MAIN STAGE' };

    return (
        <div className="fixed inset-0 bg-[#050505] flex flex-col font-sans select-none overflow-hidden z-[100]">
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
                `}
            </style>
            {/* 1. TOP ANNOUNCER (Ticker Removed) */}

            {/* 2. HEADER */}
            <div className="h-10 lg:h-16 border-b border-white/5 flex items-center justify-between px-3 lg:px-6 bg-black/40 backdrop-blur-md relative z-40">
                <div className="flex items-center gap-4 lg:gap-8">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 lg:gap-4">
                            <div className="flex flex-col items-start pr-4 border-r border-white/10">
                                <span className="text-[12px] lg:text-[14px] font-black text-white italic tracking-tighter tabular-nums leading-none">{currentTime}</span>
                                <span className="text-[7px] text-neon-red font-black uppercase tracking-widest mt-0.5 animate-pulse">LIVE NOW</span>
                            </div>
                            <div className="flex items-center gap-2 lg:gap-3">
                                <div className="flex items-center gap-1 px-1 py-0.5 bg-red-500/10 border border-red-500/20 rounded-md">
                                    <span className="w-1 h-1 bg-red-600 rounded-full animate-pulse" />
                                    <span className="text-[6px] lg:text-[9px] font-black text-red-500 uppercase tracking-tighter">LIVE</span>
                                </div>
                                <h1 className="text-[18px] lg:text-[32px] font-display font-black text-white italic tracking-tighter leading-none">{settings.title}</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 lg:gap-2 mt-2">
                            <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_8px_#00ffff]" />
                            <span className="text-[10px] lg:text-[11px] font-black text-gray-500 uppercase tracking-widest leading-none">NOW &gt;&gt;</span>
                            <span className="text-[14px] lg:text-[16px] font-black text-white uppercase italic tracking-tighter truncate max-w-[150px] lg:max-w-none">{fluxCurrentArtist.artist}</span>
                        </div>
                    </div>
                </div>

                {/* MULTI-CAM SELECTOR IN HEADER */}
                {settings.streams && settings.streams.length > 1 && (
                    <div className="hidden lg:flex gap-1 md:gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl mx-auto overflow-hidden shadow-lg">
                        {settings.streams.map((s: any) => (
                            <button
                                key={s.id}
                                onClick={() => setSettings(prev => ({ ...prev, activeStreamId: s.id }))}
                                className={`px-2 py-1 md:px-4 md:py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase transition-all flex items-center gap-2 truncate ${settings.activeStreamId === s.id ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,0,51,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                            >
                                <Video className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
                                <span className="truncate max-w-[80px] md:max-w-none">{s.name}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            if (isMod) {
                                setShowAdminPanel(true);
                                setAdminActiveTab('moderation');
                            }
                        }}
                        className={`flex items-center gap-2 lg:gap-4 px-2 lg:px-4 py-1.5 lg:py-2 bg-white/5 border border-white/10 rounded-xl transition-all ${isMod ? 'hover:bg-white/10 cursor-pointer' : ''}`}
                    >
                        <div className="flex items-center gap-1.5 lg:gap-2">
                            <Users className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-neon-cyan" />
                            <span className="text-[11px] lg:text-xs font-black text-white">{settings.status === 'off' ? 0 : viewersCount}</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setShowViewersList(!showViewersList)}
                        className={`p-2 lg:p-3 rounded-xl transition-all border ${showViewersList ? 'bg-pink-600 border-pink-500 shadow-[0_0_15px_rgba(219,39,119,0.4)] text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                        title="Liste des Viewers"
                    >
                        <Users className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                    <button
                        onClick={() => setIsCinemaMode(!isCinemaMode)}
                        className={`p-2 lg:p-3 rounded-xl transition-all border ${isCinemaMode ? 'bg-neon-cyan border-neon-cyan shadow-[0_0_15px_rgba(0,255,255,0.4)] text-black' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                        title="Mode Cinéma"
                    >
                        {isCinemaMode ? <Minimize2 className="w-4 h-4 lg:w-5 lg:h-5" /> : <Maximize2 className="w-4 h-4 lg:w-5 lg:h-5" />}
                    </button>
                    {isMod && (
                        <button onClick={() => setShowAdminPanel(!showAdminPanel)} className={`p-2 lg:p-3 rounded-xl transition-all border ${showAdminPanel ? 'bg-neon-purple border-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.4)] text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
                            <Settings className="w-4 h-4 lg:w-5 lg:h-5" />
                        </button>
                    )}
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-full transition-all">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* TOP NEWS MARQUEE (Replacing small ticker) */}
            <div className="h-8 lg:h-10 bg-neon-red/10 backdrop-blur-md border-b border-neon-red/30 flex items-center overflow-hidden group">
                <div className="bg-neon-red px-3 h-full flex items-center shrink-0 z-10 relative shadow-[0_0_15px_rgba(255,0,51,0.5)]">
                    <Megaphone className="w-3.5 h-3.5 text-white" />
                    <span className="ml-2 text-[9px] font-black text-white uppercase tracking-tighter cursor-default">NEWS FLUX</span>
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
                                        <Stars className="w-3 h-3 text-neon-red group-hover/newsitem:text-white transition-colors" />
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
                                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg transition-all"
                                        >
                                            <Crown className={`w-3 h-3 ${vipsList.includes(viewer) ? 'text-amber-500 fill-amber-500' : 'text-gray-500 hover:text-amber-500'}`} />
                                        </button>
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

            {/* 3. MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                {/* A. VIDEO PANEL (40% Mobile / 60% Desktop) */}
                <div className={`transition-all duration-700 ease-in-out ${isCinemaMode ? 'w-full lg:w-full h-full lg:h-full' : 'w-full lg:w-[60%] h-[40%] lg:h-full'} bg-black lg:border-r border-b lg:border-b-0 border-white/10 relative flex flex-col shrink-0 overflow-hidden`}>
                    {/* Always render the video behind to allow blur effect */}
                    <div className="absolute inset-0 z-0">
                        <iframe className="w-full h-full border-none" src={`https://www.youtube.com/embed/${settings.streams?.find((s: any) => s.id === settings.activeStreamId)?.youtubeId || settings.youtubeId || 'dQw4w9WgXcQ'}?autoplay=1&mute=0&rel=0&modestbranding=1`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />

                    </div>

                    <AnimatePresence>
                        {showAdminPanel && (
                            <motion.div
                                key="admin-panel"
                                initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                                animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
                                exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                                className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl p-8 overflow-y-auto custom-scrollbar"
                            >
                                <div className="max-w-3xl mx-auto space-y-10">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                        <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">Configuration du <span className="text-neon-purple">Studio</span></h2>
                                        <div className="flex gap-2">
                                            {['GÉNÉRAL', 'PLANNING', 'SHAZAM', 'SONDAGES / QUIZ', 'DROPS', 'BOT', 'MODÉRATION'].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setAdminActiveTab(t === 'SONDAGES / QUIZ' ? 'sondages' : t.toLowerCase())}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminActiveTab === (t === 'SONDAGES / QUIZ' ? 'sondages' : t.toLowerCase()) ? 'bg-white/10 text-white border border-white/20' : 'text-gray-500 hover:text-white'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                        <button onClick={() => setShowAdminPanel(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-6 h-6 text-gray-500" /></button>
                                    </div>

                                    <div className="min-h-[400px]">
                                        {adminActiveTab === 'general' ? (
                                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Titre du Live</label>
                                                            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-neon-purple transition-all uppercase" placeholder="EX: MAIN STAGE LIVE" />
                                                        </div>

                                                        <div className="pt-6 border-t border-white/5 space-y-6">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Video className="w-4 h-4 text-neon-purple" />
                                                                <h3 className="text-xs font-black text-white uppercase tracking-widest font-display italic">Gestion des Flux (Multiple)</h3>
                                                            </div>
                                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                                {editStreams.map((stream, idx) => (
                                                                    <div key={stream.id || idx} className={`p-4 rounded-2xl border transition-all ${editActiveStreamId === stream.id ? 'bg-neon-purple/10 border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'}`}>
                                                                        <div className="flex items-center justify-between mb-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${editActiveStreamId === stream.id ? 'bg-neon-purple text-white' : 'bg-white/10 text-gray-500'}`}>
                                                                                    {idx + 1}
                                                                                </div>
                                                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{stream.name || "Nouveau Flux"}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <button onClick={() => setEditActiveStreamId(stream.id)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${editActiveStreamId === stream.id ? 'bg-neon-purple text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}>
                                                                                    {editActiveStreamId === stream.id ? 'ACTIF' : 'ACTIVER'}
                                                                                </button>
                                                                                <button onClick={() => setEditStreams(editStreams.filter(s => s.id !== stream.id))} className="p-1.5 text-gray-500 hover:text-red-500 transition-all bg-white/5 rounded-lg">
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            <div className="space-y-2">
                                                                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest pl-2">Nom de la scène</label>
                                                                                <input type="text" value={stream.name} onChange={e => {
                                                                                    const ns = [...editStreams];
                                                                                    ns[idx].name = e.target.value.toUpperCase();
                                                                                    setEditStreams(ns);
                                                                                }} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-neon-purple uppercase" placeholder="MAIN STAGE" />
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest pl-2">YouTube (Link or ID)</label>
                                                                                <input type="text" value={stream.youtubeId} onChange={e => {
                                                                                    const ns = [...editStreams];
                                                                                    ns[idx].youtubeId = extractYoutubeId(e.target.value);
                                                                                    setEditStreams(ns);
                                                                                }} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-neon-purple" placeholder="Link or ID" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                <button onClick={() => setEditStreams([...editStreams, { id: Math.random().toString(36).substr(2, 9), name: '', youtubeId: '' }])} className="w-full py-4 bg-white/5 border border-dashed border-white/20 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:border-white/40 hover:text-white transition-all flex items-center justify-center gap-2">
                                                                    <Plus className="w-4 h-4" /> Ajouter un autre flux
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">


                                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Statut de la diffusion</label>
                                                            <div className="flex gap-2 p-1 bg-black/40 border border-white/10 rounded-xl">
                                                                {(['live', 'edit', 'off'] as const).map(s => (
                                                                    <button
                                                                        key={s}
                                                                        onClick={() => setEditStatus(s)}
                                                                        className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${editStatus === s
                                                                            ? (s === 'live' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : s === 'edit' ? 'bg-orange-600 text-white' : 'bg-gray-600 text-white')
                                                                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                                                                            }`}
                                                                    >
                                                                        {s === 'live' ? 'EN DIRECT' : s === 'edit' ? 'PRÉPARAT.' : 'OFFLINE'}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : adminActiveTab === 'sondages' ? (
                                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-neon-cyan/20 rounded-2xl flex items-center justify-center">
                                                            <BarChart3 className="w-6 h-6 text-neon-cyan" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">Gestion des Sondages</h3>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase">Lancez des votes interactifs pour les viewers</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6 pt-4 border-t border-white/5">
                                                        {activePoll ? (
                                                            <div className="bg-neon-cyan/10 border-2 border-neon-cyan/30 rounded-3xl p-8 space-y-6">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <span className="px-3 py-1 bg-neon-cyan text-black text-[8px] font-black rounded-lg uppercase tracking-widest mb-2 inline-block">SONDAGE ACTIF</span>
                                                                        <h4 className="text-xl font-black text-white uppercase italic">{activePoll.question}</h4>
                                                                    </div>
                                                                    <button
                                                                        onClick={async () => {
                                                                            await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                                                                                pseudo: "BOT_SYSTEM",
                                                                                message: '[SYSTEM]:CLEAR_POLL',
                                                                                color: "text-neon-purple",
                                                                                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                                                                                country: "FR"
                                                                            });
                                                                        }}
                                                                        className="px-6 py-3 bg-red-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                                                                    >
                                                                        Arrêter le sondage
                                                                    </button>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    {activePoll.options.map((opt: any, idx: number) => {
                                                                        const totalVotes = activePoll.options.reduce((sum: number, o: any) => sum + (o.votes || 0), 0);
                                                                        const percentage = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                                                                        return (
                                                                            <div key={idx} className="space-y-1">
                                                                                <div className="flex justify-between text-[10px] font-black text-white uppercase">
                                                                                    <span>{opt.text}</span>
                                                                                    <span>{opt.votes || 0} Votes ({percentage}%)</span>
                                                                                </div>
                                                                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                                                    <motion.div
                                                                                        initial={{ width: 0 }}
                                                                                        animate={{ width: `${percentage}%` }}
                                                                                        className="h-full bg-neon-cyan"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-6">
                                                                <div className="space-y-2">
                                                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Question du sondage</label>
                                                                    <input
                                                                        type="text"
                                                                        value={pollQuestion}
                                                                        onChange={e => setPollQuestion(e.target.value)}
                                                                        placeholder="EX: QU'AVEZ-VOUS PENSÉ DE CE SET ?"
                                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-sm font-bold text-white outline-none focus:border-neon-cyan transition-all uppercase"
                                                                    />
                                                                </div>
                                                                <div className="space-y-4">
                                                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Options de réponse</label>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        {pollOptions.map((opt, idx) => (
                                                                            <div key={idx} className="relative group">
                                                                                <input
                                                                                    type="text"
                                                                                    value={opt}
                                                                                    onChange={e => {
                                                                                        const next = [...pollOptions];
                                                                                        next[idx] = e.target.value.toUpperCase();
                                                                                        setPollOptions(next);
                                                                                    }}
                                                                                    placeholder={`OPTION ${idx + 1}`}
                                                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-neon-cyan transition-all uppercase"
                                                                                />
                                                                                {pollOptions.length > 2 && (
                                                                                    <button
                                                                                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                                                                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                                                    >
                                                                                        <Trash2 className="w-4 h-4" />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    {pollOptions.length < 4 && (
                                                                        <button
                                                                            onClick={() => setPollOptions([...pollOptions, ''])}
                                                                            className="w-full py-3 border border-dashed border-white/10 rounded-xl text-[10px] font-black text-gray-500 uppercase hover:border-white/30 hover:text-white transition-all flex items-center justify-center gap-2"
                                                                        >
                                                                            <Plus className="w-3 h-3" /> Ajouter une option
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={async () => {
                                                                        if (!pollQuestion || pollOptions.some(o => !o)) {
                                                                            showNotification("Remplis tout le sondage !", 'error');
                                                                            return;
                                                                        }
                                                                        const pollData = {
                                                                            question: pollQuestion,
                                                                            options: pollOptions.map(o => ({ text: o, votes: 0 })),
                                                                            active: true
                                                                        };
                                                                        await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                                                                            pseudo: "BOT_POLL",
                                                                            message: `[SYSTEM]:POLL:${JSON.stringify(pollData)}`,
                                                                            color: "text-neon-purple",
                                                                            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                                                                            country: "FR"
                                                                        });
                                                                        setPollQuestion('');
                                                                        setPollOptions(['', '']);
                                                                    }}
                                                                    className="w-full py-5 bg-neon-cyan text-black font-black uppercase rounded-2xl shadow-[0_10px_30px_rgba(0,255,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
                                                                >
                                                                    LANCER LE SONDAGE 🔥
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-neon-purple/20 rounded-2xl flex items-center justify-center">
                                                            <Zap className="w-6 h-6 text-neon-purple" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">Gestion des Quiz</h3>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase">Lancez des questions avec récompense (+100 DROPS)</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6 pt-4 border-t border-white/5">
                                                        {activeQuiz ? (
                                                            <div className="bg-neon-purple/10 border-2 border-neon-purple/30 rounded-3xl p-8 flex items-center justify-between">
                                                                <div>
                                                                    <span className="px-3 py-1 bg-neon-purple text-white text-[8px] font-black rounded-lg uppercase mb-2 inline-block">QUIZ EN COURS</span>
                                                                    <h4 className="text-xl font-black text-white uppercase italic">{activeQuiz.question}</h4>
                                                                </div>
                                                                <button
                                                                    onClick={async () => {
                                                                        await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                                                                            pseudo: "BOT_SYSTEM",
                                                                            message: '[SYSTEM]:CLEAR_QUIZ',
                                                                            color: "text-neon-purple",
                                                                            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                                                                            country: "FR"
                                                                        });
                                                                    }}
                                                                    className="px-6 py-3 bg-red-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                                                                >
                                                                    Arrêter le quiz
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {predefinedQuizzes.length > 0 ? (
                                                                    predefinedQuizzes.map((q, idx) => (
                                                                        <button
                                                                            key={idx}
                                                                            onClick={async () => {
                                                                                const msg = `[QUIZ_START]:${q.question}|${q.options.join('|')}|${q.correct}`;
                                                                                await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                                                                                    pseudo: "BOT_QUIZ",
                                                                                    message: msg,
                                                                                    color: "text-neon-purple",
                                                                                    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                                                                                    country: "FR"
                                                                                });
                                                                            }}
                                                                            className="p-6 bg-white/5 border border-white/10 rounded-2xl text-left hover:border-neon-purple/50 hover:bg-white/10 transition-all group"
                                                                        >
                                                                            <p className="text-[10px] font-black text-neon-purple uppercase mb-1 tracking-widest">QUIZ PRÉDÉFINI #{idx + 1}</p>
                                                                            <p className="text-sm font-bold text-white uppercase line-clamp-2">{q.question}</p>
                                                                        </button>
                                                                    ))
                                                                ) : (
                                                                    <div className="col-span-2 text-center py-10 border border-dashed border-white/10 rounded-3xl">
                                                                        <p className="text-xs font-bold text-gray-500 uppercase">Aucun quiz prédéfini dispo.</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : adminActiveTab === 'shazam' ? (
                                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-neon-purple/20 rounded-2xl flex items-center justify-center">
                                                            <Music className="w-6 h-6 text-neon-purple" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">Configuration Shazam</h3>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase">Gérez la reconnaissance musicale et l'historique</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                                        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex items-center justify-between">
                                                            <div>
                                                                <p className="text-xs font-black text-white uppercase mb-1">Vider l'historique</p>
                                                                <p className="text-[9px] text-gray-400 font-bold uppercase">Supprime tous les morceaux identifiés du site</p>
                                                            </div>
                                                            <button
                                                                onClick={clearShazamHistory}
                                                                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-red-600/20"
                                                            >
                                                                Vider Shazam
                                                            </button>
                                                        </div>

                                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">AudD API Token</label>
                                                            <input
                                                                type="password"
                                                                placeholder="VOTRE TOKEN AUDD.IO"
                                                                value={editAuddToken}
                                                                onChange={e => setEditAuddToken(e.target.value)}
                                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-neon-purple outline-none transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : adminActiveTab === 'planning' ? (
                                            <div className="space-y-10">
                                                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Plus className="w-6 h-6 text-neon-cyan" />
                                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Ajouter une session</h3>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Date / Agenda</label>
                                                            <input type="date" value={newLineupItem.day} onChange={e => setNewLineupItem({ ...newLineupItem, day: e.target.value })} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-neon-cyan transition-all" />
                                                        </div>
                                                        <input type="text" placeholder="ARTISTE" value={newLineupItem.artist} onChange={e => setNewLineupItem({ ...newLineupItem, artist: e.target.value.toUpperCase() })} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                                        <input type="text" placeholder="DEBUT" value={newLineupItem.startTime} onChange={e => setNewLineupItem({ ...newLineupItem, startTime: e.target.value })} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                                        <input type="text" placeholder="FIN" value={newLineupItem.endTime} onChange={e => setNewLineupItem({ ...newLineupItem, endTime: e.target.value })} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                                        <input type="text" placeholder="SCÈNE" value={newLineupItem.stage} onChange={e => setNewLineupItem({ ...newLineupItem, stage: e.target.value.toUpperCase() })} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                                        <input type="text" placeholder="INSTAGRAM" value={newLineupItem.instagram} onChange={e => setNewLineupItem({ ...newLineupItem, instagram: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                                    </div>
                                                    <button onClick={() => { if (newLineupItem.artist) { setLineupItems([...lineupItems, { ...newLineupItem, id: Date.now().toString() }]); setNewLineupItem({ id: '', day: '', startTime: '', endTime: '', artist: '', stage: '', instagram: '' }); } }} className="w-full py-4 bg-neon-cyan text-black font-black uppercase rounded-2xl hover:bg-neon-cyan/80 transition-all">Ajouter</button>
                                                </div>

                                                <div className="space-y-4">
                                                    {lineupItems.map((item, i) => (
                                                        <div key={item.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-gray-500 font-mono text-xs">{item.startTime}</div>
                                                                <div>
                                                                    <p className="text-white font-black uppercase text-sm">{item.artist}</p>
                                                                    <p className="text-[10px] text-neon-cyan font-bold uppercase">{item.stage}</p>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => setLineupItems(lineupItems.filter((_, idx) => idx !== i))} className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : adminActiveTab === 'drops' ? (
                                            <div className="space-y-8">
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Nouveau Lot</h3>
                                                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                                                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest pl-1">Prix Message Couleur (Drops)</label>
                                                            <input type="number" placeholder="PRIX HIGHLIGHT" value={editHighlightPrice} onChange={e => setEditHighlightPrice(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-neon-red outline-none" />

                                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                                <div>
                                                                    <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest pl-1">Gains (Drops)</label>
                                                                    <input type="number" placeholder="MONTANT" value={editDropsAmount} onChange={e => setEditDropsAmount(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-neon-red outline-none" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest pl-1">Toutes les (Min)</label>
                                                                    <input type="number" placeholder="INTERVALLE" value={editDropsInterval} onChange={e => setEditDropsInterval(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-neon-red outline-none" />
                                                                </div>
                                                            </div>
                                                            <p className="text-[9px] text-gray-500 font-bold uppercase leading-tight italic mt-2">Configurez combien de drops les utilisateurs gagnent et tous les combien de temps.</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Nouveau Lot Boutique</h3>
                                                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                                                            <input type="text" placeholder="NOM DU LOT" value={newLot.name} onChange={e => setNewLot({ ...newLot, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                                                            <input type="number" placeholder="PRIX EN DROPS" value={newLot.price} onChange={e => setNewLot({ ...newLot, price: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                                                            <button onClick={() => { if (newLot.name) { setDropsLots([...dropsLots, { id: Date.now(), name: newLot.name, price: Number(newLot.price), stock: 10 }]); setNewLot({ name: '', price: '', stock: '' }); } }} className="w-full py-3 bg-neon-red text-white font-black rounded-xl hover:bg-neon-red/80 transition-all">Ajouter à la boutique</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : adminActiveTab === 'bot' ? (
                                            <div className="space-y-8">
                                                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                                                    <h4 className="text-xs font-black text-neon-cyan uppercase tracking-widest">➕ Nouvelle Commande</h4>
                                                    <input type="text" placeholder="!COMMANDE" value={newCmd.command} onChange={e => setNewCmd({ ...newCmd, command: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                                                    <textarea placeholder="REPONSE" value={newCmd.response} onChange={e => setNewCmd({ ...newCmd, response: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white min-h-[80px]" />
                                                    <button onClick={() => { if (newCmd.command) { setBotCommands([...botCommands, { command: newCmd.command, response: newCmd.response }]); setNewCmd({ command: '', response: '' }); } }} className="w-full py-3 bg-neon-cyan text-black font-black rounded-xl hover:scale-[1.02] transition-all">Enregistrer</button>
                                                </div>

                                                {/* List of existing commands */}
                                                <div className="space-y-3">
                                                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">📋 Commandes Actives ({botCommands.length})</h4>
                                                    {botCommands.length === 0 ? (
                                                        <div className="text-center py-8 bg-white/5 border border-white/5 rounded-2xl">
                                                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest italic">Aucune commande configurée</p>
                                                        </div>
                                                    ) : (
                                                        botCommands.map((cmd, idx) => (
                                                            <div key={idx} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 hover:border-neon-cyan/20 p-4 rounded-2xl transition-all group">
                                                                <span className="text-neon-cyan font-black text-xs uppercase tracking-tight shrink-0 min-w-[100px]">{cmd.command}</span>
                                                                <span className="text-gray-400 text-xs font-bold flex-1 truncate">{cmd.response}</span>
                                                                <button
                                                                    onClick={() => setBotCommands(botCommands.filter((_, i) => i !== idx))}
                                                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-neon-red transition-all rounded-lg hover:bg-red-500/10"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        ) : adminActiveTab === 'moderation' ? (
                                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="p-8 bg-red-600/5 border border-red-600/20 rounded-[2.5rem] text-center space-y-4">
                                                        <Trash2 className="w-8 h-8 text-red-500 mx-auto" />
                                                        <h4 className="text-white font-black uppercase">Nettoyage Chat</h4>
                                                        <button onClick={clearChat} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase hover:bg-red-700 transition-all shadow-xl shadow-red-600/20">Vider le Chat</button>
                                                    </div>
                                                    <div className="p-8 bg-amber-600/5 border border-amber-600/20 rounded-[2.5rem] text-center space-y-4">
                                                        <Ban className="w-8 h-8 text-amber-500 mx-auto" />
                                                        <h4 className="text-white font-black uppercase">Mode Lent</h4>
                                                        <button
                                                            onClick={async () => {
                                                                const sysMsg = slowModeEnabled ? '[SYSTEM]:SLOW_OFF' : '[SYSTEM]:SLOW_ON';
                                                                await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                                                                    pseudo: "BOT_SYSTEM",
                                                                    message: sysMsg,
                                                                    color: "text-neon-purple",
                                                                    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                                                                    country: "FR"
                                                                });
                                                            }}
                                                            className={`w-full py-4 ${slowModeEnabled ? 'bg-amber-600' : 'bg-gray-600'} text-white rounded-2xl font-black uppercase transition-all`}
                                                        >
                                                            {slowModeEnabled ? 'DÉSACTIVER MODE LENT' : 'ACTIVER MODE LENT'}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                    <div className="p-8 bg-neon-purple/5 border border-neon-purple/20 rounded-[2.5rem] text-center space-y-4">
                                                        <Stars className="w-8 h-8 text-neon-purple mx-auto" />
                                                        <h4 className="text-white font-black uppercase">Effets Fixes</h4>
                                                        <div className="flex gap-4 flex-wrap justify-center">
                                                            <button onClick={() => triggerConfetti()} className="flex-1 min-w-[120px] py-4 bg-neon-purple text-white rounded-2xl font-black uppercase">Confettis</button>
                                                            <button onClick={() => triggerFireworks()} className="flex-1 min-w-[120px] py-4 bg-pink-600 text-white rounded-2xl font-black uppercase">Artifices</button>
                                                            <button onClick={() => handleSendMessage('!rate')} className="flex-1 min-w-[120px] py-4 bg-yellow-500 text-black rounded-2xl font-black uppercase">Avis Set</button>
                                                        </div>
                                                    </div>
                                                    <div className="p-8 bg-blue-600/5 border border-blue-600/20 rounded-[2.5rem] text-center space-y-4">
                                                        <Crown className="w-8 h-8 text-blue-500 mx-auto" />
                                                        <h4 className="text-white font-black uppercase">Affichage des Badges</h4>
                                                        <button
                                                            onClick={() => {
                                                                const next = !showBadgesAdmin;
                                                                setShowBadgesAdmin(next);
                                                                localStorage.setItem('chat_show_badges', next ? 'true' : 'false');
                                                            }}
                                                            className={`w-full py-4 ${showBadgesAdmin ? 'bg-blue-600' : 'bg-gray-600'} text-white rounded-2xl font-black uppercase transition-all`}
                                                        >
                                                            {showBadgesAdmin ? 'BADGES ACTIVÉS' : 'BADGES DÉSACTIVÉS'}
                                                        </button>
                                                        <div className="mt-4 pt-4 border-t border-white/10 text-left">
                                                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Utiliser les commandes chat :</div>
                                                            <div className="text-xs font-bold text-white uppercase italic">!vip @pseudo <span className="text-gray-500 font-normal">pour ajouter</span></div>
                                                            <div className="text-xs font-bold text-white uppercase italic">!unvip @pseudo <span className="text-gray-500 font-normal">pour retirer</span></div>
                                                        </div>
                                                    </div>
                                                    <div className="p-8 bg-neon-cyan/5 border border-neon-cyan/20 rounded-[2.5rem] text-center space-y-4">
                                                        <Volume2 className="w-8 h-8 text-neon-cyan mx-auto" />
                                                        <h4 className="text-white font-black uppercase">Synthèse Vocale (TTS)</h4>
                                                        <button onClick={() => setIsTTSActive(!isTTSActive)} className={`w-full py-4 ${isTTSActive ? 'bg-neon-cyan text-black' : 'bg-gray-600 text-white'} rounded-2xl font-black uppercase transition-all`}>
                                                            {isTTSActive ? 'DÉSACTIVER TTS' : 'ACTIVER TTS'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Marquee Settings */}
                                                <div className="col-span-1 md:col-span-2 p-8 bg-neon-red/5 border border-neon-red/20 rounded-[2.5rem] space-y-6">
                                                    <div className="flex items-center gap-4 justify-center mb-6">
                                                        <Megaphone className="w-8 h-8 text-neon-red" />
                                                        <h4 className="text-white font-black uppercase text-xl">Bandeau News (Défilant)</h4>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {editMarqueeItems.map((item, idx) => (
                                                            <div key={idx} className="flex flex-col md:flex-row gap-4 bg-black/40 p-4 rounded-2xl border border-white/10">
                                                                <div className="flex-1 space-y-2">
                                                                    <label className="text-[10px] font-black text-neon-red uppercase">Texte Info {idx + 1}</label>
                                                                    <input type="text" value={item.text} onChange={e => {
                                                                        const next = [...editMarqueeItems];
                                                                        next[idx].text = e.target.value;
                                                                        setEditMarqueeItems(next);
                                                                    }} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white uppercase outline-none focus:border-neon-red" placeholder="TEXTE (OPTIONNEL)" />
                                                                </div>
                                                                <div className="flex-1 space-y-2">
                                                                    <label className="text-[10px] font-black text-neon-red uppercase">Lien (Optionnel)</label>
                                                                    <input type="text" value={item.link} onChange={e => {
                                                                        const next = [...editMarqueeItems];
                                                                        next[idx].link = e.target.value;
                                                                        setEditMarqueeItems(next);
                                                                    }} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-neon-red" placeholder="https://" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={async () => {
                                                                setMarqueeItems(editMarqueeItems);
                                                                await databases.createDocument(DATABASE_ID, COLLECTION_CHAT, ID.unique(), {
                                                                    pseudo: "BOT_SYSTEM",
                                                                    message: `[SYSTEM]:MARQUEE_UPDATE:${JSON.stringify(editMarqueeItems)}`,
                                                                    color: "text-neon-cyan",
                                                                    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                                                                    country: "FR"
                                                                });
                                                                showNotification('Bandeau mis à jour', 'success');
                                                            }}
                                                            className="w-full py-4 bg-neon-red text-white font-black uppercase rounded-2xl mt-4 hover:bg-red-600 transition-colors shadow-xl shadow-red-500/20"
                                                        >
                                                            Mettre à jour le bandeau
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-8">
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div className="p-8 bg-red-600/5 border border-red-600/20 rounded-[2.5rem] text-center space-y-4">
                                                        <Trash2 className="w-8 h-8 text-red-500 mx-auto" />
                                                        <h4 className="text-white font-black uppercase">Nettoyage Chat</h4>
                                                        <button onClick={clearChat} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase">Vider le Chat</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-4 pt-6 border-t border-white/10">
                                        <button onClick={handleSaveSettings} disabled={isSaving} className="flex-1 py-4 bg-neon-purple text-white font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-neon-purple/80 transition-all shadow-xl shadow-neon-purple/20 flex items-center justify-center gap-3 disabled:opacity-50">
                                            <Save className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} />
                                            {isSaving ? 'ENREGISTREMENT...' : 'SAUVEGARDER'}
                                        </button>
                                    </div>
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

                                <div className="flex flex-col items-center mb-6">
                                    <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-white/5 to-white/10 border border-white/10 flex items-center justify-center mb-4 relative group">
                                        <User className="w-10 h-10 text-white" />
                                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-black" />
                                    </div>
                                    <h4 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter leading-none mb-2">{selectedProfile.pseudo}</h4>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                        <FlagIcon location={selectedProfile.country || 'FR'} className="w-3 h-2" />
                                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{selectedProfile.country || 'FR'}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5 text-center">
                                        <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Niveau</p>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                            <p className="text-xs text-white font-black italic">ELITE</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5 text-center">
                                        <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Drops</p>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Zap className="w-3 h-3 text-neon-cyan" />
                                            <p className="text-xs text-neon-cyan font-black italic">1.2K</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mb-8 justify-center">
                                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/30" title="Donateur"><Music className="w-4 h-4 text-red-500" /></div>
                                    <div className="w-8 h-8 rounded-lg bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/30" title="Actif"><BarChart3 className="w-4 h-4 text-neon-cyan" /></div>
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/30" title="Vétéran"><Bell className="w-4 h-4 text-amber-500" /></div>
                                </div>

                                <button
                                    onClick={() => setSelectedProfile(null)}
                                    className="w-full py-4 bg-white text-black text-[10px] font-black uppercase rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
                                >
                                    FERMER LE PROFIL
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div >

                {/* B. CHAT PANEL (60% Mobile / 40% Desktop) */}
                <div className={`${isCinemaMode ? 'hidden' : 'w-full lg:w-[40%] h-[60%] lg:h-full'} bg-black/60 backdrop-blur-2xl flex flex-col relative border-l border-white/5 shadow-2xl z-10`}>
                    {/* Chat Tabs */}
                    <div className="p-2 lg:p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="w-4 h-4 text-neon-red" />
                            <h3 className="text-[10px] font-black text-white tracking-[0.2em] uppercase italic">LIVE CHAT</h3>
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
                            <div className="flex gap-1 p-1 lg:p-2 bg-black/20 border-b border-white/10">
                                {['CHAT', 'PLANNING', 'SHAZAM', 'BOUTIQUE'].map(tab => (
                                    <button key={tab} onClick={() => setActiveChatTab(tab === 'BOUTIQUE' ? 'drops' : tab.toLowerCase())} className={`px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg text-[8px] lg:text-[9px] font-black uppercase tracking-widest transition-all ${activeChatTab === (tab === 'BOUTIQUE' ? 'drops' : tab.toLowerCase()) ? 'bg-white/10 text-white border border-white/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>{tab}</button>
                                ))}
                            </div>
                        )
                    }

                    <div className={`flex-1 overflow-y-auto px-4 lg:px-6 py-6 custom-scrollbar scroll-smooth flex flex-col gap-6 relative transition-all duration-500 ${chatTheme === 'synthwave' ? 'bg-[#050014] text-pink-500' :
                        chatTheme === 'cyberpunk' ? 'bg-[#0a0f0a] text-yellow-500' : 'bg-transparent'
                        }`}>
                        {chatTheme === 'synthwave' && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(transparent 0, rgba(255,0,255,0.05) 2px, transparent 4px)' }} />}

                        <div className="flex items-center justify-between mb-2">
                            <div className="flex gap-2">
                                {(['neon', 'synthwave', 'cyberpunk'] as const).map(t => (
                                    <button key={t} onClick={() => setChatTheme(t)} className={`px-2 py-1 text-[8px] font-black rounded-lg border transition-all ${chatTheme === t ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-gray-500 hover:text-white'}`}>
                                        {t.toUpperCase()}
                                    </button>
                                ))}
                            </div>
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

                        {/* Live Poll Banner */}
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
                                            <span className="text-[8px] font-black text-neon-cyan uppercase">Participation enregistrée ✔</span>
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
                                                        country: "FR"
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
                                    key="login-view"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full flex flex-col items-center justify-center p-6 space-y-8 bg-black/40 backdrop-blur-sm rounded-3xl"
                                >
                                    <div className="text-center space-y-2">
                                        <div className="w-16 h-16 bg-neon-red/10 border border-neon-red/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Users className="w-8 h-8 text-neon-red" />
                                        </div>
                                        <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">Rejoindre le chat</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">Entrez vos infos pour interagir en live</p>
                                    </div>

                                    <form onSubmit={handleConnect} className="w-full space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Pseudo</label>
                                            <input
                                                type="text"
                                                required
                                                value={loginPseudo}
                                                onChange={e => setLoginPseudo(e.target.value)}
                                                placeholder="TON PSEUDO"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-neon-red outline-none transition-all uppercase font-bold"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Email</label>
                                            <input
                                                type="email"
                                                required
                                                value={loginEmail}
                                                onChange={e => setLoginEmail(e.target.value)}
                                                placeholder="TON@EMAIL.COM"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-neon-red outline-none transition-all uppercase font-bold"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Pays</label>
                                            <div className="relative">
                                                <select
                                                    value={loginCountry}
                                                    onChange={e => setLoginCountry(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-neon-red outline-none transition-all appearance-none font-bold uppercase"
                                                >
                                                    {countryOptions.map(c => (
                                                        <option key={c.code} value={c.code} className="bg-[#080808] text-white">
                                                            {c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <FlagIcon location={loginCountry} className="w-4 h-3" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Captcha Section */}
                                        {captchaChallenge && (
                                            <div className="space-y-1.5 bg-black/40 p-4 rounded-xl border border-white/5">
                                                <label className="text-[9px] font-black text-neon-red uppercase tracking-[0.2em] mb-2 block">Vérification humaine (CAPTCHA)</label>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-center">
                                                        <span className="text-sm font-black text-white italic tracking-widest">{captchaChallenge.q}</span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={captchaInput}
                                                        onChange={e => setCaptchaInput(e.target.value)}
                                                        placeholder="?"
                                                        className="w-20 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-neon-red outline-none transition-all text-center font-black"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all group">
                                            <input
                                                type="checkbox"
                                                checked={subscribeNewsletter}
                                                onChange={e => setSubscribeNewsletter(e.target.checked)}
                                                className="w-4 h-4 rounded border-white/10 bg-black/40 text-neon-red focus:ring-neon-red"
                                            />
                                            <span className="text-[9px] text-gray-400 font-bold uppercase group-hover:text-white transition-colors">S'abonner à la newsletter et aux alertes live</span>
                                        </label>

                                        <button type="submit" className="w-full py-4 bg-neon-red text-white font-black uppercase italic tracking-widest rounded-2xl hover:shadow-[0_0_25px_rgba(255,0,51,0.4)] transition-all transform active:scale-95 shadow-xl">
                                            C'est parti !
                                        </button>
                                    </form>
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
                                        {chatMessages.filter(m => isModChat ? m.isModOnly : !m.isModOnly).map((msg, idx) => {
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
                                                    className={`group flex flex-col gap-1 relative p-3 rounded-2xl transition-all duration-300 cursor-pointer ${msg.pseudo === localStorage.getItem('chat_pseudo') ? 'bg-white/5 ml-4 lg:ml-8' : 'hover:bg-white/[0.02]'}`}
                                                    style={{
                                                        backgroundColor: msg.bgColor ? `${msg.bgColor}15` : undefined,
                                                        borderColor: msg.pseudo === localStorage.getItem('chat_pseudo') && profileBorder !== 'none' ? profileBorder : (msg.bgColor ? `${msg.bgColor}30` : undefined),
                                                        borderWidth: (msg.pseudo === localStorage.getItem('chat_pseudo') && profileBorder !== 'none') || msg.bgColor ? '1px' : '0px',
                                                        boxShadow: msg.bgColor ? `0 0 15px ${msg.bgColor}10` : 'none'
                                                    }}
                                                >
                                                    {/* Mention highlighting */}
                                                    {localStorage.getItem('chat_pseudo') && msg.message.toLowerCase().includes(`@${localStorage.getItem('chat_pseudo')?.toLowerCase()}`) && (
                                                        <div className="absolute inset-0 bg-neon-red/10 border border-neon-red/30 rounded-2xl animate-pulse pointer-events-none" />
                                                    )}
                                                    <div className="flex gap-3 relative">
                                                        <div className="w-9 h-9 rounded-xl border border-white/10 shrink-0 flex items-center justify-center bg-white/5 relative overflow-hidden group-hover:border-neon-red/30 transition-all">
                                                            <div className="text-[10px] font-black text-gray-400 group-hover:text-white transition-colors">{(msg.pseudo || msg.user || 'V')[0]}</div>
                                                            {isHovered && <motion.div layoutId="bg-glow" className="absolute inset-0 bg-neon-red/5 blur-md" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                {msg.country && <FlagIcon location={msg.country} className="w-3 h-2" />}
                                                                <span className="text-[8px] font-black text-gray-600 ml-1">{userCity}</span>
                                                                <span className="text-[9px] font-black text-neon-cyan/60 shrink-0 uppercase tracking-tighter mr-1 text-xs">[Lvl {Math.floor(Math.sqrt((msg.xp || 0) / 100)) + 1}]</span>
                                                                <span className={`text-[11px] font-black uppercase italic tracking-tight ${msg.xp > 5000 ? 'bg-gradient-to-r from-red-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent animate-gradient' : msg.color || 'text-white'}`}>{msg.pseudo || msg.user}</span>
                                                                {isFirstConnection && msg.pseudo === localStorage.getItem('chat_pseudo') && <span className="bg-neon-cyan text-black text-[7px] font-black px-1 rounded">PREMS</span>}

                                                                {/* Mod/VIP Badges */}
                                                                {showBadgesAdmin && msg.isMod && <Sword className="w-2.5 h-2.5 text-neon-red" />}
                                                                {showBadgesAdmin && msg.isVip && <Crown className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
                                                                {showBadgesAdmin && msg.pseudo === 'ALEX_FR1' && <Star className="w-2.5 h-2.5 text-neon-cyan fill-neon-cyan" />}

                                                                {/* Animated Badges */}
                                                                {showBadgesAdmin && (msg.role === 'admin' || msg.pseudo === 'ALEX_FR1') && (
                                                                    <motion.div
                                                                        animate={{ rotate: [0, 10, -10, 0] }}
                                                                        transition={{ repeat: Infinity, duration: 2 }}
                                                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-neon-purple/20 border border-neon-purple/30"
                                                                    >
                                                                        <ShieldCheck className="w-3 h-3 text-neon-purple" />
                                                                        <span className="text-[7px] font-black text-neon-purple uppercase">ADMIN</span>
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
                                                            <p className={`text-[11px] leading-relaxed break-all font-medium transition-colors ${isHovered ? 'text-white' : 'text-gray-400'} ${msg.pseudo === localStorage.getItem('chat_pseudo') ? specialFontStyle : ''}`}>
                                                                {msg.message || msg.text}
                                                            </p>
                                                            <div className="flex gap-1 mt-2">
                                                                {['👍', '🔥', '😂', '👑', '💎'].map(emoji => (
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
                                                                        className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[10px] hover:bg-white/20 transition-all flex items-center gap-1"
                                                                    >
                                                                        {emoji} <span className="opacity-50">{msg.reactions?.[emoji] || 0}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="absolute right-0 top-0 hidden group-hover:flex items-center gap-1 bg-black/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10 z-20 shadow-2xl">
                                                            {/* Reply capability removed as DB schema doesn't support it */}
                                                            {isMod && (
                                                                <>
                                                                    <button onClick={(e) => { e.stopPropagation(); setPinnedMessage(msg); }} title="Épingler" className="p-1.5 text-gray-400 hover:text-neon-cyan transition-all"><Pin className="w-3 h-3" /></button>
                                                                    <button onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }} title="Supprimer" className="p-1.5 text-gray-400 hover:text-red-500 transition-all"><X className="w-3 h-3" /></button>
                                                                    {isAdmin && msg.pseudo !== 'ALEX_FR1' && (
                                                                        <button onClick={(e) => { e.stopPropagation(); handleBanUser(msg.pseudo); }} title="Bannir" className="p-1.5 text-gray-400 hover:text-orange-500 transition-all border-l border-white/10 ml-1"><Ban className="w-3 h-3" /></button>
                                                                    )}
                                                                </>
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
                                </motion.div>
                            ) : activeChatTab === 'shazam' ? (
                                <motion.div key="shazam-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <button onClick={handleShazamAction} disabled={shazamStatus !== 'idle'} className={`w-full py-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${shazamStatus === 'idle' ? 'border-white/20 hover:border-neon-purple/50 bg-white/5' : 'border-neon-purple/50 bg-neon-purple/5'}`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${shazamStatus !== 'idle' ? 'bg-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 'bg-white/10'}`}>
                                            <Music className={`w-6 h-6 ${shazamStatus !== 'idle' ? 'animate-pulse text-white' : 'text-gray-500'}`} />
                                        </div>
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">{shazamStatus === 'idle' ? 'Identifier le morceau' : shazamStatus === 'listening' ? 'Écoute en cours...' : 'Recherche...'}</p>
                                    </button>
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Historique</h3>
                                        {shazamHistory.map(track => (
                                            <div key={track.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4 group">
                                                <img
                                                    src={track.image}
                                                    onError={(e) => e.currentTarget.src = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=cover"}
                                                    className="w-12 h-12 rounded-lg shrink-0 object-cover"
                                                    alt=""
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-white uppercase truncate">{track.title}</p>
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase truncate">{track.artist}</p>
                                                </div>
                                                <div className="text-[9px] font-mono text-gray-600">{track.time}</div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : activeChatTab === 'planning' ? (
                                <motion.div key="planning-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                    {lineupItems.map(item => {
                                        const now = new Date();
                                        const [h, m] = (item.startTime || "00:00").split(':').map(Number);
                                        const [eh, em] = (item.endTime || "00:00").split(':').map(Number);
                                        const start = new Date(); start.setHours(h, m, 0);
                                        const end = new Date(); end.setHours(eh, em, 0);
                                        const isNow = now >= start && now <= end;
                                        const progress = isNow ? Math.min(100, Math.max(0, ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100)) : 0;

                                        return (
                                            <div key={item.id} className={`p-4 border rounded-2xl space-y-3 transition-all ${isNow ? 'bg-neon-cyan/5 border-neon-cyan/30 shadow-[0_0_20px_rgba(0,255,255,0.05)]' : 'bg-white/5 border-white/10'}`}>
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[10px] font-black uppercase ${isNow ? 'text-neon-cyan' : 'text-gray-500'}`}>{item.stage}</span>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-mono text-white/80">{item.day}</span>
                                                        <span className="text-[10px] font-mono text-gray-500">{item.startTime} - {item.endTime}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-lg font-display font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                                                        {isNow && <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />}
                                                        {item.artist}
                                                    </p>
                                                    {isNow && (
                                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2">
                                                            <div
                                                                className="h-full bg-neon-cyan shadow-[0_0_10px_#00ffff] transition-all duration-1000"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            ) : activeChatTab === 'drops' ? (
                                <motion.div key="drops-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-center py-10 px-6">
                                    <Star className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-bounce" />
                                    <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">Boutique Drops</h3>

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

                                    <p className="text-xs text-gray-500 font-bold uppercase mb-8">Obtenez des récompenses avec vos drops !</p>
                                    <div className="grid grid-cols-1 gap-4">
                                        <button
                                            onClick={() => {
                                                setActiveChatTab('chat');
                                                setIsHighlightChecked(true);
                                                showNotification("Activez l'éclair dans le chat pour choisir votre couleur !", 'success');
                                            }}
                                            className="p-6 bg-amber-500/10 border-2 border-amber-500/40 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-amber-500/20 transition-all border-dashed relative overflow-hidden group"
                                        >
                                            <div className="absolute top-2 right-4">
                                                <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
                                            </div>
                                            <p className="text-xs font-black text-white uppercase tracking-widest">MESSAGE EN COULEUR 🌈</p>
                                            <div className="px-4 py-1.5 bg-amber-500 text-black text-[10px] font-black rounded-lg uppercase">{settings.highlightPrice || 100} DROPS</div>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase">Ton message avec le fond de ton choix !</p>
                                        </button>
                                        {dropsLots.map(lot => (
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

                                                    // Apply effect based on lot name
                                                    if (lot.name.startsWith('TITRE:')) {
                                                        const title = lot.name.replace('TITRE: ', '');
                                                        setUserTitle(title);
                                                        localStorage.setItem('user_chat_title', title);
                                                        showNotification(`Nouveau titre : ${title}`, 'success');
                                                    } else if (lot.name.startsWith('BORDURE:')) {
                                                        const color = lot.name.includes('NEON') ? 'neon-cyan' : 'amber-500';
                                                        setProfileBorder(color);
                                                        localStorage.setItem('user_profile_border', color);
                                                        showNotification(`Bordure équipée !`, 'success');
                                                    } else if (lot.name.startsWith('FONTS')) {
                                                        setSpecialFontStyle('italic-bold');
                                                        localStorage.setItem('user_font_style', 'italic-bold');
                                                        showNotification(`Style de police activé !`, 'success');
                                                    } else {
                                                        showNotification(`Achat réussi: ${lot.name}`, 'success');
                                                    }
                                                }}
                                                className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col items-center gap-3 hover:bg-white/10 transition-all border-dashed border-2 group"
                                            >
                                                <p className="text-xs font-black text-white uppercase group-hover:text-neon-cyan transition-colors">{lot.name}</p>
                                                <div className="px-4 py-1.5 bg-amber-500 text-black text-[10px] font-black rounded-lg uppercase">{lot.price} DROPS</div>
                                            </button>
                                        ))}

                                        {/* Static default items if list is empty or for demo */}
                                        {dropsLots.length === 0 && (
                                            <>
                                                {[
                                                    { id: 'sh1', name: 'TITRE: ALPHA', price: 2000 },
                                                    { id: 'sh2', name: 'TITRE: LÉGENDE', price: 5000 },
                                                    { id: 'sh3', name: 'BORDURE: NEON CYAN', price: 3000 },
                                                    { id: 'sh4', name: 'FONTS: SPECIAL', price: 1500 },
                                                    { id: 'sh5', name: 'FONTS: PIXEL', price: 1500 }
                                                ].map(lot => (
                                                    <button
                                                        key={lot.id}
                                                        onClick={() => {
                                                            if (userDrops < lot.price) {
                                                                showNotification(`Pas assez de DROPS (${lot.price} requis)`, 'error');
                                                                return;
                                                            }
                                                            setUserDrops(prev => prev - lot.price);
                                                            if (lot.name.startsWith('TITRE:')) {
                                                                const t = lot.name.replace('TITRE: ', '');
                                                                setUserTitle(t);
                                                                localStorage.setItem('user_chat_title', t);
                                                                showNotification(`Titre équipé : ${t}`, 'success');
                                                            } else if (lot.name.startsWith('BORDURE:')) {
                                                                const color = lot.name.includes('NEON') ? 'neon-cyan' : 'amber-500';
                                                                setProfileBorder(color);
                                                                localStorage.setItem('user_profile_border', color);
                                                                showNotification(`Bordure équipée !`, 'success');
                                                            } else if (lot.name.includes('FONTS: PIXEL')) {
                                                                setSpecialFontStyle('pixel-font');
                                                                localStorage.setItem('user_font_style', 'pixel-font');
                                                                showNotification(`Police Pixel activée !`, 'success');
                                                            } else if (lot.name.startsWith('FONTS')) {
                                                                setSpecialFontStyle('italic-bold');
                                                                localStorage.setItem('user_font_style', 'italic-bold');
                                                                showNotification(`Style de police activé !`, 'success');
                                                            } else {
                                                                showNotification(`Achat réussi : ${lot.name}`, 'success');
                                                            }
                                                        }}
                                                        className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col items-center gap-3 hover:bg-white/10 transition-all border-dashed border-2 group"
                                                    >
                                                        <p className="text-xs font-black text-white uppercase">{lot.name}</p>
                                                        <div className="px-4 py-1.5 bg-amber-500 text-black text-[10px] font-black rounded-lg uppercase">{lot.price} DROPS</div>
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>

                    {
                        isConnected && (
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
                                        value={isBanned ? "VOUS ÊTES BANNI" : newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        disabled={isBanned}
                                        onKeyDown={e => e.key === 'Enter' && handleSendMessage(newMessage)}
                                        placeholder={isBanned ? "ACCÈS REFUSÉ..." : slowModeEnabled && !isMod ? "MODE LENT ACTIF..." : "VOTRE MESSAGE..."}
                                        className={`flex-1 bg-transparent text-xs font-bold outline-none uppercase tracking-wider ${isBanned ? 'text-red-500' : 'text-white placeholder:text-gray-600'}`}
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
                                    <div className="grid grid-cols-3 gap-2 p-3 bg-black/60 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-2">
                                        {['https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHlxMHBnMGZ4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHgmbXA9Zw/3o7TKMGpxVfPtoog3m/giphy.gif', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHlxMHBnMGZ4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHgmbXA9Zw/LScqP82pdBAlC7xs6m/giphy.gif', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHlxMHBnMGZ4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHgmbXA9Zw/clotJgshs6nUUXf2i6/giphy.gif'].map((gif, i) => (
                                            <img key={i} src={gif} onClick={() => { handleSendMessage(gif); setShowGifPicker(false); }} className="w-full h-16 object-cover rounded-lg cursor-pointer hover:scale-110 transition-transform" />
                                        ))}
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
            </div>

            {/* Flash Message Overlay */}
            <AnimatePresence>
                {flashMessage && (
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
                )}
            </AnimatePresence>

            {/* Notification Toast */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200]">
                        <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                            {toast.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🆕 Arrival Animation */}
            <AnimatePresence>
                {newArrival && (
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
                )}
            </AnimatePresence>

            {/* PACMAN ANIMATION */}
            <AnimatePresence>
                {isPacmanActive && (
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
                )}
            </AnimatePresence>

            {/* MATRIX OVERLAY */}
            <AnimatePresence>
                {isMatrixActive && (
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
                )}
            </AnimatePresence>

            {/* BOSS FIGHT OVERLAY */}
            <AnimatePresence>
                {activeBoss && (
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
                )}
            </AnimatePresence>

            {/* HEIST OVERLAY */}
            <AnimatePresence>
                {activeHeist && (
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
                )}
            </AnimatePresence>

            {/* QTE (Quick Time Event) Overlay */}
            <AnimatePresence>
                {activeQTE && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1.2 }} exit={{ scale: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[500]">
                        <button
                            onClick={() => {
                                const reward = activeQTE?.reward || 0;
                                const isVipReward = Math.random() > 0.8;
                                if (isVipReward) {
                                    setVipsList(prev => [...prev, localStorage.getItem('chat_pseudo') || '']);
                                    showNotification(`⚡ RÉFLEXE DE GÉNIE ! TU ES VIP TEMPORAIRE ! 👑`, 'success');
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
                )}
            </AnimatePresence>

            {/* Achievement Popup */}
            <AnimatePresence>
                {achievements.length > 0 && (
                    <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} className="fixed top-24 right-4 z-[300] bg-black/90 border-2 border-amber-500 p-4 rounded-2xl flex items-center gap-4 shadow-[#f59e0b20] shadow-2xl">
                        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                            <Trophy className="w-7 h-7 text-black" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Succès Débloqué !</p>
                            <p className="text-xs font-black text-white uppercase italic">{achievements[achievements.length - 1]}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SLOT MACHINE JACKPOT OVERLAY */}
            <AnimatePresence>
                {activeSlots && (
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
                                {['🍒', '💎', '7️⃣'].map((emoji, i) => (
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
                )}
            </AnimatePresence>
        </div>
    );
};

export default TakeoverPage;
