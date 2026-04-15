import { useState, useEffect } from 'react';
import { Link, useBlocker } from 'react-router-dom';
import { AVAILABLE_COLORS } from '../data/colors';
import { getAuthHeaders } from '../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Copy, Eye, Type, Image as ImageIcon, Users, ArrowLeft, Music, Youtube, X, Bold, Italic, Plus } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ImageUploadModal } from '../components/ImageUploadModal';


export function NewsletterComposer() {
    // SECTION 1 : ÉTATS (DATA)
    // -----------------------------------------------------------

    // Métadonnées Email
    const [subject, setSubject] = useState('');

    // Article Principal (Gros bloc en haut)
    const [mainArticle, setMainArticle] = useState({
        title: '',
        content: '',
        image: '',
        ctaText: 'Lire la suite',
        ctaLink: ''
    });

    // News Secondaires (2 blocs côte à côte)
    const [news1, setNews1] = useState({ title: '', content: '', image: '', link: '' });
    const [news2, setNews2] = useState({ title: '', content: '', image: '', link: '' });

    // Section Média (Spotify/YouTube/Autre)
    const [media, setMedia] = useState({
        title: 'Le Son du Moment',
        link: '',
        platform: 'spotify' as 'spotify' | 'youtube' | 'other'
    });

    // SECTION 2 : ÉTATS (INTERFACE)
    // -----------------------------------------------------------
    const [activeTab, setActiveTab] = useState<'main' | 'secondary' | 'media'>('main');
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [sending, setSending] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadTarget, setUploadTarget] = useState<'main' | 'news1' | 'news2' | null>(null);

    // Abonnés (Initialisé vide pour éviter tout crash au démarrage)
    const [subscribersData, setSubscribersData] = useState<any[]>([]);
    const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
    const [showSubscribersModal, setShowSubscribersModal] = useState(false);
    const [subSearch, setSubSearch] = useState('');

    // Modales de notification / confirmation
    const [confirmSendModal, setConfirmSendModal] = useState(false);
    const [alertModal, setAlertModal] = useState<{ isOpen: boolean, isError: boolean, message: string }>({ isOpen: false, isError: false, message: '' });

    const [isDirty, setIsDirty] = useState(false);

    // Track changes
    useEffect(() => {
        if (subject || mainArticle.title || mainArticle.content || news1.title || news2.title || media.link) {
            setIsDirty(true);
        }
    }, [subject, mainArticle, news1, news2, media]);

    // Prompt before internal React Router navigation
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    // Confirm navigation handled by ConfirmationModal component in JSX

    // Prompt before window reload/close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // SECTION 3 : EFFETS (Chargement API)
    // -----------------------------------------------------------
    useEffect(() => {
        const fetchSubscribers = async () => {
            try {
                // On tente de charger depuis l'API uniquement
                const response = await fetch('/api/subscribers', {
                    headers: getAuthHeaders(null)
                });
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        setSubscribersData(data);
                        // On extrait juste les emails
                        const emails = data.map((sub: any) => sub.email || sub).filter(Boolean);
                        setSelectedSubscribers(emails);
                    }
                }
            } catch (error: any) {
                console.error('Erreur chargement abonnés:', error);
                // Pas de crash, juste une liste vide ou un message console
            }
        };
        fetchSubscribers();
    }, []);

    // SECTION 4 : GÉNÉRATEUR HTML (Le cœur du système)
    // -----------------------------------------------------------
    const generateHTML = (isPreview = false) => {
        // Logo : Chemin relatif en preview, Absolu en production pour que ça s'affiche dans Gmail
        const logoUrl = isPreview ? '/Logo.png' : 'https://dropsiders.fr/Logo.png';
        const fontStack = "'Helvetica Neue', Helvetica, Arial, sans-serif";

        // Palette de couleurs (Thème NOIR/DARK MODE STRICT)
        const C = {
            bg: "#000000",       // Fond général très noir
            card: "#111111",     // Fond des cartes (légèrement plus clair)
            text: "#ffffff",     // Texte blanc pur
            textMuted: "#9ca3af",// Texte gris (dates, descriptions)
            border: "#333333",   // Bordures subtiles
            accent: "#ff0033",   // Rouge Néon signature
            success: "#00ff99"   // Vert néon (rare)
        };

        return `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>
                body { font-family: ${fontStack}; background-color: ${C.bg}; color: ${C.text}; padding: 0; margin: 0; width: 100%; -webkit-font-smoothing: antialiased; }
                .wrapper { width: 100%; background-color: ${C.bg}; padding: 40px 0; }
                
                /* Conteneur Principal centré */
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background-color: ${C.card}; 
                    border: 1px solid ${C.border}; 
                    border-radius: 16px; 
                    overflow: hidden; 
                    box-shadow: 0 0 40px rgba(255, 0, 51, 0.15); /* GLOW ROUGE CONTENEUR */
                }
                
                /* En-tête avec Logo */
                .header { text-align: center; padding: 40px 0 30px 0; background-color: ${C.bg}; border-bottom: 1px solid ${C.border}; }
                .newsletter-title { font-family: 'Impact', sans-serif; font-size: 32px; color: ${C.accent}; text-transform: uppercase; letter-spacing: 4px; margin-top: 10px; text-shadow: 0 0 10px rgba(255, 0, 51, 0.3); }
                
                /* Article Principal */
                .main-article { padding: 40px 30px; border-bottom: 1px solid ${C.border}; }
                .main-title { font-family: 'Impact', 'Arial Black', sans-serif; font-size: 28px; font-weight: 900; text-transform: uppercase; margin: 25px 0 15px 0; color: ${C.text}; line-height: 1.1; letter-spacing: -1px; font-style: italic; }
                .main-text { font-size: 16px; line-height: 1.6; color: ${C.textMuted}; margin-bottom: 30px; }
                .main-image { width: 100%; border-radius: 12px; border: 1px solid ${C.border}; display: block; object-fit: cover; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
                
                /* Bouton CTA */
                .button { 
                    display: inline-block; 
                    padding: 16px 32px; 
                    background: linear-gradient(90deg, ${C.accent} 0%, #ff0066 100%); 
                    color: #ffffff !important; 
                    text-decoration: none; 
                    font-weight: 800; 
                    text-transform: uppercase; 
                    border-radius: 8px; 
                    font-size: 14px; 
                    letter-spacing: 1px;
                    box-shadow: 0 4px 15px rgba(255, 0, 51, 0.3);
                }
                
                /* Grille News Secondaires (Table Layout pour compatibilité Email) */
                .news-grid { padding: 30px; display: table; width: 100%; box-sizing: border-box; border-bottom: 1px solid ${C.border}; }
                .news-row { display: table-row; }
                .news-col { display: table-cell; width: 48%; vertical-align: top; padding-bottom: 10px; }
                .news-spacer { display: table-cell; width: 4%; }
                
                .news-image { width: 100%; height: 160px; object-fit: cover; border-radius: 8px; border: 1px solid ${C.border}; margin-bottom: 15px; display: block; background-color: #222; box-shadow: 0 4px 15px rgba(255, 0, 51, 0.15); /* GLOW ROUGE WIDGETS */ }
                .news-title { font-family: 'Impact', 'Arial Black', sans-serif; font-size: 16px; font-weight: 800; color: ${C.text}; margin-bottom: 8px; line-height: 1.3; text-transform: uppercase; letter-spacing: -0.5px; }
                .news-desc { font-size: 13px; line-height: 1.5; color: ${C.textMuted}; margin-bottom: 12px; }
                .news-link { color: ${C.accent}; text-decoration: none; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
                
                /* Section Média */
                .media-section { padding: 40px 30px; text-align: center; background-color: #080808; }
                .media-title { font-size: 14px; font-weight: 900; color: ${C.textMuted}; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 2px; }
                .media-box { 
                    background-color: #000; 
                    border: 1px solid ${C.border}; 
                    border-radius: 16px; 
                    padding: 25px; 
                    display: inline-block; 
                    width: 100%; 
                    box-sizing: border-box; 
                    text-align: left;
                    box-shadow: 0 0 25px rgba(255, 0, 51, 0.1); /* GLOW ROUGE MEDIA */
                }
                
                /* Footer */
                .footer { padding: 40px 20px; text-align: center; font-size: 12px; color: #444; background-color: ${C.bg}; font-weight: 500; }
                .footer a { color: #666; text-decoration: none; }
                
                /* Mobile Responsive */
                @media only screen and (max-width: 600px) {
                    .container { width: 100% !important; border-radius: 0; border: none; }
                    .news-col { display: block; width: 100%; margin-bottom: 40px; }
                    .news-spacer { display: none; }
                    .header img { width: 180px !important; }
                    .main-title { font-size: 24px; }
                    .newsletter-title { font-size: 24px; letter-spacing: 2px; }
                }
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: ${C.bg};">
            <div class="wrapper">
                <!-- Preheader caché (Texte d'aperçu dans Gmail) -->
                <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
                    ${subject || 'Découvrez les dernières news Dropsiders...'}
                </div>
                
                <div class="container">
                    <!-- HEADER LOGO -->
                    <div class="header">
                        <img src="${logoUrl}" alt="Dropsiders" width="220" style="display: block; margin: 0 auto; max-width: 220px; height: auto;">
                        <div class="newsletter-title">NEWSLETTER</div>
                    </div>
                    
                    <!-- ARTICLE PRINCIPAL -->
                    <div class="main-article">
                        ${mainArticle.image ? `<img src="${mainArticle.image}" alt="Cover" class="main-image">` : ''}
                        <h1 class="main-title">${mainArticle.title}</h1>
                        <div class="main-text">
                            ${mainArticle.content ? mainArticle.content.replace(/\n/g, '<br>') : ''}
                        </div>
                        ${mainArticle.ctaLink ? `
                        <div style="margin-top: 30px;">
                            <a href="${mainArticle.ctaLink}" class="button">${mainArticle.ctaText}</a>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- NEWS SECONDAIRES (GRID) -->
                    ${(news1.title || news2.title) ? `
                    <div class="news-grid">
                        <div class="news-row">
                            <div class="news-col">
                                ${news1.image ? `<img src="${news1.image}" class="news-image" alt="News 1">` : ''}
                                <div class="news-title">${news1.title}</div>
                                ${news1.content ? `<div class="news-desc">${news1.content.replace(/\n/g, '<br>')}</div>` : ''}
                                ${news1.link ? `<a href="${news1.link}" class="news-link">Lire la news &rarr;</a>` : ''}
                            </div>
                            <div class="news-spacer"></div>
                            <div class="news-col">
                                ${news2.image ? `<img src="${news2.image}" class="news-image" alt="News 2">` : ''}
                                <div class="news-title">${news2.title}</div>
                                ${news2.content ? `<div class="news-desc">${news2.content.replace(/\n/g, '<br>')}</div>` : ''}
                                ${news2.link ? `<a href="${news2.link}" class="news-link">Lire la news &rarr;</a>` : ''}
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- SECTION MEDIA -->
                    ${media.link ? `
                    <div class="media-section">
                        <div class="media-title">${media.title}</div>
                        <div class="media-box">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td width="60" valign="middle">
                                        <!-- Icône simple simulée par image ou caractère unicode si pas d'image -->
                                        <div style="width: 50px; height: 50px; background-color: #222; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 50px; font-size: 24px;">
                                            ${media.platform === 'spotify' ? '🎵' : '📺'}
                                        </div>
                                    </td>
                                    <td valign="middle" style="padding-left: 15px;">
                                        <div style="color: #666; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">
                                            ${media.platform === 'spotify' ? 'Écouter sur Spotify' : 'Regarder sur YouTube'}
                                        </div>
                                        <a href="${media.link}" target="_blank" style="color: #fff; font-weight: bold; font-size: 16px; text-decoration: none; border-bottom: 1px solid #333;">
                                            Accéder au média &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="footer">
                        &copy; 2024 DROPSIDERS. Tous droits réservés.<br>
                        <br>
                        Vous recevez cet email car vous êtes inscrit à la newsletter Dropsiders.<br>
                        <a href="https://dropsiders.fr/unsubscribe" style="text-decoration: underline;">Se désinscrire</a>
                    </div>
                </div>
            </div>
        </body>
    </html>
    `;
    };

    // SECTION 5 : HANDLERS (Actions utilisateur)
    // -----------------------------------------------------------
    const applyStyle = (target: 'main' | 'news1' | 'news2', style: 'b' | 'i' | 'color', colorHex?: string) => {
        let tag = '';
        if (style === 'b') tag = 'b';
        else if (style === 'i') tag = 'i';
        else if (style === 'color') tag = `span style="color: ${colorHex || '#ff0033'}"`;

        const setter = target === 'main' ? setMainArticle : (target === 'news1' ? setNews1 : setNews2);
        const current = target === 'main' ? mainArticle : (target === 'news1' ? news1 : news2);

        const textarea = document.getElementById(`content-${target}`) as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = current.content;
        const selectedText = text.substring(start, end);

        let newContent = '';
        if (style === 'color') {
            newContent = text.substring(0, start) + `<${tag}>` + selectedText + `</span>` + text.substring(end);
        } else {
            newContent = text.substring(0, start) + `<${tag}>` + selectedText + `</${tag}>` + text.substring(end);
        }

        setter({ ...current, content: newContent } as any);
    };

    const onUploadSuccess = (url: string | string[]) => {
        const actualUrl = Array.isArray(url) ? url[0] : url;
        if (uploadTarget === 'main') setMainArticle({ ...mainArticle, image: actualUrl });
        else if (uploadTarget === 'news1') setNews1({ ...news1, image: actualUrl });
        else if (uploadTarget === 'news2') setNews2({ ...news2, image: actualUrl });
        setIsUploadModalOpen(false);
        setUploadTarget(null);
    };

    const handleCopyHTML = () => {
        navigator.clipboard.writeText(generateHTML(false));
        setAlertModal({ isOpen: true, isError: false, message: '✅ Code HTML copié dans le presse-papier !' });
    };

    const handleCopyEmails = () => {
        if (selectedSubscribers.length === 0) {
            setAlertModal({ isOpen: true, isError: true, message: '❌ Aucun abonné sélectionné à copier.' });
            return;
        }
        navigator.clipboard.writeText(selectedSubscribers.join(', '));
        setAlertModal({ isOpen: true, isError: false, message: `✅ ${selectedSubscribers.length} emails copiés !` });
    };

    const handleSendClick = () => {
        if (!subject || !mainArticle.title) {
            setAlertModal({ isOpen: true, isError: true, message: 'Erreur : Le SUJET et le TITRE PRINCIPAL sont obligatoires.' });
            return;
        }

        if (selectedSubscribers.length === 0) {
            setAlertModal({ isOpen: true, isError: true, message: 'Erreur : Aucun abonné sélectionné.' });
            return;
        }

        setConfirmSendModal(true);
    };

    const executeSend = async () => {
        setConfirmSendModal(false);
        setSending(true);
        try {
            const response = await fetch('/api/newsletter/send', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    subject,
                    htmlContent: generateHTML(false),
                    recipients: selectedSubscribers
                })
            });

            if (response.ok) {
                setAlertModal({ isOpen: true, isError: false, message: '✅ Newsletter envoyée avec succès !' });
                setIsDirty(false);
            } else {
                const err = await response.json().catch(() => ({}));
                setAlertModal({ isOpen: true, isError: true, message: `❌ Erreur lors de l'envoi : ${err.error || response.statusText}` });
            }
        } catch (e: any) {
            console.error(e);
            setAlertModal({ isOpen: true, isError: true, message: '❌ Erreur réseau critique.' });
        } finally {
            setSending(false);
        }
    };

    // SECTION 6 : RENDU (JSX)
    // -----------------------------------------------------------
    return (
        <div className="min-h-screen bg-black text-white py-32 font-sans">
            {/* Header de la page */}
            <header className="max-w-full mx-auto px-4 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-16 gap-6">
                <div className="flex items-center gap-4 md:gap-6">
                    <Link to="/admin" className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all text-white group">
                        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-3xl md:text-5xl font-display font-black uppercase italic tracking-tighter leading-none text-white">
                            Studio <span className="text-neon-red">Newsletter</span>
                        </h1>
                        <p className="text-gray-500 text-xs md:text-sm font-medium mt-2">Création d'emails • Mode Sombre</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShowSubscribersModal(true)}
                        className="flex-1 md:flex-none px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center gap-2 text-[10px] md:text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        title="Voir les abonnés"
                    >
                        <Users size={14} className="text-neon-cyan" />
                        <span>{selectedSubscribers.length} sur {subscribersData.length} Dest.</span>
                    </button>

                    <button
                        onClick={handleCopyHTML}
                        className="flex-1 md:flex-none px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center gap-2 text-[10px] md:text-xs font-bold hover:bg-white/10 transition-colors hover:border-white/30"
                    >
                        <Copy size={14} />
                        <span className="hidden md:inline">Copier HTML</span>
                        <span className="md:hidden">HTML</span>
                    </button>

                    <button
                        onClick={handleSendClick}
                        disabled={sending || selectedSubscribers.length === 0}
                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-wide transition-all
                            ${sending
                                ? 'bg-gray-800 text-gray-500 cursor-wait'
                                : 'bg-gradient-to-r from-neon-red to-neon-red text-white hover:shadow-[0_0_20px_rgba(255,0,51,0.4)] hover:scale-105 active:scale-95'
                            }
                        `}
                    >
                        <Send size={14} className={sending ? 'animate-pulse' : ''} />
                        {sending ? 'Envoi...' : 'Envoyer'}
                    </button>
                </div>
            </header>

            {/* Zone Principale (2 Colonnes) */}
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-180px)] min-h-[600px]">

                {/* COLONNE GAUCHE : ÉDITEUR (4 colonnes sur 12) */}
                <div className="lg:col-span-5 bg-[#111] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl">

                    {/* Onglets */}
                    <div className="flex border-b border-white/10 bg-black/50">
                        <button
                            onClick={() => setActiveTab('main')}
                            className={`flex-1 py-4 text-xs md:text-sm font-bold uppercase tracking-wide transition-colors relative
                                ${activeTab === 'main' ? 'text-white bg-white/5' : 'text-gray-500 hover:text-gray-300'}
                            `}
                        >
                            Principal
                            {activeTab === 'main' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-neon-red"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('secondary')}
                            className={`flex-1 py-4 text-xs md:text-sm font-bold uppercase tracking-wide transition-colors relative
                                ${activeTab === 'secondary' ? 'text-white bg-white/5' : 'text-gray-500 hover:text-gray-300'}
                            `}
                        >
                            News (x2)
                            {activeTab === 'secondary' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-neon-red"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('media')}
                            className={`flex-1 py-4 text-xs md:text-sm font-bold uppercase tracking-wide transition-colors relative
                                ${activeTab === 'media' ? 'text-white bg-white/5' : 'text-gray-500 hover:text-gray-300'}
                            `}
                        >
                            Média
                            {activeTab === 'media' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-neon-red"></div>}
                        </button>
                    </div>

                    {/* Contenu Formulaire (Scrollable) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                        {/* Champ Sujet (Toujours visible) */}
                        <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Sujet de l'email (Obligatoire)</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-neon-red outline-none text-sm transition-all focus:bg-white/5"
                                    placeholder="🔥 Alerte : Le lineup EDC est tombé !"
                                />
                            </div>
                        </div>

                        {/* Contenu Article Principal */}
                        {activeTab === 'main' && (
                            <div className="space-y-5 animate-fadeIn">
                                <div>
                                    <label className="label-field"><Type size={12} /> Titre Principal</label>
                                    <input
                                        type="text"
                                        value={mainArticle.title}
                                        onChange={e => setMainArticle({ ...mainArticle, title: e.target.value })}
                                        className="input-field"
                                        placeholder="Titre de la grosse news..."
                                    />
                                </div>
                                <div>
                                    <label className="label-field"><ImageIcon size={12} /> Image</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={mainArticle.image}
                                            onChange={e => setMainArticle({ ...mainArticle, image: e.target.value })}
                                            className="input-field"
                                            placeholder="https://..."
                                        />
                                        <button
                                            onClick={() => { setUploadTarget('main'); setIsUploadModalOpen(true); }}
                                            className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                                            title="Uploader une image"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="label-field mb-0">Contenu</label>
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-1 h-fit">
                                                <button onClick={() => applyStyle('main', 'b')} className="p-1.5 bg-white/5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Gras"><Bold size={12} /></button>
                                                <button onClick={() => applyStyle('main', 'i')} className="p-1.5 bg-white/5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Italique"><Italic size={12} /></button>
                                                <button onClick={() => applyStyle('main', 'color')} className="p-1.5 bg-white/5 rounded hover:bg-white/10 text-neon-red hover:bg-neon-red/10 transition-colors" title="Couleur Rouge Neon"><Type size={12} /></button>
                                            </div>
                                            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                                                {AVAILABLE_COLORS.slice(0, 8).map(c => (
                                                    <button
                                                        key={c.hex}
                                                        onClick={() => applyStyle('main', 'color', c.hex)}
                                                        className="w-3 h-3 rounded-full hover:scale-125 transition-transform border border-white/10"
                                                        style={{ backgroundColor: c.hex }}
                                                        title={c.name}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <textarea
                                        id="content-main"
                                        value={mainArticle.content}
                                        onChange={e => setMainArticle({ ...mainArticle, content: e.target.value })}
                                        className="input-field min-h-[120px]"
                                        placeholder="Écrivez votre article ici..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="label-field">Bouton Texte</label>
                                        <input
                                            type="text"
                                            value={mainArticle.ctaText}
                                            onChange={e => setMainArticle({ ...mainArticle, ctaText: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>
                                    <div>
                                        <label className="label-field">Bouton Lien</label>
                                        <input
                                            type="text"
                                            value={mainArticle.ctaLink}
                                            onChange={e => setMainArticle({ ...mainArticle, ctaLink: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Contenu News Secondaires */}
                        {activeTab === 'secondary' && (
                            <div className="space-y-6 animate-fadeIn">
                                {/* News 1 */}
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10 relative group hover:border-neon-red/50 transition-colors">
                                    <div className="absolute -top-2 -left-2 bg-neon-red text-white text-[10px] font-black px-2 py-1 rounded">GAUCHE</div>
                                    <div className="space-y-3 mt-2">
                                        <input type="text" placeholder="Titre" value={news1.title} onChange={e => setNews1({ ...news1, title: e.target.value })} className="input-field" />

                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-black text-gray-500 uppercase">Description</span>
                                                <div className="flex gap-1 h-fit">
                                                    <button onClick={() => applyStyle('news1', 'b')} className="p-1 bg-white/5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Bold size={10} /></button>
                                                    <button onClick={() => applyStyle('news1', 'i')} className="p-1 bg-white/5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Italic size={10} /></button>
                                                    <button onClick={() => applyStyle('news1', 'color')} className="p-1 bg-white/5 rounded hover:bg-white/10 text-neon-red hover:bg-neon-red/10 transition-colors"><Type size={10} /></button>
                                                </div>
                                                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5 h-fit">
                                                    {AVAILABLE_COLORS.slice(0, 8).map(c => (
                                                        <button
                                                            key={c.hex}
                                                            onClick={() => applyStyle('news1', 'color', c.hex)}
                                                            className="w-2.5 h-2.5 rounded-full hover:scale-125 transition-transform border border-white/10"
                                                            style={{ backgroundColor: c.hex }}
                                                            title={c.name}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <textarea id="content-news1" placeholder="Description courte..." value={news1.content} onChange={e => setNews1({ ...news1, content: e.target.value })} className="input-field min-h-[60px]" />
                                        </div>

                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Image URL" value={news1.image} onChange={e => setNews1({ ...news1, image: e.target.value })} className="input-field" />
                                            <button onClick={() => { setUploadTarget('news1'); setIsUploadModalOpen(true); }} className="p-3 bg-white/5 border border-white/10 rounded-lg"><Plus size={16} /></button>
                                        </div>
                                        <input type="text" placeholder="Lien" value={news1.link} onChange={e => setNews1({ ...news1, link: e.target.value })} className="input-field" />
                                    </div>
                                </div>

                                {/* News 2 */}
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10 relative group hover:border-neon-red/50 transition-colors">
                                    <div className="absolute -top-2 -right-2 bg-neon-red text-white text-[10px] font-black px-2 py-1 rounded">DROITE</div>
                                    <div className="space-y-3 mt-2">
                                        <input type="text" placeholder="Titre" value={news2.title} onChange={e => setNews2({ ...news2, title: e.target.value })} className="input-field" />

                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-black text-gray-500 uppercase">Description</span>
                                                <div className="flex gap-1 h-fit">
                                                    <button onClick={() => applyStyle('news2', 'b')} className="p-1 bg-white/5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Bold size={10} /></button>
                                                    <button onClick={() => applyStyle('news2', 'i')} className="p-1 bg-white/5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Italic size={10} /></button>
                                                    <button onClick={() => applyStyle('news2', 'color')} className="p-1 bg-white/5 rounded hover:bg-white/10 text-neon-red hover:bg-neon-red/10 transition-colors"><Type size={10} /></button>
                                                </div>
                                                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5 h-fit">
                                                    {AVAILABLE_COLORS.slice(0, 8).map(c => (
                                                        <button
                                                            key={c.hex}
                                                            onClick={() => applyStyle('news2', 'color', c.hex)}
                                                            className="w-2.5 h-2.5 rounded-full hover:scale-125 transition-transform border border-white/10"
                                                            style={{ backgroundColor: c.hex }}
                                                            title={c.name}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <textarea id="content-news2" placeholder="Description courte..." value={news2.content} onChange={e => setNews2({ ...news2, content: e.target.value })} className="input-field min-h-[60px]" />
                                        </div>

                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Image URL" value={news2.image} onChange={e => setNews2({ ...news2, image: e.target.value })} className="input-field" />
                                            <button onClick={() => { setUploadTarget('news2'); setIsUploadModalOpen(true); }} className="p-3 bg-white/5 border border-white/10 rounded-lg"><Plus size={16} /></button>
                                        </div>
                                        <input type="text" placeholder="Lien" value={news2.link} onChange={e => setNews2({ ...news2, link: e.target.value })} className="input-field" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Contenu Média */}
                        {activeTab === 'media' && (
                            <div className="space-y-5 animate-fadeIn">
                                <div>
                                    <label className="label-field">Titre de la section</label>
                                    <input
                                        type="text"
                                        value={media.title}
                                        onChange={e => setMedia({ ...media, title: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setMedia({ ...media, platform: 'spotify' })}
                                        className={`flex-1 py-3 rounded-lg border transition-all text-sm font-bold flex items-center justify-center gap-2
                                            ${media.platform === 'spotify' ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-black border-white/10 text-gray-500 hover:bg-white/5'}
                                        `}
                                    >
                                        <Music size={16} /> Spotify
                                    </button>
                                    <button
                                        onClick={() => setMedia({ ...media, platform: 'youtube' })}
                                        className={`flex-1 py-3 rounded-lg border transition-all text-sm font-bold flex items-center justify-center gap-2
                                            ${media.platform === 'youtube' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-black border-white/10 text-gray-500 hover:bg-white/5'}
                                        `}
                                    >
                                        <Youtube size={16} /> YouTube
                                    </button>
                                </div>
                                <div>
                                    <label className="label-field">Lien du média</label>
                                    <input
                                        type="text"
                                        value={media.link}
                                        onChange={e => setMedia({ ...media, link: e.target.value })}
                                        className="input-field"
                                        placeholder="Lien Spotify ou YouTube..."
                                    />
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* COLONNE DROITE : APERÇU (7 colonnes sur 12) */}
                <div className="lg:col-span-7 bg-[#050505] rounded-2xl overflow-hidden flex flex-col border border-white/10 shadow-2xl relative">
                    {/* Header Aperçu */}
                    <div className="bg-black p-4 border-b border-white/10 flex justify-between items-center z-10">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                            <Eye size={14} className="text-neon-cyan" />
                            Aperçu Live
                        </div>
                        <div className="flex bg-white/10 rounded-lg p-1">
                            <button onClick={() => setPreviewMode('desktop')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${previewMode === 'desktop' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Desktop</button>
                            <button onClick={() => setPreviewMode('mobile')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${previewMode === 'mobile' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Mobile</button>
                        </div>
                    </div>

                    {/* Zone de rendu Iframe simulée */}
                    <div className="flex-1 overflow-y-auto bg-dots-pattern flex justify-center p-8 bg-[#0a0a0a]">
                        <div
                            className={`transition-all duration-500 bg-black shadow-2xl overflow-hidden
                                ${previewMode === 'mobile' ? 'w-[375px] rounded-[30px] border-[8px] border-[#222]' : 'w-[640px] rounded-xl border border-[#333]'}
                                min-h-[800px] h-fit
                            `}
                        >
                            <div dangerouslySetInnerHTML={{ __html: generateHTML(true) }} />
                        </div>
                    </div>
                </div>

            </div>

            {/* Modal Abonnés */}
            <AnimatePresence>
                {showSubscribersModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-neon-cyan/10 rounded-lg">
                                        <Users className="w-5 h-5 text-neon-cyan" />
                                    </div>
                                    <h2 className="text-xl font-bold uppercase italic">Liste des Abonnés</h2>
                                </div>
                                <button
                                    onClick={() => setShowSubscribersModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 border-b border-white/10 bg-black/30 flex flex-col gap-3">
                                <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
                                    <span>Sélectionnés : <span className="text-white">{selectedSubscribers.length}</span> / {subscribersData.length}</span>
                                    {selectedSubscribers.length === subscribersData.length ? (
                                        <button
                                            onClick={() => setSelectedSubscribers([])}
                                            className="text-neon-red hover:text-white transition-colors"
                                        >Déselectionner tout</button>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedSubscribers(subscribersData.map((sub: any) => sub.email || sub).filter(Boolean))}
                                            className="text-neon-cyan hover:text-white transition-colors"
                                        >Sélectionner tout</button>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Rechercher par email..."
                                    value={subSearch}
                                    onChange={(e) => setSubSearch(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-neon-cyan outline-none transition-all"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                <div className="space-y-2">
                                    {subscribersData
                                        .filter(sub => (sub.email || sub).toLowerCase().includes(subSearch.toLowerCase()))
                                        .map((sub, i) => {
                                            const email = sub.email || sub;
                                            const isSelected = selectedSubscribers.includes(email);
                                            return (
                                                <div
                                                    key={i}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSelectedSubscribers(selectedSubscribers.filter(e => e !== email));
                                                        } else {
                                                            setSelectedSubscribers([...selectedSubscribers, email]);
                                                        }
                                                    }}
                                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none
                                                        ${isSelected
                                                            ? 'bg-neon-cyan/10 border-neon-cyan/30 hover:bg-neon-cyan/20'
                                                            : 'bg-white/5 border-white/5 hover:border-white/10'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                                                            ${isSelected ? 'bg-neon-cyan border-neon-cyan text-black' : 'border-gray-500 bg-black'}`}>
                                                            {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                                        </div>
                                                        <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                                            {email}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/10 bg-black/50 flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        setShowSubscribersModal(false);
                                        setAlertModal({ isOpen: true, isError: false, message: `✅ ${selectedSubscribers.length} destinataire(s) sélectionné(s) pour l'envoi.` });
                                    }}
                                    className="w-full py-4 bg-gradient-to-r from-neon-red to-neon-red text-white font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(255,0,51,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <Send size={16} />
                                    Valider la sélection ({selectedSubscribers.length} dest.)
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCopyEmails}
                                        className="flex-1 py-3 bg-white/5 text-gray-300 font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-xs"
                                    >
                                        <Copy size={14} />
                                        Copier les emails
                                    </button>
                                    <button
                                        onClick={() => setShowSubscribersModal(false)}
                                        className="px-6 py-3 bg-white/5 text-gray-500 font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all text-xs"
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Styles injectés pour ce composant spécifique (plus propre que CSS global) */}
            <style>{`
                .label-field { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
                .label-field svg { color: #ff0033; }
                .input-field { width: 100%; background: #080808; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; color: white; font-size: 14px; outline: none; transition: all 0.3s ease; }
                .input-field:focus { border-color: #ff0033; background: rgba(255,0,51,0.05); box-shadow: 0 0 15px rgba(255, 0, 51, 0.15); }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #111; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ff0033; }
                .bg-dots-pattern { background-image: radial-gradient(#222 1px, transparent 1px); background-size: 20px 20px; }
                
                /* Animations */
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                 .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
             `}</style>

            <ConfirmationModal
                isOpen={blocker.state === "blocked"}
                message="Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter la page ?"
                onConfirm={() => blocker.proceed?.()}
                onCancel={() => blocker.reset?.()}
                accentColor="neon-red"
            />

            <ConfirmationModal
                isOpen={confirmSendModal}
                title="Envoi Définitif"
                message={`Êtes-vous sûr de vouloir envoyer cette newsletter à ${selectedSubscribers.length} abonné(s) ?\nCette action est irréversible !`}
                confirmLabel="Envoyer la Newsletter"
                cancelLabel="Annuler"
                onConfirm={executeSend}
                onCancel={() => setConfirmSendModal(false)}
                accentColor="neon-blue"
            />

            {alertModal.isOpen && (
                <ConfirmationModal
                    isOpen={alertModal.isOpen}
                    title={alertModal.isError ? "Erreur" : "Succès"}
                    message={alertModal.message}
                    confirmLabel="Fermer"
                    onConfirm={() => setAlertModal({ ...alertModal, isOpen: false })}
                    onCancel={() => setAlertModal({ ...alertModal, isOpen: false })}
                    accentColor={alertModal.isError ? "neon-red" : "neon-cyan"}
                />
            )}

            <ImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadSuccess={onUploadSuccess}
                accentColor="neon-red"
            />
        </div>
    );
}
