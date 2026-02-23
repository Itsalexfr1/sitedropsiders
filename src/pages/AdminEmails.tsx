import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Inbox, Send, Trash2, RefreshCcw, Search, Reply, Forward, ArrowLeft, Calendar, User, ExternalLink, Globe, Archive, AlertCircle, MoreVertical, Star, Lock, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Email {
    id: string;
    from?: string;
    to?: string;
    fromName?: string;
    subject: string;
    preview: string;
    content: string;
    date: string;
    read: boolean;
    starred: boolean;
    labels: string[];
}

const EmailSignature = ({ password = '2026' }: { password?: string }) => (
    <div className="mt-12 pt-8 border-t border-white/10">
        <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center border border-white/10 shadow-lg overflow-hidden">
                <img src="/logo_presentation.png" alt="Dropsiders" className="w-full h-full object-contain p-1" />
            </div>
            <div>
                <p className="text-sm font-black text-white uppercase tracking-widest italic">L'Équipe <span className="text-neon-red">Dropsiders</span></p>
                <div className="flex flex-col mt-0.5">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Média Festivals</p>
                    <p className="text-[7px] font-black text-gray-600 uppercase tracking-[0.1em]">News - Récaps Events - Interviews - Concours</p>
                </div>
            </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 transition-all">
                <Globe className="w-3.5 h-3.5 text-neon-red" />
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Kit Média 2026</span>
                    <a
                        href="https://dropsiders.fr/kitmedia"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[7px] font-bold text-gray-500 hover:text-white uppercase flex items-center gap-1 transition-colors"
                    >
                        Accès : <span className="text-neon-red font-black uppercase">{password}</span>
                    </a>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="w-px h-8 bg-white/10"></div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-neon-red shadow-[0_0_5px_red]"></div>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">France • Espagne • USA</span>
                    </div>
                    <p className="text-[8px] font-bold text-gray-600 uppercase tracking-[0.3em] hover:text-white cursor-default">www.dropsiders.fr</p>
                </div>
            </div>
        </div>
    </div>
);

