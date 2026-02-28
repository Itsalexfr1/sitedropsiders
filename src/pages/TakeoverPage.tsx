import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Pencil, List, Instagram, Power, Smile, Activity,
    HelpCircle, Lock, Pin, Music2, Edit2, Plus, Zap, CheckCircle2,
    Facebook, Maximize, Minimize, Video, LayoutGrid, Heart, User, ArrowRight, Bell,
    Globe, Users, X, Youtube, Shield, Trash2, ShieldAlert, Clock, MessageSquare, Send
} from 'lucide-react';

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
    };
}

export function TakeoverPage({ settings }: TakeoverProps) {
    const [viewersCount, setViewersCount] = useState(0);
    const [showLineup, setShowLineup] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showVideoEdit, setShowVideoEdit] = useState(false);
    const [showClipModal, setShowClipModal] = useState(false);
    const [isClipping, setIsClipping] = useState(false);
    const [clipProgress, setClipProgress] = useState(0);
    const [clips, setClips] = useState<{ id: string, title: string, duration: string, date: string }[]>(() => {
        try { return JSON.parse(localStorage.getItem('user_clips') || '[]'); } catch { return []; }
    });
    const [playersOption, setPlayersOption] = useState<number>(1);
    const [favorites, setFavorites] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('favorited_artists') || '[]'); } catch { return []; }
    });
    const [notifiedArtists, setNotifiedArtists] = useState<string[]>([]);
    const [newVideoId, setNewVideoId] = useState(settings.youtubeId);
    const [isUnlocked, setIsUnlocked] = useState(() => {
        if (!settings.isSecret) return true;
        // Check if already unlocked in this session
        return sessionStorage.getItem('takeover_unlocked') === 'true';
    });
    const [enteredPassword, setEnteredPassword] = useState('');
    const [passwordError, setPasswordError] = useState(false);

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
                const approxEnd = (startMinutes + 90) % 1440;
                const timeDiff = (currentTotal - approxEnd + 1440) % 1440;
                if (timeDiff >= 0 && timeDiff < 720) {
                    isPast = true;
                }
            }

            return { time: startTime, endTime, artist, stage, instagram, isPast };
        });
    }, []);


    const [editTitle, setEditTitle] = useState(settings.title || 'LIVE TAKEOVER');
    const [editMainFluxName, setEditMainFluxName] = useState(settings.mainFluxName || 'MAIN STAGE');
    const [displayLineup, setDisplayLineup] = useState(settings.lineup || '');
    const [activeVideoIndex, setActiveVideoIndex] = useState(() => {
        // Deactivate main flux by default (if disableMainPlayer is true or undefined)
        const isDisabled = settings.disableMainPlayer !== false;
        return isDisabled ? 1 : 0;
    });
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 5000); // Mise à jour toutes les 5 secondes
        return () => clearInterval(timer);
    }, []);

    // Dynamic Video List with Titles
    const channelItems = useMemo(() => {
        const items = [];
        if (settings.youtubeId) {
            items.push({ id: settings.youtubeId.trim(), title: settings.mainFluxName || 'Flux Principal', isMain: true });
        }
        if (settings.channels) {
            settings.channels.split('\n').filter((l: string) => l.trim()).forEach((line: string) => {
                const [id, ...titleParts] = line.split(':');
                if (id && id.trim()) {
                    items.push({ id: id.trim(), title: titleParts.join(':').trim() || 'CAM', isMain: false });
                }
            });
        }
        return items;
    }, [settings.youtubeId, settings.channels, settings.mainFluxName]);

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
                handleUpdateSettings({ isOnline: shouldBeOnline });
            }
        };

        const interval = setInterval(checkSchedule, 30000); // Check every 30s
        checkSchedule();
        return () => clearInterval(interval);
    }, [settings.startDate, settings.endDate, settings.isOnline]);

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

    // Calculate current artist for the selected stage/flux
    const fluxCurrentArtist = useMemo(() => {
        const now = new Date();
        const currentTotal = now.getHours() * 60 + now.getMinutes();

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
            .find(i => i.total <= currentTotal && !i.isPast);

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


    const [displayTitle, setDisplayTitle] = useState(settings.title || 'LIVE TAKEOVER');
    const [editLineup, setEditLineup] = useState(settings.lineup || '');
    const [lineupEndHour, setLineupEndHour] = useState("");
    const [lineupEndMinute, setLineupEndMinute] = useState("");

    const [fluxPrincipal, setFluxPrincipal] = useState(settings.youtubeId ? `https://youtube.com/watch?v=${settings.youtubeId}` : '');
    const [stage1, setStage1] = useState(() => {
        const lines = (settings.channels || '').split('\n').filter(Boolean);
        return lines[0] ? `https://youtube.com/watch?v=${lines[0].split(':')[0]}` : '';
    });


    const [localPinnedMessage, setLocalPinnedMessage] = useState(settings.pinnedMessage ?? '');
    const [, setEditCurrentArtist] = useState(settings.currentArtist || '');
    const [, setEditArtistInstagram] = useState(settings.artistInstagram || '');
    const [localCustomCommands, setLocalCustomCommands] = useState(settings.customCommands || '');
    const [localModerators, setLocalModerators] = useState(settings.moderators || '');
    const [annBannerEnabled, setAnnBannerEnabled] = useState(false);
    const [annBannerText, setAnnBannerText] = useState('');
    const [annBannerColor, setAnnBannerColor] = useState('#ffffff');
    const [annBannerBg, setAnnBannerBg] = useState('#0a0a0a');
    const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
    const [allShopProducts, setAllShopProducts] = useState<any[]>([]);

    const handleCreateClip = () => {
        setIsClipping(true);
        setClipProgress(0);

        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            setClipProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setIsClipping(false);
                const newClip = {
                    id: Math.random().toString(36).substr(2, 9),
                    title: `Extrait Live - ${channelItems[activeVideoIndex]?.title || 'Main Stage'}`,
                    duration: '0:30',
                    date: new Date().toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                };
                const updatedClips = [newClip, ...clips];
                setClips(updatedClips);
                localStorage.setItem('user_clips', JSON.stringify(updatedClips));
            }
        }, 150); // Simule 3 secondes de capture
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
            await fetch('/api/settings', {
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
        } catch (e: any) {
            console.error('Failed to save announcement banner', e);
        }
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

        setShowTopBanner(settings.showTopBanner ?? true);
        setShowTickerBanner(settings.showTickerBanner ?? true);
        setLocalPinnedMessage(settings.pinnedMessage ?? '');
        setEditCurrentArtist(settings.currentArtist || '');
        setEditArtistInstagram(settings.artistInstagram || '');
        setLocalCustomCommands(settings.customCommands || '');
        setLocalModerators(settings.moderators || '');
        setShowShopWidget(settings.showShop ?? false);
    }, [settings.title, settings.lineup, settings.youtubeId, settings.channels, settings.showTopBanner, settings.showTickerBanner, settings.pinnedMessage, settings.currentArtist, settings.artistInstagram, settings.customCommands, settings.moderators, settings.showShop]);

    // Automatic cleanup of past artists from the planning
    useEffect(() => {
        if (!settings.lineup) return;

        const cleanupPlanning = async () => {
            const items = parseLineup(settings.lineup || '');
            const activeItems = items.filter(i => !i.isPast);

            if (activeItems.length !== items.length) {
                // Reconstruct the lineup text
                const newText = activeItems.map(i => {
                    const timeStr = i.endTime ? `${i.time}-${i.endTime}` : i.time;
                    return `[${timeStr}] ${i.artist} - ${i.stage} - ${i.instagram || ''}`;
                }).join('\n');

                if (newText !== settings.lineup) {
                    console.log('[Takeover] Auto-cleaning past artists from planning...');
                    await handleUpdateSettings({ lineup: newText });
                }
            }
        };

        const interval = setInterval(cleanupPlanning, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [settings.lineup, parseLineup]);
    const [isSaving, setIsSaving] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'planning' | 'mods' | 'bot' | 'ticker' | 'moderation' | 'shop'>('general');
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

    // Local state for settings modal to avoid multiple builds
    const [localSettings, setLocalSettings] = useState<Partial<TakeoverProps['settings']>>({});
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
    const [isLocalBanned, setIsLocalBanned] = useState(false);
    const [banTimestamp, setBanTimestamp] = useState<number | null>(null);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [pseudo, setPseudo] = useState(() => {
        const adminAuth = localStorage.getItem('admin_auth') === 'true';
        if (adminAuth) return localStorage.getItem('admin_user')?.toUpperCase() || 'ADMIN';
        return localStorage.getItem('chat_pseudo') || '';
    });
    const [isJoined, setIsJoined] = useState(() => {
        const adminAuth = localStorage.getItem('admin_auth') === 'true';
        const editeurAuth = localStorage.getItem('editeur_auth') === 'true';
        return adminAuth || editeurAuth || localStorage.getItem('chat_joined') === 'true';
    });
    const [showShazamInfo, setShowShazamInfo] = useState(false);

    useEffect(() => {
        const banned = localStorage.getItem('chat_banned') === 'true';
        const timestamp = localStorage.getItem('chat_ban_timestamp');
        if (banned) {
            setIsLocalBanned(true);
            if (timestamp) setBanTimestamp(parseInt(timestamp));
        }
    }, []);

    const handleUnbanRequest = async () => {
        if (!banTimestamp) return;
        const now = Date.now();
        const tenMinutes = 10 * 60 * 1000;
        if (now - banTimestamp < tenMinutes) {
            const remaining = Math.ceil((tenMinutes - (now - banTimestamp)) / 60000);
            alert(`Vous devez attendre encore ${remaining} minutes avant de pouvoir faire une demande.`);
            return;
        }

        try {
            const response = await fetch('/api/chat/unban-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pseudo: pseudo.toUpperCase(),
                    email,
                    timestamp: banTimestamp
                })
            });
            if (response.ok) {
                alert("Votre demande a été envoyée avec succès.");
            } else {
                alert("Erreur lors de l'envoi de la demande.");
            }
        } catch (err: any) {
            alert("Erreur de connexion.");
        }
    };
    const isFocusMode = false;
    const [email] = useState('');
    const [country, setCountry] = useState(() => {
        const auth = localStorage.getItem('admin_auth') === 'true';
        if (auth) return 'FR';
        return '';
    });
    const [customCountry] = useState('');
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
    const [showUsersPanel, setShowUsersPanel] = useState(true);

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
    const [recentShazams] = useState<string[]>([]);
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



    // Fetch messages from server every 3 seconds
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

                        // Auto-scroll
                        const chatContainer = document.getElementById('chat-messages');
                        if (chatContainer) {
                            const isAtBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100;
                            if (isAtBottom) {
                                setTimeout(() => { chatContainer.scrollTop = chatContainer.scrollHeight; }, 50);
                            }
                        }
                    }
                })
                .catch(() => { });
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [currentVideoId, activePoll, userColor, pseudo, country]); // Added activePoll, userColor, pseudo, country to dependencies for parseLineup to be stable

    // Polling Settings periodically to sync Shop, Pinned Message, etc globally
    useEffect(() => {
        const pollSettings = async () => {
            try {
                const res = await fetch('/api/settings');
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
                    }
                }
            } catch (err: any) { }
        };

        const interval = setInterval(pollSettings, 5000); // Sync every 5s
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

    const adminAuth = localStorage.getItem('admin_auth') === 'true';
    const adminUser = localStorage.getItem('admin_user')?.toUpperCase() || '';
    const isAdmin = adminAuth && (pseudo === 'DROPSIDERS' || pseudo === adminUser || pseudo === 'ADMIN');
    const isModo = settings.moderators?.split(',').map(s => s.trim().toUpperCase()).includes(pseudo?.toUpperCase() || '') || hasTakeoverModoPerm || promotedModos.includes(pseudo.toUpperCase());
    const hasModPowers = isAdmin || isModo;

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

    const handleSendPoll = () => {
        if (!pollQuestion) return;
        let msg = `📊 SONDAGE : ${pollQuestion}\n`;
        msg += pollOptions.filter(o => o.trim()).map((o, i) => `${i + 1}. ${o}`).join('\n');
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
        setPollQuestion("");
        setPollOptions(["", ""]);
    };

    const handleStopPoll = async () => {
        if (!activePoll) return;
        const password = localStorage.getItem('admin_password') || '';
        const username = localStorage.getItem('admin_user') || 'alex';
        const sessionId = localStorage.getItem('admin_session_id') || '';

        // Optional: you can just send a flag message or delete the message
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
                const lineup = parseLineup(settings.lineup || '');
                const current = [...lineup].filter(i => i.isPast).pop();
                const artistName = settings.currentArtist || current?.artist || "Aucun artiste annoncé";
                response = `🎤 L'artiste en live actuellement : ${artistName.toUpperCase()} ! 🔥`;
            } else if (cmd === '!instagram' || cmd === '!insta') {
                const lineup = parseLineup(settings.lineup || '');
                const current = [...lineup].filter(i => i.isPast).pop();
                const insta = current?.instagram || settings.artistInstagram || "@DROPSIDERS";
                response = `📸 Instagram de l'artiste : ${insta} ! ✨`;
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
                        color: '#00ffcc'
                    })
                });
            }, 500);
            setIsSending(false);
            return;
        }

        if (msgText.startsWith('!')) {
            await processBotCommand(msgText);
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
                        setShazamResult({
                            title: data.result.title,
                            artist: data.result.artist,
                            image: data.result.spotify?.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop",
                            spotify: data.result.spotify?.external_urls?.spotify || "https://open.spotify.com"
                        });
                        setShowShazamNotify(true);

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
                    color: '#00ffcc'
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

    const isServerAdmin = adminAuth === true;

    // State for command edition
    const [cmdTrigger, setCmdTrigger] = useState('');
    const [cmdResponse, setCmdResponse] = useState('');
    const [isEditingCmd, setIsEditingCmd] = useState<string | null>(null);

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
                    color: '#00ffcc'
                })
            });
            setExpandedUserId(null);
        } catch (e: any) { console.error(e); }
    };

    const handleUpdateSettings = useCallback(async (updates: Partial<TakeoverProps['settings']>) => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/settings');
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
                        adminBgColor: updates.adminBgColor ?? adminBgColor
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

    const handleToggleLive = async () => {
        const isCurrentlyOnline = settings.isOnline;
        const action = isCurrentlyOnline ? 'couper' : 'lancer';
        if (!window.confirm(`Voulez-vous vraiment ${action} le LIVE ?`)) return;
        handleUpdateSettings({ isOnline: !isCurrentlyOnline });
    };



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
        <div className={`fixed ${showTopBanner && !isFullScreen ? 'top-[70px] lg:top-32' : 'top-0'} left-0 right-0 bottom-0 flex flex-col bg-black overflow-hidden z-[50] transition-all duration-500`}>
            {/* Live Banner Header - Conditionally based on top banner enabled */}
            {showTopBanner && !isFocusMode && !isFullScreen && (
                <div className="w-full bg-[#111] border-b border-white/10 px-6 py-4 flex items-center justify-between z-20 shadow-2xl shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center gap-1.5">
                            <div className="flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-full shrink-0">
                                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none">EN DIRECT</span>
                            </div>
                            <div
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] border border-white/10 rounded-full cursor-pointer hover:bg-white/10 transition-all shadow-lg"
                                onClick={() => setShowUsersPanel(!showUsersPanel)}
                            >
                                <span className="text-[9px] font-black text-neon-red uppercase tracking-[0.2em] leading-none flex items-center gap-2">
                                    <Users className="w-3 h-3" />
                                    {viewersCount > 0 ? viewersCount.toLocaleString('fr-FR') : (allActiveUsers.length || '...')}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h1 id="takeover-title" className="text-sm md:text-xl font-display font-black text-white uppercase italic tracking-widest truncate max-w-[150px] md:max-w-none">
                                {displayTitle}
                            </h1>
                            {fluxCurrentArtist.artist && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2"
                                >
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/40 border border-white/10 rounded-lg backdrop-blur-md">
                                        <Music2 className="w-2.5 h-2.5 text-neon-cyan shadow-[0_0_8px_#00ffff66]" />
                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest whitespace-nowrap">
                                            NOW: <span className="text-white">{fluxCurrentArtist.artist}</span>
                                        </span>
                                        {fluxCurrentArtist.instagram && (
                                            <a
                                                href={fluxCurrentArtist.instagram}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-1 p-0.5 hover:bg-neon-purple/20 rounded text-neon-purple transition-all"
                                                title="Instagram de l'artiste"
                                            >
                                                <Instagram className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>


                        {/* Multi-Video Switcher */}
                        {channelItems.length > 1 && (
                            <div className="flex items-center flex-wrap gap-2">
                                <div id="channel-switcher" className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                                    {channelItems.map((item: any, idx) => {
                                        const isDisabled = settings.disableMainPlayer !== false;
                                        if (item.isMain && isDisabled) return null;
                                        return (
                                            <button
                                                key={idx}
                                                id={`channel-btn-${idx}`}
                                                onClick={() => { setActiveVideoIndex(idx); setPlayersOption(1); }}
                                                className={`px-3 h-6 rounded flex items-center justify-center text-[10px] font-black transition-all ${activeVideoIndex === idx && playersOption === 1 ? 'bg-neon-red text-white' : 'text-gray-500 hover:bg-white/10'}`}
                                            >
                                                {item.title}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1 h-8">
                                    {[1, 2, 3, 4].filter(n => n <= channelItems.length).map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setPlayersOption(n)}
                                            className={`min-w-[28px] h-full rounded flex items-center justify-center text-[10px] font-black transition-all ${playersOption === n ? 'bg-neon-cyan text-black' : 'text-gray-500 hover:bg-white/10'}`}
                                            title={n > 1 ? `Vue ${n} écrans` : `Vue unique`}
                                        >
                                            {n === 1 ? <Maximize className="w-3 h-3" /> : <LayoutGrid className="w-3 h-3 mr-0.5" />} {n > 1 && n}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            {hasModPowers && (
                                <button
                                    id="admin-edit-btn"
                                    onClick={() => setShowEditModal(true)}
                                    className="p-1.5 bg-white/5 hover:bg-neon-red/20 border border-white/10 hover:border-neon-red/30 rounded-lg text-gray-400 hover:text-neon-red transition-all shrink-0"
                                    title="Modifier le Live"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <button
                                onClick={() => setShowClipModal(true)}
                                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg bg-white/5 border-white/10 text-gray-400 hover:text-neon-purple hover:border-neon-purple/30`}
                                title="Clip & VOD"
                            >
                                <Video className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Clip / VOD</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (showLineup) {
                                        setShowLineup(false);
                                    } else {
                                        setShowVideoEdit(false);
                                        setShowLineup(true);
                                    }
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${showLineup ? 'bg-neon-red text-white border-neon-red' : 'bg-white/5 border-white/10 text-gray-400 hover:text-neon-red hover:border-neon-red/30 animate-glow'}`}
                            >
                                <List className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Planning</span>
                            </button>
                            <button
                                onClick={() => setIsFullScreen(!isFullScreen)}
                                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${isFullScreen ? 'bg-neon-cyan text-black border-neon-cyan' : 'bg-white/5 border-white/10 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/30'}`}
                                title={isFullScreen ? "Quitter le plein écran" : "Mode plein écran"}
                            >
                                {isFullScreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                                <span className="hidden sm:inline">{isFullScreen ? "Réduire" : "Plein écran"}</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 bg-white/5 border border-white/10 rounded-xl h-9">
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-gray-500 hover:text-blue-500 transition-colors"
                                title="Partager sur Facebook"
                            >
                                <Facebook className="w-3.5 h-3.5" />
                            </a>
                            <div className="w-[1px] h-3 bg-white/10" />
                            <a
                                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(settings.title || 'Dropsiders Live')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-gray-500 hover:text-white transition-colors"
                                title="Partager sur X"
                            >
                                <XIcon className="w-3.5 h-3.5" />
                            </a>
                            <div className="w-[1px] h-3 bg-white/10" />
                            <a
                                href={`https://www.snapchat.com/share?url=${encodeURIComponent(window.location.href)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-gray-500 hover:text-yellow-400 transition-colors"
                                title="Partager sur Snapchat"
                            >
                                <SnapchatIcon className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                sessionStorage.setItem('exited_live', 'true');
                                window.location.href = '/';
                            }}
                            className="p-2 bg-white/5 hover:bg-neon-red/20 border border-white/10 hover:border-neon-red/30 rounded-full text-gray-400 hover:text-neon-red transition-all"
                            title="Quitter le Live"
                        >
                            <X className="w-4 h-4" />
                        </button>
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

            <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-black gap-0">
                {/* Video Section */}
                <div className="flex-shrink-0 lg:flex-1 w-full lg:w-auto bg-black flex flex-col relative border-b lg:border-b-0 lg:border-r border-white/10 group overflow-hidden">
                    <div className="w-full aspect-video lg:aspect-auto lg:flex-1 relative bg-black group overflow-hidden">
                        {/* Stream Name Badge */}
                        {/* Redundant Stream Name Badge removed */}
                        <div className="absolute inset-0 z-0 bg-black">
                            {(settings.disableMainPlayer === false || activeVideoIndex !== 0 || playersOption > 1) ? (
                                <div className={`w-full h-full grid ${playersOption === 1 ? 'grid-cols-1 grid-rows-1' : playersOption === 2 ? 'grid-cols-2 grid-rows-1' : playersOption === 3 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-2 grid-rows-2'} gap-0.5 bg-white/10`}>
                                    {Array.from({ length: playersOption }).map((_, i) => {
                                        const cIdx = (activeVideoIndex + i) % channelItems.length;
                                        const channel = channelItems[cIdx];
                                        if (!channel) return null;
                                        return (
                                            <div key={`${channel.id}-${i}`} className="relative bg-black w-full h-full">
                                                {playersOption > 1 && (
                                                    <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/20 text-[9px] font-black text-white uppercase tracking-widest shadow-lg pointer-events-none">
                                                        {channel.title}
                                                    </div>
                                                )}
                                                <iframe
                                                    className="w-full h-full border-none"
                                                    src={`https://www.youtube.com/embed/${channel.id}?autoplay=1&mute=${i > 0 ? '1' : '0'}&rel=0&modestbranding=1&enablejsapi=1`}
                                                    title={channel.title}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 backdrop-blur-3xl p-10 text-center">
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Flux Principal <span className="text-neon-red">Désactivé</span></h3>
                                    <p className="text-gray-400 text-sm max-w-md">Veuillez sélectionner un autre flux dans le switcher ci-dessus (Stage 1, 2, 3 ou 4) pour continuer le visionnage.</p>
                                </div>
                            )}
                        </div>

                        {/* Active Poll Overlay */}
                        <AnimatePresence>
                            {!isFocusMode && activePoll && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="absolute bottom-24 lg:bottom-16 left-4 lg:left-8 z-30 w-[250px] lg:w-[320px] bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl"
                                >
                                    <h3 className="text-[10px] lg:text-xs font-black text-white uppercase italic tracking-widest mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-neon-red animate-pulse" />
                                        Sondage en cours
                                    </h3>
                                    <p className="text-[11px] font-bold text-white mb-4">{activePoll.question}</p>
                                    <div className="space-y-2">
                                        {activePoll.options.map((opt, i) => {
                                            const totalVotes = messages.filter(m => /^[1-9][0-9]*$/.test(m.message.trim())).length;
                                            const optVotes = messages.filter(m => m.message.trim() === String(i + 1)).length;
                                            const percentage = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={async () => {
                                                        if (!isJoined) return alert("Rejoignez le chat pour voter !");
                                                        setNewMessage(String(i + 1));
                                                        // Auto send vote
                                                        await fetch('/api/chat/messages', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                pseudo: pseudo.toUpperCase(),
                                                                country: country || 'FR',
                                                                message: String(i + 1),
                                                                color: userColor
                                                            })
                                                        });
                                                        setNewMessage('');
                                                    }}
                                                    className="w-full relative h-10 group/vote bg-white/5 hover:bg-white/10 rounded-xl overflow-hidden flex items-center px-4 border border-white/5 hover:border-neon-red/30 transition-all duration-300"
                                                >
                                                    <div className="absolute left-0 top-0 bottom-0 bg-neon-red/20 transition-all duration-700 ease-out" style={{ width: `${percentage}%` }} />
                                                    <span className="relative z-10 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                                                        <span className="w-5 h-5 flex items-center justify-center bg-black/40 rounded-md text-gray-400 group-hover/vote:text-neon-red transition-colors">{i + 1}</span>
                                                        {opt}
                                                    </span>
                                                    <span className="relative z-10 text-[11px] font-black text-neon-red ml-auto drop-shadow-[0_0_5px_rgba(255,0,51,0.5)]">{percentage}%</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <p className="text-[7px] text-gray-400 uppercase tracking-widest mt-3 text-center">Répondez avec le chiffre - Ex: 1</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Mini Planning Widget */}
                        <AnimatePresence>
                            {!isFocusMode && showLineup && (
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
                                                    className="group grid grid-cols-[80px_1fr_1fr] lg:grid-cols-[100px_1fr_1fr] gap-4 lg:gap-8 items-center bg-white/[0.015] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] p-5 lg:p-7 rounded-[2rem] transition-all duration-500 mb-2 relative overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-neon-red/0 via-white/0 to-white/0 group-hover:from-white/[0.02] transition-colors pointer-events-none" />
                                                    {/* Time Column */}
                                                    <div className="flex flex-col">
                                                        <span className="text-white/40 font-black text-[13px] lg:text-[15px] tracking-tight group-hover:text-white transition-colors duration-500">
                                                            {item.time?.replace(':', 'H') || '--H--'}
                                                            {item.endTime && (
                                                                <span className="block opacity-40 text-[10px] lg:text-[11px] mt-0.5">
                                                                    {item.endTime.replace(':', 'H')}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>

                                                    {/* Artist Column */}
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <h3 className="text-white font-black uppercase italic tracking-wider text-[16px] lg:text-[22px] leading-tight truncate group-hover:translate-x-1 transition-transform duration-500">
                                                            {item.artist || '---'}
                                                        </h3>
                                                        {fluxCurrentArtist.artist === item.artist && activeVideoIndex === 0 && (
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
                                                    <div className="flex items-center justify-end pr-8">
                                                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] px-4 py-1.5 bg-white/5 border border-white/5 rounded-full whitespace-nowrap group-hover:border-white/10 group-hover:text-white/70 transition-all duration-500">
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
                            )}
                        </AnimatePresence>

                        {/* Admin: Change Video popover */}
                        <AnimatePresence>
                            {!isFocusMode && showVideoEdit && hasModPowers && (
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
                            )}
                        </AnimatePresence>

                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <button
                                onClick={() => setShowShazamInfo(true)}
                                disabled={shazamLoading}
                                className={`flex items-center gap-3 px-6 py-3 bg-black/80 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all backdrop-blur-md shadow-2xl active:scale-95 group ${shazamLoading ? 'border-neon-cyan' : 'hover:bg-neon-cyan hover:border-neon-cyan/50'}`}
                            >
                                <Music2 className={`w-4 h-4 text-neon-cyan group-hover:text-white ${shazamLoading ? 'animate-spin' : ''}`} />
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
                                                <Music2 className="w-6 h-6 text-neon-cyan drop-shadow-[0_0_8px_#00ffff]" />
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
                                        className="w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative"
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
                                        <div className="p-6 lg:p-8 flex-1 overflow-y-auto min-h-[400px]">
                                            <div className="mb-10 p-6 bg-white/[0.02] border border-white/10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
                                                <div className="flex-1">
                                                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-2">
                                                        <Zap className="w-4 h-4 text-neon-purple" />
                                                        Capturer un Instant
                                                    </h3>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em]">Générez un clip vidéo des 30 dernières secondes du flux sélectionné. Vous pourrez ensuite le partager sur vos réseaux.</p>
                                                </div>
                                                <button
                                                    onClick={handleCreateClip}
                                                    disabled={isClipping}
                                                    className="relative w-full md:w-auto overflow-hidden px-8 py-4 bg-neon-purple/20 text-neon-purple border border-neon-purple/40 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-neon-purple hover:text-white transition-all shadow-[0_0_20px_rgba(188,19,254,0.15)] group shrink-0 active:scale-95 disabled:opacity-50"
                                                >
                                                    {isClipping ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-3 h-3 rounded-full bg-neon-purple animate-ping absolute" />
                                                            <div className="w-3 h-3 rounded-full bg-neon-purple" />
                                                            Création en cours {clipProgress}%...
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <Video className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                            Créer un Clip Maintenent
                                                        </div>
                                                    )}
                                                    {isClipping && (
                                                        <div className="absolute bottom-0 left-0 h-1 bg-neon-purple shadow-[0_0_10px_#bc13fe] transition-all duration-150" style={{ width: `${clipProgress}%` }} />
                                                    )}
                                                </button>
                                            </div>

                                            <h3 className="text-xs font-black text-white/50 uppercase tracking-[0.3em] mb-4 pl-4 border-l-2 border-white/10">Mes Clips ({clips.length})</h3>

                                            {clips.length === 0 ? (
                                                <div className="text-center py-16 flex flex-col items-center justify-center space-y-4 bg-black/40 border border-white/5 rounded-3xl mt-4">
                                                    <div className="relative group">
                                                        <div className="absolute inset-0 bg-neon-purple blur-xl opacity-10" />
                                                        <Video className="w-12 h-12 text-white/10 relative z-10" />
                                                    </div>
                                                    <h3 className="text-sm font-black text-white/50 uppercase tracking-widest mt-2">Aucun Clip pour le moment</h3>
                                                    <p className="text-[9px] text-gray-500 max-w-sm px-6 font-bold uppercase tracking-widest">Lancez une capture pour générer votre premier clip vidéo du live.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {clips.map(clip => (
                                                        <div key={clip.id} className="relative group overflow-hidden bg-black/60 border border-white/10 rounded-3xl p-5 hover:border-white/20 transition-all">
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0 pointer-events-none" />
                                                            <div className="relative z-10">
                                                                <div className="flex items-start justify-between mb-4">
                                                                    <div className="p-2 bg-neon-purple/10 border border-neon-purple/20 rounded-xl text-neon-purple">
                                                                        <Video className="w-4 h-4" />
                                                                    </div>
                                                                    <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-white/50 font-mono tracking-wider">{clip.duration}</span>
                                                                </div>
                                                                <h4 className="text-white font-black uppercase text-sm italic tracking-tight mb-1 truncate">{clip.title}</h4>
                                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-6">Enregistré le {clip.date}</p>

                                                                <div className="flex gap-2">
                                                                    <a href="https://instagram.com/create/story" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] rounded-xl text-[8px] font-black uppercase text-white hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(230,104,60,0.2)]">
                                                                        <Instagram className="w-3.5 h-3.5" /> Story IG
                                                                    </a>
                                                                    <a href="https://tiktok.com/upload" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white/10 border border-white/20 hover:bg-white hover:text-black rounded-xl text-[8px] font-black uppercase text-white hover:opacity-90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                                                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                                                                        TikTok
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
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
                                                Live / Vidéo
                                                {activeSettingsTab === 'general' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-red" />}
                                            </button>
                                            <button
                                                onClick={() => setActiveSettingsTab('ticker')}
                                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex-shrink-0 ${activeSettingsTab === 'ticker' ? 'text-neon-red' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Bandeau
                                                {activeSettingsTab === 'ticker' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-red" />}
                                            </button>
                                            <button
                                                onClick={() => setActiveSettingsTab('moderation')}
                                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex-shrink-0 ${activeSettingsTab === 'moderation' ? 'text-neon-red' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Sécurité & Équipe
                                                {activeSettingsTab === 'moderation' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-red" />}
                                            </button>
                                            <button
                                                onClick={() => setActiveSettingsTab('planning')}
                                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex-shrink-0 ${activeSettingsTab === 'planning' ? 'text-neon-red' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Planning
                                                {activeSettingsTab === 'planning' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-red" />}
                                            </button>
                                            <button
                                                onClick={() => setActiveSettingsTab('shop')}
                                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex-shrink-0 ${activeSettingsTab === 'shop' ? 'text-neon-cyan' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Shop
                                                {activeSettingsTab === 'shop' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-cyan" />}
                                            </button>
                                            <button
                                                onClick={() => setActiveSettingsTab('bot')}
                                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex-shrink-0 ${activeSettingsTab === 'bot' ? 'text-neon-red' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Bot
                                                {activeSettingsTab === 'bot' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-red" />}
                                            </button>
                                        </div>

                                        {/* Tab Content */}
                                        <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                                            {activeSettingsTab === 'general' && (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        <div className="space-y-4 bg-white/5 border border-white/5 p-4 lg:p-6 rounded-[2rem]">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="p-2 bg-neon-red/10 rounded-xl">
                                                                    <Activity className="w-4 h-4 text-neon-red" />
                                                                </div>
                                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Configuration <span className="text-neon-red">Affichage</span></h3>
                                                            </div>
                                                            <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                                                                <div className="flex flex-col">
                                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Menu</label>
                                                                    <span className="text-[8px] text-gray-600 font-bold uppercase">{settings.isOnline ? 'Online Menu Active' : 'Offline Menu Active'}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleUpdateSettings({ isOnline: !settings.isOnline })}
                                                                    className={`w-12 h-6 rounded-full p-1 transition-all ${settings.isOnline ? 'bg-green-500 shadow-[0_0_15px_#22c55e44]' : 'bg-gray-800'}`}
                                                                >
                                                                    <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${settings.isOnline ? 'translate-x-6' : 'translate-x-0'}`} />
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                                                                <div className="flex flex-col">
                                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Flux Principal</label>
                                                                    <span className="text-[8px] text-gray-600 font-bold uppercase">{settings.disableMainPlayer !== false ? 'Désactivé' : 'Activé'}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleUpdateSettings({ disableMainPlayer: settings.disableMainPlayer === false ? true : false })}
                                                                    className={`w-12 h-6 rounded-full p-1 transition-all ${settings.disableMainPlayer === false ? 'bg-neon-cyan shadow-[0_0_15px_#00ffff44]' : 'bg-gray-800'}`}
                                                                >
                                                                    <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${settings.disableMainPlayer === false ? 'translate-x-6' : 'translate-x-0'}`} />
                                                                </button>
                                                            </div>
                                                            <div className="pt-2 grid grid-cols-2 gap-3">
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Début du Live (Optionnel)</label>
                                                                    <input type="datetime-local" value={localSettings.startDate || ''} onChange={e => handleUpdateLocalSetting({ startDate: e.target.value })} className="w-full bg-black/60 border border-white/10 rounded-xl p-2 text-[10px] font-bold text-white outline-none focus:border-neon-red" />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Fin du Live (Optionnel)</label>
                                                                    <input type="datetime-local" value={localSettings.endDate || ''} onChange={e => handleUpdateLocalSetting({ endDate: e.target.value })} className="w-full bg-black/60 border border-white/10 rounded-xl p-2 text-[10px] font-bold text-white outline-none focus:border-neon-red" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4 bg-white/5 border border-white/5 p-4 lg:p-6 rounded-[2rem]">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="p-2 bg-neon-red/10 rounded-xl">
                                                                    <Youtube className="w-4 h-4 text-neon-red" />
                                                                </div>
                                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Paramètres <span className="text-neon-red">Média</span></h3>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">INSTAGRAM</label>
                                                                    <input
                                                                        type="text"
                                                                        value={editTitle}
                                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                                        className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-red transition-all"
                                                                        placeholder="TITRE DU LIVE..."
                                                                    />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">NOM DU FLUX PRINCIPAL</label>
                                                                    <input
                                                                        type="text"
                                                                        value={editMainFluxName}
                                                                        onChange={(e) => setEditMainFluxName(e.target.value)}
                                                                        className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-red transition-all"
                                                                        placeholder="ex: MAIN STAGE..."
                                                                    />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Flux Principal (Lien YouTube)</label>
                                                                    <div className="flex gap-2">
                                                                        <input
                                                                            type="text"
                                                                            value={fluxPrincipal}
                                                                            onChange={(e) => setFluxPrincipal(e.target.value)}
                                                                            className="flex-1 bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-red transition-all"
                                                                            placeholder="ex: https://youtube.com/watch?v=..."
                                                                        />
                                                                        <button
                                                                            onClick={() => {
                                                                                alert('Lien Principal Validé !');
                                                                            }}
                                                                            className="px-4 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase text-white hover:bg-neon-red hover:text-white transition-all"
                                                                        >
                                                                            VALIDER
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4 bg-white/5 border border-white/5 p-4 lg:p-6 rounded-[2rem]">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="p-2 bg-neon-cyan/10 rounded-xl"><Youtube className="w-4 h-4 text-neon-cyan" /></div>
                                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Stage <span className="text-neon-cyan">1 + 2</span></h3>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">NOM STAGE 1</label>
                                                                        <input type="text" value={stage1Name} onChange={e => setStage1Name(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-cyan transition-all" placeholder="ex: STAGE 1" />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">NOM STAGE 2</label>
                                                                        <input type="text" value={stage2Name} onChange={e => setStage2Name(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-cyan transition-all" placeholder="ex: STAGE 2" />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Lien YouTube Stage 1</label>
                                                                    <div className="flex gap-2">
                                                                        <input type="text" value={stage1} onChange={e => setStage1(e.target.value)} className="flex-1 bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-cyan transition-all" placeholder="https://youtube.com/watch?v=..." />
                                                                        <button onClick={() => alert('Stage 1 Validé !')} className="px-4 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase text-white hover:bg-neon-cyan hover:text-black transition-all">VALIDER</button>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Lien YouTube Stage 2</label>
                                                                    <div className="flex gap-2">
                                                                        <input type="text" value={stage2} onChange={e => setStage2(e.target.value)} className="flex-1 bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-cyan transition-all" placeholder="https://youtube.com/watch?v=..." />
                                                                        <button onClick={() => alert('Stage 2 Validé !')} className="px-4 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase text-white hover:bg-neon-cyan hover:text-black transition-all">VALIDER</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4 bg-white/5 border border-white/5 p-4 lg:p-6 rounded-[2rem]">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="p-2 bg-neon-cyan/10 rounded-xl"><Youtube className="w-4 h-4 text-neon-cyan" /></div>
                                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Stage <span className="text-neon-cyan">3 + 4</span></h3>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">NOM STAGE 3</label>
                                                                        <input type="text" value={stage3Name} onChange={e => setStage3Name(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-cyan transition-all" placeholder="ex: STAGE 3" />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">NOM STAGE 4</label>
                                                                        <input type="text" value={stage4Name} onChange={e => setStage4Name(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-cyan transition-all" placeholder="ex: STAGE 4" />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Lien YouTube Stage 3</label>
                                                                    <div className="flex gap-2">
                                                                        <input type="text" value={stage3} onChange={e => setStage3(e.target.value)} className="flex-1 bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-cyan transition-all" placeholder="https://youtube.com/watch?v=..." />
                                                                        <button onClick={() => alert('Stage 3 Validé !')} className="px-4 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase text-white hover:bg-neon-cyan hover:text-black transition-all">VALIDER</button>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Lien YouTube Stage 4</label>
                                                                    <div className="flex gap-2">
                                                                        <input type="text" value={stage4} onChange={e => setStage4(e.target.value)} className="flex-1 bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-cyan transition-all" placeholder="https://youtube.com/watch?v=..." />
                                                                        <button onClick={() => alert('Stage 4 Validé !')} className="px-4 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase text-white hover:bg-neon-cyan hover:text-black transition-all">VALIDER</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeSettingsTab === 'ticker' && (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        {/* Ticker Banner Control (Bandeau 1) */}
                                                        <div className="space-y-4 bg-white/5 border border-white/5 p-6 rounded-[2rem]">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-neon-red/10 rounded-xl">
                                                                        <Activity className="w-4 h-4 text-neon-red" />
                                                                    </div>
                                                                    <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Bandeau 1 <span className="text-neon-red">(Défilant)</span></h3>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleUpdateLocalSetting({ showTickerBanner: !showTickerBanner })}
                                                                    className={`w-14 h-7 rounded-full p-1 transition-all flex items-center ${showTickerBanner ? 'bg-neon-red shadow-[0_0_15px_#ff003344] justify-end' : 'bg-gray-800 justify-start'}`}
                                                                >
                                                                    <div className="w-5 h-5 rounded-full bg-white shadow-lg" />
                                                                </button>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Type de contenu</label>
                                                                    <select
                                                                        value={tickerType}
                                                                        onChange={(e) => handleUpdateLocalSetting({ tickerType: e.target.value as any })}
                                                                        className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-red cursor-pointer"
                                                                    >
                                                                        <option value="news">📢 Actualités automatiques</option>
                                                                        <option value="planning">📅 Programme en cours</option>
                                                                        <option value="custom">✍️ Texte personnalisé</option>
                                                                    </select>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Couleur Fond</label>
                                                                        <div className="flex gap-2 items-center bg-black/40 border border-white/10 rounded-xl p-2 h-11">
                                                                            <input type="color" value={tickerBgColor} onChange={(e) => handleUpdateLocalSetting({ tickerBgColor: e.target.value })} className="w-10 h-7 bg-transparent border-none cursor-pointer" />
                                                                            <span className="text-[9px] text-gray-400 font-mono uppercase truncate">{tickerBgColor}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Couleur Texte</label>
                                                                        <div className="flex gap-2 items-center bg-black/40 border border-white/10 rounded-xl p-2 h-11">
                                                                            <input type="color" value={tickerTextColor} onChange={(e) => handleUpdateLocalSetting({ tickerTextColor: e.target.value })} className="w-10 h-7 bg-transparent border-none cursor-pointer" />
                                                                            <span className="text-[9px] text-gray-400 font-mono uppercase truncate">{tickerTextColor}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {tickerType === 'custom' && (
                                                                    <div className="space-y-4 pt-2">
                                                                        <div className="space-y-1.5">
                                                                            <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Votre message</label>
                                                                            <input type="text" value={tickerText} onChange={(e) => handleUpdateLocalSetting({ tickerText: e.target.value })} className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-red" placeholder="Texte à faire défiler..." />
                                                                        </div>
                                                                        <div className="space-y-1.5">
                                                                            <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Lien au clic (Optionnel)</label>
                                                                            <input type="text" value={tickerLink} onChange={(e) => handleUpdateLocalSetting({ tickerLink: e.target.value })} className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-red" placeholder="https://..." />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Top Banner Control (Bandeau 2) */}
                                                        <div className="space-y-4 bg-white/5 border border-white/5 p-6 rounded-[2rem]">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-neon-red/10 rounded-xl">
                                                                        <Activity className="w-4 h-4 text-neon-red" />
                                                                    </div>
                                                                    <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Bandeau 2 <span className="text-neon-red">(Titre & Infos)</span></h3>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleUpdateLocalSetting({ showTopBanner: !showTopBanner })}
                                                                    className={`w-14 h-7 rounded-full p-1 transition-all flex items-center ${showTopBanner ? 'bg-neon-red shadow-[0_0_15px_#ff003344] justify-end' : 'bg-gray-800 justify-start'}`}
                                                                >
                                                                    <div className="w-5 h-5 rounded-full bg-white shadow-lg" />
                                                                </button>
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                                                                Affiche le logo et le menu de navigation en haut de la page.
                                                            </p>
                                                        </div>

                                                        {/* Announcement Banner Control */}
                                                        <div className="space-y-4 bg-white/5 border border-white/5 p-6 rounded-[2rem]">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-neon-cyan/10 rounded-xl">
                                                                        <Globe className="w-4 h-4 text-neon-cyan" />
                                                                    </div>
                                                                    <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Bandeau <span className="text-neon-cyan">défilant (Annonces)</span></h3>
                                                                </div>
                                                                <button
                                                                    onClick={() => setAnnBannerEnabled(p => !p)}
                                                                    className={`w-14 h-7 rounded-full p-1 transition-all flex items-center ${annBannerEnabled ? 'bg-neon-cyan shadow-[0_0_15px_#00ffff44] justify-end' : 'bg-gray-800 justify-start'}`}
                                                                >
                                                                    <div className="w-5 h-5 rounded-full bg-white shadow-lg" />
                                                                </button>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Texte du bandeau</label>
                                                                    <input
                                                                        type="text"
                                                                        value={annBannerText}
                                                                        onChange={(e) => setAnnBannerText(e.target.value)}
                                                                        placeholder="Ex: DROPSIDERS LIVE — TOMORROWLAND 2026..."
                                                                        className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-cyan transition-all"
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Couleur Texte</label>
                                                                        <div className="flex gap-2 items-center bg-black/40 border border-white/10 rounded-xl p-2 h-11">
                                                                            <input type="color" value={annBannerColor} onChange={(e) => setAnnBannerColor(e.target.value)} className="w-10 h-7 bg-transparent border-none cursor-pointer" />
                                                                            <span className="text-[9px] text-gray-400 font-mono uppercase truncate">{annBannerColor}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Couleur Fond</label>
                                                                        <div className="flex gap-2 items-center bg-black/40 border border-white/10 rounded-xl p-2 h-11">
                                                                            <input type="color" value={annBannerBg} onChange={(e) => setAnnBannerBg(e.target.value)} className="w-10 h-7 bg-transparent border-none cursor-pointer" />
                                                                            <span className="text-[9px] text-gray-400 font-mono uppercase truncate">{annBannerBg}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={handleSaveAnnouncementBanner}
                                                                    className="w-full py-2.5 bg-neon-cyan/20 border border-neon-cyan/30 hover:bg-neon-cyan hover:text-black text-neon-cyan rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                                >
                                                                    Sauvegarder le Bandeau
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}


                                            {activeSettingsTab === 'moderation' && (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                        {/* Section Équipe de modération */}
                                                        <div className="space-y-6 bg-white/5 border border-white/5 p-6 rounded-[2rem]">
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
                                                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-neon-red transition-all"
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
                                                                        className="px-4 py-2 bg-neon-red text-white text-[10px] font-black uppercase rounded-xl hover:bg-neon-red/80 transition-all font-bold"
                                                                    >
                                                                        Ajouter
                                                                    </button>
                                                                </div>

                                                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                                    {localModerators?.split(',').filter(m => m.trim()).map(mod => (
                                                                        <div key={mod} className="flex items-center justify-between group rounded-lg p-2 hover:bg-white/5 transition-colors">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className={`w-1.5 h-1.5 rounded-full bg-gray-600`} />
                                                                                <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest">{mod.trim()}</span>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => handleRemoveModerator(mod.trim())}
                                                                                className="p-1.5 text-gray-600 hover:text-neon-red transition-colors"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    {!localModerators?.trim() && <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center py-4 italic">Aucun modérateur configuré</p>}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Modos Connectés */}
                                                        <div className="space-y-6 bg-white/5 border border-white/5 p-6 rounded-[2rem]">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-green-500/10 rounded-xl">
                                                                    <Activity className="w-4 h-4 text-green-500" />
                                                                </div>
                                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Modos <span className="text-green-500">Connectés</span></h3>
                                                            </div>
                                                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                                {localModerators?.split(',').filter(m => m.trim() && isUserOnline(m.trim())).map(mod => (
                                                                    <div key={mod} className="flex items-center justify-between group rounded-xl p-3 bg-black/40 border border-white/5 transition-colors">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                                                                            <span className="text-[11px] font-black text-white uppercase tracking-widest">{mod.trim()}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {localModerators?.split(',').filter(m => m.trim() && isUserOnline(m.trim())).length === 0 && (
                                                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center py-4 italic">Aucun modo connecté</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Outils de Sécurité */}
                                                        <div className="space-y-6 bg-white/5 border border-white/5 p-6 rounded-[2rem]">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-neon-red/10 rounded-xl">
                                                                    <ShieldAlert className="w-4 h-4 text-neon-red" />
                                                                </div>
                                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Outils de <span className="text-neon-red">Sécurité</span></h3>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                                                                    <div>
                                                                        <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
                                                                            <Clock className="w-3.5 h-3.5 text-yellow-500" /> Mode Lent
                                                                        </p>
                                                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest italic">Limite l'envoi de messages</p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setIsSlowMode(!isSlowMode)}
                                                                        className={`w-14 h-7 rounded-full p-1 transition-all flex items-center ${isSlowMode ? 'bg-yellow-500 shadow-[0_0_15px_#eab30844] justify-end' : 'bg-gray-800 justify-start'}`}
                                                                    >
                                                                        <div className="w-5 h-5 rounded-full bg-white shadow-lg" />
                                                                    </button>
                                                                </div>

                                                                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 mb-3">
                                                                        <Globe className="w-3.5 h-3.5 text-neon-cyan" /> Filtre de Liens
                                                                    </p>
                                                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Bloquer les liens externes</span>
                                                                        <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-[8px] font-black uppercase border border-green-500/20">Toujours Actif</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Gestion Sondage */}
                                                        <div className="space-y-6 bg-white/5 border border-white/5 p-6 rounded-[2rem]">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-neon-red/10 rounded-xl">
                                                                    <HelpCircle className="w-4 h-4 text-neon-red" />
                                                                </div>
                                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Gestion <span className="text-neon-red">Sondage</span></h3>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Question</label>
                                                                    <input type="text" placeholder="Question du sondage..." value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-neon-red" />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {pollOptions.map((opt, i) => (
                                                                            <input key={i} type="text" placeholder={`Option ${i + 1}`} value={opt} onChange={e => {
                                                                                const newOpts = [...pollOptions];
                                                                                newOpts[i] = e.target.value;
                                                                                setPollOptions(newOpts);
                                                                            }} className="w-full bg-black/20 border border-white/5 rounded-lg p-3 text-[10px] text-gray-300 outline-none focus:border-neon-red" />
                                                                        ))}
                                                                    </div>
                                                                    {pollOptions.length < 6 && (
                                                                        <button
                                                                            onClick={() => setPollOptions([...pollOptions, ''])}
                                                                            className="w-full py-2 bg-white/5 border border-white/5 rounded-lg text-[8px] font-black uppercase text-gray-500 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                                                        >
                                                                            <Plus className="w-3 h-3" /> Ajouter une option
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                <div className="flex flex-col gap-2 pt-2">
                                                                    <button onClick={handleSendPoll} className="py-3 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-xl text-[10px] font-black uppercase hover:bg-neon-cyan hover:text-black transition-all shadow-lg shadow-neon-cyan/5">Lancer le Sondage</button>
                                                                    {activePoll && (
                                                                        <button onClick={handleStopPoll} className="py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Terminer le Sondage</button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Apparence Admin */}
                                                    <div className="space-y-6 bg-white/5 border border-white/5 p-6 rounded-[2rem]">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-neon-red/10 rounded-xl">
                                                                    <Pencil className="w-4 h-4 text-neon-red" />
                                                                </div>
                                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Apparence <span className="text-neon-red">Admin</span></h3>
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
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Couleur Texte/Bordure</label>
                                                                <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-2 focus-within:border-neon-red transition-all">
                                                                    <input type="color" value={localSettings.adminColor || adminColor} onChange={(e) => handleUpdateLocalSetting({ adminColor: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-md" />
                                                                    <span className="text-xs font-bold text-white uppercase">{localSettings.adminColor || adminColor}</span>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Couleur de Fond</label>
                                                                <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-2 focus-within:border-neon-red transition-all">
                                                                    <div className="relative group/picker">
                                                                        <input
                                                                            type="color"
                                                                            value={localSettings.adminColor || adminColor}
                                                                            onChange={(e) => {
                                                                                const hex = e.target.value;
                                                                                handleUpdateLocalSetting({ adminBgColor: `${hex}0d` }); // 0.05 opacity by default
                                                                            }}
                                                                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-md"
                                                                        />
                                                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[8px] text-white rounded opacity-0 group-hover/picker:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">Base pour le fond</div>
                                                                    </div>
                                                                    <div className="flex flex-1 items-center gap-2">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="ex: rgba(255, 0, 51, 0.05)"
                                                                            value={localSettings.adminBgColor || adminBgColor}
                                                                            onChange={(e) => handleUpdateLocalSetting({ adminBgColor: e.target.value })}
                                                                            className="bg-transparent border-none text-[11px] font-mono font-bold text-white outline-none w-full"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
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
                                                                        {editLineup.split('\n').filter(l => l.trim()).map((line, idx) => {
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
                                                                                        <button onClick={editOption} className="p-1 opacity-100 md:opacity-0 group-hover:opacity-100 hover:bg-neon-cyan/10 rounded text-gray-500 hover:text-neon-cyan transition-all" title="Éditer">
                                                                                            <Edit2 className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                        <button onClick={deleteLine} className="p-1 opacity-100 md:opacity-0 group-hover:opacity-100 hover:bg-neon-red/10 rounded text-gray-500 hover:text-neon-red transition-all" title="Supprimer">
                                                                                            <X className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}

                                                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center italic">Un artiste par ligne • Format: [HH:MM - HH:MM] Artiste - Stage - Instagram</p>
                                                    </div>
                                                </div>
                                            )}




                                            {activeSettingsTab === 'bot' && (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

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

                                                        {recentShazams.length > 0 && (
                                                            <div className="mt-8 space-y-3">
                                                                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center italic">Dernières Identifications <span className="text-neon-cyan">Shazam</span></h4>
                                                                <div className="flex flex-wrap justify-center gap-2">
                                                                    {recentShazams.map((song, i) => (
                                                                        <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-gray-400">
                                                                            {song}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
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

                                        <div className="pt-6 grid grid-cols-2 gap-4 border-t border-white/10 mt-auto">
                                            <button
                                                onClick={() => {
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

                                                    handleUpdateSettings({
                                                        ...localSettings,
                                                        title: editTitle,
                                                        mainFluxName: editMainFluxName,
                                                        lineup: editLineup,
                                                        youtubeId: fId,
                                                        channels: newChannels.join('\n'),
                                                        shopItems: selectedShopIds.join(','),
                                                        chat_enabled: true
                                                    });
                                                }}
                                                disabled={isSaving}
                                                className="py-4 bg-neon-red text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-neon-red/80 transition-all shadow-xl shadow-neon-red/10 active:scale-[0.98] disabled:opacity-50"
                                            >
                                                {isSaving ? 'ENREGISTREMENT...' : 'SAUVEGARDER'}
                                            </button>
                                            <button
                                                onClick={handleToggleLive}
                                                className="py-4 bg-white/5 border border-white/5 text-neon-red text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-neon-red hover:text-white transition-all group flex items-center justify-center gap-3 relative overflow-hidden active:scale-[0.98]"
                                            >
                                                <Power className={`w-4 h-4 ${settings.isOnline ? 'text-neon-red' : 'text-green-500'} group-hover:text-white transition-colors`} />
                                                {settings.isOnline ? 'Couper Live' : 'Lancer Live'}
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Chat Section */}
                <div className="flex-1 lg:w-[700px] lg:flex-none bg-[#080808] flex flex-col min-h-[50vh] lg:h-full relative z-[150] border-t lg:border-t-0 lg:border-l border-white/15 pointer-events-auto shadow-[-30px_0_60px_rgba(0,0,0,0.6)]">
                    {/* Glossy Header */}
                    {!isFocusMode && (
                        <div className="p-3 lg:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02] backdrop-blur-xl relative z-20 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-neon-red/10 border border-neon-red/20 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,51,0.2)]">
                                    <MessageSquare className="w-5 h-5 text-neon-red" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-[10px] lg:text-xs font-black text-white uppercase italic tracking-tighter leading-tight flex items-center gap-2">
                                        Chat en direct
                                        {isSlowMode && <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 text-[8px] font-black uppercase flex items-center gap-1 border border-yellow-500/30">Mode Lent</span>}
                                    </h2>
                                </div>
                            </div>
                            {hasModPowers && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleUpdateSettings({ showShop: !showShopWidget })}
                                        className={`p-2.5 rounded-xl transition-all ${showShopWidget ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}
                                        title="Shop (Global)"
                                    >
                                        <Zap className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setShowSlowModePopup(!showSlowModePopup)}
                                        className={`p-2.5 rounded-xl transition-all relative ${showSlowModePopup || isSlowMode ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}
                                        title="Mode Lent"
                                    >
                                        <Clock className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
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
                    )}

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
                                    <div className="w-full overflow-hidden relative py-2 mb-1">
                                        <div className="flex flex-row gap-3 animate-shop-scroll">
                                            {(showShopWidget && shopProducts.length > 0 ? [...shopProducts, ...shopProducts, ...shopProducts] : []).map((product, i) => (
                                                <a
                                                    key={`${product.id}-${i}`}
                                                    href={product.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-1.5 pr-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-neon-cyan/30 rounded-xl transition-all group/item active:scale-95 shrink-0"
                                                >
                                                    <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden relative shadow-lg">
                                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-0.5 text-center">
                                                            <span className="text-[7.5px] font-black text-white">{product.price}€</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col justify-center max-w-[120px]">
                                                        <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none truncate">{product.name}</p>
                                                        <p className="text-[7.5px] text-gray-500 uppercase tracking-widest mt-1 truncate opacity-60 font-bold">{product.description}</p>
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
                    <div className="flex-1 flex flex-row min-h-0 overflow-hidden relative">
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
                                <div className="flex-1 flex flex-col min-h-0 relative">
                                    {!isJoined ? (
                                        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a0a0a] relative overflow-hidden">
                                            {/* Background Decor */}
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-red to-transparent opacity-50" />
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

                                                            <div className="grid grid-cols-2 gap-3">
                                                                <select
                                                                    required
                                                                    value={country}
                                                                    onChange={(e) => setCountry(e.target.value)}
                                                                    className="bg-black/60 border border-white/10 rounded-2xl px-4 py-4 text-[11px] font-black text-white outline-none focus:border-neon-red transition-all appearance-none cursor-pointer"
                                                                >
                                                                    <option value="">PAYS</option>
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
                                            {/* Chat Messages */}
                                            <div id="chat-messages" className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-2 scroll-smooth custom-scrollbar pointer-events-auto">
                                                {/* Pinned Message */}
                                                {localPinnedMessage && !isFocusMode && (
                                                    <div className="sticky top-0 z-30 mb-3 bg-neon-red/10 border border-red-500/20 backdrop-blur-2xl rounded-2xl p-2.5 shadow-[0_0_30px_rgba(255,0,51,0.15)] relative overflow-hidden group/pin mt-1">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-neon-red" />
                                                        <div className="flex items-start gap-2.5">
                                                            <div className="p-1.5 bg-neon-red/20 rounded-lg shrink-0">
                                                                <Pin className="w-3 h-3 text-neon-red" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[8px] font-black text-neon-red uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                                                    ANNOUNCE <span className="w-1 h-1 rounded-full bg-neon-red animate-pulse shadow-[0_0_5px_#ff0000]" />
                                                                </p>
                                                                <div className="text-[11px] font-bold text-white/90 leading-tight pr-6">
                                                                    {localPinnedMessage.split(/(https?:\/\/[^\s]+)/g).map((part: string, i: number) => (
                                                                        part.match(/^https?:\/\//) ? (
                                                                            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline break-all">{part}</a>
                                                                        ) : part
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {hasModPowers && (
                                                                <button
                                                                    onClick={() => handleUpdateSettings({ pinnedMessage: '' })}
                                                                    className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white opacity-0 group-hover/pin:opacity-100 transition-all"
                                                                    title="Supprimer l'annonce"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {messages.map((msg, idx) => {
                                                    const role = getRole(msg.pseudo);
                                                    const isMsgAdmin = role === 'admin';
                                                    const isMsgModo = role === 'modo';
                                                    const isBot = msg.isBot || msg.pseudo === 'DROPSIDERS BOT';

                                                    return (
                                                        <motion.div
                                                            key={msg.id || idx}
                                                            initial={{ opacity: 0, x: 10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            className="group relative min-w-0 overflow-hidden"
                                                        >
                                                            <div className="flex items-center gap-2 mb-1 px-1">
                                                                <div className="w-4 flex items-center justify-center opacity-80">
                                                                    {getCountryFlag(msg.country || 'FR')}
                                                                </div>
                                                                <span
                                                                    className="text-[11px] lg:text-[12px] font-black uppercase tracking-widest truncate min-w-0"
                                                                    style={{ color: isBot ? botColor : isMsgAdmin ? (localSettings.adminColor || adminColor) : isMsgModo ? '#eab308' : (msg.color || '#9ca3af') }}
                                                                >
                                                                    {msg.pseudo}
                                                                </span>
                                                                {isMsgAdmin && <span className="px-2 py-0.5 rounded text-white text-[8px] font-black uppercase tracking-[0.1em]" style={{ backgroundColor: (localSettings.adminColor || adminColor), boxShadow: `0 0 10px ${(localSettings.adminColor || adminColor)}66` }}>ADMIN</span>}
                                                                <span className="text-[9px] text-gray-700 font-bold uppercase ml-auto">{msg.time}</span>
                                                            </div>
                                                            <div
                                                                className={`p-2 px-3 rounded-xl text-[11px] font-medium leading-relaxed break-words overflow-hidden relative border ${isBot ? '' : isMsgAdmin ? '' : 'bg-white/[0.03] border-white/10 text-gray-200'}`}
                                                                style={isBot ? { backgroundColor: botBgColor, borderColor: `${botColor}40`, color: botColor } : isMsgAdmin ? { backgroundColor: (localSettings.adminBgColor || adminBgColor), borderColor: `${(localSettings.adminColor || adminColor)}40`, color: '#ffffff' } : {}}
                                                            >
                                                                {/* Message with clickable links */}
                                                                <span className="relative z-10">
                                                                    {(() => {
                                                                        const text = msg.message;
                                                                        if (!text) return null;
                                                                        const urlRegex = /(https?:\/\/[^\s]+)/g;
                                                                        const parts = text.split(urlRegex);
                                                                        return parts.map((part: string, i: number) => {
                                                                            if (part.match(urlRegex)) {
                                                                                return (
                                                                                    <a
                                                                                        key={i}
                                                                                        href={part}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-400/30 hover:decoration-cyan-400 underline-offset-4 font-bold transition-all break-all"
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                    >
                                                                                        {part}
                                                                                    </a>
                                                                                );
                                                                            }
                                                                            return part;
                                                                        });
                                                                    })()}
                                                                </span>
                                                                {hasModPowers && (isAdmin || !isMsgAdmin) && (
                                                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-20">
                                                                        <button onClick={() => handleUpdateSettings({ pinnedMessage: msg.message })} className="p-1 px-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-all transition-colors"><Pin className="w-3.5 h-3.5" /></button>
                                                                        <button onClick={() => handleDelete(msg.id)} className="p-1 px-1.5 hover:bg-neon-red/20 rounded-lg text-gray-500 hover:text-neon-red transition-all transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>

                                            {/* Chat Input Area */}
                                            <div className="p-4 lg:p-6 bg-[#0a0a0a] border-t border-white/10 relative z-[150] shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
                                                <form onSubmit={handleSendMessage} className="relative group/input p-4">
                                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-red via-neon-cyan to-neon-purple opacity-10 group-focus-within/input:opacity-30 blur-md rounded-2xl lg:rounded-3xl transition-all" />
                                                    <div className="relative flex flex-col bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl lg:rounded-3xl overflow-hidden focus-within:border-neon-red/30 shadow-2xl">
                                                        <div className="flex items-center px-2 py-1 lg:py-1.5">
                                                            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2.5 transition-all ${showEmojiPicker ? 'text-neon-red scale-110' : 'text-gray-500 hover:text-white hover:scale-105'}`}><Smile className="w-5 h-5" /></button>
                                                            <div className="w-[1px] h-4 bg-white/10 mx-1" />

                                                            <input
                                                                type="text"
                                                                value={newMessage}
                                                                onChange={(e) => setNewMessage(e.target.value)}
                                                                placeholder={isSlowMode && !hasModPowers ? "⏳ Mode Lent..." : "Écrire..."}
                                                                className="flex-1 bg-transparent px-3 py-3 text-sm font-medium text-white outline-none placeholder:text-gray-700 min-w-0"
                                                            />

                                                            <button type="button" onClick={handleShazam} className={`p-2.5 transition-all flex items-center gap-1.5 ${shazamLoading ? 'text-neon-cyan animate-pulse' : 'text-gray-500 hover:text-neon-cyan hover:scale-105'}`}>
                                                                <Music2 className="w-5 h-5" />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={isPushEnabled ? unsubscribeFromPush : subscribeToPushNotifications}
                                                                title={isPushEnabled ? "Désactiver les notifications" : "Activer les notifications natives (Favoris)"}
                                                                className={`p-2.5 transition-all flex items-center gap-1.5 ${isPushEnabled ? 'text-neon-cyan' : 'text-gray-500 hover:text-neon-cyan hover:scale-110'}`}
                                                            >
                                                                <Bell className={`w-5 h-5 ${isPushEnabled ? 'animate-bounce' : ''}`} />
                                                            </button>

                                                            <div className="w-[1px] h-4 bg-white/10 mx-1" />




                                                            <button type="submit" disabled={!newMessage.trim() || isSending} className="ml-1 p-3 bg-neon-red text-white hover:bg-neon-red/80 disabled:opacity-20 rounded-xl transition-all flex items-center justify-center active:scale-90 shadow-lg shadow-neon-red/20">
                                                                <Send className={`w-4 h-4 ${isSending ? 'animate-pulse' : ''}`} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {showEmojiPicker && (
                                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-full left-0 right-0 mb-4 p-4 bg-[#0a0a0a] border border-white/10 rounded-3xl grid grid-cols-6 lg:grid-cols-8 gap-2 shadow-2xl h-52 overflow-y-auto z-[60] custom-scrollbar">
                                                            {['🔥', '🙌', '🚀', '❤️', '🤩', '💿', '💫', '💥', '✨', '⚡️', '🎹', '🎧', '🕺', '💃', '🎆', '🔊', '🎉', '💯', '🎶', '🎵', '😎', '🤪', '🤯', '🥳'].map(e => (
                                                                <button key={e} type="button" onClick={() => { setNewMessage(p => p + e); setShowEmojiPicker(false); }} className="text-2xl hover:bg-white/10 p-2.5 rounded-xl transition-transform active:scale-90">{e}</button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </form>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

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
                </div>
            </div>

            {/* Ticker Banner */}
            {
                !isFocusMode && !isFullScreen && showTickerBanner && (
                    <div
                        className="w-full h-12 shrink-0 flex items-center overflow-hidden border-t border-white/20 relative z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] group/ticker"
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
                                            <Music2 className="w-12 h-12 text-neon-cyan drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]" />
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
            </AnimatePresence>

            <style>{`
                @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-ticker { animation: ticker 120s linear infinite; width: max-content; }
                .animate-ticker:hover, #ticker-animate-container:hover { animation-play-state: paused !important; }
                @keyframes shop-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-shop-scroll { animation: shop-scroll 40s linear infinite; width: max-content; }
                .animate-shop-scroll:hover { animation-play-state: paused; }
                @keyframes glow { 0%, 100% { border-color: rgba(255, 0, 0, 0.3); } 50% { border-color: rgba(255, 0, 0, 0.8); } }
                .animate-glow { animation: glow 2s ease-in-out infinite; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
}

export default TakeoverPage;
