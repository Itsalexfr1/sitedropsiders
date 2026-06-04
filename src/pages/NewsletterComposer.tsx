import { useState, useEffect } from 'react';
import { Link, useBlocker } from 'react-router-dom';
import { AVAILABLE_COLORS } from '../data/colors';
import { getAuthHeaders } from '../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Copy, Eye, Type, Image as ImageIcon, Users, ArrowLeft, Music, Youtube, X, Bold, Italic, Plus, Zap, Calendar, Mic2, Trophy, RefreshCw } from 'lucide-react';
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

    // === NOUVELLES SECTIONS AUTOMATIQUES ===

    // Auto-News (2 à 5 dernières news)
    const [showAutoNews, setShowAutoNews] = useState(true);
    const [autoNewsCount, setAutoNewsCount] = useState(3);
    const [availableNews, setAvailableNews] = useState<any[]>([]);
    const [selectedAutoNews, setSelectedAutoNews] = useState<any[]>([]);

    // Agenda du mois
    const [showAgenda, setShowAgenda] = useState(true);
    const [agendaEvents, setAgendaEvents] = useState<any[]>([]);

    // 2 dernières Interviews
    const [showInterviews, setShowInterviews] = useState(true);
    const [interviews, setInterviews] = useState<any[]>([]);

    // Récaps d'events
    const [showRecaps, setShowRecaps] = useState(true);
    const [recaps, setRecaps] = useState<any[]>([]);

    // Top 3 uploads communauté
    const [showCommunityUploads, setShowCommunityUploads] = useState(true);
    const [communityUploads, setCommunityUploads] = useState<any[]>([]);

    // SECTION 2 : ÉTATS (INTERFACE)
    // -----------------------------------------------------------
    const [activeTab, setActiveTab] = useState<'main' | 'secondary' | 'media' | 'sections'>('main');
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [sending, setSending] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadTarget, setUploadTarget] = useState<'main' | 'news1' | 'news2' | null>(null);

    // Abonnés
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
                const response = await fetch('/api/subscribers', {
                    headers: getAuthHeaders(null)
                });
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        setSubscribersData(data);
                        const emails = data.map((sub: any) => sub.email || sub).filter(Boolean);
                        setSelectedSubscribers(emails);
                    }
                }
            } catch (error: any) {
                console.error('Erreur chargement abonnés:', error);
            }
        };
        fetchSubscribers();
    }, []);

    // Chargement des données automatiques
    useEffect(() => {
        // Charger les news disponibles
        const fetchNews = async () => {
            try {
                const res = await fetch('/api/news', { headers: getAuthHeaders(null) });
                if (res.ok) {
                    const data = await res.json();
                    const filtered = (Array.isArray(data) ? data : [])
                        .filter((n: any) => !n.isDraft)
                        .slice(0, 20);
                    setAvailableNews(filtered);
                    setSelectedAutoNews(filtered.slice(0, 3));
                }
            } catch (e) { console.error('Error fetching news:', e); }
        };

        // Charger l'agenda du mois
        const fetchAgenda = async () => {
            try {
                const res = await fetch('/api/agenda');
                if (res.ok) {
                    const data = await res.json();
                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();
                    const monthEvents = (Array.isArray(data) ? data : [])
                        .filter((e: any) => {
                            if (!e.date) return false;
                            const d = new Date(e.date);
                            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                        })
                        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .slice(0, 10);
                    setAgendaEvents(monthEvents);
                }
            } catch (e) { console.error('Error fetching agenda:', e); }
        };

        // Charger les interviews
        const fetchInterviews = async () => {
            try {
                const res = await fetch('/api/news', { headers: getAuthHeaders(null) });
                if (res.ok) {
                    const data = await res.json();
                    const list = (Array.isArray(data) ? data : [])
                        .filter((n: any) => {
                            const cat = (n.category || '').toLowerCase();
                            return (cat.includes('interview') || cat.includes('fast quizz') || cat.includes('drop & talk') || cat.includes('playlist')) && !n.isDraft;
                        })
                        .slice(0, 2);
                    setInterviews(list);
                }
            } catch (e) { console.error('Error fetching interviews:', e); }
        };

        // Charger les recaps
        const fetchRecaps = async () => {
            try {
                const res = await fetch('/api/recaps');
                if (res.ok) {
                    const data = await res.json();
                    setRecaps((Array.isArray(data) ? data : []).slice(0, 2));
                }
            } catch (e) { console.error('Error fetching recaps:', e); }
        };

        // Charger les uploads communauté
        const fetchCommunityUploads = async () => {
            try {
                const res = await fetch('/api/community-music?type=mix&limit=3');
                if (res.ok) {
                    const data = await res.json();
                    setCommunityUploads(Array.isArray(data) ? data.slice(0, 3) : []);
                }
            } catch (e) { console.error('Error fetching community uploads:', e); }
        };

        fetchNews();
        fetchAgenda();
        fetchInterviews();
        fetchRecaps();
        fetchCommunityUploads();
    }, []);

    // Mettre à jour selectedAutoNews quand autoNewsCount change
    useEffect(() => {
        setSelectedAutoNews(availableNews.slice(0, autoNewsCount));
    }, [autoNewsCount, availableNews]);

    // SECTION 4 : GÉNÉRATEUR HTML (Le cœur du système)
    // -----------------------------------------------------------
    const resolveImageForEmail = (url: string): string => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `https://dropsiders.fr${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const formatShortDate = (dateStr: string): string => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    };

    const getMonthName = (): string => {
        return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();
    };

    const generateHTML = (isPreview = false) => {
        const logoUrl = isPreview ? '/Logo.png' : 'https://dropsiders.fr/Logo.png';
        const fontStack = "'Helvetica Neue', Helvetica, Arial, sans-serif";

        const C = {
            bg: "#000000",
            card: "#111111",
            text: "#ffffff",
            textMuted: "#9ca3af",
            border: "#333333",
            accent: "#ff0033",
            success: "#00ff99",
            purple: "#bd00ff",
            cyan: "#00e5ff",
            yellow: "#ffcc00"
        };

        // === AUTO NEWS SECTION ===
        const autoNewsHtml = showAutoNews && selectedAutoNews.length > 0 ? `
        <!-- AUTO NEWS SECTION -->
        <div style="padding: 30px 30px 10px 30px; border-bottom: 1px solid ${C.border};">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                <div style="width: 4px; height: 20px; background: ${C.accent}; border-radius: 2px; display: inline-block;"></div>
                <span style="font-family: Impact, sans-serif; font-size: 13px; color: ${C.textMuted}; text-transform: uppercase; letter-spacing: 3px;">Dernières News</span>
            </div>
            ${selectedAutoNews.map((n: any) => `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px; background: #1a1a1a; border-radius: 10px; overflow: hidden; border: 1px solid ${C.border};">
                <tr>
                    ${n.image ? `<td width="110" valign="top" style="padding: 0;">
                        <img src="${resolveImageForEmail(n.image)}" alt="" width="110" style="display: block; width: 110px; height: 80px; object-fit: cover;">
                    </td>` : ''}
                    <td valign="top" style="padding: 12px 14px;">
                        <div style="font-size: 9px; color: ${C.accent}; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">${n.category || 'News'}</div>
                        <div style="font-family: Impact, Arial Black, sans-serif; font-size: 14px; color: ${C.text}; text-transform: uppercase; line-height: 1.2; margin-bottom: 7px;">${n.title}</div>
                        ${n.summary ? `<div style="font-size: 11px; color: ${C.textMuted}; line-height: 1.5; margin-bottom: 8px;">${(n.summary || '').substring(0, 110)}...</div>` : ''}
                        <a href="${n.link || 'https://dropsiders.fr/news'}" style="color: ${C.accent}; font-size: 10px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">Lire la suite &rarr;</a>
                    </td>
                </tr>
            </table>`).join('')}
        </div>` : '';

        // === AGENDA DU MOIS ===
        const agendaHtml = showAgenda && agendaEvents.length > 0 ? `
        <!-- AGENDA DU MOIS -->
        <div style="padding: 30px; border-bottom: 1px solid ${C.border}; background: #080808;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                <div style="width: 4px; height: 20px; background: ${C.cyan}; border-radius: 2px; display: inline-block;"></div>
                <span style="font-family: Impact, sans-serif; font-size: 13px; color: ${C.textMuted}; text-transform: uppercase; letter-spacing: 3px;">Agenda &middot; ${getMonthName()}</span>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${agendaEvents.map((e: any, i: number) => `
                <tr>
                    <td style="padding: 9px 0; border-bottom: 1px solid ${i < agendaEvents.length - 1 ? '#1f1f1f' : 'transparent'};">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td width="52" valign="middle">
                                    <div style="background: rgba(255,0,51,0.08); border: 1px solid rgba(255,0,51,0.25); border-radius: 8px; text-align: center; padding: 5px 3px;">
                                        <div style="font-family: Impact, sans-serif; font-size: 18px; font-weight: 900; color: ${C.accent}; line-height: 1;">${new Date(e.date).getDate()}</div>
                                        <div style="font-size: 8px; color: ${C.textMuted}; text-transform: uppercase; letter-spacing: 0.5px;">${new Date(e.date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}</div>
                                    </div>
                                </td>
                                <td style="padding-left: 14px;" valign="middle">
                                    <div style="font-size: 13px; font-weight: 800; color: ${C.text}; text-transform: uppercase;">${e.title}</div>
                                    <div style="font-size: 11px; color: ${C.textMuted}; margin-top: 2px;">${[e.location, e.country, e.type ? `<span style="color:${C.cyan};">${e.type}</span>` : ''].filter(Boolean).join(' &middot; ')}</div>
                                </td>
                                ${e.url ? `<td width="72" align="right" valign="middle">
                                    <a href="${e.url}" style="display: inline-block; padding: 5px 10px; background: rgba(255,0,51,0.12); border: 1px solid rgba(255,0,51,0.3); color: ${C.accent}; font-size: 9px; font-weight: 900; text-decoration: none; text-transform: uppercase; border-radius: 6px;">Infos</a>
                                </td>` : ''}
                            </tr>
                        </table>
                    </td>
                </tr>`).join('')}
            </table>
            <div style="text-align: center; margin-top: 16px;">
                <a href="https://dropsiders.fr/agenda" style="color: ${C.cyan}; font-size: 11px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">Voir tout l'agenda &rarr;</a>
            </div>
        </div>` : '';

        // === INTERVIEWS SECTION ===
        const interviewsHtml = showInterviews && interviews.length > 0 ? `
        <!-- INTERVIEWS SECTION -->
        <div style="padding: 30px; border-bottom: 1px solid ${C.border};">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                <div style="width: 4px; height: 20px; background: ${C.purple}; border-radius: 2px; display: inline-block;"></div>
                <span style="font-family: Impact, sans-serif; font-size: 13px; color: ${C.textMuted}; text-transform: uppercase; letter-spacing: 3px;">Derni&egrave;res Interviews</span>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    ${interviews.map((item: any, idx: number) => `
                    <td width="${interviews.length > 1 ? '48%' : '100%'}" valign="top"${idx === 0 && interviews.length > 1 ? ' style="padding-right: 8px;"' : idx === 1 ? ' style="padding-left: 8px;"' : ''}>
                        <div style="background: #1a1a1a; border: 1px solid ${C.border}; border-radius: 12px; overflow: hidden;">
                            <img src="${resolveImageForEmail(item.image || '')}" alt="${item.title}" width="100%" style="display: block; width: 100%; height: 130px; object-fit: cover; ${!item.image ? 'background:#222;' : ''}">
                            <div style="padding: 14px;">
                                <div style="font-size: 9px; color: ${C.purple}; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Interview</div>
                                <div style="font-family: Impact, Arial Black, sans-serif; font-size: 13px; color: ${C.text}; text-transform: uppercase; line-height: 1.2; margin-bottom: 10px;">${item.title}</div>
                                <a href="${item.link || 'https://dropsiders.fr/interviews'}" style="color: ${C.purple}; font-size: 10px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">Voir l'interview &rarr;</a>
                            </div>
                        </div>
                    </td>`).join('')}
                </tr>
            </table>
            <div style="text-align: center; margin-top: 16px;">
                <a href="https://dropsiders.fr/interviews" style="color: ${C.purple}; font-size: 11px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">Toutes les interviews &rarr;</a>
            </div>
        </div>` : '';

        // === RECAPS SECTION ===
        const recapsHtml = showRecaps && recaps.length > 0 ? `
        <!-- RECAPS SECTION -->
        <div style="padding: 30px; border-bottom: 1px solid ${C.border}; background: #060606;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                <div style="width: 4px; height: 20px; background: ${C.yellow}; border-radius: 2px; display: inline-block;"></div>
                <span style="font-family: Impact, sans-serif; font-size: 13px; color: ${C.textMuted}; text-transform: uppercase; letter-spacing: 3px;">R&eacute;caps Events</span>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    ${recaps.map((item: any, idx: number) => `
                    <td width="${recaps.length > 1 ? '48%' : '100%'}" valign="top"${idx === 0 && recaps.length > 1 ? ' style="padding-right: 8px;"' : idx === 1 ? ' style="padding-left: 8px;"' : ''}>
                        <div style="background: #1a1a1a; border: 1px solid ${C.border}; border-radius: 12px; overflow: hidden;">
                            <img src="${resolveImageForEmail(item.image || item.cover || '')}" alt="${item.title}" width="100%" style="display: block; width: 100%; height: 130px; object-fit: cover; ${!(item.image || item.cover) ? 'background:#222;' : ''}">
                            <div style="padding: 14px;">
                                <div style="font-size: 9px; color: ${C.yellow}; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">R&eacute;cap${item.date ? ' &middot; ' + formatShortDate(item.date) : ''}</div>
                                <div style="font-family: Impact, Arial Black, sans-serif; font-size: 13px; color: ${C.text}; text-transform: uppercase; line-height: 1.2; margin-bottom: 10px;">${item.title}</div>
                                <a href="${item.link || 'https://dropsiders.fr/recaps'}" style="color: ${C.yellow}; font-size: 10px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">Voir le r&eacute;cap &rarr;</a>
                            </div>
                        </div>
                    </td>`).join('')}
                </tr>
            </table>
        </div>` : '';

        // === COMMUNITY UPLOADS SECTION ===
        const communityHtml = showCommunityUploads && communityUploads.length > 0 ? `
        <!-- COMMUNITY UPLOADS SECTION -->
        <div style="padding: 30px; border-bottom: 1px solid ${C.border};">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                <div style="width: 4px; height: 20px; background: ${C.success}; border-radius: 2px; display: inline-block;"></div>
                <span style="font-family: Impact, sans-serif; font-size: 13px; color: ${C.textMuted}; text-transform: uppercase; letter-spacing: 3px;">Top Uploads Communaut&eacute;</span>
            </div>
            ${communityUploads.map((item: any, index: number) => `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 10px; background: #0f0f0f; border: 1px solid ${index === 0 ? 'rgba(0,255,153,0.3)' : C.border}; border-radius: 10px;">
                <tr>
                    <td width="48" valign="middle" style="padding: 12px 0 12px 14px;">
                        <div style="width: 32px; height: 32px; border-radius: 8px; background: ${index === 0 ? 'rgba(0,255,153,0.15)' : '#1a1a1a'}; border: 1px solid ${index === 0 ? 'rgba(0,255,153,0.3)' : '#333'}; text-align: center; line-height: 32px; font-family: Impact; font-size: 15px; font-weight: 900; color: ${index === 0 ? C.success : index === 1 ? '#aaa' : '#c87941'};">${index + 1}</div>
                    </td>
                    <td valign="middle" style="padding: 12px 10px;">
                        <div style="font-size: 13px; font-weight: 800; color: ${C.text}; text-transform: uppercase;">${item.title}</div>
                        <div style="font-size: 11px; color: ${C.textMuted}; margin-top: 2px;">${item.artist || ''} &middot; ${item.likes || 0} likes</div>
                    </td>
                    ${item.embedUrl ? `<td width="80" align="right" valign="middle" style="padding-right: 14px;">
                        <a href="${item.embedUrl}" style="display: inline-block; padding: 6px 10px; background: rgba(0,255,153,0.12); border: 1px solid rgba(0,255,153,0.3); color: ${C.success}; font-size: 9px; font-weight: 900; text-decoration: none; text-transform: uppercase; border-radius: 6px;">&Eacute;couter</a>
                    </td>` : ''}
                </tr>
            </table>`).join('')}
            <div style="text-align: center; margin-top: 12px;">
                <a href="https://dropsiders.fr/communaute" style="color: ${C.success}; font-size: 11px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">Voir tous les uploads &rarr;</a>
            </div>
        </div>` : '';

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
                .container { max-width: 600px; margin: 0 auto; background-color: ${C.card}; border: 1px solid ${C.border}; border-radius: 16px; overflow: hidden; box-shadow: 0 0 40px rgba(255, 0, 51, 0.15); }
                .header { text-align: center; padding: 40px 0 30px 0; background-color: ${C.bg}; border-bottom: 1px solid ${C.border}; }
                .newsletter-title { font-family: 'Impact', sans-serif; font-size: 32px; color: ${C.accent}; text-transform: uppercase; letter-spacing: 4px; margin-top: 10px; text-shadow: 0 0 10px rgba(255, 0, 51, 0.3); }
                .main-article { padding: 40px 30px; border-bottom: 1px solid ${C.border}; }
                .main-title { font-family: 'Impact', 'Arial Black', sans-serif; font-size: 28px; font-weight: 900; text-transform: uppercase; margin: 25px 0 15px 0; color: ${C.text}; line-height: 1.1; letter-spacing: -1px; font-style: italic; }
                .main-text { font-size: 16px; line-height: 1.6; color: ${C.textMuted}; margin-bottom: 30px; }
                .main-image { width: 100%; border-radius: 12px; border: 1px solid ${C.border}; display: block; object-fit: cover; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
                .button { display: inline-block; padding: 16px 32px; background: linear-gradient(90deg, ${C.accent} 0%, #ff0066 100%); color: #ffffff !important; text-decoration: none; font-weight: 800; text-transform: uppercase; border-radius: 8px; font-size: 14px; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(255, 0, 51, 0.3); }
                .news-grid { padding: 30px; display: table; width: 100%; box-sizing: border-box; border-bottom: 1px solid ${C.border}; }
                .news-row { display: table-row; }
                .news-col { display: table-cell; width: 48%; vertical-align: top; padding-bottom: 10px; }
                .news-spacer { display: table-cell; width: 4%; }
                .news-image { width: 100%; height: 160px; object-fit: cover; border-radius: 8px; border: 1px solid ${C.border}; margin-bottom: 15px; display: block; background-color: #222; box-shadow: 0 4px 15px rgba(255, 0, 51, 0.15); }
                .news-title { font-family: 'Impact', 'Arial Black', sans-serif; font-size: 16px; font-weight: 800; color: ${C.text}; margin-bottom: 8px; line-height: 1.3; text-transform: uppercase; letter-spacing: -0.5px; }
                .news-desc { font-size: 13px; line-height: 1.5; color: ${C.textMuted}; margin-bottom: 12px; }
                .news-link { color: ${C.accent}; text-decoration: none; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
                .media-section { padding: 40px 30px; text-align: center; background-color: #080808; }
                .media-title { font-size: 14px; font-weight: 900; color: ${C.textMuted}; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 2px; }
                .media-box { background-color: #000; border: 1px solid ${C.border}; border-radius: 16px; padding: 25px; display: inline-block; width: 100%; box-sizing: border-box; text-align: left; box-shadow: 0 0 25px rgba(255, 0, 51, 0.1); }
                .footer { padding: 40px 20px; text-align: center; font-size: 12px; color: #444; background-color: ${C.bg}; font-weight: 500; }
                .footer a { color: #666; text-decoration: none; }
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
                        ${mainArticle.image ? `<img src="${resolveImageForEmail(mainArticle.image)}" alt="Cover" class="main-image">` : ''}
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
                                ${news1.image ? `<img src="${resolveImageForEmail(news1.image)}" class="news-image" alt="News 1">` : ''}
                                <div class="news-title">${news1.title}</div>
                                ${news1.content ? `<div class="news-desc">${news1.content.replace(/\n/g, '<br>')}</div>` : ''}
                                ${news1.link ? `<a href="${news1.link}" class="news-link">Lire la news &rarr;</a>` : ''}
                            </div>
                            <div class="news-spacer"></div>
                            <div class="news-col">
                                ${news2.image ? `<img src="${resolveImageForEmail(news2.image)}" class="news-image" alt="News 2">` : ''}
                                <div class="news-title">${news2.title}</div>
                                ${news2.content ? `<div class="news-desc">${news2.content.replace(/\n/g, '<br>')}</div>` : ''}
                                ${news2.link ? `<a href="${news2.link}" class="news-link">Lire la news &rarr;</a>` : ''}
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${autoNewsHtml}
                    ${agendaHtml}
                    ${interviewsHtml}
                    ${recapsHtml}
                    ${communityHtml}
                    
                    <!-- SECTION MEDIA -->
                    ${media.link ? `
                    <div class="media-section">
                        <div class="media-title">${media.title}</div>
                        <div class="media-box">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td width="60" valign="middle">
                                        <div style="width: 50px; height: 50px; background-color: #222; border-radius: 50%; text-align: center; line-height: 50px; font-size: 24px;">
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
                        &copy; 2026 DROPSIDERS. Tous droits réservés.<br>
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

                {/* COLONNE GAUCHE : ÉDITEUR */}
                <div className="lg:col-span-5 bg-[#111] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl">

                    {/* Onglets */}
                    <div className="flex border-b border-white/10 bg-black/50">
                        {([
                            { id: 'main', label: 'Principal' },
                            { id: 'secondary', label: 'News' },
                            { id: 'media', label: 'Média' },
                            { id: 'sections', label: '⚡ Auto', special: true },
                        ] as { id: typeof activeTab; label: string; special?: boolean }[]).map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-4 text-[11px] md:text-sm font-black uppercase tracking-wide transition-colors relative
                                    ${activeTab === tab.id
                                        ? `text-white bg-white/5 ${tab.special ? 'text-neon-red' : ''}`
                                        : `text-gray-500 hover:text-gray-300 ${tab.special ? 'hover:text-neon-red/70' : ''}`
                                    }
                                `}
                            >
                                {tab.label}
                                {activeTab === tab.id && <div className={`absolute bottom-0 left-0 w-full h-0.5 ${tab.special ? 'bg-neon-red' : 'bg-neon-red'}`}></div>}
                            </button>
                        ))}
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

                        {/* === TAB: Article Principal === */}
                        {activeTab === 'main' && (
                            <div className="space-y-5 animate-fadeIn">
                                <div>
                                    <label className="label-field"><Type size={12} /> Titre Principal</label>
                                    <input type="text" value={mainArticle.title} onChange={e => setMainArticle({ ...mainArticle, title: e.target.value })} className="input-field" placeholder="Titre de la grosse news..." />
                                </div>
                                <div>
                                    <label className="label-field"><ImageIcon size={12} /> Image</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={mainArticle.image} onChange={e => setMainArticle({ ...mainArticle, image: e.target.value })} className="input-field" placeholder="https://..." />
                                        <button onClick={() => { setUploadTarget('main'); setIsUploadModalOpen(true); }} className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors" title="Uploader une image"><Plus size={20} /></button>
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
                                                    <button key={c.hex} onClick={() => applyStyle('main', 'color', c.hex)} className="w-3 h-3 rounded-full hover:scale-125 transition-transform border border-white/10" style={{ backgroundColor: c.hex }} title={c.name} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <textarea id="content-main" value={mainArticle.content} onChange={e => setMainArticle({ ...mainArticle, content: e.target.value })} className="input-field min-h-[120px]" placeholder="Écrivez votre article ici..." />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="label-field">Bouton Texte</label>
                                        <input type="text" value={mainArticle.ctaText} onChange={e => setMainArticle({ ...mainArticle, ctaText: e.target.value })} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="label-field">Bouton Lien</label>
                                        <input type="text" value={mainArticle.ctaLink} onChange={e => setMainArticle({ ...mainArticle, ctaLink: e.target.value })} className="input-field" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* === TAB: News Secondaires === */}
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
                                                        <button key={c.hex} onClick={() => applyStyle('news1', 'color', c.hex)} className="w-2.5 h-2.5 rounded-full hover:scale-125 transition-transform border border-white/10" style={{ backgroundColor: c.hex }} title={c.name} />
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
                                                        <button key={c.hex} onClick={() => applyStyle('news2', 'color', c.hex)} className="w-2.5 h-2.5 rounded-full hover:scale-125 transition-transform border border-white/10" style={{ backgroundColor: c.hex }} title={c.name} />
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

                        {/* === TAB: Média === */}
                        {activeTab === 'media' && (
                            <div className="space-y-5 animate-fadeIn">
                                <div>
                                    <label className="label-field">Titre de la section</label>
                                    <input type="text" value={media.title} onChange={e => setMedia({ ...media, title: e.target.value })} className="input-field" />
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setMedia({ ...media, platform: 'spotify' })} className={`flex-1 py-3 rounded-lg border transition-all text-sm font-bold flex items-center justify-center gap-2 ${media.platform === 'spotify' ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-black border-white/10 text-gray-500 hover:bg-white/5'}`}>
                                        <Music size={16} /> Spotify
                                    </button>
                                    <button onClick={() => setMedia({ ...media, platform: 'youtube' })} className={`flex-1 py-3 rounded-lg border transition-all text-sm font-bold flex items-center justify-center gap-2 ${media.platform === 'youtube' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-black border-white/10 text-gray-500 hover:bg-white/5'}`}>
                                        <Youtube size={16} /> YouTube
                                    </button>
                                </div>
                                <div>
                                    <label className="label-field">Lien du média</label>
                                    <input type="text" value={media.link} onChange={e => setMedia({ ...media, link: e.target.value })} className="input-field" placeholder="Lien Spotify ou YouTube..." />
                                </div>
                            </div>
                        )}

                        {/* === TAB: Sections Auto === */}
                        {activeTab === 'sections' && (
                            <div className="space-y-4 animate-fadeIn">
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest text-center">Sections automatiques — activez/désactivez avec le toggle</p>

                                {/* === AUTO-NEWS === */}
                                <div className={`p-4 rounded-xl border transition-all duration-300 space-y-4 ${showAutoNews ? 'bg-neon-red/5 border-neon-red/20' : 'bg-white/5 border-white/10'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-1.5 rounded-lg transition-colors ${showAutoNews ? 'bg-neon-red/20' : 'bg-white/5'}`}>
                                                <Zap size={13} className={showAutoNews ? 'text-neon-red' : 'text-gray-500'} />
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-black text-white uppercase tracking-widest">Dernières News Auto</div>
                                                <div className="text-[9px] text-gray-500 mt-0.5">{availableNews.length} news disponibles</div>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowAutoNews(!showAutoNews)} className={`relative w-11 h-6 rounded-full border transition-all duration-300 flex-shrink-0 ${showAutoNews ? 'bg-neon-red/30 border-neon-red/60' : 'bg-white/5 border-white/10'}`}>
                                            <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 shadow-sm ${showAutoNews ? 'left-[22px] bg-neon-red' : 'left-0.5 bg-gray-600'}`} />
                                        </button>
                                    </div>

                                    {showAutoNews && (
                                        <div className="space-y-3 pt-3 border-t border-white/5">
                                            <div>
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Nombre de news à inclure</label>
                                                <div className="flex gap-2">
                                                    {[2, 3, 4, 5].map(n => (
                                                        <button key={n} onClick={() => setAutoNewsCount(n)} className={`flex-1 py-2.5 rounded-xl border text-sm font-black transition-all ${autoNewsCount === n ? 'bg-neon-red/20 border-neon-red text-neon-red shadow-[0_0_10px_rgba(255,0,51,0.2)]' : 'bg-black/40 border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300'}`}>
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                                                {selectedAutoNews.map((n: any, i: number) => (
                                                    <div key={n.id} className="flex items-center gap-2.5 p-2 bg-black/50 rounded-lg border border-white/5">
                                                        <span className="text-[10px] font-black text-neon-red w-4 flex-shrink-0">#{i + 1}</span>
                                                        {n.image && <img src={n.image.startsWith('http') ? n.image : `https://dropsiders.fr${n.image}`} alt="" className="w-7 h-7 object-cover rounded flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                                                        <span className="text-[10px] text-gray-300 truncate flex-1 leading-tight">{n.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* === AGENDA DU MOIS === */}
                                <div className={`p-4 rounded-xl border transition-all duration-300 space-y-4 ${showAgenda ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-white/5 border-white/10'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-1.5 rounded-lg transition-colors ${showAgenda ? 'bg-cyan-500/20' : 'bg-white/5'}`}>
                                                <Calendar size={13} className={showAgenda ? 'text-cyan-400' : 'text-gray-500'} />
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-black text-white uppercase tracking-widest">Agenda du Mois</div>
                                                <div className="text-[9px] text-gray-500 mt-0.5">{agendaEvents.length} événement(s) ce mois</div>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowAgenda(!showAgenda)} className={`relative w-11 h-6 rounded-full border transition-all duration-300 flex-shrink-0 ${showAgenda ? 'bg-cyan-500/30 border-cyan-500/60' : 'bg-white/5 border-white/10'}`}>
                                            <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 shadow-sm ${showAgenda ? 'left-[22px] bg-cyan-400' : 'left-0.5 bg-gray-600'}`} />
                                        </button>
                                    </div>
                                    {showAgenda && agendaEvents.length > 0 && (
                                        <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pt-3 border-t border-white/5">
                                            {agendaEvents.map((e: any) => (
                                                <div key={e.id} className="flex items-center gap-2 p-2 bg-black/50 rounded-lg border border-white/5">
                                                    <span className="text-[9px] font-black text-cyan-400 w-12 flex-shrink-0">{new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                                                    <span className="text-[10px] text-gray-300 truncate flex-1">{e.title}</span>
                                                    <span className="text-[9px] text-gray-600 flex-shrink-0 hidden sm:block">{e.location}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {showAgenda && agendaEvents.length === 0 && (
                                        <p className="text-[10px] text-gray-600 text-center py-2 pt-3 border-t border-white/5">Aucun événement ce mois</p>
                                    )}
                                </div>

                                {/* === INTERVIEWS === */}
                                <div className={`p-4 rounded-xl border transition-all duration-300 space-y-4 ${showInterviews ? 'bg-purple-500/5 border-purple-500/20' : 'bg-white/5 border-white/10'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-1.5 rounded-lg transition-colors ${showInterviews ? 'bg-purple-500/20' : 'bg-white/5'}`}>
                                                <Mic2 size={13} className={showInterviews ? 'text-purple-400' : 'text-gray-500'} />
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-black text-white uppercase tracking-widest">2 Dernières Interviews</div>
                                                <div className="text-[9px] text-gray-500 mt-0.5">{interviews.length} interview(s) trouvée(s)</div>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowInterviews(!showInterviews)} className={`relative w-11 h-6 rounded-full border transition-all duration-300 flex-shrink-0 ${showInterviews ? 'bg-purple-500/30 border-purple-500/60' : 'bg-white/5 border-white/10'}`}>
                                            <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 shadow-sm ${showInterviews ? 'left-[22px] bg-purple-400' : 'left-0.5 bg-gray-600'}`} />
                                        </button>
                                    </div>
                                    {showInterviews && interviews.length > 0 && (
                                        <div className="space-y-1.5 pt-3 border-t border-white/5">
                                            {interviews.map((item: any) => (
                                                <div key={item.id} className="flex items-center gap-2.5 p-2 bg-black/50 rounded-lg border border-white/5">
                                                    {item.image && <img src={item.image.startsWith('http') ? item.image : `https://dropsiders.fr${item.image}`} alt="" className="w-7 h-7 object-cover rounded flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[10px] text-gray-300 truncate">{item.title}</div>
                                                        <div className="text-[9px] text-purple-400 capitalize">{item.category}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {showInterviews && interviews.length === 0 && (
                                        <p className="text-[10px] text-gray-600 text-center py-2 pt-3 border-t border-white/5">Aucune interview disponible</p>
                                    )}
                                </div>

                                {/* === RECAPS === */}
                                <div className={`p-4 rounded-xl border transition-all duration-300 space-y-4 ${showRecaps ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-white/5 border-white/10'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-1.5 rounded-lg transition-colors ${showRecaps ? 'bg-yellow-500/20' : 'bg-white/5'}`}>
                                                <RefreshCw size={13} className={showRecaps ? 'text-yellow-400' : 'text-gray-500'} />
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-black text-white uppercase tracking-widest">Récaps d'Events</div>
                                                <div className="text-[9px] text-gray-500 mt-0.5">{recaps.length} récap(s) disponible(s)</div>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowRecaps(!showRecaps)} className={`relative w-11 h-6 rounded-full border transition-all duration-300 flex-shrink-0 ${showRecaps ? 'bg-yellow-500/30 border-yellow-500/60' : 'bg-white/5 border-white/10'}`}>
                                            <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 shadow-sm ${showRecaps ? 'left-[22px] bg-yellow-400' : 'left-0.5 bg-gray-600'}`} />
                                        </button>
                                    </div>
                                    {showRecaps && recaps.length > 0 && (
                                        <div className="space-y-1.5 pt-3 border-t border-white/5">
                                            {recaps.map((item: any) => (
                                                <div key={item.id} className="flex items-center gap-2.5 p-2 bg-black/50 rounded-lg border border-white/5">
                                                    {(item.image || item.cover) && <img src={(item.image || item.cover || '').startsWith('http') ? (item.image || item.cover) : `https://dropsiders.fr${item.image || item.cover}`} alt="" className="w-7 h-7 object-cover rounded flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[10px] text-gray-300 truncate">{item.title}</div>
                                                        {item.date && <div className="text-[9px] text-yellow-400">{new Date(item.date).toLocaleDateString('fr-FR')}</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {showRecaps && recaps.length === 0 && (
                                        <p className="text-[10px] text-gray-600 text-center py-2 pt-3 border-t border-white/5">Aucun récap disponible</p>
                                    )}
                                </div>

                                {/* === TOP 3 UPLOADS COMMUNAUTÉ === */}
                                <div className={`p-4 rounded-xl border transition-all duration-300 space-y-4 ${showCommunityUploads ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-1.5 rounded-lg transition-colors ${showCommunityUploads ? 'bg-green-500/20' : 'bg-white/5'}`}>
                                                <Trophy size={13} className={showCommunityUploads ? 'text-green-400' : 'text-gray-500'} />
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-black text-white uppercase tracking-widest">Top 3 Uploads Communauté</div>
                                                <div className="text-[9px] text-gray-500 mt-0.5">Meilleurs mixes de la communauté</div>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowCommunityUploads(!showCommunityUploads)} className={`relative w-11 h-6 rounded-full border transition-all duration-300 flex-shrink-0 ${showCommunityUploads ? 'bg-green-500/30 border-green-500/60' : 'bg-white/5 border-white/10'}`}>
                                            <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 shadow-sm ${showCommunityUploads ? 'left-[22px] bg-green-400' : 'left-0.5 bg-gray-600'}`} />
                                        </button>
                                    </div>
                                    {showCommunityUploads && (
                                        <div className="space-y-1.5 pt-3 border-t border-white/5">
                                            {communityUploads.length > 0 ? communityUploads.map((item: any, i: number) => (
                                                <div key={item.id} className="flex items-center gap-2.5 p-2 bg-black/50 rounded-lg border border-white/5">
                                                    <span className={`text-[11px] font-black w-5 flex-shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : 'text-amber-600'}`}>#{i + 1}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[10px] text-gray-300 truncate">{item.title}</div>
                                                        <div className="text-[9px] text-green-400">{item.artist} · {item.likes || 0} ❤️</div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <p className="text-[10px] text-gray-600 text-center py-2">Aucun upload de la communauté disponible</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                            </div>
                        )}

                    </div>
                </div>

                {/* COLONNE DROITE : APERÇU */}
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
                                <button onClick={() => setShowSubscribersModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 border-b border-white/10 bg-black/30 flex flex-col gap-3">
                                <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
                                    <span>Sélectionnés : <span className="text-white">{selectedSubscribers.length}</span> / {subscribersData.length}</span>
                                    {selectedSubscribers.length === subscribersData.length ? (
                                        <button onClick={() => setSelectedSubscribers([])} className="text-neon-red hover:text-white transition-colors">Désélectionner tout</button>
                                    ) : (
                                        <button onClick={() => setSelectedSubscribers(subscribersData.map((sub: any) => sub.email || sub).filter(Boolean))} className="text-neon-cyan hover:text-white transition-colors">Sélectionner tout</button>
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
                                    <button onClick={handleCopyEmails} className="flex-1 py-3 bg-white/5 text-gray-300 font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-xs">
                                        <Copy size={14} />
                                        Copier les emails
                                    </button>
                                    <button onClick={() => setShowSubscribersModal(false)} className="px-6 py-3 bg-white/5 text-gray-500 font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all text-xs">
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Styles injectés pour ce composant spécifique */}
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
