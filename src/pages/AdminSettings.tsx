import { useState, useEffect } from 'react';
import { Save, Lock, ArrowLeft, ShieldCheck, Mail, Eye, EyeOff, X, CheckCircle2, AlertCircle, Share2, Youtube, Globe, Facebook, Music, Instagram, Bell, Send, Info, RefreshCw, Trophy, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthHeaders, apiFetch } from '../utils/auth';
import { StarField } from '../components/ui/StarField';

export function AdminSettings() {
    const navigate = useNavigate();
    const [shopPassword, setShopPassword] = useState('');
    const [kitMediaPassword, setKitMediaPassword] = useState('');
    const [adminPassword, setAdminPassword] = useState(localStorage.getItem('admin_password') || '');
    const [socials, setSocials] = useState({
        instagram: '',
        tiktok: '',
        youtube: '',
        twitter: '',
        facebook: '',
        spotify: ''
    });
    const [showAdminPassword, setShowAdminPassword] = useState(false);
    const [showShopPassword, setShowShopPassword] = useState(false);
    const [showKitMediaPassword, setShowKitMediaPassword] = useState(false);
    const [contestFestivalHandle, setContestFestivalHandle] = useState('@tomorrowland');
    const [isContestActive, setIsContestActive] = useState(false);
    const [googleSearchKey, setGoogleSearchKey] = useState('');
    const [googleCx, setGoogleCx] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);
    const [isTestingPush, setIsTestingPush] = useState(false);
    const [subscribersCount, setSubscribersCount] = useState<number | null>(null);

    // Toast State
    const [toast, setToast] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error';
    }>({ show: false, message: '', type: 'success' });

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
    };

    const currentUser = localStorage.getItem('admin_user');
    const storedPermissions = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
    const isAdmin = storedPermissions.includes('all');

    useEffect(() => {
        if (!isAdmin) {
            navigate('/admin');
            return;
        }

        const fetchData = async () => {
            try {
                const resSets = await apiFetch('/api/settings', { headers: getAuthHeaders() });
                if (resSets.ok) {
                    const data = await resSets.json();
                    if (data.shop_password) setShopPassword(data.shop_password);
                    if (data.kit_media_password) setKitMediaPassword(data.kit_media_password);
                    if (data.socials) setSocials(data.socials);
                    if (data.contest_festival_handle) setContestFestivalHandle(data.contest_festival_handle);
                    if (data.is_contest_active !== undefined) setIsContestActive(data.is_contest_active);
                    if (data.google_search_key) setGoogleSearchKey(data.google_search_key);
                    if (data.google_cx) setGoogleCx(data.google_cx);
                }

                const resAuth = await apiFetch('/api/editors', { headers: getAuthHeaders() });
                if (resAuth.ok) {
                    const eds = await resAuth.json();
                    const me = eds.find((e: any) => e.username === currentUser);
                    if (me) setAdminPassword(me.password);
                }

                const resPush = await apiFetch('/api/push/subscribers/count', { headers: getAuthHeaders() });
                if (resPush.ok) {
                    const data = await resPush.json();
                    setSubscribersCount(data.count);
                }
            } catch (e: any) {
                console.error('Failed to fetch data', e);
            }
        };
        fetchData();
    }, [isAdmin, currentUser, navigate]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await apiFetch('/api/settings', { headers: getAuthHeaders() });
            const data = res.ok ? await res.json() : {};

            const newSettings = {
                ...data,
                shop_password: shopPassword,
                kit_media_password: kitMediaPassword,
                socials: socials,
                contest_festival_handle: contestFestivalHandle,
                is_contest_active: isContestActive,
                google_search_key: googleSearchKey,
                google_cx: googleCx
            };

            const saveRes = await apiFetch('/api/settings/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newSettings)
            });

            const resAuth = await apiFetch('/api/editors', { headers: getAuthHeaders() });
            if (resAuth.ok) {
                const eds = await resAuth.json();
                const me = eds.find((e: any) => e.username === currentUser);
                if (me && me.password !== adminPassword) {
                    await apiFetch('/api/editors/update', {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                            username: currentUser,
                            password: adminPassword,
                            name: me.name,
                            permissions: me.permissions
                        })
                    });
                    localStorage.setItem('admin_password', adminPassword);
                }
            }

            if (saveRes.ok) {
                showNotification('Paramètres enregistrés avec succès !', 'success');
            } else {
                showNotification('Erreur lors de l\'enregistrement', 'error');
            }
        } catch (e: any) {
            showNotification('Erreur de connexion', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRevokeSessions = async () => {
        if (!confirm('Voulez-vous vraiment déconnecter tous les autres appareils ? Vous resterez connecté sur celui-ci.')) return;

        setIsRevoking(true);
        try {
            const res = await apiFetch('/api/auth/revoke-all', {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                if (data.sessionId) {
                    localStorage.setItem('admin_session_id', data.sessionId);
                    showNotification('Toutes les autres sessions ont été révoquées !', 'success');
                }
            } else {
                const errorData = await res.json().catch(() => ({}));
                showNotification(errorData.error || 'Erreur lors de la révocation', 'error');
            }
        } catch (e: any) {
            showNotification('Erreur réseau', 'error');
        } finally {
            setIsRevoking(false);
        }
    };

    const handleTestPush = async () => {
        if (!window.confirm('Voulez-vous envoyer une notification de test à TOUS les abonnés ?')) return;
        setIsTestingPush(true);
        try {
            const res = await apiFetch('/api/push/test', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    password: adminPassword,
                    title: "DROPSIDERS : TEST RÉUSSI 🚀",
                    body: "Ton système de notifications push est maintenant 100% opérationnel !"
                })
            });
            if (res.ok) {
                showNotification('Notification de test envoyée !');
            } else {
                const err = await res.json();
                showNotification(err.error || 'Erreur lors de l\'envoi', 'error');
            }
        } catch (e) {
            showNotification('Erreur réseau', 'error');
        } finally {
            setIsTestingPush(false);
        }
    };

    const handleResetLeaderboard = async (type: 'xp' | 'wiki' | 'all') => {
        const message = type === 'xp' ? "Voulez-vous vraiment remettre à zéro tous les scores XP et niveaux des joueurs ?" :
                       type === 'wiki' ? "Voulez-vous vraiment remettre à zéro tous les votes et notes des DJs, Clubs et Festivals ?" :
                       "Voulez-vous vraiment remettre à zéro TOUS les classements (XP + Wiki) ?";
        
        if (!window.confirm(message)) return;

        try {
            const res = await apiFetch('/api/admin/reset-leaderboards', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ type })
            });

            if (res.ok) {
                showNotification("Réinitialisation effectuée avec succès !", 'success');
            } else {
                showNotification("Erreur lors de la réinitialisation.", 'error');
            }
        } catch (e) {
            showNotification("Erreur réseau.", 'error');
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-dark-bg py-8 md:py-20 px-4 md:px-8 relative overflow-hidden">
            <StarField />
            <div className="max-w-full mx-auto px-4 md:px-12 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
                    <div className="flex items-center gap-4 md:gap-6">
                        <button
                            onClick={() => navigate('/admin')}
                            className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all text-white group"
                        >
                            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                Studio <span className="text-neon-purple">Passwords</span>
                            </h1>
                            <p className="text-gray-400 mt-2 text-sm md:text-base">Gérer tous les mots de passe du site au même endroit.</p>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-8 py-3 bg-neon-purple hover:bg-neon-purple/80 text-white font-black uppercase rounded-xl transition-all shadow-lg shadow-neon-purple/20 flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-neon-purple/10 rounded-2xl">
                                <ShieldCheck className="w-6 h-6 text-neon-purple" />
                            </div>
                            <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight">Gestion des Clés d'Accès</h2>
                        </div>

                        <div className="space-y-8">
                            {/* Admin Password */}
                            <div className="pb-8 border-b border-white/5">
                                <label className="block text-[10px] font-black text-neon-cyan uppercase tracking-widest mb-3 ml-1">
                                    MON MOT DE PASSE (TABLEAU DE BORD)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                        <Lock className="w-5 h-5 text-neon-cyan/50" />
                                    </div>
                                    <input
                                        type={showAdminPassword ? "text" : "password"}
                                        name="password"
                                        autoComplete="current-password"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-14 py-5 text-white font-black tracking-[0.3em] focus:outline-none focus:border-neon-cyan transition-all"
                                        placeholder="EX: MOTDEPASSE"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                                        className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-500 hover:text-white transition-colors"
                                    >
                                        {showAdminPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-4 leading-relaxed italic">
                                    Mot de passe pour accéder à votre espace administrateur personnel ({currentUser}).
                                </p>
                            </div>

                            {/* Shop Password */}
                            <div className="pb-8 border-b border-white/5">
                                <label className="block text-[10px] font-black text-neon-red uppercase tracking-widest mb-3 ml-1">
                                    MOT DE PASSE (SHOP PRIVÉ)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                        <Lock className="w-5 h-5 text-neon-red/50" />
                                    </div>
                                    <input
                                        type={showShopPassword ? "text" : "password"}
                                        value={shopPassword}
                                        onChange={(e) => setShopPassword(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-14 py-5 text-white font-black tracking-[0.3em] focus:outline-none focus:border-neon-red transition-all"
                                        placeholder="EX: DROPSIDERS2024"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowShopPassword(!showShopPassword)}
                                        className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-500 hover:text-white transition-colors"
                                    >
                                        {showShopPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-4 leading-relaxed italic">
                                    Protège l'accès anticipé à la nouvelle collection.
                                </p>
                            </div>

                            {/* Kit Media Password */}
                            <div className="pb-8 border-b border-white/5">
                                <label className="block text-[10px] font-black text-neon-blue uppercase tracking-widest mb-3 ml-1">
                                    MOT DE PASSE (KIT MEDIA EXTERNE)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                        <Lock className="w-5 h-5 text-neon-blue/50" />
                                    </div>
                                    <input
                                        type={showKitMediaPassword ? "text" : "password"}
                                        value={kitMediaPassword}
                                        onChange={(e) => setKitMediaPassword(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-14 py-5 text-white font-black tracking-[0.3em] focus:outline-none focus:border-neon-blue transition-all"
                                        placeholder="EX: CONTACTDROP"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKitMediaPassword(!showKitMediaPassword)}
                                        className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-500 hover:text-white transition-colors"
                                    >
                                        {showKitMediaPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-4 leading-relaxed italic">
                                    Mot de passe à donner aux marques pour afficher le Kit Media / Les Statistiques.
                                </p>
                            </div>

                            {/* Google Search API */}
                            <div className="pt-8 border-t border-white/5">
                                <label className="block text-[10px] font-black text-neon-cyan uppercase tracking-widest mb-3 ml-1">
                                    API GOOGLE IMAGES (SEARCH API)
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                            <Globe className="w-5 h-5 text-neon-cyan/50" />
                                        </div>
                                        <input
                                            type="password"
                                            value={googleSearchKey}
                                            onChange={(e) => setGoogleSearchKey(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-4 py-5 text-white font-bold text-xs focus:outline-none focus:border-neon-cyan transition-all"
                                            placeholder="GOOGLE_SEARCH_KEY"
                                        />
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                            <Search className="w-5 h-5 text-neon-cyan/50" />
                                        </div>
                                        <input
                                            type="text"
                                            value={googleCx}
                                            onChange={(e) => setGoogleCx(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-4 py-5 text-white font-bold text-xs focus:outline-none focus:border-neon-cyan transition-all"
                                            placeholder="GOOGLE_CX (Search Engine ID)"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-4 leading-relaxed italic">
                                    Nécessaire pour la recherche d'images Google dans le Cloud Upload.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Maintenance / Leaderboards Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl mt-8"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-neon-purple/10 rounded-2xl">
                                <RefreshCw className="w-6 h-6 text-neon-purple" />
                            </div>
                            <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight">Maintenance Classements</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl space-y-4">
                                <div>
                                    <h3 className="text-white font-black uppercase text-xs tracking-widest mb-2 italic">Reset XP & Levels</h3>
                                    <p className="text-gray-500 text-[9px] uppercase font-bold tracking-tight leading-relaxed">
                                        Efface tous les scores XP, rangs et badges de la communauté.
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleResetLeaderboard('xp')}
                                    className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all"
                                >
                                    Reset Community XP
                                </button>
                            </div>

                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl space-y-4">
                                <div>
                                    <h3 className="text-white font-black uppercase text-xs tracking-widest mb-2 italic">Reset Wiki Votes</h3>
                                    <p className="text-gray-500 text-[9px] uppercase font-bold tracking-tight leading-relaxed">
                                        Remet à zéro les votes/notes pour DJs, Clubs et Festivals.
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleResetLeaderboard('wiki')}
                                    className="w-full py-3 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white border border-orange-500/20 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all"
                                >
                                    Reset Wiki Votes
                                </button>
                            </div>

                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl space-y-4">
                                <div>
                                    <h3 className="text-white font-black uppercase text-xs tracking-widest mb-2 italic">Reset Global</h3>
                                    <p className="text-gray-500 text-[9px] uppercase font-bold tracking-tight leading-relaxed">
                                        Remet à zéro absolument tous les classements du site.
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleResetLeaderboard('all')}
                                    className="w-full py-3 bg-white/5 hover:bg-white text-white/50 hover:text-black border border-white/10 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all"
                                >
                                    Reset Tout (Full Wipe)
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Socials Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-neon-red/10 rounded-2xl">
                                <Share2 className="w-6 h-6 text-neon-red" />
                            </div>
                            <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight">Réseaux Sociaux</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12 border-b border-white/5">
                            {[
                                { id: 'instagram', label: 'Instagram', color: 'text-pink-500', icon: Instagram, placeholder: 'dropsiders.fr' },
                                { id: 'tiktok', label: 'TikTok', color: 'text-white', icon: Share2, placeholder: 'dropsiders.fr' },
                                { id: 'youtube', label: 'YouTube', color: 'text-red-500', icon: Youtube, placeholder: 'dropsiders' },
                                { id: 'twitter', label: 'X (Twitter)', color: 'text-blue-400', icon: Globe, placeholder: 'dropsidersfr' },
                                { id: 'facebook', label: 'Facebook', color: 'text-blue-600', icon: Facebook, placeholder: 'dropsidersfr' },
                                { id: 'spotify', label: 'Spotify', color: 'text-green-500', icon: Music, placeholder: 'dropsiders' }
                            ].map((social: any) => (
                                <div key={social.id}>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                        {social.label}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <social.icon className={`w-4 h-4 ${social.color} opacity-50`} />
                                        </div>
                                        <input
                                            type="text"
                                            value={(socials as any)[social.id] || ''}
                                            onChange={(e) => setSocials(prev => ({ ...prev, [social.id]: e.target.value }))}
                                            className="w-full bg-black/40 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-white font-bold text-xs focus:outline-none focus:border-neon-red transition-all"
                                            placeholder={`Ex: ${social.placeholder}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Contest Festival Handle */}
                        <div className="mt-12">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-neon-cyan/10 rounded-2xl">
                                    <Trophy className="w-6 h-6 text-neon-cyan" />
                                </div>
                                <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight">Paramètres du Concours QUIZ</h2>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-1">
                                    Compte Festival à Identifier (Instagram)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                        <Instagram className="w-5 h-5 text-neon-cyan/50" />
                                    </div>
                                    <input
                                        type="text"
                                        value={contestFestivalHandle}
                                        onChange={(e) => setContestFestivalHandle(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-white font-black italic uppercase focus:outline-none focus:border-neon-cyan transition-all"
                                        placeholder="EX: @TOMORROWLAND"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-4 leading-relaxed italic uppercase">
                                    C'est le compte que l'utilisateur devra identifier dans sa story en plus de @dropsiders.fr.
                                </p>
                            </div>

                            <div className="mt-8 p-6 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-between gap-4 transition-all hover:bg-white/[0.05]">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg transition-colors ${isContestActive ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white/40'}`}>
                                        <Trophy className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-white tracking-widest">Activer les Jeux Concours</span>
                                        <span className="text-[8px] font-bold text-white/40 uppercase">Affiche ou masque la section concours sur le site</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsContestActive(!isContestActive)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${isContestActive ? 'bg-green-500' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isContestActive ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Security Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-red-500/10 rounded-2xl">
                                <Lock className="w-6 h-6 text-red-500" />
                            </div>
                            <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight">Sécurité du Compte</h2>
                        </div>

                        <div className="bg-red-500/5 border border-red-500/20 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-center md:text-left">
                                <h3 className="text-white font-black uppercase text-sm tracking-widest mb-2 italic">Déconnexion Globale</h3>
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tight max-w-sm leading-relaxed">
                                    Ceci invalidera immédiatement l'accès pour tous les autres navigateurs et appareils connectés à votre compte ({currentUser}).
                                    Vous resterez connecté sur cet appareil.
                                </p>
                            </div>
                            <button
                                onClick={handleRevokeSessions}
                                disabled={isRevoking}
                                className="whitespace-nowrap px-8 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-red-500/5"
                            >
                                {isRevoking ? 'Révocation en cours...' : 'Révoquer toutes les sessions'}
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Notifications Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-8 md:mt-12 bg-gradient-to-br from-neon-red/10 to-transparent border border-neon-red/20 rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-neon-red/5"
                >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="p-5 bg-neon-red/20 rounded-[2rem] shadow-xl shadow-neon-red/10 border border-neon-red/30">
                                <Bell className="w-8 h-8 text-neon-red" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-display font-black text-white uppercase italic tracking-tighter mb-2 text-glow-pink">Notification Center</h2>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Flux Temps Réel & Audience Push</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-black/40 p-2 rounded-[2.5rem] border border-white/5">
                            <div className="px-8 py-4">
                                <div className="text-[10px] font-black text-neon-cyan uppercase tracking-widest mb-1 opacity-60">Audience Active</div>
                                <div className="text-3xl font-display font-black text-white italic">
                                    {subscribersCount === null ? '...' : subscribersCount}
                                </div>
                            </div>
                            <button
                                onClick={handleTestPush}
                                disabled={isTestingPush}
                                className="flex items-center gap-3 px-8 py-5 bg-neon-red text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white hover:text-black transition-all active:scale-95 disabled:opacity-50 group shadow-lg shadow-neon-red/20"
                            >
                                <Send className={`w-4 h-4 transition-transform ${isTestingPush ? 'animate-bounce' : 'group-hover:translate-x-1 group-hover:-translate-y-1'}`} />
                                {isTestingPush ? 'Envoi...' : 'Tester le Broadcast'}
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl flex items-start gap-4 hover:bg-white/[0.05] transition-colors group">
                            <Info className="w-4 h-4 text-neon-cyan shrink-0 mt-1 transition-transform group-hover:scale-110" />
                            <p className="text-[9px] text-white/40 uppercase font-bold tracking-tight leading-relaxed">
                                Les notifications push sont envoyées automatiquement lors de la création d'un article si l'option est cochée.
                                Ce bouton permet de forcer un test technique pour vérifier la validité des clés VAPID.
                            </p>
                        </div>
                        <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl flex items-start gap-4 hover:bg-white/[0.05] transition-colors group">
                            <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-1 transition-transform group-hover:scale-110" />
                            <p className="text-[9px] text-white/40 uppercase font-bold tracking-tight leading-relaxed">
                                Données chiffrées de bout en bout (E2EE). Aucune information personnelle ou IP n'est conservée,
                                seulement le jeton cryptographique du navigateur.
                            </p>
                        </div>
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {toast.show && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                            exit={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
                            className="fixed bottom-12 left-1/2 z-[200]"
                        >
                            <div className={`flex items-center gap-4 px-6 py-4 rounded-[2rem] shadow-2xl backdrop-blur-3xl border ${toast.type === 'success'
                                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-500'
                                }`}>
                                <div className={`p-2 rounded-full ${toast.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap text-white">
                                    {toast.message}
                                </span>
                                <button
                                    onClick={() => setToast(prev => ({ ...prev, show: false }))}
                                    className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4 opacity-50 hover:opacity-100 text-white" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-12 p-8 border border-white/5 rounded-3xl bg-white/[0.02]">
                    <div className="flex gap-4 items-start">
                        <Mail className="w-5 h-5 text-gray-500 shrink-0 mt-1" />
                        <div>
                            <h4 className="text-white font-bold mb-1 uppercase text-xs tracking-wider">Note de sécurité</h4>
                            <p className="text-gray-500 text-xs leading-relaxed uppercase tracking-tight">
                                Le changement de mot de passe est instantané. Assurez-vous de le communiquer à l'équipe si nécessaire.
                                Ce code est distinct de votre mot de passe de connexion personnel.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminSettings;
