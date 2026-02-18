import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Copy, Type, Image as ImageIcon, Users, ArrowLeft, Music, Youtube } from 'lucide-react';
import localSubscribersData from '../data/subscribers.json';

export function NewsletterComposer() {
    // Email Metadata
    const [subject, setSubject] = useState('');

    // Main Article
    const [mainArticle, setMainArticle] = useState({
        title: '',
        content: '',
        image: '',
        ctaText: 'Lire la suite',
        ctaLink: ''
    });

    // Secondary News (2 slots)
    const [news1, setNews1] = useState({ title: '', image: '', link: '' });
    const [news2, setNews2] = useState({ title: '', image: '', link: '' });

    // Media Section
    const [media, setMedia] = useState({
        title: 'Le Son du Moment',
        link: '',
        platform: 'spotify' as 'spotify' | 'youtube' | 'other'
    });

    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [activeTab, setActiveTab] = useState<'main' | 'secondary' | 'media'>('main');

    const [subscribers, setSubscribers] = useState<string[]>(
        Array.isArray(localSubscribersData) ? localSubscribersData.map((sub: any) => sub.email) : []
    );
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const fetchSubscribers = async () => {
            try {
                const response = await fetch('/api/subscribers', {
                    headers: { 'X-Admin-Password': localStorage.getItem('admin_password') || '' }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setSubscribers(data.map((sub: any) => sub.email));
                    }
                }
            } catch (error) {
                console.error('Error fetching subscribers:', error);
            }
        };
        fetchSubscribers();
    }, []);

    // HTML Generator
    const generateHTML = (isPreview = false) => {
        const logoUrl = isPreview ? '/Logo.png' : 'https://dropsiders.fr/Logo.png';
        const fontStack = "'Helvetica Neue', Helvetica, Arial, sans-serif";

        // Colors
        const bgBody = "#050505";
        const bgCard = "#111111"; // Very dark grey, almost black
        const textWhite = "#ffffff";
        const textGray = "#9ca3af";
        const border = "#333333";
        const accent = "#ff0033"; // Neon Red

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: ${fontStack}; background-color: ${bgBody}; color: ${textWhite}; padding: 0; margin: 0; width: 100%; }
        .wrapper { width: 100%; background-color: ${bgBody}; padding: 30px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: ${bgCard}; border: 1px solid ${border}; border-radius: 12px; overflow: hidden; }
        
        /* Header */
        .header { text-align: center; padding: 40px 0; background-color: ${bgBody}; border-bottom: 1px solid ${border}; }
        
        /* Main Article */
        .main-article { padding: 40px 30px; border-bottom: 1px solid ${border}; }
        .main-title { font-size: 28px; font-weight: 900; text-transform: uppercase; margin: 20px 0 15px 0; color: ${textWhite}; line-height: 1.2; letter-spacing: -0.5px; }
        .main-text { font-size: 16px; line-height: 1.6; color: ${textGray}; margin-bottom: 25px; }
        .main-image { width: 100%; border-radius: 8px; border: 1px solid ${border}; display: block; }
        
        /* Button */
        .button { display: inline-block; padding: 14px 28px; background-color: ${accent}; color: #ffffff !important; text-decoration: none; font-weight: bold; text-transform: uppercase; border-radius: 6px; font-size: 13px; letter-spacing: 1px; }
        
        /* Secondary News Grid */
        .news-grid { padding: 30px; display: table; width: 100%; border-bottom: 1px solid ${border}; }
        .news-col { display: table-cell; width: 48%; vertical-align: top; }
        .news-spacer { display: table-cell; width: 4%; }
        .news-image { width: 100%; height: 140px; object-fit: cover; border-radius: 6px; border: 1px solid ${border}; margin-bottom: 15px; display: block; }
        .news-title { font-size: 16px; font-weight: 700; color: ${textWhite}; margin-bottom: 10px; line-height: 1.4; text-transform: uppercase; }
        .news-link { color: ${accent}; text-decoration: none; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        
        /* Media Section */
        .media-section { padding: 40px 30px; text-align: center; background-color: #0d0d0d; }
        .media-title { font-size: 18px; font-weight: 800; color: ${textWhite}; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 2px; }
        .media-box { background-color: #000; border: 1px solid ${border}; border-radius: 12px; padding: 20px; display: inline-block; width: 100%; box-sizing: border-box; }
        
        /* Footer */
        .footer { padding: 30px; text-align: center; font-size: 12px; color: #555; background-color: ${bgBody}; }
        
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0; }
            .news-col { display: block; width: 100%; margin-bottom: 30px; }
            .news-spacer { display: none; }
            .main-title { font-size: 24px; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgBody};">
    <div class="wrapper">
        <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
            ${subject}
        </div>
        
        <div class="container">
            <!-- Header -->
            <div class="header">
                <img src="${logoUrl}" alt="Dropsiders" width="180" style="display: block; margin: 0 auto; max-width: 180px; height: auto;">
            </div>
            
            <!-- Main Content -->
            <div class="main-article">
                ${mainArticle.image ? `<img src="${mainArticle.image}" alt="Cover" class="main-image">` : ''}
                <h1 class="main-title">${mainArticle.title}</h1>
                <div class="main-text">
                    ${mainArticle.content.replace(/\n/g, '<br>')}
                </div>
                ${mainArticle.ctaLink ? `
                <div style="margin-top: 25px;">
                    <a href="${mainArticle.ctaLink}" class="button">${mainArticle.ctaText}</a>
                </div>
                ` : ''}
            </div>
            
            <!-- Secondary News -->
            ${(news1.title || news2.title) ? `
            <div class="news-grid">
                <div class="news-col">
                    ${news1.image ? `<img src="${news1.image}" class="news-image" alt="News 1">` : ''}
                    <div class="news-title">${news1.title}</div>
                    ${news1.link ? `<a href="${news1.link}" class="news-link">Lire ></a>` : ''}
                </div>
                <div class="news-spacer"></div>
                <div class="news-col">
                    ${news2.image ? `<img src="${news2.image}" class="news-image" alt="News 2">` : ''}
                    <div class="news-title">${news2.title}</div>
                    ${news2.link ? `<a href="${news2.link}" class="news-link">Lire ></a>` : ''}
                </div>
            </div>
            ` : ''}
            
            <!-- Media Section -->
            ${media.link ? `
            <div class="media-section">
                <div class="media-title">${media.title}</div>
                <div class="media-box">
                    <p style="color: #666; font-size: 14px; margin-bottom: 15px;">Écouter sur ${media.platform === 'spotify' ? 'Spotify' : 'YouTube'}</p>
                    <a href="${media.link}" target="_blank" style="color: ${accent}; font-weight: bold; font-size: 16px; text-decoration: none; border: 1px solid ${accent}; padding: 10px 20px; border-radius: 50px; display: inline-block;">
                        ▶ LIRE LE MÉDIA
                    </a>
                </div>
            </div>
            ` : ''}
            
            <!-- Footer -->
            <div class="footer">
                &copy; 2026 DROPSIDERS. Tous droits réservés.<br>
                <br>
                <a href="#" style="color: #555; text-decoration: underline;">Se désinscrire</a>
            </div>
        </div>
    </div>
</body>
</html>
        `;
    };

    const handleCopyHTML = () => {
        navigator.clipboard.writeText(generateHTML(false));
        alert('HTML copié !');
    };

    const handleCopyEmails = () => {
        navigator.clipboard.writeText(subscribers.join(', '));
        alert(`${subscribers.length} emails copiés !`);
    };

    const handleSend = async () => {
        if (!subject || !mainArticle.title) {
            alert('Le sujet et l\'article principal sont obligatoires.');
            return;
        }
        if (!confirm(`Envoyer à ${subscribers.length} abonnés ?`)) return;

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
            if (response.ok) alert('Envoyé avec succès !');
            else alert('Erreur lors de l\'envoi');
        } catch (e) {
            console.error(e);
            alert('Erreur réseau');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            {/* Header */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="p-2 bg-white/5 rounded-full hover:bg-white/10"><ArrowLeft /></Link>
                    <div>
                        <h1 className="text-3xl font-black uppercase italic tracking-tighter">Studio Newsletter</h1>
                        <p className="text-gray-500 text-sm">Édition & Envoi</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleCopyEmails} className="px-4 py-2 bg-white/5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-white/10">
                        <Users size={16} /> {subscribers.length}
                    </button>
                    <button onClick={handleCopyHTML} className="px-4 py-2 bg-white/5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-white/10">
                        <Copy size={16} /> HTML
                    </button>
                    <button onClick={handleSend} disabled={sending} className="px-6 py-2 bg-neon-red text-white rounded-lg text-sm font-black uppercase tracking-wide flex items-center gap-2 hover:bg-red-600 disabled:opacity-50">
                        <Send size={16} /> {sending ? '...' : 'Envoyer'}
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 h-[calc(100vh-200px)]">

                {/* Editor Column */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6 overflow-y-auto custom-scrollbar">

                    {/* General Settings */}
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Sujet de l'email</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-neon-red outline-none"
                            placeholder="Ex: Le lineup de Tomorrowland est sorti !"
                        />
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-white/10 mb-6">
                        <button
                            onClick={() => setActiveTab('main')}
                            className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${activeTab === 'main' ? 'text-neon-red border-b-2 border-neon-red' : 'text-gray-500 hover:text-white'}`}
                        >
                            Article Principal
                        </button>
                        <button
                            onClick={() => setActiveTab('secondary')}
                            className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${activeTab === 'secondary' ? 'text-neon-red border-b-2 border-neon-red' : 'text-gray-500 hover:text-white'}`}
                        >
                            News Secondaires
                        </button>
                        <button
                            onClick={() => setActiveTab('media')}
                            className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${activeTab === 'media' ? 'text-neon-red border-b-2 border-neon-red' : 'text-gray-500 hover:text-white'}`}
                        >
                            Média
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-6">

                        {/* Main Article Tab */}
                        {activeTab === 'main' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Type size={14} /> Titre</label>
                                    <input
                                        type="text"
                                        value={mainArticle.title}
                                        onChange={e => setMainArticle({ ...mainArticle, title: e.target.value })}
                                        className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-neon-red outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><ImageIcon size={14} /> Image URL</label>
                                    <input
                                        type="text"
                                        value={mainArticle.image}
                                        onChange={e => setMainArticle({ ...mainArticle, image: e.target.value })}
                                        className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-neon-red outline-none"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Contenu</label>
                                    <textarea
                                        value={mainArticle.content}
                                        onChange={e => setMainArticle({ ...mainArticle, content: e.target.value })}
                                        className="w-full h-32 bg-black border border-white/20 rounded-lg p-3 text-white focus:border-neon-red outline-none resize-none"
                                        placeholder="Votre texte ici..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Bouton Texte</label>
                                        <input
                                            type="text"
                                            value={mainArticle.ctaText}
                                            onChange={e => setMainArticle({ ...mainArticle, ctaText: e.target.value })}
                                            className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-neon-red outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Bouton Lien</label>
                                        <input
                                            type="text"
                                            value={mainArticle.ctaLink}
                                            onChange={e => setMainArticle({ ...mainArticle, ctaLink: e.target.value })}
                                            className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-neon-red outline-none"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Secondary News Tab */}
                        {activeTab === 'secondary' && (
                            <>
                                <div className="p-4 bg-black/40 rounded-xl border border-white/10">
                                    <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase">News Gauche</h3>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Titre"
                                            value={news1.title}
                                            onChange={e => setNews1({ ...news1, title: e.target.value })}
                                            className="w-full bg-black border border-white/20 rounded-lg p-2 text-sm text-white focus:border-neon-red outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Image URL"
                                            value={news1.image}
                                            onChange={e => setNews1({ ...news1, image: e.target.value })}
                                            className="w-full bg-black border border-white/20 rounded-lg p-2 text-sm text-white focus:border-neon-red outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Lien"
                                            value={news1.link}
                                            onChange={e => setNews1({ ...news1, link: e.target.value })}
                                            className="w-full bg-black border border-white/20 rounded-lg p-2 text-sm text-white focus:border-neon-red outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-black/40 rounded-xl border border-white/10">
                                    <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase">News Droite</h3>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Titre"
                                            value={news2.title}
                                            onChange={e => setNews2({ ...news2, title: e.target.value })}
                                            className="w-full bg-black border border-white/20 rounded-lg p-2 text-sm text-white focus:border-neon-red outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Image URL"
                                            value={news2.image}
                                            onChange={e => setNews2({ ...news2, image: e.target.value })}
                                            className="w-full bg-black border border-white/20 rounded-lg p-2 text-sm text-white focus:border-neon-red outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Lien"
                                            value={news2.link}
                                            onChange={e => setNews2({ ...news2, link: e.target.value })}
                                            className="w-full bg-black border border-white/20 rounded-lg p-2 text-sm text-white focus:border-neon-red outline-none"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Media Tab */}
                        {activeTab === 'media' && (
                            <div className="p-4 bg-black/40 rounded-xl border border-white/10">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Titre Section</label>
                                        <input
                                            type="text"
                                            value={media.title}
                                            onChange={e => setMedia({ ...media, title: e.target.value })}
                                            className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-neon-red outline-none"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setMedia({ ...media, platform: 'spotify' })}
                                            className={`flex-1 py-3 rounded-lg border ${media.platform === 'spotify' ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-black border-white/20 text-gray-500'}`}
                                        >
                                            <Music className="w-5 h-5 mx-auto mb-1" /> Spotify
                                        </button>
                                        <button
                                            onClick={() => setMedia({ ...media, platform: 'youtube' })}
                                            className={`flex-1 py-3 rounded-lg border ${media.platform === 'youtube' ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-black border-white/20 text-gray-500'}`}
                                        >
                                            <Youtube className="w-5 h-5 mx-auto mb-1" /> YouTube
                                        </button>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Lien du média</label>
                                        <input
                                            type="text"
                                            value={media.link}
                                            onChange={e => setMedia({ ...media, link: e.target.value })}
                                            className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-neon-red outline-none"
                                            placeholder="https://open.spotify.com/..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Column */}
                <div className="bg-[#050505] rounded-2xl overflow-hidden flex flex-col border border-white/10 shadow-2xl">
                    <div className="bg-black p-4 border-b border-white/10 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase">Aperçu en direct</span>
                        <div className="flex bg-white/10 rounded-lg p-1">
                            <button onClick={() => setPreviewMode('desktop')} className={`px-2 py-1 rounded text-xs font-bold ${previewMode === 'desktop' ? 'bg-black text-white' : 'text-gray-500'}`}>Desktop</button>
                            <button onClick={() => setPreviewMode('mobile')} className={`px-2 py-1 rounded text-xs font-bold ${previewMode === 'mobile' ? 'bg-black text-white' : 'text-gray-500'}`}>Mobile</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-[#050505]">
                        <div
                            className={`transition-all duration-300 bg-white ${previewMode === 'mobile' ? 'w-[375px]' : 'w-[600px]'} min-h-[600px] shadow-xl`}
                            dangerouslySetInnerHTML={{ __html: generateHTML(true) }}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