export function AdminEmails() {
    const navigate = useNavigate();
    const [activeAccount, setActiveAccount] = useState<'alex' | 'contact'>('contact');
    const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'archive' | 'trash'>('inbox');
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [emailPassword, setEmailPassword] = useState('');
    const [savedPassword, setSavedPassword] = useState('2026');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [isComposing, setIsComposing] = useState(false);
    const [composeData, setComposeData] = useState({ to: '', subject: '', content: '' });
    const [isSending, setIsSending] = useState(false);
    const [emails, setEmails] = useState<{ [key: string]: Email[] }>({});

    const [mailConfig, setMailConfig] = useState<any>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Fetch general settings for password
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    const savedPass = data.email_password || '2026';
                    setSavedPassword(savedPass);
                    if (sessionStorage.getItem('email_auth') === savedPass) {
                        setIsAuthorized(true);
                    }
                }

                // Fetch mail configuration
                const mailRes = await fetch('/api/emails/config');
                if (mailRes.ok) {
                    const mailData = await mailRes.json();
                    setMailConfig(mailData);
                }
            } catch (e) {
                console.error('Failed to fetch settings');
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (isAuthorized) {
            handleRefresh();
        }
    }, [isAuthorized, activeAccount, activeFolder]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/settings');
            const data = res.ok ? await res.json() : {};
            const correctPass = data.email_password || '2026';

            if (emailPassword === correctPass) {
                setIsAuthorized(true);
                sessionStorage.setItem('email_auth', correctPass);
                setLoginError('');
            } else {
                setLoginError('Code d\'accès incorrect');
                setEmailPassword('');
            }
        } catch (e) {
            setLoginError('Erreur de connexion');
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            // Déclencher le robot GitHub en arrière-plan
            fetch('/api/emails/sync', { method: 'POST' }).catch(() => { });

            const res = await fetch(`/api/emails/list?account=${activeAccount}&folder=${activeFolder}`);
            if (res.ok) {
                const data = await res.json();
                setEmails(prev => ({ ...prev, [`${activeAccount}_${activeFolder}`]: data.emails }));
            }
        } catch (e) {
            console.error('Failed to fetch emails');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleEmailAction = async (action: 'archive' | 'trash' | 'delete', emailId: string) => {
        try {
            const targetFolderMap: { [key: string]: string | null } = {
                'archive': 'archive',
                'trash': 'trash',
                'delete': null
            };

            const toFolder = targetFolderMap[action];

            const res = await fetch('/api/emails/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    emailId,
                    fromFolder: activeFolder,
                    toFolder,
                    account: activeAccount
                })
            });

            if (res.ok) {
                // Rafraîchir localement
                handleRefresh();
                setSelectedEmail(null);
            }
        } catch (e) {
            console.error('Action failed');
        }
    };

    const handleStarToggle = async (emailId: string) => {
        // Logique simplifiée : mise à jour locale de l'état
        setSelectedEmail(prev => prev ? { ...prev, starred: !prev.starred } : null);
        setEmails(prev => {
            const current = [...(prev[activeAccount] || [])];
            const idx = current.findIndex(e => e.id === emailId);
            if (idx !== -1) {
                current[idx] = { ...current[idx], starred: !current[idx].starred };
            }
            return { ...prev, [activeAccount]: current };
        });
    };

    const handleEmptyTrash = async () => {
        if (!confirm('Voulez-vous vraiment vider la corbeille ?')) return;
        try {
            const res = await fetch('/api/emails/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'empty_trash', fromFolder: 'trash', account: activeAccount })
            });
            if (res.ok) {
                handleRefresh();
                setSelectedEmail(null);
            }
        } catch (e) {
            console.error('Empty trash failed');
        }
    };

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        try {
            const res = await fetch('/api/emails/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...composeData,
                    account: activeAccount,
                    status: 'pending'
                })
            });
            if (res.ok) {
                setIsComposing(false);
                setComposeData({ to: '', subject: '', content: '' });
                alert('E-mail envoyé avec succès !');
                if (activeFolder === 'sent') handleRefresh();
            }
        } catch (e) {
            alert('Erreur lors de l\'envoi');
        } finally {
            setIsSending(false);
        }
    };

    const currentEmails = emails[`${activeAccount}_${activeFolder}`] || [];
    const filteredEmails = currentEmails.filter(email =>
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (email.from?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (email.fromName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (email.to?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
                <div className="max-w-md w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-xl shadow-2xl text-center"
                    >
                        <div className="w-20 h-20 bg-neon-orange/10 rounded-3xl flex items-center justify-center border border-neon-orange/20 mx-auto mb-8">
                            <Lock className="w-8 h-8 text-neon-orange" />
                        </div>
                        <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                            Accès <span className="text-neon-orange">Sécurisé</span>
                        </h2>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-10">
                            Veuillez entrer le code d'accès à la messagerie
                        </p>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <input
                                type="password"
                                value={emailPassword}
                                onChange={(e) => setEmailPassword(e.target.value)}
                                placeholder="MOT DE PASSE"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-center font-black tracking-[0.5em] focus:outline-none focus:border-neon-orange transition-all"
                            />
                            {loginError && <p className="text-neon-red text-[10px] font-black uppercase tracking-widest">{loginError}</p>}
                            <button
                                type="submit"
                                className="w-full py-5 bg-neon-orange text-white font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-lg shadow-neon-orange/20 active:scale-95 text-xs"
                            >
                                Se connecter
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg pt-24 px-4 sm:px-6 pb-12">
            <div className="max-w-7xl mx-auto">
                {/* Header Dashboard Style */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin')}
                            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                                Messagerie <span className="text-neon-orange">Dropsiders</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Outil de Communication Interne</p>
                                <div className="group relative">
                                    <AlertCircle className="w-3 h-3 text-neon-orange cursor-help" />
                                    <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-black/90 border border-neon-orange/20 rounded-xl text-[10px] text-gray-300 hidden group-hover:block z-50 backdrop-blur-xl">
                                        🚀 Pour voir vos vrais mails LWS, lancez <strong>npm run mail:sync</strong> dans votre terminal.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setActiveAccount('contact')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeAccount === 'contact' ? 'bg-neon-orange text-white shadow-[0_0_20px_rgba(255,165,0,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {mailConfig?.accounts?.contact?.email || 'contact@dropsiders.fr'}
                        </button>
                        <button
                            onClick={() => setActiveAccount('alex')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeAccount === 'alex' ? 'bg-neon-orange text-white shadow-[0_0_20px_rgba(255,165,0,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {mailConfig?.accounts?.alex?.email || 'alex@dropsiders.fr'}
                        </button>
                    </div>
                </div>

                {/* Main Interface */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col md:flex-row min-h-[800px]">

                    {/* Sidebar Navigation */}
                    <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 p-6 space-y-8">
                        <button
                            onClick={() => setIsComposing(true)}
                            className="w-full py-4 bg-neon-orange text-white font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-lg shadow-neon-orange/20 active:scale-95 text-xs flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Nouveau Message
                        </button>

                        <div className="space-y-2">
                            <button
                                onClick={() => setActiveFolder('inbox')}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeFolder === 'inbox' ? 'bg-neon-orange/10 border border-neon-orange/20 text-neon-orange' : 'text-gray-500 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Inbox className="w-4 h-4" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Boîte de réception</span>
                                </div>
                                {activeFolder === 'inbox' && (
                                    <span className="bg-neon-orange text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                        {filteredEmails.filter(e => !e.read).length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveFolder('sent')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeFolder === 'sent' ? 'bg-neon-orange/10 border border-neon-orange/20 text-neon-orange' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Send className="w-4 h-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Envoyés</span>
                            </button>
                            <button
                                onClick={() => setActiveFolder('archive')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeFolder === 'archive' ? 'bg-neon-orange/10 border border-neon-orange/20 text-neon-orange' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Archive className="w-4 h-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Archives</span>
                            </button>
                            <button
                                onClick={() => setActiveFolder('trash')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeFolder === 'trash' ? 'bg-neon-orange/10 border border-neon-orange/20 text-neon-orange' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Corbeille</span>
                            </button>
                        </div>

                        <div className="pt-8 space-y-4">
                            <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] px-4">Étiquettes</h4>
                            <div className="px-4 space-y-4">
                                <div className="flex items-center gap-3 text-neon-red">
                                    <div className="w-2 h-2 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
                                    <span className="text-[10px] font-bold uppercase">Urgent</span>
                                </div>
                                <div className="flex items-center gap-3 text-neon-cyan">
                                    <div className="w-2 h-2 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
                                    <span className="text-[10px] font-bold uppercase">Partenariat</span>
                                </div>
                                <div className="flex items-center gap-3 text-neon-purple">
                                    <div className="w-2 h-2 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
                                    <span className="text-[10px] font-bold uppercase">Accréditation</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Email List / Reader */}
                    <div className="flex-1 flex flex-col min-w-0 h-[700px]">

                        {/* Toolbar */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un message..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white outline-none focus:border-neon-orange transition-all font-medium"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                {activeFolder === 'trash' && (filteredEmails || []).length > 0 && (
                                    <button
                                        onClick={handleEmptyTrash}
                                        className="px-4 py-2 bg-neon-red/10 border border-neon-red/20 rounded-xl text-[10px] font-black uppercase text-neon-red hover:bg-neon-red hover:text-white transition-all"
                                    >
                                        Vider la corbeille
                                    </button>
                                )}
                                <button
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    className={`p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-neon-orange transition-all ${isRefreshing ? 'animate-spin text-neon-orange' : ''}`}
                                    title="Rafraîchir"
                                >
                                    <RefreshCcw className="w-4 h-4" />
                                </button>
                                <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all" title="Plus d'actions">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            {/* List View */}
                            <div className={`w-full md:w-80 lg:w-96 border-r border-white/5 overflow-y-auto custom-scrollbar flex-shrink-0 bg-black/20 ${selectedEmail ? 'hidden lg:block' : 'block'}`}>
                                {filteredEmails.length > 0 ? (
                                    filteredEmails.map((email) => (
                                        <button
                                            key={email.id}
                                            onClick={() => setSelectedEmail(email)}
                                            className={`w-full text-left p-6 border-b border-white/5 transition-all relative group ${!email.read ? 'bg-neon-orange/[0.03]' : 'hover:bg-white/[0.02]'} ${selectedEmail?.id === email.id ? 'bg-neon-orange/[0.08] border-r-2 border-r-neon-orange' : ''}`}
                                        >
                                            {!email.read && activeFolder === 'inbox' && (
                                                <div className="absolute top-7 left-2 w-1.5 h-1.5 bg-neon-orange rounded-full shadow-[0_0_10px_#ffa500]" />
                                            )}
                                            <div className="flex justify-between items-start gap-2 mb-2">
                                                <span className={`text-[11px] font-black uppercase tracking-tight truncate ${!email.read ? 'text-white' : 'text-gray-400'}`}>
                                                    {activeFolder === 'sent' ? `À: ${email.to}` : email.fromName}
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-500 flex-shrink-0">
                                                    {new Date(email.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h4 className={`text-sm font-bold mb-1 truncate ${!email.read ? 'text-white' : 'text-gray-300'}`}>
                                                {email.subject}
                                            </h4>
                                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                {email.preview}
                                            </p>

                                            <div className="flex gap-2 mt-4">
                                                {(email.labels || []).map(label => (
                                                    <span key={label} className="text-[8px] font-black px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-gray-500 uppercase tracking-widest">
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-12 text-center">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                            <Mail className="w-8 h-8 text-gray-600" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Aucun message</p>
                                    </div>
                                )}
                            </div>

                            {/* Reader View */}
                            <div className={`flex-1 overflow-y-auto custom-scrollbar bg-black/40 ${!selectedEmail ? 'hidden md:flex items-center justify-center' : 'flex flex-col'}`}>
                                {selectedEmail ? (
                                    <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-right-4 duration-300">

                                        {/* Reader Header */}
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-gradient-to-br from-neon-orange to-orange-700 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-neon-orange/20">
                                                    {(selectedEmail.fromName || selectedEmail.to || 'D')[0]}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-xl font-bold text-white">{selectedEmail.fromName || selectedEmail.from}</h3>
                                                        <span className="text-xs text-gray-500 font-medium">({selectedEmail.from || selectedEmail.to})</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {new Date(selectedEmail.date).toLocaleString()}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                            <User className="w-3.5 h-3.5" />
                                                            {activeFolder === 'sent' ? `de ${selectedEmail.from || activeAccount}` : 'à moi'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5">
                                                <button className="p-2.5 text-gray-400 hover:text-white transition-all"><Reply className="w-4 h-4" /></button>
                                                <button
                                                    onClick={() => handleStarToggle(selectedEmail.id)}
                                                    className="p-2.5 text-gray-400 hover:text-white transition-all"
                                                >
                                                    <Star className={`w-4 h-4 ${selectedEmail.starred ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                                                </button>
                                                {activeFolder !== 'archive' && (
                                                    <button
                                                        onClick={() => handleEmailAction('archive', selectedEmail.id)}
                                                        className="p-2.5 text-gray-400 hover:text-neon-cyan transition-all"
                                                        title="Archiver"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {activeFolder === 'trash' ? (
                                                    <button
                                                        onClick={() => handleEmailAction('delete', selectedEmail.id)}
                                                        className="p-2.5 text-neon-red hover:bg-neon-red/10 rounded-lg transition-all"
                                                        title="Supprimer définitivement"
                                                    >
                                                        <Trash2 className="w-4 h-4 fill-neon-red/20" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEmailAction('trash', selectedEmail.id)}
                                                        className="p-2.5 text-gray-400 hover:text-neon-red transition-all"
                                                        title="Mettre à la corbeille"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <h2 className="text-2xl font-display font-black text-white italic tracking-tight mb-8 leading-tight">
                                            {selectedEmail.subject}
                                        </h2>

                                        <div className="bg-black/20 border border-white/5 rounded-3xl p-8 md:p-10 text-gray-300 leading-relaxed space-y-4 whitespace-pre-wrap font-medium">
                                            {selectedEmail.content}

                                            {/* Ajout automatique de la signature sur les emails sortants ou prévisualisation */}
                                            <EmailSignature password={savedPassword} />
                                        </div>

                                        <div className="mt-12 flex flex-wrap gap-4">
                                            <button
                                                onClick={() => {
                                                    setComposeData({
                                                        to: selectedEmail.from || '',
                                                        subject: `Re: ${selectedEmail.subject || ''}`,
                                                        content: `\n\n-------------------\nLe ${new Date(selectedEmail.date).toLocaleString()}, ${selectedEmail.fromName} a écrit :\n\n${selectedEmail.content}`
                                                    });
                                                    setIsComposing(true);
                                                }}
                                                className="px-8 py-3.5 bg-neon-orange text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-neon-orange/20 flex items-center gap-3 hover:scale-105 transition-all active:scale-95"
                                            >
                                                <Reply className="w-4 h-4" /> Répondre
                                            </button>
                                            <button className="px-8 py-3.5 bg-white/5 border border-white/10 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white/10 transition-all">
                                                <Forward className="w-4 h-4" /> Transférer
                                            </button>

                                            <div className="ml-auto flex items-center gap-3 text-gray-600">
                                                <button className="text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
                                                    Voir l'original <ExternalLink className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-6">
                                        <div className="w-24 h-24 bg-neon-orange/5 rounded-[2.5rem] flex items-center justify-center mx-auto border border-neon-orange/10 relative">
                                            <Mail className="w-10 h-10 text-neon-orange" />
                                            <motion.div
                                                className="absolute -top-1 -right-1 w-6 h-6 bg-neon-red rounded-full flex items-center justify-center text-[10px] font-black text-white border-2 border-dark-bg"
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                !
                                            </motion.div>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-bold text-white uppercase italic tracking-tight">Sélectionnez un message</h3>
                                            <p className="text-xs text-gray-500 max-w-[200px] mx-auto uppercase tracking-widest leading-loose">Choisissez un email à gauche pour lire son contenu.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Compose Modal */}
            <AnimatePresence>
                {isComposing && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-dark-bg border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <h3 className="text-xl font-display font-black text-white italic tracking-tighter uppercase">Nouveau <span className="text-neon-orange">Message</span></h3>
                                <button onClick={() => setIsComposing(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSendEmail} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-[80px_1fr] items-center gap-4">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">À :</span>
                                        <input
                                            required
                                            type="email"
                                            value={composeData.to}
                                            onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-neon-orange transition-all text-sm font-medium"
                                            placeholder="destinataire@exemple.com"
                                        />
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] items-center gap-4">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Objet :</span>
                                        <input
                                            required
                                            type="text"
                                            value={composeData.subject}
                                            onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-neon-orange transition-all text-sm font-medium"
                                            placeholder="Sujet de votre message..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <textarea
                                        required
                                        rows={12}
                                        value={composeData.content}
                                        onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-white outline-none focus:border-neon-orange transition-all text-sm font-medium resize-none leading-relaxed"
                                        placeholder="Écrivez votre message ici..."
                                    />

                                    {/* Preview Signature in Compose */}
                                    <EmailSignature password={savedPassword} />
                                </div>

                                <div className="flex justify-end gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsComposing(false)}
                                        className="px-8 py-3.5 bg-white/5 text-gray-400 rounded-xl text-[11px] font-black uppercase tracking-widest hover:text-white transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSending}
                                        className={`px-10 py-3.5 bg-neon-orange text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-neon-orange/20 flex items-center gap-3 hover:scale-105 transition-all active:scale-95 ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isSending ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Envoyer
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
