import { useState, useEffect } from 'react';
import { Mail, Inbox, Send, Trash2, RefreshCcw, Search, ArrowLeft, User, Globe, Archive, Plus, X } from 'lucide-react';
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
        <div className="flex items-center gap-5 mb-6">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-neon-red to-red-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-14 h-14 bg-black rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden">
                    <img src="/logo_presentation.png" alt="Dropsiders" className="w-full h-full object-contain p-2" />
                </div>
            </div>
            <div>
                <p className="text-base font-black text-white uppercase tracking-[0.2em] italic leading-none mb-1">
                    Direction <span className="text-neon-red">Dropsiders</span>
                </p>
                <div className="flex flex-col">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Official Media Portal</p>
                    <p className="text-[8px] font-black text-neon-red/60 uppercase tracking-[0.15em] animate-pulse">2026 Season • Worldwide</p>
                </div>
            </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
            <a
                href="https://dropsiders.fr/#/kit-media"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 transition-all hover:bg-white/[0.08] hover:border-neon-red/50 hover:shadow-lg hover:shadow-neon-red/5 group/km"
            >
                <div className="w-8 h-8 rounded-full bg-neon-red/10 flex items-center justify-center group-hover/km:scale-110 transition-transform">
                    <Globe className="w-4 h-4 text-neon-red" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Kit Média Presse</span>
                    <span className="text-[7px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                        Code Privé : <span className="text-neon-red font-black tracking-widest">{password}</span>
                    </span>
                </div>
            </a>

            <div className="flex items-center gap-4 ml-2">
                <div className="w-1 h-10 bg-gradient-to-b from-neon-red/50 to-transparent rounded-full opacity-50"></div>
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] hover:text-neon-red transition-colors cursor-pointer">Dropsiders.fr</p>
                    <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-neon-red opacity-80 shadow-[0_0_8px_#ff0000]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white opacity-20"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white opacity-20"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const parseAndCleanEmail = (raw: string) => {
    if (!raw) return '';
    let content = raw;

    // Detect if it's a multipart message and extract the HTML part
    if (content.includes('Content-Type: text/html')) {
        const parts = content.split(/Content-Type: text\/html/i);
        content = parts[parts.length - 1];

        // Remove trailing boundaries
        if (content.includes('--')) {
            content = content.split(/--[A-Za-z0-9'()+ ,./:?=-]+--/)[0];
        }

        // Clean up headers remaining in the block
        content = content.replace(/^.*?\r?\n\r?\n/s, '');
    }

    // Decode quoted-printable properly
    if (content.includes('=3D') || content.includes('=\r\n') || content.includes('=\n')) {
        // Remove soft line breaks (encoded as = at end of line)
        content = content.replace(/=\r?\n/g, '').replace(/=\n/g, '');

        // Replace =XX with the actual character
        content = content.replace(/=([A-Fa-f0-9]{2})/g, (_match, hex) => {
            const charCode = parseInt(hex, 16);
            return String.fromCharCode(charCode);
        });
    }

    // Isolate HTML payload if needed
    if (content.toLowerCase().includes('<html')) {
        const htmlStart = content.toLowerCase().indexOf('<html');
        const htmlEnd = content.toLowerCase().lastIndexOf('</html>');
        if (htmlEnd !== -1) {
            content = content.slice(htmlStart, htmlEnd + 7);
        } else {
            content = content.slice(htmlStart);
        }
    }

    // Ensure we have a valid HTML structure for the iframe
    if (!content.toLowerCase().includes('<html')) {
        content = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { 
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                            line-height: 1.6; 
                            color: #eee; 
                            background: transparent;
                            margin: 0;
                            padding: 20px;
                        }
                        a { color: #ff4d4d; }
                        img { max-width: 100%; height: auto; }
                    </style>
                </head>
                <body>${content}</body>
            </html>
        `;
    } else if (!content.toLowerCase().includes('<body')) {
        // If it has <html> but no <body>, wrap it
        content = content.replace(/<html[^>]*>/i, '$&<body style="background:transparent; color:#eee; font-family:sans-serif; padding:20px;">').replace(/<\/html>/i, '</body>$0');
    }


    return content;
};

export function AdminEmails() {
    const navigate = useNavigate();
    const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'archive' | 'trash'>('inbox');
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const [composeData, setComposeData] = useState({ from: 'contact', to: '', subject: '', content: '' });
    const [isSending, setIsSending] = useState(false);
    const [emails, setEmails] = useState<{ [key: string]: Email[] }>({});

    useEffect(() => {
        handleRefresh();
    }, [activeFolder]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch(`/api/emails/list?account=contact&folder=${activeFolder}`);
            if (res.ok) {
                const data = await res.json();
                setEmails(prev => ({ ...prev, [activeFolder]: data.emails }));
            }
        } catch {
            console.error('Refresh failed');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleEmailAction = async (action: 'archive' | 'trash' | 'delete' | 'star', emailId: string) => {
        if (action === 'star') {
            handleStarToggle(emailId);
            return;
        }

        try {
            const res = await fetch('/api/emails/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    emailId,
                    fromFolder: activeFolder,
                    toFolder: action === 'archive' ? 'archive' : (action === 'trash' ? 'trash' : null),
                    account: 'contact'
                })
            });

            if (res.ok) {
                handleRefresh();
                if (selectedEmail?.id === emailId) setSelectedEmail(null);
            }
        } catch {
            console.error('Action failed');
        }
    };

    const handleStarToggle = async (emailId: string) => {
        setSelectedEmail(prev => prev ? { ...prev, starred: !prev.starred } : null);
        setEmails(prev => {
            const newEmailsState = { ...prev };
            const key = activeFolder;
            if (newEmailsState[key]) {
                const idx = newEmailsState[key].findIndex(e => e.id === emailId);
                if (idx !== -1) {
                    newEmailsState[key] = [...newEmailsState[key]];
                    newEmailsState[key][idx] = { ...newEmailsState[key][idx], starred: !newEmailsState[key][idx].starred };
                }
            }

            return newEmailsState;
        });
    };

    const handleEmptyTrash = async () => {
        if (!confirm('Voulez-vous vraiment vider la corbeille ?')) return;
        try {
            await fetch('/api/emails/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'empty_trash', fromFolder: 'trash', account: 'contact' })
            });
            handleRefresh();
            setSelectedEmail(null);
        } catch {
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
                    account: 'contact'
                })
            });
            if (!res.ok) throw new Error('Failed to send');

            setIsComposing(false);
            setComposeData({ from: 'contact', to: '', subject: '', content: '' });
            alert('Message envoyé avec succès !');
            if (activeFolder === 'sent') handleRefresh();
        } catch {
            alert('Erreur lors de l\'envoi');
        } finally {
            setIsSending(false);
        }
    };

    const currentEmails = emails[activeFolder] || [];

    const filteredEmails = currentEmails.filter(email =>
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (email.from?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (email.fromName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (email.to?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-screen bg-dark-bg flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col h-full w-full">
                {/* Header Studio Style */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8 bg-black/20 border-b border-white/5">
                    <div className="flex items-center gap-4 md:gap-6">
                        <button
                            onClick={() => navigate('/admin')}
                            className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 transition-all group"
                        >
                            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                Centre <span className="text-neon-red">Messages</span>
                            </h1>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Console de Direction • Dropsiders</p>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Opérateur</span>
                            <span className="text-[9px] font-bold text-neon-red uppercase tracking-widest">Admin Dropsiders</span>
                        </div>
                        <div className="w-12 h-12 bg-neon-red/10 rounded-2xl flex items-center justify-center border border-neon-red/20 shadow-lg shadow-neon-red/10">
                            <User className="w-5 h-5 text-neon-red" />
                        </div>
                    </div>
                </div>

                {/* Main Interface */}
                <div className="bg-white/[0.02] border-t border-white/5 flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

                    {/* Sidebar Navigation */}
                    <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 p-6 space-y-8 overflow-y-auto no-scrollbar">
                        <button
                            onClick={() => {
                                setComposeData({ from: 'contact', to: '', subject: '', content: '' });
                                setIsComposing(true);
                            }}
                            className="w-full py-4 bg-neon-red text-white font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-lg shadow-neon-red/20 active:scale-95 text-xs flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Nouveau Message
                        </button>

                        <div className="space-y-2">
                            <button
                                onClick={() => setActiveFolder('inbox')}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeFolder === 'inbox' ? 'bg-neon-red/10 border border-neon-red/20 text-neon-red' : 'text-gray-500 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Inbox className="w-4 h-4" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Boîte de réception</span>
                                </div>
                                {activeFolder === 'inbox' && (
                                    <span className="bg-neon-red text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                        {filteredEmails.filter(e => !e.read).length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveFolder('sent')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeFolder === 'sent' ? 'bg-neon-red/10 border border-neon-red/20 text-neon-red' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Send className="w-4 h-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Envoyés</span>
                            </button>
                            <button
                                onClick={() => setActiveFolder('archive')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeFolder === 'archive' ? 'bg-neon-red/10 border border-neon-red/20 text-neon-red' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Archive className="w-4 h-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Archives</span>
                            </button>
                            <button
                                onClick={() => setActiveFolder('trash')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeFolder === 'trash' ? 'bg-neon-red/10 border border-neon-red/20 text-neon-red' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Corbeille</span>
                            </button>
                        </div>
                    </div>

                    {/* Email List / Reader */}
                    <div className="flex-1 flex flex-col min-w-0 h-full">
                        {/* Toolbar */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between gap-4 bg-black/40">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un message..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white outline-none focus:border-neon-red transition-all font-medium"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    className={`p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-neon-red transition-all ${isRefreshing ? 'animate-spin text-neon-red' : ''}`}
                                    title="Rafraîchir"
                                >
                                    <RefreshCcw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            {/* List View */}
                            <div className={`w-full md:w-80 lg:w-96 border-r border-white/5 overflow-y-auto no-scrollbar flex-shrink-0 bg-black/20 ${selectedEmail ? 'hidden lg:block' : 'block'}`}>
                                {filteredEmails.length > 0 ? (
                                    filteredEmails.map((email) => (
                                        <button
                                            key={email.id}
                                            onClick={() => setSelectedEmail(email)}
                                            className={`w-full text-left p-6 border-b border-white/5 transition-all relative group ${!email.read ? 'bg-neon-red/[0.03]' : 'hover:bg-white/[0.02]'} ${selectedEmail?.id === email.id ? 'bg-neon-red/[0.08] border-r-2 border-r-neon-red' : ''}`}
                                        >
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

                            <div className={`flex-1 overflow-y-auto overflow-x-hidden bg-black/40 ${!selectedEmail ? 'hidden md:flex items-center justify-center' : 'flex flex-col'}`}>
                                {selectedEmail ? (
                                    <div className="p-4 lg:p-8">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-gradient-to-br from-neon-red to-red-900 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-neon-red/20 uppercase">
                                                    {(selectedEmail.fromName || selectedEmail.to || 'D')[0]}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-xl font-bold text-white">{selectedEmail.fromName || selectedEmail.from}</h3>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                            {new Date(selectedEmail.date).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <h2 className="text-2xl font-display font-black text-white italic tracking-tight mb-8">
                                            {selectedEmail.subject}
                                        </h2>

                                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-gray-300 leading-relaxed font-medium">
                                            <div className="whitespace-pre-wrap break-words">{selectedEmail.content}</div>
                                            <EmailSignature password="2026" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-6">
                                        <Mail className="w-12 h-12 text-gray-500 mx-auto" />
                                        <p className="text-gray-500 uppercase font-black tracking-widest text-[10px]">Sélectionnez un message</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compose Modal Simplified */}
                {isComposing && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-dark-bg border border-white/10 rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <h3 className="text-lg font-display font-black text-white uppercase italic">Nouveau Message</h3>
                                <button onClick={() => setIsComposing(false)} className="text-gray-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
                                <input
                                    required
                                    type="email"
                                    value={composeData.to}
                                    onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-red"
                                    placeholder="À :"
                                />
                                <input
                                    required
                                    type="text"
                                    value={composeData.subject}
                                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-red"
                                    placeholder="Sujet :"
                                />
                                <textarea
                                    required
                                    rows={8}
                                    value={composeData.content}
                                    onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-neon-red resize-none"
                                    placeholder="Message..."
                                />
                                <button
                                    type="submit"
                                    disabled={isSending}
                                    className="w-full py-4 bg-neon-red text-white font-black uppercase tracking-widest rounded-xl hover:bg-neon-red/80 transition-all disabled:opacity-50"
                                >
                                    {isSending ? 'Envoi...' : 'Envoyer'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminEmails;
