import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Trash2, Reply, Send, X, User, Clock, MessageSquare, CheckCircle, CheckCircle2, Check, AlertCircle, ShieldAlert, Inbox, Plus, Archive, FileText, Video, Paperclip, ExternalLink, File as FileIcon } from 'lucide-react';
import { getAuthHeaders, isSuperAdmin, apiFetch, hasPermission } from '../utils/auth';

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

const getEditorTabStyle = (id: string, isActive: boolean) => {
    if (!isActive) {
        return {
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.08)'
        };
    }
    
    if (id === 'all') {
        return {
            background: 'linear-gradient(135deg, #ffffff, #a3a3a3)',
            color: '#000000',
            boxShadow: '0 4px 15px rgba(255,255,255,0.2)',
            border: '1px solid #ffffff'
        };
    }
    
    const color = id === 'general' ? '#ff1241' : getEditorColor(id);
    const isLightColor = ['#00ffff', '#39ff14', '#fff01f'].includes(color.toLowerCase());
    
    return {
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        color: isLightColor ? '#000000' : '#ffffff',
        boxShadow: `0 4px 15px ${color}40`,
        border: `1px solid ${color}aa`
    };
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
    recipient?: string;
    attachments?: { name: string; url?: string; size: number }[];
}

const linkify = (text: string) => {
    if (!text) return '';
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    
    const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)/g;
    return escaped.replace(urlRegex, (url) => {
        let cleanUrl = url;
        let trailing = '';
        const match = url.match(/[.,;:!?)]+$/);
        if (match) {
            cleanUrl = url.substring(0, url.length - match[0].length);
            trailing = match[0];
        }
        const href = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-neon-cyan hover:underline break-all" style="text-decoration: underline;">${cleanUrl}</a>`;
    }).replace(/\n/g, '<br>');
};

