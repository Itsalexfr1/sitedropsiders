import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Trash2, Reply, Send, X, User, Clock, MessageSquare, CheckCircle, AlertCircle, Inbox, Plus, Archive, FileText, Video } from 'lucide-react';
import { getAuthHeaders, isSuperAdmin } from '../utils/auth';
import editorsData from '../data/editors.json';

const EDITOR_COLORS = ['#FF1241', '#00FFFF', '#BF00FF', '#39FF14', '#FFF01F', '#FF5E00', '#E91E63', '#2196F3', '#FF9800', '#4CAF50'];

const getEditorColor = (username: string) => {
    const normalized = username.toLowerCase();
    if (normalized === 'alex') return '#FF1241';
    if (normalized === 'tanguy') return '#00FFFF';
    if (normalized === 'julien') return '#BF00FF';
    if (normalized === 'tiffany') return '#39FF14';
    if (normalized === 'kevin') return '#FFF01F';
    if (normalized === 'guiyoome') return '#FF5E00';
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
    }
    return EDITOR_COLORS[Math.abs(hash) % EDITOR_COLORS.length];
};

interface ContactMessage {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    date: string;
    read: boolean;
    replied: boolean;
}

export function AdminMessages() {
    const navigate = useNavigate();
    
    // Permission check
    const storedPermissions = useMemo(() => JSON.parse(localStorage.getItem('admin_permissions') || '[]'), []);
    const adminUser = localStorage.getItem('admin_user');
    const isAlex = isSuperAdmin(adminUser);
    const canAccess = isAlex || storedPermissions.includes('all') || storedPermissions.includes('messages');

    useEffect(() => {
        if (!canAccess) {
            navigate('/admin');
        }
    }, [canAccess, navigate]);

    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [selected, setSelected] = useState<ContactMessage | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyModal, setReplyModal] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [replyStatus, setReplyStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [replyError, setReplyError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [mailboxTab, setMailboxTab] = useState<'inbox' | 'sent'>('inbox');
    const [sentMessages, setSentMessages] = useState<{ id: string; to: string; subject: string; body: string; date: string; signer: string }[]>(() => {
        try { return JSON.parse(localStorage.getItem('dropsiders_sent_messages') || '[]'); } catch { return []; }
    });

    // New States for Custom Emails
    const [isNewMail, setIsNewMail] = useState(false);
    const [destinationEmails, setDestinationEmails] = useState(['']);
    const [senderEmail, setSenderEmail] = useState('contact@dropsiders.fr');
    const [mailSubject, setMailSubject] = useState('');
    const [signatureName, setSignatureName] = useState('');

    // Accreditation Request States
    const [isAccreditationMode, setIsAccreditationMode] = useState(false);
    const [festivalName, setFestivalName] = useState('');
    const [festivalDates, setFestivalDates] = useState('');
    const [accreditationLang, setAccreditationLang] = useState<'FR' | 'EN'>('FR');

    // Photo Accreditation States
    const [isPhotoAccreditationMode, setIsPhotoAccreditationMode] = useState(false);
    const [photoFirstName, setPhotoFirstName] = useState('');
    const [photoLastName, setPhotoLastName] = useState('');
    const [photoPortfolio, setPhotoPortfolio] = useState('');

    // Interview Request States
    const [isInterviewMode, setIsInterviewMode] = useState(false);
    const [djName, setDjName] = useState('');
    const [interviewType, setInterviewType] = useState<'Vidéo' | 'Écrite'>('Vidéo');

    const showNotif = (type: 'success' | 'error', msg: string) => {
        setNotification({ type, msg });
        setTimeout(() => setNotification(null), 4000);
    };

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/contacts', { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setMessages(Array.isArray(data) ? data.reverse() : []);
            }
        } catch (e: any) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchMessages();
    }, []);

    const openMessage = async (msg: ContactMessage) => {
        setSelected(msg);
        if (!msg.read) {
            await fetch('/api/contacts/read', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id: msg.id })
            });
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
        }
    };

    const handleDelete = async (id: string) => {
        await fetch('/api/contacts/delete', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id })
        });
        setMessages(prev => prev.filter(m => m.id !== id));
        if (selected?.id === id) setSelected(null);
        setDeleteConfirm(null);
        showNotif('success', 'Message supprimé.');
    };

    const handleReply = async () => {
        const to = isNewMail ? destinationEmails.map(e => e.trim()).filter(Boolean).join(',') : selected?.email;
        if (!to || !replyBody.trim()) return;

        setReplyStatus('sending');
        try {
            const res = await fetch('/api/contacts/reply', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    to: to,
                    from: senderEmail,
                    name: isNewMail ? 'Partenaire' : selected?.name,
                    subject: isNewMail ? mailSubject : `Re: ${selected?.subject}`,
                    message: replyBody,
                    lang: accreditationLang
                })
            });

            // Send copy to contact@dropsiders.fr if the sender is not contact@dropsiders.fr
            if (res.ok && senderEmail !== 'contact@dropsiders.fr') {
                fetch('/api/contacts/reply', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        to: 'contact@dropsiders.fr',
                        from: senderEmail,
                        name: `[COPIE] ${isNewMail ? 'Partenaire' : selected?.name}`,
                        subject: `[COPIE] ${isNewMail ? mailSubject : `Re: ${selected?.subject}`}`,
                        message: `--- COPIE DU MESSAGE ENVOYÉ À: ${to} ---\n\n${replyBody}`
                    })
                }).catch(err => console.error("Copy to admin failed", err));
            }

            if (res.ok) {
                setReplyStatus('success');
                setReplyBody('');
                // Archive in sent box
                const sent = {
                    id: Date.now().toString(),
                    to: to,
                    subject: isNewMail ? mailSubject : `Re: ${selected?.subject}`,
                    body: replyBody,
                    date: new Date().toISOString(),
                    signer: signatureName || 'Dropsiders'
                };
                setSentMessages(prev => {
                    const next = [sent, ...prev];
                    localStorage.setItem('dropsiders_sent_messages', JSON.stringify(next));
                    return next;
                });
                if (selected && !isNewMail) {
                    setMessages(prev => prev.map(m => m.id === selected.id ? { ...m, replied: true } : m));
                    setSelected(prev => prev ? { ...prev, replied: true } : prev);
                }
                setTimeout(() => { setReplyModal(false); setReplyStatus('idle'); }, 1500);
                showNotif('success', `Message envoyé à ${to} !`);
            } else {
                const err = await res.json().catch(() => ({}));
                setReplyError(err.error || 'Erreur lors de l\'envoi');
                setReplyStatus('error');
            }
        } catch (e: any) {
            setReplyError(e.message);
            setReplyStatus('error');
        }
    };

    const getPressReleaseTemplate = (lang: 'FR' | 'EN', name: string) => {
        if (lang === 'FR') {
            return `Bonjour,

Dropsiders V2 est enfin là ! 🎙️ 

Nous lançons notre nouvelle plateforme interactive et nous souhaiterions collaborer avec vous pour mettre en avant vos prochains événements via nos nouveaux outils :

- Agenda Interactif complet : Votre événement est déjà listé pour aider notre communauté à planifier ses sorties.

- Système de Concours Blind Test : Un outil exclusif où nos lecteurs jouent sur votre programmation et partagent leurs scores en Story Instagram en vous identifiant pour valider leur participation.

- Live Takeover : Un chat interactif activé directement sur notre page d'accueil lors des grands directs.

Nous sommes à votre disposition pour discuter d'une mise en avant de votre actualité.

${name ? name + '\n' : ''}L'équipe Dropsiders.`;
        } else {
            return `Hello,

Dropsiders V2 is finally here! 🎙️ 

We are launching our new interactive platform and we would like to collaborate with you to highlight your upcoming events using our new tools:

- Complete Interactive Agenda: Your event is already listed to help our community plan their trips.

- Blind Test Contest System: An exclusive tool where our readers play based on your lineup and share their scores on Instagram Story, tagging you to validate their entry.

- Live Takeover: An interactive chat activated directly on our homepage during major broadcasts.

We are at your disposal to discuss highlighting your news.

${name ? name + '\n' : ''}The Dropsiders Team.`;
        }
    };

    const getAccreditationTemplate = (lang: 'FR' | 'EN', festival: string, dates: string, name: string) => {
        const festivalUpper = (festival || '[NOM DU FESTIVAL]').toUpperCase();
        const datesUpper = (dates || '[DATES]').toUpperCase();
        const year = new Date().getFullYear();

        if (lang === 'FR') {
            return `Bonjour,

Je me permets de vous contacter au nom de DROPSIDERS, média de référence dédié à la culture électronique, afin de solliciter une accréditation presse pour l'édition ${year} de **${festivalUpper}**.

Après avoir couvert des événements mondiaux comme Tomorrowland, EDC Las Vegas ou l'Ultra Europe, nous souhaiterions cette année mettre notre expertise et nos nouveaux outils interactifs au service de **${festivalUpper}** prévu du **${datesUpper}**.

Pourquoi collaborer avec nous ? Nous activons un dispositif digital global et carré pour maximiser la visibilité de votre événement :

1. Visibilité Multi-Plateforme (Agenda & Communauté) : Votre festival bénéficie déjà d'une mise en avant sur notre Agenda (https://dropsiders.fr/agenda). De plus, nous avons intégré **${festivalUpper}** dans notre nouvel espace "Communauté" : nos utilisateurs peuvent désormais voter, partager leurs photos et laisser des avis détaillés, créant ainsi une base de données sociale précieuse pour votre promotion.

2. Le Concours Blind Test (Levier de Viralité) : Pour booster l'engagement, nos lecteurs participent à un quiz dédié à votre programmation et partagent obligatoirement leur score en Story Instagram en identifiant **votre compte officiel** et @dropsiders.fr. Cela génère un flux massif de mentions organiques authentiques.

3. Proposition de Partenariat & Échange : En échange de 1 ou 2 pass presse, nous vous proposons un pack de couverture complet :
   - Organisation du jeu concours pour faire gagner des invitations à notre communauté.
   - Relais massifs en Stories (Teasing & Live-report sur place).
   - Articles dédiés et interviews exclusifs sur notre plateforme.
   - Posts permanents sur nos réseaux sociaux pour une visibilité sur le long terme.

Nous serions ravis d'activer ce dispositif "carré" pour mettre en lumière l'édition ${year} de **${festivalUpper}**.

Dans l'attente de votre retour pour en discuter,

${name ? name + '\n' : ''}L'équipe Dropsiders.`;
        } else {
            return `Hello,

I am contacting you on behalf of DROPSIDERS, a leading media dedicated to electronic culture, to request press accreditation for the ${year} edition of **${festivalUpper}**.

Having covered global events such as Tomorrowland, EDC Las Vegas, and Ultra Europe, we would like to bring our expertise and new interactive tools to **${festivalUpper}** scheduled from **${datesUpper}**.

Why collaborate with us? We activate a comprehensive and professional digital package to maximize your event's visibility:

1. Multi-Platform Visibility (Agenda & Community): Your festival is already featured on our Agenda (https://dropsiders.fr/agenda). Additionally, we have integrated **${festivalUpper}** into our new "Community" hub: our users can now vote, share their photos, and leave detailed reviews, creating a valuable social proof database for your promotion.

2. Blind Test Contest (Virality Lever): To boost engagement, our readers complete a quiz dedicated to your lineup and must share their score on Instagram Story, tagging your official account and @dropsiders.fr. This generates a massive flow of authentic organic mentions.

3. Partnership & Exchange Proposal: In exchange for 1 or 2 press passes, we offer a full coverage pack:
   - Hosting a giveaway contest for our community.
   - Massive Story coverage (Pre-event teasing & On-site live reporting).
   - Dedicated articles and exclusive interviews on our platform.
   - Permanent posts on our social networks for long-term visibility.

We would be delighted to activate this professional package to highlight the ${year} edition of **${festivalUpper}**.

Looking forward to hearing from you to discuss this,

${name ? name + '\n' : ''}The Dropsiders Team.`;
        }
    };

    const getPhotoAccreditationTemplate = (lang: 'FR' | 'EN', festival: string, dates: string, firstName: string, lastName: string, portfolio: string, name: string) => {
        const festivalUpper = (festival || '[NOM DU FESTIVAL]').toUpperCase();
        const datesUpper = (dates || '[DATES]').toUpperCase();
        const year = new Date().getFullYear();

        if (lang === 'FR') {
            return `Bonjour,

Dropsiders souhaite solliciter une accréditation photo pour l'édition ${year} de **${festivalUpper}** prévue du **${datesUpper}**.

Photographe délégué : ${firstName || '[PRÉNOM]'} ${lastName || '[NOM]'}
Portfolio : ${portfolio || '[LIEN PORTFOLIO]'}

En échange de nos accès, nous proposons un pack de visibilité "carré" incluant :
- Mise en avant sur notre Agenda et espace Communauté (Votes, Avis, Photos).
- Organisation d'un Concours Blind Test (invitations à gagner pour notre communauté via Story Instagram).
- Couverture complète en Stories, Articles et Posts permanents.
- Mentions organiques massives pour votre compte via le partage des scores.

Dans l'attente de votre retour,
${name ? name + '\n' : ''}L'équipe Dropsiders.`;
        } else {
            return `Hello,

Dropsiders would like to request photo accreditation for the ${year} edition of **${festivalUpper}** scheduled from **${datesUpper}**.

Delegated Photographer: ${firstName || '[FIRST NAME]'} ${lastName || '[LAST NAME]'}
Portfolio: ${portfolio || '[PORTFOLIO LINK]'}

In exchange for our access, we propose a professional visibility package including:
- Featured placement on our Agenda and Community hub (Votes, Reviews, Photos).
- Blind Test Contest hosting (ticket giveaways for our community via Instagram Story).
- Full coverage in Stories, Articles and permanent Posts.
- Massive organic mentions for your account via score sharing.

Looking forward to hearing from you,
${name ? name + '\n' : ''}The Dropsiders Team.`;
        }
    };

    const getInterviewTemplate = (lang: 'FR' | 'EN', dj: string, type: string, name: string) => {
        if (lang === 'FR') {
            return `Bonjour,

Dropsiders est un média immersif de référence dédié à la culture électronique. Nous souhaiterions vous proposer une interview exclusive pour mettre en avant l'artiste :

ARTISTE : ${dj || "[NOM DE L'ARTISTE]"}
FORMAT : Interview ${type}

Travailler avec Dropsiders, c'est bénéficier d'une vitrine premium et "carrée" :
- Articles interactifs haute performance (lecteur audio IA, design immersif).
- Visibilité accrue via notre Agenda et notre nouvel espace Communauté (Votes, Avis).
- Promotion ciblée sur nos réseaux sociaux (Instagram, TikTok).
- Audience de passionnés et de professionnels ultra-engagés.

Nous serions ravis de collaborer pour mettre en lumière l'actualité de votre artiste.

Dans l'attente de votre retour,
${name ? name + '\n' : ''}L'équipe Dropsiders.`;
        } else {
            return `Hello,

Dropsiders is a leading immersive media dedicated to electronic culture. We would like to propose an exclusive interview to highlight the artist:

ARTIST: ${dj || "[ARTIST NAME]"}
FORMAT: ${type} Interview

Partnering with Dropsiders means benefiting from a premium and professional showcase:
- High-performance interactive articles (AI audio player, immersive design).
- Increased visibility through our Agenda and our new Community hub (Votes, Reviews).
- Targeted promotion on our social networks (Instagram, TikTok).
- Highly engaged audience of fans and industry professionals.

We would be delighted to collaborate to highlight your artist's latest news.

Looking forward to hearing from you,
${name ? name + '\n' : ''}The Dropsiders Team.`;
        }
    };

    useEffect(() => {
        if (!isNewMail) return;

        const currentName = signatureName;

        if (isAccreditationMode) {
            setReplyBody(getAccreditationTemplate(accreditationLang, festivalName, festivalDates, currentName));
            const festivalPart = festivalName ? ` - ${festivalName.toUpperCase()}` : '';
            if (accreditationLang === 'FR') {
                setMailSubject(`DEMANDE ACCRÉDITATION MÉDIA${festivalPart} - DROPSIDERS`);
            } else {
                setMailSubject(`MEDIA ACCREDITATION REQUEST${festivalPart} - DROPSIDERS`);
            }
        } else if (isPhotoAccreditationMode) {
            setReplyBody(getPhotoAccreditationTemplate(accreditationLang, festivalName, festivalDates, photoFirstName, photoLastName, photoPortfolio, currentName));
            const festivalPart = festivalName ? ` - ${festivalName.toUpperCase()}` : '';
            if (accreditationLang === 'FR') {
                setMailSubject(`DEMANDE ACCRÉDITATION PHOTO${festivalPart} - DROPSIDERS`);
            } else {
                setMailSubject(`PHOTO ACCREDITATION REQUEST${festivalPart} - DROPSIDERS`);
            }
        } else if (isInterviewMode) {
            setReplyBody(getInterviewTemplate(accreditationLang, djName, interviewType, currentName));
            const djPart = djName ? ` - ${djName.toUpperCase()}` : '';
            if (accreditationLang === 'FR') {
                setMailSubject(`DEMANDE INTERVIEW ${interviewType.toUpperCase()}${djPart} - DROPSIDERS`);
            } else {
                const typeEN = interviewType === 'Vidéo' ? 'VIDEO' : 'WRITTEN';
                setMailSubject(`${typeEN} INTERVIEW REQUEST${djPart} - DROPSIDERS`);
            }
        } else {
            // Standard press release
            setReplyBody(getPressReleaseTemplate(accreditationLang, currentName));
            if (accreditationLang === 'FR') {
                setMailSubject('Dropsiders V2 : Nouvelle plateforme média & agenda interactif ! 🎙️');
            } else {
                setMailSubject('Dropsiders V2: New media platform & interactive agenda! 🎙️');
            }
        }
    }, [isAccreditationMode, isPhotoAccreditationMode, isInterviewMode, festivalName, festivalDates, photoFirstName, photoLastName, photoPortfolio, djName, interviewType, accreditationLang, isNewMail, signatureName]);

    const unreadCount = messages.filter(m => !m.read).length;

    const getSubjectColor = (subject: string) => {
        const s = subject.toLowerCase();
        if (s.includes('question')) return 'text-neon-cyan border-neon-cyan/20 bg-neon-cyan/5';
        if (s.includes('suggestion')) return 'text-neon-green border-neon-green/20 bg-neon-green/5';
        if (s.includes('partenariat')) return 'text-neon-purple border-neon-purple/20 bg-neon-purple/5';
        if (s.includes('recrutement')) return 'text-neon-orange border-neon-orange/20 bg-neon-orange/5';
        return 'text-gray-400 border-white/10 bg-white/5';
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="border-b border-white/5 bg-black/80 backdrop-blur-xl sticky top-0 z-30">
                <div className="max-w-full mx-auto px-4 md:px-12 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/admin" className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-white group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-neon-red/10 rounded-xl border border-neon-red/20">
                                <Inbox className="w-5 h-5 text-neon-red" />
                            </div>
                            <div>
                                <h1 className="text-lg md:text-xl font-display font-black uppercase italic tracking-tight text-white leading-tight">
                                    MESSAGERIE <span className="text-neon-red">& CONTACTS</span>
                                </h1>
                                <p className="text-gray-500 text-xs">{messages.length} messages · {unreadCount} non lus</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setIsNewMail(true);
                                setDestinationEmails(['']);
                                setSenderEmail('contact@dropsiders.fr');
                                setSignatureName('');
                                setMailSubject('Dropsiders V2 : Nouvelle plateforme média & agenda interactif ! 🎙️');
                                setIsAccreditationMode(false);
                                setIsPhotoAccreditationMode(false);
                                setIsInterviewMode(false);
                                setFestivalName('');
                                setFestivalDates('');
                                setPhotoFirstName('');
                                setPhotoLastName('');
                                setPhotoPortfolio('');
                                setDjName('');
                                setReplyBody(getPressReleaseTemplate('FR', ''));
                                setReplyModal(true);
                            }}
                            className="flex-1 md:flex-none justify-center px-4 py-2 bg-neon-red/10 border border-neon-red/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neon-red text-white transition-all flex items-center gap-2 group shadow-lg shadow-neon-red/10"
                        >
                            <Send className="w-3 h-3" />
                            <span className="hidden sm:inline">Nouveau Message</span>
                            <span className="sm:hidden">Nouveau</span>
                        </button>
                        <a
                            href="https://mail.dropsiders.fr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 md:flex-none justify-center px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 group"
                        >
                            <Mail className="w-3 h-3 text-neon-red" />
                            <span className="hidden sm:inline">Accès Messagerie Pro</span>
                            <span className="sm:hidden">Pro</span>
                        </a>
                        {unreadCount > 0 && (
                            <div className="hidden lg:block px-3 py-1 bg-neon-red rounded-full text-white text-[9px] font-black uppercase tracking-tight">
                                {unreadCount} NOUVEAU{unreadCount > 1 ? 'X' : ''}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Notification toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className={`fixed top-20 left-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-2xl ${notification.type === 'success'
                            ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                            : 'bg-neon-red/20 border border-neon-red/30 text-neon-red'
                            }`}
                    >
                        {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {notification.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`max-w-full mx-auto flex h-[calc(100vh-65px)] px-0 md:px-12`}>
                {/* LEFT: Message List */}
                <div className={`${selected ? 'hidden md:flex' : 'flex'} w-full md:w-96 border-r border-white/5 flex-shrink-0 flex-col bg-white/[0.015]`}>
                    {/* Inbox / Sent tabs */}
                    <div className="flex border-b border-white/5 shrink-0">
                        <button onClick={() => setMailboxTab('inbox')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${mailboxTab === 'inbox' ? 'text-white border-b-2 border-neon-red' : 'text-gray-600 hover:text-white'}`}>
                            <Inbox className="w-3.5 h-3.5" /> Reçus <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${unreadCount > 0 ? 'bg-neon-red text-white' : 'bg-white/10 text-gray-500'}`}>{messages.length}</span>
                        </button>
                        <button onClick={() => setMailboxTab('sent')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${mailboxTab === 'sent' ? 'text-white border-b-2 border-neon-cyan' : 'text-gray-600 hover:text-white'}`}>
                            <Archive className="w-3.5 h-3.5" /> Envoyés <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-white/10 text-gray-500">{sentMessages.length}</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-48 text-gray-600">
                                <div className="animate-spin w-6 h-6 border-2 border-neon-red border-t-transparent rounded-full" />
                            </div>
                        ) : mailboxTab === 'sent' ? (
                            sentMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-600">
                                    <Archive className="w-12 h-12 opacity-20" />
                                    <p className="text-sm font-bold uppercase tracking-widest">Aucun message envoyé</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {sentMessages.map(msg => (
                                        <div key={msg.id} className="p-4 hover:bg-white/5 transition-all cursor-default">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-black text-neon-cyan uppercase truncate">{msg.to}</span>
                                                <span className="text-[9px] text-gray-600 flex-shrink-0 ml-2">{new Date(msg.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                                            </div>
                                            <p className="text-sm font-bold text-white/70 truncate">{msg.subject}</p>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{msg.body.slice(0, 60)}...</p>
                                            <span className="text-[9px] text-gray-600 mt-1 block">Signataire : {msg.signer}</span>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-600">
                                <MessageSquare className="w-12 h-12 opacity-20" />
                                <p className="text-sm font-bold uppercase tracking-widest">Aucun message</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {messages.map(msg => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={() => openMessage(msg)}
                                        className={`p-4 cursor-pointer transition-all hover:bg-white/5 relative ${selected?.id === msg.id ? 'bg-white/5 border-l-2 border-neon-red' : 'border-l-2 border-transparent'}`}
                                    >
                                        {!msg.read && (
                                            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-neon-red" />
                                        )}
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${msg.read ? 'bg-white/5 text-gray-500' : 'bg-neon-red/20 text-neon-red'}`}>
                                                {msg.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className={`text-sm truncate ${msg.read ? 'text-gray-400 font-medium' : 'text-white font-black'}`}>{msg.name}</span>
                                                    <span className="text-[10px] text-gray-600 flex-shrink-0">{new Date(msg.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border truncate max-w-full block md:inline ${getSubjectColor(msg.subject)}`}>
                                                        {msg.subject}
                                                    </span>
                                                </div>
                                                <p className={`text-xs md:text-sm truncate mt-2 font-medium ${msg.read ? 'text-white/40' : 'text-white/80'}`}>{msg.message}</p>
                                                {msg.replied && (
                                                    <span className="inline-flex items-center gap-1 text-[9px] uppercase font-black text-neon-cyan/70 mt-1">
                                                        <Reply className="w-3 h-3" /> Répondu
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Message Detail */}
                <div className={`${selected ? 'flex' : 'hidden md:flex'} flex-1 overflow-y-auto flex-col bg-white/[0.04] border-l border-white/5`}>
                    {selected ? (
                        <motion.div
                            key={selected.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 md:p-8 max-w-full"
                        >
                            {/* Mobile Back Button */}
                            <button
                                onClick={() => setSelected(null)}
                                className="md:hidden flex items-center gap-2 text-neon-cyan hover:text-white mb-6 p-2 bg-neon-cyan/5 border border-neon-cyan/10 rounded-xl uppercase text-[10px] font-black tracking-widest transition-all active:scale-95 w-fit"
                            >
                                <ArrowLeft className="w-4 h-4" /> Retour à la liste
                            </button>
                            {/* Message Header */}
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-8 gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getSubjectColor(selected.subject)}`}>
                                            {selected.subject}
                                        </span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-display font-black text-white italic uppercase tracking-tight mb-1">{selected.name}</h2>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5" />
                                            <span className="font-bold text-white">{selected.name}</span>
                                        </div>
                                        <span className="text-gray-700">·</span>
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5" />
                                            <a href={`mailto:${selected.email}`} className="text-neon-cyan hover:underline">{selected.email}</a>
                                        </div>
                                        <span className="text-gray-700">·</span>
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{new Date(selected.date).toLocaleString('fr-FR')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 w-full lg:w-auto">
                                    <button
                                        onClick={() => {
                                            setIsNewMail(false);
                                            const sig = `\n\n\n`;
                                            setReplyBody(sig);
                                            setReplyModal(true);
                                            // Set cursor at beginning
                                            setTimeout(() => {
                                                const textarea = document.querySelector('textarea');
                                                if (textarea) {
                                                    textarea.focus();
                                                    textarea.setSelectionRange(0, 0);
                                                }
                                            }, 100);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-xl hover:bg-neon-cyan/20 transition-all text-xs font-black uppercase"
                                    >
                                        <Reply className="w-4 h-4" />
                                        Répondre
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(selected.id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-red/10 border border-neon-red/30 text-neon-red rounded-xl hover:bg-neon-red/20 transition-all text-xs font-black uppercase"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Message Body */}
                            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">{selected.message}</p>
                            </div>

                            {selected.replied && (
                                <div className="mt-4 flex items-center gap-2 text-neon-cyan/60 text-xs font-bold">
                                    <Reply className="w-4 h-4" />
                                    Vous avez déjà répondu à ce message.
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-700">
                            <Mail className="w-16 h-16 opacity-10" />
                            <p className="text-sm font-bold uppercase tracking-widest">Sélectionnez un message</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Reply / New Message Modal */}
            <AnimatePresence>
                {replyModal && (isNewMail || selected) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { setReplyModal(false); setReplyStatus('idle'); }}
                        className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#111] border border-white/10 rounded-2xl md:rounded-[2rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh]"
                        >
                            {/* Sticky Header */}
                            <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between bg-[#111] shrink-0">
                                <h3 className="text-base md:text-lg font-black uppercase italic tracking-tight text-white line-clamp-1">
                                    {isNewMail ? 'NOUVEAU MESSAGE' : `Répondre à ${selected?.name}`}
                                </h3>
                                <button onClick={() => { setReplyModal(false); setReplyStatus('idle'); }} className="p-2 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-colors flex-shrink-0 ml-2">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        {isNewMail && (
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-start gap-3 w-full">
                                                    <span className="text-[10px] font-black uppercase text-gray-500 w-24 mt-2 flex-shrink-0">Destinataires :</span>
                                                    <div className="flex-1 flex flex-col gap-2">
                                                        {destinationEmails.map((email, i) => (
                                                            <div key={i} className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={email}
                                                                    onChange={(e) => {
                                                                        const newEmails = [...destinationEmails];
                                                                        newEmails[i] = e.target.value;
                                                                        setDestinationEmails(newEmails);
                                                                    }}
                                                                    placeholder="email@partenaire.com"
                                                                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-neon-cyan focus:outline-none focus:border-neon-cyan/50 flex-1"
                                                                />
                                                                {destinationEmails.length > 1 && (
                                                                    <button
                                                                        onClick={() => setDestinationEmails(destinationEmails.filter((_, index) => index !== i))}
                                                                        className="p-1.5 bg-white/5 border border-white/10 rounded-lg hover:border-neon-red hover:text-neon-red text-gray-400 transition-all flex-shrink-0"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => setDestinationEmails([...destinationEmails, ''])}
                                                            className="self-start mt-1 px-3 py-1 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 hover:border-white/20 transition-all text-[9px] font-black uppercase flex items-center gap-1"
                                                        >
                                                            <Plus className="w-3 h-3" /> Ajouter un mail
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase text-gray-500 w-24">Expéditeur :</span>
                                            <input
                                                type="text"
                                                value={senderEmail}
                                                onChange={(e) => setSenderEmail(e.target.value)}
                                                placeholder="contact@dropsiders.fr"
                                                className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-neon-red focus:outline-none focus:border-neon-red/50 flex-1 font-bold"
                                            />
                                        </div>
                                        {isNewMail && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black uppercase text-gray-500 w-24">Objet :</span>
                                                <input
                                                    type="text"
                                                    value={mailSubject}
                                                    onChange={(e) => setMailSubject(e.target.value)}
                                                    placeholder="Sujet du mail"
                                                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/20 flex-1 font-bold"
                                                />
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-2">
                                                <User className="w-3 h-3" /> Signé par : <span className="text-neon-red">*</span>
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {(editorsData as any[]).map((editor: any) => {
                                                    const editorColor = getEditorColor(editor.username.toLowerCase());
                                                    const isSelected = signatureName === editor.name;
                                                    return (
                                                        <button
                                                            key={editor.username}
                                                            type="button"
                                                            onClick={() => setSignatureName(editor.name)}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${isSelected
                                                                ? 'text-black shadow-lg'
                                                                : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                                                                }`}
                                                            style={isSelected ? {
                                                                backgroundColor: editorColor,
                                                                borderColor: editorColor,
                                                                boxShadow: `0 0 15px ${editorColor}40`
                                                            } : {}}
                                                        >
                                                            <div
                                                                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black"
                                                                style={{
                                                                    backgroundColor: isSelected ? 'rgba(0,0,0,0.3)' : `${editorColor}20`,
                                                                    color: isSelected ? 'black' : editorColor
                                                                }}
                                                            >
                                                                {editor.name.charAt(0)}
                                                            </div>
                                                            {editor.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {!signatureName && (
                                                <span className="text-[9px] text-neon-red/70 font-bold uppercase tracking-widest animate-pulse">
                                                    ⚠ Sélectionnez un éditeur pour envoyer
                                                </span>
                                            )}
                                        </div>
                                        {!isNewMail && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black uppercase text-gray-500 w-24">Répondre à :</span>
                                                <span className="text-neon-cyan text-sm flex-1">{selected?.email}</span>
                                            </div>
                                        )}
                                    </div>

                                    {isNewMail && (
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => {
                                                    setIsAccreditationMode(false);
                                                    setIsPhotoAccreditationMode(false);
                                                    setIsInterviewMode(false);
                                                    setReplyBody('');
                                                    setMailSubject('');
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-1.5 ${(!isAccreditationMode && !isPhotoAccreditationMode && !isInterviewMode && !replyBody) ? 'bg-white/20 border-white/40 text-white' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}
                                            >
                                                <FileText className="w-3 h-3" /> Mail Vide
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsAccreditationMode(false);
                                                    setIsPhotoAccreditationMode(false);
                                                    setIsInterviewMode(false);
                                                    setReplyBody(getPressReleaseTemplate(accreditationLang, signatureName));
                                                    if (accreditationLang === 'FR') {
                                                        setMailSubject('Dropsiders V2 : Nouvelle plateforme média & agenda interactif ! 🎙️');
                                                    } else {
                                                        setMailSubject('Dropsiders V2: New media platform & interactive agenda! 🎙️');
                                                    }
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${(!isAccreditationMode && !isPhotoAccreditationMode && !isInterviewMode && replyBody) ? 'bg-neon-cyan border-neon-cyan text-black' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}
                                            >
                                                Communiqué Standard
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsAccreditationMode(true);
                                                    setIsPhotoAccreditationMode(false);
                                                    setIsInterviewMode(false);
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${isAccreditationMode ? 'bg-neon-purple border-neon-purple text-white shadow-[0_0_15px_rgba(191,0,255,0.3)]' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}
                                            >
                                                Demande Accréditation
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsPhotoAccreditationMode(true);
                                                    setIsAccreditationMode(false);
                                                    setIsInterviewMode(false);
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${isPhotoAccreditationMode ? 'bg-neon-blue border-neon-blue text-white shadow-[0_0_15px_rgba(0,191,255,0.3)]' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}
                                            >
                                                Accréditation Photo
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsInterviewMode(true);
                                                    setIsAccreditationMode(false);
                                                    setIsPhotoAccreditationMode(false);
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-1.5 ${isInterviewMode ? 'bg-neon-red border-neon-red text-white shadow-[0_0_15px_rgba(255,18,65,0.3)]' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}
                                            >
                                                <Video className="w-3 h-3" /> Demande Interview
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                                            Langue :
                                        </span>
                                        <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                                            <button
                                                onClick={() => setAccreditationLang('FR')}
                                                className={`px-3 py-1 text-[9px] font-black rounded-md transition-all ${accreditationLang === 'FR' ? 'bg-neon-red text-white' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                FR
                                            </button>
                                            <button
                                                onClick={() => setAccreditationLang('EN')}
                                                className={`px-3 py-1 text-[9px] font-black rounded-md transition-all ${accreditationLang === 'EN' ? 'bg-neon-red text-white' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                EN
                                            </button>
                                        </div>
                                    </div>

                                    {isNewMail && (isAccreditationMode || isPhotoAccreditationMode || isInterviewMode) && (
                                        <div className={`p-4 border rounded-2xl space-y-4 ${isAccreditationMode ? 'bg-neon-purple/5 border-neon-purple/20' : isPhotoAccreditationMode ? 'bg-neon-blue/5 border-neon-blue/20' : 'bg-neon-red/5 border-neon-red/20'}`}>
                                            {(isAccreditationMode || isPhotoAccreditationMode) ? (
                                                <>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Festival</label>
                                                            <input
                                                                type="text"
                                                                value={festivalName}
                                                                onChange={(e) => setFestivalName(e.target.value)}
                                                                className={`w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none ${isPhotoAccreditationMode ? 'focus:border-neon-blue' : 'focus:border-neon-purple'}`}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Dates</label>
                                                            <input
                                                                type="text"
                                                                value={festivalDates}
                                                                onChange={(e) => setFestivalDates(e.target.value)}
                                                                className={`w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none ${isPhotoAccreditationMode ? 'focus:border-neon-blue' : 'focus:border-neon-purple'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                    {isPhotoAccreditationMode && (
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Nom</label>
                                                                <input
                                                                    type="text"
                                                                    value={photoLastName}
                                                                    onChange={(e) => setPhotoLastName(e.target.value)}
                                                                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-neon-blue"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Prénom</label>
                                                                <input
                                                                    type="text"
                                                                    value={photoFirstName}
                                                                    onChange={(e) => setPhotoFirstName(e.target.value)}
                                                                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-neon-blue"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">URL Portfolio</label>
                                                                <input
                                                                    type="text"
                                                                    value={photoPortfolio}
                                                                    onChange={(e) => setPhotoPortfolio(e.target.value)}
                                                                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-neon-blue"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Artiste / DJ</label>
                                                        <input
                                                            type="text"
                                                            value={djName}
                                                            onChange={(e) => setDjName(e.target.value)}
                                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-neon-red"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Format</label>
                                                        <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
                                                            {['Vidéo', 'Écrite'].map((t) => (
                                                                <button
                                                                    key={t}
                                                                    onClick={() => setInterviewType(t as any)}
                                                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${interviewType === t ? 'bg-neon-red text-white' : 'text-gray-500 hover:text-white'}`}
                                                                >
                                                                    {t}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                                        {/* Editor Side */}
                                        <div className="flex-1 space-y-2">
                                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Message</div>
                                            <textarea
                                                value={replyBody}
                                                onChange={(e) => setReplyBody(e.target.value)}
                                                placeholder="Rédigez votre message..."
                                                className="w-full h-[200px] md:h-[350px] bg-black/40 border border-white/10 rounded-2xl p-3 md:p-4 text-white text-sm resize-none focus:outline-none focus:border-neon-cyan transition-all font-mono custom-scrollbar"
                                            />
                                        </div>

                                        {/* Preview Side */}
                                        <div className="flex-1 bg-black/60 border border-white/10 rounded-2xl p-6 hidden md:block">
                                            <div className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] mb-4 text-center">Aperçu</div>
                                            <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl scale-[0.85] origin-top">
                                                <div className="p-6">
                                                    <div className="text-white/80 text-[11px] leading-relaxed whitespace-pre-wrap min-h-[100px]">
                                                        {replyBody || "[Votre message apparaîtra ici]"}
                                                    </div>
                                                    <div className="mt-8 bg-black border border-white/10 border-t-4 border-t-neon-red rounded-xl overflow-hidden p-4">
                                                        <div className="text-white text-[10px] font-black italic uppercase text-center">
                                                            {accreditationLang === 'EN' ? 'Best regards,' : 'Cordialement,'} <br />
                                                            {signatureName && <span className="text-gray-400 block mb-1 text-[9px] normal-case">{signatureName}</span>}
                                                            {accreditationLang === 'EN' ? 'The ' : 'L\'équipe '} <span className="text-neon-red">Dropsiders</span>{accreditationLang === 'EN' ? ' Team' : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {replyStatus === 'error' && <p className="text-neon-red text-xs font-bold text-center">⚠ {replyError}</p>}
                                </div>
                            </div>

                            {/* Sticky Footer */}
                            <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-[#111] shrink-0">
                                <button
                                    onClick={() => { setReplyModal(false); setReplyStatus('idle'); }}
                                    className="px-6 py-2.5 bg-white/5 text-gray-400 font-bold uppercase rounded-xl hover:bg-white/10 text-[10px]"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleReply}
                                    disabled={replyStatus === 'sending' || replyStatus === 'success' || !replyBody.trim() || (isNewMail && !signatureName)}
                                    className="px-8 py-2.5 bg-gradient-to-r from-neon-cyan to-neon-blue text-black font-black uppercase rounded-xl hover:opacity-90 transition-all flex items-center gap-2 text-[10px] disabled:opacity-50"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    {replyStatus === 'sending' ? 'Envoi...' : 'Envoyer via Brevo'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirm Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-[#111] border border-white/10 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl"
                        >
                            <div className="p-4 bg-neon-red/10 rounded-full border border-neon-red/20 inline-flex mb-4">
                                <Trash2 className="w-6 h-6 text-neon-red" />
                            </div>
                            <h3 className="text-lg font-black uppercase italic mb-2">Supprimer ce message ?</h3>
                            <p className="text-gray-500 text-sm mb-6">Cette action est irréversible.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-white/5 rounded-xl text-sm font-bold hover:bg-white/10">Annuler</button>
                                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-neon-red rounded-xl text-white text-sm font-black hover:bg-neon-red/80">Supprimer</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}

export default AdminMessages;
