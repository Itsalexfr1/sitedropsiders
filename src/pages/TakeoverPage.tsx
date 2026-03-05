import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Pencil, List, Instagram, Power, Smile, ArrowLeft,
    HelpCircle, Lock, Pin, Edit2, Plus, Zap, CheckCircle2, Activity,
    Facebook, Maximize, Minimize, Video, Heart, User, ArrowRight, Bell,
    Globe, Users, X, Youtube, Shield, Trash2, ShieldAlert, Clock, MessageSquare, Send, Mail, Mic, Hash, Headphones, Trophy, Crown,
    ChevronUp, ChevronDown, Volume2, PowerOff, BarChart3, ShoppingBag, LogOut, MicOff, CircleStop, Loader2,
    Star, ShieldCheck, LayoutGrid, MoreHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlitchTransition } from '../components/ui/GlitchTransition';
import { ConfirmModal } from '../components/ui/ConfirmModal';


const XIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

const SnapchatIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.8c-2.8 0-4.5 1.5-4.5 3.9 0 1 .1 1.8.4 2.4.1.2.1.3.1.5 0 .2-.1.3-.2.5-.2.2-.4.4-.7.8-.3.3-.5.7-.5 1.1 0 .6.4 1.1.9 1.5.5.4 1.1.7 1.8.8.4.1.8.1 1.2.1 1 0 2-.2 2.9-.6.4-.2.8-.4 1.2-.4s.8.2 1.2.4c.9.4 1.9.6 2.9.6.4 0 .8 0 1.2-.1.7-.1 1.3-.4 1.8-.8.5-.4.9-.9.9-1.5 0-.4-.2-.8-.5-1.1s-.5-.6-.7-.8c-.1-.2-.2-.3-.2-.5 0-.2 0-.3.1-.5.3-.6.4-1.4.4-2.4 0-2.4-1.7-3.9-4.5-3.9zm6.6 9.4c.6.6 1.1 1.3 1.1 2.2 0 1-.5 1.9-1.4 2.5-.9.6-2 .9-3.3.9-1.2 0-2.3-.3-3.1-.8-.4-.3-.8-.4-1.2-.4s-.8.1-1.2.4c-.8.5-1.9.8-3.1.8-1.3 0-2.4-.3-3.3-.9-.9-.6-1.4-1.5-1.4-2.5 0-.9.5-1.6 1.1-2.2.6-.6 1.3-1 2.2-1.3.4-.1.8-.2 1.2-.2 1.1 0 2.2.4 3.1 1.1.4.3.8.4 1.2.4s.8-.1 1.2-.4c.9-.7 2-1.1 3.1-1.1.4 0 .8.1 1.2.2.9.3 1.6.7 2.2 1.3z" />
    </svg>
);




interface TakeoverProps {
    settings: {
        youtubeId: string;
        chat_enabled: boolean;
        enabled: boolean;
        title: string;
        moderators?: string;
        lineup?: string;
        tickerType?: 'news' | 'planning' | 'custom';
        tickerText?: string;
        tickerLink?: string;
        tickerBgColor?: string;
        tickerTextColor?: string;
        showTopBanner?: boolean;
        showTickerBanner?: boolean;
        customCommands?: string;
        password?: string;
        channels?: string;
        autoMessage?: string;
        autoMessageInterval?: number;
        isSecret?: boolean;
        pinnedMessage?: string;
        currentArtist?: string;
        artistInstagram?: string;
        showShop?: boolean;
        shopItems?: string;
        mainFluxName?: string;
        botColor?: string;
        botBgColor?: string;
        adminColor?: string;
        adminBgColor?: string;
        isOnline?: boolean;
        disableMainPlayer?: boolean;
        startDate?: string;
        endDate?: string;
        stage1?: string;
        stage2?: string;
        stage3?: string;
        stage4?: string;
        stage5?: string;
        stage6?: string;
        stage1Name?: string;
        stage2Name?: string;
        stage3Name?: string;
        stage4Name?: string;
        stage5Name?: string;
        stage6Name?: string;
        showInAgenda?: boolean;
        showClosedDoors?: boolean;
        dropsAmount?: number;
        dropsIntervalMinutes?: number;
        showExtraFlux?: boolean;
        hypeLimit?: number;
        currentShazam?: {
            title: string;
            artist: string;
            image: string;
            spotify: string;
        };
    };
    onClose?: () => void;
}

const StyledCheckbox = ({ checked, onChange, label, sublabel, color = 'red' }: { checked: boolean, onChange: () => void, label: string, sublabel?: string, color?: 'red' | 'cyan' | 'green' | 'purple' | 'yellow' }) => {
    const isRed = color === 'red';
    const isCyan = color === 'cyan';
    const isGreen = color === 'green';
    const isPurple = color === 'purple';

    return (
        <div
            onClick={onChange}
            className={`flex items-center justify-between p-4 bg-black/40 rounded-2xl border transition-all cursor-pointer group hover:bg-black/60 ${checked ? (isRed ? 'border-neon-red/30 bg-neon-red/5' : isCyan ? 'border-neon-cyan/30 bg-neon-cyan/5' : isGreen ? 'border-green-500/30 bg-green-500/5' : isPurple ? 'border-neon-purple/30 bg-neon-purple/5' : 'border-yellow-500/30 bg-yellow-500/5') : 'border-white/5'}`}
        >
            <div className="flex flex-col gap-1">
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${checked ? (isRed ? 'text-neon-red' : isCyan ? 'text-neon-cyan' : isGreen ? 'text-green-500' : isPurple ? 'text-neon-purple' : 'text-yellow-500') : 'text-gray-400 group-hover:text-gray-300'}`}>
                    {label}
                </span>
                {sublabel && <span className="text-[8px] text-gray-500 font-bold uppercase">{sublabel}</span>}
            </div>
            <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${checked ? (isRed ? 'bg-neon-red border-neon-red shadow-[0_0_15px_#ff003344]' : isCyan ? 'bg-neon-cyan border-neon-cyan shadow-[0_0_15px_#00ffff44]' : isGreen ? 'bg-green-500 border-green-500 shadow-[0_0_15px_#22c55e44]' : isPurple ? 'bg-neon-purple border-neon-purple shadow-[0_0_15px_#bc13fe44]' : 'bg-yellow-500 border-yellow-500 shadow-[0_0_15px_#eab30844]') : 'bg-black/40 border-white/10 group-hover:border-white/20'}`}>
                {checked && (
                    <motion.svg initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                )}
            </div>
        </div>
    );
};

