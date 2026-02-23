import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail,
    Inbox,
    Send,
    Trash2,
    RefreshCcw,
    Search,
    X,
    ChevronRight,
    AlertCircle,
    Archive,
    Star,
    MoreVertical,
    Reply,
    Forward,
    Filter,
    ArrowLeft,
    Calendar,
    User,
    ExternalLink,
    Zap,
    Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Email {
    id: string;
    from: string;
    fromName: string;
    subject: string;
    preview: string;
    content: string;
    date: string;
    read: boolean;
    starred: boolean;
    labels: string[];
}

const EmailSignature = () => (
    <div className="mt-12 pt-8 border-t border-white/10">
        <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-neon-red via-neon-red/80 to-black rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-neon-red/10">
                <span className="text-white font-black italic text-sm tracking-tighter">DS.</span>
            </div>
            <div>
                <p className="text-sm font-black text-white uppercase tracking-widest italic">L'Équipe <span className="text-neon-red">Dropsiders</span></p>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-0.5">Media & Production Festivals</p>
            </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
            <a
                href="https://dropsiders.fr/kitmedia"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 hover:bg-white/10 transition-all"
            >
                <Globe className="w-3.5 h-3.5 text-neon-red" />
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Kit Media 2026</span>
                    <span className="text-[7px] font-bold text-gray-500 uppercase flex items-center gap-1">
                        Code : <span className="text-neon-red font-black">DROPSIDERS</span>
                    </span>
                </div>
            </a>

            <div className="flex items-center gap-3">
                <div className="w-px h-8 bg-white/10"></div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-neon-red shadow-[0_0_5px_red]"></div>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Paris • Ibiza • Las Vegas</span>
                    </div>
                    <p className="text-[8px] font-bold text-gray-600 uppercase tracking-[0.3em]">www.dropsiders.fr</p>
                </div>
            </div>
        </div>
    </div>
);

