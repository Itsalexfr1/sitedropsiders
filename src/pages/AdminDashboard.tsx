import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Mail, Calendar, Image as ImageIcon, Video, Mic, Plus, Users,
    LayoutDashboard, Lock, ArrowRight, User, Search, X, BarChart3, Music,
    ShoppingBag, Save, Paintbrush, Settings2, ChevronUp, ChevronDown,
    ChevronLeft, ChevronRight, Palette, Megaphone, RefreshCw, Type,
    Youtube, CheckCircle2, Loader2, LogOut, Globe, MessageSquare, Pencil, ShieldAlert, Shield, Trash2, ExternalLink, Clock, Pin, PinOff, Instagram, Bell, Zap,
    RotateCcw, VideoOff, Play, Download, Gamepad2, Upload, Activity, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthHeaders, apiFetch } from '../utils/auth';
import { uploadFile } from '../utils/uploadService';
import { translateText } from '../utils/translate';
import { SocialSuite } from '../components/SocialSuite';
import { ModerationModal } from '../components/admin/ModerationModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Downloader } from './Downloader';
import { AudioWaveformSelector } from '../components/admin/AudioWaveformSelector';

export function AdminDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [actions, setActions] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
    const [isContenuModalOpen, setIsContenuModalOpen] = useState(false);
    const [isMusiqueModalOpen, setIsMusiqueModalOpen] = useState(false);
    const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);
    const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
    const [isGalerieModalOpen, setIsGalerieModalOpen] = useState(false);
    const [isShopModalOpen, setIsShopModalOpen] = useState(false);
    const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
    const [isCommunauteModalOpen, setIsCommunauteModalOpen] = useState(false);
    const [isAccueilModalOpen, setIsAccueilModalOpen] = useState(false);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isNewsletterModalOpen, setIsNewsletterModalOpen] = useState(false);
    const [isEditorsModalOpen, setIsEditorsModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
    const [isModerationModalOpen, setIsModerationModalOpen] = useState(false);
    const [isClipsModalOpen, setIsClipsModalOpen] = useState(false);
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [isDownloaderOpen, setIsDownloaderOpen] = useState(false);
    const [pushSubscribersCount, setPushSubscribersCount] = useState<number | null>(null);
    const [socialRecentArticles, setSocialRecentArticles] = useState<any[]>([]);
    const [selectedSocialArticle, setSelectedSocialArticle] = useState<any | null>(null);
    const [isLoadingSocial, setIsLoadingSocial] = useState(false);
    const [bannerState, setBannerState] = useState({
        enabled: false,
        text: '',
        text_en: '',
        color: '#ffffff',
        bgColor: '#ff0033',
        size: 'medium' as 'small' | 'medium' | 'large',
        link: ''
    });
    const [isUpdatingBanner, setIsUpdatingBanner] = useState(false);
    const [clips, setClips] = useState<any[]>([]);
    const [isLoadingClips, setIsLoadingClips] = useState(false);
    const [pendingPhotosCount, setPendingPhotosCount] = useState(0);
    const [pendingQuizzesCount, setPendingQuizzesCount] = useState(0);
    const [pendingMessagesCount, setPendingMessagesCount] = useState(0);
    const [allActiveQuizzes, setAllActiveQuizzes] = useState<any[]>([]);
    const [allPendingQuizzes, setAllPendingQuizzes] = useState<any[]>([]);
    const [isQuizLoading, setIsQuizLoading] = useState(false);
    const [quizTab, setQuizTab] = useState<'active' | 'pending'>('active');
    const [isEditQuizModalOpen, setIsEditQuizModalOpen] = useState(false);
    const [quizFilter, setQuizFilter] = useState('ALL');
    const [quizSearch, setQuizSearch] = useState('');
    const [quizToEdit, setQuizToEdit] = useState<any>(null);
    const [testQuiz, setTestQuiz] = useState<any>(null);
    const [isTestingModalOpen, setIsTestingModalOpen] = useState(false);

    const quizCounts = useMemo(() => {
        const all = [...allActiveQuizzes, ...allPendingQuizzes];
        return {
            blindTest: all.filter(q => q.type === 'BLIND_TEST').length,
            image: all.filter(q => q.type === 'IMAGE').length
        };
    }, [allActiveQuizzes, allPendingQuizzes]);
    interface TakeoverState {
        enabled: boolean;
        youtubeId: string;
        title: string;
        moderators: string;
        lineup: string;
        customCommands: string;
        tickerType: 'news' | 'planning' | 'custom';
        tickerText: string;
        tickerLink: string;
        tickerBgColor: string;
        tickerTextColor: string;
        showTopBanner: boolean;
        showTickerBanner: boolean;
        showInNavbar: boolean;
        forceHomepage: boolean;
        isSecret: boolean;
        password?: string;
        channels: string;
        autoMessage: string;
        autoMessageInterval: number;
        pinnedMessage?: string;
        showInAgenda?: boolean;
        startDate?: string;
        endDate?: string;
        status?: 'off' | 'edit' | 'live';
    }

    const [takeoverState, setTakeoverState] = useState<TakeoverState>({
        enabled: false,
        youtubeId: '',
        title: 'LIVE TAKEOVER',
        moderators: '',
        lineup: '',
        customCommands: '',
        tickerType: 'news',
        tickerText: '',
        tickerLink: '',
        tickerBgColor: '#000000',
        tickerTextColor: '#ffffff',
        showTopBanner: true,
        showTickerBanner: false,
        showInNavbar: true,
        forceHomepage: true,
        isSecret: false,
        password: '2026',
        channels: '',
        autoMessage: '',
        autoMessageInterval: 60,
        pinnedMessage: '',
        showInAgenda: true,
        startDate: '',
        endDate: '',
        status: 'off'
    });
    const [isUpdatingTakeover, setIsUpdatingTakeover] = useState(false);
    const [takeoverTab, setTakeoverTab] = useState<'general' | 'planning' | 'mods' | 'bot' | 'ticker' | 'moderation' | 'blocked' | 'access' | 'clips'>('general');
    const [bannedChatUsers, setBannedChatUsers] = useState<string[]>([]);
    const [dashboardTab, setDashboardTab] = useState<'ALL' | 'NEWS' | 'CONTENU' | 'STUDIO' | 'COMMUNAUTÉ' | 'SHOP'>('ALL');

    const DASHBOARD_TABS = [
        { id: 'ALL', label: 'Tout' },
        { id: 'NEWS', label: 'News' },
        { id: 'CONTENU', label: 'Éditorial' },
        { id: 'STUDIO', label: 'Studio' },
        { id: 'COMMUNAUTÉ', label: 'Communauté' },
        { id: 'SHOP', label: 'Shop' }
    ];
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean,
        title: string,
        message: string,
        onConfirm: () => void,
        type: 'danger' | 'warning' | 'info'
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger'
    });

    useEffect(() => {
        if (isClipsModalOpen) {
            fetchClips();
        }
    }, [isClipsModalOpen]);

    const navigate = useNavigate();

    // Selection Interviews pour l'accueil
    const [allInterviews, setAllInterviews] = useState<any[]>([]);
    const [selectedInterviews, setSelectedInterviews] = useState<string[]>([]);
    const [isSavingInterviews, setIsSavingInterviews] = useState(false);
    const [interviewSearch, setInterviewSearch] = useState('');

    const [pushNewsList, setPushNewsList] = useState<any[]>([]);
    const [selectedPushNews, setSelectedPushNews] = useState<any | null>(null);
    const [pushCustomTitle, setPushCustomTitle] = useState('DROPSIDERS NEWS');
    const [pushCustomBody, setPushCustomBody] = useState('');
    const [isSendingManualPush, setIsSendingManualPush] = useState(false);

    useEffect(() => {
        if (isQuizModalOpen) {
            fetchQuizzes();
        }
    }, [isQuizModalOpen]);

    useEffect(() => {
        if (isNotificationModalOpen) {
            // 1. Fetch count
            fetch('/api/push/subscribers-count')
                .then(res => res.json())
                .then(data => setPushSubscribersCount(data.count))
                .catch(() => setPushSubscribersCount(0));

            // 2. Fetch last news for selection
            apiFetch('/api/news', { headers: getAuthHeaders() })
                .then(r => r.json())
                .then(data => {
                    const sorted = Array.isArray(data) ? data.slice(0, 10) : [];
                    setPushNewsList(sorted);
                })
                .catch(err => console.error("Error fetching news for push:", err));
        }
    }, [isNotificationModalOpen]);

    const fetchQuizzes = async () => {
        setIsQuizLoading(true);
        try {
            const [activeRes, pendingRes] = await Promise.all([
                fetch('/api/quiz/active'),
                fetch('/api/quiz/pending', { headers: getAuthHeaders() })
            ]);

            if (activeRes.ok) {
                const data = await activeRes.json();
                setAllActiveQuizzes(Array.isArray(data) ? data : []);
            }
            if (pendingRes.ok) {
                const data = await pendingRes.json();
                const pending = Array.isArray(data) ? data : [];
                setAllPendingQuizzes(pending);
                setPendingQuizzesCount(pending.length);
            }
        } catch (err) {
            console.error("Error fetching quizzes:", err);
        } finally {
            setIsQuizLoading(false);
        }
    };

    const handleCreateQuiz = () => {
        setQuizToEdit({
            type: 'QCM',
            category: 'Festivals',
            question: '',
            options: ['', '', '', ''],
            correctAnswer: '',
            author: username,
            imageType: 'FESTIVAL',
            revealEffect: 'BLUR'
        });
        setIsEditQuizModalOpen(true);
    };

    const handleModerateQuiz = async (id: string, action: 'approve' | 'delete') => {
        if (action === 'delete') {
            setConfirmModal({
                isOpen: true,
                title: 'Supprimer Quizz',
                message: 'Voulez-vous vraiment supprimer éfinitivement cette question ?',
                type: 'danger',
                onConfirm: () => performModerateQuiz(id, action)
            });
            return;
        }
        performModerateQuiz(id, action);
    };

    const performModerateQuiz = async (id: string, action: 'approve' | 'delete') => {

        try {
            const endpoint = action === 'approve' ? '/api/quiz/moderate' : '/api/quiz/delete';
            const res = await apiFetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id, action: action === 'approve' ? 'approve' : undefined })
            });

            if (res.ok) {
                fetchQuizzes();
            }
        } catch (err) {
            console.error("Error moderating quiz:", err);
        } finally {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    };

    const handleUpdateQuiz = async (quiz: any) => {
        try {
            const endpoint = quiz.id ? '/api/quiz/update' : '/api/quiz/submit';
            const res = await apiFetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(quiz)
            });
            if (res.ok) {
                setIsEditQuizModalOpen(false);
                fetchQuizzes();
            }
        } catch (err) {
            console.error("Error updating quiz:", err);
        }
    };

    useEffect(() => {
        if (isSocialModalOpen) {
            setIsLoadingSocial(true);
            apiFetch('/api/news', { headers: getAuthHeaders() })
                .then(r => r.json())
                .then(data => {
                    const sorted = Array.isArray(data) ? data.slice(0, 20) : [];
                    setSocialRecentArticles(sorted);
                })
                .catch(err => console.error("Error fetching news for social:", err))
                .finally(() => setIsLoadingSocial(false));
        }
    }, [isSocialModalOpen]);

    const handleSendManualPush = async () => {
        if (!pushCustomTitle || !pushCustomBody) {
            alert('Veuillez remplir le titre et le message.');
            return;
        }

        setIsSendingManualPush(true);
        try {
            const body = {
                title: pushCustomTitle,
                body: pushCustomBody,
                url: selectedPushNews ? selectedPushNews.link : '/',
                // Indicate it's a manual broadcast to all
                broadcast: true
            };

            const resp = await fetch('/api/push/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(body)
            });

            if (resp.ok) {
                alert('Notification envoyée avec succès à tous les abonnés !');
                setIsNotificationModalOpen(false);
            } else {
                throw new Error('Erreur lors de l\'envoi');
            }
        } catch (e: any) {
            alert('Erreur : ' + e.message);
        } finally {
            setIsSendingManualPush(false);
        }
    };

    const fetchInterviewsForSelection = async () => {
        try {
            const [newsResp, layoutResp] = await Promise.all([
                apiFetch('/api/news', { headers: getAuthHeaders() }),
                apiFetch('/api/home-layout', { headers: getAuthHeaders() })
            ]);
            if (newsResp.ok && layoutResp.ok) {
                const allNews = await newsResp.json();
                const layout = await layoutResp.json();
                const interviewList = allNews.filter((n: any) =>
                    (n.category === 'Interview' || n.category === 'Interviews' || n.category === 'Interview Video')
                );
                // Sort by date desc
                interviewList.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setAllInterviews(interviewList);

                const interviewSection = layout.find((s: any) => s.id === 'interviews');
                if (interviewSection && interviewSection.featuredInterviews) {
                    setSelectedInterviews(interviewSection.featuredInterviews);
                } else {
                    setSelectedInterviews([]);
                }
            }
        } catch (e: any) {
            console.error("Error fetching interviews for selection:", e);
        }
    };

    useEffect(() => {
        if (isInterviewModalOpen) {
            fetchInterviewsForSelection();
        }
    }, [isInterviewModalOpen]);

    const saveInterviewSelection = async () => {
        setIsSavingInterviews(true);
        try {
            const layoutResp = await fetch('/api/home-layout');
            if (layoutResp.ok) {
                const layout = await layoutResp.json();
                const newLayout = layout.map((section: any) => {
                    if (section.id === 'interviews') {
                        return { ...section, featuredInterviews: selectedInterviews };
                    }
                    return section;
                });

                await fetch('/api/home-layout/update', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ layout: newLayout })
                });

                setIsInterviewModalOpen(false);
            }
        } catch (e: any) {
            console.error("Error saving interview selection:", e);
        } finally {
            setIsSavingInterviews(false);
        }
    };





    useEffect(() => {
        const auth = localStorage.getItem('admin_auth');
        if (auth === 'true') {
            setIsAuthenticated(true);
            const storedUser = localStorage.getItem('admin_user');
            if (storedUser) {
                setUsername(storedUser);

                // EMERGENCY FIX: If user is alex, force 'all' permissions
                if (storedUser.toLowerCase() === 'alex' || storedUser.toLowerCase() === 'contact@dropsiders.fr') {
                    const perms = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
                    if (!perms.includes('all')) {
                        const newPerms = [...new Set([...perms, 'all'])];
                        localStorage.setItem('admin_permissions', JSON.stringify(newPerms));
                    }
                }
            }
            fetchActions();
            fetchSettings();
        }
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await apiFetch('/api/settings', { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                // setBannerEnabled not needed as bannerState has it
                setBannerState({
                    enabled: data.announcement_banner?.enabled || false,
                    text: data.announcement_banner?.text || '',
                    text_en: data.announcement_banner?.text_en || '',
                    color: data.announcement_banner?.color || '#ffffff',
                    bgColor: data.announcement_banner?.bgColor || '#ff0033',
                    size: data.announcement_banner?.size || 'medium',
                    link: data.announcement_banner?.link || ''
                });
                if (data.takeover) {
                    setTakeoverState({
                        enabled: data.takeover.enabled || false,
                        youtubeId: data.takeover.youtubeId || '',
                        title: data.takeover.title || 'LIVE TAKEOVER',
                        moderators: data.takeover.moderators || '',
                        lineup: data.takeover.lineup || '',
                        tickerType: data.takeover.tickerType || 'news',
                        tickerText: data.takeover.tickerText || '',
                        tickerLink: data.takeover.tickerLink || '',
                        tickerBgColor: data.takeover.tickerBgColor || '#000000',
                        tickerTextColor: data.takeover.tickerTextColor || '#ffffff',
                        showTopBanner: data.takeover.showTopBanner !== false,
                        showTickerBanner: data.takeover.showTickerBanner === true,
                        showInNavbar: data.takeover.showInNavbar !== false,
                        forceHomepage: data.takeover.forceHomepage !== false,
                        customCommands: data.takeover.customCommands || '',
                        isSecret: data.takeover.isSecret || false,
                        password: data.takeover.password || '2026',
                        channels: data.takeover.channels || '',
                        autoMessage: data.takeover.autoMessage || '',
                        autoMessageInterval: data.takeover.autoMessageInterval || 60,
                        pinnedMessage: data.takeover.pinnedMessage || '',
                        showInAgenda: data.takeover.showInAgenda !== false,
                        startDate: data.takeover.startDate || '',
                        endDate: data.takeover.endDate || '',
                        status: data.takeover.status || (data.takeover.enabled ? 'live' : 'off')
                    });
                }
            }
        } catch (e: any) { }
    };

    useEffect(() => {
        if (isAuthenticated) {
            // Photos count
            fetch('/api/photos/pending', { headers: getAuthHeaders() })
                .then(r => r.json())
                .then(data => setPendingPhotosCount(Array.isArray(data) ? data.length : 0))
                .catch(() => setPendingPhotosCount(0));

            // Messages count
            fetch('/api/contacts', { headers: getAuthHeaders() })
                .then(r => r.json())
                .then(data => {
                    const count = Array.isArray(data) ? data.filter((m: any) => !m.read).length : 0;
                    setPendingMessagesCount(count);
                })
                .catch(() => setPendingMessagesCount(0));

            // Quizzes count
            fetch('/api/quiz/pending', { headers: getAuthHeaders() })
                .then(res => res.json())
                .then(data => setPendingQuizzesCount(Array.isArray(data) ? data.length : 0))
                .catch(() => setPendingQuizzesCount(0));
        }
    }, [isAuthenticated, isModerationModalOpen, isMessagesModalOpen, isQuizModalOpen, isCommunauteModalOpen]);

    const saveTakeoverSettings = async () => {
        setIsUpdatingTakeover(true);
        try {
            const res = await apiFetch('/api/settings', { headers: getAuthHeaders() });
            const data = res.ok ? await res.json() : {};

            const newSettings = {
                ...data,
                takeover: {
                    ...takeoverState
                }
            };

            const saveRes = await apiFetch('/api/settings/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newSettings)
            });

            if (saveRes.ok) {
                // saved
            }
        } catch (e: any) {
            console.error('Failed to save takeover settings', e);
        } finally {
            setIsUpdatingTakeover(false);
        }
    };

    const updateLiveStatus = async (status: 'off' | 'edit' | 'live') => {
        setIsUpdatingTakeover(true);
        try {
            const newState = {
                ...takeoverState,
                status,
                enabled: status !== 'off'
            };
            setTakeoverState(newState);

            const res = await apiFetch('/api/settings', { headers: getAuthHeaders() });
            const data = res.ok ? await res.json() : {};

            const newSettings = {
                ...data,
                takeover: newState
            };

            await apiFetch('/api/settings/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newSettings)
            });

            if (status === 'live') {
                try {
                    // Determine channel - usually 'takeover' or current stream
                    const channel = takeoverState.youtubeId || 'takeover';
                    await apiFetch('/api/chat/clear', {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ channel })
                    });
                } catch (e) {
                    console.error('Failed to clear chat on live start', e);
                }
            }
        } catch (e: any) {
            console.error('Failed to update live status', e);
        } finally {
            setIsUpdatingTakeover(false);
        }
    };

    const fetchClips = async () => {
        setIsLoadingClips(true);
        try {
            const res = await fetch('/api/clips');
            if (res.ok) {
                const data = await res.json();
                setClips(data);
            }
        } catch (err) {
            console.error("Error fetching clips:", err);
        } finally {
            setIsLoadingClips(false);
        }
    };

    const handleDeleteClip = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Supprimer Extrait',
            message: 'Supprimer éfinitivement cet extrait ? Cette action est irréversible.',
            type: 'danger',
            onConfirm: () => performDeleteClip(id)
        });
    };

    const performDeleteClip = async (id: string) => {
        try {
            const res = await fetch('/api/clips/delete', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                setClips(prev => prev.filter((c: any) => c.id !== id));
            }
        } catch (err) {
            console.error("Error deleting clip:", err);
        } finally {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    };

    const saveBannerSettings = async () => {
        setIsUpdatingBanner(true);
        try {
            const res = await apiFetch('/api/settings', { headers: getAuthHeaders() });
            const data = res.ok ? await res.json() : {};

            const newSettings = {
                ...data,
                announcement_banner: {
                    ...bannerState
                }
            };

            const saveRes = await apiFetch('/api/settings/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newSettings)
            });

            if (saveRes.ok) {
                setIsBannerModalOpen(false);
            }
        } catch (e: any) {
            console.error('Failed to save banner settings', e);
        } finally {
            setIsUpdatingBanner(false);
        }
    };


    // Auto-translation for Banner
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (bannerState.text && bannerState.text.length > 5 && !bannerState.text_en) {
                const translated = await translateText(bannerState.text, 'en');
                setBannerState(prev => ({ ...prev, text_en: translated.toUpperCase() }));
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [bannerState.text]);

    // Auto-translation for Takeover Title
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (takeoverState.title && takeoverState.title.length > 5) {
                // Here we could add a title_en if it existed, but usually takeover uses same title.
                // If you want a specific EN title, we'd need to add it to the state.
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [takeoverState.title]);

    const fetchActions = async () => {
        try {
            const resp = await apiFetch('/api/dashboard-actions', { headers: getAuthHeaders() });
            if (resp.ok) {
                const data = await resp.json();
                if (data && data.length > 0) {
                    // Merge missing fallback actions
                    const defaultActions = getFallbackActions();
                    const mergedActions = [...data];

                    defaultActions.forEach(defaultAction => {
                        const exists = mergedActions.find(a => a.title.toLowerCase() === defaultAction.title.toLowerCase());
                        if (!exists) {
                            mergedActions.push(defaultAction);
                        }
                    });

                    // Filter out 'Bandeau' and also deleted actions that might be in the saved layout
                    // Also sync category, permission, icon, bg, color from defaults
                    const finalActions = mergedActions
                        .filter(savedAction =>
                            savedAction.title !== 'Bandeau' &&
                            defaultActions.some(def => def.title.toLowerCase() === savedAction.title.toLowerCase())
                        )
                        .map(savedAction => {
                            const def = defaultActions.find(d => d.title.toLowerCase() === savedAction.title.toLowerCase());
                            if (def) {
                                return { ...savedAction, title: def.title ?? savedAction.title, category: def.category, permission: def.permission, icon: def.icon, bg: savedAction.bg || def.bg, color: savedAction.color || def.color, baseColor: savedAction.baseColor || def.baseColor };
                            }
                            return savedAction;
                        });

                    setActions(finalActions);
                } else {
                    setActions(getFallbackActions());
                }
            } else {
                setActions(getFallbackActions());
            }
        } catch (e: any) {
            setActions(getFallbackActions());
        }
    };

    const getFallbackActions = () => [
        // CONTENU & À‰DITORIAL
        { title: "Contenu", description: "News, Musique, Interviews...", icon: "FileText", category: "CONTENU & À‰DITORIAL", link: "#", color: "border-neon-cyan/20 hover:border-neon-cyan", bg: "bg-neon-cyan/5", permission: "news", baseColor: "cyan", columns: 2 },
        { title: "Agenda", description: "Programmation", icon: "Calendar", category: "CONTENU & À‰DITORIAL", link: "#", color: "border-neon-yellow/20 hover:border-neon-yellow", bg: "bg-neon-yellow/5", permission: "agenda", baseColor: "yellow", columns: 1 },

        // STUDIO & ANALYTICS
        { title: "Social Studio", description: "Studio Visuels", icon: "Instagram", category: "STUDIO & ANALYTICS", link: "#", color: "border-neon-pink/20 hover:border-neon-pink", bg: "bg-neon-pink/5", permission: "social_studio", baseColor: "pink", columns: 1 },
        { title: "Statistiques", description: "Analyse Audience", icon: "BarChart3", category: "STUDIO & ANALYTICS", link: "#", color: "border-neon-cyan/20 hover:border-neon-cyan", bg: "bg-neon-cyan/5", permission: "stats", baseColor: "cyan", columns: 1 },
        { title: "Spotify", description: "Top 10 Hebdo", icon: "Music", category: "STUDIO & ANALYTICS", link: "#", color: "border-neon-green/20 hover:border-neon-green", bg: "bg-neon-green/5", permission: "spotify", baseColor: "green", columns: 1 },

        // COMMUNAUTÀ‰ & ENGAGEMENT
        { title: "Communauté", description: "Moération & Jeux", icon: "ImageIcon", category: "COMMUNAUTÀ‰ & ENGAGEMENT", link: "#", color: "border-neon-pink/20 hover:border-neon-pink", bg: "bg-neon-pink/5", permission: "galeries", baseColor: "pink", columns: 1 },
        { title: "Notifications", description: "Alertes Push", icon: "Bell", category: "COMMUNAUTÀ‰ & ENGAGEMENT", link: "#", color: "border-neon-red/20 hover:border-neon-red", bg: "bg-neon-red/5", permission: "notifications", baseColor: "red", columns: 1 },

        // SHOP & CONTACT
        { title: "Shop", description: "Drops Shop", icon: "ShoppingBag", category: "SHOP & CONTACT", link: "#", color: "border-neon-pink/20 hover:border-neon-pink", bg: "bg-neon-pink/5", permission: "shop", baseColor: "pink", columns: 1 },
        { title: "Newsletter", description: "Campagnes Mail", icon: "Mail", category: "SHOP & CONTACT", link: "#", color: "border-green-400/20 hover:border-green-400", bg: "bg-green-400/5", permission: "messages", baseColor: "green", columns: 1 },
        { title: "MESSAGERIE & CONTACT", description: "Emails Reçus", icon: "Mail", category: "SHOP & CONTACT", link: "#", color: "border-neon-orange/20 hover:border-neon-orange", bg: "bg-neon-orange/5", permission: "messages", baseColor: "orange", columns: 1 },

        // SYSTÀˆME & TEAM
        { title: "Bandeau", description: "Annonces Teasing", icon: "Megaphone", category: "SYSTÀˆME & TEAM", link: "#", color: "border-neon-orange/20 hover:border-neon-orange", bg: "bg-neon-orange/5", permission: "superadmin", baseColor: "orange", columns: 1 },
        { title: "Accueil", description: "Sections & Vues", icon: "LayoutDashboard", category: "SYSTÀˆME & TEAM", link: "#", color: "border-neon-cyan/20 hover:border-neon-cyan", bg: "bg-neon-cyan/5", permission: "superadmin", baseColor: "cyan", columns: 1 },
        { title: "Team", description: "À‰quipe & Accès", icon: "Users", category: "SYSTÀˆME & TEAM", link: "#", color: "border-neon-blue/20 hover:border-neon-blue", bg: "bg-neon-blue/5", permission: "team", baseColor: "blue", columns: 1 },
        { title: "News Focus", description: "Focus de la semaine", icon: "Zap", category: "CONTENU & ÉDITORIAL", link: "/news/create?tab=Focus", color: "border-neon-purple/20 hover:border-neon-purple", bg: "bg-neon-purple/5", permission: "news", baseColor: "purple", columns: 1 },
    ];


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const loginUsername = username.toLowerCase().trim();

        try {
            // Tentative de connexion via l'API (Production / Cloudflare)
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: loginUsername, password })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setIsAuthenticated(true);
                    localStorage.setItem('admin_auth', 'true');
                    localStorage.setItem('admin_password', password);
                    localStorage.setItem('admin_user', data.user || loginUsername);
                    localStorage.setItem('admin_permissions', JSON.stringify(data.permissions || []));
                    localStorage.setItem('admin_session_id', data.sessionId || '');
                    fetchActions();
                    return;
                }
            }

            // Si l'API répond avec une erreur explicite
            if (response.status === 401) {
                setError('Identifiants incorrects');
                return;
            }

            throw new Error('API unreachable'); // Force fallback if not 401/200

        } catch (err: any) {
            // FALLBACK LOCAL (DEV MODE)
            console.log("API Login failed, trying local check...", err);

            if ((username === 'contact@dropsiders.fr' || username === 'alex') && password === '2026') {
                setIsAuthenticated(true);
                localStorage.setItem('admin_auth', 'true');
                localStorage.setItem('admin_password', password);
                localStorage.setItem('admin_user', 'alex');
                localStorage.setItem('admin_permissions', JSON.stringify(['all']));
                localStorage.setItem('admin_session_id', 'initial-session-id');
                setActions(getFallbackActions());
            } else {
                setError('Identifiants incorrects (Mode Local)');
            }
        }
    };


    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('admin_auth');
        localStorage.removeItem('admin_password');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_permissions');
        localStorage.removeItem('admin_session_id');
        navigate('/admin'); // Force redirect to dashboard login
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen py-32">
                <div className="max-w-full mx-auto px-4 md:px-12 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl"
                    >
                        <div className="flex justify-center mb-8">
                            <div className="p-4 bg-neon-red/10 rounded-full border border-neon-red/20">
                                <Lock className="w-8 h-8 text-neon-red" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-display font-black text-white text-center mb-2 uppercase italic">
                            Accès Restreint
                        </h2>
                        <p className="text-center text-gray-400 text-sm mb-8">
                            Veuillez vous identifier pour accéder au tableau de bord.
                        </p>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="username"
                                    autoComplete="username"
                                    placeholder="Identifiant"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-neon-red transition-all"
                                />
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    autoComplete="current-password"
                                    placeholder="Mot de passe"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-neon-red transition-all"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <p className="text-red-400 text-xs text-center font-bold">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-3 bg-neon-red hover:bg-neon-red/80 text-white font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-neon-red/20 flex items-center justify-center gap-2 group"
                            >
                                Se connecter
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-white/5">
                            <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em] text-center leading-relaxed">
                                Espace d'administration réservé à l'équipe Dropsiders.
                                Ce portail permet la gestion des actualités, des reportages festivals,
                                de la billetterie et des statistiques d'audience du site.
                            </p>
                        </div>
                    </motion.div>

                    <div className="mt-6 text-center">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-xs uppercase tracking-widest font-bold transition-all group"
                        >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Retour au site
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const storedPermissions = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
    const isAlex = localStorage.getItem('admin_user') === 'alex' || localStorage.getItem('admin_user') === 'contact@dropsiders.fr';

    const hasPermission = (p: string) => {
        // Permission Maître (Alex ou Administrateur "all" pour superadmin)
        if (p === 'superadmin') return isAlex || storedPermissions.includes('all');

        if (storedPermissions.includes('all')) return true;

        // Séparation des permissions d'action (create, edit, delete)
        const actionPermissions = ['create', 'edit', 'delete'];
        if (actionPermissions.includes(p)) {
            return storedPermissions.includes(p);
        }

        if (storedPermissions.includes(p)) return true;

        // Si l'utilisateur possède 'publications', il a accès par éfaut aux sous-sections éditoriales
        if (storedPermissions.includes('publications')) {
            const editorialSubsets = ['news', 'recaps', 'agenda', 'galeries', 'social_studio'];
            if (editorialSubsets.includes(p)) return true;
        }

        // Accès complet au Live Takeover par éfaut si on a takeover_full
        if (storedPermissions.includes('takeover_full')) {
            const liveSubsets = ['takeover_modo', 'clips', 'audio_rooms', 'hype_drops', 'shazam'];
            if (liveSubsets.includes(p)) return true;
        }

        return false;
    };

    const getIcon = (iconName: string, baseColor: string = 'white') => {
        const isHex = baseColor.startsWith('#');
        const colorStyle = isHex ? { color: baseColor } : {};
        const colorClass = isHex ? "" : `text-neon-${baseColor}`;

        switch (iconName) {
            case 'LayoutDashboard': return <LayoutDashboard className={`w-8 h-8 ${colorClass}`} style={colorStyle} />;
            case 'FileText': return <FileText className={`w-8 h-8 ${colorClass}`} style={colorStyle} />;
            case 'Music': return <Music className={`w-8 h-8 ${colorClass}`} style={colorStyle} />;
            case 'Mic': return <Mic className={`w-8 h-8 ${colorClass}`} style={colorStyle} />;
            case 'Video': return <Video className={`w-8 h-8 ${colorClass}`} style={colorStyle} />;
            case 'Calendar': return <Calendar className={`w-8 h-8 ${colorClass}`} style={colorStyle} />;
            case 'ImageIcon': return <ImageIcon className={`w-8 h-8 ${colorClass}`} style={colorStyle} />;
            case 'BarChart3': return <BarChart3 className={`w-8 h-8 ${colorClass}`} style={colorStyle} />;
            case 'ShoppingBag': return <ShoppingBag className={`w-8 h-8 ${colorClass}`} style={colorStyle} />;
            case 'Mail': return <Mail className={`w-8 h-8 ${colorClass}`} style={colorStyle} />;
            case 'Users': return <Users className={`w-8 h-8 ${colorClass}`} style={colorStyle} />;
            case 'Lock': return <Lock className={`w-8 h-8 ${colorClass}`} style={colorStyle} />;
            case 'Settings2': return <Settings2 className={`w-8 h-8 ${colorClass}`} style={colorStyle} />;
            case 'Megaphone': return <Megaphone className={`w-8 h-8 ${colorClass}`} style={colorStyle} />;
            case 'Youtube': return <Youtube className={`w-8 h-8 ${colorClass}`} style={colorStyle} />;
            case 'CheckCircle2': return <CheckCircle2 className={`w-8 h-8 ${colorClass}`} style={colorStyle} />;
            case 'Gamepad2': return <Gamepad2 className={`w-8 h-8 ${colorClass}`} style={colorStyle} />;
            default: return <FileText className={`w-8 h-8 ${colorClass}`} style={colorStyle} />;
        }
    };

    const moveAction = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === actions.length - 1) return;

        const newActions = [...actions];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newActions[index], newActions[targetIndex]] = [newActions[targetIndex], newActions[index]];

        setActions(newActions);
        setHasChanges(true);
    };

    const cycleColumns = (title: string, direction: 'left' | 'right') => {
        const action = actions.find(a => a.title === title);
        if (!action) return;

        let nextCols = action.columns || 1;
        if (direction === 'right') {
            nextCols = nextCols >= 4 ? 1 : nextCols + 1;
        } else {
            nextCols = nextCols <= 1 ? 4 : nextCols - 1;
        }

        updateActionProp(title, { columns: nextCols });
    };

    const updateActionProp = (title: string, props: any) => {
        const newActions = actions.map(a => a.title === title ? { ...a, ...props } : a);
        setActions(newActions);
        setHasChanges(true);
    };

    const deployConfig = async () => {
        setIsSaving(true);
        try {
            // 1. Save to internal API
            await apiFetch('/api/dashboard-actions/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ actions })
            });

            setHasChanges(false);
            setEditMode(false);
        } catch (e: any) {
            console.error("Error saving config:", e);
        } finally {
            setIsSaving(false);
        }
    };

    const isAdminAcc = storedPermissions.includes('all');
    // isAlex already declared above at line 330



    const filteredActions = actions.filter(action => {
        // Base permission check
        if (action.permission && !hasPermission(action.permission)) return false;

        // Search term check
        const matchSearch = !searchTerm ||
            action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            action.description.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchSearch) return false;

        // Tab selection check
        if (dashboardTab === 'ALL') return true;

        if (dashboardTab === 'NEWS') {
            // Specifically for the "News" focused experience
            return action.title === 'Contenu' || action.title === 'Agenda' || action.title === 'News Focus' || action.title === 'Social Studio';
        }

        if (dashboardTab === 'CONTENU') return action.category?.includes('CONTENU');
        if (dashboardTab === 'STUDIO') return action.category?.includes('STUDIO');
        if (dashboardTab === 'COMMUNAUTÉ') return action.category?.includes('COMMUNAUTÉ');
        if (dashboardTab === 'SHOP') return action.category?.includes('SHOP');

        return true;
    });

    return (
        <div className="min-h-screen py-32 relative overflow-hidden">
            <div className="max-w-full mx-auto px-4 md:px-12 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 text-center md:text-left flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
                >
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                            <div className="p-3 bg-neon-red/10 rounded-2xl border border-neon-red/20 rotate-12">
                                <LayoutDashboard className="w-8 h-8 text-neon-red" />
                            </div>
                            <div>
                                <h1 className="text-5xl md:text-7xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                    Tableau de <span className="text-neon-red">Bord</span>
                                </h1>
                                <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">Dropsiders Administration Suite</p>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-6">
                            <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-white text-xs uppercase tracking-widest font-bold transition-all group">
                                <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                                Retour au site
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center gap-2 text-red-500/60 hover:text-red-500 text-xs uppercase tracking-widest font-black transition-all group"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                Déconnexion
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                        <div className="flex flex-wrap items-center gap-2 mb-2 md:mb-0">
                            {editMode ? (
                                <>
                                    <button
                                        onClick={deployConfig}
                                        disabled={isSaving || !hasChanges}
                                        className="px-6 py-2 bg-neon-green/10 hover:bg-neon-green border border-neon-green/30 text-neon-green hover:text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 shadow-lg shadow-neon-green/10"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                                    </button>
                                    <button
                                        onClick={() => { setEditMode(false); fetchActions(); }}
                                        className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all"
                                    >
                                        Annuler
                                    </button>
                                </>
                            ) : (
                                <>
                                    {isAdminAcc && (
                                        <button
                                            onClick={() => setEditMode(true)}
                                            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-400 flex items-center gap-2"
                                        >
                                            <Paintbrush className="w-3.5 h-3.5" />
                                            Mode Édition
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="relative w-full md:w-80 group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-red transition-colors">
                                <Search className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="RECHERCHER UN ACCÈS..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl md:rounded-full py-3 md:py-2 pl-12 pr-4 text-white text-xs font-black uppercase tracking-widest focus:border-neon-red outline-none transition-all placeholder:text-gray-700"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={fetchActions}
                                className="w-10 h-10 md:w-auto md:px-6 md:py-2 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl md:rounded-full text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all gap-2"
                                title="Rafraîchir les données"
                            >
                                <RefreshCw className="w-4 h-4 md:w-4 md:h-4" />
                                <span className="hidden md:inline">Actualiser</span>
                            </button>
                            {/* Boutons Admin : Bandeau et Takeover */}
                            {(isAdminAcc || storedPermissions.includes('takeover_modo')) && (
                                <>
                                    <button
                                        onClick={() => setIsBannerModalOpen(true)}
                                        title="Bandeau"
                                        className={`w-10 h-10 md:w-auto md:px-6 md:py-2 flex items-center justify-center rounded-xl md:rounded-full text-xs font-black uppercase tracking-widest transition-all gap-2 border ${bannerState.enabled ? 'bg-neon-orange/10 border-neon-orange/40 text-neon-orange hover:bg-neon-orange hover:text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                                    >
                                        <Megaphone className="w-4 h-4" />
                                        <span className="hidden md:inline">Bandeau</span>
                                    </button>
                                    <button
                                        onClick={() => setIsClipsModalOpen(true)}
                                        title="Gestion Clips"
                                        className="w-10 h-10 md:w-auto md:px-6 md:py-2 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl md:rounded-full text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white hover:border-neon-cyan transition-all gap-2"
                                    >
                                        <Video className="w-4 h-4" />
                                        <span className="hidden md:inline">Clips</span>
                                    </button>
                                    <Link
                                        to="/live"
                                        title="Accès Live"
                                        className={`w-10 h-10 md:w-auto md:px-6 md:py-2 flex items-center justify-center rounded-xl md:rounded-full text-xs font-black uppercase tracking-widest transition-all gap-2 border ${takeoverState.enabled ? 'bg-neon-red/10 border-neon-red/40 text-neon-red hover:bg-neon-red hover:text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                                    >
                                        <Youtube className="w-4 h-4" />
                                        <span className="hidden md:inline">Live</span>
                                    </Link>

                                    {/* Live Status Controls */}
                                    <div className="flex bg-black/40 border border-white/10 rounded-xl md:rounded-full p-1 w-full md:w-auto md:ml-2 mt-2 md:mt-0 justify-between md:justify-start">
                                        <button
                                            onClick={() => updateLiveStatus('off')}
                                            disabled={isUpdatingTakeover}
                                            className={`flex-1 md:flex-none px-4 py-2 md:py-1.5 rounded-lg md:rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${takeoverState.status === 'off' || !takeoverState.enabled ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            OFF
                                        </button>
                                        <button
                                            onClick={() => updateLiveStatus('edit')}
                                            disabled={isUpdatingTakeover}
                                            className={`flex-1 md:flex-none px-4 py-2 md:py-1.5 rounded-lg md:rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${takeoverState.status === 'edit' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            ÉDIT
                                        </button>
                                        <button
                                            onClick={() => updateLiveStatus('live')}
                                            disabled={isUpdatingTakeover}
                                            className={`flex-1 md:flex-none px-4 py-2 md:py-1.5 rounded-lg md:rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${takeoverState.status === 'live' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20 animate-pulse' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            ON AIR
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Dashboard Tabs - Navigation Mobile Optimize */}
                <div className="mb-12 overflow-x-auto pb-4 no-scrollbar">
                    <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 w-max mx-auto md:mx-0">
                        {DASHBOARD_TABS.map((tab) => {
                            const isActive = dashboardTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setDashboardTab(tab.id as any)}
                                    className={`px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all whitespace-nowrap ${isActive
                                        ? 'bg-white/10 text-white border border-white/20 shadow-lg'
                                        : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-16 relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {filteredActions.map((action) => {
                                const globalIndex = filteredActions.findIndex(a => a.title === action.title);
                                return (
                                    <motion.div
                                        key={action.title}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 40 }}
                                        className={`relative group ${editMode ? (openMenu === action.title ? 'z-50' : 'z-20') : 'z-10'} ${action.columns === 2 ? 'md:col-span-2' :
                                            action.columns === 3 ? 'md:col-span-2 lg:col-span-3' :
                                                action.columns === 4 ? 'md:col-span-2 lg:col-span-4' : 'col-span-1'
                                            }`}
                                    >
                                        {editMode && (
                                            <>
                                                {/* D-Pad Controls */}
                                                <div className="absolute top-4 left-4 z-[60] grid grid-cols-3 gap-1 p-1 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                                                    <div />
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveAction(globalIndex, 'up'); }}
                                                        disabled={globalIndex === 0}
                                                        className="p-1 text-gray-400 hover:text-neon-red transition-colors disabled:opacity-10"
                                                    >
                                                        <ChevronUp className="w-4 h-4" />
                                                    </button>
                                                    <div />

                                                    <button
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); cycleColumns(action.title, 'left'); }}
                                                        className="p-1 text-gray-400 hover:text-neon-red transition-colors"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveAction(globalIndex, 'down'); }}
                                                        disabled={globalIndex === filteredActions.length - 1}
                                                        className="p-1 text-gray-400 hover:text-neon-red transition-colors disabled:opacity-10"
                                                    >
                                                        <ChevronDown className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); cycleColumns(action.title, 'right'); }}
                                                        className="p-1 text-gray-400 hover:text-neon-red transition-colors"
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="absolute top-4 right-4 z-[60]">
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMenu(openMenu === action.title ? null : action.title); }}
                                                        className={`p-2 rounded-full border border-white/10 transition-all ${openMenu === action.title ? 'bg-neon-red text-white border-neon-red' : 'bg-black/60 text-gray-400 hover:text-white shadow-xl'}`}
                                                    >
                                                        <Settings2 className="w-5 h-5" />
                                                    </button>

                                                    {openMenu === action.title && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            className="absolute top-full right-0 mt-3 w-56 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl z-[70] space-y-4"
                                                        >
                                                            <div className="space-y-2">
                                                                <label className="text-[9px] font-black uppercase text-gray-400">Largeur du bloc</label>
                                                                <div className="flex gap-1">
                                                                    {[1, 2, 3, 4].map(n => (
                                                                        <button
                                                                            key={n}
                                                                            onClick={(e) => {
                                                                                e.preventDefault(); e.stopPropagation();
                                                                                updateActionProp(action.title, { columns: n });
                                                                            }}
                                                                            className={`flex-1 py-1.5 text-[10px] font-black rounded-lg border transition-all ${action.columns === n ? 'bg-neon-red border-neon-red text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                                                        >
                                                                            x{n}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <label className="text-[9px] font-black uppercase text-gray-400">Couleur de l'onglet</label>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {['red', 'blue', 'purple', 'cyan', 'green', 'yellow', 'orange', 'pink', 'white'].map(color => (
                                                                        <button
                                                                            key={color}
                                                                            onClick={(e) => {
                                                                                e.preventDefault(); e.stopPropagation();
                                                                                updateActionProp(action.title, { baseColor: color });
                                                                            }}
                                                                            className={`w-6 h-6 rounded-full border-2 transition-all ${action.baseColor === color ? 'border-white scale-110 shadow-lg' : 'border-white/10 hover:border-white/30'}`}
                                                                            style={{
                                                                                backgroundColor: color === 'white' ? '#fff' :
                                                                                    color.startsWith('#') ? color : `var(--color-neon-${color})`
                                                                            }}
                                                                        />
                                                                    ))}
                                                                    <div className="relative group/picker">
                                                                        <input
                                                                            type="color"
                                                                            value={action.baseColor?.startsWith('#') ? action.baseColor : '#ff0000'}
                                                                            onChange={(e) => {
                                                                                e.preventDefault(); e.stopPropagation();
                                                                                updateActionProp(action.title, { baseColor: e.target.value });
                                                                            }}
                                                                            className="w-6 h-6 rounded-full overflow-hidden border-2 border-white/10 cursor-pointer"
                                                                        />
                                                                        <Paintbrush className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white pointer-events-none mix-blend-difference" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        <Link
                                            to={editMode ? "#" : action.link}
                                            onClick={(e) => {
                                                if (editMode) {
                                                    e.preventDefault();
                                                } else if (action.title === 'Bandeau') {
                                                    e.preventDefault();
                                                    setIsBannerModalOpen(true);
                                                } else if (action.title === 'Agenda') {
                                                    e.preventDefault();
                                                    setIsAgendaModalOpen(true);
                                                } else if (action.title === 'Communauté') {
                                                    e.preventDefault();
                                                    setIsCommunauteModalOpen(true);
                                                } else if (action.title === 'Team') {
                                                    e.preventDefault();
                                                    setIsTeamModalOpen(true);
                                                } else if (action.title === 'Shop') {
                                                } else if (action.title === 'Contenu') {
                                                    e.preventDefault();
                                                    setIsContenuModalOpen(true);
                                                } else if (action.title === 'Newsletter' || action.title === 'Abonnés') {
                                                    e.preventDefault();
                                                    setIsNewsletterModalOpen(true);
                                                } else if (action.title === 'LIVE / TAKEOVER') {
                                                    // Redirection directe vers le live
                                                    navigate('/live');
                                                } else if (action.link === 'social-studio') {
                                                    e.preventDefault();
                                                    setIsSocialModalOpen(true);
                                                } else if (action.link === 'downloader') {
                                                    e.preventDefault();
                                                    setIsDownloaderOpen(true);
                                                } else if (action.link === 'push-notifications') {
                                                    e.preventDefault();
                                                    setIsNotificationModalOpen(true);
                                                } else if (action.title === 'Accueil') {
                                                    e.preventDefault();
                                                    setIsAccueilModalOpen(true);
                                                } else if (action.title === 'Statistiques') {
                                                    e.preventDefault();
                                                    setIsStatsModalOpen(true);
                                                } else if (action.title === 'Spotify') {
                                                    e.preventDefault();
                                                    setIsSpotifyModalOpen(true);
                                                } else if (action.title === 'MESSAGERIE & CONTACT') {
                                                    e.preventDefault();
                                                    setIsMessagesModalOpen(true);
                                                }
                                            }}
                                            className="block h-full p-6 rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl group relative overflow-hidden"
                                            style={{
                                                borderColor: action.baseColor === 'white' ? 'rgba(255,255,255,0.1)' :
                                                    action.baseColor?.startsWith('#') ? `${action.baseColor}33` :
                                                        `var(--color-neon-${action.baseColor}33)`,
                                                backgroundColor: action.baseColor === 'white' ? 'rgba(255,255,255,0.05)' :
                                                    action.baseColor?.startsWith('#') ? `${action.baseColor}0D` :
                                                        `var(--color-neon-${action.baseColor}0D)`,
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!editMode) {
                                                    e.currentTarget.style.borderColor = action.baseColor === 'white' ? 'rgba(255,255,255,0.4)' :
                                                        action.baseColor?.startsWith('#') ? action.baseColor :
                                                            `var(--color-neon-${action.baseColor})`;
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = action.baseColor === 'white' ? 'rgba(255,255,255,0.1)' :
                                                    action.baseColor?.startsWith('#') ? `${action.baseColor}33` :
                                                        `var(--color-neon-${action.baseColor}33)`;
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-4 rounded-2xl bg-black/20 group-hover:bg-black/40 transition-colors relative">
                                                    {getIcon(action.icon, action.baseColor)}
                                                    {action.title === 'Moération' && pendingPhotosCount > 0 && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-neon-red rounded-full flex items-center justify-center border-2 border-[#050505] animate-bounce shadow-[0_0_15px_rgba(255,0,51,0.6)]">
                                                            <span className="text-[9px] font-black text-white">{pendingPhotosCount}</span>
                                                        </div>
                                                    )}
                                                    {(action.title === 'Quizz' || action.title === 'Contenu') && pendingQuizzesCount > 0 && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-neon-red rounded-full flex items-center justify-center border-2 border-[#050505] animate-bounce shadow-[0_0_15px_rgba(255,0,51,0.6)]">
                                                            <span className="text-[9px] font-black text-white">{pendingQuizzesCount}</span>
                                                        </div>
                                                    )}
                                                    {action.title === 'MESSAGERIE & CONTACT' && pendingMessagesCount > 0 && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-neon-red rounded-full flex items-center justify-center border-2 border-[#050505] animate-bounce shadow-[0_0_15px_rgba(255,0,51,0.6)]">
                                                            <span className="text-[9px] font-black text-white">{pendingMessagesCount}</span>
                                                        </div>
                                                    )}
                                                    {action.title === 'Communauté' && (pendingPhotosCount > 0 || pendingQuizzesCount > 0 || pendingMessagesCount > 0) && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-neon-red rounded-full flex items-center justify-center border-2 border-[#050505] animate-bounce shadow-[0_0_15px_rgba(255,0,51,0.6)]">
                                                            <span className="text-[9px] font-black text-white">{pendingPhotosCount + pendingMessagesCount + (pendingQuizzesCount > 0 ? 1 : 0)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-2 border border-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Plus className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-display font-black text-white uppercase italic mb-2">
                                                {action.title}
                                            </h3>
                                            <p className="hidden md:block text-gray-400 font-medium">
                                                {action.description}
                                            </p>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Modal Gestion Bandeau */}
                <AnimatePresence>
                    {isBannerModalOpen && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsBannerModalOpen(false)}
                                className="absolute inset-0 bg-black/90 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-xl bg-[#111] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                            >
                                <div className="p-8 md:p-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-neon-orange/10 rounded-2xl border border-neon-orange/20">
                                                <Activity className="w-6 h-6 text-neon-orange" />
                                            </div>
                                            <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter">
                                                Gestion <span className="text-neon-orange">Bandeau</span>
                                            </h2>
                                        </div>
                                        <button
                                            onClick={() => setIsBannerModalOpen(false)}
                                            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Status Toggle */}
                                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${bannerState.enabled ? 'bg-neon-green animate-pulse' : 'bg-gray-600'}`} />
                                                <span className="text-sm font-black uppercase tracking-widest text-white">Statut du bandeau</span>
                                            </div>
                                            <button
                                                onClick={() => setBannerState({ ...bannerState, enabled: !bannerState.enabled })}
                                                className={`relative w-12 h-6 rounded-full transition-colors ${bannerState.enabled ? 'bg-neon-orange' : 'bg-gray-800'}`}
                                            >
                                                <motion.div
                                                    animate={{ x: bannerState.enabled ? 24 : 4 }}
                                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                                                />
                                            </button>
                                        </div>

                                        {/* Text Inputs (FR & EN) */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                                                    <Type className="w-3 h-3" /> Message (FR)
                                                </label>
                                                <textarea
                                                    value={bannerState.text}
                                                    onChange={(e) => setBannerState({ ...bannerState, text: e.target.value.toUpperCase() })}
                                                    className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neon-orange transition-all min-h-[80px] resize-none"
                                                    placeholder="Message en Français..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                                                    <Type className="w-3 h-3" /> Message (EN)
                                                </label>
                                                <textarea
                                                    value={bannerState.text_en}
                                                    onChange={(e) => setBannerState({ ...bannerState, text_en: e.target.value.toUpperCase() })}
                                                    className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neon-orange transition-all min-h-[80px] resize-none"
                                                    placeholder="Message in English..."
                                                />
                                            </div>
                                        </div>

                                        {/* Link Selection */}
                                        <div className="p-5 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
                                            <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                                                <ArrowRight className="w-3 h-3 text-neon-orange" /> Redirection au clic (Lien)
                                            </label>
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                                {[
                                                    { label: 'Aucun (ésactivé)', val: '' },
                                                    { label: 'Accueil', val: '/' },
                                                    { label: 'News', val: '/news' },
                                                    { label: 'Agenda', val: '/agenda' },
                                                    { label: 'Shop (Boutique)', val: '/shop' },
                                                    { label: 'Contact', val: '/contact' }
                                                ].map(link => (
                                                    <button
                                                        key={link.val}
                                                        onClick={() => setBannerState({ ...bannerState, link: link.val })}
                                                        className={`py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border ${bannerState.link === link.val ? 'bg-neon-orange text-white border-neon-orange shadow-[0_0_15px_rgba(255,165,0,0.3)]' : 'bg-black/40 border-white/10 text-gray-500 hover:text-white hover:border-white/20'}`}
                                                    >
                                                        {link.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="URL personnalisée ou lien externe (https://...)"
                                                    value={bannerState.link}
                                                    onChange={(e) => setBannerState({ ...bannerState, link: e.target.value })}
                                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-[11px] focus:outline-none focus:border-neon-orange transition-all font-mono"
                                                />
                                                {bannerState.link && !['/', '/news', '/agenda', '/shop', '/contact', ''].includes(bannerState.link) && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-neon-orange animate-pulse" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Color & Opacity Pickers */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                                                        <Palette className="w-3 h-3" /> Fond (Background)
                                                    </label>
                                                    <div className="relative group/color">
                                                        <div
                                                            className="w-full h-12 rounded-xl border border-white/10 cursor-pointer flex items-center px-4 gap-3 bg-black/40"
                                                            style={{ borderLeft: `4px solid ${bannerState.bgColor}` }}
                                                        >
                                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: bannerState.bgColor }} />
                                                            <span className="text-xs font-mono text-gray-400">{bannerState.bgColor}</span>
                                                        </div>
                                                        <input
                                                            type="color"
                                                            value={bannerState.bgColor}
                                                            onChange={(e) => setBannerState({ ...bannerState, bgColor: e.target.value })}
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>

                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                                                        <Palette className="w-3 h-3" /> Texte
                                                    </label>
                                                    <div className="relative">
                                                        <div
                                                            className="w-full h-12 rounded-xl border border-white/10 cursor-pointer flex items-center px-4 gap-3 bg-black/40"
                                                            style={{ borderLeft: `4px solid ${bannerState.color}` }}
                                                        >
                                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: bannerState.color }} />
                                                            <span className="text-xs font-mono text-gray-400">{bannerState.color}</span>
                                                        </div>
                                                        <input
                                                            type="color"
                                                            value={bannerState.color}
                                                            onChange={(e) => setBannerState({ ...bannerState, color: e.target.value })}
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">Taille du bandeau</label>
                                                    <div className="flex bg-black/40 border border-white/10 rounded-xl p-1">
                                                        {['small', 'medium', 'large'].map((s) => (
                                                            <button
                                                                key={s}
                                                                onClick={() => setBannerState({ ...bannerState, size: s as any })}
                                                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${bannerState.size === s ? 'bg-neon-orange text-white' : 'text-gray-500 hover:text-white'}`}
                                                            >
                                                                {s === 'small' ? 'Petit' : s === 'medium' ? 'Moyen' : 'Grand'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Preview */}
                                        <div className="pt-4 border-t border-white/5">
                                            <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 text-center">Aperçu direct (taille approx.)</div>
                                            <div
                                                className={`rounded-lg overflow-hidden flex items-center px-4 border border-white/5 relative ${bannerState.size === 'small' ? 'h-6' : bannerState.size === 'large' ? 'h-12' : 'h-8'}`}
                                                style={{
                                                    backgroundColor: bannerState.bgColor,
                                                    opacity: 0.8
                                                }}
                                            >
                                                <span
                                                    className={`font-black uppercase tracking-tighter italic whitespace-nowrap ${bannerState.size === 'small' ? 'text-[12px]' : bannerState.size === 'large' ? 'text-[16px]' : 'text-[14px]'}`}
                                                    style={{ color: bannerState.color }}
                                                >
                                                    {bannerState.text || 'MESSAGE DU BANDEAU'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-4 pt-4">
                                            <button
                                                onClick={() => setIsBannerModalOpen(false)}
                                                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all border border-white/10"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                onClick={saveBannerSettings}
                                                disabled={isUpdatingBanner}
                                                className="flex-1 py-4 bg-neon-orange shadow-[0_0_20px_rgba(255,165,0,0.3)] hover:shadow-[0_0_30px_rgba(255,165,0,0.5)] text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {isUpdatingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                Enregistrer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal Choix Interview */}
                <AnimatePresence>
                    {isInterviewModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-right from-neon-purple via-neon-red to-neon-orange" />

                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            Gestion <span className="text-neon-purple">Interviews</span>
                                        </h2>
                                        <p className="text-gray-400 font-medium">Que souhaitez-vous faire ?</p>
                                    </div>
                                    <button
                                        onClick={() => setIsInterviewModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                    <Link
                                        to="/news/create?type=Interview&subtype=written"
                                        className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-neon-purple/10 hover:border-neon-purple/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-purple/20 rounded-2xl flex items-center justify-center mb-6 border border-neon-purple/30 group-hover:scale-110 transition-transform">
                                            <FileText className="w-6 h-6 text-neon-purple" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase italic mb-1">À‰crite</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Nouveau format texte</p>
                                    </Link>

                                    <Link
                                        to="/news/create?type=Interview&subtype=video"
                                        className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-neon-red/10 hover:border-neon-red/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-red/20 rounded-2xl flex items-center justify-center mb-6 border border-neon-red/30 group-hover:scale-110 transition-transform">
                                            <Youtube className="w-6 h-6 text-neon-red" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase italic mb-1">Viéo</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Nouveau format viéo</p>
                                    </Link>
                                </div>

                                <Link
                                    to="/admin/manage?tab=Interviews"
                                    className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gray-500/20 rounded-xl border border-gray-500/30">
                                            <Settings2 className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-bold text-white uppercase italic tracking-tight">Gérer mes interviews</h3>
                                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Voir, modifier ou supprimer</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:translate-x-1 transition-transform" />
                                </Link>

                                {/* Section Sélection Home */}
                                <div className="pt-8 border-t border-white/5">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tight">À€ la une sur l'accueil</h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Choisissez les 4 interviews à afficher</p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setSelectedInterviews([])}
                                                        className="text-[9px] font-black text-neon-purple hover:text-white transition-colors uppercase tracking-widest bg-neon-purple/5 px-2 py-0.5 rounded border border-neon-purple/20"
                                                    >
                                                        Mode Auto
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedInterviews(allInterviews.slice(0, 4).map(i => i.id))}
                                                        className="text-[9px] font-black text-gray-400 hover:text-white transition-colors uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/10"
                                                    >
                                                        4 Dernières
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedInterviews.length === 0 ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' : selectedInterviews.length === 4 ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20'}`}>
                                            {selectedInterviews.length === 0 ? 'AUTO' : `${selectedInterviews.length} / 4`}
                                        </div>
                                    </div>

                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            placeholder="Filtrer mes interviews..."
                                            value={interviewSearch}
                                            onChange={(e) => setInterviewSearch(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-neon-purple transition-colors"
                                        />
                                    </div>

                                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 mb-8 custom-scrollbar">
                                        {allInterviews
                                            .filter(int => !interviewSearch || int.title.toLowerCase().includes(interviewSearch.toLowerCase()))
                                            .map((int) => {
                                                const isSelected = selectedInterviews.includes(int.id);
                                                return (
                                                    <button
                                                        key={int.id}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setSelectedInterviews(prev => prev.filter(id => id !== int.id));
                                                            } else if (selectedInterviews.length < 4) {
                                                                setSelectedInterviews(prev => [...prev, int.id]);
                                                            }
                                                        }}
                                                        className={`w-full p-3 rounded-2xl border transition-all flex items-center gap-4 text-left group ${isSelected ? 'bg-neon-purple/10 border-neon-purple/40 shadow-lg shadow-neon-purple/5' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                                                    >
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                                            <img src={int.image} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className={`font-bold text-sm truncate uppercase italic tracking-tight ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                                                {int.title}
                                                            </h4>
                                                            <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mt-1">
                                                                {new Date(int.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-neon-purple border-neon-purple' : 'border-white/10'}`}>
                                                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setIsInterviewModalOpen(false)}
                                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all border border-white/10"
                                        >
                                            Fermer
                                        </button>
                                        <button
                                            onClick={saveInterviewSelection}
                                            disabled={isSavingInterviews}
                                            className="flex-1 py-4 bg-neon-purple shadow-[0_0_20px_rgba(189,0,255,0.3)] hover:shadow-[0_0_30px_rgba(189,0,255,0.5)] text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isSavingInterviews ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Enregistrer Home
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal News */}
                <AnimatePresence>
                    {isNewsModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-cyan to-neon-blue" />

                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            Gestion <span className="text-neon-blue">News</span>
                                        </h2>
                                        <p className="text-gray-400 font-medium">Que souhaitez-vous faire ?</p>
                                    </div>
                                    <button
                                        onClick={() => setIsNewsModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                    <Link
                                        to="/news/create"
                                        onClick={() => setIsNewsModalOpen(false)}
                                        className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-neon-blue/10 hover:border-neon-blue/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-blue/20 rounded-2xl flex items-center justify-center mb-6 border border-neon-blue/30 group-hover:scale-110 transition-transform">
                                            <FileText className="w-6 h-6 text-neon-blue" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase italic mb-1">Actualité</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Nouvel article news</p>
                                    </Link>

                                    <Link
                                        to="/news/create?type=Musique"
                                        onClick={() => setIsNewsModalOpen(false)}
                                        className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-neon-cyan/10 hover:border-neon-cyan/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-cyan/20 rounded-2xl flex items-center justify-center mb-6 border border-neon-cyan/30 group-hover:scale-110 transition-transform">
                                            <Music className="w-6 h-6 text-neon-cyan" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase italic mb-1">Musique</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Nouvel article musique</p>
                                    </Link>

                                    <Link
                                        to="/news/create?tab=Focus"
                                        onClick={() => setIsNewsModalOpen(false)}
                                        className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-neon-purple/10 hover:border-neon-purple/50 transition-all group sm:col-span-2 lg:col-span-1"
                                    >
                                        <div className="w-12 h-12 bg-neon-purple/20 rounded-2xl flex items-center justify-center mb-6 border border-neon-purple/30 group-hover:scale-110 transition-transform">
                                            <Zap className="w-6 h-6 text-neon-purple" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase italic mb-1">Focus</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Focus de la semaine</p>
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Link
                                        to="/admin/manage?tab=News"
                                        onClick={() => setIsNewsModalOpen(false)}
                                        className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-gray-500/20 rounded-xl border border-gray-500/30">
                                                <Settings2 className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="font-bold text-white uppercase italic tracking-tight">Gérer les News</h3>
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Voir, modifier ou supprimer</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-500 group-hover:translate-x-1 transition-transform" />
                                    </Link>

                                    <Link
                                        to="/admin/manage?tab=Focus"
                                        onClick={() => setIsNewsModalOpen(false)}
                                        className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between hover:bg-neon-yellow/10 border-neon-yellow/20 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-neon-yellow/10 rounded-xl border border-neon-yellow/20">
                                                <Star className="w-5 h-5 text-neon-yellow fill-neon-yellow" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="font-bold text-white uppercase italic tracking-tight text-neon-yellow">Gérer les Focus</h3>
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Voir les articles épinglés</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-neon-yellow group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal Social Studio */}
                <AnimatePresence>
                    {isSocialModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-pink via-[#ee2a7b] to-[#f9ce34]" />

                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            Social <span className="text-neon-pink">Studio</span>
                                        </h2>
                                        <p className="text-gray-400 font-medium">Générez des visuels pour vos réseaux</p>
                                    </div>
                                    <button
                                        onClick={() => setIsSocialModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Sélectionner un article récent ou créer à vide</div>
                                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                        <button
                                            onClick={() => {
                                                setSelectedSocialArticle({ title: '', image: '' });
                                                setIsSocialModalOpen(false);
                                            }}
                                            className="w-full p-6 bg-neon-pink/10 border border-neon-pink/30 rounded-3xl flex items-center gap-6 hover:bg-neon-pink/20 transition-all group text-left"
                                        >
                                            <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                <Plus className="w-8 h-8 text-neon-pink" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-black text-white uppercase italic text-lg tracking-tighter">Visuel Vide / Manuel</h3>
                                                <p className="text-[10px] text-neon-pink/60 font-black uppercase tracking-widest">émarrer sans article</p>
                                            </div>
                                            <ArrowRight className="w-6 h-6 text-neon-pink" />
                                        </button>

                                        {isLoadingSocial ? (
                                            <div className="py-10 flex justify-center">
                                                <Loader2 className="w-8 h-8 animate-spin text-neon-pink" />
                                            </div>
                                        ) : socialRecentArticles.length > 0 ? (
                                            socialRecentArticles.map(article => (
                                                <button
                                                    key={article.id}
                                                    onClick={() => {
                                                        setSelectedSocialArticle(article);
                                                        setIsSocialModalOpen(false);
                                                    }}
                                                    className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 hover:bg-white/10 hover:border-white/20 transition-all group text-left"
                                                >
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/40 border border-white/10 flex-shrink-0">
                                                        <img src={article.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-white uppercase italic truncate text-sm">{article.title}</h3>
                                                        <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{article.date || article.pubDate}</p>
                                                    </div>
                                                    <Instagram className="w-5 h-5 text-gray-600 group-hover:text-neon-pink transition-colors" />
                                                </button>
                                            ))
                                        ) : (
                                            <div className="py-10 text-center text-gray-600 uppercase text-xs font-bold tracking-widest">Aucun article trouvé</div>
                                        )}
                                    </div>

                                    <Link
                                        to="/admin/manage"
                                        className="block w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                        onClick={() => setIsSocialModalOpen(false)}
                                    >
                                        Voir tout le contenu
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {selectedSocialArticle && (
                        <SocialSuite
                            title={selectedSocialArticle.title}
                            imageUrl={selectedSocialArticle.image}
                            onClose={() => setSelectedSocialArticle(null)}
                        />
                    )}
                </AnimatePresence>

                {/* Modal Agenda */}
                <AnimatePresence>
                    {isAgendaModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-yellow via-neon-orange to-neon-yellow" />


                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            Gestion <span className="text-neon-yellow">Agenda</span>
                                        </h2>
                                        <p className="text-gray-400 font-medium">Que souhaitez-vous faire ?</p>
                                    </div>
                                    <button
                                        onClick={() => setIsAgendaModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <Link
                                        to="/agenda/create"
                                        onClick={() => setIsAgendaModalOpen(false)}
                                        className="w-full p-8 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-neon-yellow/10 hover:border-neon-yellow/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-yellow/20 rounded-2xl flex items-center justify-center border border-neon-yellow/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                            <Plus className="w-6 h-6 text-neon-yellow" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white uppercase italic mb-1">Nouvel événement</h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Ajouter une date</p>
                                        </div>
                                    </Link>

                                    <Link
                                        to="/admin/manage?tab=Agenda"
                                        onClick={() => setIsAgendaModalOpen(false)}
                                        className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-gray-500/20 rounded-xl border border-gray-500/30">
                                                <Settings2 className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="font-bold text-white uppercase italic tracking-tight">Gérer l'agenda</h3>
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Voir, modifier ou supprimer</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-500 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal Communauté */}
                <AnimatePresence>
                    {isGalerieModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-pink via-neon-purple to-neon-pink" />

                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            Gestion <span className="text-neon-pink">Communauté</span>
                                        </h2>
                                        <p className="text-gray-400 font-medium">Que souhaitez-vous faire ?</p>
                                    </div>
                                    <button
                                        onClick={() => setIsGalerieModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <Link
                                        to="/galerie/create"
                                        onClick={() => setIsGalerieModalOpen(false)}
                                        className="w-full p-8 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-neon-pink/10 hover:border-neon-pink/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-pink/20 rounded-2xl flex items-center justify-center border border-neon-pink/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                            <Plus className="w-6 h-6 text-neon-pink" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-xl font-bold text-white uppercase italic mb-1">Nouvel album</h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Créer une galerie photo</p>
                                        </div>
                                    </Link>

                                    <Link
                                        to="/admin/manage?tab=Communauté"
                                        onClick={() => setIsGalerieModalOpen(false)}
                                        className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-gray-500/20 rounded-xl border border-gray-500/30">
                                                <Settings2 className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="font-bold text-white uppercase italic tracking-tight">Gérer les galeries</h3>
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Voir, modifier ou supprimer</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-500 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                {/* Modal Musique */}
                <AnimatePresence>
                    {isMusiqueModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-green via-white to-neon-green" />

                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            Gestion <span className="text-neon-green">Musique</span>
                                        </h2>
                                        <p className="text-gray-400 font-medium">Que souhaitez-vous faire ?</p>
                                    </div>
                                    <button
                                        onClick={() => setIsMusiqueModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                    <Link
                                        to="/news/create?type=Musique"
                                        onClick={() => setIsMusiqueModalOpen(false)}
                                        className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-neon-green/10 hover:border-neon-green/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-green/20 rounded-2xl flex items-center justify-center mb-6 border border-neon-green/30 group-hover:scale-110 transition-transform">
                                            <Plus className="w-6 h-6 text-neon-green" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase italic mb-1">Nouvel Article</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Focus musique</p>
                                    </Link>

                                    <Link
                                        to="/admin/manage?tab=Musique"
                                        onClick={() => setIsMusiqueModalOpen(false)}
                                        className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                                            <Settings2 className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase italic mb-1">Gérer</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Voir tous les articles</p>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal Récaps */}
                <AnimatePresence>
                    {isRecapModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-white to-neon-red" />

                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            Gestion <span className="text-neon-red">Récaps</span>
                                        </h2>
                                        <p className="text-gray-400 font-medium">Que souhaitez-vous faire ?</p>
                                    </div>
                                    <button
                                        onClick={() => setIsRecapModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                    <Link
                                        to="/recaps/create"
                                        onClick={() => setIsRecapModalOpen(false)}
                                        className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-neon-red/10 hover:border-neon-red/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-red/20 rounded-2xl flex items-center justify-center mb-6 border border-neon-red/30 group-hover:scale-110 transition-transform">
                                            <Plus className="w-6 h-6 text-neon-red" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase italic mb-1">Nouveau Récap</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Reportage Festival</p>
                                    </Link>

                                    <Link
                                        to="/admin/manage?tab=Recaps"
                                        onClick={() => setIsRecapModalOpen(false)}
                                        className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                                            <Settings2 className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase italic mb-1">Gérer</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Modifier les récaps</p>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal Messagerie */}
                <AnimatePresence>
                    {isMessagesModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-xl w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-orange via-white to-neon-orange" />

                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            Gestion <span className="text-neon-orange">Messages</span>
                                        </h2>
                                        <p className="text-gray-400 font-medium">Accès directs</p>
                                    </div>
                                    <button
                                        onClick={() => setIsMessagesModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <Link
                                        to="/admin/messages"
                                        onClick={() => setIsMessagesModalOpen(false)}
                                        className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-neon-orange/10 hover:border-neon-orange/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-orange/20 rounded-2xl flex items-center justify-center border border-neon-orange/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                            <Mail className="w-6 h-6 text-neon-orange" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white uppercase italic mb-1">Boîte de réception</h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Voir tous les messages</p>
                                        </div>
                                    </Link>

                                    <Link
                                        to="/admin/messages?tab=contact-settings"
                                        onClick={() => setIsMessagesModalOpen(false)}
                                        className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-white/10 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform flex-shrink-0">
                                            <Settings2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white uppercase italic mb-1">Paramètres Contact</h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Emails & Destinataires</p>
                                        </div>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal Shop */}
                <AnimatePresence>
                    {isShopModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-xl w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-pink via-white to-neon-pink" />

                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            Gestion <span className="text-neon-pink">Shop</span>
                                        </h2>
                                        <p className="text-gray-400 font-medium">Boutique en ligne</p>
                                    </div>
                                    <button
                                        onClick={() => setIsShopModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <Link
                                        to="/shop"
                                        target="_blank"
                                        onClick={() => setIsShopModalOpen(false)}
                                        className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-neon-pink/10 hover:border-neon-pink/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-pink/20 rounded-2xl flex items-center justify-center border border-neon-pink/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                            <ShoppingBag className="w-6 h-6 text-neon-pink" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white uppercase italic mb-1">Aller au Shop</h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Voir la boutique en ligne</p>
                                        </div>
                                    </Link>

                                    <Link
                                        to="/admin/shop"
                                        onClick={() => setIsShopModalOpen(false)}
                                        className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-white/10 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform flex-shrink-0">
                                            <Plus className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white uppercase italic mb-1">Gestion Catalogue</h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Ajouter ou modifier des produits</p>
                                        </div>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                {/* Modal Accueil */}
                <AnimatePresence>
                    {isAccueilModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-xl w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-white to-neon-blue" />

                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            Gestion <span className="text-neon-blue">Accueil</span>
                                        </h2>
                                        <p className="text-gray-400 font-medium">Configuration globale</p>
                                    </div>
                                    <button
                                        onClick={() => setIsAccueilModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <Link
                                        to="/admin/home"
                                        onClick={() => setIsAccueilModalOpen(false)}
                                        className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-neon-blue/10 hover:border-neon-blue/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-blue/20 rounded-2xl flex items-center justify-center border border-neon-blue/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                            <LayoutDashboard className="w-6 h-6 text-neon-blue" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white uppercase italic mb-1">Vues Accueil</h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Gérer les sections & le live</p>
                                        </div>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal Statistiques */}
                <AnimatePresence>
                    {isStatsModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-xl w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-white to-neon-cyan" />

                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            Analyses <span className="text-neon-cyan">& Stats</span>
                                        </h2>
                                        <p className="text-gray-400 font-medium">Performance du site</p>
                                    </div>
                                    <button
                                        onClick={() => setIsStatsModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <Link
                                        to="/admin/stats"
                                        onClick={() => setIsStatsModalOpen(false)}
                                        className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-neon-cyan/10 hover:border-neon-cyan/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-cyan/20 rounded-2xl flex items-center justify-center border border-neon-cyan/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                            <BarChart3 className="w-6 h-6 text-neon-cyan" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white uppercase italic mb-1">Vues Internes</h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Statistiques par article</p>
                                        </div>
                                    </Link>

                                    <a
                                        href="https://analytics.google.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-white/10 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform flex-shrink-0">
                                            <Globe className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white uppercase italic mb-1">Google Analytics</h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Analyse étaillée</p>
                                        </div>
                                    </a>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal Spotify */}
                <AnimatePresence>
                    {isSpotifyModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-xl w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-green via-white to-neon-green" />

                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            Gestion <span className="text-neon-green">Spotify</span>
                                        </h2>
                                        <p className="text-gray-400 font-medium">Musique & Playlists</p>
                                    </div>
                                    <button
                                        onClick={() => setIsSpotifyModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <Link
                                        to="/admin/spotify"
                                        onClick={() => setIsSpotifyModalOpen(false)}
                                        className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-neon-green/10 hover:border-neon-green/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-green/20 rounded-2xl flex items-center justify-center border border-neon-green/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                            <Music className="w-6 h-6 text-neon-green" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white uppercase italic mb-1">Playlists Accueil</h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Gérer le top 10 hebdo</p>
                                        </div>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal Newsletter */}
                <AnimatePresence>
                    {isNewsletterModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-xl w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-white to-green-400" />

                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            Gestion <span className="text-green-400">Newsletter</span>
                                        </h2>
                                        <p className="text-gray-400 font-medium">Campagnes & Abonnés</p>
                                    </div>
                                    <button
                                        onClick={() => setIsNewsletterModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Link
                                        to="/newsletter/studio"
                                        onClick={() => setIsNewsletterModalOpen(false)}
                                        className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-green-400/10 hover:border-green-400/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-green-400/20 rounded-2xl flex items-center justify-center mb-6 border border-green-400/30 group-hover:scale-110 transition-transform">
                                            <Mail className="w-6 h-6 text-green-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase italic mb-1">Studio</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Créer une campagne</p>
                                    </Link>

                                    <Link
                                        to="/newsletter/admin"
                                        onClick={() => setIsNewsletterModalOpen(false)}
                                        className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase italic mb-1">Abonnés</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Gérer la liste mail</p>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal Contenu (À‰ditorial) */}
                <AnimatePresence>
                    {isContenuModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-4xl w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-white to-neon-cyan" />

                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            Gestion <span className="text-neon-cyan">Contenu Editorial</span>
                                        </h2>
                                        <p className="text-gray-400 font-medium">Contrôle des articles et médias</p>
                                    </div>
                                    <button
                                        onClick={() => setIsContenuModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                                    <button
                                        onClick={() => { setIsNewsModalOpen(true); setIsContenuModalOpen(false); }}
                                        className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-neon-blue/10 hover:border-neon-blue/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-blue/20 rounded-2xl flex items-center justify-center border border-neon-blue/30 group-hover:scale-110 transition-transform">
                                            <FileText className="w-6 h-6 text-neon-blue" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-bold text-white uppercase italic">News</h3>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Articles & Actus</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { setIsMusiqueModalOpen(true); setIsContenuModalOpen(false); }}
                                        className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-neon-green/10 hover:border-neon-green/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-green/20 rounded-2xl flex items-center justify-center border border-neon-green/30 group-hover:scale-110 transition-transform">
                                            <Music className="w-6 h-6 text-neon-green" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-bold text-white uppercase italic">Musique</h3>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Focus & Releases</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { setIsInterviewModalOpen(true); setIsContenuModalOpen(false); }}
                                        className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-neon-purple/10 hover:border-neon-purple/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-purple/20 rounded-2xl flex items-center justify-center border border-neon-purple/30 group-hover:scale-110 transition-transform">
                                            <Mic className="w-6 h-6 text-neon-purple" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-bold text-white uppercase italic">Interviews</h3>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Gestion Artistes</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { setIsRecapModalOpen(true); setIsContenuModalOpen(false); }}
                                        className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-neon-red/10 hover:border-neon-red/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-red/20 rounded-2xl flex items-center justify-center border border-neon-red/30 group-hover:scale-110 transition-transform">
                                            <Video className="w-6 h-6 text-neon-red" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-bold text-white uppercase italic">Récaps</h3>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Reportages</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { setIsQuizModalOpen(true); setIsContenuModalOpen(false); }}
                                        className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-neon-red/10 hover:border-neon-red/50 transition-all group relative"
                                    >

                                        <div className="w-12 h-12 bg-neon-red/20 rounded-2xl flex items-center justify-center border border-neon-red/30 group-hover:scale-110 transition-transform">
                                            <Gamepad2 className="w-6 h-6 text-neon-red" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-bold text-white uppercase italic">Quizz</h3>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Jeux & Blind Test</p>
                                        </div>
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal Communauté */}
                <AnimatePresence>
                    {isCommunauteModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-4xl w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-pink via-white to-neon-pink" />

                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            COMMUNAUTÀ‰
                                        </h2>
                                        <p className="text-gray-400 font-medium tracking-widest uppercase text-[10px]">Espace de partage et galeries</p>
                                    </div>
                                    <button
                                        onClick={() => setIsCommunauteModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                                    <button
                                        onClick={() => { setIsGalerieModalOpen(true); setIsCommunauteModalOpen(false); }}
                                        className="p-8 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-6 hover:bg-neon-pink/10 hover:border-neon-pink/50 transition-all group lg:col-span-1"
                                    >
                                        <div className="w-16 h-16 bg-neon-pink/20 rounded-2xl flex items-center justify-center border border-neon-pink/30 group-hover:scale-110 transition-transform">
                                            <ImageIcon className="w-8 h-8 text-neon-pink" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-xl font-bold text-white uppercase italic">Albums</h3>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] leading-none mt-2">Galeries Photos</p>
                                        </div>
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal Team */}
                <AnimatePresence>
                    {isTeamModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-4xl w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-white to-neon-blue" />

                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            TEAM
                                        </h2>
                                        <p className="text-gray-400 font-medium tracking-widest uppercase text-[10px]">Gestion interne et accès</p>
                                    </div>
                                    <button
                                        onClick={() => setIsTeamModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                                    <button
                                        onClick={() => { setIsModerationModalOpen(true); setIsTeamModalOpen(false); }}
                                        className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-neon-red/10 hover:border-neon-red/50 transition-all group relative"
                                    >
                                        <div className="w-12 h-12 bg-neon-red/20 rounded-2xl flex items-center justify-center border border-neon-red/30 group-hover:scale-110 transition-transform">
                                            <ShieldAlert className="w-6 h-6 text-neon-red" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-bold text-white uppercase italic">Moderation</h3>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Photos Viewers</p>
                                        </div>
                                        {pendingPhotosCount > 0 && (
                                            <div className="absolute top-4 right-4 w-6 h-6 bg-neon-red rounded-full flex items-center justify-center border-2 border-[#050505] animate-bounce shadow-lg">
                                                <span className="text-[10px] font-black text-white">{pendingPhotosCount}</span>
                                            </div>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => { setIsEditorsModalOpen(true); setIsTeamModalOpen(false); }}
                                        className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-neon-blue/10 hover:border-neon-blue/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-blue/20 rounded-2xl flex items-center justify-center border border-neon-blue/30 group-hover:scale-110 transition-transform">
                                            <Users className="w-6 h-6 text-neon-blue" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-bold text-white uppercase italic">À‰quipe</h3>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Membres Actifs</p>
                                        </div>
                                    </button>

                                    <button
                                        className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-neon-purple/10 hover:border-neon-purple/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-purple/20 rounded-2xl flex items-center justify-center border border-neon-purple/30 group-hover:scale-110 transition-transform">
                                            <Pencil className="w-6 h-6 text-neon-purple" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-bold text-white uppercase italic">À‰diteurs</h3>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Droits & Profils</p>
                                        </div>
                                    </button>

                                    <button
                                        className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-neon-cyan/10 hover:border-neon-cyan/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-cyan/20 rounded-2xl flex items-center justify-center border border-neon-cyan/30 group-hover:scale-110 transition-transform">
                                            <Shield className="w-6 h-6 text-neon-cyan" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-bold text-white uppercase italic">Sécurité</h3>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Logs & Banlist</p>
                                        </div>
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal À‰diteurs */}
                <AnimatePresence>
                    {isEditorsModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-xl w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-white to-neon-red" />

                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            Gestion <span className="text-neon-red">À‰diteurs</span>
                                        </h2>
                                        <p className="text-gray-400 font-medium">Contrôle des accès</p>
                                    </div>
                                    <button
                                        onClick={() => setIsEditorsModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <Link
                                        to="/admin/editors"
                                        onClick={() => setIsEditorsModalOpen(false)}
                                        className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-neon-red/10 hover:border-neon-red/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-red/20 rounded-2xl flex items-center justify-center border border-neon-red/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                            <Lock className="w-6 h-6 text-neon-red" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white uppercase italic mb-1">Comptes À‰diteurs</h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Créer & Gérer les permissions</p>
                                        </div>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal Mots de passe */}
                <AnimatePresence>
                    {isSettingsModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-xl w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-purple via-white to-neon-purple" />

                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            Sécurité <span className="text-neon-purple">& Accès</span>
                                        </h2>
                                        <p className="text-gray-400 font-medium">Paramètres système</p>
                                    </div>
                                    <button
                                        onClick={() => setIsSettingsModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <Link
                                        to="/admin/settings"
                                        onClick={() => setIsSettingsModalOpen(false)}
                                        className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 hover:bg-neon-purple/10 hover:border-neon-purple/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-neon-purple/20 rounded-2xl flex items-center justify-center border border-neon-purple/30 group-hover:scale-110 transition-transform flex-shrink-0">
                                            <Lock className="w-6 h-6 text-neon-purple" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white uppercase italic mb-1">Mots de passe</h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Modifier les accès globaux</p>
                                        </div>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                {/* Modal Live / Takeover removed, merged to TakeoverPage */}
                <AnimatePresence>
                    {false && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-8 lg:p-12 max-w-5xl w-full h-[90vh] shadow-2xl relative overflow-hidden flex flex-col"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-white to-neon-red" />

                                <div className="flex justify-between items-start mb-6 shrink-0">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-1">
                                            Live <span className="text-neon-red">Takeover</span>
                                        </h2>
                                        <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">Prendre le contrôle de la page d'accueil</p>
                                    </div>
                                    <button
                                        onClick={() => { }}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="flex bg-black/50 border border-white/10 rounded-2xl p-1 mb-6 overflow-x-auto z-20 relative no-scrollbar">
                                    <div className="flex min-w-max">
                                        <button onClick={() => setTakeoverTab('general')} className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${takeoverTab === 'general' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>LIVE / VIDÀ‰O</button>
                                        <button onClick={() => setTakeoverTab('ticker')} className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${takeoverTab === 'ticker' ? 'bg-neon-red/10 text-neon-red shadow-lg' : 'text-gray-500 hover:text-white'}`}>BANDEAU</button>
                                        <button onClick={() => setTakeoverTab('moderation')} className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${takeoverTab === 'moderation' ? 'bg-yellow-500/10 text-yellow-500 shadow-lg' : 'text-gray-500 hover:text-white'}`}>MODÀ‰RATION</button>
                                        <button onClick={() => setTakeoverTab('planning')} className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${takeoverTab === 'planning' ? 'bg-neon-purple/10 text-neon-purple shadow-lg' : 'text-gray-500 hover:text-white'}`}>PLANNING</button>
                                        <button onClick={() => setTakeoverTab('mods')} className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${takeoverTab === 'mods' ? 'bg-neon-cyan/10 text-neon-cyan shadow-lg' : 'text-gray-500 hover:text-white'}`}>À‰QUIPE</button>
                                        <button onClick={() => setTakeoverTab('bot')} className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${takeoverTab === 'bot' ? 'bg-neon-cyan/10 text-neon-cyan shadow-lg' : 'text-gray-500 hover:text-white'}`}>BOT</button>
                                        <button onClick={() => setTakeoverTab('access')} className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${takeoverTab === 'access' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>ACCÀˆS</button>
                                        <button onClick={() => setTakeoverTab('blocked')} className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${takeoverTab === 'blocked' ? 'bg-red-500/10 text-red-500 shadow-lg' : 'text-gray-500 hover:text-white'}`}>BLOQUÀ‰S</button>
                                        <button
                                            onClick={() => {
                                                setTakeoverTab('clips');
                                                fetchClips();
                                            }}
                                            className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${takeoverTab === 'clips' ? 'bg-neon-cyan/10 text-neon-cyan shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            VIDÀ‰O / CLIPS
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-30 min-h-0">
                                    {takeoverTab === 'general' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-2xl transition-all ${takeoverState.enabled ? 'bg-neon-red/20 text-neon-red' : 'bg-gray-800 text-gray-400'}`}>
                                                        <Activity className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-black uppercase italic tracking-wider">Activer le Mode Live</p>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Le système Live est opérationnel</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (takeoverState.isSecret) return;
                                                        setTakeoverState({ ...takeoverState, enabled: !takeoverState.enabled });
                                                    }}
                                                    disabled={takeoverState.isSecret}
                                                    className={`w-14 h-7 rounded-full relative transition-all ${takeoverState.enabled || takeoverState.isSecret ? 'bg-neon-red shadow-[0_0_20px_#ff003344]' : 'bg-gray-800'} ${takeoverState.isSecret ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${(takeoverState.enabled || takeoverState.isSecret) ? 'right-1' : 'left-1'}`} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5">
                                                    <div className="flex flex-col">
                                                        <p className="text-[11px] font-black text-white uppercase tracking-widest">Forcer l'accueil</p>
                                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Remplace la Home par le Live</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setTakeoverState({ ...takeoverState, forceHomepage: !takeoverState.forceHomepage })}
                                                        className={`w-10 h-5 rounded-full relative transition-all ${takeoverState.forceHomepage ? 'bg-neon-red' : 'bg-gray-800'}`}
                                                    >
                                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${takeoverState.forceHomepage ? 'right-0.5' : 'left-0.5'}`} />
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5">
                                                    <div className="flex flex-col">
                                                        <p className="text-[11px] font-black text-white uppercase tracking-widest">Afficher dans le Menu</p>
                                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Icône Video en haut du site</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setTakeoverState({ ...takeoverState, showInNavbar: !takeoverState.showInNavbar })}
                                                        className={`w-10 h-5 rounded-full relative transition-all ${takeoverState.showInNavbar ? 'bg-neon-cyan' : 'bg-gray-800'}`}
                                                    >
                                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${takeoverState.showInNavbar ? 'right-0.5' : 'left-0.5'}`} />
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5 group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col">
                                                            <p className="text-[11px] font-black text-neon-purple uppercase tracking-widest flex items-center gap-2">
                                                                Mode Secret (PWD: 2026)
                                                                {takeoverState.isSecret && (
                                                                    <Link
                                                                        to="/live"
                                                                        target="_blank"
                                                                        className="p-1 px-2 border border-neon-purple/30 bg-neon-purple/20 text-neon-purple rounded-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 group"
                                                                        title="Voir le Live Secret"
                                                                    >
                                                                        <ExternalLink className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                                                                        <span className="text-[8px] font-black uppercase tracking-widest">Voir le Live</span>
                                                                    </Link>
                                                                )}
                                                            </p>
                                                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Activation + Protection 2026</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setTakeoverState({
                                                            ...takeoverState,
                                                            isSecret: !takeoverState.isSecret,
                                                            // If turning secret ON, also enable the live (takeover)
                                                            enabled: !takeoverState.isSecret ? true : takeoverState.enabled
                                                        })}
                                                        className={`w-10 h-5 rounded-full relative transition-all ${takeoverState.isSecret ? 'bg-neon-purple shadow-[0_0_10px_#bc13fe44]' : 'bg-gray-800'}`}
                                                    >
                                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${takeoverState.isSecret ? 'right-0.5' : 'left-0.5'}`} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-4 bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Video className="w-5 h-5 text-neon-red" />
                                                        <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Chaînes / Caméras</h3>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const current = (takeoverState.channels || '').split('\n').filter(l => l.length > 0);
                                                            const updated = [...current, ':NOUVELLE CAM'].join('\n');
                                                            setTakeoverState({ ...takeoverState, channels: updated });
                                                        }}
                                                        className="px-3 py-1.5 bg-neon-red text-white text-[8px] font-black uppercase rounded-lg hover:scale-105 transition-all"
                                                    >
                                                        + Ajouter
                                                    </button>
                                                </div>

                                                <div className="space-y-3">
                                                    {(takeoverState.channels || '').split('\n').filter(l => l.length > 0).map((line, idx) => {
                                                        const parts = line.split(':');
                                                        const id = parts[0] || '';
                                                        const title = parts.slice(1).join(':') || '';

                                                        const updateChannel = (newId: string, newTitle: string) => {
                                                            const rows = (takeoverState.channels || '').split('\n').map((l, i) => {
                                                                if (i === idx) return `${newId}:${newTitle}`;
                                                                return l;
                                                            });
                                                            setTakeoverState({ ...takeoverState, channels: rows.join('\n') });
                                                        };

                                                        const deleteChannel = () => {
                                                            const rows = (takeoverState.channels || '').split('\n').filter((_, i) => i !== idx);
                                                            setTakeoverState({ ...takeoverState, channels: rows.join('\n') });
                                                        };

                                                        return (
                                                            <div key={idx} className="grid grid-cols-12 gap-2 bg-black/20 p-2 rounded-xl border border-white/5 group">
                                                                <div className="col-span-5">
                                                                    <div className="flex flex-col gap-1">
                                                                        <label className="text-[7px] text-gray-500 font-black uppercase tracking-widest ml-1">ID Viéo / Lien</label>
                                                                        <input
                                                                            type="text"
                                                                            value={id}
                                                                            onChange={e => updateChannel(e.target.value, title)}
                                                                            placeholder="ID YouTube..."
                                                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-neon-red outline-none"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="col-span-6">
                                                                    <div className="flex flex-col gap-1">
                                                                        <label className="text-[7px] text-gray-500 font-black uppercase tracking-widest ml-1">Titre Caméra</label>
                                                                        <input
                                                                            type="text"
                                                                            value={title}
                                                                            onChange={e => updateChannel(id, e.target.value.toUpperCase())}
                                                                            placeholder="EX: CAM 1, MAIN STAGE..."
                                                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-neon-red font-black uppercase focus:border-neon-red outline-none"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="col-span-1 flex items-end justify-center pb-1">
                                                                    <button onClick={deleteChannel} className="p-1.5 text-gray-600 hover:text-neon-red transition-all">
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                    {(!takeoverState.channels || takeoverState.channels.trim() === '') && (
                                                        <div className="p-4 bg-black/20 border border-dashed border-white/10 rounded-xl text-center">
                                                            <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest italic">Aucune caméra configurée</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-4 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Pencil className="w-4 h-4 text-neon-cyan" />
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Titre du Live</label>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={takeoverState.title}
                                                    onChange={(e) => setTakeoverState({ ...takeoverState, title: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-neon-cyan outline-none"
                                                    placeholder="Nom de l'event..."
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-4 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Calendar className="w-4 h-4 text-neon-cyan" />
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Date de ébut</label>
                                                    </div>
                                                    <input
                                                        type="datetime-local"
                                                        value={takeoverState.startDate}
                                                        onChange={(e) => setTakeoverState({ ...takeoverState, startDate: e.target.value })}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-neon-cyan outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-4 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Calendar className="w-4 h-4 text-neon-cyan" />
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Date de Fin</label>
                                                    </div>
                                                    <input
                                                        type="datetime-local"
                                                        value={takeoverState.endDate}
                                                        onChange={(e) => setTakeoverState({ ...takeoverState, endDate: e.target.value })}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-neon-cyan outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-neon-cyan/10 rounded-xl">
                                                        <LayoutDashboard className="w-4 h-4 text-neon-cyan" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <p className="text-[11px] font-black text-white uppercase tracking-widest">Afficher dans l'Agenda</p>
                                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Widget page d'accueil</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setTakeoverState({ ...takeoverState, showInAgenda: !takeoverState.showInAgenda })}
                                                    className={`w-12 h-6 rounded-full relative transition-all ${takeoverState.showInAgenda ? 'bg-neon-cyan shadow-[0_0_15px_#00ffff44]' : 'bg-gray-800'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${takeoverState.showInAgenda ? 'right-1' : 'left-1'}`} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-neon-cyan/10 rounded-xl">
                                                        <Globe className="w-4 h-4 text-neon-cyan" />
                                                    </div>
                                                    <p className="text-[11px] font-black text-white uppercase tracking-widest">Haut de Page (Menu/Logo)</p>
                                                </div>
                                                <button
                                                    onClick={() => setTakeoverState({ ...takeoverState, showTopBanner: !takeoverState.showTopBanner })}
                                                    className={`w-12 h-6 rounded-full relative transition-all ${takeoverState.showTopBanner ? 'bg-neon-cyan shadow-[0_0_15px_#00ffff44]' : 'bg-gray-800'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${takeoverState.showTopBanner ? 'right-1' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {takeoverTab === 'ticker' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                                                <div>
                                                    <p className="text-white font-black uppercase italic tracking-wider flex items-center gap-3">
                                                        <Activity className="w-5 h-5 text-neon-red" /> Activer le Bandeau
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Bandeau éfilant sous le player</p>
                                                </div>
                                                <button
                                                    onClick={() => setTakeoverState({ ...takeoverState, showTickerBanner: !takeoverState.showTickerBanner })}
                                                    className={`w-14 h-7 rounded-full relative transition-all ${takeoverState.showTickerBanner ? 'bg-neon-red shadow-[0_0_20px_#ff003344]' : 'bg-gray-800'}`}
                                                >
                                                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${takeoverState.showTickerBanner ? 'right-1' : 'left-1'}`} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block ml-1">Type de contenu</label>
                                                    <select
                                                        value={takeoverState.tickerType}
                                                        onChange={(e) => setTakeoverState({ ...takeoverState, tickerType: e.target.value as any })}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-neon-red outline-none cursor-pointer"
                                                    >
                                                        <option value="news">Actu Automatique</option>
                                                        <option value="planning">Programme En Cours</option>
                                                        <option value="custom">Texte Perso</option>
                                                    </select>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block ml-1">Fond</label>
                                                        <input type="color" value={takeoverState.tickerBgColor} onChange={e => setTakeoverState({ ...takeoverState, tickerBgColor: e.target.value })} className="w-full h-[42px] bg-black/40 border border-white/10 rounded-xl p-1 cursor-pointer" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block ml-1">Texte</label>
                                                        <input type="color" value={takeoverState.tickerTextColor} onChange={e => setTakeoverState({ ...takeoverState, tickerTextColor: e.target.value })} className="w-full h-[42px] bg-black/40 border border-white/10 rounded-xl p-1 cursor-pointer" />
                                                    </div>
                                                </div>
                                            </div>

                                            {takeoverState.tickerType === 'custom' && (
                                                <div className="grid grid-cols-1 gap-4 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block ml-1">Message Perso</label>
                                                        <input type="text" value={takeoverState.tickerText} onChange={e => setTakeoverState({ ...takeoverState, tickerText: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-neon-red" placeholder="Texte à faire éfiler..." />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block ml-1">Lien au clic (Optionnel)</label>
                                                        <input type="text" value={takeoverState.tickerLink} onChange={e => setTakeoverState({ ...takeoverState, tickerLink: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-neon-red" placeholder="https://..." />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {takeoverTab === 'moderation' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl">
                                                <p className="text-white font-black uppercase italic tracking-wider flex items-center gap-3 mb-4">
                                                    <ShieldAlert className="w-5 h-5 text-red-500" /> Sécurité des Liens
                                                </p>
                                                <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
                                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Bloqueur auto de liens</span>
                                                    <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-lg text-[9px] font-black uppercase border border-green-500/20">Toujours Actif</span>
                                                </div>
                                                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-3 italic px-1">* Seule l'administration et les moérateurs peuvent partager des liens.</p>
                                            </div>

                                            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-neon-red/10 rounded-xl">
                                                        <Pin className="w-5 h-5 text-neon-red" />
                                                    </div>
                                                    <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Message <span className="text-neon-red">À‰pinglé</span></h3>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Contenu du message</label>
                                                        <textarea
                                                            value={takeoverState.pinnedMessage || ''}
                                                            onChange={(e) => setTakeoverState({ ...takeoverState, pinnedMessage: e.target.value })}
                                                            placeholder="Ex: âš ï¸ ébut du set dans 5 minutes ! âš ï¸"
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white font-bold focus:border-neon-red outline-none min-h-[80px] resize-none"
                                                        />
                                                    </div>
                                                    {takeoverState.pinnedMessage && (
                                                        <button
                                                            onClick={() => setTakeoverState({ ...takeoverState, pinnedMessage: '' })}
                                                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-xl text-[9px] font-black text-gray-400 hover:text-red-500 transition-all uppercase"
                                                        >
                                                            <PinOff className="w-3.5 h-3.5" />
                                                            Retirer l'épingle
                                                        </button>
                                                    )}
                                                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest italic px-1">Ce message apparaîtra en haut du chat pour tous les utilisateurs.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {takeoverTab === 'planning' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">À‰diteur de <span className="text-neon-red">Planning</span></h3>
                                                <button
                                                    onClick={() => {
                                                        const currentLines = (takeoverState.lineup || '').split('\n');
                                                        const rows = currentLines.filter(l => l.length > 0).map(line => {
                                                            const timeMatch = line.match(/\[(.*?)\]/);
                                                            const timeRange = timeMatch ? timeMatch[1] : '';
                                                            const [startTime, endTime] = timeRange.includes('-') ? timeRange.split('-') : [timeRange, ''];
                                                            const rest = line.replace(/\[.*?\]/, '');
                                                            const parts = rest.includes('|') ? rest.split('|').map(p => p.trim()) : rest.split('-').map(p => p.trim());
                                                            return {
                                                                time: startTime,
                                                                endTime: endTime,
                                                                artist: parts[0] || '',
                                                                stage: parts[1] || '',
                                                                instagram: parts[2] || ''
                                                            };
                                                        });
                                                        const newRow = { time: '', endTime: '', artist: 'NOUVEL ARTISTE', stage: '', instagram: '' };
                                                        const newRows = [...rows, newRow];
                                                        const newText = newRows.map(r => `[${r.time || '00:00'}${r.endTime ? ` - ${r.endTime}` : ''}] ${r.artist}${r.stage ? ` - ${r.stage}` : ''}${r.instagram ? ` - ${r.instagram}` : ''}`).join('\n');
                                                        setTakeoverState({ ...takeoverState, lineup: newText });
                                                    }}
                                                    className="px-4 py-2 bg-neon-red text-white text-[9px] font-black uppercase rounded-xl hover:scale-105 transition-all shadow-lg shadow-neon-red/20"
                                                >
                                                    + Ajouter un passage
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                {takeoverState.lineup && takeoverState.lineup.trim() !== '' && (
                                                    <div className="grid grid-cols-12 gap-2 px-3 pb-1">
                                                        <div className="col-span-1 text-[9px] text-gray-500 font-black uppercase tracking-widest text-center">ébut</div>
                                                        <div className="col-span-1 text-[9px] text-gray-500 font-black uppercase tracking-widest text-center">Fin</div>
                                                        <div className="col-span-3 text-[9px] text-gray-500 font-black uppercase tracking-widest ml-1">Artiste</div>
                                                        <div className="col-span-3 text-[9px] text-gray-500 font-black uppercase tracking-widest ml-1">Scène</div>
                                                        <div className="col-span-3 text-[9px] text-gray-500 font-black uppercase tracking-widest ml-1">Instagram</div>
                                                        <div className="col-span-1"></div>
                                                    </div>
                                                )}
                                                {(takeoverState.lineup || '').split('\n').filter(l => l.length > 0).map((line, idx) => {
                                                    const timeMatch = line.match(/\[(.*?)\]/);
                                                    const timeRange = timeMatch ? timeMatch[1] : '';
                                                    const [startTime, endTime] = timeRange.includes('-') ? timeRange.split('-') : [timeRange, ''];
                                                    const rest = line.replace(/\[.*?\]/, '');
                                                    const parts = rest.includes('|') ? rest.split('|').map(p => p.trim()) : rest.split('-').map(p => p.trim());
                                                    const row = {
                                                        time: startTime,
                                                        endTime: endTime,
                                                        artist: parts[0] || '',
                                                        stage: parts[1] || '',
                                                        instagram: parts[2] || ''
                                                    };

                                                    const updateRow = (newData: Partial<typeof row>) => {
                                                        const rows = (takeoverState.lineup || '').split('\n').map((l, i) => {
                                                            if (i === idx) {
                                                                const updated = { ...row, ...newData };
                                                                return `[${updated.time || '00:00'}${updated.endTime ? ` - ${updated.endTime}` : ''}] ${updated.artist}${updated.stage ? ` - ${updated.stage}` : ''}${updated.instagram ? ` - ${updated.instagram}` : ''}`;
                                                            }
                                                            return l;
                                                        });
                                                        setTakeoverState({ ...takeoverState, lineup: rows.join('\n') });
                                                    };

                                                    const moveRow = (direction: 'up' | 'down') => {
                                                        const rows = (takeoverState.lineup || '').split('\n');
                                                        if (direction === 'up' && idx > 0) {
                                                            [rows[idx], rows[idx - 1]] = [rows[idx - 1], rows[idx]];
                                                        } else if (direction === 'down' && idx < rows.length - 1) {
                                                            [rows[idx], rows[idx + 1]] = [rows[idx + 1], rows[idx]];
                                                        }
                                                        setTakeoverState({ ...takeoverState, lineup: rows.join('\n') });
                                                    };

                                                    const deleteRow = () => {
                                                        const rows = (takeoverState.lineup || '').split('\n').filter((_, i) => i !== idx);
                                                        setTakeoverState({ ...takeoverState, lineup: rows.join('\n') });
                                                    };

                                                    const rowsArray = (takeoverState.lineup || '').split('\n').filter(l => l.length > 0);

                                                    return (
                                                        <div key={idx} className="grid grid-cols-12 gap-2 bg-white/[0.03] border border-white/5 p-1.5 rounded-xl hover:border-white/10 transition-all group items-center">
                                                            <div className="col-span-1">
                                                                <input
                                                                    type="text"
                                                                    value={row.time}
                                                                    onChange={e => updateRow({ time: e.target.value })}
                                                                    placeholder="22:00"
                                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-1 py-1.5 text-[10px] text-white font-black uppercase text-center focus:border-neon-red outline-none"
                                                                />
                                                            </div>
                                                            <div className="col-span-1">
                                                                <input
                                                                    type="text"
                                                                    value={row.endTime}
                                                                    onChange={e => updateRow({ endTime: e.target.value })}
                                                                    placeholder="23:00"
                                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-1 py-1.5 text-[10px] text-white font-black uppercase text-center focus:border-neon-red outline-none"
                                                                />
                                                            </div>
                                                            <div className="col-span-3">
                                                                <input
                                                                    type="text"
                                                                    value={row.artist}
                                                                    onChange={e => updateRow({ artist: e.target.value })}
                                                                    placeholder="Artiste"
                                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white font-black uppercase focus:border-neon-red outline-none"
                                                                />
                                                            </div>
                                                            <div className="col-span-3">
                                                                <input
                                                                    type="text"
                                                                    value={row.stage}
                                                                    onChange={e => updateRow({ stage: e.target.value })}
                                                                    placeholder="Scène"
                                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white font-bold uppercase focus:border-neon-red outline-none"
                                                                />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <input
                                                                    type="text"
                                                                    value={row.instagram}
                                                                    onChange={e => updateRow({ instagram: e.target.value })}
                                                                    placeholder="@insta"
                                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white font-bold uppercase focus:border-neon-red outline-none"
                                                                />
                                                            </div>
                                                            <div className="col-span-2 flex items-center justify-end gap-1 px-1">
                                                                <button
                                                                    onClick={() => moveRow('up')}
                                                                    disabled={idx === 0}
                                                                    className="p-1.5 text-gray-600 hover:text-neon-cyan transition-all disabled:opacity-20"
                                                                    title="Monter"
                                                                >
                                                                    <ChevronUp className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => moveRow('down')}
                                                                    disabled={idx === rowsArray.length - 1}
                                                                    className="p-1.5 text-gray-600 hover:text-neon-cyan transition-all disabled:opacity-20"
                                                                    title="Descendre"
                                                                >
                                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={deleteRow}
                                                                    className="p-1.5 text-gray-600 hover:text-neon-red transition-all ml-1"
                                                                    title="Supprimer"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {(!takeoverState.lineup || takeoverState.lineup.trim() === '') && (
                                                    <div className="text-center py-6 bg-white/5 border border-white/5 rounded-2xl">
                                                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest italic">Aucun programme configuré</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4 bg-neon-red/5 border border-neon-red/10 rounded-2xl">
                                                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center italic">
                                                    * Le planning sera affiché sur le player et accessible via la commande chat !lineup.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {takeoverTab === 'mods' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Shield className="w-5 h-5 text-neon-red" />
                                                    <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Noms des <span className="text-neon-red">Moérateurs</span></h3>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={takeoverState.moderators}
                                                    onChange={(e) => setTakeoverState({ ...takeoverState, moderators: e.target.value.toUpperCase() })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-neon-red outline-none"
                                                    placeholder="Séparez par des virgules (EX: ALEX, TANGUY, EMMA)"
                                                />
                                                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed tracking-widest">
                                                        LES UTILISATEURS LISTÀ‰S ICI AURONT AUTOMATIQUEMENT LE DROIT DE :
                                                        <br /><span className="text-white">â€¢ SUPPRIMER DES MESSAGES</span>
                                                        <br /><span className="text-white">â€¢ ENVOYER DES LIENS</span>
                                                        <br /><span className="text-white">â€¢ BANNIR DES VIEWERS (SI ADMIN)</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {takeoverTab === 'bot' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-neon-cyan/20 rounded-xl">
                                                        <MessageSquare className="w-5 h-5 text-neon-cyan" />
                                                    </div>
                                                    <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Auto-Message <span className="text-neon-cyan">Bot</span></h3>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                    <div className="md:col-span-8 space-y-2">
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Message du Bot</label>
                                                        <input
                                                            type="text"
                                                            value={takeoverState.autoMessage}
                                                            onChange={e => setTakeoverState({ ...takeoverState, autoMessage: e.target.value })}
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white focus:border-neon-cyan outline-none"
                                                            placeholder="Ex: N'oubliez pas de nous suivre sur Instagram ! @dropsiders"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-4 space-y-2">
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Intervalle (Seconds)</label>
                                                        <div className="relative">
                                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                            <input
                                                                type="number"
                                                                value={takeoverState.autoMessageInterval}
                                                                onChange={e => setTakeoverState({ ...takeoverState, autoMessageInterval: parseInt(e.target.value) || 0 })}
                                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs text-white font-black focus:border-neon-cyan outline-none"
                                                                placeholder="60"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest italic text-center">
                                                    * LAISSEZ LE MESSAGE VIDE POUR DÀ‰SACTIVER L'AUTO-MESSAGE.
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Commandes <span className="text-neon-cyan">Bot</span></h3>
                                                <button
                                                    onClick={() => {
                                                        const rows = (takeoverState.customCommands || '').split('\n').filter(l => l.length > 0).map(line => {
                                                            const parts = line.split(':');
                                                            return { cmd: parts[0] || '', res: parts[1] || '' };
                                                        });
                                                        const newRow = { cmd: '!nouveau', res: 'Votre réponse ici' };
                                                        const newRows = [...rows, newRow];
                                                        const newText = newRows.map(r => `${r.cmd}:${r.res}`).join('\n');
                                                        setTakeoverState({ ...takeoverState, customCommands: newText });
                                                    }}
                                                    className="px-4 py-2 bg-neon-cyan text-black text-[9px] font-black uppercase rounded-xl hover:scale-105 transition-all shadow-lg shadow-neon-cyan/20"
                                                >
                                                    + Créer une commande
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {(takeoverState.customCommands || '').split('\n').filter(l => l.length > 0).map((line, idx) => {
                                                    const parts = line.split(':');
                                                    const row = { cmd: parts[0] || '', res: parts[1] || '' };

                                                    const updateCmd = (newCmd: string) => {
                                                        const rows = (takeoverState.customCommands || '').split('\n').map((l, i) => {
                                                            if (i === idx) return `${newCmd}:${row.res}`;
                                                            return l;
                                                        });
                                                        setTakeoverState({ ...takeoverState, customCommands: rows.join('\n') });
                                                    };

                                                    const updateRes = (newRes: string) => {
                                                        const rows = (takeoverState.customCommands || '').split('\n').map((l, i) => {
                                                            if (i === idx) return `${row.cmd}:${newRes}`;
                                                            return l;
                                                        });
                                                        setTakeoverState({ ...takeoverState, customCommands: rows.join('\n') });
                                                    };

                                                    const deleteRow = () => {
                                                        const rows = (takeoverState.customCommands || '').split('\n').filter((_, i) => i !== idx);
                                                        setTakeoverState({ ...takeoverState, customCommands: rows.join('\n') });
                                                    };

                                                    return (
                                                        <div key={idx} className="grid grid-cols-12 gap-2 bg-white/[0.03] border border-white/5 p-3 rounded-2xl hover:border-white/10 transition-all group">
                                                            <div className="col-span-3">
                                                                <div className="flex flex-col gap-1.5">
                                                                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-1">Commande</label>
                                                                    <input
                                                                        type="text"
                                                                        value={row.cmd}
                                                                        onChange={e => updateCmd(e.target.value)}
                                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-neon-cyan font-black uppercase focus:border-neon-cyan outline-none"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-span-8">
                                                                <div className="flex flex-col gap-1.5">
                                                                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-1">Réponse du bot</label>
                                                                    <input
                                                                        type="text"
                                                                        value={row.res}
                                                                        onChange={e => updateRes(e.target.value)}
                                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:border-neon-cyan outline-none"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-span-1 flex items-end justify-center pb-2">
                                                                <button
                                                                    onClick={deleteRow}
                                                                    className="p-2 text-gray-600 hover:text-neon-red transition-all"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {(!takeoverState.customCommands || takeoverState.customCommands.trim() === '') && (
                                                    <div className="text-center py-10 bg-white/5 border border-white/5 rounded-3xl">
                                                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest italic">Aucune commande personnalisée</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {takeoverTab === 'access' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <div className="bg-white/5 border border-white/5 p-6 rounded-3xl space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-neon-purple/20 rounded-xl">
                                                        <Lock className="w-5 h-5 text-neon-purple" />
                                                    </div>
                                                    <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Accès <span className="text-neon-purple">Restreint</span></h3>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                                                        <div>
                                                            <p className="text-[11px] font-black text-white uppercase tracking-widest mb-1">Activer la Protection</p>
                                                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest italic">Demande un code pour voir le live</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setTakeoverState({ ...takeoverState, isSecret: !takeoverState.isSecret })}
                                                            className={`w-14 h-7 rounded-full p-1 transition-all flex items-center ${takeoverState.isSecret ? 'bg-neon-purple shadow-[0_0_15px_#bc13fe44] justify-end' : 'bg-gray-800 justify-start'}`}
                                                        >
                                                            <div className="w-5 h-5 rounded-full bg-white shadow-lg" />
                                                        </button>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Code d'accès secret</label>
                                                        <input
                                                            type="text"
                                                            value={takeoverState.password}
                                                            onChange={(e) => setTakeoverState({ ...takeoverState, password: e.target.value })}
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-black tracking-[0.5em] text-center focus:border-neon-purple outline-none"
                                                            placeholder="CODE..."
                                                        />
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed tracking-widest text-center italic">
                                                        * UTILE POUR TESTER VOTRE CONFIGURATION AVANT LE LANCEMENT OFFICIEL.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {takeoverTab === 'blocked' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            {bannedChatUsers.length === 0 ? (
                                                <div className="text-center py-10 bg-white/5 border border-white/10 rounded-2xl">
                                                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest italic">Aucun utilisateur banni du chat</p>
                                                </div>
                                            ) : (
                                                bannedChatUsers.map(user => (
                                                    <div key={user} className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10 hover:bg-red-500/10 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                                                                <User className="w-4 h-4 text-red-500" />
                                                            </div>
                                                            <span className="text-[11px] font-black text-white uppercase tracking-widest">{user}</span>
                                                        </div>
                                                        <button
                                                            onClick={async () => {
                                                                const newBanned = bannedChatUsers.filter(u => u !== user);
                                                                setBannedChatUsers(newBanned);
                                                                try {
                                                                    const password = localStorage.getItem('admin_password') || '';
                                                                    const username = localStorage.getItem('admin_user') || 'alex';
                                                                    const sessionId = localStorage.getItem('admin_session_id') || '';
                                                                    await fetch('/api/chat/unban', {
                                                                        method: 'POST',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                            'X-Admin-Password': password,
                                                                            'X-Admin-Username': username,
                                                                            'X-Session-ID': sessionId
                                                                        },
                                                                        body: JSON.stringify({ pseudo: user })
                                                                    });
                                                                } catch (e: any) { }
                                                            }}
                                                            className="px-4 py-2 bg-white/5 hover:bg-green-500 text-gray-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            ébloquer
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {takeoverTab === 'clips' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">Gestion des <span className="text-neon-cyan">Clips</span></h3>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Extraits créés par la communauté</p>
                                                </div>
                                                <button
                                                    onClick={fetchClips}
                                                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                                >
                                                    <RotateCcw className={`w-4 h-4 ${isLoadingClips ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>

                                            {isLoadingClips ? (
                                                <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                                                    <Loader2 className="w-12 h-12 text-neon-cyan animate-spin mb-4" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-cyan animate-pulse">Chargement des clips...</p>
                                                </div>
                                            ) : clips.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.02]">
                                                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                                                        <VideoOff className="w-8 h-8 text-gray-600" />
                                                    </div>
                                                    <p className="text-gray-500 font-black uppercase italic tracking-widest">Aucun clip pour le moment</p>
                                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-2">Les extraits créés en live apparaîtront ici</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                                                    {clips.map((clip: any) => (
                                                        <div key={clip.id} className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden group hover:border-neon-cyan/30 transition-all flex flex-col">
                                                            <div className="aspect-video relative overflow-hidden">
                                                                <img
                                                                    src={`https://img.youtube.com/vi/${clip.videoId}/maxresdefault.jpg`}
                                                                    alt={clip.title}
                                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                                    onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=2070&auto=format&fit=crop')}
                                                                />
                                                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                                                                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                                                                    <div className="px-2 py-1 bg-black/80 rounded-lg border border-white/10 backdrop-blur-md">
                                                                        <p className="text-[9px] font-black text-white">{clip.duration || '0:30'}</p>
                                                                    </div>
                                                                    <div className="px-2 py-1 bg-neon-cyan/80 rounded-lg border border-neon-cyan/30 backdrop-blur-md">
                                                                        <p className="text-[9px] font-black text-black uppercase tracking-widest truncate max-w-[80px]">{clip.creator || 'USER'}</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => window.open(`https://youtube.com/watch?v=${clip.videoId}`, '_blank')}
                                                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <div className="w-12 h-12 rounded-full bg-neon-cyan text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                                                                        <Play className="w-6 h-6 fill-current" />
                                                                    </div>
                                                                </button>
                                                            </div>
                                                            <div className="p-5 flex-1 flex flex-col">
                                                                <h4 className="text-[11px] font-black text-white uppercase italic tracking-tight mb-1 truncate">{clip.title}</h4>
                                                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-4">{clip.date} â€¢ {clip.timestamp}</p>

                                                                <div className="mt-auto grid grid-cols-2 gap-2">
                                                                    <a
                                                                        href={`https://youtube.com/watch?v=${clip.videoId}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                                                    >
                                                                        <Download className="w-3 h-3" />
                                                                        SAVE
                                                                    </a>
                                                                    <button
                                                                        onClick={() => handleDeleteClip(clip.id)}
                                                                        className="py-2.5 bg-red-600/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                        SUPPR.
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={saveTakeoverSettings}
                                    disabled={isUpdatingTakeover}
                                    className="w-full mt-8 py-5 bg-neon-red hover:bg-neon-red/80 text-white font-black uppercase tracking-widest rounded-[2rem] transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 relative z-30"
                                >
                                    {isUpdatingTakeover ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Mise à jour...</>
                                    ) : (
                                        <><Save className="w-5 h-5" /> Enregistrer les réglages</>
                                    )}
                                </button>
                            </motion.div>
                        </div>
                    )
                    }
                </AnimatePresence>

                {/* Modal Notifications */}
                <AnimatePresence>
                    {isNotificationModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-neon-purple to-neon-blue" />

                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            Push <span className="text-neon-red">Notifications</span>
                                        </h2>
                                        <p className="text-gray-400 font-medium">Gérer les alertes en direct</p>
                                    </div>
                                    <button
                                        onClick={() => setIsNotificationModalOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 bg-white/5 border border-white/5 rounded-3xl text-center relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-neon-red/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="w-16 h-16 bg-neon-red/10 rounded-2xl flex items-center justify-center border border-neon-red/30 mx-auto mb-4 group-hover:scale-110 transition-transform duration-500">
                                            <Bell className="w-8 h-8 text-neon-red" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white uppercase italic mb-1">Système Actif</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Le service de push est opérationnel</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-neon-blue uppercase tracking-widest mb-1">Push</span>
                                                <span className="text-xl font-black text-white">{pushSubscribersCount ?? 0}</span>
                                            </div>
                                            <div className="w-8 h-8 bg-neon-blue/10 rounded-lg flex items-center justify-center border border-neon-blue/20">
                                                <Users className="w-4 h-4 text-neon-blue" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-neon-purple uppercase tracking-widest mb-1">News</span>
                                                <span className="text-xl font-black text-white italic">Auto</span>
                                            </div>
                                            <div className="w-8 h-8 bg-neon-purple/10 rounded-lg flex items-center justify-center border border-neon-purple/20">
                                                <Mail className="w-4 h-4 text-neon-purple" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-neon-purple/5 border border-neon-purple/20 rounded-2xl flex gap-4 items-start">
                                        <Zap className="w-5 h-5 text-neon-purple shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                                            Le nouveau système demande ésormais l'accord pour les notifications et la newsletter dès l'entrée sur le site.
                                        </p>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Plus className="w-4 h-4 text-neon-red" />
                                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Envoi Manuel Sur Mesure</h4>
                                        </div>

                                        {/* Sélecteur de News */}
                                        <div className="space-y-2">
                                            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest pl-1">1. Cible (Optionnel)</label>
                                            <div className="relative group/select">
                                                <select
                                                    onChange={(e) => {
                                                        const news = pushNewsList.find(n => n.id === e.target.value);
                                                        setSelectedPushNews(news);
                                                        if (news) {
                                                            setPushCustomTitle(news.title || 'DROPSIDERS NEWS');
                                                            setPushCustomBody(news.summary || '');
                                                        }
                                                    }}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white appearance-none focus:border-neon-red/50 outline-none transition-all cursor-pointer"
                                                >
                                                    <option value="">-- Lien : Page d'accueil --</option>
                                                    {pushNewsList.map(n => (
                                                        <option key={n.id} value={n.id} className="bg-dark-bg text-white">
                                                            [{n.category}] {n.title}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-hover/select:text-white transition-colors" />
                                            </div>
                                        </div>

                                        {/* Titre & Message */}
                                        <div className="space-y-3">
                                            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest pl-1">2. Contenu du Push</label>
                                            <input
                                                type="text"
                                                value={pushCustomTitle}
                                                onChange={(e) => setPushCustomTitle(e.target.value)}
                                                placeholder="Titre de la notification..."
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-black text-neon-red placeholder:text-gray-700 outline-none focus:border-neon-red/50 transition-all uppercase tracking-tight"
                                            />
                                            <textarea
                                                value={pushCustomBody}
                                                onChange={(e) => setPushCustomBody(e.target.value)}
                                                placeholder="Message personnalisé pour les abonnés..."
                                                rows={2}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white placeholder:text-gray-700 outline-none focus:border-neon-red/50 transition-all resize-none"
                                            />
                                        </div>

                                        <button
                                            onClick={handleSendManualPush}
                                            disabled={isSendingManualPush || !pushCustomTitle || !pushCustomBody}
                                            className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 relative overflow-hidden group/push ${isSendingManualPush
                                                ? 'bg-white/10 text-gray-500 cursor-not-allowed'
                                                : 'bg-white text-black hover:bg-neon-red hover:text-white shadow-[0_10px_30px_rgba(255,255,255,0.05)]'
                                                }`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-neon-red via-neon-purple to-neon-blue opacity-0 group-hover/push:opacity-20 transition-opacity" />
                                            {isSendingManualPush ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-neon-red border-t-transparent animate-spin rounded-full" />
                                                    Envoi en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="w-4 h-4" />
                                                    Diffuser aux {pushSubscribersCount || 0} abonnés
                                                    <ArrowRight className="w-4 h-4 group-hover/push:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => setIsNotificationModalOpen(false)}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[8px] transition-all border border-white/10"
                                    >
                                        Annuler l'opération
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal Clips */}
                <AnimatePresence>
                    {isClipsModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-dark-bg border border-white/10 rounded-[3rem] p-10 max-w-4xl w-full max-h-[90vh] shadow-2xl relative overflow-hidden flex flex-col"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-white to-neon-cyan" />

                                <div className="flex justify-between items-start mb-12 shrink-0">
                                    <div>
                                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                            Gestion <span className="text-neon-cyan">Clips</span>
                                        </h2>
                                        <p className="text-gray-400 font-medium">Extraits créés par la communauté</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={fetchClips}
                                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                        >
                                            <RotateCcw className={`w-6 h-6 ${isLoadingClips ? 'animate-spin' : ''}`} />
                                        </button>
                                        <button
                                            onClick={() => setIsClipsModalOpen(false)}
                                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                                    {isLoadingClips ? (
                                        <div className="py-20 flex flex-col items-center justify-center grayscale opacity-50">
                                            <Loader2 className="w-12 h-12 text-neon-cyan animate-spin mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-cyan animate-pulse">Chargement des clips...</p>
                                        </div>
                                    ) : clips.length === 0 ? (
                                        <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.02]">
                                            <VideoOff className="w-12 h-12 text-gray-600 mx-auto mb-6" />
                                            <h3 className="text-xl font-black text-white/40 uppercase italic tracking-widest">Aucun clip trouvé</h3>
                                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-2">Les extraits apparaîtront dès qu'un viewer en créera en live</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {clips.map((clip: any) => (
                                                <motion.div
                                                    key={clip.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden group hover:border-neon-cyan/30 transition-all flex flex-col"
                                                >
                                                    <div className="aspect-video relative overflow-hidden">
                                                        <img
                                                            src={clip.url?.includes('cloudinary') ? clip.url.replace('.mp4', '.jpg') : `https://img.youtube.com/vi/${clip.videoId}/maxresdefault.jpg`}
                                                            alt={clip.title}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                            onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80\u0026w=2070\u0026auto=format\u0026fit=crop')}
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                                                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                                                            <div className="px-2 py-1 bg-black/80 rounded-lg border border-white/10 backdrop-blur-md">
                                                                <p className="text-[9px] font-black text-white">{clip.duration || '0:30'}</p>
                                                            </div>
                                                            <div className="px-2 py-1 bg-neon-cyan/80 rounded-lg border border-neon-cyan/30 backdrop-blur-md">
                                                                <p className="text-[9px] font-black text-black uppercase tracking-widest truncate max-w-[80px]">{clip.creator || 'USER'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-5 flex-1 flex flex-col">
                                                        <h4 className="text-[11px] font-black text-white uppercase italic tracking-tight mb-1 truncate">{clip.title}</h4>
                                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-4">{clip.date} â€¢ {clip.timestamp}</p>

                                                        <div className="mt-auto grid grid-cols-2 gap-2">
                                                            <a
                                                                href={clip.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <Download className="w-3 h-3" />
                                                                VOIR
                                                            </a>
                                                            <button
                                                                onClick={() => handleDeleteClip(clip.id)}
                                                                className="py-2.5 bg-red-600/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                                SUPPR.
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>



                <ModerationModal
                    isOpen={isModerationModalOpen}
                    onClose={() => setIsModerationModalOpen(false)}
                />

                {/* Modal Downloader */}
                <AnimatePresence>
                    {isDownloaderOpen && (
                        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsDownloaderOpen(false)}
                                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl h-[85vh] flex flex-col"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-blue-500 to-neon-purple" />

                                <div className="p-8 md:p-10 flex flex-col h-full overflow-y-auto custom-scrollbar">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-neon-cyan/10 rounded-2xl border border-neon-cyan/20">
                                                <Youtube className="w-8 h-8 text-neon-cyan" />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">
                                                    Social <span className="text-neon-cyan">Downloader</span>
                                                </h2>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Instagram • TikTok • YouTube • Twitter</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsDownloaderOpen(false)}
                                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <div className="flex-1">
                                        <Downloader
                                            isPopup={true}
                                            onSelect={(url) => {
                                                setSelectedSocialArticle({ title: 'Média Téléchargé', image: url });
                                                setIsDownloaderOpen(false);
                                                setIsSocialModalOpen(false); // If it came from Social Studio, we replace
                                            }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal Quizz */}
                <AnimatePresence>
                    {isQuizModalOpen && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsQuizModalOpen(false)}
                                className="absolute inset-0 bg-black/90 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl h-[85vh] flex flex-col"
                            >
                                <div className="p-8 md:p-10 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-8 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-neon-red/10 rounded-2xl border border-neon-red/20">
                                                <Gamepad2 className="w-6 h-6 text-neon-red" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter">
                                                    Gestion <span className="text-neon-red">Quizz</span>
                                                </h2>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Questions actives & proposées</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={handleCreateQuiz}
                                                className="px-4 py-2 bg-neon-red/10 border border-neon-red/20 text-neon-red rounded-xl font-black uppercase text-[10px] hover:bg-neon-red hover:text-white transition-all flex items-center gap-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Ajouter une question
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (!window.confirm('⚠️ Voulez-vous vraiment supprimer TOUTES les questions Blind Test ? Cette action est irréversible.')) return;
                                                    try {
                                                        const res = await apiFetch('/api/quiz/reset-blind-test', {
                                                            method: 'POST',
                                                            headers: getAuthHeaders()
                                                        });
                                                        if (res.ok) {
                                                            const data = await res.json();
                                                            alert(`✅ ${data.removed} questions Blind Test supprimées !`);
                                                            fetchQuizzes();
                                                        }
                                                    } catch (err) { console.error('Reset BT error:', err); }
                                                }}
                                                className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl font-black uppercase text-[10px] hover:bg-orange-500 hover:text-white transition-all flex items-center gap-2"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Reset BT
                                            </button>
                                            <button
                                                onClick={() => setIsQuizModalOpen(false)}
                                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 bg-black/50 border border-white/10 rounded-2xl p-1 mb-6 shrink-0">
                                        <button
                                            onClick={() => setQuizTab('active')}
                                            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${quizTab === 'active' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            Actives ({allActiveQuizzes.length})
                                        </button>
                                        <button
                                            onClick={() => setQuizTab('pending')}
                                            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${quizTab === 'pending' ? 'bg-neon-red/10 text-neon-red shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            En attente ({allPendingQuizzes.length})
                                        </button>

                                        <div className="h-6 w-[1px] bg-white/10 mx-2" />

                                        <div className="flex items-center gap-3 px-3 py-2 bg-black/60 border border-white/10 rounded-xl mx-2 shadow-xl group">
                                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                                                Progression : <span className={quizCounts.blindTest < 30 ? 'text-neon-red' : 'text-neon-green'}>{quizCounts.blindTest}/30 BT</span> • <span className={quizCounts.image < 30 ? 'text-neon-red' : 'text-neon-green'}>{quizCounts.image}/30 Image</span>
                                            </span>
                                        </div>

                                        <div className="h-6 w-[1px] bg-white/10 mx-2" />

                                        {['ALL', 'QCM', 'BLIND_TEST', 'IMAGE'].map(filter => {
                                            return (
                                                <button
                                                    key={filter}
                                                    onClick={() => setQuizFilter(filter)}
                                                    className={`px-4 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5 ${quizFilter === filter ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                                                >
                                                    {filter.replace('_', ' ')}
                                                </button>
                                            );
                                        })}

                                        <div className="h-6 w-[1px] bg-white/10 mx-2" />

                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="FILTRER PAR THÀˆME / ARTISTE..."
                                                value={quizSearch}
                                                onChange={(e) => setQuizSearch(e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[9px] font-black text-white w-48 outline-none focus:border-neon-cyan transition-all uppercase placeholder:text-gray-700"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                        {isQuizLoading ? (
                                            <div className="h-full flex flex-col items-center justify-center gap-4">
                                                <Loader2 className="w-10 h-10 text-neon-red animate-spin" />
                                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest animate-pulse">Chargement des questions...</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {(quizTab === 'active' ? allActiveQuizzes : allPendingQuizzes)
                                                    .filter(q => {
                                                        const matchType = quizFilter === 'ALL' || q.type === quizFilter;
                                                        const matchSearch = !quizSearch ||
                                                            q.category?.toUpperCase().includes(quizSearch.toUpperCase()) ||
                                                            q.question?.toUpperCase().includes(quizSearch.toUpperCase()) ||
                                                            q.author?.toUpperCase().includes(quizSearch.toUpperCase());
                                                        return matchType && matchSearch;
                                                    })
                                                    .length === 0 ? (
                                                    <div className="p-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[2rem] text-center">
                                                        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest italic">Aucune question dans cette liste</p>
                                                    </div>
                                                ) : (
                                                    (quizTab === 'active' ? allActiveQuizzes : allPendingQuizzes)
                                                        .filter(q => {
                                                            const matchType = quizFilter === 'ALL' || q.type === quizFilter;
                                                            const matchSearch = !quizSearch ||
                                                                q.category?.toUpperCase().includes(quizSearch.toUpperCase()) ||
                                                                q.question?.toUpperCase().includes(quizSearch.toUpperCase()) ||
                                                                q.author?.toUpperCase().includes(quizSearch.toUpperCase());
                                                            return matchType && matchSearch;
                                                        })
                                                        .map((quiz: any) => (
                                                            <div
                                                                key={quiz.id}
                                                                className="p-6 bg-white/[0.02] border border-white/10 rounded-3xl hover:bg-white/[0.04] transition-all group"
                                                            >
                                                                <div className="flex items-start justify-between gap-6">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-3 mb-3">
                                                                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-black text-neon-red uppercase tracking-widest">
                                                                                {quiz.category}
                                                                            </span>
                                                                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                                                                {quiz.type}
                                                                            </span>
                                                                            {quiz.author && (
                                                                                <span className="text-[9px] font-bold text-gray-500">PAR : {quiz.author.toUpperCase()}</span>
                                                                            )}
                                                                        </div>
                                                                        <h4 className="text-lg font-bold text-white mb-4">{quiz.question}</h4>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            {quiz.options.map((opt: string, idx: number) => (
                                                                                <div
                                                                                    key={idx}
                                                                                    className={`p-3 rounded-xl text-[10px] font-bold border ${opt === quiz.correctAnswer ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-black/40 border-white/5 text-gray-400'}`}
                                                                                >
                                                                                    {opt}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex flex-col gap-2">
                                                                        {quizTab === 'pending' && (
                                                                            <button
                                                                                onClick={() => handleModerateQuiz(quiz.id, 'approve')}
                                                                                className="p-3 bg-neon-green/20 text-neon-green border border-neon-green/30 rounded-2xl hover:bg-neon-green hover:text-white transition-all shadow-xl shadow-neon-green/10"
                                                                                title="Approuver"
                                                                            >
                                                                                <CheckCircle2 className="w-5 h-5" />
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={() => { setTestQuiz(quiz); setIsTestingModalOpen(true); }}
                                                                            className="p-3 bg-purple-500/20 text-purple-500 border border-purple-500/30 rounded-2xl hover:bg-purple-500 hover:text-white transition-all shadow-xl shadow-purple-500/10"
                                                                            title="Tester (Aperçu)"
                                                                        >
                                                                            <Play className="w-5 h-5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { setQuizToEdit(quiz); setIsEditQuizModalOpen(true); }}
                                                                            className="p-3 bg-blue-500/20 text-blue-500 border border-blue-500/30 rounded-2xl hover:bg-blue-500 hover:text-white transition-all shadow-xl shadow-blue-500/10"
                                                                            title="Modifier"
                                                                        >
                                                                            <Pencil className="w-5 h-5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={async () => {
                                                                                if (!window.confirm('Voulez-vous vraiment supprimer cette question ?')) return;
                                                                                try {
                                                                                    const res = await apiFetch('/api/quiz/delete', {
                                                                                        method: 'POST',
                                                                                        headers: getAuthHeaders(),
                                                                                        body: JSON.stringify({ id: quiz.id })
                                                                                    });
                                                                                    if (res.ok) fetchQuizzes();
                                                                                    else console.error('Delete failed:', await res.text());
                                                                                } catch (err) { console.error('Delete error:', err); }
                                                                            }}
                                                                            className="p-3 bg-neon-red/20 text-neon-red border border-neon-red/30 rounded-2xl hover:bg-neon-red hover:text-white transition-all shadow-xl shadow-neon-red/10"
                                                                            title="Supprimer"
                                                                        >
                                                                            <Trash2 className="w-5 h-5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {isEditQuizModalOpen && quizToEdit && (
                        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsEditQuizModalOpen(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="relative w-full max-w-lg bg-[#0f0f0f] border border-white/10 rounded-[2rem] p-8 shadow-2xl"
                            >
                                <h3 className="text-xl font-display font-black text-white uppercase italic mb-6">Modifier la Question</h3>



                                {/* TYPE TABS */}
                                <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-2xl p-1 mb-6">
                                    {(['QCM', 'BLIND_TEST', 'VIDEO', 'IMAGE'] as const).map(t => {
                                        return (
                                            <button
                                                key={t}
                                                onClick={() => setQuizToEdit({ ...quizToEdit, type: t })}
                                                className={`flex-1 py-2.5 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all ${quizToEdit.type === t ? 'bg-neon-red text-white shadow-lg shadow-neon-red/20' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                {t === 'QCM' ? 'QCM' : t === 'BLIND_TEST' ? 'BLIND TEST' : t === 'VIDEO' ? 'VIDEO' : 'IMAGE'}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                                    {/* THEME SELECTION - AUTO FILLS QUESTION */}
                                    <div>
                                        <label className="text-[10px] font-black text-neon-red uppercase tracking-widest block mb-2">Thème / Genre</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['Festivals', 'DJs', 'Classics', 'Techno', 'Bass Music', 'Hardcore', 'Tech House', 'Big Room', 'Trance', 'Hardstyle', 'Afro House', 'Progressive', 'House', 'Production'].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => {
                                                        const updates: any = { ...quizToEdit, category: t };
                                                        if (quizToEdit.type === 'QCM') {
                                                            const q: Record<string, string> = {
                                                                'Techno': 'Quel est ce titre Techno ?', 'Bass Music': 'Quel est ce titre Bass ?',
                                                                'Hardcore': 'Quel est ce titre Hardcore ?', 'Tech House': 'Quel est ce titre Tech House ?',
                                                                'Big Room': 'Quel est ce titre Big Room ?', 'Trance': 'Quel est ce titre Trance ?',
                                                                'Hardstyle': 'Quel est ce titre Hardstyle ?', 'Afro House': 'Quel est ce titre Afro House ?',
                                                                'Progressive': 'Quel est ce titre Progressive ?', 'House': 'Quel est ce titre House ?',
                                                                'Festivals': 'Quel est ce festival ?', 'DJs': 'Qui est cet artiste ?',
                                                                'Classics': 'Quel est ce classique ?', 'Production': 'De quel outil s\'agit-il ?',
                                                            };
                                                            if (q[t]) updates.question = q[t];
                                                        } else if (quizToEdit.type === 'IMAGE') {
                                                            if (t === 'Festivals') { updates.question = 'Quel est ce festival ?'; updates.imageType = 'FESTIVAL'; }
                                                            else if (t === 'DJs') { updates.question = 'Qui est cet artiste ?'; updates.imageType = 'ARTIST'; }
                                                            else updates.question = `Quel est ce ${t} ?`;
                                                        } else if (quizToEdit.type === 'BLIND_TEST') {
                                                            updates.question = 'Quelle est ce titre ?';
                                                        }
                                                        setQuizToEdit(updates);
                                                    }}
                                                    className={`py-2 px-1 text-[8px] font-black uppercase tracking-tighter rounded-lg border transition-all ${quizToEdit.category === t ? 'bg-neon-red/20 border-neon-red text-white' : 'bg-black/40 border-white/5 text-gray-500 hover:text-white'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-neon-red uppercase tracking-widest block mb-2">
                                            {quizToEdit.type === 'BLIND_TEST' ? 'Titre (Utilisée comme Bonne Réponse)' : 'Question'}
                                        </label>
                                        <input
                                            type="text"
                                            value={quizToEdit.question}
                                            onChange={(e) => setQuizToEdit({ ...quizToEdit, question: e.target.value })}
                                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-neon-red outline-none text-xs"
                                            placeholder={quizToEdit.type === 'BLIND_TEST' ? 'Ex: Martin Garrix - Animals' : 'Ex: Quel DJ est headliner ?'}
                                        />
                                    </div>

                                    {/* BLIND TEST / VIDEO SPECIFIC (Spotify / YouTube) */}
                                    {(quizToEdit.type === 'BLIND_TEST' || quizToEdit.type === 'VIDEO') && (
                                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                                            {/* OPTION MP3 DIRECT (LE PLUS FIABLE) */}
                                            <div>
                                                <label className="text-[10px] font-black text-neon-cyan uppercase tracking-widest block mb-1.5 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" /> Fichier MP3 (Le plus fiable pour le son)
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={quizToEdit.audioUrl || ''}
                                                        onChange={(e) => setQuizToEdit({ ...quizToEdit, audioUrl: e.target.value })}
                                                        placeholder="URL MP3 ou Upload..."
                                                        className="flex-1 bg-black border border-neon-cyan/20 rounded-xl p-3 text-white focus:border-neon-cyan outline-none text-[10px]"
                                                    />
                                                    <label className="cursor-pointer px-4 bg-neon-cyan/10 border border-neon-cyan/30 rounded-xl flex items-center justify-center hover:bg-neon-cyan hover:text-black transition-all group">
                                                        <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                        <input
                                                            type="file"
                                                            accept="audio/*"
                                                            multiple
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const files = e.target.files;
                                                                if (!files || files.length === 0) return;

                                                                setIsSaving(true); // Re-use saving state for feedback

                                                                try {
                                                                    for (let i = 0; i < files.length; i++) {
                                                                        const file = files[i];

                                                                        // 1. Guess Metadata from filename
                                                                        const rawName = file.name.replace(/\.[^/.]+$/, "");

                                                                        // Cleaning Function
                                                                        const clean = (str: string) => {
                                                                            return str
                                                                                .replace(/(\[|\()(Original|Extended|Radio|Club|Vocal|Main|Dub|Instrumental)?\s*(Mix|Edit|Version).*?(\]|\))/gi, "")
                                                                                .replace(/\s+(Original|Extended|Radio|Club|Vocal|Main|Dub|Instrumental)\s+(Mix|Edit|Version).*?$/gi, "")
                                                                                .replace(/\s+/g, " ")
                                                                                .trim();
                                                                        };

                                                                        const cleanName = clean(rawName);
                                                                        let artist = "";
                                                                        let title = cleanName;
                                                                        if (cleanName.includes(" - ")) {
                                                                            const parts = cleanName.split(" - ");
                                                                            artist = parts[0].trim();
                                                                            title = parts[1].trim();
                                                                        }
                                                                        const fullLabel = artist ? `${artist} - ${title}` : title;

                                                                        // 2. Upload
                                                                        const url = await uploadFile(file);

                                                                        // 3. Get middle start time
                                                                        const audio = new Audio();
                                                                        const objectUrl = URL.createObjectURL(file);
                                                                        audio.src = objectUrl;

                                                                        // Logic for creation
                                                                        const processFile = (startSec: number) => {
                                                                            const newOptions = [...quizToEdit.options];
                                                                            newOptions[0] = fullLabel;

                                                                            const quizData = {
                                                                                ...quizToEdit,
                                                                                audioUrl: url,
                                                                                question: fullLabel,
                                                                                correctAnswer: fullLabel,
                                                                                options: newOptions,
                                                                                startTime: startSec
                                                                            };

                                                                            if (i === 0) {
                                                                                // Update the current modal state for the first one
                                                                                setQuizToEdit(quizData);
                                                                            } else {
                                                                                // Auto-create others in bulk
                                                                                const { id, ...bulkData } = quizData;
                                                                                handleUpdateQuiz(bulkData);
                                                                            }
                                                                        };

                                                                        audio.onloadedmetadata = () => {
                                                                            const mid = Math.floor(audio.duration / 2) - 15;
                                                                            processFile(Math.max(0, mid));
                                                                            URL.revokeObjectURL(objectUrl);
                                                                        };
                                                                    }
                                                                    if (files.length > 1) {
                                                                        alert(`${files.length} fichiers traités ! Les quiz supplémentaires ont été créés automatiquement.`);
                                                                    }
                                                                } catch (err) {
                                                                    alert('Erreur lors du traitement bulk');
                                                                } finally {
                                                                    setIsSaving(false);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Waveform Selector */}
                                            {quizToEdit.audioUrl && (
                                                <AudioWaveformSelector
                                                    audioUrl={quizToEdit.audioUrl}
                                                    startTime={quizToEdit.startTime || 0}
                                                    duration={30}
                                                    onChange={(newStart) => setQuizToEdit((prev: any) => prev ? { ...prev, startTime: newStart } : null)}
                                                />
                                            )}

                                            {/* Fallback manual input when no audio */}
                                            {!quizToEdit.audioUrl && (
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1.5 font-display italic">Début de l'extrait (Sec)</label>
                                                    <input
                                                        type="number"
                                                        value={quizToEdit.startTime || 0}
                                                        onChange={(e) => setQuizToEdit({ ...quizToEdit, startTime: parseInt(e.target.value) || 0 })}
                                                        className="w-full bg-black border border-neon-cyan/20 rounded-xl p-3 text-white focus:border-neon-cyan outline-none text-[10px] font-black"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-[10px] font-black text-neon-red uppercase tracking-widest block mb-2">Options</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {quizToEdit.options.map((opt: string, i: number) => (
                                                <div key={i} className="relative group">
                                                    <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const o = [...quizToEdit.options];
                                                            o[i] = e.target.value;
                                                            setQuizToEdit((prev: any) => ({ ...prev, options: o }));
                                                        }}
                                                        className={`w-full bg-black border rounded-xl p-2.5 text-[10px] text-white focus:border-neon-red outline-none transition-all ${opt === quizToEdit.correctAnswer ? 'border-neon-green/50 bg-neon-green/5' : 'border-white/10'}`}
                                                        placeholder={`Option ${i + 1}`}
                                                    />
                                                    <button
                                                        onClick={() => setQuizToEdit((prev: any) => prev ? { ...prev, correctAnswer: opt } : null)}
                                                        className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${opt === quizToEdit.correctAnswer ? 'bg-neon-green border-neon-green text-black' : 'border-white/20 text-transparent hover:border-white/50'}`}
                                                    >
                                                        {opt === quizToEdit.correctAnswer && <CheckCircle2 className="w-2.5 h-2.5" />}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {quizToEdit.type === 'IMAGE' && (
                                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black text-neon-red uppercase tracking-widest block mb-1">URL de l'image / Upload</label>
                                                <div className="flex gap-2">
                                                    <input type="text" value={quizToEdit.imageUrl || ''} onChange={(e) => setQuizToEdit((prev: any) => prev ? { ...prev, imageUrl: e.target.value } : null)}
                                                        className="flex-1 bg-black border border-white/10 rounded-xl p-3 text-white focus:border-neon-red outline-none text-[10px]" />
                                                    <label className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer">
                                                        <input type="file" accept="image/*" className="hidden"
                                                            onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { const u = await uploadFile(f); setQuizToEdit((prev: any) => prev ? { ...prev, imageUrl: u } : null); } catch (err) { } } }} />
                                                        <Upload className="w-5 h-5" />
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Type Image</label>
                                                    <select value={quizToEdit.imageType} onChange={(e) => setQuizToEdit((prev: any) => prev ? { ...prev, imageType: e.target.value as any } : null)}
                                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:border-neon-red outline-none text-[10px]">
                                                        <option value="FESTIVAL">FESTIVAL (NET)</option>
                                                        <option value="ARTIST">ARTISTE (FLOU)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Effet Reveal</label>
                                                    <select value={quizToEdit.revealEffect} onChange={(e) => setQuizToEdit({ ...quizToEdit, revealEffect: e.target.value })}
                                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:border-neon-red outline-none text-[10px]">
                                                        <option value="BLUR">FLOU</option>
                                                        <option value="MOSAIC">MOSAÏQUE</option>
                                                        <option value="SILHOUETTE">SILHOUETTE</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <button onClick={() => setIsEditQuizModalOpen(false)}
                                        className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-white/10">Annuler</button>
                                    <button onClick={() => handleUpdateQuiz(quizToEdit)}
                                        className="flex-1 py-4 bg-neon-red text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-neon-red/20 transition-all hover:scale-[1.02] active:scale-[0.98]">Enregistrer</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* MODAL TEST QUIZ */}
                <AnimatePresence>
                    {isTestingModalOpen && testQuiz && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/98 backdrop-blur-2xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 max-w-xl w-full relative overflow-hidden shadow-[0_0_100px_rgba(255,18,65,0.1)]"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan" />

                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">Test de Question</h2>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Aperçu du rendu final pour les utilisateurs</p>
                                    </div>
                                    <button onClick={() => { setTestQuiz(null); setIsTestingModalOpen(false); }} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-[2rem] relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4">
                                            <span className="px-3 py-1 bg-neon-red/20 text-neon-red border border-neon-red/30 rounded-full text-[8px] font-black uppercase tracking-widest">{testQuiz.type}</span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-2 h-2 rounded-full bg-neon-red animate-pulse" />
                                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{testQuiz.category}</span>
                                        </div>

                                        <h3 className="text-2xl font-bold text-white mb-8 uppercase italic tracking-tight leading-tight">{testQuiz.question}</h3>

                                        {testQuiz.type === 'IMAGE' && testQuiz.imageUrl && (
                                            <div className="aspect-video w-full rounded-2xl overflow-hidden mb-8 relative group border border-white/10 ring-1 ring-white/5 shadow-2xl">
                                                <img src={testQuiz.imageUrl} alt="Quiz" className="w-full h-full object-cover" />
                                                {testQuiz.imageType === 'PIXEL' && (
                                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                                        <div className="px-4 py-2 bg-black/60 border border-white/20 rounded-xl">
                                                            <p className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Effet Pixel Activé</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {testQuiz.type === 'BLIND_TEST' && testQuiz.audioUrl && (
                                            <div className="mb-8 p-6 bg-black/40 border border-white/5 rounded-2xl">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-10 h-10 bg-neon-red/20 rounded-xl flex items-center justify-center border border-neon-red/30">
                                                        <Music className="w-5 h-5 text-neon-red" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Extrait Audio</p>
                                                        <p className="text-[10px] text-white font-black uppercase">Pré-écoute du Blind Test</p>
                                                    </div>
                                                </div>
                                                <audio src={`${testQuiz.audioUrl}#t=${testQuiz.startTime || 0},${(testQuiz.startTime || 0) + 30}`} controls className="w-full h-8 custom-audio-player" />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 gap-3">
                                            {testQuiz.options.map((opt: string, i: number) => (
                                                <div
                                                    key={i}
                                                    className={`p-5 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all flex items-center justify-between ${opt === testQuiz.correctAnswer ? 'bg-neon-green/10 border-neon-green/30 text-neon-green shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'bg-black/40 border-white/5 text-gray-500 opacity-60'}`}
                                                >
                                                    {opt}
                                                    {opt === testQuiz.correctAnswer && <CheckCircle2 className="w-4 h-4" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { setTestQuiz(null); setIsTestingModalOpen(false); }}
                                        className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] transition-all"
                                    >
                                        Fermer l'aperçu
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    type={confirmModal.type}
                />
            </div>
        </div>
    );
}