export function AdminMessages() {
    const navigate = useNavigate();
    
    // Permission check
    const storedPermissions = useMemo(() => JSON.parse(localStorage.getItem('admin_permissions') || '[]'), []);
    const adminUser = localStorage.getItem('admin_user');
    const isAlex = isSuperAdmin(adminUser);
    const canAccess = hasPermission(storedPermissions, 'messages', isAlex);

    useEffect(() => {
        if (!canAccess) {
            navigate('/admin');
        }
    }, [canAccess, navigate]);

    // Messages & Replies
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Editors state for signatures
    const [editors, setEditors] = useState<{name: string; username: string; email?: string}[]>([]);

    useEffect(() => {
        fetchEditors();
    }, []);

    const fetchEditors = async () => {
        try {
            const res = await apiFetch('/api/editors', { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                // Standardize parsing across admin pages (robust handling of array vs object responses)
                let arr = Array.isArray(data) ? data : (data.editors || data.content || []);
                
                // Ensure array contains valid objects
                if (!Array.isArray(arr)) arr = [];
                
                // Filter out any potential invalid data
                arr = arr.filter((e: any) => e && typeof e === 'object');

                // Standardized: Ensure 'Alex' is in the list for the super admin
                const currentAdmin = (localStorage.getItem('admin_name') || localStorage.getItem('admin_user') || 'Alex').toLowerCase();
                const hasAlex = arr.some((e: any) => (e.username || e.name || '').toLowerCase() === 'alex');
                
                if (!hasAlex && (currentAdmin === 'alex' || currentAdmin.includes('alexflex30'))) {
                    arr = [{ email: 'alexflex30@gmail.com', username: 'Alex', name: 'Alex' }, ...arr];
                }

                setEditors(arr);
            }
        } catch(e) {
            console.error("Error fetching editors:", e);
        }
    };

    const [selected, setSelected] = useState<ContactMessage | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyModal, setReplyModal] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [attachments, setAttachments] = useState<{ name: string; type: string; content: string; size: number }[]>([]);
    const [replyStatus, setReplyStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [replyError, setReplyError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [mailboxTab, setMailboxTab] = useState<'inbox' | 'sent' | 'archived'>('inbox');
    const [sentMessages, setSentMessages] = useState<{ id: string; to: string; subject: string; body: string; date: string; signer: string }[]>(() => {
        try { return JSON.parse(localStorage.getItem('dropsiders_sent_messages') || '[]'); } catch { return []; }
    });
    const [archivedMessages, setArchivedMessages] = useState<ContactMessage[]>(() => {
        try { return JSON.parse(localStorage.getItem('dropsiders_archived_messages') || '[]'); } catch { return []; }
    });

    const [selectedSent, setSelectedSent] = useState<{ id: string; to: string; subject: string; body: string; date: string; signer: string } | null>(null);
    const [selectedArchived, setSelectedArchived] = useState<ContactMessage | null>(null);

    // New States for Custom Emails
    const [isNewMail, setIsNewMail] = useState(false);
    const [destinationEmails, setDestinationEmails] = useState(['']);
    const [senderEmail, setSenderEmail] = useState('contact@dropsiders.fr');
    const [mailSubject, setMailSubject] = useState('');
    const [signatureName, setSignatureName] = useState('');

    const [selectedEditorFilter, setSelectedEditorFilter] = useState<string>('all');

    const currentEditor = useMemo(() => {
        if (!adminUser) return null;
        return editors.find(e => 
            (e.username && e.username.toLowerCase() === adminUser.toLowerCase()) || 
            (e.email && e.email.toLowerCase() === adminUser.toLowerCase())
        );
    }, [editors, adminUser]);

    const userProEmail = useMemo(() => {
        if (isAlex) return 'contact@dropsiders.fr';
        if (!currentEditor) return 'contact@dropsiders.fr';
        return `${currentEditor.username.toLowerCase()}@dropsiders.fr`;
    }, [currentEditor, isAlex]);

    useEffect(() => {
        setSenderEmail(userProEmail);
    }, [userProEmail]);

    useEffect(() => {
        if (currentEditor) {
            setSignatureName(currentEditor.username);
        } else if (isAlex) {
            setSignatureName('Alex');
        }
    }, [currentEditor, isAlex]);

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
    const [interviewDate, setInterviewDate] = useState('');
    const [interviewFestival, setInterviewFestival] = useState('');

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
        if (mailboxTab === 'inbox') {
            await fetch('/api/contacts/delete', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id })
            });
            setMessages(prev => prev.filter(m => m.id !== id));
            if (selected?.id === id) setSelected(null);
        } else if (mailboxTab === 'sent') {
            const next = sentMessages.filter(m => m.id !== id);
            setSentMessages(next);
            localStorage.setItem('dropsiders_sent_messages', JSON.stringify(next));
            if (selectedSent?.id === id) setSelectedSent(null);
        } else if (mailboxTab === 'archived') {
            const next = archivedMessages.filter(m => m.id !== id);
            setArchivedMessages(next);
            localStorage.setItem('dropsiders_archived_messages', JSON.stringify(next));
            if (selectedArchived?.id === id) setSelectedArchived(null);
        }

        setDeleteConfirm(null);
        showNotif('success', 'Message supprimé.');
    };

    const handleArchive = (msg: ContactMessage) => {
        // Remove from inbox
        setMessages(prev => prev.filter(m => m.id !== msg.id));
        // Add to archives
        setArchivedMessages(prev => {
            const next = [msg, ...prev];
            localStorage.setItem('dropsiders_archived_messages', JSON.stringify(next));
            return next;
        });
        setSelected(null);
        showNotif('success', 'Message archivé.');
    };

    const handleUnarchive = (msg: ContactMessage) => {
        // Remove from archives
        setArchivedMessages(prev => {
            const next = prev.filter(m => m.id !== msg.id);
            localStorage.setItem('dropsiders_archived_messages', JSON.stringify(next));
            return next;
        });
        // Add back to inbox (at current position, or just at top)
        setMessages(prev => [msg, ...prev]);
        setSelectedArchived(null);
        showNotif('success', 'Message restauré dans la boîte de réception.');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles: { name: string; type: string; content: string; size: number }[] = [];
        
        let currentTotalSize = attachments.reduce((sum, a) => sum + a.size, 0);
        const MAX_SIZE = 20 * 1024 * 1024; // 20MB

        for (const file of files) {
            if (currentTotalSize + file.size > MAX_SIZE) {
                setReplyError("La taille totale dépasse 20 Mo.");
                setReplyStatus('error');
                setTimeout(() => setReplyStatus('idle'), 5000);
                break;
            }

            const reader = new FileReader();
            const promise = new Promise<string>((resolve) => {
                reader.onload = () => resolve(reader.result as string);
            });
            reader.readAsDataURL(file);
            const content = await promise;

            validFiles.push({
                name: file.name,
                type: file.type,
                size: file.size,
                content: content.split(',')[1]
            });
            currentTotalSize += file.size;
        }

        setAttachments(prev => [...prev, ...validFiles]);
        if (e.target) e.target.value = '';
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleReply = async () => {
        setReplyError('');
        const to = isNewMail ? destinationEmails.map(e => e.trim()).filter(Boolean).join(',') : selected?.email;
        
        if (!to) {
            setReplyError("Veuillez saisir un destinataire.");
            setReplyStatus('error');
            return;
        }

        if (!replyBody.trim()) {
            setReplyError("Veuillez rédiger un message.");
            setReplyStatus('error');
            return;
        }

        if (isNewMail && !signatureName) {
            setReplyError("Veuillez sélectionner une signature (cliquez sur votre nom).");
            setReplyStatus('error');
            return;
        }

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
                    lang: accreditationLang,
                    attachments: attachments.map(a => ({
                        name: a.name,
                        type: a.type,
                        content: a.content
                    }))
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
                setAttachments([]);
                // On vide les cadres de saisie
                setDestinationEmails(['']);
                setMailSubject('');
                setFestivalName('');
                setFestivalDates('');
                setPhotoFirstName('');
                setPhotoLastName('');
                setPhotoPortfolio('');
                setDjName('');
                setInterviewDate('');
                setInterviewFestival('');
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
                // Ne plus fermer automatiquement le modal pour laisser voir le message de succès
                // setTimeout(() => { setReplyModal(false); setReplyStatus('idle'); }, 1500);
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

    const getInterviewTemplate = (lang: 'FR' | 'EN', dj: string, type: string, date: string, festival: string, name: string) => {
        if (lang === 'FR') {
            const artistName = dj || "[Nom de l’Artiste]";
            const festivalName = festival || "l'EDC Las Vegas";
            const location = festivalName.toLowerCase().includes('edc') ? "Las Vegas" : "le lieu du festival";
            const dateInfo = date ? `(autour du ${date})` : '';

            return `Hello,

Je m'appelle Alex, je suis journaliste pour Dropsiders, média français spécialisé dans la musique électronique et la culture DJ.

Nous suivons de très près l'actualité de ${artistName} et, comme je serai présent à ${location} avec une accréditation presse officielle pour ${festivalName}, je souhaiterais organiser une rencontre privilégiée avec lui/elle.

L'idée est de proposer à notre communauté une interview dynamique axée sur son actualité, sa vision du mix et son expérience sur une scène aussi légendaire que celle de ${festivalName}.

Infos pratiques :

Format : Interview ${type.toLowerCase()} (vidéo format réseaux sociaux ou écrit).
Lieu : En backstage ou zone presse de ${festivalName}.
Timing : 10-15 minutes maximum.

Dropsiders a pour but de mettre en avant la scène électronique mondiale auprès du public francophone, et la présence de ${artistName} sur nos supports serait un vrai plus pour notre couverture du festival.

Seriez-vous disponible pour caler un court créneau durant le week-end ${dateInfo} ?

<a href="https://dropsiders.fr/uploads/pdfs/5efcee3d6da91551-Interview_Cards_Dropsiders_VER.pdf" style="color:#ff1241; font-weight:bold; text-decoration:underline;">Cliquez ici pour voir l'exemple des questions (PDF)</a>

Dans l'attente de votre réponse,

Musicalement,

Alex (Dropsiders)`;
        } else {
            const artistNameEN = dj || "[Artist Name]";
            const festivalNameEN = festival || "EDC Las Vegas";
            const locationEN = festivalNameEN.toLowerCase().includes('edc') ? "Las Vegas" : "the festival location";
            const dateInfoEN = date ? `(around ${date})` : '';

            return `Hello,

My name is Alex, I am a journalist for Dropsiders, a French media specialized in electronic music and DJ culture.

We are closely following ${artistNameEN}'s news and, as I will be present at ${locationEN} with an official press accreditation for ${festivalNameEN}, I would like to organize a privileged meeting with him/her.

The idea is to offer our community a dynamic interview focused on his/her latest news, vision of mixing, and experience on a stage as legendary as ${festivalNameEN}.

Practical info:

Format: ${type} interview (social media video format or written).
Location: In backstage or press area of ${festivalNameEN}.
Timing: 10-15 minutes maximum.

Dropsiders aims to highlight the global electronic scene to the French-speaking audience, and having ${artistNameEN} on our platforms would be a real asset for our festival coverage.

Would you be available to schedule a short slot during the weekend ${dateInfoEN} ?

<a href="https://dropsiders.fr/uploads/pdfs/1a7e292d6bf86432-Interview_Cards_Dropsiders_VER.pdf" style="color:#ff1241; font-weight:bold; text-decoration:underline;">Click here to see the example questions (PDF)</a>

Looking forward to your response,

Musically,

Alex (Dropsiders)`;
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
            setReplyBody(getInterviewTemplate(accreditationLang, djName, interviewType, interviewDate, interviewFestival, currentName));
            const djPart = djName ? ` – ${djName}` : '';
            const festPart = interviewFestival ? ` – ${interviewFestival}` : ' – EDC Las Vegas';
            
            if (accreditationLang === 'FR') {
                setMailSubject(`Demande d’interview${djPart}${festPart} – Media Dropsiders (Alex)`);
            } else {
                setMailSubject(`Interview Request${djPart}${festPart} – Media Dropsiders (Alex)`);
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
    }, [isAccreditationMode, isPhotoAccreditationMode, isInterviewMode, festivalName, festivalDates, photoFirstName, photoLastName, photoPortfolio, djName, interviewType, interviewDate, interviewFestival, accreditationLang, isNewMail, signatureName]);

    const filteredMessages = useMemo(() => {
        if (!isAlex) return messages;
        if (selectedEditorFilter === 'all') return messages;
        if (selectedEditorFilter === 'general') {
            return messages.filter(m => !m.recipient || m.recipient.toLowerCase() === 'contact@dropsiders.fr' || m.recipient.toLowerCase() === 'general');
        }
        // Dynamic: match by username or email
        const filterLower = selectedEditorFilter.toLowerCase();
        return messages.filter(m => {
            if (!m.recipient) return false;
            const recip = m.recipient.toLowerCase();
            return recip === `${filterLower}@dropsiders.fr` || recip === filterLower;
        });
    }, [messages, isAlex, selectedEditorFilter]);

    const filteredArchivedMessages = useMemo(() => {
        if (!isAlex) return archivedMessages;
        if (selectedEditorFilter === 'all') return archivedMessages;
        if (selectedEditorFilter === 'general') {
            return archivedMessages.filter(m => !m.recipient || m.recipient.toLowerCase() === 'contact@dropsiders.fr' || m.recipient.toLowerCase() === 'general');
        }
        const filterLower = selectedEditorFilter.toLowerCase();
        return archivedMessages.filter(m => {
            if (!m.recipient) return false;
            const recip = m.recipient.toLowerCase();
            return recip === `${filterLower}@dropsiders.fr` || recip === filterLower;
        });
    }, [archivedMessages, isAlex, selectedEditorFilter]);

    const unreadCount = filteredMessages.filter(m => !m.read).length;


    const getSubjectColor = (subject: string) => {
        const s = subject.toLowerCase();
        if (s.includes('question')) return 'text-neon-cyan border-neon-cyan/20 bg-neon-cyan/5';
        if (s.includes('suggestion')) return 'text-neon-green border-neon-green/20 bg-neon-green/5';
        if (s.includes('partenariat')) return 'text-neon-purple border-neon-purple/20 bg-neon-purple/5';
        if (s.includes('recrutement')) return 'text-neon-orange border-neon-orange/20 bg-neon-orange/5';
        return 'text-gray-400 border-white/10 bg-white/5';
    };

    return (
        <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0d0d0f 0%, #111318 50%, #0d0f14 100%)' }}>
            {/* Header */}
            <div className="sticky top-0 z-30 backdrop-blur-2xl" style={{ background: 'rgba(13,13,15,0.85)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="max-w-full mx-auto px-4 md:px-10 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link to="/admin" className="p-2 rounded-xl transition-all text-gray-400 hover:text-white hover:bg-white/8 group" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(255,18,65,0.2), rgba(255,18,65,0.05))', border: '1px solid rgba(255,18,65,0.25)' }}>
                                <Inbox className="w-4.5 h-4.5 text-neon-red" />
                            </div>
                            <div>
                                <h1 className="text-base md:text-lg font-display font-black uppercase italic tracking-tight text-white leading-tight">
                                    Messagerie <span className="text-neon-red">& Contacts</span>
                                </h1>
                                <p className="text-gray-500 text-[10px] font-medium">{filteredMessages.length} messages&nbsp;·&nbsp;<span className={unreadCount > 0 ? 'text-neon-red font-bold' : ''}>{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</span></p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setIsNewMail(true);
                                setDestinationEmails(['']);
                                setSenderEmail(userProEmail);
                                setSignatureName(currentEditor ? currentEditor.username : 'Alex');
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
                                setInterviewDate('');
                                setInterviewFestival('');
                                setReplyBody(getPressReleaseTemplate('FR', ''));
                                setReplyModal(true);
                            }}
                            className="flex-1 md:flex-none justify-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #ff1241, #cc0030)', boxShadow: '0 4px 20px rgba(255,18,65,0.25)' }}
                        >
                            <Send className="w-3 h-3" />
                            <span className="hidden sm:inline">Nouveau Message</span>
                            <span className="sm:hidden">Nouveau</span>
                        </button>
                        <a
                            href="https://mail.dropsiders.fr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 md:flex-none justify-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <Mail className="w-3 h-3 text-neon-red" />
                            <span className="hidden sm:inline text-gray-300">Messagerie Pro</span>
                            <span className="sm:hidden text-gray-300">Pro</span>
                        </a>
                        {unreadCount > 0 && (
                            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-[9px] font-black uppercase tracking-widest" style={{ background: 'rgba(255,18,65,0.15)', border: '1px solid rgba(255,18,65,0.3)' }}>
                                <div className="w-1.5 h-1.5 rounded-full bg-neon-red animate-pulse" />
                                {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
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

            <div className={`max-w-full mx-auto flex h-[calc(100vh-60px)] px-0 md:px-8`}>
                {/* LEFT: Message List */}
                <div className={`${selected ? 'hidden md:flex' : 'flex'} w-full md:w-[480px] flex-shrink-0 flex-col`} style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* Inbox / Sent tabs */}
                    <div className="flex shrink-0 overflow-x-auto no-scrollbar px-3 pt-3 gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {[
                            { id: 'inbox', label: 'Reçus', icon: <Inbox className="w-3 h-3" />, count: filteredMessages.length, color: '#ff1241', active: mailboxTab === 'inbox', onClick: () => { setMailboxTab('inbox'); setSelectedSent(null); setSelectedArchived(null); } },
                            { id: 'sent', label: 'Envoyés', icon: <Send className="w-3 h-3" />, count: sentMessages.length, color: '#00FFFF', active: mailboxTab === 'sent', onClick: () => { setMailboxTab('sent'); setSelected(null); setSelectedArchived(null); } },
                            { id: 'archived', label: 'Archivés', icon: <Archive className="w-3 h-3" />, count: archivedMessages.length, color: '#BF00FF', active: mailboxTab === 'archived', onClick: () => { setMailboxTab('archived'); setSelected(null); setSelectedSent(null); } }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={tab.onClick}
                                className={`flex-1 min-w-[90px] pb-2.5 pt-1 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all relative`}
                                style={{ borderBottom: tab.active ? `2px solid ${tab.color}` : '2px solid transparent', color: tab.active ? 'white' : 'rgba(255,255,255,0.35)' }}
                            >
                                {tab.icon}
                                {tab.label}
                                <span className="px-1.5 py-0.5 rounded-full text-[8px]" style={{ background: tab.active && tab.id === 'inbox' && unreadCount > 0 ? tab.color : 'rgba(255,255,255,0.08)', color: tab.active && tab.id === 'inbox' && unreadCount > 0 ? 'white' : 'rgba(255,255,255,0.4)' }}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                    {isAlex && (
                        <div className="flex gap-1.5 p-2.5 overflow-x-auto no-scrollbar shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {[
                                { id: 'all', label: 'Tous', emoji: '📥' },
                                { id: 'general', label: 'Général', emoji: '📬' },
                                ...editors
                                    .filter(e => e.username && e.username.toLowerCase() !== 'alex')
                                    .map(e => ({ id: e.username.toLowerCase(), label: e.username, emoji: e.username.charAt(0).toUpperCase() }))
                            ].map(filter => {
                                const isActive = selectedEditorFilter === filter.id;
                                const msgCount = filter.id === 'all'
                                    ? messages.length
                                    : filter.id === 'general'
                                        ? messages.filter(m => !m.recipient || m.recipient.toLowerCase() === 'contact@dropsiders.fr' || m.recipient.toLowerCase() === 'general').length
                                        : messages.filter(m => {
                                            const recip = (m.recipient || '').toLowerCase();
                                            return recip === `${filter.id}@dropsiders.fr` || recip === filter.id;
                                          }).length;

                                const color = filter.id === 'general' ? '#ff1241' : getEditorColor(filter.id);
                                const isLightColor = ['#00ffff', '#39ff14', '#fff01f'].includes(color.toLowerCase());
                                const tabStyle = getEditorTabStyle(filter.id, isActive);

                                return (
                                    <button
                                        key={filter.id}
                                        onClick={() => { setSelectedEditorFilter(filter.id); setSelected(null); setSelectedArchived(null); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap"
                                        style={tabStyle}
                                    >
                                        {filter.label}
                                        {msgCount !== null && (
                                            <span 
                                                className="px-1.5 py-0.5 rounded-full text-[8px] font-black" 
                                                style={{ 
                                                    background: isActive 
                                                        ? (isLightColor || filter.id === 'all' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.25)') 
                                                        : 'rgba(255,255,255,0.08)',
                                                    color: isActive 
                                                        ? (isLightColor || filter.id === 'all' ? '#000000' : '#ffffff') 
                                                        : 'rgba(255,255,255,0.4)'
                                                }}
                                            >
                                                {msgCount}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="animate-spin w-8 h-8 rounded-full" style={{ border: '2px solid rgba(255,18,65,0.15)', borderTop: '2px solid #ff1241' }} />
                                    <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Chargement...</span>
                                </div>
                            </div>
                        ) : mailboxTab === 'sent' ? (
                            sentMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 gap-3">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <Send className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Aucun message envoyé</p>
                                </div>
                            ) : (
                                <div>
                                    {sentMessages.map(msg => (
                                        <div
                                            key={msg.id}
                                            onClick={() => setSelectedSent(msg)}
                                            className="px-4 py-3.5 cursor-pointer transition-all relative"
                                            style={{
                                                background: selectedSent?.id === msg.id ? 'rgba(0,255,255,0.04)' : 'transparent',
                                                borderLeft: selectedSent?.id === msg.id ? '3px solid #00FFFF' : '3px solid transparent',
                                                borderBottom: '1px solid rgba(255,255,255,0.04)'
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0,255,255,0.15), rgba(0,255,255,0.05))', color: '#00FFFF', border: '1px solid rgba(0,255,255,0.15)' }}>
                                                    {(msg.to.charAt(0) || 'E').toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                                        <span className="text-xs font-bold text-white/80 truncate">{msg.to}</span>
                                                        <span className="text-[9px] flex-shrink-0 ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>{new Date(msg.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                                                    </div>
                                                    <p className="text-[11px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{msg.subject}</p>
                                                    <p className="text-[10px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{msg.body.slice(0, 55)}…</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : mailboxTab === 'archived' ? (
                            filteredArchivedMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 gap-3">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <Archive className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Aucun message archivé</p>
                                </div>
                            ) : (
                                <div>
                                    {filteredArchivedMessages.map(msg => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            onClick={() => setSelectedArchived(msg)}
                                            className="px-4 py-3.5 cursor-pointer transition-all"
                                            style={{
                                                background: selectedArchived?.id === msg.id ? 'rgba(191,0,255,0.04)' : 'transparent',
                                                borderLeft: selectedArchived?.id === msg.id ? '3px solid #BF00FF' : '3px solid transparent',
                                                borderBottom: '1px solid rgba(255,255,255,0.04)'
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                    {msg.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                                        <span className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{msg.name}</span>
                                                        <span className="text-[9px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>{new Date(msg.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${getSubjectColor(msg.subject)}`}>{msg.subject}</span>
                                                        {msg.recipient && msg.recipient.toLowerCase() !== 'contact@dropsiders.fr' && (
                                                            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,255,255,0.08)', border: '1px solid rgba(0,255,255,0.15)', color: '#00FFFF' }}>→ {msg.recipient.split('@')[0]}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] truncate mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{msg.message}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )
                        ) : filteredMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-3">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <MessageSquare className="w-5 h-5 text-gray-600" />
                                </div>
                                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Aucun message</p>
                            </div>
                        ) : (
                            <div>
                                {filteredMessages.map(msg => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => openMessage(msg)}
                                        className="px-4 py-3.5 cursor-pointer transition-all relative"
                                        style={{
                                            background: selected?.id === msg.id ? 'rgba(255,18,65,0.05)' : 'transparent',
                                            borderLeft: selected?.id === msg.id ? '3px solid #ff1241' : '3px solid transparent',
                                            borderBottom: '1px solid rgba(255,255,255,0.04)'
                                        }}
                                    >
                                        {!msg.read && (
                                            <div className="absolute top-4 right-4 w-2 h-2 rounded-full animate-pulse" style={{ background: '#ff1241', boxShadow: '0 0 6px rgba(255,18,65,0.6)' }} />
                                        )}
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                                                style={msg.read
                                                    ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }
                                                    : { background: 'rgba(255,18,65,0.15)', color: '#ff1241', border: '1px solid rgba(255,18,65,0.25)' }
                                                }
                                            >
                                                {msg.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                                    <span className={`text-sm truncate ${msg.read ? 'font-medium' : 'font-black'}`} style={{ color: msg.read ? 'rgba(255,255,255,0.55)' : 'white' }}>{msg.name}</span>
                                                    <span className="text-[9px] flex-shrink-0 ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>{new Date(msg.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${getSubjectColor(msg.subject)}`}>{msg.subject}</span>
                                                    {msg.recipient && msg.recipient.toLowerCase() !== 'contact@dropsiders.fr' && (
                                                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,255,255,0.08)', border: '1px solid rgba(0,255,255,0.15)', color: '#00FFFF' }}>→ {msg.recipient.split('@')[0]}</span>
                                                    )}
                                                </div>
                                                <p className={`text-[10px] truncate mt-1 ${msg.read ? '' : 'font-semibold'}`} style={{ color: msg.read ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.65)' }}>{msg.message}</p>
                                                {msg.replied && (
                                                    <span className="inline-flex items-center gap-1 text-[8px] uppercase font-black mt-1" style={{ color: 'rgba(0,255,255,0.6)' }}>
                                                        <Check className="w-2.5 h-2.5" /> Répondu
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
                <div className={`${(selected || selectedSent || selectedArchived) ? 'flex' : 'hidden md:flex'} flex-1 overflow-y-auto flex-col`} style={{ background: 'rgba(255,255,255,0.015)' }}>
                    {(selected || selectedSent || selectedArchived) ? (
                        <motion.div
                            key={selected?.id || selectedSent?.id || selectedArchived?.id}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            className="p-4 md:p-8 max-w-full"
                        >
                            {/* Mobile Back Button */}
                            <button
                                onClick={() => { setSelected(null); setSelectedSent(null); setSelectedArchived(null); }}
                                className="md:hidden flex items-center gap-2 text-neon-cyan hover:text-white mb-6 p-2 bg-neon-cyan/5 border border-neon-cyan/10 rounded-xl uppercase text-[10px] font-black tracking-widest transition-all active:scale-95 w-fit"
                            >
                                <ArrowLeft className="w-4 h-4" /> Retour à la liste
                            </button>
                            {/* Message Header */}
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-8 gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${(selected || selectedArchived) ? getSubjectColor((selected || selectedArchived)!.subject) : 'text-neon-cyan border-neon-cyan/20 bg-neon-cyan/5'}`}>
                                            {(selected || selectedArchived)?.subject || 'MESSAGE ENVOYÉ'}
                                        </span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-display font-black text-white italic uppercase tracking-tight mb-1">{(selected || selectedArchived)?.name || selectedSent?.to}</h2>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5" />
                                            <span className="font-bold text-white">{(selected || selectedArchived)?.name || `De : ${selectedSent?.signer}`}</span>
                                        </div>
                                        <span className="text-gray-700">·</span>
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5" />
                                            <a href={`mailto:${(selected || selectedArchived)?.email || selectedSent?.to}`} className="text-neon-cyan hover:underline">{(selected || selectedArchived)?.email || selectedSent?.to}</a>
                                        </div>
                                        <span className="text-gray-700">·</span>
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{new Date((selected || selectedArchived || selectedSent)!.date).toLocaleString('fr-FR')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 w-full lg:w-auto">
                                    {(selected || selectedArchived) && (
                                        <button
                                            onClick={() => {
                                                setIsNewMail(false);
                                                const activeMsg = selected || selectedArchived;
                                                if (activeMsg && activeMsg.recipient) {
                                                    setSenderEmail(activeMsg.recipient.toLowerCase());
                                                    const prefix = activeMsg.recipient.split('@')[0];
                                                    const matched = editors.find(e => e.username && e.username.toLowerCase() === prefix.toLowerCase());
                                                    setSignatureName(matched ? matched.username : (prefix.charAt(0).toUpperCase() + prefix.slice(1)));
                                                } else {
                                                    setSenderEmail(userProEmail);
                                                    setSignatureName(currentEditor ? currentEditor.username : 'Alex');
                                                }
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
                                    )}

                                    {selected && (
                                        <button
                                            onClick={() => handleArchive(selected)}
                                            className="flex items-center gap-2 px-4 py-2 bg-neon-purple/10 border border-neon-purple/30 text-neon-purple rounded-xl hover:bg-neon-purple/20 transition-all text-xs font-black uppercase"
                                            title="Archiver"
                                        >
                                            <Archive className="w-4 h-4" />
                                        </button>
                                    )}

                                    {selectedArchived && (
                                        <button
                                            onClick={() => handleUnarchive(selectedArchived)}
                                            className="flex items-center gap-2 px-4 py-2 bg-neon-green/10 border border-neon-green/30 text-neon-green rounded-xl hover:bg-neon-green/20 transition-all text-xs font-black uppercase"
                                            title="Désarchiver"
                                        >
                                            <Inbox className="w-4 h-4" />
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setDeleteConfirm((selected || selectedSent || selectedArchived)!.id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-neon-red/10 border border-neon-red/30 text-neon-red rounded-xl hover:bg-neon-red/20 transition-all text-xs font-black uppercase"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Message Body */}
                            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <div 
                                    className="leading-relaxed text-sm"
                                    style={{ color: 'rgba(255,255,255,0.75)' }}
                                    dangerouslySetInnerHTML={{ 
                                        __html: linkify((selected || selectedArchived)?.message || selectedSent?.body || '') 
                                    }}
                                />
                            </div>

                            {/* Attachments */}
                            {((selected || selectedArchived)?.attachments?.length || 0) > 0 && (
                                <div className="mt-6 space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                        <Paperclip className="w-3.5 h-3.5" /> Pièces Jointes
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {(selected || selectedArchived)?.attachments?.map((file, idx) => (
                                            <a
                                                key={idx}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between group hover:bg-white/10 hover:border-neon-red/30 transition-all"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-2 bg-white/5 rounded-lg group-hover:bg-neon-red/10 transition-all">
                                                        <FileText className="w-4 h-4 text-neon-red" />
                                                    </div>
                                                    <div className="overflow-hidden text-left">
                                                        <p className="text-[11px] font-bold text-white truncate">{file.name}</p>
                                                        <p className="text-[9px] text-gray-500 font-medium">{(file.size / 1024).toFixed(0)} KB</p>
                                                    </div>
                                                </div>
                                                {file.url ? <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-neon-cyan" /> : null}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(selected || selectedArchived)?.replied && (
                                <div className="mt-4 flex items-center gap-2 text-neon-cyan/60 text-xs font-bold">
                                    <Reply className="w-4 h-4" />
                                    Vous avez déjà répondu à ce message.
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-5">
                            <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <Mail className="w-9 h-9" style={{ color: 'rgba(255,255,255,0.15)' }} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>Sélectionnez un message</p>
                                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.12)' }}>pour le lire ici</p>
                            </div>
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
                        // Retiré : ne plus fermer au clic extérieur
                        // onClick={() => { setReplyModal(false); setReplyStatus('idle'); }}
                        className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#111] border-t md:border border-white/10 rounded-t-[2rem] md:rounded-[2rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[95vh] md:max-h-[85vh]"
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
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 relative">
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
                                                readOnly
                                                className="bg-black/30 border border-white/5 rounded-lg px-3 py-1.5 text-sm text-gray-500 flex-1 font-bold cursor-not-allowed opacity-70"
                                            />
                                        </div>
                                        {isNewMail && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black uppercase text-gray-500 w-24">Objet :</span>
                                                <input
                                                    type="text"
                                                    value={mailSubject}
                                                    onChange={(e) => setMailSubject(e.target.value)}
                                                    onInput={(e) => setMailSubject((e.target as HTMLInputElement).value)}
                                                    onBlur={(e) => setMailSubject(e.target.value)}
                                                    spellCheck="true"
                                                    autoCorrect="on"
                                                    autoComplete="on"
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
                                                {editors.filter((e: any) => e && (e.username || e.name)).map((editor: any) => {
                                                    const uname = editor.username || editor.name || 'Admin';
                                                    const displayName = editor.name || editor.username || 'Admin';
                                                    const editorColor = getEditorColor(uname.toLowerCase());
                                                    const isSelected = signatureName === displayName;
                                                    return (
                                                        <button
                                                            key={uname}
                                                            type="button"
                                                            onClick={() => setSignatureName(displayName)}
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
                                                                {displayName.charAt(0)}
                                                            </div>
                                                            {displayName}
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
                                                <div className="space-y-4">
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
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Festival / Lieu</label>
                                                            <input
                                                                type="text"
                                                                value={interviewFestival}
                                                                onChange={(e) => setInterviewFestival(e.target.value)}
                                                                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-neon-red"
                                                                placeholder="Tomorrowland, Paris, etc."
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Date / Créneau</label>
                                                            <input
                                                                type="text"
                                                                value={interviewDate}
                                                                onChange={(e) => setInterviewDate(e.target.value)}
                                                                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-neon-red"
                                                                placeholder="Samedi 12 Juillet - 18h"
                                                            />
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
                                                onInput={(e) => setReplyBody((e.target as HTMLTextAreaElement).value)}
                                                onBlur={(e) => setReplyBody(e.target.value)}
                                                spellCheck="true"
                                                autoCorrect="on"
                                                autoComplete="on"
                                                placeholder="Rédigez votre message..."
                                                className="w-full h-[200px] md:h-[350px] bg-black/40 border border-white/10 rounded-2xl p-3 md:p-4 text-white text-sm resize-none focus:outline-none focus:border-neon-cyan transition-all custom-scrollbar"
                                            />
                                        </div>

                                        {/* Preview Side */}
                                        <div className="flex-1 bg-black/60 border border-white/10 rounded-2xl p-6 hidden md:block">
                                            <div className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] mb-4 text-center">Aperçu</div>
                                            <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl scale-[0.85] origin-top">
                                                <div className="p-6">
                                                    <div 
                                                        className="text-white/80 text-[11px] leading-relaxed min-h-[100px]"
                                                        dangerouslySetInnerHTML={{ 
                                                            __html: linkify(replyBody || "[Votre message apparaîtra ici]") 
                                                        }}
                                                    />
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
                                    
                                    <div className="space-y-2 mt-4 bg-[#111] border border-white/5 p-4 rounded-xl">
                                        <div className="flex items-center justify-between px-1 mb-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                <Paperclip className="w-3 h-3 text-neon-orange" /> Fichiers joints au message (Max 20Mo)
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                            {attachments.map((file, idx) => (
                                                <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex items-center justify-between group">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <FileIcon className="w-3.5 h-3.5 text-neon-orange shrink-0" />
                                                        <span className="text-[10px] font-bold text-white truncate">{file.name}</span>
                                                    </div>
                                                    <button type="button" onClick={() => removeAttachment(idx)} className="p-1 hover:text-neon-red transition-colors shrink-0">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            <label className="block w-full">
                                                <input type="file" multiple onChange={handleFileChange} className="hidden" />
                                                <div className="border border-dashed border-white/10 hover:border-neon-orange/50 hover:bg-neon-orange/5 rounded-xl p-2.5 flex items-center justify-center gap-2 cursor-pointer transition-all group h-full h-10">
                                                    <Plus className="w-3.5 h-3.5 text-gray-500 group-hover:text-neon-orange" />
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-300">Ajouter</span>
                                                </div>
                                            </label>
                                        </div>
                                        {replyStatus === 'error' && (
                                            <div className="flex items-center justify-center gap-3 p-4 bg-neon-red/10 border border-neon-red/30 rounded-2xl mt-4">
                                                <AlertCircle className="w-5 h-5 text-neon-red" />
                                                <p className="text-neon-red text-[11px] font-black uppercase italic tracking-widest">⚠ {replyError}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {replyStatus === 'success' && (
                                        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl text-center">
                                            <motion.div 
                                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                                className="flex flex-col items-center gap-6 max-w-sm"
                                            >
                                                <div className="w-24 h-24 bg-neon-cyan/20 rounded-full flex items-center justify-center border-2 border-neon-cyan/40 mb-2 animate-bounce shadow-[0_0_50px_rgba(0,240,255,0.2)]">
                                                    <Check className="w-12 h-12 text-neon-cyan" />
                                                </div>
                                                <div className="space-y-3">
                                                    <h3 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter">MESSAGE ENVOYÉ !</h3>
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className="h-px w-8 bg-neon-cyan/30" />
                                                        <p className="text-neon-cyan text-[10px] font-black uppercase tracking-[0.4em]">Confirmation Brevo OK</p>
                                                        <div className="h-px w-8 bg-neon-cyan/30" />
                                                    </div>
                                                </div>
                                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                                                    Les champs ont été réinitialisés. <br /> Le thème du mail a été conservé.
                                                </p>
                                                <button 
                                                    onClick={() => setReplyStatus('idle')}
                                                    className="mt-4 px-12 py-5 bg-gradient-to-r from-neon-cyan to-neon-blue text-black font-black uppercase rounded-[2rem] hover:scale-105 transition-all text-[11px] tracking-[0.2em] shadow-[0_10px_30px_rgba(0,240,255,0.3)]"
                                                >
                                                    Continuer
                                                </button>
                                            </motion.div>
                                        </div>
                                     )}
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
                                    disabled={replyStatus === 'sending' || replyStatus === 'success'}
                                    className="flex-1 md:flex-none px-8 py-3 bg-gradient-to-r from-neon-cyan to-neon-blue text-black font-black uppercase rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 text-[11px] md:text-[10px] disabled:opacity-50 shadow-xl shadow-neon-cyan/20 active:scale-95"
                                >
                                    <Send className="w-4 h-4 md:w-3.5 md:h-3.5" />
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