export function AdminEmails() {
    const navigate = useNavigate();
    const [activeAccount, setActiveAccount] = useState<'alex' | 'contact'>('contact');
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Mock data for initial UI
    const [emails, setEmails] = useState<{ alex: Email[], contact: Email[] }>({
        alex: [
            {
                id: '1',
                from: 'partnership@brands.com',
                fromName: 'Sarah Brandt',
                subject: 'Proposition de partenariat - Festival Summer 2026',
                preview: 'Bonjour Alex, nous avons suivi vos derniers reportages sur les festivals et nous aimerions vous proposer...',
                content: `Bonjour Alex,

Nous avons suivi avec grand intérêt vos derniers reportages sur les festivals, notamment votre couverture de Tomorrowland Winter. Votre style visuel correspond parfaitement à l'image de notre marque.

Nous aimerions vous proposer un partenariat pour le prochain festival Summer 2026. L'idée serait de vous fournir notre nouveau kit média en échange d'une série de photos et d'une mention dans votre prochain récap.

Seriez-vous disponible pour un appel Zoom mardi prochain à 14h ?

Bien cordialement,
Sarah Brandt
Marketing Manager @ Brands.com`,
                date: 'Aujourd\'hui, 14:23',
                read: false,
                starred: true,
                labels: ['Partenariat', 'Urgent']
            }
        ],
        contact: [
            {
                id: '2',
                from: 'jean.dupont@gmail.com',
                fromName: 'Jean Dupont',
                subject: 'Question sur l\'accréditation presse',
                preview: 'Bonjour l\'équipe Dropsiders, je suis photographe freelance et je souhaitais savoir comment...',
                content: `Bonjour l'équipe Dropsiders,

Je suis photographe freelance basé à Lyon et je suis votre travail depuis quelques mois. Je souhaitais savoir quelle est votre procédure pour les demandes d'accréditation presse pour les festivals français ?

Faut-il passer par vous ou directement par les organisateurs ?

Merci d'avance pour votre aide.

Cordialement,
Jean Dupont`,
                date: 'Hier, 10:15',
                read: true,
                starred: false,
                labels: ['Question']
            },
            {
                id: '3',
                from: 'noreply@lws.fr',
                fromName: 'LWS Support',
                subject: 'Renouvellement de votre domaine dropsiders.fr',
                preview: 'Cher client, votre nom de domaine arrive à expiration dans 30 jours. Pour éviter toute interruption...',
                content: `Cher client,

Votre nom de domaine dropsiders.fr arrive à expiration dans 30 jours.

Pour éviter toute interruption de vos services, nous vous invitons à procéder à son renouvellement dès maintenant depuis votre espace client LWS.

Ceci est un message automatique, merci de ne pas y répondre.`,
                date: '22 Fév, 09:00',
                read: true,
                starred: false,
                labels: ['Admin']
            }
        ]
    });

    const handleRefresh = () => {
        setIsRefreshing(true);
        // Simulate API call to LWS IMAP
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1500);
    };

    const filteredEmails = emails[activeAccount].filter(email =>
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.fromName.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Flux d'emails en temps réel • LWS Hosting</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setActiveAccount('contact')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeAccount === 'contact' ? 'bg-neon-orange text-white shadow-[0_0_20px_rgba(255,165,0,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            contact@dropsiders.fr
                        </button>
                        <button
                            onClick={() => setActiveAccount('alex')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeAccount === 'alex' ? 'bg-neon-orange text-white shadow-[0_0_20px_rgba(255,165,0,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            alex@dropsiders.fr
                        </button>
                    </div>
                </div>

                {/* Main Interface */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col md:flex-row min-h-[700px]">

                    {/* Sidebar Navigation */}
                    <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 p-6 space-y-8">
                        <div className="space-y-2">
                            <button className="w-full flex items-center justify-between px-4 py-3 bg-neon-orange/10 border border-neon-orange/20 rounded-xl text-neon-orange group transition-all">
                                <div className="flex items-center gap-3">
                                    <Inbox className="w-4 h-4" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Boîte de réception</span>
                                </div>
                                <span className="bg-neon-orange text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                    {emails[activeAccount].filter(e => !e.read).length}
                                </span>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-white transition-all">
                                <Send className="w-4 h-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Envoyés</span>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-white transition-all">
                                <Archive className="w-4 h-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Archives</span>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-white transition-all">
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

                        <div className="pt-20">
                            <div className="p-4 bg-orange-600/5 rounded-2xl border border-orange-600/10 space-y-3">
                                <div className="flex items-center gap-2 text-neon-orange">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-[9px] font-black uppercase">Statut Serveur</span>
                                </div>
                                <p className="text-[10px] text-gray-500 leading-relaxed">Connecté à <strong>mxb.lws.fr</strong> via IMAP.</p>
                                <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-neon-orange"
                                        animate={{ width: ["0%", "100%", "0%"] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                    />
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
                                            {!email.read && (
                                                <div className="absolute top-7 left-2 w-1.5 h-1.5 bg-neon-orange rounded-full shadow-[0_0_10px_#ffa500]" />
                                            )}
                                            <div className="flex justify-between items-start gap-2 mb-2">
                                                <span className={`text-[11px] font-black uppercase tracking-tight truncate ${!email.read ? 'text-white' : 'text-gray-400'}`}>
                                                    {email.fromName}
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-500 flex-shrink-0">
                                                    {email.date}
                                                </span>
                                            </div>
                                            <h4 className={`text-sm font-bold mb-1 truncate ${!email.read ? 'text-white' : 'text-gray-300'}`}>
                                                {email.subject}
                                            </h4>
                                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                {email.preview}
                                            </p>

                                            <div className="flex gap-2 mt-4">
                                                {email.labels.map(label => (
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
                                                    {selectedEmail.fromName[0]}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-xl font-bold text-white">{selectedEmail.fromName}</h3>
                                                        <span className="text-xs text-gray-500 font-medium">({selectedEmail.from})</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {selectedEmail.date}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                            <User className="w-3.5 h-3.5" />
                                                            à moi
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5">
                                                <button className="p-2.5 text-gray-400 hover:text-white transition-all"><Reply className="w-4 h-4" /></button>
                                                <button className="p-2.5 text-gray-400 hover:text-white transition-all"><Star className={`w-4 h-4 ${selectedEmail.starred ? 'text-yellow-500 fill-yellow-500' : ''}`} /></button>
                                                <button className="p-2.5 text-gray-400 hover:text-neon-red transition-all"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>

                                        <h2 className="text-2xl font-display font-black text-white italic tracking-tight mb-8 leading-tight">
                                            {selectedEmail.subject}
                                        </h2>

                                        <div className="bg-black/20 border border-white/5 rounded-3xl p-8 md:p-10 text-gray-300 leading-relaxed space-y-4 whitespace-pre-wrap font-medium">
                                            {selectedEmail.content}

                                            {/* Ajout automatique de la signature sur les emails sortants ou prévisualisation */}
                                            <EmailSignature />
                                        </div>

                                        <div className="mt-12 flex flex-wrap gap-4">
                                            <button className="px-8 py-3.5 bg-neon-orange text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-neon-orange/20 flex items-center gap-3 hover:scale-105 transition-all active:scale-95">
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

                {/* Technical Footer */}
                <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 px-6 py-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-neon-orange/10 border border-neon-orange/20 flex items-center justify-center">
                            <RefreshCcw className="w-5 h-5 text-neon-orange" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Dernière synchronisation</p>
                            <p className="text-xs text-gray-500">Il y a 2 minutes • IMAP sécurisé TLS</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button className="text-[9px] font-black uppercase tracking-tighter px-4 py-2 border border-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
                            Configuration Serveur
                        </button>
                        <button className="text-[9px] font-black uppercase tracking-tighter px-4 py-2 border border-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
                            Logs de connexion
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
