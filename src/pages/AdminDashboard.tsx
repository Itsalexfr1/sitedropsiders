import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Mail, Calendar, Image as ImageIcon, Video, Mic, Plus, Users,
    LayoutDashboard, Lock, ArrowRight, User, Search, X, BarChart3, Music,
    ShoppingBag, Save, Paintbrush, Settings2, ChevronUp, ChevronDown,
    ChevronLeft, ChevronRight, Palette, Megaphone, RefreshCw, Type, Activity,
    Youtube, Rocket, CheckCircle2, AlertCircle, Loader2, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthHeaders } from '../utils/auth';

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
    const navigate = useNavigate();

    // Selection Interviews pour l'accueil
    const [allInterviews, setAllInterviews] = useState<any[]>([]);
    const [selectedInterviews, setSelectedInterviews] = useState<string[]>([]);
    const [isSavingInterviews, setIsSavingInterviews] = useState(false);
    const [interviewSearch, setInterviewSearch] = useState('');

    const fetchInterviewsForSelection = async () => {
        try {
            const [newsResp, layoutResp] = await Promise.all([
                fetch('/api/news'),
                fetch('/api/home-layout')
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
        } catch (e) {
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
        } catch (e) {
            console.error("Error saving interview selection:", e);
        } finally {
            setIsSavingInterviews(false);
        }
    };

    // --- DEPLOY STATE ---
    const [deployStatus, setDeployStatus] = useState<'idle' | 'loading' | 'queued' | 'in_progress' | 'success' | 'failure'>('idle');
    const [deployRunUrl, setDeployRunUrl] = useState<string | null>(null);
    const deployPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const colors = [
        { name: 'Red', value: 'red' },
        { name: 'Blue', value: 'blue' },
        { name: 'Cyan', value: 'cyan' },
        { name: 'Purple', value: 'purple' },
        { name: 'Yellow', value: 'yellow' },
        { name: 'Pink', value: 'pink' },
        { name: 'Green', value: 'green' },
        { name: 'Emerald', value: 'emerald' },
        { name: 'Orange', value: 'orange' },
        { name: 'White', value: 'white' }
    ];

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
            const res = await fetch('/api/settings');
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
            }
        } catch (e) { }
    };

    const saveBannerSettings = async () => {
        setIsUpdatingBanner(true);
        try {
            const res = await fetch('/api/settings');
            const data = res.ok ? await res.json() : {};

            const newSettings = {
                ...data,
                announcement_banner: {
                    ...bannerState
                }
            };

            const saveRes = await fetch('/api/settings/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newSettings)
            });

            if (saveRes.ok) {
                setIsBannerModalOpen(false);
            }
        } catch (e) {
            console.error('Failed to save banner settings', e);
        } finally {
            setIsUpdatingBanner(false);
        }
    };


    const fetchActions = async () => {
        try {
            const resp = await fetch('/api/dashboard-actions');
            if (resp.ok) {
                const data = await resp.json();
                if (data && data.length > 0) {
                    // Merge missing fallback actions
                    const defaultActions = getFallbackActions();
                    const mergedActions = [...data];

                    defaultActions.forEach(defaultAction => {
                        const exists = mergedActions.find(a => a.title === defaultAction.title);
                        if (!exists) {
                            mergedActions.push(defaultAction);
                        }
                    });

                    // Filter out 'Bandeau' and also deleted actions that might be in the saved layout
                    const finalActions = mergedActions.filter(savedAction =>
                        savedAction.title !== 'Bandeau' &&
                        defaultActions.some(def => def.title === savedAction.title)
                    );

                    setActions(finalActions);
                } else {
                    setActions(getFallbackActions());
                }
            } else {
                setActions(getFallbackActions());
            }
        } catch (e) {
            setActions(getFallbackActions());
        }
    };

    const getFallbackActions = () => [
        { title: "Accueil", description: "Vues & Sections", icon: "LayoutDashboard", link: "/admin/home", color: "border-neon-cyan/20 hover:border-neon-cyan", bg: "bg-neon-cyan/5", permission: "superadmin", baseColor: "cyan", columns: 1 },
        { title: "News", description: "Gérer les actualités", icon: "FileText", link: "/admin/manage?tab=News", color: "border-neon-blue/20 hover:border-neon-blue", bg: "bg-neon-blue/5", permission: "news", baseColor: "blue", columns: 1 },
        { title: "Musique", description: "Gérer les articles musique", icon: "Music", link: "/admin/manage?tab=Musique", color: "border-neon-cyan/20 hover:border-neon-cyan", bg: "bg-neon-cyan/5", permission: "publications", baseColor: "cyan", columns: 1 },
        { title: "Interviews", description: "Gérer & Créer", icon: "Mic", link: "#", color: "border-neon-purple/20 hover:border-neon-purple", bg: "bg-neon-purple/5", permission: "publications", baseColor: "purple", columns: 1 },
        { title: "Récaps", description: "Gérer les reportages", icon: "Video", link: "/admin/manage?tab=Recaps", color: "border-neon-red/20 hover:border-neon-red", bg: "bg-neon-red/5", permission: "recaps", baseColor: "red", columns: 1 },
        { title: "Agenda", description: "Gérer les dates", icon: "Calendar", link: "/admin/manage?tab=Agenda", color: "border-neon-yellow/20 hover:border-neon-yellow", bg: "bg-neon-yellow/5", permission: "agenda", baseColor: "yellow", columns: 1 },
        { title: "Galeries", description: "Gérer les albums", icon: "ImageIcon", link: "/admin/manage?tab=Galeries", color: "border-neon-pink/20 hover:border-neon-pink", bg: "bg-neon-pink/5", permission: "galeries", baseColor: "pink", columns: 1 },
        { title: "Statistiques", description: "Analyse du site", icon: "BarChart3", link: "/admin/stats", color: "border-neon-cyan/20 hover:border-neon-cyan", bg: "bg-neon-cyan/5", permission: "stats", baseColor: "cyan", columns: 1 },
        { title: "Spotify", description: "Playlists accueil", icon: "Music", link: "/admin/spotify", color: "border-neon-green/20 hover:border-neon-green", bg: "bg-neon-green/5", permission: "spotify", baseColor: "green", columns: 1 },
        { title: "Shop", description: "Gérer le shop", icon: "ShoppingBag", link: "/admin/shop", color: "border-neon-pink/20 hover:border-neon-pink", bg: "bg-neon-pink/5", permission: "shop", baseColor: "pink", columns: 1 },
        { title: "Newsletter", description: "Studio de création", icon: "Mail", link: "/newsletter/studio", color: "border-green-400/20 hover:border-green-400", bg: "bg-green-400/5", permission: "newsletter", baseColor: "green", columns: 1 },
        { title: "Abonnés", description: "Gérer la liste mail", icon: "Users", link: "/newsletter/admin", color: "border-white/10 hover:border-white/40", bg: "bg-white/5", permission: "all", baseColor: "white", columns: 1 },
        { title: "Éditeurs", description: "Gérer l'équipe", icon: "Lock", link: "/admin/editors", color: "border-neon-red/20 hover:border-neon-red", bg: "bg-neon-red/5", permission: "superadmin", baseColor: "red", columns: 2 },
        { title: "Team", description: "La Dream Team", icon: "Users", link: "/admin/team", color: "border-neon-blue/20 hover:border-neon-blue", bg: "bg-neon-blue/5", permission: "team", baseColor: "blue", columns: 3 },
        { title: "Mots de passe", description: "Accès & Sécurité", icon: "Lock", link: "/admin/settings", color: "border-neon-purple/20 hover:border-neon-purple", bg: "bg-neon-purple/5", permission: "all", baseColor: "purple", columns: 1 },
        { title: "MESSAGERIE & CONTACT", description: "Accès Messagerie & Contact", icon: "Mail", link: "/admin/messages", color: "border-neon-orange/20 hover:border-neon-orange", bg: "bg-neon-orange/5", permission: "messages", baseColor: "orange", columns: 1 }
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

        } catch (err) {
            // FALLBACK LOCAL (DEV MODE)
            // Si l'API n'est pas accessible (ex: dev local sans Wrangler), on vérifie en dur ici pour débloquer
            console.log("API Login failed, trying local check...", err);

            if ((username === 'contact@dropsiders.fr' || username === 'alex') && password === '2026') {
                setIsAuthenticated(true);
                localStorage.setItem('admin_auth', 'true');
                localStorage.setItem('admin_password', password);
                localStorage.setItem('admin_user', 'alex');
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
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-dark-bg py-32">
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

        // Si l'utilisateur possède 'publications', il a accès par défaut aux sous-sections éditoriales
        if (storedPermissions.includes('publications')) {
            const editorialSubsets = ['news', 'recaps', 'agenda', 'galeries'];
            if (editorialSubsets.includes(p)) return true;
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
            await fetch('/api/dashboard-actions/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ actions })
            });

            setHasChanges(false);
            setEditMode(false);
        } catch (e) {
            console.error("Error saving config:", e);
        } finally {
            setIsSaving(false);
        }
    };

    const isAdminAcc = storedPermissions.includes('all');
    // isAlex already declared above at line 330

    const deployToProduction = async () => {
        setDeployStatus('loading');
        setDeployRunUrl(null);
        if (deployPollRef.current) clearInterval(deployPollRef.current);

        try {
            const response = await fetch('/api/deploy', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ reason: 'Mise en ligne manuelle depuis le tableau de bord admin' })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                console.error('Erreur deploy:', data.error);
                setDeployStatus('failure');
                setTimeout(() => setDeployStatus('idle'), 6000);
                return;
            }

            setDeployStatus(data.status === 'in_progress' ? 'in_progress' : 'queued');
            if (data.runUrl) setDeployRunUrl(data.runUrl);

            // Poll for status every 5s
            if (data.runId) {
                deployPollRef.current = setInterval(async () => {
                    try {
                        const statusRes = await fetch(`/api/deploy/status?runId=${data.runId}`);
                        const statusData = await statusRes.json();

                        if (statusData.status === 'in_progress') {
                            setDeployStatus('in_progress');
                        } else if (statusData.status === 'completed') {
                            clearInterval(deployPollRef.current!);
                            setDeployStatus(statusData.conclusion === 'success' ? 'success' : 'failure');
                            setTimeout(() => setDeployStatus('idle'), 10000);
                        }
                        if (statusData.runUrl) setDeployRunUrl(statusData.runUrl);
                    } catch { /* ignore poll errors */ }
                }, 5000);
            } else {
                // No runId: just show queued for a bit
                setTimeout(() => {
                    setDeployStatus('success');
                    setTimeout(() => setDeployStatus('idle'), 8000);
                }, 4000);
            }
        } catch (e) {
            console.error('Deploy error:', e);
            setDeployStatus('failure');
            setTimeout(() => setDeployStatus('idle'), 6000);
        }
    };

    const filteredActions = actions.filter(action => !action.permission || hasPermission(action.permission));

    return (
        <div className="min-h-screen bg-dark-bg py-32">
            <div className="max-w-full mx-auto px-4 md:px-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16 text-center md:text-left flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
                >
                    <div>
                        <div className="flex items-center gap-4 justify-center md:justify-start mb-4">
                            <div className="p-3 bg-neon-red/10 rounded-2xl">
                                <LayoutDashboard className="w-8 h-8 text-neon-red" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter">
                                Tableau de <span className="text-neon-red">Bord</span>
                            </h1>
                        </div>
                        <p className="text-gray-400 text-lg max-w-2xl">
                            Bienvenue dans votre espace d'administration. {isAdminAcc && "Déplacez les cartes pour réorganiser."}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-6">
                            <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-white text-xs uppercase tracking-widest font-bold transition-all group">
                                <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                                Retour au site
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-gray-600 hover:text-white text-xs uppercase tracking-widest font-bold transition-all"
                            >
                                Déconnexion
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 w-full md:w-auto">
                        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 mb-2">
                            {isAdminAcc && (
                                <>
                                    {editMode ? (
                                        <>
                                            <button
                                                onClick={() => { setEditMode(false); fetchActions(); }}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-400"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                onClick={deployConfig}
                                                disabled={isSaving || !hasChanges}
                                                className="px-6 py-2 bg-neon-red text-white border border-neon-red rounded-xl text-[10px] font-black uppercase shadow-lg shadow-neon-red/20 disabled:opacity-50"
                                            >
                                                {isSaving ? "Enregistrement..." : "Enregistrer la config"}
                                            </button>
                                        </>
                                    ) : (
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
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Recherche rapide..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && searchTerm.trim()) {
                                        navigate(`/admin/manage?q=${encodeURIComponent(searchTerm)}`);
                                    }
                                }}
                                className="w-full pl-12 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-neon-red transition-colors"
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
                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                onClick={fetchActions}
                                className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all flex items-center gap-2"
                                title="Rafraîchir les données"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Actualiser
                            </button>
                            {/* Bouton Bandeau - Admin */}
                            {isAdminAcc && (
                                <button
                                    onClick={() => setIsBannerModalOpen(true)}
                                    className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${bannerState.enabled ? 'bg-neon-orange/10 border-neon-orange/40 text-neon-orange hover:bg-neon-orange hover:text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                                >
                                    <Megaphone className="w-4 h-4" />
                                    Bandeau
                                </button>
                            )}
                            {/* Bouton Mise en ligne - Alex uniquement */}
                            {isAlex && (
                                <motion.button
                                    whileHover={deployStatus === 'idle' ? { scale: 1.03 } : {}}
                                    whileTap={deployStatus === 'idle' ? { scale: 0.97 } : {}}
                                    onClick={() => deployStatus === 'idle' && deployToProduction()}
                                    disabled={deployStatus !== 'idle'}
                                    className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${deployStatus === 'idle'
                                        ? 'bg-neon-red/10 border-neon-red/40 text-neon-red hover:bg-neon-red hover:text-white hover:shadow-[0_0_20px_rgba(255,0,51,0.4)]'
                                        : deployStatus === 'loading' || deployStatus === 'queued'
                                            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 cursor-wait'
                                            : deployStatus === 'in_progress'
                                                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 cursor-wait'
                                                : deployStatus === 'success'
                                                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                                        }`}
                                    title="Déclencher un déploiement en production"
                                >
                                    {deployStatus === 'idle' && <><Rocket className="w-4 h-4" /> Mise en ligne</>}
                                    {(deployStatus === 'loading' || deployStatus === 'queued') && <><Loader2 className="w-4 h-4 animate-spin" /> En attente...</>}
                                    {deployStatus === 'in_progress' && <><Loader2 className="w-4 h-4 animate-spin" /> Build en cours...</>}
                                    {deployStatus === 'success' && <><CheckCircle2 className="w-4 h-4" /> En ligne !</>}
                                    {deployStatus === 'failure' && <><AlertCircle className="w-4 h-4" /> Échec</>}
                                </motion.button>
                            )}
                            {deployRunUrl && (deployStatus === 'in_progress' || deployStatus === 'success' || deployStatus === 'failure') && (
                                <a
                                    href={deployRunUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-400 hover:text-white transition-all"
                                    title="Voir le déploiement sur GitHub Actions"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                    <AnimatePresence>
                        {filteredActions.map((action, index) => (
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
                                        {/* D-Pad Controls (Replacement for GripVertical) */}
                                        <div className="absolute top-4 left-4 z-[60] grid grid-cols-3 gap-1 p-1 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                                            <div />
                                            <button
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveAction(index, 'up'); }}
                                                disabled={index === 0}
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
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveAction(index, 'down'); }}
                                                disabled={index === actions.length - 1}
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
                                                        <label className="text-[9px] font-black uppercase text-gray-400">Thème Couleur</label>
                                                        <div className="grid grid-cols-5 gap-1.5">
                                                            {colors.map(c => (
                                                                <button
                                                                    key={c.value}
                                                                    onClick={(e) => {
                                                                        e.preventDefault(); e.stopPropagation();
                                                                        updateActionProp(action.title, { baseColor: c.value });
                                                                    }}
                                                                    className={`w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-125 ${action.baseColor === c.value ? 'scale-125 ring-2 ring-white/50' : ''}`}
                                                                    style={{ backgroundColor: c.value === 'white' ? '#ffffff' : `var(--color-neon-${c.value})` }}
                                                                    title={c.name}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                                                        <label className="text-[9px] font-black uppercase text-gray-400">Roue Perso</label>
                                                        <div className="relative group/brush">
                                                            <button
                                                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-neon-red transition-colors relative"
                                                                style={action.baseColor?.startsWith('#') ? { backgroundColor: `${action.baseColor}33`, borderColor: action.baseColor } : {}}
                                                            >
                                                                <Paintbrush className="w-5 h-5 text-white" />
                                                                <input
                                                                    type="color"
                                                                    value={action.baseColor?.startsWith('#') ? action.baseColor : '#ff0000'}
                                                                    onChange={(e) => updateActionProp(action.title, { baseColor: e.target.value })}
                                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                                />
                                                            </button>
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
                                        } else if (action.title === 'Interviews') {
                                            e.preventDefault();
                                            setIsInterviewModalOpen(true);
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
                                        <div className="p-4 rounded-2xl bg-black/20 group-hover:bg-black/40 transition-colors">
                                            {getIcon(action.icon, action.baseColor)}
                                        </div>
                                        <div className="p-2 border border-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Plus className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-display font-black text-white uppercase italic mb-2">
                                        {action.title}
                                    </h3>
                                    <p className="text-gray-400 font-medium">
                                        {action.description}
                                    </p>
                                </Link>
                            </motion.div>
                        ))}
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
                                                { label: 'Aucun (Désactivé)', val: '' },
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
                                                className="text-[10px] font-black uppercase tracking-tighter italic whitespace-nowrap"
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
                                    <h3 className="text-xl font-bold text-white uppercase italic mb-1">Écrite</h3>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Nouveau format texte</p>
                                </Link>

                                <Link
                                    to="/news/create?type=Interview&subtype=video"
                                    className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-neon-red/10 hover:border-neon-red/50 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-neon-red/20 rounded-2xl flex items-center justify-center mb-6 border border-neon-red/30 group-hover:scale-110 transition-transform">
                                        <Youtube className="w-6 h-6 text-neon-red" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white uppercase italic mb-1">Vidéo</h3>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Nouveau format vidéo</p>
                                </Link>
                            </div>

                            <Link
                                to="/admin/manage?tab=Interviews"
                                className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-all group mb-8"
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
                                        <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tight">À la une sur l'accueil</h3>
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
        </div>
    );
}
