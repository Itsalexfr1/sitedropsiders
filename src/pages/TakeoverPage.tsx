import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Globe, Mail, Youtube, MessageSquare, Trash2, ShieldAlert, X, Clock, Users, Shield, Pencil, List, Maximize2, Minimize2, Instagram, Music2, Facebook, Twitter, Power, Smile, Activity, HelpCircle } from 'lucide-react';

interface TakeoverProps {
    settings: {
        youtubeId: string;
        chat_enabled: boolean;
        enabled: boolean;
        title: string;
        moderators?: string;
        lineup?: string;
        tickerType?: 'news' | 'planning' | 'custom';
        tickerText?: string;
        tickerLink?: string;
        tickerBgColor?: string;
        tickerTextColor?: string;
        showTopBanner?: boolean;
        showTickerBanner?: boolean;
    };
}

export function TakeoverPage({ settings }: TakeoverProps) {
    const [viewersCount, setViewersCount] = useState(0);
    const [showLineup, setShowLineup] = useState(false);
    const [showVideoEdit, setShowVideoEdit] = useState(false);
    const [newVideoId, setNewVideoId] = useState(settings.youtubeId);
    const [isJoined, setIsJoined] = useState(() => {
        const auth = localStorage.getItem('admin_auth') === 'true';
        if (auth) return true;
        return localStorage.getItem('chat_joined') === 'true';
    });

    const [editTitle, setEditTitle] = useState(settings.title);
    const [displayTitle, setDisplayTitle] = useState(settings.title);
    const [editLineup, setEditLineup] = useState(settings.lineup || '');
    const [displayLineup, setDisplayLineup] = useState(settings.lineup || '');

    // Sync with props when they change (e.g. from parent polling or settings update)
    useEffect(() => {
        setDisplayTitle(settings.title);
        setEditTitle(settings.title);
        setDisplayLineup(settings.lineup || '');
        setEditLineup(settings.lineup || '');
        setNewVideoId(settings.youtubeId);
    }, [settings.title, settings.lineup, settings.youtubeId]);
    const [isSaving, setIsSaving] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'planning' | 'mods' | 'bot' | 'ticker' | 'moderation'>('general');
    const [isLocalBanned, setIsLocalBanned] = useState(false);
    const [banTimestamp, setBanTimestamp] = useState<number | null>(null);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [pseudo, setPseudo] = useState(() => {
        const auth = localStorage.getItem('admin_auth') === 'true';
        if (auth) return localStorage.getItem('admin_user')?.toUpperCase() || 'ADMIN';
        return localStorage.getItem('chat_pseudo') || '';
    });

    useEffect(() => {
        const banned = localStorage.getItem('chat_banned') === 'true';
        const timestamp = localStorage.getItem('chat_ban_timestamp');
        if (banned) {
            setIsLocalBanned(true);
            if (timestamp) setBanTimestamp(parseInt(timestamp));
        }
    }, []);

    const handleUnbanRequest = async () => {
        if (!banTimestamp) return;
        const now = Date.now();
        const tenMinutes = 10 * 60 * 1000;
        if (now - banTimestamp < tenMinutes) {
            const remaining = Math.ceil((tenMinutes - (now - banTimestamp)) / 60000);
            alert(`Vous devez attendre encore ${remaining} minutes avant de pouvoir faire une demande.`);
            return;
        }

        try {
            const response = await fetch('/api/chat/unban-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pseudo: pseudo.toUpperCase(),
                    email,
                    timestamp: banTimestamp
                })
            });
            if (response.ok) {
                alert("Votre demande a été envoyée avec succès.");
            } else {
                alert("Erreur lors de l'envoi de la demande.");
            }
        } catch (err) {
            alert("Erreur de connexion.");
        }
    };
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [email, setEmail] = useState('');
    const [country, setCountry] = useState(() => {
        const auth = localStorage.getItem('admin_auth') === 'true';
        if (auth) return 'FR';
        return '';
    });
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [latestNews, setLatestNews] = useState<any[]>([]);



    // Ticker Settings
    const [tickerType, setTickerType] = useState<'news' | 'planning' | 'custom'>(settings.tickerType || 'news');
    const [tickerText, setTickerText] = useState(settings.tickerText || '');
    const [tickerLink, setTickerLink] = useState(settings.tickerLink || '');
    const [tickerBgColor, setTickerBgColor] = useState(settings.tickerBgColor || '#ff0033');
    const [tickerTextColor, setTickerTextColor] = useState(settings.tickerTextColor || '#ffffff');
    const [showTopBanner, setShowTopBanner] = useState(settings.showTopBanner ?? true);
    const [showTickerBanner, setShowTickerBanner] = useState(settings.showTickerBanner ?? true);

    // Collapsible Chat
    const [showUsersPanel, setShowUsersPanel] = useState(true);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
    const [captchaA] = useState(Math.floor(Math.random() * 10) + 1);
    const [captchaB] = useState(Math.floor(Math.random() * 10) + 1);
    const [captchaAnswer, setCaptchaAnswer] = useState('');

    const [lineupTime, setLineupTime] = useState("");
    const [lineupArtist, setLineupArtist] = useState("");
    const [lineupStage, setLineupStage] = useState("");
    const [lineupFestival, setLineupFestival] = useState("");

    const [isSlowMode, setIsSlowMode] = useState(false);
    const [activePoll, setActivePoll] = useState<{ question: string, options: string[], id: number } | null>(null);
    const [shazamLoading, setShazamLoading] = useState(false);

    const [slowModeDuration] = useState(10);
    const [lastMessageTime, setLastMessageTime] = useState(0);
    const [shazamResult, setShazamResult] = useState<{ title: string, artist: string, image?: string, spotify?: string } | null>(null);
    const [showShazamNotify, setShowShazamNotify] = useState(false);

    const [promotedModos, setPromotedModos] = useState<string[]>(() => {
        return JSON.parse(localStorage.getItem('chat_promoted_modos') || '[]');
    });

    const [activeUsers] = useState<{ pseudo: string, country: string }[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [userColor, setUserColor] = useState(() => localStorage.getItem('chat_color') || '#ffffff');

    const getAuthHeaders = () => {
        const password = localStorage.getItem('admin_password') || '';
        const username = localStorage.getItem('admin_user') || 'alex';
        const sessionId = localStorage.getItem('admin_session_id') || '';
        return {
            'Content-Type': 'application/json',
            'X-Admin-Password': password,
            'X-Admin-Username': username,
            'X-Session-ID': sessionId
        };
    };

    const [shopProducts, setShopProducts] = useState<any[]>([]);
    const [showShopWidget, setShowShopWidget] = useState(false);
    const [recentShazams, setRecentShazams] = useState<string[]>([]);
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);

    // Dynamic Video List (if comma separated in settings)
    const videoList = settings.youtubeId?.split(',').map(id => id.trim()) || [];
    const currentVideoId = videoList[activeVideoIndex] || videoList[0];

    useEffect(() => {
        fetch('/api/shop')
            .then(res => res.json())
            .then(data => setShopProducts(data.slice(0, 10)))
            .catch(() => { });
    }, []);

    // Fetch messages from server every 3 seconds
    useEffect(() => {
        const fetchMessages = () => {
            fetch(`/api/chat/messages?channel=${currentVideoId}`)
                .then(res => res.ok ? res.json() : [])
                .then(data => {
                    if (Array.isArray(data)) {
                        setMessages(data);

                        // Detect poll from dropsiders
                        const latestPollMsg = [...data].reverse().find(m => m.pseudo === 'DROPSIDERS' && m.message.startsWith('📊 SONDAGE :'));
                        const latestStopPollMsg = [...data].reverse().find(m => m.pseudo === 'DROPSIDERS' && m.message === '🛑 SONDAGE TERMINÉ');

                        if (latestPollMsg && (!latestStopPollMsg || latestPollMsg.id > latestStopPollMsg.id)) {
                            const lines = latestPollMsg.message.split('\n');
                            const question = lines[0].replace('📊 SONDAGE : ', '').trim();
                            const options = lines.slice(1).filter((l: string) => /^\d+\./.test(l)).map((l: string) => l.replace(/^\d+\.\s*/, '').trim());
                            if (activePoll?.id !== latestPollMsg.id) {
                                setActivePoll({ question, options, id: latestPollMsg.id });
                            }
                        } else {
                            setActivePoll(null);
                        }

                        // Auto-scroll
                        const chatContainer = document.getElementById('chat-messages');
                        if (chatContainer) {
                            const isAtBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100;
                            if (isAtBottom) {
                                setTimeout(() => { chatContainer.scrollTop = chatContainer.scrollHeight; }, 50);
                            }
                        }
                    }
                })
                .catch(() => { });
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [currentVideoId]);

    const getCountryFlag = (c: string) => {
        if (!c) return <Globe className="w-3.5 h-3.5 text-gray-500" />;
        const code = c.toUpperCase().trim();
        let isoId = 'fr';
        if (code === 'FRANCE' || code === 'FR') isoId = 'fr';
        else if (code === 'BELGIQUE' || code === 'BE') isoId = 'be';
        else if (code === 'SUISSE' || code === 'CH') isoId = 'ch';
        else if (code === 'CANADA' || code === 'CA') isoId = 'ca';
        else if (code === 'USA' || code === 'US' || code === 'ÉTATS-UNIS') isoId = 'us';
        else if (code === 'UK' || code === 'ANGLETERRE') isoId = 'gb';
        else if (code === 'ESPAGNE' || code === 'ES') isoId = 'es';
        else if (code === 'ITALIE' || code === 'IT') isoId = 'it';
        else if (code === 'ALLEMAGNE' || code === 'DE') isoId = 'de';
        else return <Globe className="w-3.5 h-3.5 text-gray-500" />;

        return (
            <img
                src={`https://flagcdn.com/w40/${isoId}.png`}
                alt={code}
                className="w-4 h-auto rounded-[2px] shadow-sm border border-white/10"
            />
        );
    };

    const adminPermissions = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
    const hasTakeoverModoPerm = adminPermissions.includes('takeover_modo') || adminPermissions.includes('all');

    const adminUser = localStorage.getItem('admin_user')?.toUpperCase() || '';
    const isAdmin = localStorage.getItem('admin_auth') === 'true' || pseudo === 'DROPSIDERS' || pseudo === adminUser;
    const isModo = settings.moderators?.split(',').map(s => s.trim().toUpperCase()).includes(pseudo?.toUpperCase() || '') || hasTakeoverModoPerm || promotedModos.includes(pseudo.toUpperCase());
    const hasModPowers = isAdmin || isModo;

    const getRole = (name: string) => {
        if (name === 'DROPSIDERS' || name === adminUser) return 'admin';
        if (settings.moderators?.split(',').map(s => s.trim().toUpperCase()).includes(name.toUpperCase())) return 'modo';
        if (promotedModos.includes(name.toUpperCase())) return 'modo';
        return 'user';
    };

    // Ping every 20s to count real viewers (per channel)
    useEffect(() => {
        const pingId = isJoined ? pseudo.toUpperCase() : ('anon-' + Math.random().toString(36).substr(2, 6));
        const doPing = () => {
            fetch('/api/chat/ping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pseudo: pingId, channel: currentVideoId })
            })
                .then(r => r.ok ? r.json() : null)
                .then(data => { if (data?.count !== undefined) setViewersCount(data.count); })
                .catch(() => { });
        };
        doPing();
        const interval = setInterval(doPing, 20000);
        return () => clearInterval(interval);
    }, [isJoined, pseudo, currentVideoId]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.overscrollBehavior = 'auto';
        };
    }, []);

    useEffect(() => {
        // Fetch Latest News
        fetch('/api/news')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Filter out interviews, keep only regular news
                    const filteredData = data.filter(item =>
                        !item.category.toLowerCase().includes('interview') &&
                        !item.title.toLowerCase().includes('interview')
                    );
                    setLatestNews(filteredData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20));
                }
            })
            .catch(console.error);
    }, []);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Security check
        if (!isAdmin && parseInt(captchaAnswer) !== captchaA + captchaB) {
            alert("Erreur de sécurité : addition incorrecte. Veuillez prouver que vous êtes un humain.");
            return;
        }

        if (pseudo && email && country) {
            setIsJoined(true);
            localStorage.setItem('chat_joined', 'true');
            localStorage.setItem('chat_pseudo', pseudo.toUpperCase());
            localStorage.setItem('chat_color', userColor);

            if (subscribeNewsletter) {
                try {
                    await fetch('/api/newsletter/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, name: pseudo })
                    });
                } catch (err) {
                    console.error('Failed to subscribe:', err);
                }
            }

            // --- BOT WELCOME ---
            fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pseudo: 'Dropsiders Bot',
                    message: `👋 Bienvenue dans le chat @${pseudo.toUpperCase()} ! Profite bien du live sur ce flux ! 🔥`,
                    country: 'FR',
                    isBot: true,
                    color: '#00ffcc',
                    channel: currentVideoId
                })
            });
        }
    };

    const appendLineup = () => {
        if (!lineupTime || !lineupArtist) return;
        const newEntry = `[${lineupTime}] ${lineupArtist}${lineupStage ? ' - ' + lineupStage : ''}${lineupFestival ? ' - ' + lineupFestival : ''}`;
        setEditLineup(prev => prev ? prev.trim() + '\n' + newEntry : newEntry);
        setLineupTime(""); setLineupArtist(""); setLineupStage(""); setLineupFestival("");
    };

    const handleSendPoll = () => {
        if (!pollQuestion) return;
        let msg = `📊 SONDAGE : ${pollQuestion}\n`;
        msg += pollOptions.filter(o => o.trim()).map((o, i) => `${i + 1}. ${o}`).join('\n');
        msg += "\n(Répondez avec le chiffre correspondant dans le chat)";

        const password = localStorage.getItem('admin_password') || '';
        const username = localStorage.getItem('admin_user') || 'alex';
        const sessionId = localStorage.getItem('admin_session_id') || '';

        fetch('/api/chat/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Password': password,
                'X-Admin-Username': username,
                'X-Session-ID': sessionId
            },
            body: JSON.stringify({
                pseudo: 'DROPSIDERS',
                message: msg,
                country: 'FR',
                color: '#ff0033',
                channel: currentVideoId
            })
        });
        setPollQuestion("");
        setPollOptions(["", ""]);
    };

    const handleStopPoll = async () => {
        if (!activePoll) return;
        const password = localStorage.getItem('admin_password') || '';
        const username = localStorage.getItem('admin_user') || 'alex';
        const sessionId = localStorage.getItem('admin_session_id') || '';

        // Optional: you can just send a flag message or delete the message
        await fetch('/api/chat/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Password': password,
                'X-Admin-Username': username,
                'X-Session-ID': sessionId
            },
            body: JSON.stringify({
                pseudo: 'DROPSIDERS',
                message: '🛑 SONDAGE TERMINÉ',
                country: 'FR',
                color: '#ff0033',
                channel: currentVideoId
            })
        });
        setActivePoll(null);
    };

    const processBotCommand = async (command: string) => {
        const cmd = command.toLowerCase().trim();
        let response = '';

        if (cmd === '!help') {
            response = "🤖 Commandes disponibles : \n!help - Liste des commandes\n!lineup - Voir le programme\n!shop - Accéder à la boutique\n!shazam - Identifier la musique\n!news - Dernières actus\n!id - ID du live\n!vote - Comment voter";
        } else if (cmd === '!lineup' || cmd === '!planning') {
            const items = parseLineup(displayLineup || settings.lineup || '');
            if (items.length > 0) {
                response = "📅 PROGRAMME : \n" + items.map(i => `• ${i.time} : ${i.artist}`).join('\n');
            } else {
                response = "📅 Pas de planning disponible pour le moment.";
            }
        } else if (cmd === '!shop') {
            response = "🛒 Retrouvez tout notre merchandising sur la boutique officielle : https://dropsiders.com/shop";
        } else if (cmd === '!id') {
            response = `🎥 ID Vidéo actuelle : ${newVideoId}`;
        } else if (cmd === '!news') {
            if (latestNews.length > 0) {
                response = `🗞️ DERNIÈRE MINUTE : ${latestNews[0].title} - À lire sur le site !`;
            } else {
                response = "🗞️ Pas de nouvelles actus pour l'instant.";
            }
        } else if (cmd === '!shazam') {
            response = "🔍 Laisse moi écouter... Ah ! C'est sûrement un banger de Dropsiders ! Appuie sur le bouton 🎵 pour une identification précise.";
        } else if (cmd === '!vote') {
            response = "📊 Pour voter au sondage actuel, envoie simplement le chiffre correspondant à ton choix dans le chat (ex: 1, 2, 3...)";
        } else if (cmd.includes('merci bot') || cmd.includes('cool bot')) {
            response = "🥰 Je t'en prie ! Toujours là pour vous servir !";
        }

        if (response) {
            // Wait a small bit for realism
            setTimeout(async () => {
                await fetch('/api/chat/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pseudo: 'Dropsiders Bot',
                        message: response,
                        country: 'FR',
                        isBot: true,
                        color: '#00ffcc',
                        channel: currentVideoId
                    })
                });
            }, 800);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        if (isSlowMode && !hasModPowers) {
            const now = Date.now();
            if (now - lastMessageTime < (slowModeDuration * 1000)) {
                alert(`Le mode lent est activé. Veuillez patienter ${slowModeDuration} secondes entre chaque message.`);
                return;
            }
            setLastMessageTime(now);
        }

        setIsSending(true);
        const msgText = newMessage;
        setNewMessage('');

        // Link blocking logic
        const hasLinks = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9]+\.[a-z]{2,})/i.test(msgText);
        if (hasLinks && !hasModPowers) {
            // Auto-block and notify
            setTimeout(async () => {
                await fetch('/api/chat/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pseudo: 'Dropsiders Bot',
                        message: `🚫 @${pseudo.toUpperCase()}, les liens ne sont autorisés que pour les modérateurs et administrateurs.`,
                        country: 'FR',
                        isBot: true,
                        color: '#00ffcc'
                    })
                });
            }, 500);
            setIsSending(false);
            return;
        }

        if (msgText.startsWith('!')) {
            await processBotCommand(msgText);
        }

        try {
            await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pseudo: pseudo.toUpperCase(),
                    country: country || 'FR',
                    message: msgText,
                    color: userColor,
                    channel: currentVideoId
                })
            });
        } catch (e) {
            console.error('Failed to send message', e);
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!hasModPowers) return;
        setMessages(prev => prev.filter(m => m.id !== id)); // optimistic update
        try {
            await fetch('/api/chat/delete', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id, channel: currentVideoId })
            });
        } catch (e) {
            console.error('Failed to delete message', e);
        }
    };

    const handleShazam = async () => {
        if (shazamLoading) return;
        setShazamLoading(true);

        try {
            // Capture audio from the tab
            const stream = await (navigator.mediaDevices as any).getDisplayMedia({
                video: { displaySurface: 'browser' },
                audio: true,
                systemAudio: 'include'
            } as any);

            const audioTrack = stream.getAudioTracks()[0];
            if (!audioTrack) {
                stream.getTracks().forEach((t: any) => t.stop());
                throw new Error("Aucun flux audio détecté");
            }

            // Record 8 seconds
            const recorder = new MediaRecorder(new MediaStream([audioTrack]));
            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: recorder.mimeType });
                stream.getTracks().forEach((t: any) => t.stop());

                // Prepare form data for AudD
                const formData = new FormData();
                formData.append('file', blob);
                formData.append('api_token', '0707d622c51645acc2e4fa26ed64538d');
                formData.append('return', 'spotify');

                try {
                    const res = await fetch('https://api.audd.io/', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await res.json();

                    if (data.status === 'success' && data.result) {
                        setShazamResult({
                            title: data.result.title,
                            artist: data.result.artist,
                            image: data.result.spotify?.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop",
                            spotify: data.result.spotify?.external_urls?.spotify || "https://open.spotify.com"
                        });
                        setShowShazamNotify(true);

                        // Auto hide after 12s
                        setTimeout(() => setShowShazamNotify(false), 12000);
                    } else {
                        alert("Désolé, je n'ai pas réussi à identifier ce morceau. 😕");
                    }
                } catch (err) {
                    console.error("Shazam API Error", err);
                    alert("Erreur de connexion au service d'identification.");
                } finally {
                    setShazamLoading(false);
                }
            };

            recorder.start();
            setTimeout(() => {
                if (recorder.state === 'recording') recorder.stop();
            }, 8000);

        } catch (err: any) {
            console.error("Shazam Capture Error", err);
            setShazamLoading(false);
            if (err.name !== 'NotAllowedError') {
                alert("Erreur Shazam : " + (err.message || "Capture impossible"));
            }
        }
    };



    const handlePromote = async (name: string) => {
        if (!promotedModos.includes(name.toUpperCase())) {
            const newModos = [...promotedModos, name.toUpperCase()];
            setPromotedModos(newModos);
            localStorage.setItem('chat_promoted_modos', JSON.stringify(newModos));

            // Also add to permanent settings
            const currentMods = (settings.moderators || '').split(',').map(m => m.trim()).filter(m => m);
            if (!currentMods.map(m => m.toLowerCase()).includes(name.toLowerCase())) {
                const updatedMods = [...currentMods, name].join(',');
                await handleUpdateSettings({ moderators: updatedMods });
            }

            // Notify in chat
            await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pseudo: 'Dropsiders Bot',
                    message: `🛡️ @${name.toUpperCase()} a été promu modérateur du chat par un administrateur !`,
                    country: 'FR',
                    isBot: true,
                    color: '#00ffcc'
                })
            });
        }
    };

    const allActiveUsers = [
        ...(isJoined ? [{ pseudo: pseudo, country: country || 'FR' }] : []),
        ...messages.map(m => ({ pseudo: m.pseudo, country: m.country })),
        ...activeUsers
    ].filter((v, i, a) => a.findIndex(t => (t.pseudo === v.pseudo)) === i)
        .sort((a, b) => {
            const roleA = getRole(a.pseudo);
            const roleB = getRole(b.pseudo);
            // Admins first, then Modos, then users
            const weightA = roleA === 'admin' ? 3 : roleA === 'modo' ? 2 : 1;
            const weightB = roleB === 'admin' ? 3 : roleB === 'modo' ? 2 : 1;
            if (weightA !== weightB) return weightB - weightA;
            return a.pseudo.localeCompare(b.pseudo);
        });

    const handleUpdateSettings = async (updates: Partial<TakeoverProps['settings']>) => {
        setIsSaving(true);
        try {
            // First get full current settings
            const res = await fetch('/api/settings');
            if (res.ok) {
                const currentSettings = await res.json();
                const newSettings = {
                    ...currentSettings,
                    takeover: {
                        ...currentSettings.takeover,
                        ...updates,
                        tickerType: updates.tickerType ?? tickerType,
                        tickerText: updates.tickerText ?? tickerText,
                        tickerLink: updates.tickerLink ?? tickerLink,
                        tickerBgColor: updates.tickerBgColor ?? tickerBgColor,
                        tickerTextColor: updates.tickerTextColor ?? tickerTextColor,
                        showTopBanner: updates.showTopBanner ?? showTopBanner,
                        showTickerBanner: updates.showTickerBanner ?? showTickerBanner
                    }
                };

                const saveRes = await fetch('/api/settings/update', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(newSettings)
                });

                if (saveRes.ok) {
                    setShowEditModal(false);
                    setShowVideoEdit(false);
                    setDisplayTitle(updates.title || editTitle);
                    if (updates.lineup !== undefined) setDisplayLineup(updates.lineup);
                    if (updates.youtubeId) setNewVideoId(updates.youtubeId);
                    // Update the settings object reference if possible, though local states are safer here
                }
            }
        } catch (err) {
            console.error('Failed to update settings', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveModerator = async (modPseudo: string) => {
        const currentMods = (settings.moderators || '').split(',').map(m => m.trim()).filter(m => m && m.toLowerCase() !== modPseudo.toLowerCase());
        const newMods = currentMods.join(',');
        await handleUpdateSettings({ moderators: newMods });
    };

    const handleAddModerator = async (modPseudo: string) => {
        if (!modPseudo.trim()) return;
        const currentMods = (settings.moderators || '').split(',').map(m => m.trim()).filter(m => m);
        if (currentMods.map(m => m.toLowerCase()).includes(modPseudo.trim().toLowerCase())) return;
        const newMods = [...currentMods, modPseudo.trim()].join(',');
        await handleUpdateSettings({ moderators: newMods });
    };

    const isUserOnline = (pseudo: string) => {
        return allActiveUsers.some(u => u.pseudo.toLowerCase() === pseudo.toLowerCase());
    };

    const parseLineup = (text: string) => {
        if (!text) return [];
        return text.split('\n').filter(line => line.trim()).map(line => {
            // Support formats: 
            // 1. [22:00] Artist - Stage - Event
            // 2. 22:00 | Artist | Stage | Event
            let time = '', artist = '', stage = '', festival = '';

            const timeMatch = line.match(/\[(.*?)\]/);
            if (timeMatch) {
                time = timeMatch[1];
                const rest = line.replace(timeMatch[0], '').trim();
                // Split by dash if it's surrounded by spaces or at least exists
                const parts = rest.split(/\s*[\-\|\–\—]\s*/).map(p => p.trim());
                artist = parts[0] || '';
                stage = parts[1] || '';
                festival = parts[2] || '';
            } else if (line.includes('|')) {
                const parts = line.split('|').map(p => p.trim());
                time = parts[0] || '';
                artist = parts[1] || '';
                stage = parts[2] || '';
                festival = parts[3] || '';
            } else {
                artist = line.trim();
            }

            return { time, artist, stage, festival };
        });
    };

    const handleShare = async (platform: 'x' | 'fb' | 'insta' | 'snap' | 'native') => {
        const url = window.location.href;
        const text = `Je regarde ${editTitle} sur Dropsiders ! 🚀`;

        if (platform === 'native' || navigator.share && (platform === 'insta' || platform === 'snap')) {
            try {
                await navigator.share({
                    title: 'Dropsiders Live',
                    text: text,
                    url: url
                });
                return;
            } catch (err) {
                console.log('Share failed or cancelled');
            }
        }

        const encodedUrl = encodeURIComponent(url);
        const encodedText = encodeURIComponent(text);

        if (platform === 'x') window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
        else if (platform === 'fb') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
        else if (platform === 'insta') window.open(`https://www.instagram.com/`, '_blank'); // Instagram doesn't have a direct share link for web stories, but we open the app
        else if (platform === 'snap') window.open(`https://www.snapchat.com/`, '_blank');
    };

    const handleCutLive = async () => {
        if (!window.confirm('Voulez-vous vraiment désactiver le LIVE ?')) return;
        try {
            const response = await fetch('/api/settings/takeover', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ enabled: false })
            });
            if (response.ok) {
                window.location.reload();
            }
        } catch (e) {
            console.error('Failed to cut live', e);
        }
    };

    return (
        <div className={`fixed ${isFocusMode ? 'top-0' : 'top-[70px] lg:top-32'} left-0 right-0 bottom-0 flex flex-col bg-black overflow-hidden z-[50] transition-all duration-500`}>
            {/* Live Banner Header */}
            {!isFocusMode && (
                <div className="w-full bg-[#111] border-b border-white/10 px-6 py-4 flex items-center justify-between z-20 shadow-2xl shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 border border-red-500/30 rounded-full shrink-0">
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                            <span className="text-xs font-black text-red-500 uppercase tracking-widest">EN DIRECT</span>
                        </div>
                        <div className="w-px h-5 bg-white/20 hidden sm:block" />
                        <h1 className="text-lg md:text-2xl font-display font-black text-white uppercase italic tracking-widest truncate max-w-[200px] md:max-w-none">
                            {displayTitle}
                        </h1>

                        {/* Multi-Video Switcher */}
                        {videoList.length > 1 && (
                            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                                {videoList.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveVideoIndex(idx)}
                                        className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black transition-all ${activeVideoIndex === idx ? 'bg-neon-red text-white' : 'text-gray-500 hover:bg-white/10'}`}
                                    >
                                        CAM {idx + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            {isAdmin && (
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="p-1.5 bg-white/5 hover:bg-neon-red/20 border border-white/10 hover:border-neon-red/30 rounded-lg text-gray-400 hover:text-neon-red transition-all shrink-0"
                                    title="Modifier le Live"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (showLineup) {
                                        setShowLineup(false);
                                    } else {
                                        setShowVideoEdit(false);
                                        setShowLineup(true);
                                    }
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${showLineup ? 'bg-neon-red text-white border-neon-red' : 'bg-white/5 border-white/10 text-gray-400 hover:text-neon-red hover:border-neon-red/30 animate-glow'}`}
                            >
                                <List className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Planning</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-md">
                            <button
                                onClick={() => handleShare('x')}
                                className="p-1.5 px-2 hover:bg-white/10 rounded-lg text-white transition-all flex items-center gap-1.5"
                                title="Partager sur X"
                            >
                                <Twitter className="w-4 h-4" />
                            </button>
                            <div className="w-px h-3 bg-white/20" />
                            <button
                                onClick={() => handleShare('fb')}
                                className="p-1.5 px-2 hover:bg-white/10 rounded-lg text-white transition-all flex items-center gap-1.5"
                                title="Partager sur Facebook"
                            >
                                <Facebook className="w-4 h-4" />
                            </button>
                            <div className="w-px h-3 bg-white/20" />
                            <button
                                onClick={() => handleShare('insta')}
                                className="p-1.5 px-2 hover:bg-white/10 rounded-lg text-white transition-all flex items-center gap-1.5"
                                title="Partager sur Instagram"
                            >
                                <Instagram className="w-4 h-4" />
                            </button>
                            <div className="w-px h-3 bg-white/20" />
                            <button
                                onClick={() => handleShare('snap')}
                                className="p-1.5 px-2 hover:bg-white/10 rounded-lg text-white transition-all flex items-center gap-1.5"
                                title="Partager sur Snapchat"
                            >
                                <Music2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-full shrink-0 backdrop-blur-md self-center lg:self-auto">
                        <Users className="w-3 h-3 text-neon-red shadow-[0_0_8px_rgba(255,0,0,0.5)]" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-white uppercase tracking-widest leading-none">
                                {viewersCount > 0 ? viewersCount.toLocaleString('fr-FR') : (activeUsers.length || '...')}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-black gap-0">
                {/* Video Section */}
                <div className="flex-shrink-0 lg:flex-1 w-full lg:w-auto bg-black flex flex-col lg:justify-center relative border-b lg:border-b-0 lg:border-r border-white/10 group">
                    <div className="w-full aspect-video lg:aspect-auto lg:h-full bg-black">
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1&mute=1&rel=0&modestbranding=1&enablejsapi=1`}
                            title={settings.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>

                        {/* Multi-Channel Switcher */}
                        {videoList.length > 1 && (
                            <div className="absolute top-6 left-6 z-30 flex flex-col gap-2">
                                <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 flex flex-col gap-1 shadow-2xl">
                                    <p className="text-[7px] font-black text-gray-500 uppercase tracking-[0.2em] px-2 mb-1">Flux Disponibles</p>
                                    {videoList.map((id, idx) => (
                                        <button
                                            key={id}
                                            onClick={() => setActiveVideoIndex(idx)}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all group ${activeVideoIndex === idx ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,0,51,0.3)]' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                        >
                                            <div className="relative">
                                                <div className={`w-2 h-2 rounded-full ${activeVideoIndex === idx ? 'bg-white animate-pulse' : 'bg-gray-600'}`} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Channel {idx + 1}</span>
                                            {activeVideoIndex === idx && <div className="ml-auto w-1 h-3 bg-white/30 rounded-full" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Active Poll Overlay */}
                        <AnimatePresence>
                            {activePoll && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="absolute bottom-24 lg:bottom-16 left-4 lg:left-8 z-30 w-[250px] lg:w-[320px] bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl"
                                >
                                    <h3 className="text-[10px] lg:text-xs font-black text-white uppercase italic tracking-widest mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-neon-red animate-pulse" />
                                        Sondage en cours
                                    </h3>
                                    <p className="text-[11px] font-bold text-white mb-4">{activePoll.question}</p>
                                    <div className="space-y-2">
                                        {activePoll.options.map((opt, i) => {
                                            const totalVotes = messages.filter(m => /^[1-9][0-9]*$/.test(m.message.trim())).length;
                                            const optVotes = messages.filter(m => m.message.trim() === String(i + 1)).length;
                                            const percentage = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={async () => {
                                                        if (!isJoined) return alert("Rejoignez le chat pour voter !");
                                                        setNewMessage(String(i + 1));
                                                        // Auto send vote
                                                        await fetch('/api/chat/messages', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                pseudo: pseudo.toUpperCase(),
                                                                country: country || 'FR',
                                                                message: String(i + 1),
                                                                color: userColor
                                                            })
                                                        });
                                                        setNewMessage('');
                                                    }}
                                                    className="w-full relative h-10 group/vote bg-white/5 hover:bg-white/10 rounded-xl overflow-hidden flex items-center px-4 border border-white/5 hover:border-neon-red/30 transition-all duration-300"
                                                >
                                                    <div className="absolute left-0 top-0 bottom-0 bg-neon-red/20 transition-all duration-700 ease-out" style={{ width: `${percentage}%` }} />
                                                    <span className="relative z-10 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                                                        <span className="w-5 h-5 flex items-center justify-center bg-black/40 rounded-md text-gray-400 group-hover/vote:text-neon-red transition-colors">{i + 1}</span>
                                                        {opt}
                                                    </span>
                                                    <span className="relative z-10 text-[11px] font-black text-neon-red ml-auto drop-shadow-[0_0_5px_rgba(255,0,51,0.5)]">{percentage}%</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <p className="text-[7px] text-gray-400 uppercase tracking-widest mt-3 text-center">Répondez avec le chiffre - Ex: 1</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Mini Planning Widget (Bottom Right) */}
                        <AnimatePresence>
                            {showLineup && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                    className="absolute inset-x-4 top-4 bottom-4 lg:inset-x-12 lg:top-12 lg:bottom-12 z-30 bg-black/30 backdrop-blur-2xl border border-white/20 rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
                                        <div className="p-6 lg:p-10 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-neon-red/10 rounded-2xl border border-neon-red/20">
                                                    <List className="w-6 h-6 text-neon-red" />
                                                </div>
                                                <div>
                                                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">LINE UP <span className="text-neon-red">LIVE</span></h2>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Horaires et passages artistes en temps réel</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setShowLineup(false)} className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors">
                                                <X className="w-6 h-6 text-gray-400" />
                                            </button>
                                        </div>

                                        <div className="p-6 lg:p-10 space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                            {/* Header Grid */}
                                            <div className="grid grid-cols-[100px_2fr_1.5fr_1.5fr] gap-6 px-6 mb-4 text-[11px] font-black text-gray-600 uppercase tracking-widest hidden lg:grid">
                                                <div>HEURE</div>
                                                <div>ARTISTE</div>
                                                <div>SCÈNE / STAGE</div>
                                                <div className="text-right">ÉVÉNEMENT</div>
                                            </div>

                                            {parseLineup(displayLineup || settings.lineup || '').map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="group grid grid-cols-[100px_2fr] lg:grid-cols-[100px_2fr_1.5fr_1.5fr] gap-6 items-center bg-white/[0.03] border border-white/[0.03] hover:border-neon-red/40 hover:bg-white/5 p-4 lg:p-6 rounded-2xl transition-all duration-300"
                                                >
                                                    {/* Time Column */}
                                                    <div className="flex flex-col lg:block">
                                                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter block mb-1 lg:hidden">HEURE</span>
                                                        <span className="text-neon-red font-black text-[16px] lg:text-[18px] tracking-tighter">
                                                            {item.time?.replace(':', 'H') || '--H--'}
                                                        </span>
                                                    </div>

                                                    {/* Artist Column */}
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter block mb-1 lg:hidden">ARTISTE</span>
                                                        <h3 className="text-white font-black uppercase italic tracking-widest text-[16px] lg:text-[20px] leading-tight group-hover:text-neon-red transition-colors">
                                                            {item.artist || '---'}
                                                        </h3>
                                                    </div>

                                                    {/* Stage Column */}
                                                    <div className="flex flex-col min-w-0 lg:block">
                                                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter block mb-1 lg:hidden">STAGE</span>
                                                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider leading-none">
                                                            {item.stage || '---'}
                                                        </span>
                                                    </div>

                                                    {/* Festival Column */}
                                                    <div className="flex flex-col min-w-0 text-right lg:block">
                                                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter block mb-1 lg:hidden">EVENT</span>
                                                        <span className="text-[11px] font-black text-white uppercase tracking-widest italic leading-none bg-neon-red/10 px-4 py-2 rounded-xl border border-neon-red/20 inline-block shadow-[0_0_15px_rgba(255,0,51,0.1)]">
                                                            {item.festival || 'DROPSIDERS LIVE'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {parseLineup(editLineup || settings.lineup || '').length === 0 && (
                                                <div className="py-12 text-center">
                                                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] italic">
                                                        PROGRAMME À VENIR
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Admin: Change Video popover */}
                        <AnimatePresence>
                            {showVideoEdit && isAdmin && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#111] border border-white/20 rounded-2xl p-4 shadow-2xl w-80"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">YouTube ID ou URL</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newVideoId}
                                            onChange={e => setNewVideoId(e.target.value.split('v=').pop()?.split('&')[0] || e.target.value)}
                                            placeholder="dQw4w9WgXcQ"
                                            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-neon-red outline-none"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleUpdateSettings({ youtubeId: newVideoId })}
                                            disabled={isSaving}
                                            className="px-4 py-2 bg-neon-red text-white rounded-xl text-xs font-black hover:bg-neon-red/80 transition-all disabled:opacity-50"
                                        >
                                            {isSaving ? '...' : 'OK'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <button
                                onClick={handleShazam}
                                disabled={shazamLoading}
                                className={`flex items-center gap-3 px-6 py-3 bg-black/80 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all backdrop-blur-md shadow-2xl active:scale-95 group ${shazamLoading ? 'border-neon-cyan' : 'hover:bg-neon-cyan hover:border-neon-cyan/50'}`}
                            >
                                <Music2 className={`w-4 h-4 text-neon-cyan group-hover:text-white ${shazamLoading ? 'animate-spin' : ''}`} />
                                {shazamLoading ? "Écoute en cours..." : "Shazam"}
                            </button>
                            <button
                                onClick={() => setIsFocusMode(!isFocusMode)}
                                className="flex items-center gap-3 px-6 py-3 bg-black/80 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-neon-red transition-all backdrop-blur-md shadow-2xl active:scale-95 group"
                                title={isFocusMode ? "Quitter le mode Focus" : "Mode Focus (Plein Écran)"}
                            >
                                {isFocusMode ? <Minimize2 className="w-4 h-4 text-neon-red group-hover:text-white" /> : <Maximize2 className="w-4 h-4 text-neon-red group-hover:text-white" />}
                                {isFocusMode ? "Quitter" : "Focus"}
                            </button>
                        </div>

                        {/* Shazam Notification Overlay */}
                        <AnimatePresence>
                            {showShazamNotify && shazamResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: -50, x: '-50%' }}
                                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                                    exit={{ opacity: 0, y: -50, x: '-50%' }}
                                    className="absolute top-8 left-1/2 z-[45] w-[320px] lg:w-[400px] bg-black/40 backdrop-blur-3xl border border-white/20 rounded-3xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-neon-cyan animate-pulse" />
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-16 h-16 shrink-0 aspect-square rounded-2xl overflow-hidden border border-white/10">
                                            <img src={shazamResult.image} className="w-full h-full object-cover" alt="Track" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <Music2 className="w-6 h-6 text-neon-cyan drop-shadow-[0_0_8px_#00ffff]" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black text-neon-cyan uppercase tracking-widest mb-1">Musique Identifiée</p>
                                            <h4 className="text-white font-black text-sm uppercase italic truncate tracking-tight">{shazamResult.title}</h4>
                                            <p className="text-gray-400 font-bold text-[10px] uppercase truncate">{shazamResult.artist}</p>
                                        </div>
                                        <button
                                            onClick={() => setShowShazamNotify(false)}
                                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                        >
                                            <X className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <a
                                            href={shazamResult.spotify || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-[#1DB954] border border-white/10 hover:border-transparent rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all group"
                                        >
                                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.508 17.302c-.223.367-.714.484-1.077.262-2.92-1.785-6.598-2.185-10.932-1.192-.418.093-.83-.173-.923-.591-.093-.418.173-.83.591-.923 4.743-1.085 8.79-.619 12.079 1.388.367.22.484.71.262 1.056zm1.47-3.253c-.282.458-.883.6-1.341.32-3.34-2.053-8.432-2.651-12.382-1.454-.515.156-1.054-.133-1.21-.649-.156-.516.133-1.054.649-1.21 4.512-1.368 10.125-.694 13.965 1.664.458.282.6.883.32 1.329zm.135-3.376C15.118 8.169 8.514 7.948 4.717 9.102c-.628.19-1.295-.162-1.485-.79-.19-.628.162-1.295.79-1.485 4.356-1.322 11.642-1.056 16.275 1.693.564.335.748 1.066.413 1.631-.335.564-1.067.747-1.632.413z" />
                                            </svg>
                                            Ouvrir Spotify
                                        </a>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Full Edit Modal Layer */}
                        <AnimatePresence>
                            {showEditModal && isAdmin && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/90 backdrop-blur-xl z-[40] p-4 lg:p-10 flex flex-col items-center overflow-y-auto custom-scrollbar"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="w-full max-w-4xl space-y-4 my-auto py-8"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Paramètres <span className="text-neon-red">LIVE</span></h2>
                                            <button onClick={() => setShowEditModal(false)} className="p-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors">
                                                <X className="w-5 h-5 text-white" />
                                            </button>
                                        </div>

                                        {/* Tabs Navigation */}
                                        <div className="flex border-b border-white/10 px-6 shrink-0 bg-white/[0.02] overflow-x-auto no-scrollbar">
                                            <button
                                                onClick={() => setActiveSettingsTab('general')}
                                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex-shrink-0 ${activeSettingsTab === 'general' ? 'text-neon-red' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Live / Vidéo
                                                {activeSettingsTab === 'general' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-red" />}
                                            </button>
                                            <button
                                                onClick={() => setActiveSettingsTab('ticker')}
                                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex-shrink-0 ${activeSettingsTab === 'ticker' ? 'text-neon-red' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Bandeau
                                                {activeSettingsTab === 'ticker' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-red" />}
                                            </button>
                                            <button
                                                onClick={() => setActiveSettingsTab('moderation')}
                                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex-shrink-0 ${activeSettingsTab === 'moderation' ? 'text-neon-red' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Modération
                                                {activeSettingsTab === 'moderation' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-red" />}
                                            </button>
                                            <button
                                                onClick={() => setActiveSettingsTab('planning')}
                                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex-shrink-0 ${activeSettingsTab === 'planning' ? 'text-neon-red' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Planning
                                                {activeSettingsTab === 'planning' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-red" />}
                                            </button>
                                            <button
                                                onClick={() => setActiveSettingsTab('mods')}
                                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex-shrink-0 ${activeSettingsTab === 'mods' ? 'text-neon-red' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Équipe
                                                {activeSettingsTab === 'mods' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-red" />}
                                            </button>
                                            <button
                                                onClick={() => setActiveSettingsTab('bot')}
                                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex-shrink-0 ${activeSettingsTab === 'bot' ? 'text-neon-red' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Bot
                                                {activeSettingsTab === 'bot' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-red" />}
                                            </button>
                                        </div>

                                        {/* Tab Content */}
                                        <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                                            {activeSettingsTab === 'general' && (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        <div className="space-y-4 bg-white/5 border border-white/5 p-4 lg:p-6 rounded-[2rem]">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="p-2 bg-neon-red/10 rounded-xl">
                                                                    <Activity className="w-4 h-4 text-neon-red" />
                                                                </div>
                                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Configuration <span className="text-neon-red">Affichage</span></h3>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Haut de Page (Logo/Menu)</label>
                                                                    <button
                                                                        onClick={() => setShowTopBanner(!showTopBanner)}
                                                                        className={`w-12 h-6 rounded-full p-1 transition-all ${showTopBanner ? 'bg-neon-red shadow-[0_0_15px_#ff003344]' : 'bg-gray-800'}`}
                                                                    >
                                                                        <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${showTopBanner ? 'translate-x-6' : 'translate-x-0'}`} />
                                                                    </button>
                                                                </div>
                                                                <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chat Actif</label>
                                                                    <button
                                                                        onClick={() => handleUpdateSettings({ chat_enabled: !settings.chat_enabled })}
                                                                        className={`w-12 h-6 rounded-full p-1 transition-all ${settings.chat_enabled ? 'bg-neon-cyan shadow-[0_0_15px_#00ffff44]' : 'bg-gray-800'}`}
                                                                    >
                                                                        <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${settings.chat_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4 bg-white/5 border border-white/5 p-4 lg:p-6 rounded-[2rem]">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="p-2 bg-neon-red/10 rounded-xl">
                                                                    <Youtube className="w-4 h-4 text-neon-red" />
                                                                </div>
                                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Paramètres <span className="text-neon-red">Média</span></h3>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Titre de l'événement</label>
                                                                    <input
                                                                        type="text"
                                                                        value={editTitle}
                                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                                        className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-red transition-all"
                                                                        placeholder="TITRE LIVE..."
                                                                    />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">IDs YouTube (séparés par des virgules)</label>
                                                                    <input
                                                                        type="text"
                                                                        value={newVideoId}
                                                                        onChange={(e) => setNewVideoId(e.target.value)}
                                                                        className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-red transition-all"
                                                                        placeholder="dQw4w9WgXcQ, abcdefghijk"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeSettingsTab === 'ticker' && (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    <div className="space-y-4 bg-white/5 border border-white/5 p-6 rounded-[2rem]">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-neon-red/10 rounded-xl">
                                                                    <Activity className="w-4 h-4 text-neon-red" />
                                                                </div>
                                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Bandeau <span className="text-neon-red">Défilant</span></h3>
                                                            </div>
                                                            <button
                                                                onClick={() => setShowTickerBanner(!showTickerBanner)}
                                                                className={`w-14 h-7 rounded-full p-1 transition-all flex items-center ${showTickerBanner ? 'bg-neon-red shadow-[0_0_15px_#ff003344] justify-end' : 'bg-gray-800 justify-start'}`}
                                                            >
                                                                <div className="w-5 h-5 rounded-full bg-white shadow-lg" />
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                            <div className="col-span-2 space-y-1.5">
                                                                <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Type de contenu</label>
                                                                <select
                                                                    value={tickerType}
                                                                    onChange={(e) => setTickerType(e.target.value as any)}
                                                                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-red cursor-pointer"
                                                                >
                                                                    <option value="news">📢 Actualités automatiques</option>
                                                                    <option value="planning">📅 Programme en cours</option>
                                                                    <option value="custom">✍️ Texte personnalisé</option>
                                                                </select>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Couleur Fond</label>
                                                                <div className="flex gap-2 items-center bg-black/40 border border-white/10 rounded-xl p-2 h-11">
                                                                    <input type="color" value={tickerBgColor} onChange={(e) => setTickerBgColor(e.target.value)} className="w-10 h-7 bg-transparent border-none cursor-pointer" />
                                                                    <span className="text-[9px] text-gray-400 font-mono uppercase truncate">{tickerBgColor}</span>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Couleur Texte</label>
                                                                <div className="flex gap-2 items-center bg-black/40 border border-white/10 rounded-xl p-2 h-11">
                                                                    <input type="color" value={tickerTextColor} onChange={(e) => setTickerTextColor(e.target.value)} className="w-10 h-7 bg-transparent border-none cursor-pointer" />
                                                                    <span className="text-[9px] text-gray-400 font-mono uppercase truncate">{tickerTextColor}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {tickerType === 'custom' && (
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Votre message</label>
                                                                    <input type="text" value={tickerText} onChange={(e) => setTickerText(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-red" placeholder="Texte à faire défiler..." />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Lien au clic (Optionnel)</label>
                                                                    <input type="text" value={tickerLink} onChange={(e) => setTickerLink(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-neon-red" placeholder="https://..." />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {activeSettingsTab === 'moderation' && (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        <div className="space-y-6 bg-white/5 border border-white/5 p-6 rounded-[2rem]">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-neon-red/10 rounded-xl">
                                                                    <ShieldAlert className="w-4 h-4 text-neon-red" />
                                                                </div>
                                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Outils de <span className="text-neon-red">Modération</span></h3>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                                                                    <div>
                                                                        <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
                                                                            <Clock className="w-3.5 h-3.5 text-yellow-500" /> Mode Lent
                                                                        </p>
                                                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest italic">Limite l'envoi de messages</p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setIsSlowMode(!isSlowMode)}
                                                                        className={`w-14 h-7 rounded-full p-1 transition-all flex items-center ${isSlowMode ? 'bg-yellow-500 shadow-[0_0_15px_#eab30844] justify-end' : 'bg-gray-800 justify-start'}`}
                                                                    >
                                                                        <div className="w-5 h-5 rounded-full bg-white shadow-lg" />
                                                                    </button>
                                                                </div>

                                                                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 mb-3">
                                                                        <Globe className="w-3.5 h-3.5 text-neon-cyan" /> Filtre de Liens
                                                                    </p>
                                                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Bloquer les liens externes</span>
                                                                        <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-[8px] font-black uppercase border border-green-500/20">Toujours Actif</span>
                                                                    </div>
                                                                    <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-2 italic px-1">* Seuls les modérateurs et l'administration peuvent envoyer des liens.</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-6 bg-white/5 border border-white/5 p-6 rounded-[2rem]">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-neon-red/10 rounded-xl">
                                                                    <HelpCircle className="w-4 h-4 text-neon-red" />
                                                                </div>
                                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Gestion <span className="text-neon-red">Sondage</span></h3>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Question</label>
                                                                    <input type="text" placeholder="Question du sondage..." value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-neon-red" />
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {pollOptions.map((opt, i) => (
                                                                        <input key={i} type="text" placeholder={`Option ${i + 1}`} value={opt} onChange={e => {
                                                                            const newOpts = [...pollOptions];
                                                                            newOpts[i] = e.target.value;
                                                                            setPollOptions(newOpts);
                                                                        }} className="w-full bg-black/20 border border-white/5 rounded-lg p-3 text-[10px] text-gray-300 outline-none focus:border-neon-red" />
                                                                    ))}
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-3 pt-2">
                                                                    <button onClick={handleSendPoll} className="py-3 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-xl text-[9px] font-black uppercase hover:bg-neon-cyan hover:text-black transition-all">Lancer</button>
                                                                    {activePoll && (
                                                                        <button onClick={handleStopPoll} className="py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Terminer</button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeSettingsTab === 'planning' && (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    <div className="bg-white/5 border border-white/5 p-5 rounded-3xl space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-xs font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                                <Pencil className="w-4 h-4 text-neon-red shadow-[0_0_10px_#ff003366]" /> Éditeur de Planning
                                                            </label>
                                                        </div>
                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                                            <input type="text" placeholder="Heure (ex: 22:00)" value={lineupTime} onChange={e => setLineupTime(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-neon-red font-bold uppercase transition-all" />
                                                            <input type="text" placeholder="Artiste" value={lineupArtist} onChange={e => setLineupArtist(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-neon-red font-bold uppercase transition-all" />
                                                            <input type="text" placeholder="Scène (Optionnel)" value={lineupStage} onChange={e => setLineupStage(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-neon-red font-bold uppercase transition-all" />
                                                            <input type="text" placeholder="Festival (Optionnel)" value={lineupFestival} onChange={e => setLineupFestival(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-neon-red font-bold uppercase transition-all" />
                                                            <button onClick={appendLineup} className="col-span-2 lg:col-span-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black hover:bg-neon-red text-white transition-all shadow-[0_0_15px_rgba(255,0,51,0.1)] hover:shadow-[0_0_20px_rgba(255,0,51,0.3)] active:scale-95">Ajouter au planning</button>
                                                        </div>
                                                        <textarea
                                                            value={editLineup}
                                                            onChange={(e) => setEditLineup(e.target.value)}
                                                            className="w-full h-[300px] bg-black/60 border border-white/10 rounded-2xl p-5 text-[11px] font-bold text-gray-200 outline-none focus:border-neon-red transition-all leading-relaxed custom-scrollbar font-mono"
                                                            placeholder="Format: [HEURE] ARTISTE - SCÈNE - ÉVÉNEMENT&#10;Exemple: [22:00] THE ROCKSTAR - MAIN STAGE - TOMORROWLAND"
                                                        />
                                                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center italic">Un artiste par ligne • Format: [HH:MM] Nom de l'artiste - Nom de la scène - Nom du festival</p>
                                                    </div>
                                                </div>
                                            )}

                                            {activeSettingsTab === 'mods' && (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    <div className="bg-white/5 border border-white/5 p-5 rounded-3xl space-y-4">
                                                        <label className="text-xs font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                            <Shield className="w-4 h-4 text-neon-red shadow-[0_0_10px_#ff003366]" /> Modérateurs Actuels
                                                        </label>
                                                        <div className="flex gap-2 mb-4">
                                                            <input
                                                                type="text"
                                                                id="add-mod-input"
                                                                placeholder="Pseudo du modérateur..."
                                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-neon-red transition-all"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        const input = e.currentTarget;
                                                                        handleAddModerator(input.value);
                                                                        input.value = '';
                                                                    }
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const input = document.getElementById('add-mod-input') as HTMLInputElement;
                                                                    handleAddModerator(input.value);
                                                                    if (input) input.value = '';
                                                                }}
                                                                className="px-4 py-2 bg-neon-red text-white text-[10px] font-black uppercase rounded-xl hover:bg-neon-red/80 transition-all"
                                                            >
                                                                Ajouter
                                                            </button>
                                                        </div>

                                                        <div className="space-y-2">
                                                            {settings.moderators?.split(',').filter(m => m.trim()).map(mod => (
                                                                <div key={mod} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl p-3 group hover:border-white/20 transition-all">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`w-1.5 h-1.5 rounded-full ${isUserOnline(mod.trim()) ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-600'}`} title={isUserOnline(mod.trim()) ? "En ligne" : "Hors ligne"} />
                                                                        <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest">{mod.trim()}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleRemoveModerator(mod.trim())}
                                                                        className="p-1.5 text-gray-600 hover:text-neon-red transition-colors"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {!settings.moderators?.trim() && <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center py-4 italic">Aucun modérateur configuré</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeSettingsTab === 'bot' && (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    <div className="bg-white/5 border border-white/5 p-5 rounded-3xl space-y-4">
                                                        <label className="text-xs font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                            <MessageSquare className="w-4 h-4 text-neon-red shadow-[0_0_10px_#ff003366]" /> Liste des Commandes
                                                        </label>
                                                        <div className="overflow-hidden border border-white/10 rounded-2xl">
                                                            <table className="w-full text-left border-collapse">
                                                                <thead>
                                                                    <tr className="bg-white/5">
                                                                        <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-white/10">Commande</th>
                                                                        <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-white/10">Description</th>
                                                                        <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-white/10 text-right">Statut</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="text-[10px] font-bold text-gray-300">
                                                                    <tr className="hover:bg-white/[0.02] transition-colors">
                                                                        <td className="px-4 py-3 border-b border-white/5 text-neon-red font-black">!help</td>
                                                                        <td className="px-4 py-3 border-b border-white/5 text-xs">Affiche la liste complète des commandes.</td>
                                                                        <td className="px-4 py-3 border-b border-white/5 text-right"><span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-[8px] uppercase">Actif</span></td>
                                                                    </tr>
                                                                    <tr className="hover:bg-white/[0.02] transition-colors">
                                                                        <td className="px-4 py-3 border-b border-white/5 text-neon-red font-black">!lineup</td>
                                                                        <td className="px-4 py-3 border-b border-white/5 text-xs">Affiche le programme actuel dans le chat.</td>
                                                                        <td className="px-4 py-3 border-b border-white/5 text-right"><span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-[8px] uppercase">Actif</span></td>
                                                                    </tr>
                                                                    <tr className="hover:bg-white/[0.02] transition-colors">
                                                                        <td className="px-4 py-3 border-b border-white/5 text-neon-red font-black">!shop</td>
                                                                        <td className="px-4 py-3 border-b border-white/5 text-xs">Envoie le lien direct vers la boutique.</td>
                                                                        <td className="px-4 py-3 border-b border-white/5 text-right"><span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-[8px] uppercase">Actif</span></td>
                                                                    </tr>
                                                                    <tr className="hover:bg-white/[0.02] transition-colors">
                                                                        <td className="px-4 py-3 border-b border-white/5 text-neon-red font-black">!news</td>
                                                                        <td className="px-4 py-3 border-b border-white/5 text-xs">Affiche le titre de la dernière actualité.</td>
                                                                        <td className="px-4 py-3 border-b border-white/5 text-right"><span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-[8px] uppercase">Actif</span></td>
                                                                    </tr>
                                                                    <tr className="hover:bg-white/[0.02] transition-colors">
                                                                        <td className="px-4 py-3 border-b border-white/5 text-neon-red font-black">!id</td>
                                                                        <td className="px-4 py-3 border-b border-white/5 text-xs">Partage l'ID de la vidéo actuelle.</td>
                                                                        <td className="px-4 py-3 border-b border-white/5 text-right"><span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-[8px] uppercase">Actif</span></td>
                                                                    </tr>
                                                                    <tr className="hover:bg-white/[0.02] transition-colors">
                                                                        <td className="px-4 py-3 border-b border-white/5 text-neon-red font-black">!shazam</td>
                                                                        <td className="px-4 py-3 border-b border-white/5 text-xs">Explique comment identifier le son.</td>
                                                                        <td className="px-4 py-3 border-b border-white/5 text-right"><span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-[8px] uppercase">Actif</span></td>
                                                                    </tr>
                                                                    <tr className="hover:bg-white/[0.02] transition-colors">
                                                                        <td className="px-4 py-3 border-b border-white/5 text-neon-red font-black">!vote</td>
                                                                        <td className="px-4 py-3 border-b border-white/5 text-xs">Aide pour participer aux sondages.</td>
                                                                        <td className="px-4 py-3 border-b border-white/5 text-right"><span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-[8px] uppercase">Actif</span></td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center italic">Ces commandes sont utilisables par tous les membres du chat.</p>

                                                        {recentShazams.length > 0 && (
                                                            <div className="mt-8 space-y-3">
                                                                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center italic">Dernières Identifications <span className="text-neon-cyan">Shazam</span></h4>
                                                                <div className="flex flex-wrap justify-center gap-2">
                                                                    {recentShazams.map((song, i) => (
                                                                        <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-gray-400">
                                                                            {song}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-6 grid grid-cols-2 gap-4 border-t border-white/10 mt-auto">
                                            <button
                                                onClick={() => handleUpdateSettings({
                                                    title: editTitle,
                                                    lineup: editLineup,
                                                    youtubeId: newVideoId,
                                                    tickerType,
                                                    tickerBgColor,
                                                    tickerTextColor,
                                                    tickerText,
                                                    tickerLink,
                                                    showTopBanner,
                                                    showTickerBanner
                                                })}
                                                disabled={isSaving}
                                                className="py-4 bg-neon-red text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-neon-red/80 transition-all shadow-xl shadow-neon-red/10 active:scale-[0.98] disabled:opacity-50"
                                            >
                                                {isSaving ? 'ENREGISTREMENT...' : 'SAUVEGARDER'}
                                            </button>
                                            <button
                                                onClick={handleCutLive}
                                                className="py-4 bg-black border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-white/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                            >
                                                <Power className="w-4 h-4 text-neon-red" />
                                                Couper Live
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Chat Section */}
                {settings.chat_enabled && (
                    <div className="flex-1 lg:w-[420px] lg:flex-none bg-[#080808] flex flex-col min-h-0 relative z-20 border-t lg:border-t-0 lg:border-l border-white/10">
                        {/* Glossy Header */}
                        <div className="p-3 lg:p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02] backdrop-blur-md relative z-10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neon-red/10 rounded-lg">
                                    <MessageSquare className="w-5 h-5 text-neon-red" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                        Chat en direct
                                        {isSlowMode && <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 text-[8px] font-black uppercase flex items-center gap-1 border border-yellow-500/30"><Clock className="w-2.5 h-2.5" /> Mode Lent</span>}
                                    </h2>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Spectateurs en direct</p>
                                </div>
                            </div>
                            {hasModPowers && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowShopWidget(!showShopWidget)}
                                        className={`p-2 rounded-lg transition-all ${showShopWidget ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}
                                        title="Boutique"
                                    >
                                        <Globe className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setIsSlowMode(!isSlowMode)}
                                        className={`p-2 rounded-lg transition-all ${isSlowMode ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}
                                        title={isSlowMode ? "Désactiver le mode lent" : "Activer le mode lent"}
                                    >
                                        <Clock className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Shop Widget Overlay (Inside Chat) */}
                        <AnimatePresence>
                            {showShopWidget && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-black/60 border-b border-white/10 overflow-hidden relative z-40"
                                >
                                    <div className="p-4 flex gap-4 overflow-x-auto no-scrollbar scroll-smooth">
                                        {shopProducts.map(p => (
                                            <a key={p.id} href={p.url || '/shop'} target="_blank" className="flex-shrink-0 w-32 bg-white/5 border border-white/10 rounded-xl p-2 group hover:border-neon-red/50 transition-all">
                                                <div className="aspect-square rounded-lg overflow-hidden mb-2 relative">
                                                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                    <span className="absolute bottom-1 right-1 text-[8px] font-black text-white bg-neon-red px-1.5 py-0.5 rounded">{p.price}€</span>
                                                </div>
                                                <p className="text-[8px] font-black text-white uppercase tracking-widest truncate">{p.name}</p>
                                            </a>
                                        ))}
                                    </div>
                                    <div className="absolute top-2 right-2 flex items-center gap-2">
                                        <span className="text-[7px] font-black text-neon-red bg-neon-red/10 px-2 py-0.5 rounded-full border border-neon-red/20 animate-pulse">DERNIERS ITEMS</span>
                                        <button onClick={() => setShowShopWidget(false)} className="p-1 hover:bg-white/10 rounded">
                                            <X className="w-3 h-3 text-gray-500" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex-1 flex flex-row min-h-0">
                            <div className="flex-1 flex flex-col min-h-0 relative z-10 w-full lg:w-[420px]">
                                {isLocalBanned ? (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black/40">
                                        <div className="w-20 h-20 bg-neon-red/10 border border-neon-red/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(255,0,0,0.1)]">
                                            <ShieldAlert className="w-10 h-10 text-neon-red" />
                                        </div>
                                        <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-2">Accès restreint</h3>
                                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed mb-8">
                                            Vous avez été banni du chat. Vous ne pouvez plus voir ou envoyer de messages.
                                        </p>
                                        <button
                                            onClick={handleUnbanRequest}
                                            className="px-8 py-4 bg-neon-red text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-neon-red/80 transition-all shadow-xl shadow-neon-red/20"
                                        >
                                            Demande de débannissement
                                        </button>
                                        <p className="mt-4 text-[9px] text-gray-600 font-bold uppercase">Disponible après 10 minutes</p>
                                    </div>
                                ) : (
                                    <AnimatePresence mode="wait">
                                        {!isJoined ? (
                                            <motion.div
                                                key="join-form"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="flex-1 p-8 flex flex-col justify-center relative z-10"
                                            >
                                                <div className="text-center mb-6 lg:mb-10">
                                                    <div className="w-12 h-12 lg:w-16 lg:h-16 bg-neon-red/10 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6 border border-neon-red/20 shadow-2xl shadow-neon-red/5">
                                                        <Youtube className="w-6 h-6 lg:w-8 lg:h-8 text-neon-red" />
                                                    </div>
                                                    <h3 className="text-lg lg:text-xl font-black text-white uppercase italic tracking-tighter">
                                                        Rejoindre le <span className="text-neon-red">Chat</span>
                                                    </h3>
                                                    <p className="text-[10px] lg:text-xs text-gray-500 font-bold uppercase tracking-widest mt-2 px-4 italic">Identifiez-vous pour participer en direct</p>
                                                </div>

                                                <form onSubmit={handleJoin} className="space-y-4 max-w-sm mx-auto w-full">
                                                    <div className="group relative">
                                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-red/50 transition-colors group-focus-within:text-neon-red" />
                                                        <input
                                                            type="text"
                                                            placeholder="PSEUDO"
                                                            required
                                                            value={pseudo}
                                                            onChange={(e) => setPseudo(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3 lg:py-4 pl-12 text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white focus:border-neon-red outline-none transition-all placeholder-gray-600 shadow-inner"
                                                        />
                                                    </div>

                                                    <div className="group relative">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-red/50 transition-colors group-focus-within:text-neon-red" />
                                                        <input
                                                            type="email"
                                                            placeholder="EMAIL"
                                                            required
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3 lg:py-4 pl-12 text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white focus:border-neon-red outline-none transition-all placeholder-gray-600 shadow-inner"
                                                        />
                                                    </div>

                                                    <div className="group relative">
                                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-red/50 transition-colors group-focus-within:text-neon-red" />
                                                        <input
                                                            type="text"
                                                            placeholder="PAYS"
                                                            required
                                                            value={country}
                                                            onChange={(e) => setCountry(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3 lg:py-4 pl-12 text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white focus:border-neon-red outline-none transition-all placeholder-gray-600 shadow-inner"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-3 lg:p-4">
                                                        <div className="flex-1">
                                                            <label className="text-[10px] lg:text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={subscribeNewsletter}
                                                                    onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                                                                    className="w-3.5 h-3.5 lg:w-4 lg:h-4 bg-black border border-white/20 rounded accent-neon-red cursor-pointer"
                                                                />
                                                                Newsletter
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {!isAdmin && (
                                                        <div className="group relative">
                                                            <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-red/50" />
                                                            <input
                                                                type="number"
                                                                placeholder={`${captchaA} + ${captchaB} ?`}
                                                                required
                                                                value={captchaAnswer}
                                                                onChange={(e) => setCaptchaAnswer(e.target.value)}
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3 lg:py-4 pl-12 text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white focus:border-neon-red outline-none transition-all placeholder-gray-600 shadow-inner"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Couleur de votre pseudo</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {['#ffffff', '#00ffcc', '#00ccff', '#ff00ff', '#ccff00', '#ff9900', '#9933ff', '#33ff33', '#ffffff', '#ff66aa'].filter(c => {
                                                                const r = parseInt(c.slice(1, 3), 16);
                                                                const g = parseInt(c.slice(3, 5), 16);
                                                                const b = parseInt(c.slice(5, 7), 16);
                                                                const isRed = r > 200 && g < 100 && b < 100;
                                                                const isYellow = r > 200 && g > 200 && b < 100;
                                                                return !isRed && !isYellow;
                                                            }).map(color => (
                                                                <button
                                                                    key={color}
                                                                    type="button"
                                                                    onClick={() => setUserColor(color)}
                                                                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${userColor === color ? 'border-white scale-110 shadow-[0_0_10px_white]' : 'border-transparent'}`}
                                                                    style={{ backgroundColor: color }}
                                                                />
                                                            ))}
                                                            <input
                                                                type="color"
                                                                value={userColor}
                                                                onChange={(e) => {
                                                                    const c = e.target.value;
                                                                    const r = parseInt(c.slice(1, 3), 16);
                                                                    const g = parseInt(c.slice(3, 5), 16);
                                                                    const b = parseInt(c.slice(5, 7), 16);
                                                                    const isRed = r > 200 && g < 100 && b < 100;
                                                                    const isYellow = r > 200 && g > 200 && b < 100;
                                                                    if (!isRed && !isYellow) setUserColor(c);
                                                                    else alert("Les couleurs rouge et jaune sont réservées à l'administration.");
                                                                }}
                                                                className="w-8 h-8 rounded-full bg-transparent border-none cursor-pointer p-0 overflow-hidden"
                                                            />
                                                        </div>
                                                    </div>

                                                    <button className="w-full py-4 lg:py-5 bg-neon-red text-white text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] rounded-xl lg:rounded-2xl hover:bg-neon-red/80 transition-all shadow-2xl shadow-neon-red/20 active:scale-95 group">
                                                        Rejoindre
                                                    </button>
                                                </form>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="chat-active"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex-1 flex flex-col min-h-0 relative z-10"
                                            >
                                                <div id="chat-messages" className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:y-6 scroll-smooth">
                                                    {messages.map((msg, idx) => {
                                                        const role = getRole(msg.pseudo);
                                                        const isMsgAdmin = role === 'admin';
                                                        const isMsgModo = role === 'modo';
                                                        const isBot = msg.isBot || msg.pseudo === 'Dropsiders Bot';

                                                        return (
                                                            <motion.div
                                                                key={msg.id || idx}
                                                                initial={{ opacity: 0, x: 10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: Math.min(idx * 0.05, 1) }}
                                                                className="group relative"
                                                            >
                                                                <div className="flex items-center gap-2 mb-1 px-1 truncate">
                                                                    <div className="w-4 flex items-center justify-center">
                                                                        {getCountryFlag(msg.country || 'FR')}
                                                                    </div>
                                                                    <span
                                                                        className="text-[10px] font-black uppercase tracking-widest"
                                                                        style={{ color: isBot ? '#00ffcc' : isMsgAdmin ? '#ff0033' : isMsgModo ? '#eab308' : (msg.color || '#9ca3af') }}
                                                                    >
                                                                        {msg.pseudo}
                                                                    </span>
                                                                    {isMsgAdmin && <span className="px-1.5 py-0.5 rounded bg-neon-red text-white text-[7px] font-black uppercase tracking-widest flex-shrink-0">Admin</span>}
                                                                    {isMsgModo && <span className="px-1.5 py-0.5 rounded bg-yellow-500 text-black text-[7px] font-black uppercase tracking-widest flex-shrink-0">Modo</span>}
                                                                    {isBot && <span className="px-1.5 py-0.5 rounded bg-neon-cyan text-black text-[7px] font-black uppercase tracking-widest flex-shrink-0">BOT</span>}
                                                                    <span className="text-[7px] text-gray-700 font-bold uppercase ml-auto">{msg.time}</span>
                                                                </div>
                                                                <div className={`p-3 rounded-xl text-xs leading-relaxed break-words relative overflow-hidden flex items-start justify-between gap-4 ${isBot ? 'bg-neon-cyan/10 border border-neon-cyan/20 text-[#00ffcc] shadow-[0_0_20px_rgba(0,255,150,0.05)]' : isMsgAdmin ? 'bg-neon-red/10 border border-neon-red/20 text-white' : isMsgModo ? 'bg-yellow-500/10 border border-yellow-500/20 text-white' : 'bg-white/5 border border-white/10 text-gray-300'}`}>
                                                                    <span className="relative z-10 font-medium whitespace-pre-wrap">{msg.message}</span>
                                                                    {hasModPowers && !isMsgAdmin && (
                                                                        <button
                                                                            onClick={() => handleDelete(msg.id)}
                                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-md text-gray-500 hover:text-white transition-all shrink-0 self-center"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Chat Input Bar */}
                                                <div className="p-4 bg-[#0a0a0a] border-t border-white/10">
                                                    <form onSubmit={handleSendMessage} className="relative group">
                                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-red via-neon-cyan to-neon-purple opacity-20 group-focus-within:opacity-40 blur-sm rounded-xl transition-opacity pointer-events-none" />
                                                        <div className="relative flex flex-col bg-black border border-white/10 rounded-xl overflow-hidden focus-within:border-neon-red/50 transition-all">
                                                            <div className="flex items-center bg-white/[0.02] border-b border-white/5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                                    className={`p-3 transition-all ${showEmojiPicker ? 'text-neon-red' : 'text-gray-500 hover:text-white'}`}
                                                                >
                                                                    <Smile className="w-4 h-4" />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={async () => {
                                                                        setShazamLoading(true);
                                                                        await new Promise(r => setTimeout(r, 2500));
                                                                        setShazamLoading(false);

                                                                        const items = parseLineup(displayLineup || settings.lineup || '');
                                                                        const now = new Date();
                                                                        const currentHour = now.getHours();
                                                                        const currentMin = now.getMinutes();

                                                                        const identified = items.find(item => {
                                                                            const [h, m] = (item.time || '').split(/[hH:]/).map(Number);
                                                                            return h === currentHour && Math.abs(currentMin - m) < 60;
                                                                        })?.artist || "Dropsiders Selection";

                                                                        setRecentShazams(prev => [identified, ...prev].slice(0, 5));
                                                                        setNewMessage(`🎵 Le titre actuel est identifié comme : ${identified} !`);
                                                                        window.open('shazam://', '_blank');
                                                                    }}
                                                                    className={`p-3 transition-all flex items-center gap-2 ${shazamLoading ? 'text-[#0088ff] animate-pulse' : 'text-gray-500 hover:text-[#0088ff]'}`}
                                                                >
                                                                    <Music2 className="w-4 h-4" />
                                                                    {shazamLoading && <span className="text-[8px] font-black uppercase tracking-widest">Identification...</span>}
                                                                </button>
                                                            </div>

                                                            <div className="flex items-center">
                                                                <input
                                                                    type="text"
                                                                    value={newMessage}
                                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                                    placeholder={isSlowMode && !hasModPowers ? "Mode Lent Activé..." : "Écrire un message..."}
                                                                    className="flex-1 bg-transparent px-4 py-3.5 text-xs text-white placeholder:text-gray-600 focus:outline-none"
                                                                />
                                                                <button
                                                                    type="submit"
                                                                    disabled={!newMessage.trim() || isSending}
                                                                    className="p-3.5 bg-neon-red text-white hover:bg-neon-red/80 disabled:opacity-30 disabled:grayscale transition-all"
                                                                >
                                                                    <Send className={`w-4 h-4 ${isSending ? 'animate-pulse' : ''}`} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </form>

                                                    {showEmojiPicker && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="mt-2 p-2 bg-black border border-white/10 rounded-xl grid grid-cols-8 lg:grid-cols-10 gap-1 shadow-2xl h-40 overflow-y-auto custom-scrollbar"
                                                        >
                                                            {['🔥', '🙌', '🚀', '❤️', '🤩', '💿', '💫', '💥', '✨', '⚡️', '🎹', '🎧', '🕺', '💃', '🎆', '🔊', '🎉', '💯', '🎶', '🎵', '😎', '🤪', '🤯', '🥳', '👑', '💎', '🖤', '👽', '👾', '🌍'].map(emoji => (
                                                                <button
                                                                    key={emoji}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setNewMessage(prev => prev + emoji);
                                                                        setShowEmojiPicker(false);
                                                                    }}
                                                                    className="p-2 hover:bg-white/10 rounded-lg text-lg transition-transform active:scale-90"
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>

                        {hasModPowers && (
                            <div className="hidden md:flex relative h-full items-center justify-center shrink-0 z-30">
                                <button
                                    onClick={() => setShowUsersPanel(!showUsersPanel)}
                                    className="absolute right-0 w-6 h-12 bg-white/5 hover:bg-white/10 border-y border-l border-white/10 rounded-l-md flex items-center justify-center transition-all group z-[100]"
                                >
                                    <div className={`w-1.5 h-1.5 border-b-2 border-r-2 border-white/50 group-hover:border-white transition-all transform ${showUsersPanel ? '-rotate-45' : 'rotate-135'}`} />
                                </button>
                            </div>
                        )}

                        <AnimatePresence>
                            {hasModPowers && showUsersPanel && (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 250, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    className="hidden md:flex flex-col bg-[#0a0a0a] border-l border-white/10 relative z-20 shrink-0 overflow-hidden"
                                >
                                    <div className="w-[250px] flex flex-col h-full">
                                        <div className="p-4 lg:p-6 border-b border-white/10 shrink-0 flex justify-between items-center bg-white/[0.02]">
                                            <h2 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                <Users className="w-4 h-4 text-neon-red" /> Utilisateurs
                                            </h2>
                                            <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full font-bold">{allActiveUsers.length}</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto">
                                            <div className="p-3 space-y-2">
                                                {allActiveUsers.map(u => {
                                                    const role = getRole(u.pseudo);
                                                    const isUserAdmin = role === 'admin';
                                                    const isUserModo = role === 'modo';

                                                    return (
                                                        <div key={u.pseudo} className="flex items-center justify-between group rounded-lg p-2 hover:bg-white/5 transition-colors">
                                                            <div className="flex items-center gap-2 truncate">
                                                                <div className="w-4 flex items-center justify-center">
                                                                    {getCountryFlag(u.country)}
                                                                </div>
                                                                <span className={`text-xs font-bold uppercase truncate max-w-[120px] ${isUserAdmin ? 'text-neon-red' : isUserModo ? 'text-yellow-500' : 'text-gray-300'}`}>
                                                                    {u.pseudo}
                                                                </span>
                                                            </div>
                                                            {isAdmin && !isUserAdmin && !isUserModo && pseudo !== u.pseudo && (
                                                                <button
                                                                    onClick={() => handlePromote(u.pseudo)}
                                                                    className="p-1 opacity-0 group-hover:opacity-100 xl:group-hover:opacity-100 hover:bg-neon-red/20 rounded-md text-gray-500 hover:text-neon-red transition-all"
                                                                    title="Promouvoir Modérateur Chat"
                                                                >
                                                                    <Shield className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {!isFocusMode && (
                <div
                    className="w-full h-12 shrink-0 flex items-center overflow-hidden border-t border-white/20 relative z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] group/ticker"
                    style={{ backgroundColor: tickerBgColor }}
                >
                    <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none" style={{ background: `linear-gradient(to right, ${tickerBgColor}, ${tickerBgColor}cc, transparent)` }} />
                    <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none" style={{ background: `linear-gradient(to left, ${tickerBgColor}, ${tickerBgColor}cc, transparent)` }} />

                    <div className="flex items-center absolute whitespace-nowrap animate-ticker group-hover/ticker:[animation-play-state:paused] py-2">
                        {tickerType === 'news' && (latestNews.length > 0 ? latestNews.concat(latestNews) : []).map((news, i) => (
                            <a
                                key={`${news.id}-${i}`}
                                href={`/news/${news.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center mx-8 shrink-0 hover:scale-105 transition-transform group"
                                style={{ color: tickerTextColor }}
                            >
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-black/20 px-2 py-0.5 rounded mr-3 border border-white/10">{news.category}</span>
                                <span className="text-[11px] font-black uppercase italic tracking-tighter group-hover:underline decoration-2 underline-offset-4">{news.title}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-white/40 ml-8 shadow-[0_0_8px_white]" />
                            </a>
                        ))}

                        {tickerType === 'planning' && parseLineup(displayLineup).concat(parseLineup(displayLineup)).map((item, i) => (
                            <div key={i} className="flex items-center mx-10 shrink-0" style={{ color: tickerTextColor }}>
                                <span className="text-[10px] font-black uppercase tracking-widest mr-3 opacity-60">[{item.time?.replace(':', 'H')}]</span>
                                <span className="text-[11px] font-black uppercase italic tracking-widest">{item.artist}</span>
                                <span className="mx-3 text-[9px] opacity-40">•</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#ffffff80]">{item.stage}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-white/20 ml-10 shadow-[0_0_5px_white]" />
                            </div>
                        ))}

                        {tickerType === 'custom' && [...Array(10)].map((_, i) => (
                            tickerLink ? (
                                <a
                                    key={i}
                                    href={tickerLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center mx-12 shrink-0 hover:scale-105 transition-transform"
                                    style={{ color: tickerTextColor }}
                                >
                                    <span className="text-[12px] font-black uppercase italic tracking-[0.2em]">{tickerText || 'VOTRE TEXTE ICI'}</span>
                                    <div className="w-2 h-2 rounded-full bg-white/30 ml-12" />
                                </a>
                            ) : (
                                <div key={i} className="flex items-center mx-12 shrink-0" style={{ color: tickerTextColor }}>
                                    <span className="text-[12px] font-black uppercase italic tracking-[0.2em]">{tickerText || 'VOTRE TEXTE ICI'}</span>
                                    <div className="w-2 h-2 rounded-full bg-white/30 ml-12" />
                                </div>
                            )
                        ))}

                        {tickerType === 'news' && latestNews.length === 0 && (
                            <div className="text-[10px] font-black uppercase italic tracking-[0.3em] text-white/80 mx-10 animate-pulse">
                                CHARGEMENT DU FIL D'ACTUALITÉ...
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-ticker {
                    animation: ticker 100s linear infinite;
                    width: max-content;
                }
                @keyframes glow {
                    0%, 100% { border-color: rgba(255, 0, 0, 0.3); box-shadow: 0 0 5px rgba(255, 0, 0, 0.1); }
                    50% { border-color: rgba(255, 0, 0, 0.8); box-shadow: 0 0 20px rgba(255, 0, 0, 0.4); }
                }
                .animate-glow {
                    animation: glow 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}

export default TakeoverPage;