export function TakeoverPage({ settings }: TakeoverProps) {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const adminAuth = localStorage.getItem('admin_auth') === 'true';
    const editeurAuth = localStorage.getItem('editeur_auth') === 'true';
    const isServerAdmin = adminAuth === true || editeurAuth === true;

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'info'
    });

    const [pseudo, setPseudo] = useState(() => {
        if (adminAuth) return localStorage.getItem('admin_user')?.toUpperCase() || 'ADMIN';
        return localStorage.getItem('chat_pseudo') || '';
    });
    const [country, setCountry] = useState(''); // Explicitly empty (Request 8)
    const [isJoined, setIsJoined] = useState(() => {
        const editeurAuth = localStorage.getItem('editeur_auth') === 'true';
        return adminAuth || editeurAuth || localStorage.getItem('chat_joined') === 'true';
    });
    const [isMutedGlobal, setIsMutedGlobal] = useState(false);
    const [showClipPlayer, setShowClipPlayer] = useState(false);
    const [activeClipToPlay, setActiveClipToPlay] = useState<any>(null);
    const [favorites, setFavorites] = useState<string[]>(() => JSON.parse(localStorage.getItem('favorited_artists') || '[]'));
    const [notifiedArtists, setNotifiedArtists] = useState<string[]>([]);
    const [isUnlocked, setIsUnlocked] = useState(() => sessionStorage.getItem('takeover_unlocked') === 'true');
    const [enteredPassword, setEnteredPassword] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [viewersCount, setViewersCount] = useState(0);
    const [isClipping, setIsClipping] = useState(false);
    const [clipProgress, setClipProgress] = useState(0);
    const [clips, setClips] = useState<any[]>([]);
    const [_activeClipPopup, _setActiveClipPopup] = useState<any>(null);
    const [newVideoId, setNewVideoId] = useState('');

    const [showLineup, setShowLineup] = useState(false);
    const [showVideoEdit, setShowVideoEdit] = useState(false);
    const [showClipModal, setShowClipModal] = useState(false);
    const [playersOption, setPlayersOption] = useState(1);
    const videoPlayerRef = useRef<HTMLDivElement>(null);
    const [email, setEmail] = useState('');
    const [newsletter, setNewsletter] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'planning' | 'moderation' | 'points' | 'shop'>('general');
    const [activeVideoIndex, setActiveVideoIndex] = useState(() => {
        // Deactivate main flux by default (if disableMainPlayer is true or undefined)
        const isDisabled = settings.disableMainPlayer !== false;
        return isDisabled ? 1 : 0;
    });

    // --- NEW FEATURES STATES ---
    const [userDrops, setUserDrops] = useState(() => {
        try { return parseInt(localStorage.getItem('user_drops') || '0'); } catch { return 0; }
    });


    const [rewards, setRewards] = useState<{ id: string, name: string, description: string, cost: number, icon: string }[]>(() => {
        try {
            const saved = localStorage.getItem('drops_rewards');
            if (saved) return JSON.parse(saved);
        } catch { }
        return [
            { id: 'pseudo', name: 'Pseudo Animé', description: 'Une aura néon autour de ton pseudo', cost: 500, icon: 'Smile' },
            { id: 'pin', name: 'Message Épinglé', description: 'Affiche ton message au-dessus du chat', cost: 100, icon: 'MessageSquare' },
            { id: 'promo', name: 'Code Promo', description: 'Réduction sur le vrai magasin', cost: 1000, icon: 'Zap' }
        ];
    });

    useEffect(() => {
        localStorage.setItem('drops_rewards', JSON.stringify(rewards));
    }, [rewards]);



    const [hypeLevel, setHypeLevel] = useState(0);
    const [isOverdrive, setIsOverdrive] = useState(false);
    const [bpm, setBpm] = useState(128);
    const [_showDropsShop] = useState(false);
    const [_isListeningForDrops, _setIsListeningForDrops] = useState(true);
    const [activeChatTab, setActiveChatTab] = useState<'chat' | 'shop' | 'drops-shop' | 'leaderboard' | 'audio' | 'shazam' | 'clips'>('chat');
    const [showMobileModMenu, setShowMobileModMenu] = useState(false);

    // TAB SWIPE LOGIC
    const handleSwipeTabs = (direction: 'left' | 'right') => {
        const order = ['chat', 'shazam', 'leaderboard', 'shop', 'clips'];
        const currentIndex = order.indexOf(activeChatTab);
        if (currentIndex === -1) return;

        if (direction === 'left') {
            const nextIndex = (currentIndex + 1) % order.length;
            setActiveChatTab(order[nextIndex] as any);
        } else {
            const prevIndex = (currentIndex - 1 + order.length) % order.length;
            setActiveChatTab(order[prevIndex] as any);
        }
    };
    const [chatCountryFilter, setChatCountryFilter] = useState('ALL');
    const [forceScroll, setForceScroll] = useState(false);
    const isFirstJoinFetch = useRef(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [shazamHistory, setShazamHistory] = useState<any[]>([]);

    const [displayTitle, setDisplayTitle] = useState(settings.title || 'LIVE TAKEOVER');
    const [_totalWatchTime, setTotalWatchTime] = useState(0);
    const [annBannerEnabled, setAnnBannerEnabled] = useState(false);
    const [annBannerText, setAnnBannerText] = useState('');
    const [annBannerColor, setAnnBannerColor] = useState('#ffffff');
    const [annBannerBg, setAnnBannerBg] = useState('#0a0a0a');
    const [showClosedDoors, setShowClosedDoors] = useState(false);
    const [upcomingLives, setUpcomingLives] = useState<any[]>([]);
    const [showPollModal, setShowPollModal] = useState(false);
    const [votedPollIds, setVotedPollIds] = useState<string[]>([]);
    const [lastPollResult, setLastPollResult] = useState<{ question: string, winner: string, percentage: number } | null>(null);

    // --- QUIZ POPUP ---
    const [showQuizPopup, setShowQuizPopup] = useState(false);
    const [quizPopupQuestion, setQuizPopupQuestion] = useState<{ id: string; type: string; question: string; options: string[]; correctAnswer: string; category: string; audioUrl?: string; imageUrl?: string; youtubeId?: string; spotifyUrl?: string; startTime?: number; } | null>(null);
    const [quizPopupAnswer, setQuizPopupAnswer] = useState<string | null>(null);
    const [quizPopupLoading, setQuizPopupLoading] = useState(false);

    const [clipTitle, setClipTitle] = useState('');
    const [clipDuration, setClipDuration] = useState(30);
    const [isFeatured, setIsFeatured] = useState(false);
    const [keepForever, setKeepForever] = useState(false);
    const recordedClipsBlobs = useRef<Record<string, string>>({});
    const processedGiveIds = useRef<Set<number>>(new Set());
    const lastProcessedQuizId = useRef<number>(0);




    // Fetch upcoming lives for closed doors
    useEffect(() => {
        const fetchUpcoming = async () => {
            try {
                const res = await fetch('/api/agenda');
                if (res.ok) {
                    const data = await res.json();
                    const now = new Date();
                    const filtered = data
                        .filter((ev: any) => ev.isLiveDropsiders && new Date(ev.date || ev.startDate) >= now)
                        .sort((a: any, b: any) => new Date(a.date || a.startDate).getTime() - new Date(b.date || b.startDate).getTime())
                        .slice(0, 3);
                    setUpcomingLives(filtered);
                }
            } catch (e) { }
        };
        fetchUpcoming();
    }, []);



    // Fetch clips periodically
    useEffect(() => {
        const fetchClips = async () => {
            try {
                const res = await fetch('/api/clips');
                if (res.ok) setClips(await res.json());
            } catch (err) { }
        };
        fetchClips();
        const interval = setInterval(fetchClips, 30000);
        return () => clearInterval(interval);
    }, []);

    // Dynamic BPM simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setBpm(prev => {
                const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                const next = prev + (isOverdrive ? change * 2 : change);
                return Math.max(120, Math.min(next, 145));
            });
        }, 1500);
        return () => clearInterval(interval);
    }, [isOverdrive]);

    // Dynamic Video List with Titles
    const channelItems = useMemo(() => {
        const items = [];
        if (settings.youtubeId) {
            items.push({ id: settings.youtubeId.trim(), title: settings.mainFluxName || 'Flux Principal', isMain: true });
        }
        if (settings.channels) {
            settings.channels.split('\n').filter((l: string) => l.trim()).forEach((line: string, index: number) => {
                const [id, ...titleParts] = line.split(':');
                if (id && id.trim()) {
                    // Filter out stage 5 and 6 if showExtraFlux is disabled
                    if ((index === 4 || index === 5) && !settings.showExtraFlux) return;
                    items.push({ id: id.trim(), title: titleParts.join(':').trim() || 'CAM', isMain: false });
                }
            });
        }
        return items;
    }, [settings.youtubeId, settings.channels, settings.mainFluxName, settings.showExtraFlux]);

    // Earn Drops periodically
    useEffect(() => {
        if (!isJoined) return;
        const configAmount = settings.dropsAmount || 10;
        const configInterval = (settings.dropsIntervalMinutes || 10) * 60;

        const interval = setInterval(() => {
            setTotalWatchTime(prev => {
                const next = prev + 1;
                if (next >= configInterval) {
                    setUserDrops(d => {
                        const newD = d + configAmount;
                        localStorage.setItem('user_drops', String(newD));
                        return newD;
                    });
                    return 0;
                }
                return next;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isJoined, settings.dropsAmount, settings.dropsIntervalMinutes]);

    // Hype Decay
    useEffect(() => {
        const interval = setInterval(() => {
            setHypeLevel(prev => Math.max(0, prev - 1));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Load YouTube API
    useEffect(() => {
        if (!(window as any).YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }
    }, []);

    // Initialize YouTube Players
    useEffect(() => {
        const initPlayers = () => {
            channelItems.forEach((channel) => {
                const elementId = `yt-player-${channel.id}`;
                const element = document.getElementById(elementId);
                if (element && (window as any).YT && (window as any).YT.Player) {
                    try {
                        playersRef.current[channel.id] = new (window as any).YT.Player(elementId, {
                            events: {
                                onReady: (event: any) => {
                                    const isMuted = isMutedGlobal || volume === 0;
                                    if (isMuted) {
                                        event.target.mute();
                                        event.target.setVolume(0);
                                    } else {
                                        event.target.unMute();
                                        event.target.setVolume(volume * 100);
                                    }
                                }
                            }
                        });
                    } catch (e) {
                        console.error('Error initializing YT Player', e);
                    }
                }
            });
        };

        if ((window as any).YT && (window as any).YT.Player) {
            initPlayers();
        } else {
            (window as any).onYouTubeIframeAPIReady = initPlayers;
        }

        return () => {
            Object.values(playersRef.current).forEach(p => {
                if (p && p.destroy) p.destroy();
            });
            playersRef.current = {};
        };
    }, [playersOption, isJoined, channelItems, activeVideoIndex]); // Re-init if joined state, channel list, or active video index changes

    // Overdrive Handler
    useEffect(() => {
        if (hypeLevel >= 80 && !isOverdrive) {
            setIsOverdrive(true);
            setTimeout(() => {
                setIsOverdrive(false);
                setHypeLevel(50); // Cool down
            }, 180000); // 3 minutes
        }
    }, [hypeLevel, isOverdrive]);

    // --- END NEW FEATURES ---

    const parseLineup = useCallback((text: string) => {
        if (!text) return [];
        const now = new Date();
        const currentTotal = now.getHours() * 60 + now.getMinutes();

        return text.split('\n').filter(line => line.trim()).map(line => {
            let timeRange = '', artist = '', stage = '', instagram = '';

            const timeMatch = line.match(/\[(.*?)\]/);
            if (timeMatch) {
                timeRange = timeMatch[1];
                const rest = line.replace(timeMatch[0], '').trim();
                const parts = rest.includes('|') ? rest.split('|').map(p => p.trim()) : rest.split(/-(?=\s)/).map(p => p.trim());
                artist = parts[0] || '';
                stage = parts[1] || '';
                instagram = parts[2] || '';
            } else if (line.includes('|')) {
                const parts = line.split('|').map(p => p.trim());
                timeRange = parts[0] || '';
                artist = parts[1] || '';
                stage = parts[2] || '';
                instagram = parts[3] || '';
            } else {
                artist = line.trim();
            }

            const [startTime, endTime] = timeRange.includes('-') ? timeRange.split('-').map(t => t.trim()) : [timeRange.trim(), ''];

            let isPast = false;
            let startMinutes = -1;
            let endMinutes = -1;

            if (startTime.includes(':')) {
                const [h, m] = startTime.split(':').map(Number);
                startMinutes = h * 60 + m;
            }

            if (endTime && endTime.includes(':')) {
                const [h, m] = endTime.split(':').map(Number);
                endMinutes = h * 60 + m;
            }

            if (endMinutes !== -1) {
                const timeDiff = (currentTotal - endMinutes + 1440) % 1440;
                if (timeDiff >= 0 && timeDiff < 720) {
                    isPast = true;
                }
            } else if (startMinutes !== -1) {
                // Approximate 90 min set if no end time
                const approxEnd = (startMinutes + 90) % 1440;
                const timeDiff = (currentTotal - approxEnd + 1440) % 1440;
                if (timeDiff >= 0 && timeDiff < 720) {
                    isPast = true;
                }
            }

            // Progress percentage for planning gauge
            let progress = 0;
            if (startMinutes !== -1 && endMinutes !== -1 && !isPast) {
                if (currentTotal >= startMinutes && currentTotal < endMinutes) {
                    progress = ((currentTotal - startMinutes) / (endMinutes - startMinutes)) * 100;
                } else if (currentTotal < startMinutes && currentTotal + 1440 >= startMinutes && currentTotal + 1440 < endMinutes + 1440) {
                    // Handles midnight wrap
                    progress = ((currentTotal + 1440 - startMinutes) / (endMinutes - startMinutes)) * 100;
                }
            }

            return { time: startTime, endTime, artist, stage, instagram, isPast, totalMinutes: startMinutes, progress };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const [editTitle, setEditTitle] = useState(settings.title || 'LIVE TAKEOVER');
    const [editMainFluxName, setEditMainFluxName] = useState(settings.mainFluxName || 'MAIN STAGE');
    const [displayLineup, setDisplayLineup] = useState(settings.lineup || '');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 5000); // Mise à jour toutes les 5 secondes
        return () => clearInterval(timer);
    }, []);

    // Memoized filtered lineup based on selected flux
    const currentFluxLineup = useMemo(() => {
        const items = parseLineup(displayLineup || settings.lineup || '');
        const currentTitle = channelItems[activeVideoIndex]?.title || '';

        // Filter items based on stage name matching current flux title
        if (!currentTitle) return items;
        return items.filter(item => {
            const sName = (item.stage || '').toLowerCase();
            const fName = currentTitle.toLowerCase();
            if (!sName) return activeVideoIndex === 0;
            return sName.includes(fName) || fName.includes(sName);
        });
    }, [displayLineup, settings.lineup, activeVideoIndex, channelItems, parseLineup, currentTime]);

    const fluxCurrentArtist = useMemo(() => {
        // Find match in current flux lineup where it's not past and start time is <= now
        const currentItem = [...currentFluxLineup]
            .filter(i => i.time && i.time.includes(':'))
            .map(i => {
                const [h, m] = i.time.split(':').map(Number);
                return { ...i, total: h * 60 + m };
            })
            // Sort by latest start time first
            .sort((a, b) => b.total - a.total)
            // It must have started (total <= currentTotal) AND not be past (isPast is false)
            .find(i => i.total <= (currentTime.getHours() * 60 + currentTime.getMinutes()) && !i.isPast);

        if (currentItem) {
            return { artist: currentItem.artist || '', instagram: currentItem.instagram || '' };
        }

        return { artist: '', instagram: '' };
    }, [currentFluxLineup, currentTime]);



    useEffect(() => {
        if (!("Notification" in window)) return;
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        if (favorites.length === 0) return;
        const allItems = parseLineup(displayLineup || settings.lineup || '');
        if (!allItems.length) return;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const currentlyLiveArtists = allItems
            .filter(i => i.time && i.time.includes(':'))
            .map(i => {
                const [h, m] = i.time.split(':').map(Number);
                return { ...i, total: h * 60 + m };
            })
            .reduce((acc, item) => {
                if (item.total <= currentMinutes) {
                    if (!acc[item.stage]) acc[item.stage] = item;
                    else if (item.total > acc[item.stage].total) acc[item.stage] = item;
                }
                return acc;
            }, {} as Record<string, any>);

        const currentLiveArtistNames = Object.values(currentlyLiveArtists).map((item: any) => item.artist);

        let newNotified = false;
        const currentNotifs = [...notifiedArtists];

        currentLiveArtistNames.forEach(artist => {
            if (artist && favorites.includes(artist) && !notifiedArtists.includes(artist)) {
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("Dropsiders Live", {
                        body: `Votre artiste favori ${artist} est maintenant en direct !`,
                        icon: '/favicon.ico'
                    });
                }
                currentNotifs.push(artist);
                newNotified = true;
            }
        });
        if (newNotified) {
            setNotifiedArtists(currentNotifs);
        }
    }, [displayLineup, settings.lineup, favorites, parseLineup, currentTime, notifiedArtists]);

    const handleUnlock = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (enteredPassword === (settings.password || '2026')) {
            setIsUnlocked(true);
            sessionStorage.setItem('takeover_unlocked', 'true');
            setPasswordError(false);
        } else {
            setPasswordError(true);
            // Shake effect or just error
        }
    };


    const [lineupEndHour, setLineupEndHour] = useState("");
    const [lineupEndMinute, setLineupEndMinute] = useState("");

    const [fluxPrincipal, setFluxPrincipal] = useState(settings.youtubeId ? `https://youtube.com/watch?v=${settings.youtubeId}` : '');
    const [stage1, setStage1] = useState(() => {
        const lines = (settings.channels || '').split('\n').filter(Boolean);
        return lines[0] ? `https://youtube.com/watch?v=${lines[0].split(':')[0]}` : '';
    });
    const [stage2, setStage2] = useState(() => {
        const lines = (settings.channels || '').split('\n').filter(Boolean);
        return lines[1] ? `https://youtube.com/watch?v=${lines[1].split(':')[0]}` : '';
    });
    const [stage3, setStage3] = useState(() => {
        const lines = (settings.channels || '').split('\n').filter(Boolean);
        return lines[2] ? `https://youtube.com/watch?v=${lines[2].split(':')[0]}` : '';
    });
    const [stage4, setStage4] = useState(() => {
        const lines = (settings.channels || '').split('\n').filter(Boolean);
        return lines[3] ? `https://youtube.com/watch?v=${lines[3].split(':')[0]}` : '';
    });
    const [stage5, setStage5] = useState(() => {
        const lines = (settings.channels || '').split('\n').filter(Boolean);
        return lines[4] ? `https://youtube.com/watch?v=${lines[4].split(':')[0]}` : '';
    });
    const [stage6, setStage6] = useState(() => {
        const lines = (settings.channels || '').split('\n').filter(Boolean);
        return lines[5] ? `https://youtube.com/watch?v=${lines[5].split(':')[0]}` : '';
    });


    const [localPinnedMessage, setLocalPinnedMessage] = useState(settings.pinnedMessage ?? '');
    const [localCustomCommands, setLocalCustomCommands] = useState(settings.customCommands || '');
    const [localModerators, setLocalModerators] = useState(settings.moderators || '');
    const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
    const [allShopProducts, setAllShopProducts] = useState<any[]>([]);

    const handleCreateClip = async () => {
        if (!navigator.mediaDevices || !(navigator.mediaDevices as any).getDisplayMedia) {
            return alert("Votre navigateur ne supporte pas la capture vidéo.");
        }

        try {
            const stream = await (navigator.mediaDevices as any).getDisplayMedia({
                video: { frameRate: 30 },
                audio: true,
                selfBrowserSurface: 'include',
                preferCurrentTab: true
            });

            setIsClipping(true);
            setClipProgress(0);

            const chunks: Blob[] = [];
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
                ? 'video/webm;codecs=vp9,opus'
                : 'video/webm';

            const recorder = new MediaRecorder(stream, { mimeType });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: mimeType });
                const blobUrl = URL.createObjectURL(blob);
                const clipId = Math.random().toString(36).substr(2, 9);

                recordedClipsBlobs.current[clipId] = blobUrl;

                const currentVideoId = channelItems[activeVideoIndex]?.id || settings.youtubeId;
                const clipArtist = fluxCurrentArtist?.artist || settings.currentArtist || "Live";
                const artistPrefix = clipArtist !== "Live" ? `${clipArtist.toUpperCase()} - ` : '';

                // Upload to Cloudinary
                let remoteUrl = '';
                try {
                    const formData = new FormData();
                    formData.append('file', blob);
                    formData.append('upload_preset', 'dropsiders_unsigned');
                    formData.append('folder', 'dropsiders/clips');
                    formData.append('tags', keepForever ? 'permanent_clip' : 'auto_delete_90_days'); // System tag for cleanup or permanent
                    if (isFeatured) formData.append('tags', 'featured_clip');

                    const cldRes = await fetch(`https://api.cloudinary.com/v1_1/djnvjsmvr/video/upload`, {
                        method: 'POST',
                        body: formData
                    });
                    const cldData = await cldRes.json();
                    if (cldData.secure_url) {
                        remoteUrl = cldData.secure_url;
                    }
                } catch (err) {
                    console.error('Cloudinary upload error:', err);
                }

                const newClip = {
                    id: clipId,
                    videoId: currentVideoId,
                    title: clipTitle ? clipTitle.toUpperCase() : `EXTRAIT - ${artistPrefix}${settings.title?.toUpperCase() || 'LIVE'}`,
                    duration: `0:${clipDuration < 10 ? '0' + clipDuration : clipDuration}`,
                    date: new Date().toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    channelId: currentVideoId,
                    creator: pseudo || 'Anonyme',
                    url: remoteUrl || blobUrl,
                    isLocal: !remoteUrl,
                    isFeatured: isFeatured,
                    keepForever: keepForever
                };

                try {
                    await fetch('/api/clips/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newClip)
                    });
                } catch (e) { }

                setClips(prev => [newClip, ...prev]);
                setUserDrops(d => d + 25);

                try {
                    await fetch('/api/chat/messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            pseudo: 'DROPSIDERS BOT',
                            message: `🎬 @${pseudo.toUpperCase()} vient de capturer un moment en direct ! [VOIR LE CLIP](#clip-${clipId})`,
                            country: 'FR',
                            isBot: true,
                            color: '#00ffcc',
                            channel: currentVideoId
                        })
                    });
                } catch (e) { }

                setIsClipping(false);
                setClipProgress(0);
                setClipTitle('');
                setIsFeatured(false);
                setKeepForever(false);
                stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
            };

            recorder.start();

            let elapsed = 0;
            const step = 100;
            const total = clipDuration * 1000;
            const progressInterval = setInterval(() => {
                elapsed += step;
                setClipProgress(Math.min(100, Math.floor((elapsed / total) * 100)));
                if (elapsed >= total) {
                    clearInterval(progressInterval);
                    if (recorder.state === 'recording') recorder.stop();
                }
            }, step);

        } catch (err) {
            setIsClipping(false);
            setClipProgress(0);
        }
    };







    const handleDownloadClip = (clip: any) => {
        const url = clip.isLocal ? clip.url : clip.url; // Use blob URL if local
        if (!url) return alert("Fichier introuvable");

        const a = document.createElement('a');
        a.href = url;
        a.download = `${clip.title.replace(/\s+/g, '_')}_${clip.id}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Load announcement banner settings from API
    useEffect(() => {
        fetch('/api/settings').then(r => r.json()).then(data => {
            if (data.announcement_banner) {
                setAnnBannerEnabled(data.announcement_banner.enabled ?? false);
                setAnnBannerText(data.announcement_banner.text ?? '');
                setAnnBannerColor(data.announcement_banner.color ?? '#ffffff');
                setAnnBannerBg(data.announcement_banner.bgColor ?? '#0a0a0a');
            }
        }).catch(() => { });
    }, []);

    const handleSaveAnnouncementBanner = async () => {
        try {
            const password = localStorage.getItem('admin_password') || '';
            const username = localStorage.getItem('admin_user') || 'alex';
            const sessionId = localStorage.getItem('admin_session_id') || '';
            await fetch('/api/settings/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Password': password,
                    'X-Admin-Username': username,
                    'X-Session-ID': sessionId,
                },
                body: JSON.stringify({
                    announcement_banner: {
                        enabled: annBannerEnabled,
                        text: annBannerText,
                        text_en: annBannerText,
                        color: annBannerColor,
                        bgColor: annBannerBg,
                    }
                })
            });
            // Notify other components (like AnnouncementBanner)
            window.dispatchEvent(new CustomEvent('dropsiders_settings_updated'));
        } catch (e: any) {
            console.error('Failed to save announcement banner', e);
        }
    };

    const getVisiblePlayers = () => {
        if (playersOption === 4) return channelItems.slice(0, 4);
        const active = channelItems[activeVideoIndex];
        if (active) return [active];
        return channelItems.length > 0 ? [channelItems[0]] : [];
    };

    // Sync with props when they change (e.g. from parent polling or settings update)
    useEffect(() => {
        setDisplayTitle(settings.title);
        setEditTitle(settings.title);
        setDisplayLineup(settings.lineup || '');
        setEditLineup(settings.lineup || '');
        setFluxPrincipal(settings.youtubeId ? `https://youtube.com/watch?v=${settings.youtubeId}` : '');

        const lines = (settings.channels || '').split('\n').filter(Boolean);
        setStage1(lines[0] ? `https://youtube.com/watch?v=${lines[0].split(':')[0]}` : '');
        setStage2(lines[1] ? `https://youtube.com/watch?v=${lines[1].split(':')[0]}` : '');
        setStage3(lines[2] ? `https://youtube.com/watch?v=${lines[2].split(':')[0]}` : '');
        setStage4(lines[3] ? `https://youtube.com/watch?v=${lines[3].split(':')[0]}` : '');
        setStage5(lines[4] ? `https://youtube.com/watch?v=${lines[4].split(':')[0]}` : '');
        setStage6(lines[5] ? `https://youtube.com/watch?v=${lines[5].split(':')[0]}` : '');

        setStage1Name(lines[0] ? (lines[0].split(':').slice(1).join(':').trim() || 'Stage 1') : 'Stage 1');
        setStage2Name(lines[1] ? (lines[1].split(':').slice(1).join(':').trim() || 'Stage 2') : 'Stage 2');
        setStage3Name(lines[2] ? (lines[2].split(':').slice(1).join(':').trim() || 'Stage 3') : 'Stage 3');
        setStage4Name(lines[3] ? (lines[3].split(':').slice(1).join(':').trim() || 'Stage 4') : 'Stage 4');
        setStage5Name(lines[4] ? (lines[4].split(':').slice(1).join(':').trim() || 'Stage 5') : 'Stage 5');
        setStage6Name(lines[5] ? (lines[5].split(':').slice(1).join(':').trim() || 'Stage 6') : 'Stage 6');

        setShowTopBanner(settings.showTopBanner ?? true);
        setShowTickerBanner(settings.showTickerBanner ?? true);
        setLocalPinnedMessage(settings.pinnedMessage ?? '');
        setEditCurrentArtist(settings.currentArtist || '');
        setEditArtistInstagram(settings.artistInstagram || '');
        setLocalCustomCommands(settings.customCommands || '');
        setLocalModerators(settings.moderators || '');
        setShowShopWidget(settings.showShop ?? false);
    }, [settings.title, settings.lineup, settings.youtubeId, settings.channels, settings.showTopBanner, settings.showTickerBanner, settings.pinnedMessage, settings.currentArtist, settings.artistInstagram, settings.customCommands, settings.moderators, settings.showShop]);

    // Local state for settings modal to avoid multiple builds
    const [localSettings, setLocalSettings] = useState<Partial<TakeoverProps['settings']>>({});
    const [volume] = useState(1);
    const playersRef = useRef<Record<string, any>>({});

    useEffect(() => {
        if (showEditModal) {
            setLocalSettings({ ...settings });
        }
    }, [showEditModal, settings]);

    const handleUpdateLocalSetting = (newVal: Partial<TakeoverProps['settings']>) => {
        setLocalSettings(prev => ({ ...prev, ...newVal }));
        // Immediate feedback updates
        if (newVal.tickerType !== undefined) setTickerType(newVal.tickerType);
        if (newVal.tickerBgColor !== undefined) setTickerBgColor(newVal.tickerBgColor);
        if (newVal.tickerTextColor !== undefined) setTickerTextColor(newVal.tickerTextColor);
        if (newVal.showTickerBanner !== undefined) setShowTickerBanner(newVal.showTickerBanner);
        if (newVal.showTopBanner !== undefined) setShowTopBanner(newVal.showTopBanner);
        if (newVal.adminColor !== undefined) setAdminColor(newVal.adminColor);
        if (newVal.adminBgColor !== undefined) setAdminBgColor(newVal.adminBgColor);
    };
    const [stage1Name, setStage1Name] = useState(() => {
        const lines = (settings.channels || '').split('\n').filter(Boolean);
        return lines[0] ? (lines[0].split(':').slice(1).join(':').trim() || 'Stage 1') : 'Stage 1';
    });
    const [stage2Name, setStage2Name] = useState(() => {
        const lines = (settings.channels || '').split('\n').filter(Boolean);
        return lines[1] ? (lines[1].split(':').slice(1).join(':').trim() || 'Stage 2') : 'Stage 2';
    });
    const [stage3Name, setStage3Name] = useState(() => {
        const lines = (settings.channels || '').split('\n').filter(Boolean);
        return lines[2] ? (lines[2].split(':').slice(1).join(':').trim() || 'Stage 3') : 'Stage 3';
    });
    const [stage4Name, setStage4Name] = useState(() => {
        const lines = (settings.channels || '').split('\n').filter(Boolean);
        return lines[3] ? (lines[3].split(':').slice(1).join(':').trim() || 'Stage 4') : 'Stage 4';
    });
    const [stage5Name, setStage5Name] = useState(() => {
        const lines = (settings.channels || '').split('\n').filter(Boolean);
        return lines[4] ? (lines[4].split(':').slice(1).join(':').trim() || 'Stage 5') : 'Stage 5';
    });
    const [stage6Name, setStage6Name] = useState(() => {
        const lines = (settings.channels || '').split('\n').filter(Boolean);
        return lines[5] ? (lines[5].split(':').slice(1).join(':').trim() || 'Stage 6') : 'Stage 6';
    });
    const [isLocalBanned, _setIsLocalBanned] = useState(false);
    const [_banTimestamp, _setBanTimestamp] = useState<number | null>(null);
    const [customCountry] = useState('');
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [pollDuration, setPollDuration] = useState('1'); // '1', '3', '5', 'custom'
    const [customPollDuration, setCustomPollDuration] = useState(1);
    const pollTimerRef = useRef<any>(null);
    const isFocusMode = false;
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [latestNews, setLatestNews] = useState<any[]>([]);



    // Ticker Settings
    const [tickerType, setTickerType] = useState<'news' | 'planning' | 'custom'>(settings.tickerType || 'news');
    const [tickerText] = useState(settings.tickerText || '');
    const [tickerLink] = useState(settings.tickerLink || '');
    const [tickerBgColor, setTickerBgColor] = useState(settings.tickerBgColor || '#ff0033');
    const [tickerTextColor, setTickerTextColor] = useState(settings.tickerTextColor || '#ffffff');
    const [showTopBanner, setShowTopBanner] = useState(settings.showTopBanner ?? true);
    const [showTickerBanner, setShowTickerBanner] = useState(settings.showTickerBanner ?? true);

    const [botColor, setBotColor] = useState(settings.botColor || '#00ffcc');
    const [botBgColor, setBotBgColor] = useState(settings.botBgColor || 'rgba(0, 255, 204, 0.05)');
    const [adminColor, setAdminColor] = useState(settings.adminColor || '#ff0033');
    const [adminBgColor, setAdminBgColor] = useState(settings.adminBgColor || 'rgba(255, 0, 51, 0.05)');

    // Collapsible Chat
    const [showUsersPanel, setShowUsersPanel] = useState(false); // Hidden by default (Request 10.7)

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const [subscribeNewsletter] = useState(false);
    const [captchaA] = useState(Math.floor(Math.random() * 10) + 1);
    const [captchaB] = useState(Math.floor(Math.random() * 10) + 1);
    const [captchaAnswer, setCaptchaAnswer] = useState('');

    const [lineupHour, setLineupHour] = useState("");
    const [lineupMinute, setLineupMinute] = useState("");
    const [lineupArtist, setLineupArtist] = useState("");
    const [lineupStage, setLineupStage] = useState("");
    const [lineupInstagram, setLineupInstagram] = useState("");

    const [isSlowMode, setIsSlowMode] = useState(false);
    const [activePoll, setActivePoll] = useState<{ question: string, options: string[], id: number } | null>(null);
    const [shazamLoading, setShazamLoading] = useState(false);
    const [audioRooms, setAudioRooms] = useState<any[]>([]);
    const [audioRoomCode, setAudioRoomCode] = useState("");
    const [currentAudioRoom, setCurrentAudioRoom] = useState<any | null>(null);

    const [slowModeDuration, setSlowModeDuration] = useState(2);
    const [showSlowModePopup, setShowSlowModePopup] = useState(false);
    const [lastMessageTime, setLastMessageTime] = useState(0);
    const [shazamResult, setShazamResult] = useState<{ title: string, artist: string, image?: string, spotify?: string } | null>(null);
    const [showShazamNotify, setShowShazamNotify] = useState(false);

    const [promotedModos, setPromotedModos] = useState<string[]>(() => {
        return JSON.parse(localStorage.getItem('chat_promoted_modos') || '[]');
    });

    const activeUsers = useMemo(() => {
        return messages.reduce((acc: { pseudo: string, country: string }[], m: any) => {
            if (!m.isBot && m.pseudo && m.pseudo !== 'DROPSIDERS' && !acc.find((u) => u.pseudo.toUpperCase() === m.pseudo.toUpperCase())) {
                acc.push({ pseudo: m.pseudo, country: m.country || 'FR' });
            }
            return acc;
        }, []);
    }, [messages]);


    const [isPushEnabled, setIsPushEnabled] = useState(() => 'Notification' in window && Notification.permission === 'granted');

    const subscribeToPushNotifications = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
            alert("Les notifications push ne sont pas supportées sur ce navigateur.");
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setIsPushEnabled(false);
                return;
            }

            const registration = await navigator.serviceWorker.ready;

            // Public VAPID Key - Needs to be 65 bytes base64url encoded
            // Generated via: npx web-push generate-vapid-keys
            const vapidPublicKey = 'BCYvM8X8m7_placeholder_X_V_J_p_V_J_p_V_J_p_V_J';

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidPublicKey
            });

            const res = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription,
                    favorites
                })
            });

            if (res.ok) {
                setIsPushEnabled(true);
            }
        } catch (error: any) {
            console.error('Push subscription failed:', error);
            setIsPushEnabled(false);
        }
    };

    const unsubscribeFromPush = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                });
            }
            setIsPushEnabled(false);
        } catch (error: any) {
            console.error('Push unsubscription failed:', error);
        }
    };

    const [isSending, setIsSending] = useState(false);

    const [userColor] = useState(() => localStorage.getItem('chat_color') || '#ffffff');

    const getAuthHeaders = () => {
        const password = localStorage.getItem('admin_password') || '';
        const username = localStorage.getItem('admin_user') || 'alex';
        const sessionId = localStorage.getItem('admin_session_id') || '';
        return {
            'Content-Type': 'application/json',
            'X-Admin-Password': password,
            'X-Admin-Username': username,
            'X-Session-ID': sessionId
        };
    };

    const [shopProducts, setShopProducts] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/shop')
            .then(res => res.json())
            .then(data => {
                setAllShopProducts(data);
                if (settings.shopItems) {
                    const ids = settings.shopItems.split(',');
                    setSelectedShopIds(ids);
                    setShopProducts(data.filter((p: any) => ids.includes(String(p.id))));
                } else {
                    setShopProducts(data.slice(0, 10));
                }
            })
            .catch(() => { });
    }, [settings.shopItems]);

    const [showShopWidget, setShowShopWidget] = useState(false);
    const currentVideoId = channelItems[activeVideoIndex]?.id || channelItems[0]?.id || '';


    const handleSendBotMessage = async (text: string) => {
        if (!text) return;
        try {
            await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pseudo: 'DROPSIDERS BOT',
                    country: 'FR',
                    message: text,
                    color: '#00ffcc',
                    isBot: true,
                    channel: currentVideoId
                })
            });
        } catch (e: any) {
            console.error('Failed to send bot message', e);
        }
    };

    useEffect(() => {
        if (!settings.autoMessage || !settings.autoMessageInterval) return;

        const interval = setInterval(() => {
            handleSendBotMessage(settings.autoMessage!);
        }, settings.autoMessageInterval * 1000);

        return () => clearInterval(interval);
    }, [settings.autoMessage, settings.autoMessageInterval, currentVideoId]);



    // Fetch audio rooms
    useEffect(() => {
        if (activeChatTab === 'audio') {
            const fetchRooms = () => {
                fetch(`/api/audio/rooms?channel=${currentVideoId}`)
                    .then(res => res.json())
                    .then(data => setAudioRooms(Array.isArray(data) ? data : []))
                    .catch(() => { });
            };
            fetchRooms();
            const interval = setInterval(fetchRooms, 10000);
            return () => clearInterval(interval);
        }
    }, [activeChatTab, currentVideoId]);

    // Fetch messages from server periodically (every 3 seconds)
    useEffect(() => {
        const fetchMessages = () => {
            fetch(`/api/chat/messages?channel=${currentVideoId}`)
                .then(res => res.ok ? res.json() : [])
                .then(data => {
                    if (Array.isArray(data)) {
                        setMessages(data);

                        // Detect poll from dropsiders
                        const latestPollMsg = [...data].reverse().find(m => m.pseudo === 'DROPSIDERS' && m.message.startsWith('📊 SONDAGE :'));
                        const latestStopPollMsg = [...data].reverse().find(m => m.pseudo === 'DROPSIDERS' && m.message === '🛑 SONDAGE TERMINÉ');

                        if (latestPollMsg && (!latestStopPollMsg || latestPollMsg.id > latestStopPollMsg.id)) {
                            const lines = latestPollMsg.message.split('\n');
                            const question = lines[0].replace('📊 SONDAGE : ', '').trim();
                            const options = lines.slice(1).filter((l: string) => /^\d+\./.test(l)).map((l: string) => l.replace(/^\d+\.\s*/, '').trim());
                            if (activePoll?.id !== latestPollMsg.id) {
                                setActivePoll({ question, options, id: latestPollMsg.id });
                            }
                        } else {
                            setActivePoll(null);
                        }

                        // Detect drops for local user
                        const latestGiveMsg = [...data].reverse().find(m =>
                            m.pseudo === 'DROPSIDERS BOT' && m.message.includes('💎 DON DE DROPS : @')
                        );
                        if (latestGiveMsg && !processedGiveIds.current.has(latestGiveMsg.id)) {
                            const target = latestGiveMsg.message.split('@')[1].split(' ')[0].toUpperCase();
                            const amountMatch = latestGiveMsg.message.match(/recevoir (\d+) Drops/);
                            const amount = amountMatch ? parseInt(amountMatch[1]) : 0;
                            if (target === pseudo.toUpperCase() && amount > 0) {
                                setUserDrops(prev => {
                                    const next = prev + amount;
                                    localStorage.setItem('user_drops', String(next));
                                    return next;
                                });
                                processedGiveIds.current.add(latestGiveMsg.id);
                            }
                        }

                        // Detect automated quiz trigger
                        const latestQuizTrigger = [...data].reverse().find(m =>
                            m.isBot && (m.message.toLowerCase().trim() === '!quiz' || m.message.toLowerCase().trim() === '!quizz')
                        );
                        if (latestQuizTrigger && latestQuizTrigger.id > lastProcessedQuizId.current) {
                            lastProcessedQuizId.current = latestQuizTrigger.id;
                            // Trigger quiz popup fetch
                            const triggerQuiz = async () => {
                                setQuizPopupLoading(true);
                                setQuizPopupAnswer(null);
                                setShowQuizPopup(true);
                                try {
                                    const res = await fetch('/api/quiz/active');
                                    if (res.ok) {
                                        const qData = await res.json();
                                        let valid = Array.isArray(qData) ? qData.filter((q: any) => q && q.question && Array.isArray(q.options) && q.options.length > 0) : [];
                                        if (valid.length > 0) {
                                            const random = valid[Math.floor(Math.random() * valid.length)];
                                            setQuizPopupQuestion(random);
                                        }
                                    }
                                } catch (e) { } finally { setQuizPopupLoading(false); }
                            };
                            triggerQuiz();
                        }

                        // Auto-scroll
                        const chatContainer = document.getElementById('chat-messages');
                        if (chatContainer) {
                            const isAtBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100;
                            if (isAtBottom || isFirstJoinFetch.current || forceScroll) {
                                setTimeout(() => {
                                    chatContainer.scrollTop = chatContainer.scrollHeight;
                                    isFirstJoinFetch.current = false;
                                    setForceScroll(false);
                                }, 50);
                            }
                        }
                    }
                })
                .catch(() => { });
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [currentVideoId, activePoll, pseudo, forceScroll]);
    // Added activePoll, userColor, pseudo, country to dependencies for parseLineup to be stable

    // Polling Settings periodically to sync Shop, Pinned Message, etc globally
    useEffect(() => {
        const pollSettings = async () => {
            try {
                const res = await fetch(`/api/settings?t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data?.takeover) {
                        // We only update the global settings if they differ significantly 
                        // to avoid resetting local edit states
                        const newSettings = data.takeover;
                        setShowShopWidget(newSettings.showShop ?? false);
                        setLocalPinnedMessage(newSettings.pinnedMessage ?? '');
                        // Sync other critical live settings if needed
                        settings.showShop = newSettings.showShop;
                        settings.pinnedMessage = newSettings.pinnedMessage;
                        settings.currentArtist = newSettings.currentArtist;
                        settings.artistInstagram = newSettings.artistInstagram;
                        setShowClosedDoors(newSettings.showClosedDoors ?? false);
                    }
                    if (data?.announcement_banner) {
                        setAnnBannerEnabled(data.announcement_banner.enabled ?? false);
                        setAnnBannerText(data.announcement_banner.text ?? '');
                        setAnnBannerColor(data.announcement_banner.color ?? '#ffffff');
                        setAnnBannerBg(data.announcement_banner.bgColor ?? '#0a0a0a');
                    }
                }
            } catch (err: any) { }
        };

        const interval = setInterval(pollSettings, 3000); // Polling plus rapide (3s) pour le temps réel
        return () => clearInterval(interval);
    }, [settings]);


    const getCountryFlag = (c: string) => {
        if (!c) return <Globe className="w-3.5 h-3.5 text-gray-500" />;
        const code = c.toUpperCase().trim();
        let isoId = 'fr';
        if (code === 'FRANCE' || code === 'FR') isoId = 'fr';
        else if (code === 'BELGIQUE' || code === 'BE') isoId = 'be';
        else if (code === 'SUISSE' || code === 'CH') isoId = 'ch';
        else if (code === 'CANADA' || code === 'CA') isoId = 'ca';
        else if (code === 'USA' || code === 'US' || code === 'ÉTATS-UNIS') isoId = 'us';
        else if (code === 'UK' || code === 'ANGLETERRE') isoId = 'gb';
        else if (code === 'ESPAGNE' || code === 'ES') isoId = 'es';
        else if (code === 'ITALIE' || code === 'IT') isoId = 'it';
        else if (code === 'ALLEMAGNE' || code === 'DE') isoId = 'de';
        else return <Globe className="w-3.5 h-3.5 text-gray-500" />;

        return (
            <img
                src={`https://flagcdn.com/w40/${isoId}.png`}
                alt={code}
                className="w-4 h-auto rounded-[2px] shadow-sm border border-white/10"
            />
        );
    };

    const adminPermissions = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
    const hasTakeoverModoPerm = adminPermissions.includes('takeover_modo') || adminPermissions.includes('all');

    const adminUser = localStorage.getItem('admin_user')?.toUpperCase() || '';
    const isAdmin = adminAuth && (pseudo === 'DROPSIDERS' || pseudo === adminUser || pseudo === 'ADMIN');
    const isModo = settings.moderators?.split(',').map(s => s.trim().toUpperCase()).includes(pseudo?.toUpperCase() || '') || hasTakeoverModoPerm || promotedModos.includes(pseudo.toUpperCase());
    const hasModPowers = isAdmin || isModo;

    // Ouvre automatiquement les paramètres pour les admins/modos quand les portes se ferment
    useEffect(() => {
        if (showClosedDoors && hasModPowers && !showEditModal) {
            setShowEditModal(true);
            setActiveSettingsTab('general');
        }
    }, [showClosedDoors, hasModPowers, showEditModal]);

    const getRole = (name: string) => {
        if (name === 'DROPSIDERS' || name === adminUser) return 'admin';
        if (settings.moderators?.split(',').map(s => s.trim().toUpperCase()).includes(name.toUpperCase())) return 'modo';
        if (promotedModos.includes(name.toUpperCase())) return 'modo';
        return 'user';
    };

    // Ping every 20s to count real viewers (per channel)
    useEffect(() => {
        const pingId = isJoined ? pseudo.toUpperCase() : ('anon-' + Math.random().toString(36).substr(2, 6));
        const doPing = () => {
            fetch('/api/chat/ping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pseudo: pingId, channel: currentVideoId })
            })
                .then(r => r.ok ? r.json() : null)
                .then(data => { if (data?.count !== undefined) setViewersCount(data.count); })
                .catch(() => { });
        };
        doPing();
        const interval = setInterval(doPing, 20000);
        return () => clearInterval(interval);
    }, [isJoined, pseudo, currentVideoId]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.overscrollBehavior = 'auto';
        };
    }, []);

    const fetchShazamHistory = useCallback(async () => {
        try {
            const res = await fetch('/api/shazam/history');
            if (res.ok) {
                const data = await res.json();
                setShazamHistory(data);
            }
        } catch (e) {
            console.error('Failed to fetch shazam history', e);
        }
    }, []);

    useEffect(() => {
        fetchShazamHistory();
        const interval = setInterval(fetchShazamHistory, 30000); // 30s
        return () => clearInterval(interval);
    }, [fetchShazamHistory]);

    useEffect(() => {
        // Fetch Latest News
        fetch('/api/news')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Filter out interviews, keep only regular news
                    const filteredData = data.filter(item =>
                        !item.category.toLowerCase().includes('interview') &&
                        !item.title.toLowerCase().includes('interview')
                    );
                    setLatestNews(filteredData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20));
                }
            })
            .catch(console.error);
    }, []);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Security check - captcha
        if (!hasModPowers && parseInt(captchaAnswer) !== captchaA + captchaB) {
            alert("Erreur de sécurité : addition incorrecte. Veuillez prouver que vous êtes un humain.");
            return;
        }

        if (!pseudo.trim() || !email.trim() || !country.trim()) {
            alert("Merci de remplir tous les champs (pseudo, email, pays).");
            return;
        }

        // --- DUPLICATE PSEUDO SECURITY ---
        const exists = activeUsers.find(u => u.pseudo.toUpperCase() === pseudo.trim().toUpperCase());
        if (exists) {
            alert("Ce pseudo est déjà utilisé dans le chat. Merci d'en choisir un autre.");
            return;
        }

        setIsJoined(true);
        localStorage.setItem('chat_joined', 'true');
        const countryToSave = country === 'OTHER' ? customCountry : country;
        localStorage.setItem('chat_pseudo', pseudo.toUpperCase());
        localStorage.setItem('chat_country', countryToSave);
        localStorage.setItem('chat_email', email);
        localStorage.setItem('chat_color', userColor);

        if (subscribeNewsletter) {
            try {
                await fetch('/api/newsletter/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, name: pseudo })
                });
            } catch (err: any) {
                console.error('Failed to subscribe:', err);
            }
        }

        // --- BOT WELCOME ---
        fetch('/api/chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pseudo: 'DROPSIDERS BOT',
                message: `👋 Bienvenue dans le chat @${pseudo.toUpperCase()} ! Profite bien du live sur ce flux ! 🔥`,
                country: 'FR',
                isBot: true,
                color: '#00ffcc',
                channel: currentVideoId
            })
        });

        // Trigger auto-scroll for first view
        setForceScroll(true);
    };
    const handleJoinAudioRoom = async (roomId: string) => {
        if (!roomId || !pseudo) return;
        try {
            const res = await fetch(`/api/audio/join?id=${roomId.toUpperCase()}&channel=${currentVideoId}`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setCurrentAudioRoom(data.room || { id: roomId.toUpperCase(), name: roomId.toUpperCase(), members: 1 });
            } else {
                alert("Salon introuvable ou erreur lors de la connexion.");
            }
        } catch (e) { alert("Erreur serveur."); }
    };

    const appendLineup = () => {
        if (!lineupHour || !lineupMinute || !lineupArtist || !lineupStage) {
            alert("Veuillez remplir au moins l'Heure de début, l'Artiste et le Stage.");
            return;
        }
        const startTimeStr = `${lineupHour.padStart(2, '0')}:${lineupMinute.padStart(2, '0')}`;
        const endTimeStr = (lineupEndHour && lineupEndMinute) ? `${lineupEndHour.padStart(2, '0')}:${lineupEndMinute.padStart(2, '0')}` : '';

        const timeStr = endTimeStr ? `${startTimeStr}-${endTimeStr}` : startTimeStr;

        // Fix: Use 3-part format: Artist - Stage - Instagram
        const newEntry = `[${timeStr}] ${lineupArtist} - ${lineupStage} - ${lineupInstagram || ''}`;
        setEditLineup(prev => prev ? prev.trim() + '\n' + newEntry : newEntry);
        setLineupHour(""); setLineupMinute(""); setLineupEndHour(""); setLineupEndMinute("");
        setLineupArtist(""); setLineupStage(""); setLineupInstagram("");
    };

    const handleStartPoll = () => {
        if (!pollQuestion) return;
        let msg = `📊 SONDAGE : ${pollQuestion}\n`;
        msg += pollOptions.filter(o => o.trim()).map((o, i) => `${i + 1}. ${o}`).join('\n');

        let durationMin = 1;
        if (pollDuration === 'custom') durationMin = customPollDuration;
        else durationMin = parseInt(pollDuration);

        msg += `\n⏱️ DURÉE : ${durationMin} MIN`;
        msg += "\n(Répondez avec le chiffre correspondant dans le chat)";

        const password = localStorage.getItem('admin_password') || '';
        const username = localStorage.getItem('admin_user') || 'alex';
        const sessionId = localStorage.getItem('admin_session_id') || '';

        fetch('/api/chat/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Password': password,
                'X-Admin-Username': username,
                'X-Session-ID': sessionId
            },
            body: JSON.stringify({
                pseudo: 'DROPSIDERS',
                message: msg,
                country: 'FR',
                color: '#ff0033',
                channel: currentVideoId
            })
        });

        // Auto-stop poll after duration
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        pollTimerRef.current = setTimeout(() => {
            handleStopPoll();
        }, durationMin * 60 * 1000);

        setPollQuestion("");
        setPollOptions(["", ""]);
    };

    const handleStopPoll = async () => {
        if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
        }

        // Use a ref to check if a poll is actually active, but we'll fetch messages to confirm
        // To be safe, we just send the stop message
        const password = localStorage.getItem('admin_password') || '';
        const username = localStorage.getItem('admin_user') || 'alex';
        const sessionId = localStorage.getItem('admin_session_id') || '';

        // Calculate results before stopping
        // We need to fetch the current messages to get the poll data
        try {
            const res = await fetch(`/api/chat/messages?channel=${currentVideoId}`);
            if (res.ok) {
                const currentData = await res.json();
                const latestPollMsg = [...currentData].reverse().find((m: any) => m.pseudo === 'DROPSIDERS' && m.message.startsWith('📊 SONDAGE :'));

                if (latestPollMsg) {
                    const lines = latestPollMsg.message.split('\n');
                    const question = lines[0].replace('📊 SONDAGE : ', '').trim();
                    const options = lines.slice(1).filter((l: string) => /^\d+\./.test(l)).map((l: string) => l.replace(/^\d+\.\s*/, '').trim());

                    const pollTakers = currentData.filter((m: any) => /^[1-9][0-9]*$/.test(m.message.trim()) && m.id > latestPollMsg.id);
                    const uniquePollTakers = pollTakers.filter((v: any, i: number, a: any[]) => a.findIndex(t => (t.pseudo === v.pseudo)) === i);
                    const totalVotes = uniquePollTakers.length;

                    if (totalVotes > 0) {
                        let maxVotes = 0;
                        let winnerIdx = 0;
                        options.forEach((_: any, i: number) => {
                            const optVotes = uniquePollTakers.filter((m: any) => m.message.trim() === String(i + 1)).length;
                            if (optVotes > maxVotes) {
                                maxVotes = optVotes;
                                winnerIdx = i;
                            }
                        });
                        const percentage = Math.round((maxVotes / totalVotes) * 100);
                        setLastPollResult({
                            question: question,
                            winner: options[winnerIdx],
                            percentage
                        });
                        setTimeout(() => setLastPollResult(null), 10000); // Hide after 10s
                    }
                }
            }
        } catch (e) { }

        await fetch('/api/chat/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Password': password,
                'X-Admin-Username': username,
                'X-Session-ID': sessionId
            },
            body: JSON.stringify({
                pseudo: 'DROPSIDERS',
                message: '🛑 SONDAGE TERMINÉ',
                country: 'FR',
                color: '#ff0033',
                channel: currentVideoId
            })
        });
        setActivePoll(null);
    };

    const processBotCommand = async (command: string) => {
        const cmd = command.toLowerCase().trim();
        let response = '';

        // Check custom commands FIRST so user can override defaults
        const custom = (settings.customCommands || '').split('\n').filter(l => l.includes(':'));
        for (const line of custom) {
            const trigger = line.split(':')[0].trim().toLowerCase();
            if (cmd === trigger) {
                const originalRes = line.split(':').slice(1).join(':').trim();
                response = originalRes;
                break;
            }
        }

        if (!response) {
            // These commands are handled by the server (worker.ts) to avoid double bots
            const serverCommands = ['!help', '!lineup', '!planning', '!shazam', '!musique', '!news', '!actu', '!id'];
            if (serverCommands.includes(cmd)) return;

            if (cmd === '!artiste') {
                const artist = fluxCurrentArtist?.artist || settings.currentArtist || "DÉCOUVRIR...";
                response = `🎤 ARTISTE ACTUEL : ${artist.toUpperCase()} ! 🔥`;
            } else if (cmd === '!festival') {
                response = `🎪 FESTIVAL : ${settings.title.toUpperCase() || "DROPSIDERS LIVE"} ! 🔥`;

            } else if (cmd === '!instagram' || cmd === '!insta') {
                const insta = fluxCurrentArtist?.instagram || settings.artistInstagram || "@DROPSIDERS";
                response = `📸 Instagram de l'artiste : ${insta} ! ✨`;
            } else if (cmd === '!sondage' && hasModPowers) {
                setShowPollModal(true);
                response = "📊 Ouverture du panneau de gestion des sondages...";
            } else if ((cmd === '!quizz' || cmd === '!quiz' || cmd.startsWith('!quiz ') || cmd.startsWith('!quizz ')) && hasModPowers) {
                // Réservé aux admins et modos — pas de message bot, popup discrète
                const args = command.split(' ');
                const requestedTheme = args.length > 1 ? args[1].toUpperCase() : 'ALL';

                setQuizPopupLoading(true);
                setQuizPopupAnswer(null);
                setShowQuizPopup(true);
                try {
                    const res = await fetch('/api/quiz/active');
                    if (res.ok) {
                        const data = await res.json();
                        // Only select questions that have question text AND options
                        let valid = Array.isArray(data) ? data.filter((q: any) => q && q.question && Array.isArray(q.options) && q.options.length > 0) : [];

                        // Theme filtering
                        if (requestedTheme !== 'ALL') {
                            valid = valid.filter((q: any) =>
                                (q.category && q.category.toUpperCase() === requestedTheme) ||
                                (q.type && q.type.toUpperCase() === requestedTheme) ||
                                (requestedTheme === 'BLIND_TEST' && q.type === 'BLIND_TEST') ||
                                (requestedTheme === 'BLINDTEST' && q.type === 'BLIND_TEST')
                            );
                        }

                        if (valid.length > 0) {
                            const random = valid[Math.floor(Math.random() * valid.length)];
                            setQuizPopupQuestion(random);
                        } else {
                            setQuizPopupQuestion(null);
                        }
                    }
                } catch (e) {
                    setQuizPopupQuestion(null);
                } finally {
                    setQuizPopupLoading(false);
                }
                // Pas de response → le bot ne poste rien dans le chat
            } else if (cmd.startsWith('!give') && isAdmin) {
                const parts = command.split(' ');
                if (parts.length >= 3) {
                    const targetPseudo = parts[1].replace('@', '').toUpperCase();
                    const amount = parseInt(parts[2]);
                    if (!isNaN(amount)) {
                        response = `💎 DON DE DROPS : @${targetPseudo} vient de recevoir ${amount} Drops de la part de l'administration ! ⚡`;
                        // Potential logic to credit the user if we had a backend store for user balances
                    }
                }
            } else if (cmd === '!shop' || cmd === '!boutique') {
                response = "🛒 Retrouvez toute notre collection sur la boutique officielle : https://dropsiders.com/shop ! ✨";
            } else if (cmd === '!clip') {
                handleCreateClip();
                response = "🎥 Ton clip des 30 dernières secondes est en cours de création ! Retrouve-le dans l'onglet Clips / VOD. ✂️";
            }

            if (hasModPowers) {
                if (cmd === '!shop on') {
                    handleUpdateSettings({ showShop: true });
                    response = "🛒 Le shop est maintenant visible pour tout le monde ! 🔥";
                } else if (cmd === '!shop off') {
                    handleUpdateSettings({ showShop: false });
                    response = "🛒 Le shop est désormais masqué. 🔒";
                }
            }

            if (!response && (cmd.includes('merci bot') || cmd.includes('cool bot'))) {
                response = "🥰 Je t'en prie ! Toujours là pour vous servir !";
            }
        }

        if (response) {
            // Wait a small bit for realism
            setTimeout(async () => {
                await fetch('/api/chat/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pseudo: 'DROPSIDERS BOT',
                        message: response,
                        country: 'FR',
                        isBot: true,
                        color: '#00ffcc',
                        channel: currentVideoId
                    })
                });
            }, 800);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        if (isSlowMode && !hasModPowers) {
            const now = Date.now();
            if (now - lastMessageTime < (slowModeDuration * 1000)) {
                alert(`Le mode lent est activé. Veuillez patienter ${slowModeDuration} secondes entre chaque message.`);
                return;
            }
            setLastMessageTime(now);
        }

        setIsSending(true);
        const msgText = newMessage;
        setNewMessage('');



        // Link blocking logic
        const hasLinks = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9]+\.[a-z]{2,})/i.test(msgText);
        if (hasLinks && !hasModPowers) {
            // Auto-block and notify
            setTimeout(async () => {
                await fetch('/api/chat/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pseudo: 'DROPSIDERS BOT',
                        message: `🚫 @${pseudo.toUpperCase()}, les liens ne sont autorisés que pour les modérateurs et administrateurs.`,
                        country: 'FR',
                        isBot: true,
                        color: '#00ffcc',
                        channel: currentVideoId
                    })
                });
            }, 500);
            setIsSending(false);
            return;
        }

        if (msgText.startsWith('!')) {
            await processBotCommand(msgText);
            // !quizz et !quiz : popup discrète uniquement, pas de message dans le chat
            const cmdLower = msgText.trim().toLowerCase();
            if (cmdLower === '!quizz' || cmdLower === '!quiz') {
                setIsSending(false);
                return;
            }
        }

        try {
            await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pseudo: pseudo.toUpperCase(),
                    country: country || 'FR',
                    message: msgText,
                    color: userColor,
                    channel: currentVideoId
                })
            });
            // Hype Increase
            setHypeLevel(prev => {
                const limit = settings.hypeLimit || 50;
                const increase = Math.ceil(100 / limit);
                return Math.min(100, prev + increase);
            });
        } catch (e: any) {
            console.error('Failed to send message', e);
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!hasModPowers) return;
        setMessages(prev => prev.filter(m => m.id !== id)); // optimistic update
        try {
            await fetch('/api/chat/delete', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id, channel: currentVideoId })
            });
        } catch (e: any) {
            console.error('Failed to delete message', e);
        }
    };

    const handleClearChat = async () => {
        setConfirmModal({
            isOpen: true,
            title: 'Vider le chat',
            message: 'Voulez-vous vraiment vider le chat ? Cette action est irréversible et supprimera TOUS les messages.',
            type: 'danger',
            onConfirm: () => performClearChat()
        });
    };

    const performClearChat = async () => {
        try {
            const res = await fetch('/api/chat/clear', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ channel: currentVideoId })
            });
            if (res.ok) {
                setMessages([]);
                alert('Chat vidé avec succès !');
            }
        } catch (e) {
            console.error('Failed to clear chat', e);
        } finally {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    };

    const handleShazam = async () => {
        if (shazamLoading) return;
        setShazamLoading(true);

        try {
            // Capture audio from the tab
            const stream = await (navigator.mediaDevices as any).getDisplayMedia({
                video: {
                    displaySurface: 'browser'
                },
                audio: {
                    suppressLocalAudioPlayback: false
                },
                systemAudio: 'include',
                preferCurrentTab: true
            } as any);

            const audioTrack = stream.getAudioTracks()[0];
            if (!audioTrack) {
                stream.getTracks().forEach((t: any) => t.stop());
                throw new Error("Aucun flux audio détecté");
            }

            // Record 8 seconds
            const recorder = new MediaRecorder(new MediaStream([audioTrack]));
            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: recorder.mimeType });
                stream.getTracks().forEach((t: any) => t.stop());

                // Prepare form data for AudD
                const formData = new FormData();
                formData.append('file', blob);
                formData.append('api_token', '0707d622c51645acc2e4fa26ed64538d');
                formData.append('return', 'spotify');

                try {
                    const res = await fetch('https://api.audd.io/', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await res.json();

                    if (data.status === 'success' && data.result) {
                        const newShazam = {
                            title: data.result.title,
                            artist: data.result.artist,
                            image: data.result.spotify?.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop",
                            spotify: data.result.spotify?.external_urls?.spotify || "https://open.spotify.com"
                        };
                        setShazamResult(newShazam);
                        setShowShazamNotify(true);
                        setActiveChatTab('shazam');

                        // Save to history (everyone)
                        fetch('/api/shazam/history', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...newShazam,
                                user: pseudo || 'Anonyme',
                                playedBy: fluxCurrentArtist.artist || 'Inconnu'
                            })
                        }).then(() => fetchShazamHistory());

                        // If moderator, save globally
                        if (hasModPowers) {
                            handleUpdateSettings({ currentShazam: newShazam });
                        }

                        // Auto hide after 12s
                        setTimeout(() => setShowShazamNotify(false), 12000);
                    } else {
                        alert("Désolé, je n'ai pas réussi à identifier ce morceau. 😕");
                    }
                } catch (err: any) {
                    console.error("Shazam API Error", err);
                    alert("Erreur de connexion au service d'identification.");
                } finally {
                    setShazamLoading(false);
                }
            };

            recorder.start();
            setTimeout(() => {
                if (recorder.state === 'recording') recorder.stop();
            }, 8000);

        } catch (err: any) {
            console.error("Shazam Capture Error", err);
            setShazamLoading(false);
            if (err.name !== 'NotAllowedError') {
                alert("Erreur Shazam : " + (err.message || "Capture impossible"));
            }
        }
    };








    const handleGiveDrops = async (targetPseudo: string) => {
        const amount = prompt(`Combien de Drops donner à @${targetPseudo} ?`, "500");
        if (!amount) return;
        const num = parseInt(amount);
        if (isNaN(num)) return alert("Montant invalide");

        try {
            await fetch('/api/chat/messages', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    pseudo: 'DROPSIDERS BOT',
                    message: `💎 DON DE DROPS : @${targetPseudo.toUpperCase()} vient de recevoir ${num} Drops de la part de l'administration ! ⚡`,
                    country: 'FR',
                    isBot: true,
                    color: '#00ffcc',
                    channel: currentVideoId
                })
            });
        } catch (e) {
            console.error('Failed to give drops', e);
        }
    };

    const handlePromote = async (name: string) => {
        if (!promotedModos.includes(name.toUpperCase())) {
            const newModos = [...promotedModos, name.toUpperCase()];
            setPromotedModos(newModos);
            localStorage.setItem('chat_promoted_modos', JSON.stringify(newModos));

            // Also add to permanent settings
            const currentMods = (settings.moderators || '').split(',').map(m => m.trim()).filter(m => m);
            if (!currentMods.map(m => m.toLowerCase()).includes(name.toLowerCase())) {
                const updatedMods = [...currentMods, name].join(',');
                await handleUpdateSettings({ moderators: updatedMods });
            }

            // Notify in chat
            await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pseudo: 'DROPSIDERS BOT',
                    message: `🛡️ @${name.toUpperCase()} a été promu modérateur du chat par un administrateur !`,
                    country: 'FR',
                    isBot: true,
                    color: '#00ffcc',
                    channel: currentVideoId
                })
            });
        }
    };

    const allActiveUsers = [
        ...(isJoined ? [{ pseudo: pseudo, country: country || 'FR' }] : []),
        ...messages.map(m => ({ pseudo: m.pseudo, country: m.country })),
        ...activeUsers
    ].filter((v, i, a) => a.findIndex(t => (t.pseudo === v.pseudo)) === i)
        .sort((a, b) => {
            const roleA = getRole(a.pseudo);
            const roleB = getRole(b.pseudo);
            // Admins first, then Modos, then users
            const weightA = roleA === 'admin' ? 3 : roleA === 'modo' ? 2 : 1;
            const weightB = roleB === 'admin' ? 3 : roleB === 'modo' ? 2 : 1;
            if (weightA !== weightB) return weightB - weightA;
            return a.pseudo.localeCompare(b.pseudo);
        });


    // State for command edition
    const [isSaving, setIsSaving] = useState(false);
    const [editLineup, setEditLineup] = useState(settings.lineup || '');
    const [_editCurrentArtist, setEditCurrentArtist] = useState(settings.currentArtist || '');
    const [_editArtistInstagram, setEditArtistInstagram] = useState(settings.artistInstagram || '');
    const [showShazamInfo, setShowShazamInfo] = useState(false);
    const [cmdTrigger, setCmdTrigger] = useState('');
    const [cmdResponse, setCmdResponse] = useState('');
    const [isEditingCmd, setIsEditingCmd] = useState<string | null>(null);

    const handleUnbanRequest = () => {
        // Placeholder for unban request logic
        alert("Demande de débannissement envoyée.");
    };

    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    const handleDemote = async (name: string) => {
        const currentMods = localModerators.split('\n').map(m => m.trim()).filter(Boolean);
        const newMods = currentMods.filter(m => m.toUpperCase() !== name.toUpperCase()).join('\n');
        setLocalModerators(newMods);
        try {
            await handleUpdateSettings({ moderators: newMods });
            await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pseudo: 'DROPSIDERS BOT',
                    message: `⚠️ @${name.toUpperCase()} n'est plus modérateur.`,
                    country: 'FR',
                    isBot: true,
                    color: '#00ffcc',
                    channel: currentVideoId
                })
            });
            setExpandedUserId(null);
        } catch (e: any) { console.error(e); }
    };

    const handleUpdateSettings = useCallback(async (updates: Partial<TakeoverProps['settings']>) => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/settings?t=${Date.now()}`);
            if (res.ok) {
                const currentSettings = await res.json();

                const newSettings = {
                    ...currentSettings,
                    takeover: {
                        ...currentSettings.takeover,
                        ...updates,
                        tickerType: updates.tickerType ?? tickerType,
                        tickerText: updates.tickerText ?? tickerText,
                        tickerLink: updates.tickerLink ?? tickerLink,
                        tickerBgColor: updates.tickerBgColor ?? tickerBgColor,
                        tickerTextColor: updates.tickerTextColor ?? tickerTextColor,
                        showTopBanner: updates.showTopBanner ?? showTopBanner,
                        showTickerBanner: updates.showTickerBanner ?? showTickerBanner,
                        botColor: updates.botColor ?? botColor,
                        botBgColor: updates.botBgColor ?? botBgColor,
                        adminColor: updates.adminColor ?? adminColor,
                        adminBgColor: updates.adminBgColor ?? adminBgColor,
                        showInAgenda: updates.showInAgenda ?? settings.showInAgenda,
                        startDate: updates.startDate ?? settings.startDate,
                        endDate: updates.endDate ?? settings.endDate,
                        showClosedDoors: updates.showClosedDoors ?? settings.showClosedDoors,
                        isOnline: updates.showClosedDoors === true ? false : (updates.isOnline ?? settings.isOnline)
                    }
                };

                const saveRes = await fetch('/api/settings/update', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(newSettings)
                });

                if (saveRes.ok) {
                    setShowVideoEdit(false);
                    setDisplayTitle(updates.title || editTitle);
                    if (updates.lineup !== undefined) setDisplayLineup(updates.lineup);
                    if (updates.showTopBanner !== undefined) setShowTopBanner(updates.showTopBanner);
                    if (updates.showTickerBanner !== undefined) setShowTickerBanner(updates.showTickerBanner);

                    if (updates.botColor !== undefined) setBotColor(updates.botColor);
                    if (updates.botBgColor !== undefined) setBotBgColor(updates.botBgColor);
                    if (updates.adminColor !== undefined) setAdminColor(updates.adminColor);
                    if (updates.adminBgColor !== undefined) setAdminBgColor(updates.adminBgColor);

                    if (updates.isOnline !== undefined) {
                        settings.isOnline = updates.isOnline;
                    }
                    if (updates.enabled !== undefined) {
                        settings.enabled = updates.enabled;
                    }
                    if (updates.autoMessage !== undefined) {
                        settings.autoMessage = updates.autoMessage;
                    }
                    if (updates.autoMessageInterval !== undefined) {
                        settings.autoMessageInterval = updates.autoMessageInterval;
                    }
                    if (updates.pinnedMessage !== undefined) {
                        settings.pinnedMessage = updates.pinnedMessage;
                        setLocalPinnedMessage(updates.pinnedMessage);
                    }
                    if (updates.youtubeId !== undefined) {
                        settings.youtubeId = updates.youtubeId;
                    }
                    if (updates.channels !== undefined) {
                        settings.channels = updates.channels;
                    }
                    if (updates.currentArtist !== undefined) {
                        settings.currentArtist = updates.currentArtist;
                        setEditCurrentArtist(updates.currentArtist);
                    }
                    if (updates.artistInstagram !== undefined) {
                        settings.artistInstagram = updates.artistInstagram;
                        setEditArtistInstagram(updates.artistInstagram);
                    }
                    if (updates.customCommands !== undefined) {
                        setLocalCustomCommands(updates.customCommands);
                    }
                    if (updates.moderators !== undefined) {
                        setLocalModerators(updates.moderators);
                    }
                    if (updates.showShop !== undefined) {
                        settings.showShop = updates.showShop;
                        setShowShopWidget(updates.showShop);
                    }
                    if (updates.mainFluxName !== undefined) {
                        settings.mainFluxName = updates.mainFluxName;
                    }
                    if (updates.lineup !== undefined) {
                        settings.lineup = updates.lineup;
                    }
                }
            }
        } catch (err: any) {
            console.error('Failed to update settings', err);
        } finally {
            setIsSaving(false);
        }
    }, [getAuthHeaders, editTitle, tickerType, tickerText, tickerLink, tickerBgColor, tickerTextColor, showTopBanner, showTickerBanner, botColor, botBgColor, adminColor, adminBgColor, settings]);

    // Scheduling Logic
    useEffect(() => {
        const checkSchedule = () => {
            if (!settings.startDate && !settings.endDate) return;

            const now = new Date();
            const start = settings.startDate ? new Date(settings.startDate) : null;
            const end = settings.endDate ? new Date(settings.endDate) : null;

            let shouldBeOnline = settings.isOnline;

            if (start && end) {
                shouldBeOnline = now >= start && now <= end;
            } else if (start) {
                shouldBeOnline = now >= start;
            } else if (end) {
                shouldBeOnline = now <= end;
            }

            if (shouldBeOnline !== settings.isOnline) {
                console.log('[Takeover] Scheduling update:', { shouldBeOnline, current: settings.isOnline });
                // Update settings prop immediately to avoid loop
                settings.isOnline = shouldBeOnline;
                handleUpdateSettings({ isOnline: shouldBeOnline });
            }
        };

        const interval = setInterval(checkSchedule, 30000); // Check every 30s
        checkSchedule();
        return () => clearInterval(interval);
    }, [settings.startDate, settings.endDate, settings.isOnline, handleUpdateSettings]);

    /*
    const handleToggleLive = async () => {
        const isCurrentlyOnline = settings.isOnline;
        const action = isCurrentlyOnline ? 'couper' : 'lancer';
        if (!window.confirm(`Voulez-vous vraiment ${action} le LIVE ?`)) return;
        handleUpdateSettings({ isOnline: !isCurrentlyOnline });
    };
    */



    useEffect(() => {
        const interval = setInterval(() => {
            const items = parseLineup(settings.lineup || '');
            const now = new Date();
            const currentTotal = now.getHours() * 60 + now.getMinutes();

            // Find current playing artist (latest one whose time is <= now AND not past)
            const currentItem = [...items]
                .filter(i => i.time && i.time.includes(':'))
                .map(i => {
                    const [h, m] = i.time.split(':').map(Number);
                    return { ...i, total: h * 60 + m };
                })
                .sort((a, b) => b.total - a.total)
                .find(i => i.total <= currentTotal && !i.isPast);

            if (isServerAdmin) { // Only admin updates the server settings to avoid conflicts
                if (currentItem) {
                    if (currentItem.artist !== settings.currentArtist || (currentItem.instagram && currentItem.instagram !== settings.artistInstagram)) {
                        handleUpdateSettings({
                            currentArtist: currentItem.artist,
                            artistInstagram: currentItem.instagram || ''
                        });
                    }
                } else if (settings.currentArtist) {
                    // Turn off current artist if it has passed
                    handleUpdateSettings({
                        currentArtist: '',
                        artistInstagram: ''
                    });
                }
            }
        }, 20000);
        return () => clearInterval(interval);
    }, [settings.lineup, settings.currentArtist, isServerAdmin, settings.artistInstagram, handleUpdateSettings, parseLineup]);

    // Automatic cleanup of past artists and update current artist (moved here after handleUpdateSettings is declared)
    useEffect(() => {
        if (!settings.lineup || !isServerAdmin) return;

        const updateCurrentArtistFromLineup = async () => {
            const items = parseLineup(settings.lineup || '');
            const now = new Date();
            const currentTotal = now.getHours() * 60 + now.getMinutes();

            // Find current active artist for the main flux
            const activeItems = items.filter(i => !i.isPast);
            const currentMainItem = items
                .filter(i => {
                    const [h, m] = i.time.split(':').map(Number);
                    const total = h * 60 + m;
                    return total <= currentTotal && !i.isPast;
                })
                .sort((a, b) => {
                    const [ha, ma] = a.time.split(':').map(Number);
                    const [hb, mb] = b.time.split(':').map(Number);
                    return (hb * 60 + mb) - (ha * 60 + ma);
                })[0];

            if (currentMainItem && currentMainItem.artist !== settings.currentArtist) {
                console.log('[Takeover] Auto-updating current artist:', currentMainItem.artist);
                await handleUpdateSettings({
                    currentArtist: currentMainItem.artist,
                    artistInstagram: currentMainItem.instagram || '@DROPSIDERS'
                });
            }

            // Cleanup past artists automatically
            if (activeItems.length !== items.length) {
                const newText = activeItems.map(i => {
                    const timeStr = i.endTime ? `${i.time}-${i.endTime}` : i.time;
                    const stagePart = i.stage ? ` - ${i.stage}` : '';
                    const instaPart = i.instagram ? ` - ${i.instagram}` : '';
                    return `[${timeStr}] ${i.artist}${stagePart}${instaPart}`;
                }).join('\n');

                if (newText !== settings.lineup) {
                    console.log('[Takeover] Auto-cleaning past artists from planning...');
                    await handleUpdateSettings({ lineup: newText });
                }
            }
        };

        const interval = setInterval(updateCurrentArtistFromLineup, 60000);
        updateCurrentArtistFromLineup();
        return () => clearInterval(interval);
    }, [settings.lineup, settings.currentArtist, parseLineup, isServerAdmin, handleUpdateSettings]);

    const handleRemoveModerator = async (modPseudo: string) => {
        const currentMods = (settings.moderators || '').split(',').map(m => m.trim()).filter(m => m && m.toLowerCase() !== modPseudo.toLowerCase());
        const newMods = currentMods.join(',');
        await handleUpdateSettings({ moderators: newMods });
    };
    const handleAddModerator = async (modPseudo: string) => {
        if (!modPseudo.trim()) return;
        const currentMods = (settings.moderators || '').split(',').map(m => m.trim()).filter(m => m);
        if (currentMods.map(m => m.toLowerCase()).includes(modPseudo.trim().toLowerCase())) return;
        const newMods = [...currentMods, modPseudo.trim()].join(',');
        await handleUpdateSettings({ moderators: newMods });
    };

    const handleAddOrUpdateCommand = async () => {
        if (!cmdTrigger.trim() || !cmdResponse.trim()) return;

        const trigger = cmdTrigger.startsWith('!') ? cmdTrigger.trim().toLowerCase() : `!${cmdTrigger.trim().toLowerCase()}`;
        const newCmdLine = `${trigger}:${cmdResponse.trim()}`;

        let currentCmds = (settings.customCommands || '').split('\n').filter(l => l.trim());

        if (isEditingCmd) {
            // Update existing
            currentCmds = currentCmds.map(line => {
                const [t] = line.split(':').map(s => s.trim().toLowerCase());
                return t === isEditingCmd ? newCmdLine : line;
            });
        } else {
            // Add new (remove if trigger already exists to avoid duplicates)
            currentCmds = currentCmds.filter(line => {
                const [t] = line.split(':').map(s => s.trim().toLowerCase());
                return t !== trigger;
            });
            currentCmds.push(newCmdLine);
        }

        await handleUpdateSettings({ customCommands: currentCmds.join('\n') });
        setCmdTrigger('');
        setCmdResponse('');
        setIsEditingCmd(null);
    };

    const handleDeleteCommand = async (trigger: string) => {
        if (!window.confirm(`Supprimer la commande ${trigger} ?`)) return;

        const currentCmds = (settings.customCommands || '').split('\n')
            .filter(line => {
                const [t] = line.split(':').map(s => s.trim().toLowerCase());
                return t !== trigger.toLowerCase();
            });

        await handleUpdateSettings({ customCommands: currentCmds.join('\n') });
    };

    const isUserOnline = (pseudo: string) => {
        return allActiveUsers.some(u => u.pseudo.toLowerCase() === pseudo.toLowerCase());
    };



    if (settings.isSecret && !isUnlocked && !hasModPowers) {
        return (
            <div className="fixed inset-0 bg-[#050505] z-[9999] flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md space-y-8 text-center"
                >
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-neon-purple opacity-20 blur-3xl animate-pulse" />
                        <Lock className="w-16 h-16 text-neon-purple relative z-10 mx-auto drop-shadow-[0_0_15px_#bc13fe]" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Accès <span className="text-neon-purple">Privé</span></h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Ce flux est restreint. Veuillez saisir le code d'accès.</p>
                    </div>

                    <form onSubmit={handleUnlock} className="space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={enteredPassword}
                                onChange={(e) => {
                                    setEnteredPassword(e.target.value);
                                    setPasswordError(false);
                                }}
                                placeholder="ENTREZ LE CODE..."
                                className={`w-full bg-black/40 border ${passwordError ? 'border-red-500 shadow-[0_0_15px_#ef444444]' : 'border-white/10'} rounded-2xl p-5 text-center text-xl font-black tracking-[0.5em] text-white outline-none focus:border-neon-purple transition-all`}
                                autoFocus
                            />
                            {passwordError && (
                                <motion.p
                                    initial={{ x: -10 }}
                                    animate={{ x: 0 }}
                                    className="text-[9px] text-red-500 font-black uppercase mt-2 tracking-widest italic"
                                >
                                    Code incorrect. Réessayez.
                                </motion.p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full py-5 bg-neon-purple hover:scale-[1.02] active:scale-95 text-white font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-[0_0_30px_#bc13fe33]"
                        >
                            Débloquer
                        </button>
                    </form>

                    <p className="text-[8px] text-gray-700 font-bold uppercase tracking-widest">
                        Dropsiders Takeover © 2026 • Système Sécurisé
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <>
            {/* Announcement Banner */}
            {!isFocusMode && !isFullScreen && annBannerEnabled && annBannerText && (
                <div
                    className="hidden lg:flex fixed top-0 left-0 right-0 h-12 flex items-center overflow-hidden z-[60] border-b border-white/10 shadow-2xl"
                    style={{ backgroundColor: annBannerBg }}
                >
                    <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black/20 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black/20 to-transparent z-10 pointer-events-none" />

                    <div className="flex items-center whitespace-nowrap animate-ticker py-2">
                        {Array(10).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center mx-12 shrink-0" style={{ color: annBannerColor }}>
                                <span className="text-[10px] lg:text-[12px] font-black uppercase italic tracking-[0.3em]">{annBannerText}</span>
                                <div className="w-2 h-2 rounded-full bg-white/30 ml-12" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className={`relative lg:fixed top-0 ${showTopBanner && !isFullScreen ? (annBannerEnabled && annBannerText ? 'lg:top-[128px]' : 'lg:top-20') : 'lg:top-0'} inset-x-0 lg:bottom-0 min-h-screen lg:min-h-0 flex flex-col bg-black z-[50] pb-20 lg:pb-0 lg:overflow-hidden transition-all duration-700 ease-in-out ${isOverdrive ? 'overdrive-active bg-aurora border-[4px] border-neon-red shadow-[inset_0_0_100px_rgba(255,18,65,0.4)]' : ''}`}>
                {/* OFFLINE VIEW FOR NON-ADMINS - FULL PAGE BLANKET */}
                {(!settings.isOnline && !isServerAdmin && isJoined) && (
                    <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center p-6 text-center">
                        <div className="absolute inset-0 bg-aurora opacity-10 pointer-events-none" />
                        <div className="w-24 h-24 rounded-full bg-neon-red/10 border border-neon-red/30 flex items-center justify-center mb-10 shadow-[0_0_50px_#ff000033]">
                            <Power className="w-10 h-10 text-neon-red" />
                        </div>

                        <h3 className="text-4xl lg:text-7xl font-display font-black text-white uppercase italic tracking-tighter mb-4">
                            LE LIVE EST <span className="text-neon-red">COUPÉ</span>
                        </h3>
                        <p className="text-gray-500 font-bold uppercase tracking-[0.4em] text-[10px] lg:text-sm mb-16 px-4">Accès restreint • Reprise prochainement</p>

                        {upcomingLives.length > 0 && (
                            <div className="w-full max-w-2xl bg-white/[0.02] backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 shadow-2xl relative">
                                <div className="absolute -top-12 -left-12 w-32 h-32 bg-neon-red/10 rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none" />
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-px flex-1 bg-white/10" />
                                    <span className="text-[10px] font-black text-neon-red uppercase tracking-[0.3em] whitespace-nowrap">Prochain Live Programmé</span>
                                    <div className="h-px flex-1 bg-white/10" />
                                </div>

                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-4xl md:text-6xl font-display font-black text-white uppercase italic tracking-tighter">
                                        {new Date(upcomingLives[0].date || upcomingLives[0].startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' }).toUpperCase()}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_8px_#00ffff]" />
                                        <p className="text-xl md:text-2xl font-black text-neon-cyan uppercase italic tracking-tight">
                                            {upcomingLives[0].title}
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-2">
                                        À {upcomingLives[0].time || 'Bientôt'} • {upcomingLives[0].location || 'Sur Dropsiders'}
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="mt-12 text-[9px] font-black text-gray-600 uppercase tracking-widest border border-white/10 px-6 py-2 rounded-full">
                            DROPSIDERS V2 • LIVE ENGINE
                        </div>
                    </div>
                )}



                {/* Flux Selection & Info Bar - Always visible above video on Desktop */}
                {!isFullScreen && (
                    <div className="hidden lg:flex w-full bg-[#0a0a0a] border-b border-white/10 px-2 md:px-4 py-2 items-center justify-between gap-2 z-40 relative overflow-hidden">
                        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                            {/* LIVE TITLE */}
                            <div className="flex flex-col min-w-0 py-0.5">
                                <div className="flex items-center gap-2 md:gap-3">
                                    {(settings.enabled || settings.isOnline || isServerAdmin) && (
                                        <div className="flex items-center gap-1.5 md:gap-2 bg-red-600 px-2 md:px-3 py-0.5 md:py-1 rounded-full shadow-[0_0_15px_rgba(255,0,0,0.4)] border border-white/20 shrink-0">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                            <span className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest leading-none">
                                                LIVE
                                            </span>
                                        </div>
                                    )}
                                    <h1 className="text-sm md:text-2xl font-display font-black text-white uppercase italic tracking-tighter truncate leading-none">
                                        {displayTitle}
                                    </h1>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4 shrink-0">
                            {/* HYPE & BPM Display - Compact on mobile */}
                            <div className="flex items-center gap-2 md:gap-4 px-2 md:px-4 border-x border-white/10 mx-1 md:mx-2 hidden sm:flex">
                                <div className="flex flex-col items-center justify-center">
                                    <span className="text-[7px] md:text-[8px] font-black text-gray-600 uppercase tracking-widest mb-0.5 md:mb-1">HYPE</span>
                                    <div className="flex items-center gap-1 md:gap-2">
                                        <div className="w-8 md:w-12 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5 shrink-0">
                                            <motion.div
                                                animate={{ width: `${hypeLevel}%` }}
                                                className={`h-full ${isOverdrive ? 'bg-neon-red shadow-[0_0_10px_#ff0033]' : 'bg-neon-purple'}`}
                                            />
                                        </div>
                                        <span className={`text-[8px] md:text-[9px] font-black w-6 md:w-7 text-right ${isOverdrive ? 'text-neon-red' : 'text-white'}`}>{hypeLevel}%</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center">
                                    <span className="text-[7px] md:text-[8px] font-black text-gray-600 uppercase tracking-widest mb-0.5 md:mb-1">BPM</span>
                                    <span className="text-[9px] md:text-[10px] font-black text-white italic">{bpm}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 md:gap-2">
                                <button
                                    onClick={() => setShowClipModal(!showClipModal)}
                                    className={`p-1.5 md:p-2 rounded-lg transition-all ${showClipModal ? 'bg-neon-purple text-white shadow-[0_0_10px_#bd00ff33]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                    title="Clips & VOD"
                                >
                                    <Video className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </button>
                                <button
                                    onClick={() => setShowLineup(!showLineup)}
                                    className={`p-1.5 md:p-2 rounded-lg transition-all ${showLineup ? 'bg-neon-red text-white shadow-[0_0_10px_#ff003333]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                    title="Planning"
                                >
                                    <List className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </button>
                            </div>

                            <div className="hidden md:flex items-center gap-1.5 px-2 bg-white/5 border border-white/10 rounded-xl h-8">
                                <a href={`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" className="p-1.5 text-gray-500 hover:text-blue-500 transition-colors"><Facebook className="w-3.5 h-3.5" /></a>
                                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" className="p-1.5 text-gray-500 hover:text-white transition-colors"><XIcon className="w-3.5 h-3.5" /></a>
                                <a href={`https://snapchat.com/share?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" className="p-1.5 text-gray-500 hover:text-yellow-400 transition-colors"><SnapchatIcon className="w-3.5 h-3.5" /></a>
                            </div>

                            <button
                                onClick={() => { sessionStorage.setItem('exited_live', 'true'); window.location.href = '/'; }}
                                className="p-1.5 md:p-2 bg-white/5 hover:bg-neon-red/20 border border-white/10 rounded-full text-gray-400 hover:text-neon-red transition-all md:ml-2"
                            >
                                <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Live Banner Header - REDUCED SIZE */}
                {(showTopBanner && !isFocusMode && !isFullScreen && (settings.enabled || settings.isOnline || isServerAdmin)) && (
                    <div className="hidden lg:flex w-full bg-[#080808] border-b border-white/10 px-6 py-2 items-center justify-between z-30 shadow-xl shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-md shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">EN DIRECT:</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">{fluxCurrentArtist.artist || '---'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 ml-auto">
                            {/* VIEWERS DISPLAY - KEPT ON THE RIGHT */}
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/10 rounded-full cursor-pointer hover:bg-white/10 transition-all"
                                onClick={() => setShowUsersPanel(!showUsersPanel)}>
                                <Users className="w-3.5 h-3.5 text-neon-red" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                    {viewersCount > 0 ? viewersCount.toLocaleString('fr-FR') : allActiveUsers.length} SPECTATEURS
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {isFullScreen && (
                    <button
                        onClick={() => setIsFullScreen(false)}
                        className="fixed top-4 right-4 z-[100] p-3 bg-neon-cyan/20 backdrop-blur-md border border-neon-cyan/30 rounded-full text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all shadow-[0_0_20px_rgba(0,255,204,0.3)]"
                        title="Quitter le plein écran"
                    >
                        <Minimize className="w-5 h-5" />
                    </button>
                )}

                <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-black gap-0 relative">
                    {/* Video Section */}
                    <div className={`shrink-0 w-full h-[35vh] lg:h-auto lg:w-auto lg:flex-[2] bg-black flex flex-col relative border-b lg:border-b-0 lg:border-r border-white/10 group overflow-hidden shadow-2xl ${!isJoined ? 'blur-[8px] grayscale brightness-50 pointer-events-none' : ''}`}>

                        <div ref={videoPlayerRef} className="w-full h-full lg:flex-1 relative bg-black group overflow-hidden">
                            <div className="absolute inset-0 z-0">
                                <div className={`grid ${playersOption === 4 ? (getVisiblePlayers().length > 2 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-2 grid-rows-1') : 'grid-cols-1'} h-full gap-0.5 bg-black`}>
                                    {getVisiblePlayers().map((item, idx) => (
                                        item && (
                                            <iframe
                                                key={idx}
                                                className="w-full h-full border-none"
                                                src={`https://www.youtube.com/embed/${item.id}?autoplay=1&mute=${idx === 0 ? 0 : 1}&rel=0&modestbranding=1&enablejsapi=1`}
                                                title={item.title}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        )
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Mini Planning Widget */}
                        <AnimatePresence>
                            {
                                !isFocusMode && showLineup && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                        className="absolute inset-0 z-30 bg-black/40 backdrop-blur-[30px] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden pointer-events-auto flex flex-col items-center p-6 lg:p-12"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="w-full max-w-5xl flex flex-col h-full relative">
                                            <div className="flex items-center justify-between mb-8 shrink-0">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-neon-red/20 rounded-2xl border border-neon-red/30 shadow-[0_0_20px_rgba(255,0,51,0.2)]">
                                                        <List className="w-6 h-6 text-neon-red drop-shadow-lg" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-3xl lg:text-5xl font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-md">LINE UP <span className="text-neon-red">LIVE</span></h2>
                                                        <p className="text-[10px] lg:text-xs text-gray-300 font-bold uppercase tracking-[0.2em] mt-1 drop-shadow-md">Horaires et passages artistes en temps réel</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setShowLineup(false)} className="p-4 bg-white/10 border border-white/20 rounded-full hover:bg-neon-red hover:border-neon-red transition-all shadow-lg active:scale-95 group">
                                                    <X className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                                                </button>
                                            </div>

                                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-20 mt-4">
                                                {/* Header Grid */}
                                                <div className="grid grid-cols-[100px_1fr_1fr] gap-8 px-10 mb-6 text-[9px] font-black text-white/30 uppercase tracking-[0.3em] hidden lg:grid">
                                                    <div className="text-left">HEURE</div>
                                                    <div className="text-left">ARTISTE</div>
                                                    <div className="text-right pr-10">SCÈNE</div>
                                                </div>

                                                {currentFluxLineup.filter(item => !item.isPast).map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`group grid grid-cols-[80px_1fr_1fr] lg:grid-cols-[100px_1fr_1fr] gap-4 lg:gap-8 items-center border transition-all duration-500 mb-3 relative overflow-hidden p-5 lg:p-7 rounded-[2rem] ${fluxCurrentArtist.artist === item.artist ? 'bg-white/[0.04] border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.05)]' : 'bg-white/[0.015] border-white/5 hover:border-white/10'}`}
                                                    >
                                                        {/* Progress Background for current artist - FULL TAB */}
                                                        {fluxCurrentArtist.artist === item.artist && item.progress > 0 && (
                                                            <div
                                                                className="absolute inset-0 bg-neon-red/10 border-l border-neon-red/30 z-0 transition-all duration-1000 ease-linear pointer-events-none"
                                                                style={{ width: `${item.progress}%` }}
                                                            >
                                                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-neon-red shadow-[0_0_15px_#ff0033]" />
                                                            </div>
                                                        )}

                                                        <div className="absolute inset-0 bg-gradient-to-r from-neon-red/0 via-white/0 to-white/0 group-hover:from-white/[0.02] transition-colors pointer-events-none" />
                                                        {/* Time Column */}
                                                        <div className="flex flex-col relative z-10">
                                                            <span className={`font-black text-[13px] lg:text-[15px] tracking-tight transition-colors duration-500 ${fluxCurrentArtist.artist === item.artist ? 'text-white' : 'text-white/40 group-hover:text-white/70'}`}>
                                                                {item.time?.replace(':', 'H') || '--H--'}
                                                                {item.endTime && (
                                                                    <span className="block opacity-40 text-[10px] lg:text-[11px] mt-0.5">
                                                                        {item.endTime.replace(':', 'H')}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>

                                                        {/* Artist Column */}
                                                        <div className="flex items-center gap-4 min-w-0 relative z-10">
                                                            <h3 className={`font-black uppercase italic tracking-wider text-[7px] lg:text-[10px] leading-tight truncate group-hover:translate-x-1 transition-transform duration-500 ${fluxCurrentArtist.artist === item.artist ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                                                                {item.artist || '---'}
                                                            </h3>
                                                            {fluxCurrentArtist.artist === item.artist && settings.isOnline && (
                                                                <div className="px-2 py-0.5 bg-red-600/20 border border-red-500/30 rounded text-[7px] font-black text-red-500 uppercase tracking-widest animate-pulse flex items-center gap-1">
                                                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                                                    EN DIRECT
                                                                </div>
                                                            )}
                                                            {item.instagram && (
                                                                <motion.a
                                                                    whileHover={{ scale: 1.2, rotate: 5 }}
                                                                    href={item.instagram}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={e => e.stopPropagation()}
                                                                    className="w-7 h-7 flex items-center justify-center bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] rounded-full p-1.5 shadow-lg opacity-60 hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Instagram className="w-full h-full text-white" />
                                                                </motion.a>
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!item.artist) return;
                                                                    const newFavs = favorites.includes(item.artist)
                                                                        ? favorites.filter(f => f !== item.artist)
                                                                        : [...favorites, item.artist];
                                                                    setFavorites(newFavs);
                                                                    localStorage.setItem('favorited_artists', JSON.stringify(newFavs));
                                                                }}
                                                                className={`w-7 h-7 flex items-center justify-center rounded-full p-1.5 shadow-lg transition-all ${favorites.includes(item.artist) ? 'bg-neon-red opacity-100' : 'bg-white/10 opacity-60 hover:opacity-100 hover:bg-white/20'}`}
                                                                title={favorites.includes(item.artist) ? "Retirer des favoris" : "Mettre en favoris pour recevoir une notification"}
                                                            >
                                                                <Heart className={`w-full h-full ${favorites.includes(item.artist) ? 'text-white fill-white' : 'text-white'}`} />
                                                            </button>
                                                        </div>

                                                        {/* Stage Column */}
                                                        <div className="flex items-center justify-end pr-8 relative z-10">
                                                            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 border rounded-full whitespace-nowrap transition-all duration-500 ${fluxCurrentArtist.artist === item.artist ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/5 text-white/30 group-hover:border-white/10 group-hover:text-white/70'}`}>
                                                                {item.stage || '---'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {parseLineup(editLineup || settings.lineup || '').length === 0 && (
                                                    <div className="py-20 text-center">
                                                        <p className="text-sm font-black text-white/30 uppercase tracking-[0.3em] italic drop-shadow-md">
                                                            PROGRAMME À VENIR
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            }
                        </AnimatePresence >

                        {/* Admin: Change Video popover */}
                        <AnimatePresence>
                            {
                                !isFocusMode && showVideoEdit && hasModPowers && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#111] border border-white/20 rounded-2xl p-4 shadow-2xl w-80"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">YouTube ID ou URL</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newVideoId}
                                                onChange={e => setNewVideoId(e.target.value.split('v=').pop()?.split('&')[0] || e.target.value)}
                                                placeholder="dQw4w9WgXcQ"
                                                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-neon-red outline-none"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleUpdateSettings({ youtubeId: newVideoId })}
                                                disabled={isSaving}
                                                className="px-4 py-2 bg-neon-red text-white rounded-xl text-xs font-black hover:bg-neon-red/80 transition-all disabled:opacity-50"
                                            >
                                                {isSaving ? '...' : 'OK'}
                                            </button>
                                        </div>
                                    </motion.div>
                                )
                            }
                        </AnimatePresence >

                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <button
                                onClick={() => setShowShazamInfo(true)}
                                disabled={shazamLoading}
                                className={`flex items-center gap-3 px-6 py-3 bg-black/80 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all backdrop-blur-md shadow-2xl active:scale-95 group ${shazamLoading ? 'border-neon-cyan' : 'hover:bg-neon-cyan hover:border-neon-cyan/50'}`}
                            >
                                <Headphones className={`w-4 h-4 text-neon-cyan group-hover:text-white ${shazamLoading ? 'animate-spin' : ''}`} />
                                {shazamLoading ? "Écoute en cours..." : "Shazam"}
                            </button>
                            <button
                                onClick={() => setIsFullScreen(!isFullScreen)}
                                className={`flex items-center gap-3 px-6 py-3 bg-black/80 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all backdrop-blur-md shadow-2xl active:scale-95 group hover:bg-neon-cyan hover:border-neon-cyan/50`}
                                title={isFullScreen ? "Quitter le plein écran" : "Plein écran"}
                            >
                                {isFullScreen ? <Minimize className="w-4 h-4 text-neon-cyan group-hover:text-white" /> : <Maximize className="w-4 h-4 text-neon-cyan group-hover:text-white" />}
                                {isFullScreen ? "Réduire" : "Plein écran"}
                            </button>
                        </div>

                        {/* Shazam Notification Overlay */}
                        <AnimatePresence>
                            {!isFocusMode && showShazamNotify && shazamResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: -50, x: '-50%' }}
                                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                                    exit={{ opacity: 0, y: -50, x: '-50%' }}
                                    className="absolute top-8 left-1/2 z-[45] w-[320px] lg:w-[400px] bg-black/40 backdrop-blur-3xl border border-white/20 rounded-3xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-neon-cyan animate-pulse" />
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-16 h-16 shrink-0 aspect-square rounded-2xl overflow-hidden border border-white/10">
                                            <img src={shazamResult.image} className="w-full h-full object-cover" alt="Track" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <Headphones className="w-6 h-6 text-neon-cyan drop-shadow-[0_0_8px_#00ffff]" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black text-neon-cyan uppercase tracking-widest mb-1">Musique Identifiée</p>
                                            <h4 className="text-white font-black text-sm uppercase italic truncate tracking-tight">{shazamResult.title}</h4>
                                            <p className="text-gray-400 font-bold text-[10px] uppercase truncate">{shazamResult.artist}</p>
                                        </div>
                                        <button
                                            onClick={() => setShowShazamNotify(false)}
                                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                        >
                                            <X className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <a
                                            href={shazamResult.spotify || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-[#1DB954] border border-white/10 hover:border-transparent rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all group"
                                        >
                                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.508 17.302c-.223.367-.714.484-1.077.262-2.92-1.785-6.598-2.185-10.932-1.192-.418.093-.83-.173-.923-.591-.093-.418.173-.83.591-.923 4.743-1.085 8.79-.619 12.079 1.388.367.22.484.71.262 1.056zm1.47-3.253c-.282.458-.883.6-1.341.32-3.34-2.053-8.432-2.651-12.382-1.454-.515.156-1.054-.133-1.21-.649-.156-.516.133-1.054.649-1.21 4.512-1.368 10.125-.694 13.965 1.664.458.282.6.883.32 1.329zm.135-3.376C15.118 8.169 8.514 7.948 4.717 9.102c-.628.19-1.295-.162-1.485-.79-.19-.628.162-1.295.79-1.485 4.356-1.322 11.642-1.056 16.275 1.693.564.335.748 1.066.413 1.631-.335.564-1.067.747-1.632.413z" />
                                            </svg>
                                            Ouvrir Spotify
                                        </a>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Clip & VOD Modal Layer */}
                        <AnimatePresence>
                            {!isFocusMode && showClipModal && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/80 backdrop-blur-md z-[45] p-6 lg:p-12 flex items-center justify-center overflow-auto"
                                    onClick={() => setShowClipModal(false)}
                                >
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-between p-6 lg:p-8 border-b border-white/5 shrink-0 bg-white/[0.02]">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-neon-purple/20 rounded-2xl border border-neon-purple/30 shadow-[0_0_20px_rgba(188,19,254,0.3)]">
                                                    <Video className="w-6 h-6 text-neon-purple" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Clips <span className="text-neon-purple">& VOD</span></h2>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Replay et meilleurs moments du live</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setShowClipModal(false)} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-neon-red hover:border-neon-red hover:text-white transition-all text-gray-400 group">
                                                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            </button>
                                        </div>
                                        <div className="p-6 lg:p-8 flex-1 overflow-y-auto">
                                            <div className="p-6 bg-white/[0.02] border border-white/10 rounded-3xl flex flex-col items-center justify-between gap-6 shadow-inner relative overflow-hidden group/capture">
                                                <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 via-transparent to-transparent pointer-events-none" />
                                                <div className="flex-1 w-full relative z-10">
                                                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-2">
                                                        <Zap className="w-4 h-4 text-neon-purple animate-pulse" />
                                                        Capturer un Instant
                                                    </h3>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em]">Générez un clip vidéo de la durée de votre choix du flux sélectionné.</p>

                                                    <div className="flex flex-col sm:flex-row gap-4 mt-6 p-5 bg-black/40 rounded-[2rem] border border-white/5 backdrop-blur-sm">
                                                        <div className="flex-1">
                                                            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-4 mb-2 block">Titre Personnalisé (Optionnel)</label>
                                                            <input
                                                                type="text"
                                                                value={clipTitle}
                                                                onChange={e => setClipTitle(e.target.value)}
                                                                placeholder="EX: MOMENT ÉPIQUE !"
                                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-[10px] font-black text-white outline-none focus:border-neon-purple transition-all uppercase placeholder:text-white/5"
                                                            />
                                                        </div>
                                                        <div className="sm:w-32">
                                                            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-4 mb-2 block">Durée</label>
                                                            <div className="relative">
                                                                <select
                                                                    value={clipDuration}
                                                                    onChange={e => setClipDuration(Number(e.target.value))}
                                                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-5 pr-10 py-3 text-[10px] font-black text-white outline-none focus:border-neon-purple appearance-none cursor-pointer hover:bg-white/5 transition-all uppercase"
                                                                >
                                                                    <option value={15}>15 SECONDES</option>
                                                                    <option value={30}>30 SECONDES</option>
                                                                    <option value={60}>60 SECONDES</option>
                                                                </select>
                                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* NEW OPTIONS: FEATURED & PERMANENT - MODS ONLY */}
                                                    {hasModPowers && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                                            <button
                                                                onClick={() => setIsFeatured(!isFeatured)}
                                                                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isFeatured ? 'bg-neon-red/20 border-neon-red text-white' : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/10'}`}
                                                            >
                                                                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${isFeatured ? 'bg-neon-red border-neon-red' : 'border-white/20'}`}>
                                                                    {isFeatured && <Star className="w-3 h-3 text-white fill-white" />}
                                                                </div>
                                                                <div className="flex flex-col text-left">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">Mettre à la une</span>
                                                                    <span className="text-[8px] font-bold text-gray-600 uppercase">Affiché en priorité</span>
                                                                </div>
                                                            </button>

                                                            <button
                                                                onClick={() => setKeepForever(!keepForever)}
                                                                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${keepForever ? 'bg-neon-cyan/20 border-neon-cyan text-white' : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/10'}`}
                                                            >
                                                                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${keepForever ? 'bg-neon-cyan border-neon-cyan' : 'border-white/20'}`}>
                                                                    {keepForever && <ShieldCheck className="w-3 h-3 text-black" />}
                                                                </div>
                                                                <div className="flex flex-col text-left">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">Garder à vie</span>
                                                                    <span className="text-[8px] font-bold text-gray-600 uppercase">Pas de suppression auto</span>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={handleCreateClip}
                                                    disabled={isClipping}
                                                    className="relative w-full overflow-hidden px-8 py-5 bg-neon-purple text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(188,19,254,0.3)] shrink-0 active:scale-95 disabled:opacity-50 mt-2 h-16 z-10"
                                                >
                                                    {isClipping ? (
                                                        <div className="flex items-center justify-center gap-3">
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            CRÉATION {clipProgress}%...
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-3">
                                                            <Video className="w-5 h-5" />
                                                            LANCER LA CAPTURE
                                                        </div>
                                                    )}
                                                    {isClipping && (
                                                        <div className="absolute bottom-0 left-0 h-1.5 bg-white/30 transition-all duration-150" style={{ width: `${clipProgress}%` }} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Full Edit Modal Layer */}
                        <AnimatePresence>
                            {showEditModal && hasModPowers && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-md z-[40] p-4 lg:p-10 flex flex-col items-center overflow-y-auto custom-scrollbar"
                                >
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="w-full max-w-5xl h-[90vh] bg-black/40 backdrop-blur-[30px] border border-white/10 rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-between p-8 lg:p-10 border-b border-white/10 shrink-0">
                                            <div>
                                                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Live <span className="text-neon-red">Takeover</span></h2>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Configuration et outils d'administration</p>
                                            </div>
                                            <button onClick={() => setShowEditModal(false)} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                                                <X className="w-6 h-6 text-white" />
                                            </button>
                                        </div>

                                        {/* Tabs Navigation */}
                                        <div className="flex justify-center border-b border-white/10 px-6 shrink-0 bg-white/[0.02] overflow-x-auto no-scrollbar">
                                            <button
                                                onClick={() => setActiveSettingsTab('general')}
                                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex-shrink-0 ${activeSettingsTab === 'general' ? 'text-neon-red' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Live / Vidéo / Bandeau
                                                {activeSettingsTab === 'general' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-red" />}
                                            </button>
                                            <button
                                                onClick={() => setActiveSettingsTab('planning')}
                                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex-shrink-0 ${activeSettingsTab === 'planning' ? 'text-neon-red' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Planning
                                                {activeSettingsTab === 'planning' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-red" />}
                                            </button>
                                            <button
                                                onClick={() => setActiveSettingsTab('moderation')}
                                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex-shrink-0 ${activeSettingsTab === 'moderation' ? 'text-neon-red' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Sécurité & Bot
                                                {activeSettingsTab === 'moderation' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-red" />}
                                            </button>
                                            <button
                                                onClick={() => setActiveSettingsTab('points')}
                                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex-shrink-0 ${activeSettingsTab === 'points' ? 'text-neon-cyan' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Points / Drops & Récompenses
                                                {activeSettingsTab === 'points' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-cyan" />}
                                            </button>
                                        </div>

                                        {/* Tab Content */}
                                        <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">

                                            {activeSettingsTab === 'general' && (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        {/* Configuration Affichage */}
                                                        <div className="space-y-4 bg-white/5 border border-white/5 p-4 lg:p-6 rounded-[2rem]">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="p-2 bg-neon-red/10 rounded-xl">
                                                                    <Activity className="w-4 h-4 text-neon-red" />
                                                                </div>
                                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Configuration <span className="text-neon-red">Affichage</span></h3>
                                                            </div>
                                                            <div className="grid grid-cols-1 gap-3">
                                                                <button
                                                                    onClick={async () => {
                                                                        const newStatus = !settings.isOnline;
                                                                        if (newStatus) {
                                                                            // Auto-clear chat when live starts
                                                                            try {
                                                                                await fetch(`/api/chat/messages/clear?channel=${currentVideoId}`, {
                                                                                    method: 'POST',
                                                                                    headers: getAuthHeaders()
                                                                                });
                                                                                setMessages([]);
                                                                            } catch (e) { }
                                                                        }
                                                                        handleUpdateSettings({ isOnline: newStatus });
                                                                    }}
                                                                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-lg ${settings.isOnline ? 'bg-neon-red text-white shadow-neon-red/20' : 'bg-neon-cyan text-black shadow-neon-cyan/20'}`}
                                                                >
                                                                    {settings.isOnline ? (
                                                                        <><PowerOff className="w-6 h-6" /> COUPER LE LIVE</>
                                                                    ) : (
                                                                        <><Power className="w-6 h-6" /> LANCER LE LIVE</>
                                                                    )}
                                                                </button>
                                                                <StyledCheckbox
                                                                    label="Afficher dans l'Agenda"
                                                                    sublabel="Visible sur la page d'accueil"
                                                                    checked={!!settings.showInAgenda}
                                                                    onChange={() => handleUpdateSettings({ showInAgenda: !settings.showInAgenda })}
                                                                    color="cyan"
                                                                />

                                                                <div className="pt-2">
                                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">Titre du Live</p>
                                                                    <div className="flex gap-2">
                                                                        <input type="text" value={localSettings.title || ''} onChange={e => handleUpdateLocalSetting({ title: e.target.value })} className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs font-black text-white outline-none focus:border-neon-cyan w-full uppercase" placeholder="Titre..." />
                                                                        <button onClick={() => handleUpdateSettings({ title: localSettings.title })} className="px-4 py-2 bg-neon-cyan text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-neon-cyan/80 transition-all">OK</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Source Vidéo */}
                                                        <div className="space-y-4 bg-white/5 border border-white/5 p-4 lg:p-6 rounded-[2rem]">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="p-2 bg-neon-cyan/10 rounded-xl">
                                                                    <Youtube className="w-4 h-4 text-neon-cyan" />
                                                                </div>
                                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter flex-1">Sources <span className="text-neon-cyan">Vidéo</span></h3>
                                                                <button
                                                                    onClick={() => {
                                                                        setFluxPrincipal('');
                                                                        setStage1('');
                                                                        setStage2('');
                                                                        setStage3('');
                                                                        setStage4('');
                                                                        setStage5('');
                                                                        setStage6('');
                                                                    }}
                                                                    className="text-[9px] font-black text-neon-red/60 hover:text-neon-red uppercase tracking-widest flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg hover:bg-neon-red/5"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" /> Tout Vider
                                                                </button>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Flux Principaux (1 & 2)</p>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div className="relative">
                                                                            <input type="text" placeholder="Flux Principal" value={editMainFluxName} onChange={e => setEditMainFluxName(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none focus:border-neon-cyan w-full" />
                                                                            {editMainFluxName && <button onClick={() => setEditMainFluxName('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-neon-red transition-colors"><Trash2 className="w-3 h-3" /></button>}
                                                                        </div>
                                                                        <div className="relative">
                                                                            <input type="text" placeholder="YouTube ID Principal" value={fluxPrincipal} onChange={e => setFluxPrincipal(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none focus:border-neon-cyan w-full" />
                                                                            {fluxPrincipal && <button onClick={() => setFluxPrincipal('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-neon-red"><Trash2 className="w-3 h-3" /></button>}
                                                                        </div>
                                                                        <div className="relative">
                                                                            <input type="text" placeholder="Stage 1 Name" value={stage1Name} onChange={e => setStage1Name(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none focus:border-neon-cyan w-full" />
                                                                            {stage1Name && <button onClick={() => setStage1Name('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-neon-red transition-colors"><Trash2 className="w-3 h-3" /></button>}
                                                                        </div>
                                                                        <div className="relative">
                                                                            <input type="text" placeholder="YouTube ID" value={stage1} onChange={e => setStage1(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none focus:border-neon-cyan w-full" />
                                                                            {stage1 && <button onClick={() => setStage1('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-neon-red"><Trash2 className="w-3 h-3" /></button>}
                                                                        </div>
                                                                        <div className="relative">
                                                                            <input type="text" placeholder="Stage 2 Name" value={stage2Name} onChange={e => setStage2Name(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none focus:border-neon-cyan w-full" />
                                                                            {stage2Name && <button onClick={() => setStage2Name('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-neon-red transition-colors"><Trash2 className="w-3 h-3" /></button>}
                                                                        </div>
                                                                        <div className="relative">
                                                                            <input type="text" placeholder="YouTube ID" value={stage2} onChange={e => setStage2(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none focus:border-neon-cyan w-full" />
                                                                            {stage2 && <button onClick={() => setStage2('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-neon-red"><Trash2 className="w-3 h-3" /></button>}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Flux Secondaires (3 & 4)</p>
                                                                    <div className="grid grid-cols-2 gap-2 relative group">
                                                                        <div className="relative">
                                                                            <input type="text" placeholder="Stage 3 Name" value={stage3Name} onChange={e => setStage3Name(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none focus:border-neon-cyan w-full" />
                                                                            {stage3Name && <button onClick={() => setStage3Name('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-neon-red transition-colors"><Trash2 className="w-3 h-3" /></button>}
                                                                        </div>
                                                                        <div className="relative">
                                                                            <input type="text" placeholder="YouTube ID" value={stage3} onChange={e => setStage3(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none focus:border-neon-cyan w-full" />
                                                                            {stage3 && <button onClick={() => setStage3('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-neon-red"><Trash2 className="w-3 h-3" /></button>}
                                                                        </div>
                                                                        <div className="relative">
                                                                            <input type="text" placeholder="Stage 4 Name" value={stage4Name} onChange={e => setStage4Name(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none focus:border-neon-cyan w-full" />
                                                                            {stage4Name && <button onClick={() => setStage4Name('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-neon-red transition-colors"><Trash2 className="w-3 h-3" /></button>}
                                                                        </div>
                                                                        <div className="relative">
                                                                            <input type="text" placeholder="YouTube ID" value={stage4} onChange={e => setStage4(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none focus:border-neon-cyan w-full" />
                                                                            {stage4 && <button onClick={() => setStage4('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-neon-red"><Trash2 className="w-3 h-3" /></button>}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <StyledCheckbox
                                                                    label="Flux supplémentaires"
                                                                    sublabel="Activer les sources 5 & 6"
                                                                    checked={!!settings.showExtraFlux}
                                                                    onChange={() => handleUpdateSettings({ showExtraFlux: !settings.showExtraFlux })}
                                                                    color="cyan"
                                                                />

                                                                {settings.showExtraFlux && (
                                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 overflow-hidden">
                                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Flux Bonus (5 & 6)</p>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <div className="relative">
                                                                                <input type="text" placeholder="Stage 5 Name" value={stage5Name} onChange={e => setStage5Name(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none focus:border-neon-cyan w-full" />
                                                                                {stage5Name && <button onClick={() => setStage5Name('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-neon-red transition-colors"><Trash2 className="w-3 h-3" /></button>}
                                                                            </div>
                                                                            <div className="relative">
                                                                                <input type="text" placeholder="YouTube ID" value={stage5} onChange={e => setStage5(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none focus:border-neon-cyan w-full" />
                                                                                {stage5 && <button onClick={() => setStage5('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-neon-red transition-colors"><Trash2 className="w-3 h-3" /></button>}
                                                                            </div>
                                                                            <div className="relative">
                                                                                <input type="text" placeholder="Stage 6 Name" value={stage6Name} onChange={e => setStage6Name(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none focus:border-neon-cyan w-full" />
                                                                                {stage6Name && <button onClick={() => setStage6Name('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-neon-red transition-colors"><Trash2 className="w-3 h-3" /></button>}
                                                                            </div>
                                                                            <div className="relative">
                                                                                <input type="text" placeholder="YouTube ID" value={stage6} onChange={e => setStage6(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none focus:border-neon-cyan w-full" />
                                                                                {stage6 && <button onClick={() => setStage6('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-neon-red"><Trash2 className="w-3 h-3" /></button>}
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                )}

                                                                <button
                                                                    onClick={() => handleUpdateSettings({
                                                                        stage1, stage2, stage3, stage4, stage5, stage6,
                                                                        stage1Name, stage2Name, stage3Name, stage4Name, stage5Name, stage6Name
                                                                    })}
                                                                    className="w-full py-2 bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all"
                                                                >
                                                                    Sauvegarder les Sources
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        {/* Bandeau Ticker */}
                                                        <div className="space-y-4 bg-white/5 border border-white/5 p-6 rounded-[2rem]">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-neon-red/10 rounded-xl">
                                                                    <Activity className="w-4 h-4 text-neon-red" />
                                                                </div>
                                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Gestion des <span className="text-neon-red">Bandeaux</span></h3>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                <StyledCheckbox
                                                                    label="Bandeau Titre"
                                                                    sublabel="Afficher le titre en haut"
                                                                    checked={!!showTopBanner}
                                                                    onChange={() => handleUpdateLocalSetting({ showTopBanner: !showTopBanner })}
                                                                    color="red"
                                                                />
                                                                <StyledCheckbox
                                                                    label="Bandeau Ticker"
                                                                    sublabel="Activer le texte défilant"
                                                                    checked={!!showTickerBanner}
                                                                    onChange={() => handleUpdateLocalSetting({ showTickerBanner: !showTickerBanner })}
                                                                    color="red"
                                                                />
                                                                <select value={tickerType} onChange={(e) => handleUpdateLocalSetting({ tickerType: e.target.value as any })} className="w-full bg-black/60 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none">
                                                                    <option value="news">Actualités</option>
                                                                    <option value="planning">Planning</option>
                                                                    <option value="custom">Texte Perso</option>
                                                                </select>
                                                                {tickerType === 'custom' && (
                                                                    <>
                                                                        <input type="text" value={tickerText} onChange={(e) => handleUpdateLocalSetting({ tickerText: e.target.value })} className="w-full bg-black/60 border border-white/10 rounded-xl p-2 text-[10px] text-white" placeholder="Message..." />
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <input type="color" value={tickerBgColor} onChange={(e) => handleUpdateLocalSetting({ tickerBgColor: e.target.value })} className="w-full h-8 bg-transparent border-none cursor-pointer" />
                                                                            <input type="color" value={tickerTextColor} onChange={(e) => handleUpdateLocalSetting({ tickerTextColor: e.target.value })} className="w-full h-8 bg-transparent border-none cursor-pointer" />
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Bandeau Annonce */}
                                                        <div className="space-y-4 bg-white/5 border border-white/5 p-6 rounded-[2rem]">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-neon-cyan/10 rounded-xl">
                                                                        <Globe className="w-4 h-4 text-neon-cyan" />
                                                                    </div>
                                                                    <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Bandeau <span className="text-neon-cyan">Annonces</span></h3>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <StyledCheckbox
                                                                    label="Activer les Annonces"
                                                                    checked={annBannerEnabled}
                                                                    onChange={() => setAnnBannerEnabled(!annBannerEnabled)}
                                                                    color="cyan"
                                                                />
                                                                <input type="text" value={annBannerText} onChange={(e) => setAnnBannerText(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none" placeholder="Texte de l'annonce..." />
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <input type="color" value={annBannerColor} onChange={(e) => setAnnBannerColor(e.target.value)} className="w-full h-8 bg-transparent border-none cursor-pointer" />
                                                                    <input type="color" value={annBannerBg} onChange={(e) => setAnnBannerBg(e.target.value)} className="w-full h-8 bg-transparent border-none cursor-pointer" />
                                                                </div>
                                                                <button onClick={handleSaveAnnouncementBanner} className="w-full py-2 bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all">Sauvegarder Bandeau</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeSettingsTab === 'points' && (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] space-y-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-neon-cyan/10 rounded-xl">
                                                                <Zap className="w-4 h-4 text-neon-cyan" />
                                                            </div>
                                                            <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Gestion des <span className="text-neon-cyan">Points (Drops)</span></h3>
                                                        </div>

                                                        <div className="space-y-6">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Points accordés</label>
                                                                        <span className="text-neon-cyan font-black text-xs">{localSettings.dropsAmount || 10} 💧</span>
                                                                    </div>
                                                                    <div className="p-4 bg-black/40 border border-white/10 rounded-2xl flex items-center gap-4">
                                                                        <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/20 rounded-xl">
                                                                            <Plus className="w-4 h-4 text-neon-cyan" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <input
                                                                                type="number"
                                                                                value={localSettings.dropsAmount || 10}
                                                                                onChange={(e) => handleUpdateLocalSetting({ dropsAmount: parseInt(e.target.value) || 0 })}
                                                                                className="w-full bg-transparent border-none text-sm font-black text-white outline-none"
                                                                                placeholder="10"
                                                                            />
                                                                            <p className="text-[8px] text-gray-600 font-bold uppercase mt-1">Nombre de Drops gagnés à chaque intervalle</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Intervalle de temps</label>
                                                                        <span className="text-neon-cyan font-black text-xs">{localSettings.dropsIntervalMinutes || 10} MIN</span>
                                                                    </div>
                                                                    <div className="p-4 bg-black/40 border border-white/10 rounded-2xl flex items-center gap-4">
                                                                        <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/20 rounded-xl">
                                                                            <Clock className="w-4 h-4 text-neon-cyan" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <input
                                                                                type="number"
                                                                                value={localSettings.dropsIntervalMinutes || 10}
                                                                                onChange={(e) => handleUpdateLocalSetting({ dropsIntervalMinutes: parseInt(e.target.value) || 0 })}
                                                                                className="w-full bg-transparent border-none text-sm font-black text-white outline-none"
                                                                                placeholder="10"
                                                                            />
                                                                            <p className="text-[8px] text-gray-600 font-bold uppercase mt-1">Minutes de visionnage requises</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 bg-neon-purple/10 border border-neon-purple/20 rounded-xl flex items-center justify-center">
                                                                        <Zap className="w-5 h-5 text-neon-purple" />
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="text-[11px] font-black text-white uppercase italic tracking-tighter">Paramètres Hype Energy</h3>
                                                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Configuration du mode Overdrive</p>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                                                    <div className="space-y-2">
                                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Hype Messages Per Minute</label>
                                                                        <div className="relative group">
                                                                            <input
                                                                                type="number"
                                                                                placeholder="Ex: 50"
                                                                                value={localSettings.hypeLimit || 50}
                                                                                onChange={(e) => handleUpdateLocalSetting({ hypeLimit: parseInt(e.target.value) || 50 })}
                                                                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:border-neon-purple transition-all"
                                                                            />
                                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-gray-600 uppercase">MSG/MIN</div>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleUpdateSettings({ hypeLimit: localSettings.hypeLimit })}
                                                                        className="h-11 px-6 bg-neon-purple/20 border border-neon-purple/30 text-neon-purple rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-neon-purple hover:text-white transition-all shadow-lg shadow-neon-purple/10"
                                                                    >
                                                                        Appliquer le seuil
                                                                    </button>
                                                                </div>
                                                                <p className="text-[8px] text-gray-600 font-bold uppercase leading-relaxed max-w-2xl">
                                                                    Définit combien de messages par minute sont nécessaires pour atteindre 100% de hype. Plus le seuil est bas, plus il est facile de déclencher l'Overdrive.
                                                                </p>
                                                            </div>

                                                            <div className="space-y-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-neon-purple/10 rounded-xl">
                                                                        <Trophy className="w-4 h-4 text-neon-purple" />
                                                                    </div>
                                                                    <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Gestion des <span className="text-neon-purple">Récompenses</span></h3>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                    {rewards.map((reward, i) => (
                                                                        <div key={reward.id} className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-3 group">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="p-2 bg-white/5 rounded-lg">
                                                                                    {reward.icon === 'Smile' ? <Smile className="w-4 h-4 text-neon-purple" /> :
                                                                                        reward.icon === 'MessageSquare' ? <MessageSquare className="w-4 h-4 text-neon-cyan" /> :
                                                                                            <Zap className="w-4 h-4 text-neon-red" />}
                                                                                </div>
                                                                                <button onClick={() => {
                                                                                    const newRewards = [...rewards];
                                                                                    newRewards.splice(i, 1);
                                                                                    setRewards(newRewards);
                                                                                }} className="text-gray-600 hover:text-neon-red transition-colors opacity-0 group-hover:opacity-100">
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>
                                                                            <div>
                                                                                <input
                                                                                    type="text"
                                                                                    value={reward.name}
                                                                                    onChange={(e) => {
                                                                                        const newRewards = [...rewards];
                                                                                        newRewards[i].name = e.target.value;
                                                                                        setRewards(newRewards);
                                                                                    }}
                                                                                    className="w-full bg-transparent border-none text-[11px] font-black text-white uppercase outline-none"
                                                                                />
                                                                                <input
                                                                                    type="text"
                                                                                    value={reward.description}
                                                                                    onChange={(e) => {
                                                                                        const newRewards = [...rewards];
                                                                                        newRewards[i].description = e.target.value;
                                                                                        setRewards(newRewards);
                                                                                    }}
                                                                                    className="w-full bg-transparent border-none text-[8px] font-bold text-gray-500 uppercase outline-none"
                                                                                />
                                                                            </div>
                                                                            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                                                                <input
                                                                                    type="number"
                                                                                    value={reward.cost}
                                                                                    onChange={(e) => {
                                                                                        const newRewards = [...rewards];
                                                                                        newRewards[i].cost = parseInt(e.target.value) || 0;
                                                                                        setRewards(newRewards);
                                                                                    }}
                                                                                    className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[9px] font-black text-neon-cyan outline-none"
                                                                                />
                                                                                <span className="text-[8px] font-black text-gray-600 uppercase">DROPS</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    <button onClick={() => setRewards([...rewards, { id: Math.random().toString(36).substr(2, 9), name: 'Nouveau', description: 'Description', cost: 100, icon: 'Zap' }])} className="p-4 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 hover:border-white/20 transition-all group">
                                                                        <Plus className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                                                                        <span className="text-[9px] font-black text-gray-500 group-hover:text-white uppercase tracking-widest">Ajouter</span>
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="p-4 bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl">
                                                                <div className="flex gap-3">
                                                                    <div className="shrink-0 mt-1">
                                                                        <HelpCircle className="w-4 h-4 text-neon-cyan" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-[10px] font-black text-white uppercase italic">Comment ça marche ?</p>
                                                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                                                                            Les spectateurs gagnent automatiquement <span className="text-neon-cyan">{localSettings.dropsAmount || 10} Drops</span> toutes les <span className="text-neon-cyan">{localSettings.dropsIntervalMinutes || 10} minutes</span> passées sur le live. Ces points peuvent être utilisés dans la boutique "Mes Drops" pour débloquer des avantages exclusifs.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Old video tab removed, merged into general */}

                                            {activeSettingsTab === 'moderation' && (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    {/* TOP ACTIONS BAR */}
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="p-5 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-neon-red/10 rounded-xl">
                                                                    <MessageSquare className="w-5 h-5 text-neon-red" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Chat Global</p>
                                                                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Vider l'historique</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={handleClearChat}
                                                                className="px-4 py-2 bg-neon-red text-white text-[9px] font-black uppercase rounded-xl hover:bg-neon-red/80 transition-all font-bold shadow-[0_0_15px_rgba(255,0,51,0.2)]"
                                                            >
                                                                Vider le Chat
                                                            </button>
                                                        </div>

                                                        <div className="p-5 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-yellow-500/10 rounded-xl">
                                                                    <Clock className="w-5 h-5 text-yellow-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Mode Lent</p>
                                                                    <div className="flex items-center gap-1 mt-0.5">
                                                                        <input
                                                                            type="number"
                                                                            value={slowModeDuration}
                                                                            onChange={e => setSlowModeDuration(parseInt(e.target.value) || 10)}
                                                                            className="w-10 bg-transparent text-[10px] font-black text-yellow-500 outline-none border-b border-yellow-500/30 text-center"
                                                                        />
                                                                        <span className="text-[8px] text-gray-500 font-bold uppercase">sec</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => setIsSlowMode(!isSlowMode)}
                                                                className={`w-14 h-7 rounded-full p-1 transition-all flex items-center ${isSlowMode ? 'bg-yellow-500 shadow-[0_0_15px_#eab30844] justify-end' : 'bg-gray-800 justify-start'}`}
                                                            >
                                                                <div className="w-5 h-5 rounded-full bg-white shadow-lg" />
                                                            </button>
                                                        </div>

                                                        <div className="p-5 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-neon-cyan/10 rounded-xl">
                                                                    <Globe className="w-5 h-5 text-neon-cyan" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Filtre de Liens</p>
                                                                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Sécurité Auto</p>
                                                                </div>
                                                            </div>
                                                            <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-[8px] font-black uppercase border border-green-500/20">ACTIF</span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                        <div className="space-y-6">
                                                            {/* GESTION ÉQUIPE */}
                                                            <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] space-y-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-neon-red/10 rounded-xl">
                                                                        <Shield className="w-4 h-4 text-neon-red" />
                                                                    </div>
                                                                    <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Équipe de <span className="text-neon-red">Modération</span></h3>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <div className="flex gap-2">
                                                                        <input
                                                                            type="text"
                                                                            id="add-mod-input"
                                                                            placeholder="Pseudo du modérateur..."
                                                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-neon-red transition-all font-bold placeholder:text-gray-600"
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    const input = e.currentTarget;
                                                                                    handleAddModerator(input.value);
                                                                                    input.value = '';
                                                                                }
                                                                            }}
                                                                        />
                                                                        <button
                                                                            onClick={() => {
                                                                                const input = document.getElementById('add-mod-input') as HTMLInputElement;
                                                                                handleAddModerator(input.value);
                                                                                if (input) input.value = '';
                                                                            }}
                                                                            className="px-6 py-2 bg-neon-red text-white text-[10px] font-black uppercase rounded-xl hover:bg-neon-red/80 transition-all shadow-[0_4px_15px_rgba(255,0,51,0.2)]"
                                                                        >
                                                                            Ajouter
                                                                        </button>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                                                        {localModerators?.split(',').filter(m => m.trim()).map(mod => (
                                                                            <div key={mod} className="flex items-center justify-between group rounded-xl p-3 bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className={`w-1.5 h-1.5 rounded-full ${isUserOnline(mod.trim()) ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-600'}`} />
                                                                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest truncate max-w-[100px]">{mod.trim()}</span>
                                                                                </div>
                                                                                <button
                                                                                    onClick={() => handleRemoveModerator(mod.trim())}
                                                                                    className="p-1.5 text-gray-600 hover:text-neon-red transition-colors"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                        {!localModerators?.trim() && <p className="col-span-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center py-4 italic">Aucun modérateur configuré</p>}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* RECOMMANDATIONS ET COULEURS ADMIN */}
                                                            <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] space-y-6">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-neon-red/10 rounded-xl">
                                                                            <Pencil className="w-4 h-4 text-neon-red" />
                                                                        </div>
                                                                        <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Apparence <span className="text-neon-red">Directeur</span></h3>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleUpdateSettings({
                                                                            adminColor: localSettings.adminColor,
                                                                            adminBgColor: localSettings.adminBgColor
                                                                        })}
                                                                        className="px-4 py-1.5 bg-neon-red text-white text-[10px] font-black uppercase rounded-lg hover:bg-neon-red/80 transition-all font-bold shadow-[0_0_15px_rgba(255,0,51,0.3)]"
                                                                    >
                                                                        VALIDER
                                                                    </button>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">Texte & Bordure</label>
                                                                        <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl p-3 focus-within:border-neon-red transition-all">
                                                                            <input type="color" value={localSettings.adminColor || adminColor} onChange={(e) => handleUpdateLocalSetting({ adminColor: e.target.value })} className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-lg" />
                                                                            <span className="text-xs font-black text-white uppercase tracking-tighter">{localSettings.adminColor || adminColor}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">Fond (Hex + Opacité)</label>
                                                                        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl p-3 focus-within:border-neon-red transition-all">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="rgba(255,0,0,0.1)"
                                                                                value={localSettings.adminBgColor || adminBgColor}
                                                                                onChange={(e) => handleUpdateLocalSetting({ adminBgColor: e.target.value })}
                                                                                className="bg-transparent border-none text-[11px] font-mono font-black text-white outline-none w-full"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-6">
                                                            {/* ANNONCE ÉPINGLÉE */}
                                                            <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-neon-cyan/10 rounded-xl">
                                                                            <Zap className="w-4 h-4 text-neon-cyan" />
                                                                        </div>
                                                                        <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Message <span className="text-neon-cyan">Épinglé</span></h3>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleUpdateSettings({ pinnedMessage: localPinnedMessage })}
                                                                        className="px-4 py-1.5 bg-neon-cyan text-black text-[10px] font-black uppercase rounded-lg hover:bg-neon-cyan/80 transition-all font-bold"
                                                                    >
                                                                        Mettre à jour
                                                                    </button>
                                                                </div>
                                                                <textarea
                                                                    value={localPinnedMessage}
                                                                    onChange={(e) => setLocalPinnedMessage(e.target.value)}
                                                                    placeholder="Écrire une annonce globale..."
                                                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-[11px] text-white focus:border-neon-cyan outline-none resize-none min-h-[100px] font-bold"
                                                                />
                                                                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center italic">Ce message apparaîtra en haut du chat pour tous les viewers.</p>
                                                            </div>

                                                            {/* GESTION SONDAGE */}
                                                            <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] space-y-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-neon-red/10 rounded-xl">
                                                                        <BarChart3 className="w-4 h-4 text-neon-red" />
                                                                    </div>
                                                                    <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Gestion <span className="text-neon-red">Sondage</span></h3>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Question</label>
                                                                        <input type="text" placeholder="Question du sondage..." value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white font-bold outline-none focus:border-neon-red placeholder:text-gray-700" />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            {pollOptions.map((opt, i) => (
                                                                                <div key={i} className="relative">
                                                                                    <input type="text" placeholder={`Option ${i + 1}`} value={opt} onChange={e => {
                                                                                        const newOpts = [...pollOptions];
                                                                                        newOpts[i] = e.target.value;
                                                                                        setPollOptions(newOpts);
                                                                                    }} className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-[10px] text-gray-300 outline-none focus:border-neon-red pr-10" />
                                                                                    {pollOptions.length > 2 && (
                                                                                        <button
                                                                                            onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                                                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-neon-red"
                                                                                        >
                                                                                            <X className="w-3 h-3" />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        {pollOptions.length < 6 && (
                                                                            <button
                                                                                onClick={() => setPollOptions([...pollOptions, ''])}
                                                                                className="w-full py-2 bg-white/5 border border-dashed border-white/10 rounded-xl text-[8px] font-black uppercase text-gray-500 hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-2"
                                                                            >
                                                                                <Plus className="w-3 h-3" /> Nouvelle Option
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Durée du sondage</label>
                                                                        <div className="flex gap-2">
                                                                            {['1', '3', '5'].map(d => (
                                                                                <button
                                                                                    key={d}
                                                                                    type="button"
                                                                                    onClick={() => setPollDuration(d)}
                                                                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black border transition-all ${pollDuration === d ? 'bg-neon-red border-neon-red text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}
                                                                                >
                                                                                    {d} MIN
                                                                                </button>
                                                                            ))}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setPollDuration('custom')}
                                                                                className={`flex-1 py-2 rounded-xl text-[10px] font-black border transition-all ${pollDuration === 'custom' ? 'bg-neon-red border-neon-red text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}
                                                                            >
                                                                                PERSO
                                                                            </button>
                                                                        </div>
                                                                        {pollDuration === 'custom' && (
                                                                            <div className="flex items-center gap-3 mt-2 bg-white/5 border border-white/10 rounded-xl p-2 animate-in fade-in slide-in-from-top-2">
                                                                                <input
                                                                                    type="number"
                                                                                    min="1"
                                                                                    max="60"
                                                                                    value={customPollDuration}
                                                                                    onChange={e => setCustomPollDuration(parseInt(e.target.value) || 1)}
                                                                                    className="flex-1 bg-transparent border-none text-white text-[10px] font-black outline-none px-2"
                                                                                />
                                                                                <span className="text-[9px] font-bold text-gray-500 uppercase pr-2">MINUTES</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                                                        <button onClick={handleStartPoll} className="py-3 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-2xl text-[10px] font-black uppercase hover:bg-neon-cyan hover:text-black transition-all shadow-lg shadow-neon-cyan/5">Lancer</button>
                                                                        {activePoll && (
                                                                            <button onClick={handleStopPoll} className="py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Terminer</button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white/5 border border-white/5 p-5 rounded-3xl space-y-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <label className="text-xs font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                                <MessageSquare className="w-4 h-4 text-neon-red shadow-[0_0_10px_#ff003366]" /> Liste des Commandes
                                                            </label>
                                                            <button
                                                                onClick={() => {
                                                                    setIsEditingCmd(null);
                                                                    setCmdTrigger('');
                                                                    setCmdResponse('');
                                                                    document.getElementById('cmd-input')?.focus();
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-neon-cyan text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-neon-cyan/80 transition-all"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" /> Ajouter
                                                            </button>
                                                        </div>
                                                        <div className="overflow-hidden border border-white/10 rounded-2xl">
                                                            <table className="w-full text-left border-collapse">
                                                                <thead>
                                                                    <tr className="bg-white/5">
                                                                        <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-white/10">Commande</th>
                                                                        <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-white/10">Description</th>
                                                                        <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-white/10 text-right">Statut</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="text-[10px] font-bold text-gray-300">
                                                                    <tr className="hover:bg-white/[0.02] transition-colors group">
                                                                        <td className="px-4 py-3 border-b border-white/5 text-neon-cyan font-black">!help</td>
                                                                        <td className="px-4 py-3 border-b border-white/5 text-xs">Liste des commandes</td>
                                                                        <td className="px-4 py-3 border-b border-white/5 text-right flex items-center justify-end px-4 h-[45px]">
                                                                            <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-[8px] uppercase">Système</span>
                                                                        </td>
                                                                    </tr>
                                                                    {/* Custom Commands List */}
                                                                    {(localCustomCommands || '').split('\n').filter(l => l.includes(':')).map((line, idx) => {
                                                                        const [trigger, ...rest] = line.split(':').map(s => s.trim());
                                                                        const response = rest.join(':');
                                                                        return (
                                                                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                                                                <td className="px-4 py-3 border-b border-white/5 text-neon-cyan font-black">{trigger}</td>
                                                                                <td className="px-4 py-3 border-b border-white/5 text-xs truncate max-w-[150px]">{response}</td>
                                                                                <td className="px-4 py-3 border-b border-white/5 text-right">
                                                                                    <div className="flex items-center justify-end gap-1">
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setCmdTrigger(trigger);
                                                                                                setCmdResponse(response);
                                                                                                setIsEditingCmd(trigger.toLowerCase());
                                                                                            }}
                                                                                            className="p-1 px-2 bg-white/5 hover:bg-neon-cyan/20 rounded text-neon-cyan transition-all"
                                                                                            title="Editer"
                                                                                        >
                                                                                            <Edit2 className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleDeleteCommand(trigger)}
                                                                                            className="p-1 px-2 bg-white/5 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-500 transition-all"
                                                                                            title="Supprimer"
                                                                                        >
                                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        {/* Add/Edit command form */}
                                                        <div className="bg-black/40 border border-white/5 p-4 rounded-2xl space-y-3">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{isEditingCmd ? 'MODIFIER LA COMMANDE' : 'AJOUTER UNE COMMANDE'}</label>
                                                                {isEditingCmd && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setIsEditingCmd(null);
                                                                            setCmdTrigger('');
                                                                            setCmdResponse('');
                                                                        }}
                                                                        className="text-[8px] font-black text-neon-red uppercase tracking-widest hover:underline"
                                                                    >
                                                                        Annuler
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                <div className="md:col-span-1">
                                                                    <div className="relative">
                                                                        <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neon-cyan" />
                                                                        <input
                                                                            id="cmd-input"
                                                                            type="text"
                                                                            value={cmdTrigger}
                                                                            onChange={e => setCmdTrigger(e.target.value)}
                                                                            placeholder="!ma-commande"
                                                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-8 pr-3 text-[11px] text-white focus:border-neon-cyan outline-none font-bold tabular-nums"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="md:col-span-2 flex gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={cmdResponse}
                                                                        onChange={e => setCmdResponse(e.target.value)}
                                                                        placeholder="Message du bot..."
                                                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-[11px] text-white focus:border-neon-cyan outline-none"
                                                                    />
                                                                    <button
                                                                        onClick={handleAddOrUpdateCommand}
                                                                        disabled={!cmdTrigger.trim() || !cmdResponse.trim()}
                                                                        className="px-4 bg-neon-cyan text-black rounded-xl font-black text-[10px] uppercase hover:bg-neon-cyan/80 transition-all disabled:opacity-30 flex items-center gap-1 shrink-0"
                                                                    >
                                                                        {isEditingCmd ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                                                        {isEditingCmd ? 'OK' : 'Ajouter'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center italic">Ces commandes sont utilisables par tous les membres du chat.</p>
                                                    </div>

                                                    {/* Apparence Bot */}
                                                    <div className="bg-white/5 border border-white/5 p-5 rounded-3xl space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-neon-cyan/10 rounded-xl">
                                                                <Pencil className="w-4 h-4 text-neon-cyan" />
                                                            </div>
                                                            <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Apparence <span className="text-neon-cyan">Bot</span></h3>
                                                        </div>
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Couleur Texte/Bordure</label>
                                                                <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-2 focus-within:border-neon-cyan transition-all">
                                                                    <input type="color" value={botColor} onChange={(e) => handleUpdateSettings({ botColor: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-md" />
                                                                    <span className="text-xs font-bold text-white uppercase">{botColor}</span>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Couleur de Fond</label>
                                                                <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-2 focus-within:border-neon-cyan transition-all">
                                                                    <div className="relative group/picker">
                                                                        <input
                                                                            type="color"
                                                                            value={botColor}
                                                                            onChange={(e) => {
                                                                                const hex = e.target.value;
                                                                                handleUpdateSettings({ botBgColor: `${hex}0d` }); // 0.05 opacity by default
                                                                            }}
                                                                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-md"
                                                                        />
                                                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[8px] text-white rounded opacity-0 group-hover/picker:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">Base pour le fond</div>
                                                                    </div>
                                                                    <div className="flex flex-1 items-center gap-2">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="ex: rgba(0, 255, 204, 0.05)"
                                                                            value={botBgColor}
                                                                            onChange={(e) => handleUpdateSettings({ botBgColor: e.target.value })}
                                                                            className="bg-transparent border-none text-[11px] font-mono font-bold text-white outline-none w-full"
                                                                        />
                                                                        <button
                                                                            onClick={() => alert(`Couleur Bot Validée : ${botBgColor}`)}
                                                                            className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[7px] font-black uppercase text-white hover:bg-neon-cyan hover:text-black transition-all whitespace-nowrap"
                                                                        >
                                                                            VALIDER
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Auto Message Management */}
                                                    <div className="bg-white/5 border border-white/5 p-5 rounded-3xl space-y-4">
                                                        <label className="text-xs font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                            <Zap className="w-4 h-4 text-neon-cyan shadow-[0_0_10px_#00ffff66]" /> Message Automatique (Bot)
                                                        </label>

                                                        <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Contenu du message</p>
                                                                <textarea
                                                                    value={settings.autoMessage || ''}
                                                                    onChange={(e) => handleUpdateSettings({ autoMessage: e.target.value })}
                                                                    placeholder="Message à envoyer automatiquement..."
                                                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-[11px] text-white focus:border-neon-cyan outline-none resize-none min-h-[80px]"
                                                                />
                                                            </div>

                                                            <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-2xl p-4">
                                                                <div>
                                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Intervalle (secondes)</p>
                                                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Temps entre chaque message automatique</p>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <input
                                                                        type="number"
                                                                        value={settings.autoMessageInterval || 60}
                                                                        onChange={(e) => handleUpdateSettings({ autoMessageInterval: parseInt(e.target.value) || 60 })}
                                                                        className="w-20 bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-center text-xs text-white font-black"
                                                                        min="10"
                                                                    />
                                                                    <Clock className="w-4 h-4 text-gray-500" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center italic">Le message s'enverra toutes les {settings.autoMessageInterval || 60} secondes si un contenu est défini.</p>
                                                    </div>
                                                </div>
                                            )}
                                            {activeSettingsTab === 'planning' && (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    <div className="bg-white/5 border border-white/5 p-5 rounded-3xl space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-xs font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                                <Pencil className="w-4 h-4 text-neon-red shadow-[0_0_10px_#ff003366]" /> Éditeur de Planning
                                                            </label>
                                                        </div>
                                                        <div className="grid grid-cols-12 gap-2">
                                                            <div className="col-span-3 flex flex-col gap-1">
                                                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest text-center mt-1">Début (HH:MM)</label>
                                                                <div className="flex gap-1">
                                                                    <input type="number" min="0" max="23" placeholder="HH" value={lineupHour} onChange={e => setLineupHour(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-[10px] text-white outline-none focus:border-neon-red font-bold uppercase transition-all text-center" />
                                                                    <span className="text-white font-bold flex flex-col justify-center">:</span>
                                                                    <input type="number" min="0" max="59" placeholder="MM" value={lineupMinute} onChange={e => setLineupMinute(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-[10px] text-white outline-none focus:border-neon-red font-bold uppercase transition-all text-center" />
                                                                </div>
                                                            </div>
                                                            <div className="col-span-3 flex flex-col gap-1">
                                                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest text-center mt-1">Fin (HH:MM)</label>
                                                                <div className="flex gap-1">
                                                                    <input type="number" min="0" max="23" placeholder="HH" value={lineupEndHour} onChange={e => setLineupEndHour(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-[10px] text-white outline-none focus:border-neon-red font-bold uppercase transition-all text-center" />
                                                                    <span className="text-white font-bold flex flex-col justify-center">:</span>
                                                                    <input type="number" min="0" max="59" placeholder="MM" value={lineupEndMinute} onChange={e => setLineupEndMinute(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-[10px] text-white outline-none focus:border-neon-red font-bold uppercase transition-all text-center" />
                                                                </div>
                                                            </div>
                                                            <div className="col-span-6 flex flex-col gap-1">
                                                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Nom de l'Artiste</label>
                                                                <input type="text" placeholder="Artiste" value={lineupArtist} onChange={e => setLineupArtist(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-neon-red font-bold uppercase transition-all" />
                                                            </div>

                                                            <div className="col-span-4 flex flex-col gap-1">
                                                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Flux / Scène</label>
                                                                <select value={lineupStage} onChange={e => setLineupStage(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-neon-red font-bold uppercase transition-all cursor-pointer">
                                                                    <option value="" disabled>Sélectionner</option>
                                                                    <option value="Flux Principal">Flux Principal</option>
                                                                    {stage1Name && <option value={stage1Name}>{stage1Name}</option>}
                                                                    {stage2Name && <option value={stage2Name}>{stage2Name}</option>}
                                                                    {stage3Name && <option value={stage3Name}>{stage3Name}</option>}
                                                                    {stage4Name && <option value={stage4Name}>{stage4Name}</option>}
                                                                </select>
                                                            </div>
                                                            <div className="col-span-5 flex flex-col gap-1">
                                                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Lien Instagram (Optionnel)</label>
                                                                <input type="text" placeholder="@insta" value={lineupInstagram} onChange={e => setLineupInstagram(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-neon-purple font-bold uppercase transition-all" />
                                                            </div>

                                                            <div className="col-span-3 flex flex-col gap-1 justify-end">
                                                                <button onClick={appendLineup} className="w-full py-2 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-xl text-[10px] font-black uppercase hover:bg-neon-cyan hover:text-black transition-all">Ajouter</button>
                                                            </div>
                                                        </div>

                                                        {/* Planning visual table */}
                                                        {editLineup.trim() && (
                                                            <div className="overflow-hidden border border-white/10 rounded-2xl">
                                                                <table className="w-full text-left border-collapse">
                                                                    <thead>
                                                                        <tr className="bg-white/5">
                                                                            <th className="px-4 py-2.5 text-[8px] font-black text-neon-red uppercase tracking-[0.2em] border-b border-white/10">Heure</th>
                                                                            <th className="px-4 py-2.5 text-[8px] font-black text-neon-red uppercase tracking-[0.2em] border-b border-white/10">Artiste</th>
                                                                            <th className="px-4 py-2.5 text-[8px] font-black text-neon-red uppercase tracking-[0.2em] border-b border-white/10">Stage</th>
                                                                            <th className="px-4 py-2.5 text-[8px] font-black text-neon-red uppercase tracking-[0.2em] border-b border-white/10">Instagram</th>
                                                                            <th className="px-4 py-2.5 border-b border-white/10"></th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {(() => {
                                                                            const lines = editLineup.split('\n').filter(l => l.trim());

                                                                            const moveLine = (index: number, direction: 'up' | 'down') => {
                                                                                const newLines = [...lines];
                                                                                if (direction === 'up' && index > 0) {
                                                                                    [newLines[index], newLines[index - 1]] = [newLines[index - 1], newLines[index]];
                                                                                } else if (direction === 'down' && index < newLines.length - 1) {
                                                                                    [newLines[index], newLines[index + 1]] = [newLines[index + 1], newLines[index]];
                                                                                }
                                                                                setEditLineup(newLines.join('\n'));
                                                                            };

                                                                            return lines.map((line, idx) => {
                                                                                const deleteLine = () => {
                                                                                    const lines = editLineup.split('\n').filter(l => l.trim());
                                                                                    lines.splice(idx, 1);
                                                                                    setEditLineup(lines.join('\n'));
                                                                                };

                                                                                const timeMatch = line.includes('|') ? line.split('|')[0] : line.match(/^\[(.*?)\]/)?.[1];
                                                                                if (!timeMatch) return (
                                                                                    <tr key={idx} className="hover:bg-white/[0.02] group transition-colors">
                                                                                        <td colSpan={4} className="px-4 py-2 border-b border-white/5 text-[9px] text-red-400 italic font-bold">⚠️ Format incorrect: {line}</td>
                                                                                        <td className="px-4 py-2 border-b border-white/5 text-right">
                                                                                            <button onClick={deleteLine} className="p-1 opacity-100 md:opacity-0 group-hover:opacity-100 hover:bg-neon-red/10 rounded text-gray-500 hover:text-neon-red transition-all" title="Supprimer">
                                                                                                <X className="w-3.5 h-3.5" />
                                                                                            </button>
                                                                                        </td>
                                                                                    </tr>
                                                                                );

                                                                                const time = timeMatch.trim();
                                                                                const rest = line.includes('|') ? line.substring(line.indexOf('|') + 1).trim() : line.replace(/^\[(.*?)\]/, '').trim();
                                                                                const parts = rest.includes('|') ? rest.split('|').map(p => p.trim()) : rest.split(/\s*[\-\|\–\—]\s*/).map(p => p.trim());
                                                                                const artist = parts[0] || '';
                                                                                const stage = parts[1] || '';
                                                                                // Direct 3rd part is Instagram now
                                                                                const instagram = parts[2] || '';

                                                                                const editOption = () => {
                                                                                    const [h, m] = time.replace('h', ':').split(':');
                                                                                    setLineupHour(h || '');
                                                                                    setLineupMinute(m || '');
                                                                                    setLineupArtist(artist.trim());

                                                                                    // On essaye de matcher le stage avec les options existantes
                                                                                    const lowerStage = stage.trim().toLowerCase();
                                                                                    if (lowerStage === 'flux principal') setLineupStage('Flux Principal');
                                                                                    else if (lowerStage === (stage1Name?.toLowerCase() || '')) setLineupStage(stage1Name);
                                                                                    else if (lowerStage === (stage2Name?.toLowerCase() || '')) setLineupStage(stage2Name);
                                                                                    else if (lowerStage === (stage3Name?.toLowerCase() || '')) setLineupStage(stage3Name);
                                                                                    else if (lowerStage === (stage4Name?.toLowerCase() || '')) setLineupStage(stage4Name);
                                                                                    else setLineupStage(stage.trim());

                                                                                    setLineupInstagram(instagram.trim());
                                                                                    deleteLine();
                                                                                };

                                                                                const getStageColor = (stageName: string) => {
                                                                                    const s = stageName.toLowerCase();
                                                                                    if (s.includes('principal') || s.includes('main')) return 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10';
                                                                                    if (s.includes('1')) return 'text-neon-purple border-neon-purple/30 bg-neon-purple/10';
                                                                                    if (s.includes('2')) return 'text-neon-red border-neon-red/30 bg-neon-red/10';
                                                                                    if (s.includes('3')) return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
                                                                                    return 'text-gray-400 border-white/20 bg-white/5';
                                                                                };

                                                                                return (
                                                                                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                                                                        <td className="px-4 py-2.5 border-b border-white/5 text-neon-cyan font-black text-[10px]">{time}</td>
                                                                                        <td className="px-4 py-2.5 border-b border-white/5 text-white font-bold text-[10px] uppercase truncate max-w-[150px]">{artist}</td>
                                                                                        <td className="px-4 py-2.5 border-b border-white/5">
                                                                                            {stage && <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getStageColor(stage)}`}>{stage}</span>}
                                                                                        </td>
                                                                                        <td className="px-4 py-2.5 border-b border-white/5">
                                                                                            {instagram && (
                                                                                                (instagram.includes('.') || (!instagram.includes(' ') && instagram.length > 0))
                                                                                                    ? <a href={instagram.startsWith('http') ? instagram : `https://${instagram}`} target="_blank" rel="noopener noreferrer" className="text-[9px] text-neon-purple hover:underline font-bold uppercase truncate block max-w-[120px]">{instagram.replace(/^https?:\/\//, '')}</a>
                                                                                                    : <span className="text-[9px] text-gray-400 font-bold uppercase truncate block max-w-[120px]">{instagram}</span>
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="px-4 py-2.5 border-b border-white/5 text-right space-x-1">
                                                                                            <button onClick={() => moveLine(idx, 'up')} disabled={idx === 0} className="p-1 text-gray-400 hover:text-neon-cyan transition-all disabled:opacity-20" title="Monter">
                                                                                                <ChevronUp className="w-3.5 h-3.5" />
                                                                                            </button>
                                                                                            <button onClick={() => moveLine(idx, 'down')} disabled={idx === lines.length - 1} className="p-1 text-gray-400 hover:text-neon-cyan transition-all disabled:opacity-20" title="Descendre">
                                                                                                <ChevronDown className="w-3.5 h-3.5" />
                                                                                            </button>
                                                                                            <button onClick={editOption} className="p-1 opacity-100 md:opacity-0 group-hover:opacity-100 hover:bg-neon-cyan/10 rounded text-gray-500 hover:text-neon-cyan transition-all ml-1" title="Éditer">
                                                                                                <Edit2 className="w-3.5 h-3.5" />
                                                                                            </button>
                                                                                            <button onClick={deleteLine} className="p-1 opacity-100 md:opacity-0 group-hover:opacity-100 hover:bg-neon-red/10 rounded text-gray-500 hover:text-neon-red transition-all" title="Supprimer">
                                                                                                <X className="w-3.5 h-3.5" />
                                                                                            </button>
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })
                                                                        })()}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}

                                                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center italic">Un artiste par ligne • Format: [HH:MM - HH:MM] Artiste - Stage - Instagram</p>
                                                    </div>
                                                </div>
                                            )}






                                            {activeSettingsTab === 'shop' && (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] space-y-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-neon-cyan/10 rounded-xl">
                                                                <Zap className="w-4 h-4 text-neon-cyan" />
                                                            </div>
                                                            <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Sélection <span className="text-neon-cyan">Shop</span></h3>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Choisissez 10 à 15 objets à mettre en avant :</p>

                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                                {allShopProducts.map(product => {
                                                                    const isSelected = selectedShopIds.includes(String(product.id));
                                                                    return (
                                                                        <button
                                                                            key={product.id}
                                                                            onClick={() => {
                                                                                if (isSelected) {
                                                                                    setSelectedShopIds(selectedShopIds.filter(id => id !== String(product.id)));
                                                                                } else {
                                                                                    if (selectedShopIds.length >= 15) return alert("Maximum 15 objets.");
                                                                                    setSelectedShopIds([...selectedShopIds, String(product.id)]);
                                                                                }
                                                                            }}
                                                                            className={`p-3 rounded-xl border text-[9px] font-black uppercase text-left transition-all flex flex-col gap-1 ${isSelected ? 'bg-neon-cyan/20 border-neon-cyan text-white' : 'bg-black/40 border-white/10 text-gray-500 hover:border-white/20'}`}
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-8 h-8 rounded-lg bg-white/10 shrink-0 overflow-hidden">
                                                                                    {product.image && <img src={product.image} className="w-full h-full object-cover" />}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="truncate">{product.name}</p>
                                                                                    <p className={`${isSelected ? 'text-neon-cyan' : 'text-gray-600'}`}>{product.price}€</p>
                                                                                </div>
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>

                                                            <div className="flex justify-between items-center p-4 bg-black/60 rounded-2xl border border-white/5">
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Objets sélectionnés : {selectedShopIds.length} / 15</span>
                                                                <button
                                                                    onClick={() => setSelectedShopIds([])}
                                                                    className="text-[9px] font-black text-neon-red uppercase hover:underline"
                                                                >
                                                                    Tout vider
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-6 grid grid-cols-2 gap-4 border-t border-white/10 mt-auto shrink-0">
                                            <button
                                                onClick={async () => {
                                                    const extractYoutubeId = (url: string) => {
                                                        if (!url) return '';
                                                        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
                                                        return match ? match[1] : url.trim();
                                                    };

                                                    const fId = extractYoutubeId(fluxPrincipal);
                                                    const s1Id = extractYoutubeId(stage1);
                                                    const s2Id = extractYoutubeId(stage2);
                                                    const s3Id = extractYoutubeId(stage3);
                                                    const s4Id = extractYoutubeId(stage4);

                                                    const newChannels = [];
                                                    if (s1Id) newChannels.push(`${s1Id}:${stage1Name || 'Stage 1'}`);
                                                    if (s2Id) newChannels.push(`${s2Id}:${stage2Name || 'Stage 2'}`);
                                                    if (s3Id) newChannels.push(`${s3Id}:${stage3Name || 'Stage 3'}`);
                                                    if (s4Id) newChannels.push(`${s4Id}:${stage4Name || 'Stage 4'}`);

                                                    await handleUpdateSettings({
                                                        ...localSettings,
                                                        title: editTitle,
                                                        mainFluxName: editMainFluxName,
                                                        lineup: editLineup,
                                                        youtubeId: fId,
                                                        channels: newChannels.join('\n'),
                                                        shopItems: selectedShopIds.join(','),
                                                        chat_enabled: true,
                                                        pinnedMessage: localPinnedMessage,
                                                        customCommands: localCustomCommands,
                                                        moderators: localModerators
                                                    });
                                                    setShowEditModal(false);
                                                }}
                                                disabled={isSaving}
                                                className="py-4 bg-neon-red text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-neon-red/80 transition-all shadow-xl shadow-neon-red/10 active:scale-[0.98] disabled:opacity-50"
                                            >
                                                {isSaving ? 'ENREGISTREMENT...' : 'SAUVEGARDER'}
                                            </button>
                                            <button
                                                onClick={() => setShowEditModal(false)}
                                                className="py-4 bg-white/5 border border-white/5 text-gray-500 hover:text-neon-red text-[10px] font-black uppercase tracking-[0.3em] rounded-xl transition-all"
                                            >
                                                ANNULER
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence >
                    </div >

                    {/* Chat Section */}
                    <div className="flex-1 lg:w-[700px] lg:flex-none bg-[#080808] flex flex-col min-h-0 lg:h-full relative z-[150] border-t lg:border-t-0 lg:border-l border-white/15 pointer-events-auto shadow-[-30px_0_60_rgba(0,0,0,0.6)]" >
                        {/* MULTIVUE - hidden on mobile, visible on desktop */}
                        {channelItems.length >= 2 && !isFocusMode && (
                            <div className="hidden lg:block p-3 border-b border-white/10 bg-black/40 shrink-0 z-30">
                                <button
                                    onClick={() => setPlayersOption(playersOption === 4 ? 1 : 4)}
                                    className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 active:scale-95 ${playersOption === 4 ? 'bg-neon-purple text-white shadow-[0_0_25px_rgba(189,0,255,0.4)] border border-neon-purple/50' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10 hover:border-white-20'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                    MULTIVUE
                                </button>
                            </div>
                        )}
                        {/* Glossy Header */}
                        {
                            !isFocusMode && (
                                <div className="p-1 md:p-2 border-b border-white/10 flex items-center justify-between bg-white/[0.02] backdrop-blur-xl relative z-20 shrink-0">
                                    <div className="flex-1 flex items-center gap-1.5 md:gap-2">
                                        {/* Back Button for mobile users */}
                                        <button
                                            onClick={() => {
                                                if (activeChatTab !== 'chat') {
                                                    setActiveChatTab('chat');
                                                } else {
                                                    navigate('/');
                                                }
                                            }}
                                            className="lg:hidden p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all mr-1 md:mr-2"
                                            title={activeChatTab !== 'chat' ? "Retour au Chat" : "Retour à l'accueil"}
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5" />
                                        </button>
                                        <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg md:rounded-xl bg-neon-red/10 border border-neon-red/20 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,51,0.2)]">
                                            <MessageSquare className="w-2.5 h-2.5 text-neon-red" />
                                        </div>
                                        <div className="flex flex-col">
                                            <h2 className="text-[1.5px] md:text-[10px] lg:text-xs font-black text-white uppercase italic tracking-tighter leading-none flex items-center gap-1 md:gap-2">
                                                {activeChatTab === 'chat' ? 'Chat' : activeChatTab === 'shop' ? 'Shop' : activeChatTab === 'drops-shop' ? 'Drops' : activeChatTab === 'shazam' ? 'Shazam' : activeChatTab === 'audio' ? 'Audio' : activeChatTab === 'leaderboard' ? 'Top' : 'Clips'}
                                                {isSlowMode && <span className="px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-500 text-[5px] md:text-[7px] font-black uppercase flex items-center gap-1 border border-yellow-500/30">LENT</span>}
                                            </h2>
                                            {/* Hype Energy Mini Gauge */}
                                            <div
                                                className="hidden lg:block w-16 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5 mt-1 cursor-pointer hover:border-white/20 transition-all"
                                                onClick={() => setActiveChatTab('shazam')}
                                                title="Voir Shazam"
                                            >
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan"
                                                    animate={{ width: `${hypeLevel}%` }}
                                                    transition={{ type: "spring", stiffness: 50 }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile Mod Menu Button */}
                                    {hasModPowers && (
                                        <div className="lg:hidden flex items-center gap-2">
                                            <button
                                                onClick={() => setShowMobileModMenu(!showMobileModMenu)}
                                                className={`p-1.5 rounded-lg border transition-all ${showMobileModMenu ? 'bg-neon-red text-white border-neon-red shadow-[0_0_15px_rgba(255,18,65,0.4)]' : 'bg-white/5 text-gray-400 border-white/10'}`}
                                            >
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Mobile Mod Menu Drawer */}
                                    <AnimatePresence>
                                        {showMobileModMenu && hasModPowers && (
                                            <>
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    onClick={() => setShowMobileModMenu(false)}
                                                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] lg:hidden"
                                                />
                                                <motion.div
                                                    initial={{ y: "100%" }}
                                                    animate={{ y: 0 }}
                                                    exit={{ y: "100%" }}
                                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                                    className="fixed bottom-0 left-0 right-0 bg-[#0d0d0d] border-t border-white/10 rounded-t-[2.5rem] p-6 z-[210] lg:hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
                                                >
                                                    <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
                                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3 italic">
                                                        <Shield className="w-4 h-4 text-neon-red" /> Modération
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <button onClick={() => { handleClearChat(); setShowMobileModMenu(false); }} className="flex flex-col items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-neon-red/10 hover:border-neon-red/30 transition-all">
                                                            <Trash2 className="w-5 h-5 text-neon-red" />
                                                            <span className="text-[9px] font-black uppercase text-gray-400">Vider Chat</span>
                                                        </button>
                                                        <button onClick={() => { setShowSlowModePopup(!showSlowModePopup); setShowMobileModMenu(false); }} className={`flex flex-col items-center gap-3 p-4 border rounded-2xl transition-all ${isSlowMode ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/10'}`}>
                                                            <Clock className={`w-5 h-5 ${isSlowMode ? 'text-yellow-500' : 'text-gray-400'}`} />
                                                            <span className="text-[9px] font-black uppercase text-gray-400">Mode Lent</span>
                                                        </button>
                                                        <button onClick={() => { handleUpdateSettings({ showShop: !showShopWidget }); setShowMobileModMenu(false); }} className={`flex flex-col items-center gap-3 p-4 border rounded-2xl transition-all ${showShopWidget ? 'bg-neon-cyan/10 border-neon-cyan/30' : 'bg-white/5 border-white/10'}`}>
                                                            <Zap className={`w-5 h-5 ${showShopWidget ? 'text-neon-cyan' : 'text-gray-400'}`} />
                                                            <span className="text-[9px] font-black uppercase text-gray-400">Shop On/Off</span>
                                                        </button>
                                                        <button onClick={() => { setShowEditModal(true); setShowMobileModMenu(false); }} className="flex flex-col items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                                                            <Shield className="w-5 h-5 text-neon-purple" />
                                                            <span className="text-[9px] font-black uppercase text-gray-400">Admin</span>
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>

                                    {/* MES DROPS - CENTERED */}
                                    <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <button
                                            onClick={() => setActiveChatTab(activeChatTab === 'drops-shop' ? 'chat' : 'drops-shop')}
                                            className={`flex items-center gap-2 px-1.5 py-0.5 rounded-full transition-all group shadow-lg ${activeChatTab === 'drops-shop' ? 'bg-neon-purple text-white' : 'bg-neon-purple/10 border border-neon-purple/20 shadow-neon-purple/5'}`}
                                        >
                                            <span className="text-[8px] font-black text-white uppercase tracking-widest">{userDrops} <span className="text-neon-purple">Drops</span></span>
                                            <div className="w-3.5 h-3.5 bg-neon-purple rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(147,51,234,0.3)]">
                                                <Zap className="w-2 h-2 text-white fill-current" />
                                            </div>
                                        </button>
                                    </div>

                                    <div className="hidden lg:flex flex-1 items-center justify-end gap-2">
                                        {hasModPowers && (
                                            <>
                                                <button
                                                    onClick={handleClearChat}
                                                    className="p-2 rounded-lg bg-neon-red/10 text-neon-red border border-neon-red/20 hover:bg-neon-red hover:text-white transition-all shadow-[0_0_10px_rgba(255,18,65,0.2)]"
                                                    title="Vider le chat"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateSettings({ showShop: !showShopWidget })}
                                                    className={`p-2 rounded-lg transition-all ${showShopWidget ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}
                                                    title="Shop (Global)"
                                                >
                                                    <Zap className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setShowSlowModePopup(!showSlowModePopup)}
                                                    className={`p-2 rounded-lg transition-all relative ${showSlowModePopup || isSlowMode ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}
                                                    title="Mode Lent"
                                                >
                                                    <Clock className="w-3.5 h-3.5" />
                                                </button>
                                                {activePoll && (
                                                    <button
                                                        onClick={handleStopPoll}
                                                        className="p-2 rounded-lg bg-neon-red/20 text-white border border-neon-red/40 hover:bg-neon-red hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,0,51,0.4)] animate-pulse"
                                                        title="Arrêter le sondage"
                                                    >
                                                        <CircleStop className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                                                <select
                                                    value={chatCountryFilter}
                                                    onChange={(e) => setChatCountryFilter(e.target.value)}
                                                    className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[9px] font-black text-white outline-none focus:border-neon-cyan transition-all appearance-none cursor-pointer hover:bg-white/5"
                                                >
                                                    <option value="ALL">🌐 FILTRE</option>
                                                    <option value="FR">🇫🇷 FR</option>
                                                    <option value="BE">🇧🇪 BE</option>
                                                    <option value="CH">🇨🇭 CH</option>
                                                    <option value="CA">🇨🇦 CA</option>
                                                    <option value="OTHER">🌍 AUTRE</option>
                                                </select>
                                                <button
                                                    id="admin-edit-btn"
                                                    onClick={() => setShowEditModal(!showEditModal)}
                                                    className="p-2 bg-neon-red/10 hover:bg-neon-red border border-neon-red/20 hover:border-neon-red text-neon-red hover:text-white rounded-lg transition-all shadow-[0_0_15px_rgba(255,0,51,0.2)]"
                                                    title="Administration"
                                                >
                                                    <Shield className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    {showSlowModePopup && (
                                        <div className="absolute top-16 right-4 w-60 bg-[#111] border border-white/10 rounded-2xl p-4 shadow-2xl z-[200]">
                                            <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-yellow-500" /> Mode Lent
                                            </h3>
                                            <input
                                                type="number"
                                                value={slowModeDuration}
                                                onChange={e => setSlowModeDuration(Math.max(1, parseInt(e.target.value) || 2))}
                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-black outline-none focus:border-yellow-500 mb-4"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={() => { setIsSlowMode(true); setShowSlowModePopup(false); }} className="flex-1 py-2.5 bg-yellow-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Activer</button>
                                                <button onClick={() => setShowSlowModePopup(false)} className="px-4 py-2.5 bg-white/5 text-gray-400 rounded-xl text-[10px] font-black uppercase border border-white/5">X</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        }

                        {/* Poll Overlay - Top Center of Chat */}
                        <AnimatePresence>
                            {!isFocusMode && activePoll && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[320px] bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-neon-cyan to-neon-red animate-pulse" />
                                    <h3 className="text-[10px] font-black text-white uppercase italic tracking-widest mb-3 flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-neon-red animate-pulse" />
                                            Sondage En Cours
                                        </span>
                                        {hasModPowers && <button onClick={handleStopPoll} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-neon-red/10 text-neon-red hover:bg-neon-red hover:text-white transition-all text-[8px] font-black border border-neon-red/20"><CircleStop className="w-2.5 h-2.5" /> ARRÊTER</button>}
                                    </h3>
                                    <p className="text-[11px] font-bold text-white mb-4 drop-shadow-sm">{activePoll.question}</p>
                                    <div className="space-y-2">
                                        {activePoll.options.map((opt, i) => {
                                            const pollTakers = messages.filter(m => /^[1-9][0-9]*$/.test(m.message.trim()));
                                            const uniquePollTakers = pollTakers.filter((v, i, a) => a.findIndex(t => (t.pseudo === v.pseudo)) === i);
                                            const totalVotes = uniquePollTakers.length;
                                            const optVotes = uniquePollTakers.filter(m => m.message.trim() === String(i + 1)).length;
                                            const percentage = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={async () => {
                                                        if (!isJoined) return alert("Rejoignez le chat pour voter !");
                                                        const pollId = String((activePoll as any).id);
                                                        if (votedPollIds.includes(pollId)) return alert("Déjà voté !");

                                                        setVotedPollIds(prev => [...prev, pollId]);
                                                        await fetch('/api/chat/messages', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                pseudo: pseudo.toUpperCase(),
                                                                country: country || 'FR',
                                                                message: String(i + 1),
                                                                color: userColor,
                                                                channel: currentVideoId
                                                            })
                                                        });
                                                    }}
                                                    className="w-full relative h-10 group/vote bg-white/5 hover:bg-white/10 rounded-xl overflow-hidden flex items-center px-4 border border-white/5 hover:border-neon-red/30 transition-all duration-300"
                                                >
                                                    <motion.div
                                                        className="absolute left-0 top-0 bottom-0 bg-neon-red/20"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                                    />
                                                    <span className="relative z-10 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                                                        <span className="w-5 h-5 flex items-center justify-center bg-black/40 rounded-md text-gray-400 group-hover/vote:text-neon-red transition-colors font-mono">{i + 1}</span>
                                                        {opt}
                                                    </span>
                                                    <span className="relative z-10 text-[11px] font-black text-neon-red ml-auto drop-shadow-[0_0_8px_rgba(255,0,51,0.6)] font-mono">{percentage}%</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <p className="text-[7px] text-gray-500 uppercase tracking-[0.2em] mt-3 text-center border-t border-white/5 pt-2">Tapez le chiffre dans le chat ou cliquez</p>
                                </motion.div>
                            )}

                            {/* Winning Result Overlay */}
                            {!isFocusMode && lastPollResult && !activePoll && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, y: -20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                    className="absolute top-12 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[280px] bg-[#000]/90 backdrop-blur-3xl border border-neon-cyan/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(0,255,255,0.4)] text-center overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/10 via-transparent to-transparent pointer-events-none" />
                                    <div className="absolute -top-10 -left-10 w-24 h-24 bg-neon-cyan/20 blur-3xl rounded-full animate-pulse" />
                                    <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-neon-cyan/20 blur-3xl rounded-full animate-pulse" />

                                    <Trophy className="w-8 h-8 text-neon-cyan mx-auto mb-4 drop-shadow-[0_0_15px_#00ffff]" />
                                    <h3 className="text-[10px] font-black text-neon-cyan uppercase tracking-[0.4em] mb-2 drop-shadow-[0_0_10px_#00ffff]">VAINQUEUR</h3>
                                    <p className="text-[9px] text-gray-500 uppercase mb-4 px-2 font-black italic tracking-wider leading-tight">{lastPollResult.question}</p>

                                    <div className="relative inline-block py-2 px-6">
                                        <div className="absolute inset-0 blur-2xl bg-neon-cyan/40 animate-pulse" />
                                        <h4 className="relative text-2xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_20px_#fff]">
                                            {lastPollResult.winner}
                                        </h4>
                                    </div>

                                    <div className="mt-5 text-[12px] font-black text-neon-cyan font-mono tracking-widest bg-neon-cyan/10 py-1.5 rounded-xl border border-neon-cyan/20">
                                        {lastPollResult.percentage}% DES VOIX
                                    </div>

                                    <motion.div
                                        className="mt-4 h-[2px] bg-neon-cyan rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Shop Widget Overhead */}
                        <AnimatePresence>
                            {!isFocusMode && showShopWidget && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-black/80 border-b border-white/10 overflow-hidden relative z-40"
                                >
                                    <div className="relative group px-1">
                                        <div className="absolute top-2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />
                                        <div className="w-full overflow-hidden relative py-1 md:py-2 mb-0.5 md:mb-1">
                                            <div className="flex flex-row gap-2 md:gap-3 animate-shop-scroll">
                                                {(showShopWidget && shopProducts.length > 0 ? [...shopProducts, ...shopProducts, ...shopProducts] : []).map((product, i) => (
                                                    <a
                                                        key={`${product.id}-${i}`}
                                                        href={product.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 md:gap-3 p-1 md:p-1.5 pr-3 md:pr-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-neon-cyan/30 rounded-lg md:rounded-xl transition-all group/item active:scale-95 shrink-0"
                                                    >
                                                        <div className="w-8 h-8 md:w-12 md:h-12 shrink-0 rounded-md md:rounded-lg overflow-hidden relative shadow-lg">
                                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-0.5 text-center">
                                                                <span className="text-[6px] md:text-[7.5px] font-black text-white">{product.price}€</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col justify-center max-w-[100px] md:max-w-[120px]">
                                                            <p className="text-[8px] md:text-[9px] font-black text-white uppercase tracking-widest leading-none truncate">{product.name}</p>
                                                            <p className="text-[6.5px] md:text-[7.5px] text-gray-500 uppercase tracking-widest mt-0.5 md:mt-1 truncate opacity-60 font-bold">{product.description}</p>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Chat Content and Sidebar Wrapper */}
                        <div className={`flex-1 w-full lg:w-auto lg:flex-1 flex flex-row min-h-0 overflow-hidden relative ${(settings.isOnline || isServerAdmin) ? '' : 'hidden'}`}>
                            <div className="flex-1 flex flex-col min-h-0 relative">
                                {isLocalBanned ? (
                                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-black/40">
                                        <div className="w-24 h-24 bg-neon-red/10 border border-neon-red/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(255,0,0,0.15)]">
                                            <ShieldAlert className="w-12 h-12 text-neon-red" />
                                        </div>
                                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-4">Accès restreint</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed mb-8">
                                            Vous avez été banni du chat communautaire.
                                        </p>
                                        <button
                                            onClick={handleUnbanRequest}
                                            className="px-10 py-4 bg-neon-red text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-neon-red/80 transition-all shadow-xl shadow-neon-red/20"
                                        >
                                            Demande de débannissement
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
                                        {/* FLUX SELECTION - PERSISTENT AT TOP OF SIDEBAR */}
                                        <div className="px-0 md:px-4 pt-0 md:pt-4 pb-0 shrink-0 z-[60]">
                                            <div className="flex items-center gap-0 bg-black/40 md:bg-white/5 border-b border-white/10 p-0 md:p-1 overflow-x-auto no-scrollbar">
                                                {channelItems.map((item: any, idx) => {
                                                    const isDisabled = settings.disableMainPlayer !== false;
                                                    if (item.isMain && isDisabled && playersOption === 1) return null;
                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={() => {
                                                                if (activeVideoIndex === idx && playersOption === 1) return;
                                                                setActiveVideoIndex(idx);
                                                                setPlayersOption(1);
                                                            }}
                                                            className={`px-2 md:px-3 py-1.5 md:py-2 rounded-sm md:rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-none min-w-[50px] md:min-w-[70px] leading-none ${activeVideoIndex === idx && playersOption === 1 ? 'bg-neon-red text-white shadow-[0_0_10px_rgba(255,0,51,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                                        >
                                                            {item.title}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Tab Switcher - Persistent at Top */}
                                        <div className="flex items-center gap-0.5 md:gap-1 p-0 md:p-1 bg-white/[0.02] border border-white/10 rounded-md md:rounded-xl mb-0 mx-1 md:mx-4 mt-0.5 md:mt-3 relative z-20 shrink-0 overflow-x-auto no-scrollbar">
                                            {[
                                                { id: 'chat', icon: MessageSquare, label: 'Chat', mobileVisible: true },
                                                { id: 'shazam', icon: Headphones, label: 'Shz', mobileVisible: true },
                                                { id: 'audio', icon: Mic, label: 'Aud', mobileVisible: true },
                                                { id: 'shop', icon: ShoppingBag, label: 'Shop', mobileVisible: true },
                                                { id: 'leaderboard', icon: Trophy, label: 'Top', mobileVisible: true },
                                                { id: 'clips', icon: Video, label: 'Clips', mobileVisible: true },
                                                ...(activeChatTab === 'drops-shop' ? [{ id: 'drops-shop', icon: Zap, label: 'Drops', mobileVisible: true }] : [])
                                            ].map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveChatTab(tab.id as any)}
                                                    className={`flex-1 ${(tab as any).mobileVisible === false ? 'hidden md:flex' : 'flex'} flex-col items-center justify-center gap-0 md:gap-1.5 py-[2px] md:py-2 rounded-sm md:rounded-lg transition-all relative ${activeChatTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                                >
                                                    <tab.icon className="w-1.5 h-1.5 md:w-3.5 md:h-3.5" />
                                                    <span className="text-[6px] md:text-[9px] font-black uppercase leading-none">{tab.label.substring(0, 3)}</span>
                                                    {activeChatTab === tab.id && (
                                                        <motion.div layoutId="active-chat-tab" className="absolute bottom-0 left-0 right-0 h-[1px] bg-neon-red" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="relative flex-1 flex flex-col min-h-0">
                                            <GlitchTransition trigger={activeChatTab} />
                                            <AnimatePresence mode="wait">
                                                {activeChatTab === 'clips' ? (
                                                    <motion.div
                                                        key="clips-view"
                                                        initial={{ x: 50, opacity: 0 }}
                                                        animate={{ x: 0, opacity: 1 }}
                                                        exit={{ x: -50, opacity: 0 }}
                                                        drag="x"
                                                        dragConstraints={{ left: 0, right: 0 }}
                                                        dragElastic={0.2}
                                                        onDragEnd={(_, info) => {
                                                            if (info.offset.x > 100) handleSwipeTabs('right');
                                                            else if (info.offset.x < -100) handleSwipeTabs('left');
                                                        }}
                                                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                                        className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4 pb-24 touch-pan-y"
                                                    >
                                                        <div className="flex flex-col gap-3">
                                                            <div className="p-6 bg-gradient-to-br from-neon-red/10 to-transparent border border-neon-red/20 rounded-2xl relative overflow-hidden group">
                                                                <div className="absolute top-0 right-0 w-24 h-24 bg-neon-red/20 blur-3xl rounded-full -mr-12 -mt-12" />
                                                                <h4 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                                    <Video className="w-4 h-4 text-neon-red" /> {t('takeover.clips.title')}
                                                                </h4>
                                                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">{t('takeover.clips.subtitle')}</p>
                                                            </div>

                                                            {clips.length === 0 ? (
                                                                <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                                                                    <Video className="w-12 h-12 mb-4" />
                                                                    <p className="text-[10px] font-black uppercase tracking-widest">{t('takeover.clips.empty')}</p>
                                                                </div>
                                                            ) : (
                                                                <div className="grid grid-cols-1 gap-3">
                                                                    {clips
                                                                        .sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
                                                                        .map(clip => (
                                                                            <div key={clip.id} className={`group relative bg-[#111] border rounded-2xl p-3 transition-all ${clip.isFeatured ? 'border-neon-red/40 bg-neon-red/5' : 'border-white/5 hover:border-white/10'}`}>
                                                                                {clip.isFeatured && (
                                                                                    <div className="absolute -top-2 -left-2 z-10 bg-neon-red text-[7px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,0,51,0.3)] text-white">
                                                                                        FEATURED
                                                                                    </div>
                                                                                )}
                                                                                <div className="flex gap-4">
                                                                                    <div className="w-24 aspect-video bg-black rounded-lg overflow-hidden relative shadow-lg">
                                                                                        {clip.isLocal ? (
                                                                                            <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                                                                <span className="text-[8px] font-black text-neon-red opacity-60">LOCAL</span>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <video src={clip.url} className="w-full h-full object-cover opacity-60" />
                                                                                        )}
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setActiveClipToPlay(clip);
                                                                                                setShowClipPlayer(true);
                                                                                            }}
                                                                                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                        >
                                                                                            <div className="w-8 h-8 rounded-full bg-neon-red flex items-center justify-center shadow-lg shadow-neon-red/20">
                                                                                                <Maximize className="w-4 h-4 text-white" />
                                                                                            </div>
                                                                                        </button>
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <h5 className="text-[10px] font-black text-white uppercase truncate mb-1">{clip.title}</h5>
                                                                                        <div className="flex items-center gap-2 text-[8px] font-bold text-gray-500 uppercase">
                                                                                            <span className="text-neon-cyan">@{clip.creator}</span>
                                                                                            <span>•</span>
                                                                                            <span>{clip.date}</span>
                                                                                        </div>
                                                                                        <div className="mt-2 flex gap-2">
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    setActiveClipToPlay(clip);
                                                                                                    setShowClipPlayer(true);
                                                                                                }}
                                                                                                className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-md text-[8px] font-black text-white uppercase tracking-widest transition-all"
                                                                                            >
                                                                                                {t('takeover.clips.watch')}
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => handleDownloadClip(clip)}
                                                                                                className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-md text-[8px] font-black text-gray-400 hover:text-white uppercase tracking-widest transition-all"
                                                                                            >
                                                                                                {t('takeover.clips.dl')}
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ) : activeChatTab === 'drops-shop' ? (
                                                    <motion.div
                                                        key="drops-shop-view"
                                                        initial={{ x: 50, opacity: 0 }}
                                                        animate={{ x: 0, opacity: 1 }}
                                                        exit={{ x: -50, opacity: 0 }}
                                                        drag="x"
                                                        dragConstraints={{ left: 0, right: 0 }}
                                                        dragElastic={0.2}
                                                        onDragEnd={(_, info) => {
                                                            if (info.offset.x > 100) setActiveChatTab('chat');
                                                            else if (info.offset.x < -100) setActiveChatTab('chat');
                                                        }}
                                                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                                        className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar space-y-6 pb-24 touch-pan-y"
                                                    >
                                                        {/* Drops Shop Content */}
                                                        <div className="text-center bg-black/40 border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
                                                            <div className="absolute inset-0 bg-neon-purple/5 blur-3xl rounded-full translate-y-12" />
                                                            <Zap className="w-12 h-12 text-neon-purple mx-auto mb-4 animate-pulse drop-shadow-[0_0_10px_#9333ea]" />
                                                            <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Drops Shop</h4>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                                                Ton Solde : <strong className="text-neon-cyan">{userDrops} 💧</strong>
                                                            </p>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-4">
                                                            {rewards.map(reward => (
                                                                <div key={reward.id} className="p-4 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl relative overflow-hidden group">
                                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-neon-purple/40 transition-colors" />
                                                                    <div className="relative flex items-center justify-between">
                                                                        <div className="space-y-1">
                                                                            <h4 className="text-[11px] font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                                                {reward.icon === 'Smile' ? <Smile className="w-4 h-4 text-neon-purple" /> :
                                                                                    reward.icon === 'MessageSquare' ? <MessageSquare className="w-4 h-4 text-neon-cyan" /> :
                                                                                        <Zap className="w-4 h-4 text-neon-red" />} {reward.name}
                                                                            </h4>
                                                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{reward.description}</p>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => {
                                                                                if (!confirm(`Confirmer l'achat de "${reward.name}" pour ${reward.cost} Drops ?`)) return;
                                                                                if (userDrops >= reward.cost) {
                                                                                    setUserDrops(d => d - reward.cost);
                                                                                    if (reward.id === 'pin') {
                                                                                        setActiveChatTab('chat');
                                                                                    }
                                                                                    alert(`Récompense "${reward.name}" activée !`);
                                                                                } else alert("Pas assez de Drops !");
                                                                            }}
                                                                            className={`px-4 py-2 text-white text-[9px] font-black uppercase rounded-xl hover:scale-105 transition-all shadow-lg ${reward.cost >= 1000 ? 'bg-neon-red' : reward.cost >= 500 ? 'bg-neon-purple' : 'bg-neon-cyan text-black'}`}
                                                                        >
                                                                            {reward.cost} 💧
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                ) : activeChatTab === 'shop' ? (
                                                    <motion.div
                                                        key="real-shop-view"
                                                        initial={{ x: 50, opacity: 0 }}
                                                        animate={{ x: 0, opacity: 1 }}
                                                        exit={{ x: -50, opacity: 0 }}
                                                        drag="x"
                                                        dragConstraints={{ left: 0, right: 0 }}
                                                        dragElastic={0.05}
                                                        onDragEnd={(_, info) => {
                                                            if (info.offset.x > 100) handleSwipeTabs('right');
                                                            else if (info.offset.x < -100) handleSwipeTabs('left');
                                                        }}
                                                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                                        className="flex-1 flex flex-col min-h-0 bg-black touch-pan-y"
                                                    >
                                                        <iframe
                                                            src="/shop?mini=true"
                                                            className="flex-1 w-full border-none"
                                                            title="Dropsiders Shop"
                                                        ></iframe>
                                                    </motion.div>
                                                ) : activeChatTab === 'leaderboard' ? (
                                                    <motion.div
                                                        key="leaderboard-view"
                                                        initial={{ x: 50, opacity: 0 }}
                                                        animate={{ x: 0, opacity: 1 }}
                                                        exit={{ x: -50, opacity: 0 }}
                                                        drag="x"
                                                        dragConstraints={{ left: 0, right: 0 }}
                                                        dragElastic={0.2}
                                                        onDragEnd={(_, info) => {
                                                            if (info.offset.x > 100) handleSwipeTabs('right');
                                                            else if (info.offset.x < -100) handleSwipeTabs('left');
                                                        }}
                                                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                                        className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar space-y-8 pb-24 touch-pan-y"
                                                    >
                                                        {/* Leaderboard Podium */}
                                                        <div className="flex items-end justify-center gap-2 pt-10 pb-6">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className="w-12 h-12 rounded-2xl bg-gray-300/10 border border-gray-300/20 flex items-center justify-center relative">
                                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Trophy className="w-5 h-5 text-gray-400" /></div>
                                                                    <span className="text-[10px] font-black text-white/50">#2</span>
                                                                </div>
                                                                <div className="h-16 w-16 bg-gradient-to-t from-gray-400/20 to-transparent border-x border-t border-white/5 rounded-t-xl flex flex-col items-center justify-end p-2"><span className="text-[8px] font-black text-white/60 truncate w-full text-center">DROPS_FAN</span></div>
                                                            </div>
                                                            <div className="flex flex-col items-center gap-2 -translate-y-4">
                                                                <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center relative shadow-[0_0_30px_rgba(250,204,21,0.2)]">
                                                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2"><Crown className="w-7 h-7 text-yellow-500 animate-bounce" /></div>
                                                                    <span className="text-xs font-black text-yellow-500">🏆</span>
                                                                </div>
                                                                <div className="h-24 w-20 bg-gradient-to-t from-yellow-400/20 to-transparent border-x border-t border-yellow-400/20 rounded-t-2xl flex flex-col items-center justify-end p-2"><span className="text-[9px] font-black text-white truncate w-full text-center">ALEXFR</span></div>
                                                            </div>
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className="w-12 h-12 rounded-2xl bg-orange-400/10 border border-orange-400/20 flex items-center justify-center relative">
                                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Trophy className="w-5 h-5 text-orange-400" /></div>
                                                                    <span className="text-[10px] font-black text-white/50">#3</span>
                                                                </div>
                                                                <div className="h-12 w-16 bg-gradient-to-t from-orange-400/20 to-transparent border-x border-t border-white/5 rounded-t-xl flex flex-col items-center justify-end p-2"><span className="text-[8px] font-black text-white/60 truncate w-full text-center">TECHNO...</span></div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            {[
                                                                { rank: 1, name: "ALEXFR", drops: 2450, color: "text-yellow-400", bg: "bg-yellow-400/10" },
                                                                { rank: 2, name: "DROPS_FAN", drops: 1820, color: "text-gray-300", bg: "bg-gray-300/10" },
                                                                { rank: 3, name: "TECHNO_LOVER", drops: 1540, color: "text-orange-400", bg: "bg-orange-400/10" },
                                                                { rank: 4, name: "NIGHT_OWL", drops: 980, color: "text-white/50", bg: "bg-white/5" },
                                                                { rank: 5, name: "PARTY_GIRL", drops: 450, color: "text-white/50", bg: "bg-white/5" },
                                                            ].map((user) => (
                                                                <div key={user.rank} className={`flex items-center gap-4 p-4 rounded-2xl border border-white/5 ${user.bg} group hover:border-white/20 transition-all`}>
                                                                    <span className={`text-xl font-black ${user.color} italic w-8`}>#{user.rank}</span>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-black text-white uppercase italic tracking-tighter">{user.name}</p>
                                                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{user.drops} Drops accumulés</p>
                                                                    </div>
                                                                    <Zap className={`w-5 h-5 ${user.color}`} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                ) : activeChatTab === 'shazam' ? (
                                                    <motion.div
                                                        key="shazam-view"
                                                        initial={{ x: 50, opacity: 0 }}
                                                        animate={{ x: 0, opacity: 1 }}
                                                        exit={{ x: -50, opacity: 0 }}
                                                        drag="x"
                                                        dragConstraints={{ left: 0, right: 0 }}
                                                        dragElastic={0.2}
                                                        onDragEnd={(_, info) => {
                                                            if (info.offset.x > 100) handleSwipeTabs('right');
                                                            else if (info.offset.x < -100) handleSwipeTabs('left');
                                                        }}
                                                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                                        className="flex-1 overflow-y-auto p-2 lg:p-6 custom-scrollbar space-y-4 lg:space-y-6 touch-pan-y"
                                                    >
                                                        <div className="bg-gradient-to-br from-neon-cyan/20 via-black to-neon-purple/20 border border-white/10 p-4 lg:p-8 rounded-2xl lg:rounded-3xl relative overflow-hidden group">
                                                            <div className="absolute inset-0 bg-aurora opacity-10 pointer-events-none" />
                                                            <div className="relative flex flex-col items-center text-center">
                                                                <div className={`w-12 h-12 lg:w-20 lg:h-20 rounded-full border-2 ${shazamLoading ? 'border-neon-cyan animate-spin shadow-[0_0_50px_#00ffff]' : 'border-neon-purple shadow-[0_0_30px_#bc13fe33]'} flex items-center justify-center mb-4 lg:mb-6`}>
                                                                    <Headphones className={`w-6 h-6 lg:w-10 lg:h-10 ${shazamLoading ? 'text-neon-cyan' : 'text-neon-purple'}`} />
                                                                </div>
                                                                <h4 className="text-2xl lg:text-4xl font-black text-white uppercase italic tracking-tighter mb-1 lg:mb-2">Shazam Live</h4>
                                                                <p className="text-[8px] lg:text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mb-6 lg:mb-8">Identifie la musique en direct</p>

                                                                <button
                                                                    onClick={handleShazam}
                                                                    disabled={shazamLoading}
                                                                    className={`w-full max-w-sm py-3 lg:py-5 rounded-xl lg:rounded-2xl text-[10px] lg:text-base font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 lg:gap-3 shadow-lg ${shazamLoading ? 'bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-neon-cyan text-black hover:scale-[1.02] shadow-neon-cyan/20'}`}
                                                                >
                                                                    {shazamLoading ? (
                                                                        <><Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" /> ÉCOUTE...</>
                                                                    ) : (
                                                                        <><Headphones className="w-4 h-4 lg:w-5 lg:h-5" /> SHAZAM</>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {shazamResult ? (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="p-6 bg-white/[0.04] border border-white/10 rounded-3xl flex flex-col items-center text-center gap-6"
                                                            >
                                                                <div className="w-32 h-32 rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                                                                    <img src={shazamResult.image} alt="Cover" className="w-full h-full object-cover" />
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-[10px] font-black text-neon-cyan uppercase tracking-widest mb-1">Dernière Musique Trouvée</h5>
                                                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-1">{shazamResult.title}</h3>
                                                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{shazamResult.artist}</p>
                                                                </div>

                                                                <div className="flex gap-4 w-full">
                                                                    {shazamResult.spotify && (
                                                                        <a
                                                                            href={shazamResult.spotify}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex-1 py-4 bg-[#1DB954] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                                                                        >
                                                                            <span className="text-lg">🎧</span> Spotify
                                                                        </a>
                                                                    )}
                                                                    <button
                                                                        onClick={() => {
                                                                            setNewMessage(`🎶 Je viens de trouver "${shazamResult.title}" par ${shazamResult.artist} grâce au Shazam ! 🔥`);
                                                                            setActiveChatTab('chat');
                                                                        }}
                                                                        className="flex-1 py-4 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                                                                    >
                                                                        Partager
                                                                    </button>
                                                                </div>
                                                            </motion.div>
                                                        ) : (
                                                            <div className="p-12 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 text-gray-600 opacity-40">
                                                                <Headphones className="w-12 h-12" />
                                                                <p className="text-[10px] font-black uppercase tracking-widest">Aucune musique identifiée</p>
                                                            </div>
                                                        )}

                                                        {shazamHistory.length > 0 && (
                                                            <div className="space-y-4">
                                                                <h5 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                                                    <Clock className="w-3 h-3 text-neon-cyan" /> Historique Communautaire
                                                                </h5>
                                                                <div className="space-y-3">
                                                                    {shazamHistory.map((item, idx) => (
                                                                        <motion.div
                                                                            key={idx}
                                                                            initial={{ opacity: 0, x: 20 }}
                                                                            animate={{ opacity: 1, x: 0 }}
                                                                            transition={{ delay: idx * 0.05 }}
                                                                            className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center gap-3 group hover:bg-white/[0.06] hover:border-white/10 transition-all"
                                                                        >
                                                                            <img src={item.image} alt="Art" className="w-10 h-10 rounded-lg shadow-lg group-hover:scale-110 transition-transform" />
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center justify-between mb-0.5">
                                                                                    <h6 className="text-[10px] font-black text-white truncate pr-2 uppercase italic">{item.title}</h6>
                                                                                    <span className="text-[7px] font-bold text-gray-500 uppercase whitespace-nowrap">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                                </div>
                                                                                <p className="text-[8px] font-bold text-gray-400 uppercase truncate">
                                                                                    {item.artist} <span className="opacity-40 ml-1">• par @{item.user}</span>
                                                                                </p>
                                                                                {item.playedBy && item.playedBy !== 'Inconnu' && (
                                                                                    <div className="flex items-center gap-1 mt-0.5">
                                                                                        <span className="text-[7px] font-black text-neon-purple uppercase tracking-tight">SET: {item.playedBy}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex gap-1">
                                                                                {item.spotify && (
                                                                                    <a href={item.spotify} target="_blank" rel="noopener noreferrer" className="w-7 h-7 bg-[#1DB954]/10 hover:bg-[#1DB954] rounded-lg flex items-center justify-center transition-all group/icon">
                                                                                        <Headphones className="w-3.5 h-3.5 text-[#1DB954] group-hover/icon:text-white" />
                                                                                    </a>
                                                                                )}
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setNewMessage(`🎶 J'adore ce morceau : "${item.title}" par ${item.artist} ! 🔥`);
                                                                                        setActiveChatTab('chat');
                                                                                    }}
                                                                                    className="w-7 h-7 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-all"
                                                                                >
                                                                                    <Zap className="w-3.5 h-3.5 text-neon-cyan" />
                                                                                </button>
                                                                            </div>
                                                                        </motion.div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl opacity-60">
                                                            <h5 className="text-[9px] font-black text-white uppercase tracking-widest mb-4">Fonctionnement</h5>
                                                            <ul className="space-y-3">
                                                                <li className="flex items-center gap-3 text-[9px] font-bold text-gray-400 uppercase">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan" /> Clique sur le bouton pour écouter le flux
                                                                </li>
                                                                <li className="flex items-center gap-3 text-[9px] font-bold text-gray-400 uppercase">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-neon-purple" /> Les résultats sont partagés avec la communauté
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </motion.div>
                                                ) : activeChatTab === 'audio' ? (
                                                    <motion.div
                                                        key="audio-view"
                                                        initial={{ x: 50, opacity: 0 }}
                                                        animate={{ x: 0, opacity: 1 }}
                                                        exit={{ x: -50, opacity: 0 }}
                                                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                                        className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar space-y-4 pb-24"
                                                    >
                                                        {currentAudioRoom ? (
                                                            <div className="flex flex-col items-center justify-center text-center py-10 h-full">
                                                                <div className="relative mb-8">
                                                                    <div className="w-24 h-24 bg-neon-cyan/10 border-2 border-neon-cyan/30 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(0,255,255,0.2)]">
                                                                        <div className="absolute inset-0 bg-neon-cyan/20 rounded-full animate-ping opacity-20" />
                                                                        <Mic className="w-10 h-10 text-neon-cyan" />
                                                                    </div>
                                                                    <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-neon-red text-white text-[8px] font-black uppercase rounded-lg border border-white/20 shadow-lg">
                                                                        EN DIRECT
                                                                    </div>
                                                                </div>

                                                                <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-1 select-none">
                                                                    {currentAudioRoom.name}
                                                                </h4>
                                                                <p className="text-[9px] text-neon-cyan font-black uppercase tracking-[0.3em] mb-8">
                                                                    Salon ID: {currentAudioRoom.id}
                                                                </p>

                                                                <div className="w-full max-w-xs space-y-4">
                                                                    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                                                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentAudioRoom.host}`} alt="Host" className="w-full h-full object-cover" />
                                                                            </div>
                                                                            <div className="text-left">
                                                                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Hôte</p>
                                                                                <p className="text-[10px] text-white font-black uppercase">{currentAudioRoom.host}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                                                                            <Users className="w-3 h-3 text-neon-cyan" />
                                                                            <span className="text-[9px] font-black text-white uppercase">{currentAudioRoom.members}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <button className="flex flex-col items-center justify-center gap-3 p-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group">
                                                                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                                <Volume2 className="w-5 h-5 text-gray-400 group-hover:text-neon-cyan" />
                                                                            </div>
                                                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white">Volume</span>
                                                                        </button>
                                                                        <button className="flex flex-col items-center justify-center gap-3 p-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group">
                                                                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                                <MicOff className="w-5 h-5 text-gray-400 group-hover:text-neon-red" />
                                                                            </div>
                                                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white">Muet</span>
                                                                        </button>
                                                                    </div>

                                                                    <button
                                                                        onClick={() => setCurrentAudioRoom(null)}
                                                                        className="w-full py-4 bg-neon-red/10 border border-neon-red/20 text-neon-red font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-neon-red hover:text-white transition-all shadow-lg shadow-neon-red/10 mt-4 h-14 flex items-center justify-center gap-3"
                                                                    >
                                                                        <LogOut className="w-4 h-4" /> QUITTER LE SALON
                                                                    </button>
                                                                </div>

                                                                <div className="mt-auto pt-8">
                                                                    <p className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.2em] animate-pulse">
                                                                        Connexion audio sécurisée par Dropsiders V2
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Audio Watch Party Content */}
                                                                <div className="flex flex-col items-center justify-center text-center py-6">
                                                                    <div className="w-16 h-16 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,255,255,0.1)]">
                                                                        <Mic className="w-8 h-8 text-neon-cyan animate-pulse" />
                                                                    </div>
                                                                    <h4 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">Watch Party Audio</h4>
                                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-10 max-w-[250px]">Crée un salon privé pour parler avec tes amis en direct</p>
                                                                    <div className="w-full space-y-4">
                                                                        <button
                                                                            onClick={async () => {
                                                                                const roomName = prompt("Nom du salon :", `${pseudo.toUpperCase()}'S ROOM`);
                                                                                if (!roomName) return;
                                                                                try {
                                                                                    const res = await fetch('/api/audio/create', {
                                                                                        method: 'POST',
                                                                                        headers: { 'Content-Type': 'application/json' },
                                                                                        body: JSON.stringify({ name: roomName, host: pseudo, channel: currentVideoId })
                                                                                    });
                                                                                    if (res.ok) {
                                                                                        const data = await res.json();
                                                                                        setCurrentAudioRoom(data);
                                                                                    } else alert("Erreur lors de la création du salon.");
                                                                                } catch (e) { alert("Erreur serveur."); }
                                                                            }}
                                                                            className="w-full py-5 bg-neon-cyan text-black font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-lg shadow-neon-cyan/20 group"
                                                                        >
                                                                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> CRÉER UN SALON
                                                                        </button>
                                                                        <div className="relative">
                                                                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                                                                <Hash className="w-4 h-4 text-gray-500" />
                                                                            </div>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="CODE DU SALON..."
                                                                                value={audioRoomCode}
                                                                                onChange={(e) => setAudioRoomCode(e.target.value)}
                                                                                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-5 text-xs font-black text-white outline-none focus:border-neon-cyan transition-all uppercase placeholder:text-gray-700"
                                                                            />
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleJoinAudioRoom(audioRoomCode)}
                                                                            className="w-full py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                                                                        >
                                                                            REJOINDRE
                                                                        </button>
                                                                    </div>
                                                                    <div className="mt-12 w-full text-left">
                                                                        <h5 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                            <Users className="w-3.5 h-3.5" /> Salons Publics
                                                                        </h5>
                                                                        <div className="space-y-3">
                                                                            {audioRooms.length > 0 ? (
                                                                                audioRooms.map((room) => (
                                                                                    <div key={room.id} className="p-4 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-between group transition-all hover:bg-white/[0.15] cursor-pointer">
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div className="w-8 h-8 rounded-lg bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center">
                                                                                                <Headphones className="w-4 h-4 text-neon-cyan" />
                                                                                            </div>
                                                                                            <div>
                                                                                                <h6 className="text-[10px] font-black text-white uppercase">{room.name}</h6>
                                                                                                <p className="text-[8px] text-gray-500 font-bold uppercase">{room.host.toUpperCase()} • {room.members} VIEWERS</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        <button
                                                                                            onClick={(e) => { e.stopPropagation(); handleJoinAudioRoom(room.id); }}
                                                                                            className="text-[8px] font-black text-neon-cyan uppercase tracking-widest bg-neon-cyan/10 px-3 py-1.5 rounded-lg border border-neon-cyan/20 group-hover:bg-neon-cyan group-hover:text-black transition-all"
                                                                                        >
                                                                                            REJOINDRE
                                                                                        </button>
                                                                                    </div>
                                                                                ))
                                                                            ) : (
                                                                                <div className="p-8 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-600">
                                                                                    <MicOff className="w-6 h-6 opacity-30" />
                                                                                    <span className="text-[8px] font-black uppercase tracking-widest">Aucun salon actif</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="chat-view"
                                                        initial={{ x: 100, opacity: 0 }}
                                                        animate={{ x: 0, opacity: 1 }}
                                                        exit={{ x: -100, opacity: 0 }}
                                                        drag="x"
                                                        dragConstraints={{ left: 0, right: 0 }}
                                                        dragElastic={0.1}
                                                        onDragEnd={(_, info) => {
                                                            if (info.offset.x > 100) handleSwipeTabs('right');
                                                            else if (info.offset.x < -100) handleSwipeTabs('left');
                                                        }}
                                                        transition={{ type: "spring", damping: 30, stiffness: 200 }}
                                                        id="default-chat-view"
                                                        className="flex-1 flex flex-col min-h-0 relative touch-pan-y"
                                                    >
                                                        {!isJoined ? (
                                                            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a0a0a] relative overflow-hidden">
                                                                {/* Background Decor */}
                                                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-red to-transparent opacity-50" />
                                                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon-red/10 rounded-full blur-[100px]" />
                                                                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-neon-cyan/10 rounded-full blur-[100px]" />

                                                                <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center space-y-8">
                                                                    <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-neon-red to-neon-purple p-[1px] shadow-[0_0_40px_rgba(255,18,65,0.3)] animate-float">
                                                                        <div className="w-full h-full rounded-[2rem] bg-[#0a0a0a] flex items-center justify-center">
                                                                            <Users className="w-10 h-10 text-white" />
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-3">
                                                                        <h3 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                                                            Rejoins le <span className="text-neon-red">Direct</span>
                                                                        </h3>
                                                                        <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] leading-relaxed">
                                                                            Connecte-toi pour voir les messages<br />et participer à l'expérience !
                                                                        </p>
                                                                    </div>

                                                                    <div className="w-full p-6 bg-white/[0.03] border border-white/10 rounded-3xl backdrop-blur-xl">
                                                                        <form onSubmit={handleJoin} className="space-y-4">
                                                                            <div className="space-y-3">
                                                                                <div className="relative group">
                                                                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                                                        <User className="w-4 h-4 text-gray-500 group-focus-within:text-neon-red transition-colors" />
                                                                                    </div>
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder="TON PSEUDO"
                                                                                        required
                                                                                        value={pseudo}
                                                                                        onChange={(e) => setPseudo(e.target.value)}
                                                                                        className="w-full bg-black/60 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-[13px] font-black text-white outline-none focus:border-neon-red transition-all uppercase placeholder:text-gray-600"
                                                                                    />
                                                                                </div>

                                                                                <div className="relative group">
                                                                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                                                        <Mail className="w-4 h-4 text-gray-500 group-focus-within:text-neon-red transition-colors" />
                                                                                    </div>
                                                                                    <input
                                                                                        type="email"
                                                                                        placeholder="TON EMAIL"
                                                                                        required
                                                                                        value={email}
                                                                                        onChange={(e) => setEmail(e.target.value)}
                                                                                        className="w-full bg-black/60 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-[13px] font-black text-white outline-none focus:border-neon-red transition-all uppercase placeholder:text-gray-600"
                                                                                    />
                                                                                </div>

                                                                                <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        id="newsletter"
                                                                                        checked={newsletter}
                                                                                        onChange={(e) => setNewsletter(e.target.checked)}
                                                                                        className="w-5 h-5 accent-neon-red cursor-pointer"
                                                                                    />
                                                                                    <label htmlFor="newsletter" className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer select-none">
                                                                                        Recevoir la Newsletter & les actus (LINE UP...)
                                                                                    </label>
                                                                                </div>

                                                                                <div className="grid grid-cols-2 gap-3">
                                                                                    <select
                                                                                        required
                                                                                        value={country}
                                                                                        onChange={(e) => setCountry(e.target.value)}
                                                                                        autoComplete="off"
                                                                                        className="bg-black/60 border border-white/10 rounded-2xl px-4 py-4 text-[11px] font-black text-white outline-none focus:border-neon-red transition-all appearance-none cursor-pointer"
                                                                                    >
                                                                                        <option value="" disabled>PAYS</option>
                                                                                        <option value="FR">🇫🇷 FR</option>
                                                                                        <option value="BE">🇧🇪 BE</option>
                                                                                        <option value="CH">🇨🇭 CH</option>
                                                                                        <option value="OTHER">🌍 AUTRE</option>
                                                                                    </select>
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder={`${captchaA} + ${captchaB} = ?`}
                                                                                        required
                                                                                        value={captchaAnswer}
                                                                                        onChange={(e) => setCaptchaAnswer(e.target.value)}
                                                                                        className="bg-black/60 border border-white/10 rounded-2xl px-4 py-4 text-[13px] font-black text-white outline-none focus:border-neon-red transition-all placeholder:text-gray-600"
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            <button
                                                                                type="submit"
                                                                                className="w-full bg-neon-red text-white py-4 rounded-2xl font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-neon-red/20 group"
                                                                            >
                                                                                REJOINDRE LE LIVE
                                                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                                            </button>

                                                                            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                                                                                En rejoignant le live, tu acceptes nos CGU
                                                                            </p>
                                                                        </form>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Pinned Message */}
                                                                {settings.pinnedMessage && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: -10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        className="mx-3 lg:mx-5 mt-3 p-3 bg-neon-red/10 border border-neon-red/20 rounded-xl flex items-start gap-3 relative overflow-hidden group/pinned"
                                                                    >
                                                                        <div className="absolute inset-0 bg-gradient-to-r from-neon-red/5 to-transparent pointer-events-none" />
                                                                        <Pin className="w-3.5 h-3.5 text-neon-red shrink-0 mt-1 animate-pulse" />
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-[10px] font-black text-neon-red uppercase tracking-widest mb-0.5">MESSAGE ÉPINGLÉ</p>
                                                                            <p className="text-[10px] md:text-[11px] font-bold text-white leading-tight break-words uppercase">
                                                                                {settings.pinnedMessage}
                                                                            </p>
                                                                        </div>
                                                                        {hasModPowers && (
                                                                            <button
                                                                                onClick={() => handleUpdateSettings({ pinnedMessage: '' })}
                                                                                className="p-1 hover:bg-neon-red/20 rounded-lg text-gray-500 hover:text-neon-red transition-all opacity-0 group-hover/pinned:opacity-100"
                                                                            >
                                                                                <X className="w-3 h-3" />
                                                                            </button>
                                                                        )}
                                                                    </motion.div>
                                                                )}

                                                                {/* Chat Messages */}
                                                                <div id="chat-messages" className="flex-1 overflow-visible lg:overflow-y-auto p-1.5 md:p-3 lg:p-5 space-y-0.5 md:space-y-1.5 scroll-smooth lg:custom-scrollbar pointer-events-auto">
                                                                    {messages
                                                                        .filter(m => chatCountryFilter === 'ALL' || m.country === chatCountryFilter || (chatCountryFilter === 'OTHER' && !['FR', 'BE', 'CH', 'CA'].includes(m.country)))
                                                                        .map((msg, idx) => {
                                                                            const role = getRole(msg.pseudo);
                                                                            const isMsgAdmin = role === "admin";
                                                                            const isMsgModo = role === "modo";
                                                                            const isBot = msg.isBot || msg.pseudo === "DROPSIDERS BOT";

                                                                            return (
                                                                                <motion.div
                                                                                    key={msg.id || idx}
                                                                                    initial={{ opacity: 0, x: 10 }}
                                                                                    animate={{ opacity: 1, x: 0 }}
                                                                                    className="group relative min-w-0 overflow-hidden px-1 py-[1px]"
                                                                                >
                                                                                    <div className="flex items-start gap-1.5 md:gap-2 leading-tight">
                                                                                        <div className="w-3 md:w-4 flex items-center justify-center opacity-80 shrink-0 mt-0.5 md:mt-1">
                                                                                            {getCountryFlag(msg.country || "FR")}
                                                                                        </div>
                                                                                        <div className="flex-1 min-w-0 break-words">
                                                                                            <span
                                                                                                className="text-[10px] md:text-[11px] lg:text-[12px] font-black uppercase tracking-widest mr-1.5"
                                                                                                style={{ color: isBot ? botColor : isMsgAdmin ? (localSettings.adminColor || adminColor) : isMsgModo ? "#eab308" : (msg.color || "#9ca3af") }}
                                                                                            >
                                                                                                {msg.pseudo}{isMsgAdmin && <span className="ml-1 px-1 rounded text-white text-[7px] font-black uppercase align-middle" style={{ backgroundColor: (localSettings.adminColor || adminColor) }}>ADM</span>}:
                                                                                            </span>
                                                                                            <span
                                                                                                className={`text-[10px] md:text-[11px] lg:text-[11px] font-medium relative leading-[1.2] ${isBot ? "" : isMsgAdmin ? "" : "text-gray-200"}`}
                                                                                                style={isBot ? { color: botColor } : isMsgAdmin ? { color: "#ffffff" } : {}}
                                                                                            >
                                                                                                {(() => {
                                                                                                    const text = msg.message;
                                                                                                    if (!text) return null;
                                                                                                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                                                                                                    const parts = text.split(urlRegex);
                                                                                                    return parts.map((part: string, i: number) => {
                                                                                                        if (part.match(urlRegex)) {
                                                                                                            if (part.includes("#clip-")) {
                                                                                                                const cId = part.split("#clip-")[1];
                                                                                                                const targetClip = clips.find(c => c.id === cId);
                                                                                                                return (
                                                                                                                    <button
                                                                                                                        key={i}
                                                                                                                        onClick={(e) => {
                                                                                                                            e.preventDefault();
                                                                                                                            e.stopPropagation();
                                                                                                                            if (targetClip) {
                                                                                                                                setActiveClipToPlay(targetClip);
                                                                                                                                setShowClipPlayer(true);
                                                                                                                                setIsMutedGlobal(true);
                                                                                                                            }
                                                                                                                        }}
                                                                                                                        className="text-neon-cyan hover:text-white bg-neon-cyan/10 hover:bg-neon-cyan/30 px-1 py-0 rounded-sm border border-neon-cyan/20 font-black transition-all inline-flex items-center gap-1 text-[6px] mx-0.5"
                                                                                                                    >
                                                                                                                        <Video className="w-2 h-2" /> CLIP
                                                                                                                    </button>
                                                                                                                );
                                                                                                            }
                                                                                                            return (
                                                                                                                <a
                                                                                                                    key={i}
                                                                                                                    href={part}
                                                                                                                    target="_blank"
                                                                                                                    rel="noopener noreferrer"
                                                                                                                    className="text-cyan-400 hover:text-cyan-300 underline font-bold mx-0.5"
                                                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                                                >
                                                                                                                    {part.length > 20 ? part.substring(0, 20) + "..." : part}
                                                                                                                </a>
                                                                                                            );
                                                                                                        }
                                                                                                        return part;
                                                                                                    });
                                                                                                })()}
                                                                                            </span>
                                                                                            <span className="text-[5px] text-gray-700 font-bold uppercase ml-2 opacity-40">{msg.time}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    {hasModPowers && (isAdmin || !isMsgAdmin) && (
                                                                                        <div className="absolute top-0 right-0 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all z-20 bg-[#0a0a0a]/80 backdrop-blur-sm rounded-bl-lg overflow-hidden border-l border-b border-white/10">
                                                                                            <button onClick={() => handleUpdateSettings({ pinnedMessage: msg.message })} className="p-1 hover:bg-white/10 text-gray-500 hover:text-white transition-all"><Pin className="w-2.5 h-2.5" /></button>
                                                                                            <button onClick={() => handleDelete(msg.id)} className="p-1 hover:bg-neon-red/20 text-gray-500 hover:text-neon-red transition-all"><Trash2 className="w-2.5 h-2.5" /></button>
                                                                                        </div>
                                                                                    )}
                                                                                </motion.div>
                                                                            );
                                                                        })}
                                                                </div>

                                                                {/* Chat Input Area */}
                                                                <div className="p-1.5 md:p-3 lg:p-4 bg-[#0a0a0a]/80 backdrop-blur-2xl border-t border-white/10 relative lg:sticky bottom-0 z-[150] shadow-[0_-20px_40px_rgba(0,0,0,0.8)] pb-safe">

                                                                    <form onSubmit={handleSendMessage} className="relative group/input px-0.5 md:px-2 py-0">
                                                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-red via-neon-cyan to-neon-purple opacity-10 group-focus-within/input:opacity-30 blur-md rounded-xl lg:rounded-2xl transition-all" />
                                                                        <div className="relative flex flex-col bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl lg:rounded-2xl overflow-hidden focus-within:border-neon-red/30 shadow-2xl">
                                                                            <div className="flex items-center px-1 md:px-2 py-0.5 lg:py-1">
                                                                                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-1 md:p-2.5 transition-all ${showEmojiPicker ? 'text-neon-red scale-110' : 'text-gray-500 hover:text-white hover:scale-105'}`}><Smile className="w-4 h-4 md:w-5 md:h-5" /></button>
                                                                                <div className="w-[1px] h-3 md:h-4 bg-white/10 mx-0.5 md:mx-1" />

                                                                                <input
                                                                                    type="text"
                                                                                    value={newMessage}
                                                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                                                    placeholder={isSlowMode && !hasModPowers ? "⏳ Lent..." : "Écrire..."}
                                                                                    className="flex-1 bg-transparent px-1.5 md:px-3 py-2 text-[11px] md:text-sm font-medium text-white outline-none placeholder:text-gray-700 min-w-0"
                                                                                />

                                                                                <button type="button" onClick={handleShazam} className={`p-1 md:p-1.5 transition-all flex items-center gap-1.5 ${shazamLoading ? 'text-neon-cyan animate-pulse' : 'text-gray-500 hover:text-neon-cyan hover:scale-105'}`}>
                                                                                    <Headphones className="w-4 h-4 md:w-5 md:h-5" />
                                                                                </button>

                                                                                <button
                                                                                    type="button"
                                                                                    onClick={isPushEnabled ? unsubscribeFromPush : subscribeToPushNotifications}
                                                                                    title={isPushEnabled ? "Désactiver les notifications" : "Activer les notifications natives (Favoris)"}
                                                                                    className={`p-1 md:p-1.5 transition-all flex items-center gap-1.5 ${isPushEnabled ? 'text-neon-cyan' : 'text-gray-500 hover:text-neon-cyan hover:scale-110'}`}
                                                                                >
                                                                                    <Bell className={`w-4 h-4 md:w-5 md:h-5 ${isPushEnabled ? 'animate-bounce' : ''}`} />
                                                                                </button>

                                                                                <div className="w-[1px] h-3 md:h-4 bg-white/10 mx-0.5 md:mx-1" />

                                                                                <button type="submit" disabled={!newMessage.trim() || isSending} className="ml-1 p-1.5 md:p-2 bg-neon-red text-white hover:bg-neon-red/80 disabled:opacity-20 rounded-lg md:rounded-xl transition-all flex items-center justify-center active:scale-90 shadow-lg shadow-neon-red/20">
                                                                                    <Send className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isSending ? 'animate-pulse' : ''}`} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        {showEmojiPicker && (
                                                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-full left-0 right-0 mb-4 p-4 bg-[#0a0a0a] border border-white/10 rounded-3xl grid grid-cols-6 lg:grid-cols-8 gap-2 shadow-2xl h-52 overflow-y-auto z-[60] custom-scrollbar">
                                                                                {['🔥', '🙌', '🚀', '❤️', '🤩', '💿', '💫', '💥', '✨', '⚡️', '🎹', '🎧', '🕺', '💃', '🎆', '🔊', '🎉', '💯', '🎶', '🎵', '😎', '🤪', '🤯', '🥳'].map(e => (
                                                                                    <button key={e} type="button" onClick={() => { setNewMessage(p => p + e); setShowEmojiPicker(false); }} className="text-xl md:text-2xl hover:bg-white/10 p-2 md:p-2.5 rounded-xl transition-transform active:scale-90">{e}</button>
                                                                                ))}
                                                                            </motion.div>
                                                                        )}
                                                                    </form>
                                                                </div>
                                                            </>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                        </div>
                                    </div>
                                )}
                                {!isFocusMode && (
                                    <div className="hidden md:flex relative h-full items-center justify-center shrink-0 z-30">
                                        <button
                                            onClick={() => setShowUsersPanel(!showUsersPanel)}
                                            className="absolute right-0 w-8 h-16 bg-white/5 hover:bg-white/10 border-y border-l border-white/10 rounded-l-xl flex items-center justify-center transition-all group z-[100]"
                                        >
                                            <div className={`w-2 h-2 border-b-2 border-r-2 border-white/50 group-hover:border-white transition-all transform ${showUsersPanel ? '-rotate-45' : 'rotate-135'}`} />
                                        </button>
                                    </div>
                                )}

                                <AnimatePresence>
                                    {!isFocusMode && showUsersPanel && (
                                        <motion.div
                                            initial={{ width: 0, opacity: 0 }}
                                            animate={{ width: 200, opacity: 1 }}
                                            exit={{ width: 0, opacity: 0 }}
                                            className="hidden md:flex flex-col bg-[#0a0a0a] border-l border-white/10 relative z-20 shrink-0 overflow-hidden"
                                        >
                                            <div className="w-[200px] flex flex-col h-full">
                                                <div className="p-4 lg:p-6 border-b border-white/10 shrink-0 flex justify-between items-center bg-white/[0.02]">
                                                    <h2 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-neon-red" /> Utilisateurs
                                                    </h2>
                                                    <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full font-bold">{allActiveUsers.length}</span>
                                                </div>
                                                <div className="flex-1 overflow-y-auto">
                                                    <div className="p-3 space-y-2">
                                                        {allActiveUsers.map(u => {
                                                            const role = getRole(u.pseudo);
                                                            const isUserAdmin = role === 'admin';
                                                            const isUserModo = role === 'modo';
                                                            const isExpanded = expandedUserId === u.pseudo;

                                                            return (
                                                                <div key={u.pseudo} className="flex flex-col bg-white/[0.02] hover:bg-white/5 rounded-lg transition-colors border border-white/5">
                                                                    <div
                                                                        onClick={() => setExpandedUserId(isExpanded ? null : u.pseudo)}
                                                                        className="flex items-center justify-between group p-2 cursor-pointer select-none"
                                                                    >
                                                                        <div className="flex items-center gap-2 truncate">
                                                                            <div className="w-4 flex items-center justify-center">
                                                                                {getCountryFlag(u.country)}
                                                                            </div>
                                                                            <span className={`text-xs font-bold uppercase truncate max-w-[100px] sm:max-w-[120px] ${isUserAdmin ? 'text-neon-red' : isUserModo ? 'text-yellow-500' : 'text-gray-300'}`}>
                                                                                {u.pseudo}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            {(isUserAdmin || isUserModo) && (
                                                                                <span className="text-[10px] bg-white/10 px-1 py-0.5 rounded text-white font-bold opacity-60 flex items-center gap-1">
                                                                                    {isUserAdmin && <Zap className="w-3 h-3 text-neon-red" />}
                                                                                    {isUserModo && !isUserAdmin && <Shield className="w-3 h-3 text-yellow-500" />}
                                                                                </span>
                                                                            )}
                                                                            {isAdmin && !isUserAdmin && !isUserModo && pseudo !== u.pseudo && (
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handlePromote(u.pseudo); }}
                                                                                    className="p-1 opacity-0 group-hover:opacity-100 xl:group-hover:opacity-100 hover:bg-neon-red/20 rounded-md text-gray-500 hover:text-neon-red transition-all"
                                                                                    title="Promouvoir Modérateur Chat"
                                                                                >
                                                                                    <Shield className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <AnimatePresence>
                                                                        {isExpanded && (
                                                                            <motion.div
                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                className="overflow-hidden border-t border-white/5"
                                                                            >
                                                                                <div className="p-3 space-y-3 bg-black/40">
                                                                                    <div className="space-y-1.5">
                                                                                        <div className="flex items-center justify-between text-[10px]">
                                                                                            <span className="text-gray-500 font-bold uppercase tracking-widest">Pays</span>
                                                                                            <span className="text-gray-300 font-bold">{u.country} {getCountryFlag(u.country)}</span>
                                                                                        </div>
                                                                                        <div className="flex items-center justify-between text-[10px]">
                                                                                            <span className="text-gray-500 font-bold uppercase tracking-widest">Email</span>
                                                                                            <span className="text-gray-400 font-italic">Non disponible</span>
                                                                                        </div>
                                                                                    </div>

                                                                                    {isAdmin && pseudo !== u.pseudo && (
                                                                                        <button
                                                                                            onClick={(e) => { e.stopPropagation(); handleGiveDrops(u.pseudo); }}
                                                                                            className="w-full flex items-center justify-center gap-2 py-2 mt-2 bg-neon-purple/10 hover:bg-neon-purple/20 text-neon-purple border border-neon-purple/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                                                                        >
                                                                                            <Zap className="w-3.5 h-3.5" />
                                                                                            Donner DROPS
                                                                                        </button>
                                                                                    )}

                                                                                    {isAdmin && isUserModo && pseudo !== u.pseudo && (
                                                                                        <button
                                                                                            onClick={(e) => { e.stopPropagation(); handleDemote(u.pseudo); }}
                                                                                            className="w-full flex items-center justify-center gap-2 py-2 mt-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                                                                        >
                                                                                            <Shield className="w-3.5 h-3.5" />
                                                                                            Retirer MODO
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div >
                    </div >
                </div >

                {/* Ticker Banner */}
                {
                    !isFocusMode && !isFullScreen && showTickerBanner && (
                        <div
                            className="w-full h-12 shrink-0 hidden lg:flex items-center overflow-hidden border-t border-white/20 relative z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] group/ticker"
                            style={{ backgroundColor: tickerBgColor }}
                            onMouseEnter={() => {
                                const ticker = document.getElementById('ticker-animate-container');
                                if (ticker) ticker.style.animationPlayState = 'paused';
                            }}
                            onMouseLeave={() => {
                                const ticker = document.getElementById('ticker-animate-container');
                                if (ticker) ticker.style.animationPlayState = 'running';
                            }}
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none" style={{ background: `linear-gradient(to right, ${tickerBgColor}, ${tickerBgColor}cc, transparent)` }} />
                            <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none" style={{ background: `linear-gradient(to left, ${tickerBgColor}, ${tickerBgColor}cc, transparent)` }} />

                            <div id="ticker-animate-container" className="flex items-center absolute whitespace-nowrap animate-ticker py-2">
                                {tickerType === 'news' && (latestNews.length > 0 ? latestNews.concat(latestNews) : []).map((news, i) => (
                                    <a
                                        key={`${news.id}-${i}`}
                                        href={`/news/${news.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center mx-8 shrink-0 hover:scale-105 transition-transform group"
                                        style={{ color: tickerTextColor }}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">{news.title}</span>
                                        <div className="w-2 h-2 rounded-full bg-white/30 ml-8" />
                                    </a>
                                ))}

                                {tickerType === 'planning' && (() => {
                                    const activeItems = currentFluxLineup.filter(item => !item.isPast);
                                    return activeItems.concat(activeItems).map((item, i) => (
                                        <div key={i} className="flex items-center mx-12 shrink-0 hover:scale-105 transition-transform" style={{ color: tickerTextColor }}>
                                            <span className="text-[10px] font-black uppercase italic tracking-[0.2em]">{item.time} - {item.artist}</span>
                                            <div className="w-2 h-2 rounded-full bg-white/30 ml-12" />
                                        </div>
                                    ));
                                })()}

                                {tickerType === 'custom' && Array(10).fill(0).map((_, i) => (
                                    tickerLink ? (
                                        <a key={i} href={tickerLink} target="_blank" rel="noopener noreferrer" className="flex items-center mx-12 shrink-0 hover:scale-105 transition-transform" style={{ color: tickerTextColor }}>
                                            <span className="text-[12px] font-black uppercase italic tracking-[0.2em]">{tickerText || 'VOTRE TEXTE ICI'}</span>
                                            <div className="w-2 h-2 rounded-full bg-white/30 ml-12" />
                                        </a>
                                    ) : (
                                        <div key={i} className="flex items-center mx-12 shrink-0" style={{ color: tickerTextColor }}>
                                            <span className="text-[12px] font-black uppercase italic tracking-[0.2em]">{tickerText || 'VOTRE TEXTE ICI'}</span>
                                            <div className="w-2 h-2 rounded-full bg-white/30 ml-12" />
                                        </div>
                                    )
                                ))}

                                {tickerType === 'news' && latestNews.length === 0 && (
                                    <div className="text-[10px] font-black uppercase italic tracking-[0.3em] text-white/80 mx-10 animate-pulse">
                                        CHARGEMENT DU FIL D'ACTUALITÉ...
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* CLIP PLAYER POPUP */}
                <AnimatePresence>
                    {showClipPlayer && activeClipToPlay && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 lg:p-12">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => {
                                    setShowClipPlayer(false);
                                    setIsMutedGlobal(false);
                                    setActiveClipToPlay(null);
                                }}
                                className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative w-full max-w-5xl aspect-video bg-black rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                            >
                                <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-20">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center">
                                            <Video className="w-6 h-6 text-neon-cyan" />
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">{activeClipToPlay.title}</h3>
                                            <span className="text-[10px] font-black text-neon-cyan uppercase tracking-widest mt-1">LECTURE DU CLIP ({activeClipToPlay.duration})</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowClipPlayer(false);
                                            setIsMutedGlobal(false);
                                            setActiveClipToPlay(null);
                                        }}
                                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all group active:scale-95"
                                    >
                                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                    </button>
                                </div>
                                <div className="w-full h-full bg-black flex items-center justify-center">
                                    {activeClipToPlay.isLocal ? (
                                        <video
                                            src={activeClipToPlay.url}
                                            controls
                                            autoPlay
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <iframe
                                            className="w-full h-full"
                                            src={`https://www.youtube.com/embed/${activeClipToPlay.videoId || activeClipToPlay.channelId || settings.youtubeId}?autoplay=1&mute=0&rel=0&modestbranding=1&enablejsapi=1`}
                                            title="Clip Player"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    )}
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center justify-center bg-gradient-to-t from-black/80 to-transparent">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => {
                                                const shareText = `Regardez ce clip sur Dropsiders ! ${window.location.href}`;
                                                if (navigator.share) {
                                                    navigator.share({ title: 'Clip Dropsiders', text: shareText, url: window.location.href });
                                                } else {
                                                    navigator.clipboard.writeText(shareText);
                                                    alert("Lien copié !");
                                                }
                                            }}
                                            className="px-8 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                                        >
                                            Partager le clip
                                        </button>
                                        <button
                                            onClick={() => handleDownloadClip(activeClipToPlay)}
                                            className="px-8 py-3 bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neon-cyan/30 transition-all active:scale-95"
                                        >
                                            Télécharger (HD)
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Shazam Instructions Modal */}
                <AnimatePresence>
                    {showShazamInfo && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
                            onClick={() => setShowShazamInfo(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                                className="w-full max-w-lg bg-[#050505] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_120px_rgba(0,255,255,0.15)] relative"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Decorative elements */}
                                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />

                                <div className="relative p-10 lg:p-14 text-center space-y-10">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-neon-cyan/5 blur-[120px] rounded-full pointer-events-none" />

                                    <div className="relative flex flex-col items-center">
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-neon-cyan/20 blur-3xl rounded-full group-hover:bg-neon-cyan/30 transition-all duration-700" />
                                            <div className="w-28 h-28 bg-black/40 border border-neon-cyan/30 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_40px_rgba(0,255,255,0.1)] group-hover:border-neon-cyan/60 transition-all duration-500">
                                                <Headphones className="w-12 h-12 text-neon-cyan drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]" />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#050505] border border-white/10 rounded-full flex items-center justify-center z-20">
                                                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-ping" />
                                            </div>
                                        </div>

                                        <div className="mt-8">
                                            <h3 className="text-3xl lg:text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                                                Identifier le <span className="text-neon-cyan drop-shadow-[0_0_15px_rgba(0,255,255,0.4)]">Son</span>
                                            </h3>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-3 opacity-60">Technologie Dropsiders Shazam</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 text-left relative z-10">
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 }}
                                            className="flex items-center gap-5 p-5 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-md rounded-[1.5rem] border border-white/5 hover:border-white/10 transition-all duration-300 group"
                                        >
                                            <div className="w-10 h-10 rounded-2xl bg-neon-cyan text-black text-sm font-black flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,255,255,0.3)] group-hover:scale-110 transition-transform">1</div>
                                            <p className="text-[12px] text-gray-300 font-bold uppercase leading-relaxed tracking-wider">
                                                Cliquez sur <span className="text-neon-cyan font-black">"DÉMARRER L'ÉCOUTE"</span>
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="flex items-center gap-5 p-5 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-md rounded-[1.5rem] border border-white/5 hover:border-white/10 transition-all duration-300 group"
                                        >
                                            <div className="w-10 h-10 rounded-2xl bg-neon-cyan text-black text-sm font-black flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,255,255,0.3)] group-hover:scale-110 transition-transform">2</div>
                                            <p className="text-[12px] text-gray-300 font-bold uppercase leading-relaxed tracking-wider">
                                                Sélectionnez <span className="text-white font-black">"ONGLET CHROME"</span> et <span className="text-white font-black">"DROPSIDERS LIVE"</span>
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex items-center gap-5 p-5 bg-neon-red/10 hover:bg-neon-red/15 backdrop-blur-md rounded-[1.5rem] border border-neon-red/20 group transition-all duration-300"
                                        >
                                            <div className="w-10 h-10 rounded-2xl bg-neon-red text-white text-sm font-black flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,0,51,0.3)] group-hover:scale-110 transition-transform">!</div>
                                            <p className="text-[12px] text-white font-black uppercase leading-relaxed tracking-wider">
                                                Activez impérativement <span className="underline decoration-2 underline-offset-4 decoration-white/30">"PARTAGER L'AUDIO"</span>
                                            </p>
                                        </motion.div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                        <button
                                            onClick={() => { setShowShazamInfo(false); handleShazam(); }}
                                            className="flex-1 py-5 bg-neon-cyan hover:bg-neon-cyan/90 text-black text-[13px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_15px_30px_rgba(0,255,255,0.2)]"
                                        >
                                            Démarrer
                                        </button>
                                        <button
                                            onClick={() => setShowShazamInfo(false)}
                                            className="px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-[13px] font-black uppercase tracking-[0.2em] rounded-2xl active:scale-95 transition-all"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* === QUIZ POPUP (petite popup flottante dans le coin du chat) === */}
                    {showQuizPopup && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: 20 }}
                            className="fixed bottom-24 right-4 z-[200] w-full max-w-xs sm:max-w-sm"
                        >
                            <motion.div
                                className="bg-[#111] border border-yellow-500/30 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(255,200,18,0.15)]"
                            >
                                <div className="p-4 space-y-3">
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">🎯</span>
                                            <h2 className="text-xs font-black text-white uppercase italic tracking-tight">Question Quiz</h2>
                                        </div>
                                        <button
                                            onClick={() => { setShowQuizPopup(false); setQuizPopupAnswer(null); setQuizPopupQuestion(null); }}
                                            className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    {quizPopupLoading ? (
                                        <div className="flex justify-center py-4">
                                            <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : !(quizPopupQuestion != null && quizPopupQuestion.question) ? (
                                        <div className="py-4 text-center">
                                            <p className="text-gray-400 font-bold text-xs">Aucune question disponible.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {/* Category badge */}
                                            <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                                                {quizPopupQuestion?.category ?? quizPopupQuestion?.type ?? 'Quiz'}
                                            </span>

                                            {/* Question - Hidden for Image/Blind Test as requested */}
                                            {quizPopupQuestion.type?.toUpperCase() !== 'IMAGE' && quizPopupQuestion.type?.toUpperCase() !== 'BLIND_TEST' && (
                                                <h3 className="text-[11px] font-black text-white tracking-tight leading-snug">
                                                    {quizPopupQuestion.question}
                                                </h3>
                                            )}

                                            {/* Audio for blind test */}
                                            {quizPopupQuestion.type?.toUpperCase() === 'BLIND_TEST' && quizPopupQuestion.audioUrl && (
                                                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center gap-3">
                                                    <span className="text-2xl">🎵</span>
                                                    <audio autoPlay controls className="flex-1 h-8 opacity-80">
                                                        <source src={quizPopupQuestion.audioUrl} type="audio/mpeg" />
                                                    </audio>
                                                </div>
                                            )}

                                            {/* Image */}
                                            {quizPopupQuestion.type?.toUpperCase() === 'IMAGE' && quizPopupQuestion.imageUrl && (
                                                <div className="rounded-xl overflow-hidden border border-white/10 max-h-32">
                                                    <img src={quizPopupQuestion.imageUrl} alt="Quiz" className="w-full h-auto object-cover max-h-32" />
                                                </div>
                                            )}

                                            {/* Direct MP3 Audio (Most reliable) */}
                                            {quizPopupQuestion.type?.toUpperCase() === 'BLIND_TEST' && quizPopupQuestion.audioUrl && (
                                                <div className="hidden">
                                                    <audio
                                                        autoPlay
                                                        src={quizPopupQuestion.audioUrl}
                                                        ref={(el) => {
                                                            if (el) {
                                                                el.volume = isMutedGlobal ? 0 : 0.5;
                                                                if (quizPopupQuestion.startTime) {
                                                                    el.currentTime = quizPopupQuestion.startTime;
                                                                }
                                                                // Limit to 45 seconds of playback
                                                                const maxDuration = 45;
                                                                const start = quizPopupQuestion.startTime || 0;
                                                                const handleTime = () => {
                                                                    if (el.currentTime > start + maxDuration) el.pause();
                                                                };
                                                                el.addEventListener('timeupdate', handleTime);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )}


                                            {/* Blind Test Animation (Visualizer) - Premium Style */}
                                            {quizPopupQuestion.type?.toUpperCase() === 'BLIND_TEST' && (
                                                <div className="relative h-44 bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center group">
                                                    {/* Deep Ambient Glow */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-neon-red/10 via-transparent to-neon-cyan/5" />
                                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.05)_0%,transparent_70%)]" />

                                                    {/* Animated Bars (Refined) */}
                                                    <div className="flex items-end gap-1.5 h-24 px-12 relative z-10">
                                                        {[...Array(24)].map((_, i) => (
                                                            <motion.div
                                                                key={i}
                                                                animate={{
                                                                    height: [15, 25 + Math.random() * 55, 15],
                                                                    backgroundColor: i % 2 === 0 ? '#ff0033' : '#00f2ff'
                                                                }}
                                                                transition={{
                                                                    duration: 0.4 + Math.random() * 0.8,
                                                                    repeat: Infinity,
                                                                    ease: "easeInOut",
                                                                    delay: i * 0.03
                                                                }}
                                                                className="w-1.5 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                                                            />
                                                        ))}
                                                    </div>

                                                    {/* Center Icon & Glow */}
                                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                                        <div className="relative">
                                                            <div className="absolute inset-0 bg-neon-cyan/20 blur-2xl rounded-full scale-150 animate-pulse" />
                                                            <Headphones className="w-12 h-12 text-white/20 rotate-12 relative z-20" />
                                                        </div>
                                                    </div>

                                                    {/* Scanning Line */}
                                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[10%] w-full animate-scan" style={{ top: '-100%' }} />

                                                    {/* Premium Badge */}
                                                    <div className="absolute top-4 left-4">
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-black/60 border border-white/10 rounded-full backdrop-blur-md">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-neon-red shadow-[0_0_8px_#ff0033]" />
                                                            <span className="text-[7px] font-black text-white uppercase tracking-[0.2em] font-display italic">PREMIUM AUDIO</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Answers */}
                                            {Array.isArray(quizPopupQuestion.options) && quizPopupQuestion.options.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-1.5">
                                                    {quizPopupQuestion.options.map((option, idx) => {
                                                        if (!option) return null;
                                                        const isSelected = quizPopupAnswer === option;
                                                        const isCorrect = option === quizPopupQuestion.correctAnswer;
                                                        let cls = "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/30 cursor-pointer";
                                                        if (quizPopupAnswer) {
                                                            if (isSelected && isCorrect) cls = "bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)]";
                                                            else if (isSelected && !isCorrect) cls = "bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]";
                                                            else if (!isSelected && isCorrect) cls = "bg-green-500/10 border-green-500/40 text-green-500";
                                                            else cls = "opacity-40 bg-white/5 border-white/5 text-gray-600";
                                                        }
                                                        return (
                                                            <motion.button
                                                                key={idx}
                                                                whileHover={{ scale: quizPopupAnswer ? 1 : 1.02 }}
                                                                whileTap={{ scale: quizPopupAnswer ? 1 : 0.98 }}
                                                                onClick={() => {
                                                                    if (quizPopupAnswer) return;
                                                                    setQuizPopupAnswer(option);
                                                                }}
                                                                disabled={!!quizPopupAnswer}
                                                                className={`w-full p-2.5 rounded-xl border text-left font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-between ${cls}`}
                                                            >
                                                                <span className="flex items-center gap-3">
                                                                    <span className="text-[9px] font-black opacity-60">{String.fromCharCode(65 + idx)}.</span>
                                                                    {option}
                                                                </span>
                                                                {quizPopupAnswer && isCorrect && <span className="text-base">✅</span>}
                                                                {isSelected && !isCorrect && <span className="text-base">❌</span>}
                                                            </motion.button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-xs font-bold text-center py-4">Aucune option de réponse disponible pour cette question.</p>
                                            )}

                                            {/* Result message */}
                                            {quizPopupAnswer && quizPopupQuestion.correctAnswer && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`p-4 rounded-2xl text-center font-black text-sm uppercase tracking-wider ${quizPopupAnswer === quizPopupQuestion.correctAnswer ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}
                                                >
                                                    {quizPopupAnswer === quizPopupQuestion.correctAnswer
                                                        ? '🏆 Bravo ! Bonne réponse !'
                                                        : `😅 Raté ! La bonne réponse était : ${quizPopupQuestion.correctAnswer}`}
                                                </motion.div>
                                            )}

                                            {/* Actions */}
                                            <div className="pt-1">
                                                <button
                                                    onClick={() => { setShowQuizPopup(false); setQuizPopupAnswer(null); setQuizPopupQuestion(null); }}
                                                    className="w-full py-3 bg-white/5 border border-white/10 text-gray-400 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10 transition-all active:scale-95"
                                                >
                                                    Fermer
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {showPollModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 sm:p-6"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className="w-full max-w-lg bg-black/60 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(255,18,65,0.15)]"
                            >
                                <div className="p-8 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-neon-red/10 border border-neon-red/30 flex items-center justify-center">
                                                <BarChart3 className="w-6 h-6 text-neon-red shadow-[0_0_10px_#ff1241]" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Gestion du Sondage</h2>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Créez et contrôlez les votes en direct</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowPollModal(false)}
                                            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {activePoll ? (
                                        <div className="space-y-6">
                                            <div className="p-6 bg-white/5 border border-neon-red/20 rounded-3xl space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-neon-red animate-pulse" />
                                                    <span className="text-[10px] font-black text-neon-red uppercase tracking-widest">Sondage Actif</span>
                                                </div>
                                                <h3 className="text-lg font-black text-white tracking-tight leading-snug">{activePoll.question}</h3>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {activePoll.options.map((opt, i) => (
                                                        <div key={i} className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-[9px] font-black text-gray-500 uppercase">{i + 1}. {opt}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { handleStopPoll(); setShowPollModal(false); }}
                                                className="w-full py-5 bg-neon-red text-white font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-neon-red/20 flex items-center justify-center gap-3"
                                            >
                                                <Trash2 className="w-5 h-5" /> ARRÊTER LE SONDAGE
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4 mb-2 block">Question du sondage</label>
                                                    <input
                                                        type="text"
                                                        value={pollQuestion}
                                                        onChange={(e) => setPollQuestion(e.target.value)}
                                                        placeholder="VOTRE QUESTION ICI..."
                                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs font-black text-white outline-none focus:border-neon-red transition-all uppercase placeholder:text-gray-700"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4 mb-2 block">Options de réponse</label>
                                                    {pollOptions.map((opt, i) => (
                                                        <div key={i} className="relative flex items-center">
                                                            <div className="absolute left-6 text-[10px] font-black text-neon-red">{i + 1}</div>
                                                            <input
                                                                type="text"
                                                                value={opt}
                                                                onChange={(e) => {
                                                                    const newOpts = [...pollOptions];
                                                                    newOpts[i] = e.target.value;
                                                                    setPollOptions(newOpts);
                                                                }}
                                                                placeholder={`OPTION ${i + 1}...`}
                                                                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-xs font-black text-white outline-none focus:border-neon-red transition-all uppercase placeholder:text-gray-700"
                                                            />
                                                            {pollOptions.length > 2 && (
                                                                <button
                                                                    onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                                                                    className="absolute right-4 text-gray-600 hover:text-neon-red transition-colors"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {pollOptions.length < 5 && (
                                                        <button
                                                            onClick={() => setPollOptions([...pollOptions, ""])}
                                                            className="flex items-center gap-2 text-[9px] font-black text-neon-cyan uppercase tracking-widest ml-4 hover:translate-x-1 transition-transform"
                                                        >
                                                            <Plus className="w-4 h-4" /> Ajouter une option
                                                        </button>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4 mb-2 block">Durée du sondage</label>
                                                    <div className="grid grid-cols-4 gap-2 px-2">
                                                        {['1', '3', '5', 'custom'].map(d => (
                                                            <button
                                                                key={d}
                                                                type="button"
                                                                onClick={() => setPollDuration(d)}
                                                                className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${pollDuration === d ? 'bg-neon-cyan text-black border-neon-cyan' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/30'}`}
                                                            >
                                                                {d === 'custom' ? 'Perso' : `${d} Min`}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {pollDuration === 'custom' && (
                                                        <div className="mt-3 px-2">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={customPollDuration}
                                                                onChange={e => setCustomPollDuration(parseInt(e.target.value) || 1)}
                                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-black text-white outline-none focus:border-neon-cyan"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { handleStartPoll(); setShowPollModal(false); }}
                                                className="w-full py-5 bg-neon-cyan text-black font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-neon-cyan/20 flex items-center justify-center gap-3"
                                            >
                                                <Zap className="w-5 h-5 group-hover:rotate-90 transition-transform" /> LANCER LE SONDAGE
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <style>{`
                @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-ticker { animation: ticker 120s linear infinite; width: max-content; }
                .animate-ticker:hover, #ticker-animate-container:hover { animation-play-state: paused !important; }
                @keyframes neon-pulse {
                    0% { box-shadow: 0 0 5px #ff0033, 0 0 10px #ff0033; border-color: #ff0033; }
                    50% { box-shadow: 0 0 20px #ff0033, 0 0 40px #ff0033; border-color: #ffffff; }
                    100% { box-shadow: 0 0 5px #ff0033, 0 0 10px #ff0033; border-color: #ff0033; }
                }
                .overdrive-neon {
                    animation: neon-pulse 1.5s infinite;
                }
                @keyframes frantic-shake {
                    0% { transform: translate(0,0); }
                    10% { transform: translate(-1px,-1px); }
                    20% { transform: translate(1px,0.5px); }
                    30% { transform: translate(-0.5px,1px); }
                    40% { transform: translate(1px,-1px); }
                    50% { transform: translate(-1px,0.5px); }
                    60% { transform: translate(0.5px,-1px); }
                    70% { transform: translate(-1px,1px); }
                    80% { transform: translate(1px,-0.5px); }
                    90% { transform: translate(-0.5px,-1px); }
                    100% { transform: translate(0,0); }
                }
                .overdrive-active {
                    animation: frantic-shake 0.1s infinite;
                }
                @keyframes aurora {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .bg-aurora {
                    background: linear-gradient(-45deg, #00ffff33, #bc13fe33, #ff003333, #00ffff33);
                    background-size: 400% 400%;
                    animation: aurora 15s ease infinite;
                }
                @keyframes shrink-width { 
                    0% { width: 100%; } 
                    100% { width: 0%; } 
                }
                .animate-shrink-width { animation: shrink-width 15s linear forwards; }
                @keyframes shop-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-shop-scroll { animation: shop-scroll 40s linear infinite; width: max-content; }
                .animate-shop-scroll:hover { animation-play-state: paused; }
                @keyframes glow { 0%, 100% { border-color: rgba(255, 0, 0, 0.3); } 50% { border-color: rgba(255, 0, 0, 0.8); } }
                .animate-glow { animation: glow 2s ease-in-out infinite; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                @keyframes pulse-glow { 0%, 100% { box-shadow: inset 0 0 50px rgba(255,18,65,0.2); } 50% { box-shadow: inset 0 0 100px rgba(255,18,65,0.4); } }
                .animate-pulse-glow { animation: pulse-glow 2s infinite; }
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
            `}</style>
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    type={confirmModal.type}
                />
            </>
            );
}

            export default TakeoverPage;
