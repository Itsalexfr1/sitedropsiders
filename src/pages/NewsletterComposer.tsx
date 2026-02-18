import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Copy, Eye, Type, Image as ImageIcon, Users, ArrowLeft, Music, Youtube } from 'lucide-react';

// Type pour les abonnés (plus de dépendance JSON foireuse)
type Subscriber = { email: string };

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
    const [news1, setNews1] = useState({ title: '', image: '', link: '' });
    const [news2, setNews2] = useState({ title: '', image: '', link: '' });

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

    // Abonnés (Initialisé vide pour éviter tout crash au démarrage)
    const [subscribers, setSubscribers] = useState<string[]>([]);

    // SECTION 3 : EFFETS (Chargement API)
    // -----------------------------------------------------------
    useEffect(() => {
        const fetchSubscribers = async () => {
            try {
                // On tente de charger depuis l'API uniquement
                const response = await fetch('/api/subscribers', {
                    headers: { 'X-Admin-Password': localStorage.getItem('admin_password') || '' }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        // On extrait juste les emails
                        const emails = data.map((sub: any) => sub.email || sub).filter(Boolean);
                        setSubscribers(emails);
                    }
                }
            } catch (error) {
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
            box-shadow: 0 4px 30px rgba(0,0,0,0.5);
        }
        
        /* En-tête avec Logo */
        .header { text-align: center; padding: 40px 0; background-color: ${C.bg}; border-bottom: 1px solid ${C.border}; }
        
        /* Article Principal */
        .main-article { padding: 40px 30px; border-bottom: 1px solid ${C.border}; }
        .main-title { font-size: 28px; font-weight: 900; text-transform: uppercase; margin: 25px 0 15px 0; color: ${C.text}; line-height: 1.1; letter-spacing: -1px; font-style: italic; }
        .main-text { font-size: 16px; line-height: 1.6; color: ${C.textMuted}; margin-bottom: 30px; }
        .main-image { width: 100%; border-radius: 12px; border: 1px solid ${C.border}; display: block; object-fit: cover; }
        
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
        
        .news-image { width: 100%; height: 160px; object-fit: cover; border-radius: 8px; border: 1px solid ${C.border}; margin-bottom: 15px; display: block; background-color: #222; }
        .news-title { font-size: 16px; font-weight: 800; color: ${C.text}; margin-bottom: 8px; line-height: 1.3; text-transform: uppercase; letter-spacing: -0.5px; }
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
        }
        
        /* Footer */
        .footer { padding: 40px 20px; text-align: center; font-size: 12px; color: #444; background-color: ${C.bg}; font-weight: 500; }
        .footer a { color: #666; text-decoration: none; }
        
        /* Mobile Responsive */
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0; border: none; }
            .news-col { display: block; width: 100%; margin-bottom: 40px; }
            .news-spacer { display: none; }
            .header img { width: 140px !important; }
            .main-title { font-size: 24px; }
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
                <img src="${logoUrl}" alt="Dropsiders" width="180" style="display: block; margin: 0 auto; max-width: 180px; height: auto;">
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
                        ${news1.link ? `<a href="${news1.link}" class="news-link">Lire la news &rarr;</a>` : ''}
                    </div>
                    <div class="news-spacer"></div>
                    <div class="news-col">
                        ${news2.image ? `<img src="${news2.image}" class="news-image" alt="News 2">` : ''}
                        <div class="news-title">${news2.title}</div>
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
            
            <!-- FOOTER -->
            <div class="footer">
                &copy; 2026 DROPSIDERS. Tous droits réservés.<br>
                <br>
                Vous recevez cet email car vous êtes inscrit à la newsletter Dropsiders.<br>
                <a href="#" style="text-decoration: underline;">Se désinscrire</a>
            </div>
        </div>
    </div>
</body>
</html>
        `;
    };

    // SECTION 5 : HANDLERS (Actions utilisateur)
    // -----------------------------------------------------------
    const handleCopyHTML = () => {
        navigator.clipboard.writeText(generateHTML(false));
        alert('Code HTML copié dans le presse-papier !');
    };

    const handleCopyEmails = () => {
        if (subscribers.length === 0) return alert('Aucun abonné à copier.');
        navigator.clipboard.writeText(subscribers.join(', '));
        alert(`${subscribers.length} emails copiés !`);
    };

    const handleSend = async () => {
        if (!subject || !mainArticle.title) {
            return alert('Erreur : Le SUJET et le TITRE PRINCIPAL sont obligatoires.');
        }

        if (subscribers.length === 0) {
            return alert('Erreur : Aucun abonné trouvé dans la liste.');
        }

        if (!confirm(`Êtes-vous sûr de vouloir envoyer cette newsletter à ${subscribers.length} abonnés ?\nCette action est irréversible.`)) {
            return;
        }

        setSending(true);
        try {
            const response = await fetch('/api/newsletter/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Password': localStorage.getItem('admin_password') || ''
                },
                body: JSON.stringify({
                    subject,
                    htmlContent: generateHTML(false),
                    recipients: subscribers
                })
            });

            if (response.ok) {
                alert('✅ Newsletter envoyée avec succès !');
            } else {
                const err = await response.json().catch(() => ({}));
                alert(`❌ Erreur lors de l'envoi : ${err.error || response.statusText}`);
            }
        } catch (e) {
            console.error(e);
            alert('❌ Erreur réseau critique.');
        } finally {
            setSending(false);
        }
    };

    // SECTION 6 : RENDU (JSX)
    // -----------------------------------------------------------
    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">

            {/* Header de la page */}
            <header className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
                            Studio <span className="text-neon-red">Newsletter</span>
                        </h1>
                        <p className="text-gray-500 text-sm font-medium">Création d'emails • Mode Sombre</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-center">
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2 text-sm font-bold text-gray-300 cursor-default">
                        <Users size={16} className="text-neon-cyan" />
                        <span>{subscribers.length} Abonnés</span>
                    </div>

                    <button onClick={handleCopyHTML} className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2 text-sm font-bold hover:bg-white/10 transition-colors hover:border-white/30">
                        <Copy size={16} /> Copier HTML
                    </button>

                    <button
                        onClick={handleSend}
                        disabled={sending || subscribers.length === 0}
                        className={`px-6 py-2 rounded-xl flex items-center gap-2 text-sm font-black uppercase tracking-wide transition-all
                            ${sending
                                ? 'bg-gray-800 text-gray-500 cursor-wait'
                                : 'bg-gradient-to-r from-neon-red to-neon-pink text-white hover:shadow-[0_0_20px_rgba(255,0,51,0.4)] hover:scale-105'
                            }
                        `}
                    >
                        <Send size={16} className={sending ? 'animate-pulse' : ''} />
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
                        <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Sujet de l'email (Obligatoire)</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-neon-red outline-none text-sm transition-all focus:bg-white/5"
                                placeholder="🔥 Alerte : Le lineup EDC est tombé !"
                            />
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
                                    <label className="label-field"><ImageIcon size={12} /> Image URL</label>
                                    <input
                                        type="text"
                                        value={mainArticle.image}
                                        onChange={e => setMainArticle({ ...mainArticle, image: e.target.value })}
                                        className="input-field"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="label-field">Contenu</label>
                                    <textarea
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
                                        <input type="text" placeholder="Image URL" value={news1.image} onChange={e => setNews1({ ...news1, image: e.target.value })} className="input-field" />
                                        <input type="text" placeholder="Lien" value={news1.link} onChange={e => setNews1({ ...news1, link: e.target.value })} className="input-field" />
                                    </div>
                                </div>

                                {/* News 2 */}
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10 relative group hover:border-neon-red/50 transition-colors">
                                    <div className="absolute -top-2 -right-2 bg-neon-red text-white text-[10px] font-black px-2 py-1 rounded">DROITE</div>
                                    <div className="space-y-3 mt-2">
                                        <input type="text" placeholder="Titre" value={news2.title} onChange={e => setNews2({ ...news2, title: e.target.value })} className="input-field" />
                                        <input type="text" placeholder="Image URL" value={news2.image} onChange={e => setNews2({ ...news2, image: e.target.value })} className="input-field" />
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

            {/* Styles injectés pour ce composant spécifique (plus propre que CSS global) */}
            <style>{`
                .label-field { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 900; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
                .input-field { width: 100%; background: #000; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 12px; color: white; font-size: 14px; outline: none; transition: all 0.2s; }
                .input-field:focus { border-color: #ff0033; background: rgba(255,255,255,0.02); }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #111; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
                .bg-dots-pattern { background-image: radial-gradient(#222 1px, transparent 1px); background-size: 20px 20px; }
            `}</style>
        </div>
    );
}
