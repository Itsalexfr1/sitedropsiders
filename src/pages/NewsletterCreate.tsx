
import { useState, useEffect } from 'react';
import { Send, Copy, Eye, Layout, Type, Link, Image as ImageIcon, Users } from 'lucide-react';
import localSubscribersData from '../data/subscribers.json';

export function NewsletterCreate() {
    const [subject, setSubject] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [ctaText, setCtaText] = useState('');
    const [ctaLink, setCtaLink] = useState('');
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [subscribers, setSubscribers] = useState<string[]>(
        Array.isArray(localSubscribersData) ? localSubscribersData.map((sub: any) => sub.email) : []
    );
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const fetchSubscribers = async () => {
            try {
                const response = await fetch('/api/subscribers', {
                    headers: {
                        'X-Admin-Password': localStorage.getItem('admin_password') || ''
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setSubscribers(data.map((sub: any) => sub.email));
                        return;
                    }
                }
            } catch (error) {
                console.error('Error fetching subscribers:', error);
            }

            // Fallback to local data
            if (Array.isArray(localSubscribersData)) {
                setSubscribers((localSubscribersData as any[]).map(sub => sub.email));
            }
        };

        fetchSubscribers();
    }, []);

    // Simple HTML Template generator
    const generateHTML = () => {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0c0014; color: #ffffff; padding: 0; margin: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #1a0524; overflow: hidden; }
        .header { background: linear-gradient(90deg, #ff0033 0%, #00f2ea 100%); padding: 2px; }
        .content { padding: 40px 20px; }
        .title { font-size: 28px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; color: #ffffff; }
        .text { font-size: 16px; line-height: 1.6; color: #d1d5db; margin-bottom: 30px; }
        .button { display: inline-block; padding: 16px 32px; background: linear-gradient(45deg, #ff0033, #ff00ff); color: #ffffff; text-decoration: none; font-weight: bold; text-transform: uppercase; border-radius: 8px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; background-color: #0c0014; }
        .image { width: 100%; border-radius: 12px; margin-bottom: 30px; }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
        }
    </style>
</head>
<body>
    <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
        ${subject}
    </div>
                            <div class="header" style="text-align: center; padding: 20px 0;">
                                <img src="https://dropsiders.eu/Logo.png" alt="Dropsiders" width="150" style="display: block; margin: 0 auto; max-width: 150px;">
                            </div>
                            <div style="height: 2px; background: linear-gradient(90deg, #ff0033 0%, #00f2ea 100%); width: 100%;"></div>
                            ${imageUrl ? `<img src="${imageUrl}" alt="Cover" class="image" style="display:block; width:100%; max-width:600px;">` : ''}
                            <div class="content">
            <h1 class="title">${title}</h1>
            <div class="text">
                ${content.replace(/\n/g, '<br>')}
            </div>
            ${ctaText && ctaLink ? `
            <div style="text-align: center;">
                <a href="${ctaLink}" class="button">${ctaText}</a>
            </div>
            ` : ''}
        </div>
        <div class="footer">
            © 2026 Dropsiders. Tous droits réservés.<br>
            <a href="#" style="color: #00f2ea;">Se désinscrire</a>
        </div>
    </div>
</body>
</html>
        `;
    };

    const handleCopyHTML = () => {
        navigator.clipboard.writeText(generateHTML());
        alert('Code HTML copié ! Vous pouvez le coller dans Brevo, Mailchimp ou Gmail.');
    };

    const handleCopyEmails = () => {
        navigator.clipboard.writeText(subscribers.join(', '));
        alert(`${subscribers.length} emails copiés dans le presse-papier !`);
    };

    const handleSend = async () => {
        if (!subject || !title || !content) {
            alert('Veuillez remplir tous les champs obligatoires (Sujet, Titre, Contenu).');
            return;
        }

        if (subscribers.length === 0) {
            alert('Aucun abonné trouvé.');
            return;
        }

        if (!confirm(`Confirmer l'envoi de la newsletter à ${subscribers.length} abonnés ?`)) {
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
                    htmlContent: generateHTML(),
                    recipients: subscribers
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('Newsletter envoyée avec succès !');
            } else {
                console.error('Send error:', data);
                if (data.error === 'Brevo API Key missing') {
                    alert('Erreur : Clé API Brevo manquante. Ajoutez BREVO_API_KEY dans votre configuration.');
                } else {
                    alert(`Erreur lors de l'envoi : ${data.error || 'Erreur inconnue'}`);
                }
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Erreur réseau lors de l\'envoi.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg py-32 px-6">
            <div className="max-w-7xl mx-auto h-[800px] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter">
                            Créateur de Newsletter
                        </h1>
                        <p className="text-gray-400">Composez votre email et exportez le HTML</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleCopyEmails}
                            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white font-bold"
                            title="Copier la liste des emails"
                        >
                            <Users className="w-5 h-5 text-neon-cyan" />
                            <span className="font-bold">({subscribers.length})</span>
                        </button>
                        <button
                            onClick={handleCopyHTML}
                            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white font-bold"
                        >
                            <Copy className="w-5 h-5" />
                            Copier HTML
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={sending}
                            className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-red to-neon-pink rounded-xl hover:opacity-90 transition-opacity text-white font-bold uppercase ${sending ? 'opacity-50 cursor-wait' : ''}`}
                        >
                            <Send className={`w-5 h-5 ${sending ? 'animate-pulse' : ''}`} />
                            {sending ? 'Envoi...' : 'Envoyer'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
                    {/* Editor Scrollable */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 overflow-y-auto custom-scrollbar">
                        <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-6">
                            <Layout className="w-5 h-5 text-neon-cyan" />
                            Éditeur
                        </h2>

                        <div className="space-y-6">
                            {/* Metadata */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Sujet de l'email</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                                        placeholder="Ex: Les meilleurs festivals de l'été sont là !"
                                    />
                                </div>
                            </div>

                            <hr className="border-white/10" />

                            {/* Content */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Type className="w-4 h-4" /> Titre Principal
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                                        placeholder="Titre dans le corps du mail"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4" /> Image URL (Optionnel)
                                    </label>
                                    <input
                                        type="text"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Contenu</label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="w-full h-40 bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none resize-none"
                                        placeholder="Bonjour à tous..."
                                    />
                                </div>
                            </div>

                            <hr className="border-white/10" />

                            {/* CTA */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Link className="w-4 h-4" /> Bouton Texte
                                    </label>
                                    <input
                                        type="text"
                                        value={ctaText}
                                        onChange={(e) => setCtaText(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                                        placeholder="Lire l'article"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Bouton Lien</label>
                                    <input
                                        type="text"
                                        value={ctaLink}
                                        onChange={(e) => setCtaLink(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none"
                                        placeholder="https://dropsiders.com/..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Scrollable */}
                    <div className="bg-checkered border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                        <div className="bg-dark-bg border-b border-white/10 p-4 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                                <Eye className="w-4 h-4 text-neon-purple" />
                                Aperçu en direct
                            </h2>
                            <div className="flex bg-white/5 rounded-lg p-1">
                                <button
                                    onClick={() => setPreviewMode('desktop')}
                                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${previewMode === 'desktop' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                                >
                                    Desktop
                                </button>
                                <button
                                    onClick={() => setPreviewMode('mobile')}
                                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${previewMode === 'mobile' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                                >
                                    Mobile
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-900 overflow-y-auto p-8 flex justify-center">
                            <div
                                className={`bg-white transition-all duration-300 shadow-2xl ${previewMode === 'mobile' ? 'w-[375px]' : 'w-[600px]'} min-h-[600px]`}
                                dangerouslySetInnerHTML={{ __html: generateHTML() }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
