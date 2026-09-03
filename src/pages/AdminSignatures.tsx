import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Check, Copy, Download, Mail, Smartphone,
    Globe, Instagram, Sparkles, User, Phone, ShieldCheck,
    Palette, ExternalLink, HelpCircle, AlertCircle, RefreshCw,
    Share2, FileText, CheckCircle2, ChevronRight, PenTool,
    Eye, Monitor
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { isSuperAdmin, hasPermission } from '../utils/auth';
import teamData from '../data/team.json';

interface SignatureConfig {
    name: string;
    role: string;
    email: string;
    phone: string;
    website: string;
    instagram: string;
    tiktok: string;
    spotify: string;
    youtube: string;
    avatarUrl: string;
    showAvatar: boolean;
    showBadge: boolean;
    showTagline: boolean;
    showLegalDisclaimer: boolean;
    accentColor: string;
    template: 'neon' | 'minimal' | 'card';
}

const ACCENT_COLORS = [
    { name: 'Orange Dropsiders', hex: '#ff5500', class: 'bg-[#ff5500]' },
    { name: 'Rouge Électro', hex: '#ff0033', class: 'bg-[#ff0033]' },
    { name: 'Cyan Néon', hex: '#00e5ff', class: 'bg-[#00e5ff]' },
    { name: 'Violet Festival', hex: '#bd00ff', class: 'bg-[#bd00ff]' },
    { name: 'Vert Acid', hex: '#00ff66', class: 'bg-[#00ff66]' },
    { name: 'Blanc Pur', hex: '#ffffff', class: 'bg-white' },
];

const SUGGESTED_ROLES = [
    'Fondateur & Directeur de publication',
    'Rédacteur en chef',
    'Rédacteur Média',
    'Rédactrice Média',
    'Photographe Officiel',
    'Vidéaste & Réalisateur',
    'Community Manager',
    'Relations Presse & Partenariats',
    'DJ & Animateur'
];

const LOGO_URL = 'https://dropsiders.fr/Logo.png';

export function AdminSignatures() {
    const navigate = useNavigate();

    // Permission check
    const storedPermissions = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('admin_permissions') || '[]');
        } catch {
            return [];
        }
    }, []);
    const adminUser = localStorage.getItem('admin_user');
    const isAlex = isSuperAdmin(adminUser);
    const canAccess = isAlex || hasPermission(storedPermissions, 'messages_contact', isAlex) || hasPermission(storedPermissions, 'all', isAlex);

    useEffect(() => {
        if (!canAccess) {
            navigate('/admin');
        }
    }, [canAccess, navigate]);

    // Initial config based on team member or defaults
    const [selectedMemberId, setSelectedMemberId] = useState<number | 'custom'>('custom');
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'iphone'>('desktop');
    const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
    const [activeGuideTab, setActiveGuideTab] = useState<'iphone' | 'webmail' | 'gmail'>('iphone');

    const [config, setConfig] = useState<SignatureConfig>({
        name: 'Alex Frérot',
        role: 'Fondateur & Rédacteur',
        email: 'alex@dropsiders.fr',
        phone: '+33 6 00 00 00 00',
        website: 'https://dropsiders.fr',
        instagram: 'https://instagram.com/itsalex.fr1',
        tiktok: 'https://www.tiktok.com/@dropsiders',
        spotify: 'https://open.spotify.com/user/dropsiders',
        youtube: 'https://youtube.com/@dropsiders',
        avatarUrl: 'https://www.dropsiders.fr/uploads/migrated/dropsiders/wcyxatveeurgu5s1fi3s.jpg',
        showAvatar: true,
        showBadge: true,
        showTagline: true,
        showLegalDisclaimer: false,
        accentColor: '#ff5500',
        template: 'neon'
    });

    const [copyStatus, setCopyStatus] = useState<'idle' | 'rich_success' | 'html_success'>('idle');
    const [showIphoneTipModal, setShowIphoneTipModal] = useState(false);
    const signatureRef = useRef<HTMLDivElement>(null);

    // Apply presets when selecting a member
    const handleSelectMember = (memberId: number | 'custom') => {
        setSelectedMemberId(memberId);
        if (memberId === 'custom') {
            setConfig(prev => ({
                ...prev,
                name: '',
                role: 'Rédacteur Média',
                email: 'contact@dropsiders.fr',
                phone: '',
                avatarUrl: '',
                showAvatar: false,
                instagram: 'https://instagram.com/dropsiders'
            }));
            return;
        }

        const member = teamData.find((m: any) => m.id === memberId);
        if (member) {
            const memberEmail = (member as any).email || `${member.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '')}@dropsiders.fr`;
            setConfig(prev => ({
                ...prev,
                name: member.name.trim(),
                role: member.role || 'Membre Dropsiders',
                email: memberEmail,
                avatarUrl: member.image || '',
                showAvatar: !!member.image,
                instagram: member.socials?.instagram && member.socials.instagram !== '#' ? member.socials.instagram : 'https://instagram.com/dropsiders',
                tiktok: member.socials?.tiktok && member.socials.tiktok !== '#' ? member.socials.tiktok : 'https://www.tiktok.com/@dropsiders',
            }));
        }
    };

    // Auto-detect current user on load
    useEffect(() => {
        if (adminUser) {
            const lower = adminUser.toLowerCase();
            const matched = teamData.find((m: any) => m.name.toLowerCase().includes(lower));
            if (matched) {
                handleSelectMember(matched.id);
            }
        }
    }, [adminUser]);

    // Build the Raw HTML email string compliant with standard email clients
    const rawHtml = useMemo(() => {
        const {
            name, role, email, phone, website,
            instagram, tiktok, spotify, avatarUrl,
            showAvatar, showBadge, showTagline, showLegalDisclaimer,
            accentColor, template
        } = config;

        const cleanSite = website.replace(/^https?:\/\//, '');

        // Social pills / links
        const socialsList: { label: string; url: string }[] = [];
        if (instagram) socialsList.push({ label: 'Instagram', url: instagram });
        if (tiktok && tiktok !== '#') socialsList.push({ label: 'TikTok', url: tiktok });
        if (spotify && spotify !== '#') socialsList.push({ label: 'Spotify', url: spotify });

        const socialLinksHtml = socialsList.map(s => (
            `<a href="${s.url}" target="_blank" style="color: ${accentColor}; font-weight: 700; text-decoration: none; font-size: 11px; margin-right: 10px; display: inline-block;">${s.label} &rarr;</a>`
        )).join('');

        if (template === 'minimal') {
            return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.4; color: #1a1a1a; max-width: 520px;">
    <tr>
        <td style="padding-bottom: 8px;">
            <span style="font-size: 15px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">${name || 'Dropsiders'}</span>
            <span style="color: #999999; margin: 0 6px;">|</span>
            <span style="font-size: 12px; font-weight: 700; color: ${accentColor}; text-transform: uppercase;">${role}</span>
        </td>
    </tr>
    <tr>
        <td style="border-top: 2px solid ${accentColor}; padding-top: 8px; font-size: 12px; color: #555555;">
            <a href="mailto:${email}" style="color: #111111; text-decoration: none; font-weight: 600;">${email}</a>
            ${phone ? ` &nbsp;•&nbsp; <span style="color: #555555;">${phone}</span>` : ''}
            &nbsp;•&nbsp; <a href="${website}" target="_blank" style="color: ${accentColor}; text-decoration: none; font-weight: 700;">${cleanSite}</a>
        </td>
    </tr>
    ${socialsList.length > 0 ? `
    <tr>
        <td style="padding-top: 6px;">
            ${socialLinksHtml}
        </td>
    </tr>` : ''}
</table>`.trim();
        }

        if (template === 'card') {
            return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.35; color: #1a1a1a; max-width: 550px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 16px;">
    <tr>
        ${showAvatar && avatarUrl ? `
        <td valign="top" style="padding-right: 14px; width: 70px;">
            <img src="${avatarUrl}" alt="${name}" width="68" height="68" style="display: block; width: 68px; height: 68px; border-radius: 50%; object-fit: cover; border: 2px solid ${accentColor};" />
        </td>` : ''}
        <td valign="top">
            <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td>
                        <div style="font-size: 16px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">${name || 'Dropsiders'}</div>
                        <div style="font-size: 12px; font-weight: 800; color: ${accentColor}; text-transform: uppercase; margin-top: 2px; letter-spacing: 0.3px;">${role}</div>
                        ${showBadge ? `<div style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">🎙️ Médias & Presse Accréditée</div>` : ''}
                    </td>
                </tr>
                <tr>
                    <td style="padding-top: 8px; font-size: 12px; color: #4b5563;">
                        <div>✉️ <a href="mailto:${email}" style="color: #111827; text-decoration: none; font-weight: 600;">${email}</a></div>
                        ${phone ? `<div style="margin-top: 2px;">📞 <span style="color: #4b5563;">${phone}</span></div>` : ''}
                        <div style="margin-top: 2px;">🌐 <a href="${website}" target="_blank" style="color: ${accentColor}; text-decoration: none; font-weight: 700;">${cleanSite}</a></div>
                    </td>
                </tr>
                <tr>
                    <td style="padding-top: 8px;">
                        ${socialLinksHtml}
                    </td>
                </tr>
            </table>
        </td>
        <td valign="top" align="right" style="padding-left: 12px; width: 85px;">
            <a href="${website}" target="_blank">
                <img src="${LOGO_URL}" alt="Dropsiders" width="80" style="display: block; width: 80px; height: auto;" />
            </a>
        </td>
    </tr>
    ${showTagline ? `
    <tr>
        <td colspan="${showAvatar && avatarUrl ? 3 : 2}" style="border-top: 1px solid #f3f4f6; padding-top: 8px; margin-top: 8px; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">
            DROPSIDERS • Le média 100% musiques électroniques, festivals & culture clubbing
        </td>
    </tr>` : ''}
    ${showLegalDisclaimer ? `
    <tr>
        <td colspan="${showAvatar && avatarUrl ? 3 : 2}" style="padding-top: 6px; font-size: 9px; color: #9ca3af; line-height: 1.3;">
            Ce message et les pièces jointes sont confidentiels et destinés exclusivement au destinataire. Si vous avez reçu ce message par erreur, merci de le supprimer immédiatement.
        </td>
    </tr>` : ''}
</table>`.trim();
        }

        // DEFAULT TEMPLATE: 'neon' (Vertical accent line with Logo Dropsiders on the left)
        return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.35; color: #1a1a1a; max-width: 540px;">
    <tr>
        <!-- LOGO DROPSIDERS -->
        <td valign="middle" align="center" style="padding-right: 18px; width: 85px;">
            <a href="${website}" target="_blank" style="text-decoration: none;">
                <img src="${LOGO_URL}" alt="Dropsiders" width="80" style="display: block; width: 80px; height: auto;" />
            </a>
            ${showAvatar && avatarUrl ? `
            <div style="margin-top: 8px;">
                <img src="${avatarUrl}" alt="${name}" width="42" height="42" style="display: block; width: 42px; height: 42px; border-radius: 50%; object-fit: cover; margin: 0 auto; border: 1px solid ${accentColor};" />
            </div>` : ''}
        </td>

        <!-- ACCENT BAR -->
        <td width="3" style="width: 3px; background-color: ${accentColor}; border-radius: 2px;"></td>

        <!-- DETAILS -->
        <td valign="top" style="padding-left: 18px;">
            <div style="font-size: 16px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
                ${name || 'Dropsiders'}
            </div>
            <div style="font-size: 12px; font-weight: 800; color: ${accentColor}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                ${role}
            </div>

            ${showBadge ? `
            <div style="margin-bottom: 6px;">
                <span style="background-color: #050505; color: #ffffff; font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
                    ⚡ Média Électronique Officiel
                </span>
            </div>` : ''}

            <table cellpadding="0" cellspacing="0" border="0" style="font-size: 12px; color: #374151; margin-top: 4px;">
                <tr>
                    <td style="padding: 1px 0;">
                        <span style="color: ${accentColor}; font-weight: 700;">Email:</span> 
                        <a href="mailto:${email}" style="color: #111827; text-decoration: none; font-weight: 600; margin-left: 4px;">${email}</a>
                    </td>
                </tr>
                ${phone ? `
                <tr>
                    <td style="padding: 1px 0;">
                        <span style="color: ${accentColor}; font-weight: 700;">Mobile:</span> 
                        <span style="color: #374151; margin-left: 4px;">${phone}</span>
                    </td>
                </tr>` : ''}
                <tr>
                    <td style="padding: 1px 0;">
                        <span style="color: ${accentColor}; font-weight: 700;">Web:</span> 
                        <a href="${website}" target="_blank" style="color: ${accentColor}; text-decoration: none; font-weight: 700; margin-left: 4px;">${cleanSite}</a>
                    </td>
                </tr>
            </table>

            ${socialsList.length > 0 ? `
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #e5e7eb;">
                ${socialLinksHtml}
            </div>` : ''}
        </td>
    </tr>
    ${showTagline ? `
    <tr>
        <td colspan="3" style="padding-top: 10px; font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
            DROPSIDERS • Le média 100% musiques électroniques, festivals & culture clubbing
        </td>
    </tr>` : ''}
    ${showLegalDisclaimer ? `
    <tr>
        <td colspan="3" style="padding-top: 6px; font-size: 9px; color: #9ca3af; line-height: 1.3;">
            Ce message et toutes les pièces jointes sont confidentiels et destinés uniquement à leur destinataire. Si vous avez reçu ce courriel par erreur, veuillez en informer l'expéditeur et le supprimer.
        </td>
    </tr>` : ''}
</table>`.trim();
    }, [config]);

    // Plaintext version
    const plainText = useMemo(() => {
        return `${config.name.toUpperCase()}
${config.role} | Dropsiders
Email: ${config.email}${config.phone ? `\nTel: ${config.phone}` : ''}
Web: ${config.website}
Instagram: ${config.instagram}`;
    }, [config]);

    // 1. Copy Rich Formatted HTML (The Gold Standard for iPhone & Webmail paste)
    const copyRichText = async () => {
        try {
            if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
                const textBlob = new Blob([plainText], { type: 'text/plain' });
                const htmlBlob = new Blob([rawHtml], { type: 'text/html' });
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'text/html': htmlBlob,
                        'text/plain': textBlob
                    })
                ]);
            } else if (signatureRef.current) {
                // Fallback using document selection
                const range = document.createRange();
                range.selectNode(signatureRef.current);
                const selection = window.getSelection();
                selection?.removeAllRanges();
                selection?.addRange(range);
                document.execCommand('copy');
                selection?.removeAllRanges();
            }

            setCopyStatus('rich_success');
            setShowIphoneTipModal(true);
            setTimeout(() => setCopyStatus('idle'), 4000);
        } catch (err) {
            console.error('Failed to copy rich text:', err);
            // Fallback to plain copy
            navigator.clipboard.writeText(rawHtml);
            setCopyStatus('html_success');
            setTimeout(() => setCopyStatus('idle'), 3000);
        }
    };

    // 2. Copy Raw HTML Code
    const copyRawHtml = () => {
        navigator.clipboard.writeText(rawHtml);
        setCopyStatus('html_success');
        setTimeout(() => setCopyStatus('idle'), 3000);
    };

    // 3. Download HTML file
    const downloadHtmlFile = () => {
        const fullHtmlDoc = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Signature Dropsiders - ${config.name}</title>
</head>
<body style="margin: 20px; font-family: sans-serif;">
${rawHtml}
</body>
</html>`;
        const blob = new Blob([fullHtmlDoc], { type: 'text/html;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `signature-dropsiders-${config.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'pro'}.html`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-[#060608] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* TOP HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <Link
                            to="/admin"
                            className="inline-flex items-center gap-2 text-gray-400 hover:text-neon-orange transition-colors text-xs font-bold uppercase tracking-wider mb-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Retour au Dashboard Admin
                        </Link>
                        <h1 className="text-3xl sm:text-4xl font-display font-black uppercase italic tracking-tight text-white flex items-center gap-3">
                            <span className="w-3 h-8 bg-neon-orange rounded-full inline-block" />
                            Générateur de <span className="text-neon-orange">Signatures Mail</span>
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Créez, personnalisez et exportez votre signature officielle Dropsiders pour iPhone (iOS Mail) et Webmail (LWS, Gmail, Outlook).
                        </p>
                    </div>

                    {/* ACTIONS EN TÊTE */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={copyRichText}
                            className="px-5 py-3 bg-neon-orange hover:bg-orange-500 text-black font-black uppercase text-xs tracking-wider rounded-2xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(255,102,0,0.4)] active:scale-95"
                        >
                            {copyStatus === 'rich_success' ? (
                                <>
                                    <Check className="w-4 h-4 text-black" />
                                    Copiée !
                                </>
                            ) : (
                                <>
                                    <Smartphone className="w-4 h-4 text-black" />
                                    Copier pour iPhone & Webmail
                                </>
                            )}
                        </button>

                        <button
                            onClick={copyRawHtml}
                            className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase text-xs tracking-wider rounded-2xl flex items-center gap-2 transition-all"
                        >
                            {copyStatus === 'html_success' ? (
                                <>
                                    <Check className="w-4 h-4 text-neon-cyan" />
                                    Code HTML copié
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 text-gray-400" />
                                    Code HTML brut
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* TEAM MEMBERS QUICK PRESET BAR */}
                <div className="bg-dark-bg/60 border border-white/10 rounded-3xl p-4 sm:p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-neon-orange" />
                            <span className="text-xs font-black uppercase tracking-widest text-gray-300">
                                Présélections par Membre de l'Équipe
                            </span>
                        </div>
                        <span className="text-[11px] text-gray-500">
                            Cliquez sur un membre pour charger automatiquement ses coordonnées
                        </span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
                        {teamData.map((m: any) => {
                            const isSelected = selectedMemberId === m.id;
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => handleSelectMember(m.id)}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold uppercase transition-all shrink-0 ${
                                        isSelected
                                            ? 'bg-neon-orange/20 border-neon-orange text-white shadow-[0_0_15px_rgba(255,102,0,0.3)]'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                                    }`}
                                >
                                    {m.image ? (
                                        <img
                                            src={m.image}
                                            alt={m.name}
                                            className="w-5 h-5 rounded-full object-cover border border-white/20"
                                        />
                                    ) : (
                                        <User className="w-4 h-4" />
                                    )}
                                    <span>{m.name}</span>
                                    <span className="text-[9px] text-gray-500 font-normal lowercase">({m.role.split('/')[0].trim()})</span>
                                </button>
                            );
                        })}

                        <button
                            onClick={() => handleSelectMember('custom')}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold uppercase transition-all shrink-0 ${
                                selectedMemberId === 'custom'
                                    ? 'bg-neon-cyan/20 border-neon-cyan text-white shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                            }`}
                        >
                            <PenTool className="w-4 h-4 text-neon-cyan" />
                            <span>Personnalisé</span>
                        </button>
                    </div>
                </div>

                {/* MAIN GRID : EDITOR & PREVIEW */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT COLUMN: CONFIGURATION FORM (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* 1. TEMPLATE & STYLE */}
                        <div className="bg-dark-bg/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-5">
                            <h3 className="text-base font-display font-black uppercase italic tracking-wider text-white flex items-center gap-2">
                                <Palette className="w-4 h-4 text-neon-orange" />
                                Modèle & Couleur
                            </h3>

                            {/* Template selector */}
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'neon', label: 'Néon Dropsiders', desc: 'Officiel & Élégant' },
                                    { id: 'card', label: 'Carte Média', desc: 'Avec Avatar & Badge' },
                                    { id: 'minimal', label: 'Minimaliste', desc: 'Sobre & Compact' }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setConfig(prev => ({ ...prev, template: t.id as any }))}
                                        className={`p-3 rounded-2xl border text-left transition-all ${
                                            config.template === t.id
                                                ? 'bg-white/15 border-white text-white shadow-lg'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                                        }`}
                                    >
                                        <div className="font-bold text-xs uppercase">{t.label}</div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">{t.desc}</div>
                                    </button>
                                ))}
                            </div>

                            {/* Color Selector */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                    Couleur d'accentuation
                                </label>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {ACCENT_COLORS.map(c => (
                                        <button
                                            key={c.hex}
                                            onClick={() => setConfig(prev => ({ ...prev, accentColor: c.hex }))}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                                                config.accentColor === c.hex
                                                    ? 'border-white bg-white/10 text-white shadow-sm'
                                                    : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            <span className={`w-3 h-3 rounded-full ${c.class} shadow-sm`} />
                                            <span>{c.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 2. IDENTITÉ & CONTACT */}
                        <div className="bg-dark-bg/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-4">
                            <h3 className="text-base font-display font-black uppercase italic tracking-wider text-white flex items-center gap-2">
                                <User className="w-4 h-4 text-neon-cyan" />
                                Informations Membre
                            </h3>

                            {/* Nom complet */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                                    Prénom & Nom
                                </label>
                                <input
                                    type="text"
                                    value={config.name}
                                    onChange={e => setConfig(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="ex: Alex Frérot"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neon-orange transition-colors font-medium"
                                />
                            </div>

                            {/* Rôle / Titre */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                                    Fonction / Rôle Dropsiders
                                </label>
                                <input
                                    type="text"
                                    value={config.role}
                                    onChange={e => setConfig(prev => ({ ...prev, role: e.target.value }))}
                                    placeholder="ex: Fondateur / Rédacteur en chef"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neon-orange transition-colors font-medium mb-2"
                                />
                                <div className="flex flex-wrap gap-1.5">
                                    {SUGGESTED_ROLES.slice(0, 5).map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setConfig(prev => ({ ...prev, role: r }))}
                                            className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-2 py-0.5 rounded-lg border border-white/5 transition-colors"
                                        >
                                            + {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                                    Email Professionnel
                                </label>
                                <input
                                    type="email"
                                    value={config.email}
                                    onChange={e => setConfig(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="ex: alex@dropsiders.fr ou contact@dropsiders.fr"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neon-orange transition-colors font-medium"
                                />
                            </div>

                            {/* Téléphone (optionnel) */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                                    Numéro de Téléphone (optionnel)
                                </label>
                                <input
                                    type="text"
                                    value={config.phone}
                                    onChange={e => setConfig(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="ex: +33 6 12 34 56 78"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neon-orange transition-colors font-medium"
                                />
                            </div>

                            {/* Photo / Avatar */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                        Photo de Profil / Avatar
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.showAvatar}
                                            onChange={e => setConfig(prev => ({ ...prev, showAvatar: e.target.checked }))}
                                            className="rounded border-white/20 bg-white/5 text-neon-orange focus:ring-0"
                                        />
                                        <span className="text-[11px] text-gray-400">Afficher photo</span>
                                    </label>
                                </div>
                                {config.showAvatar && (
                                    <input
                                        type="url"
                                        value={config.avatarUrl}
                                        onChange={e => setConfig(prev => ({ ...prev, avatarUrl: e.target.value }))}
                                        placeholder="URL de l'image (https://...)"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-neon-orange transition-colors font-medium"
                                    />
                                )}
                            </div>
                        </div>

                        {/* 3. OPTIONS ADDITIONNELLES & RÉSEAUX */}
                        <div className="bg-dark-bg/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-4">
                            <h3 className="text-base font-display font-black uppercase italic tracking-wider text-white flex items-center gap-2">
                                <Share2 className="w-4 h-4 text-neon-purple" />
                                Liens & Badges
                            </h3>

                            {/* Instagram */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                                    Lien Instagram
                                </label>
                                <input
                                    type="text"
                                    value={config.instagram}
                                    onChange={e => setConfig(prev => ({ ...prev, instagram: e.target.value }))}
                                    placeholder="https://instagram.com/dropsiders"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-neon-purple transition-colors font-medium"
                                />
                            </div>

                            {/* TikTok */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                                    Lien TikTok
                                </label>
                                <input
                                    type="text"
                                    value={config.tiktok}
                                    onChange={e => setConfig(prev => ({ ...prev, tiktok: e.target.value }))}
                                    placeholder="https://tiktok.com/@dropsiders"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-neon-purple transition-colors font-medium"
                                />
                            </div>

                            {/* Toggles */}
                            <div className="pt-2 border-t border-white/5 space-y-2">
                                <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                                    <span className="text-xs font-medium text-gray-300">Badge Média / Presse officiel</span>
                                    <input
                                        type="checkbox"
                                        checked={config.showBadge}
                                        onChange={e => setConfig(prev => ({ ...prev, showBadge: e.target.checked }))}
                                        className="rounded border-white/20 bg-white/5 text-neon-orange focus:ring-0"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                                    <span className="text-xs font-medium text-gray-300">Slogan Dropsiders au pied</span>
                                    <input
                                        type="checkbox"
                                        checked={config.showTagline}
                                        onChange={e => setConfig(prev => ({ ...prev, showTagline: e.target.checked }))}
                                        className="rounded border-white/20 bg-white/5 text-neon-orange focus:ring-0"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                                    <span className="text-xs font-medium text-gray-300">Avertissement légal de confidentialité</span>
                                    <input
                                        type="checkbox"
                                        checked={config.showLegalDisclaimer}
                                        onChange={e => setConfig(prev => ({ ...prev, showLegalDisclaimer: e.target.checked }))}
                                        className="rounded border-white/20 bg-white/5 text-neon-orange focus:ring-0"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: LIVE PREVIEW & EXPORT (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* PREVIEW CONTROLS */}
                        <div className="bg-dark-bg/60 border border-white/10 rounded-3xl p-4 sm:p-6 backdrop-blur-xl">
                            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                                <div className="flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-neon-orange" />
                                    <h2 className="text-lg font-display font-black uppercase italic tracking-tight text-white">
                                        Aperçu en Temps Réel
                                    </h2>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Desktop vs iPhone selector */}
                                    <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1">
                                        <button
                                            onClick={() => setPreviewDevice('desktop')}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                previewDevice === 'desktop'
                                                    ? 'bg-white/20 text-white shadow-sm'
                                                    : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            <Monitor className="w-3.5 h-3.5" />
                                            Webmail
                                        </button>
                                        <button
                                            onClick={() => setPreviewDevice('iphone')}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                previewDevice === 'iphone'
                                                    ? 'bg-neon-orange/20 text-neon-orange border border-neon-orange/30 shadow-sm'
                                                    : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            <Smartphone className="w-3.5 h-3.5" />
                                            iPhone (iOS)
                                        </button>
                                    </div>

                                    {/* Light vs Dark preview background */}
                                    <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1">
                                        <button
                                            onClick={() => setPreviewTheme('light')}
                                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                previewTheme === 'light' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                                            }`}
                                            title="Fond Clair (Standard email)"
                                        >
                                            Clair
                                        </button>
                                        <button
                                            onClick={() => setPreviewTheme('dark')}
                                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                previewTheme === 'dark' ? 'bg-neutral-800 text-white' : 'text-gray-400 hover:text-white'
                                            }`}
                                            title="Fond Sombre (Dark Mode)"
                                        >
                                            Sombre
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* PREVIEW CONTAINER */}
                            <div className="relative">
                                {previewDevice === 'desktop' ? (
                                    /* DESKTOP WEBMAIL MOCKUP */
                                    <div
                                        className={`rounded-2xl border p-6 transition-colors shadow-inner overflow-x-auto ${
                                            previewTheme === 'light'
                                                ? 'bg-[#ffffff] border-gray-200 text-gray-900'
                                                : 'bg-[#18181b] border-white/10 text-white'
                                        }`}
                                    >
                                        {/* Mock mail header */}
                                        <div className={`text-xs pb-4 mb-4 border-b space-y-1 ${previewTheme === 'light' ? 'border-gray-200 text-gray-500' : 'border-neutral-800 text-gray-400'}`}>
                                            <div><strong className="text-gray-400">De:</strong> {config.name} &lt;{config.email}&gt;</div>
                                            <div><strong className="text-gray-400">À:</strong> contact@festival-electrique.com</div>
                                            <div><strong className="text-gray-400">Objet:</strong> Demande d'accréditation presse & couverture média – Dropsiders</div>
                                        </div>

                                        {/* Mock email message text */}
                                        <div className={`text-sm mb-6 font-sans ${previewTheme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                                            <p className="mb-2">Bonjour,</p>
                                            <p className="mb-2">
                                                Je fais suite à nos échanges concernant la couverture médiatique de la prochaine édition. Nous serions ravis de couvrir l'événement et de réaliser des interviews exclusives de votre line-up.
                                            </p>
                                            <p className="mb-4">Restant à votre entière disposition,</p>
                                            <p className="text-xs text-gray-400 italic mb-4">--</p>
                                        </div>

                                        {/* RENDERED SIGNATURE */}
                                        <div
                                            ref={signatureRef}
                                            dangerouslySetInnerHTML={{ __html: rawHtml }}
                                            className="select-all"
                                        />
                                    </div>
                                ) : (
                                    /* IPHONE IOS MAIL MOCKUP */
                                    <div className="flex justify-center">
                                        <div className="w-full max-w-[380px] bg-[#000000] border-[6px] border-[#262626] rounded-[44px] p-3 shadow-2xl relative overflow-hidden">
                                            {/* Dynamic Island */}
                                            <div className="w-24 h-5 bg-[#000000] rounded-full mx-auto mb-2 border border-white/10 flex items-center justify-center">
                                                <div className="w-2.5 h-2.5 bg-[#0a0a0a] rounded-full mr-2 border border-white/5" />
                                                <div className="w-2 h-2 bg-[#14233c] rounded-full" />
                                            </div>

                                            {/* iOS Mail Screen */}
                                            <div
                                                className={`rounded-[28px] p-4 font-sans text-xs transition-colors overflow-hidden ${
                                                    previewTheme === 'light' ? 'bg-[#ffffff] text-[#000000]' : 'bg-[#121212] text-white'
                                                }`}
                                            >
                                                {/* iOS Mail Top Bar */}
                                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200/40">
                                                    <span className="font-bold text-[11px] text-blue-500">‹ Boîte de réception</span>
                                                    <span className="font-bold text-[11px] text-gray-400">12:34</span>
                                                </div>

                                                <div className="space-y-1 mb-3 text-[11px]">
                                                    <div className="font-bold text-sm text-black dark:text-white">Couverture Média & Accréditation</div>
                                                    <div className="text-gray-500">De: <span className="font-semibold text-gray-800 dark:text-gray-200">{config.name}</span></div>
                                                    <div className="text-gray-400 text-[10px]">Aujourd'hui à 12:34</div>
                                                </div>

                                                <div className="py-2 text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-neutral-800 mb-4">
                                                    Bonjour,<br />
                                                    Veuillez trouver ci-dessous notre signature officielle Dropsiders pour confirmer nos échanges.<br />
                                                    Musicalement,
                                                </div>

                                                {/* RENDERED SIGNATURE IN IPHONE */}
                                                <div className="pt-2 border-t border-dashed border-gray-200 dark:border-neutral-800 overflow-x-auto">
                                                    <div dangerouslySetInnerHTML={{ __html: rawHtml }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ACTION BUTTONS ROW */}
                            <div className="mt-6 flex flex-wrap gap-3 items-center justify-between border-t border-white/10 pt-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        onClick={copyRichText}
                                        className="px-5 py-3 bg-neon-orange hover:bg-orange-500 text-black font-black uppercase text-xs tracking-wider rounded-2xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(255,102,0,0.3)] active:scale-95"
                                    >
                                        {copyStatus === 'rich_success' ? (
                                            <>
                                                <Check className="w-4 h-4 text-black" />
                                                Copiée dans le presse-papier !
                                            </>
                                        ) : (
                                            <>
                                                <Smartphone className="w-4 h-4 text-black" />
                                                1. Copier la Signature Enrichie
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={copyRawHtml}
                                        className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase text-xs tracking-wider rounded-2xl flex items-center gap-2 transition-all"
                                        title="Copier le code source HTML brut pour Webmail source"
                                    >
                                        {copyStatus === 'html_success' ? (
                                            <>
                                                <Check className="w-4 h-4 text-neon-cyan" />
                                                Code HTML copié
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4 text-gray-400" />
                                                Copier Code HTML
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={downloadHtmlFile}
                                        className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase text-xs tracking-wider rounded-2xl flex items-center gap-2 transition-all"
                                        title="Télécharger un fichier .html autonome"
                                    >
                                        <Download className="w-4 h-4 text-gray-400" />
                                        Fichier .html
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowIphoneTipModal(true)}
                                    className="text-xs text-neon-orange hover:underline font-bold flex items-center gap-1.5"
                                >
                                    <HelpCircle className="w-4 h-4" />
                                    Comment l'installer sur iPhone ?
                                </button>
                            </div>
                        </div>

                        {/* STEP-BY-STEP GUIDES (Tabs) */}
                        <div className="bg-dark-bg/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 flex-wrap gap-2">
                                <h3 className="text-base font-display font-black uppercase italic tracking-wider text-white flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4 text-neon-cyan" />
                                    Guide d'installation pas à pas
                                </h3>

                                <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1">
                                    <button
                                        onClick={() => setActiveGuideTab('iphone')}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                                            activeGuideTab === 'iphone'
                                                ? 'bg-neon-orange text-black'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        📱 iPhone (iOS)
                                    </button>
                                    <button
                                        onClick={() => setActiveGuideTab('webmail')}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                                            activeGuideTab === 'webmail'
                                                ? 'bg-neon-orange text-black'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        🌐 Webmail (LWS)
                                    </button>
                                    <button
                                        onClick={() => setActiveGuideTab('gmail')}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                                            activeGuideTab === 'gmail'
                                                ? 'bg-neon-orange text-black'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        📧 Gmail / Outlook
                                    </button>
                                </div>
                            </div>

                            {/* TAB: IPHONE */}
                            {activeGuideTab === 'iphone' && (
                                <div className="space-y-4 text-xs text-gray-300">
                                    <div className="bg-neon-orange/10 border border-neon-orange/30 rounded-2xl p-4 flex items-start gap-3">
                                        <Sparkles className="w-5 h-5 text-neon-orange shrink-0 mt-0.5" />
                                        <div>
                                            <strong className="text-white block font-bold text-sm mb-1 uppercase tracking-wide">
                                                L'Astuce Magique iPhone : « Shake to Undo »
                                            </strong>
                                            Quand vous collez une signature sur iOS, Apple change parfois la mise en page. Pour l'empêcher, il suffit de <strong>secouer votre iPhone</strong> juste après avoir collé et d'appuyer sur <em>« Annuler la modification d'attribut »</em> !
                                        </div>
                                    </div>

                                    <ol className="space-y-3 list-decimal list-inside pl-1">
                                        <li className="leading-relaxed">
                                            Cliquez sur le bouton orange <strong>« Copier la Signature Enrichie »</strong> ci-dessus (ou envoyez-vous cet écran sur votre iPhone).
                                        </li>
                                        <li className="leading-relaxed">
                                            Sur votre iPhone, ouvrez l'application <strong>Réglages</strong> &gt; faites défiler jusqu'à <strong>Mail</strong> &gt; descendez tout en bas et appuyez sur <strong>Signature</strong>.
                                        </li>
                                        <li className="leading-relaxed">
                                            Sélectionnez <em>« Par compte »</em> (choisissez votre compte Dropsiders) ou <em>« Tous les comptes »</em>.
                                        </li>
                                        <li className="leading-relaxed">
                                            Effacez le texte actuel (ex: « Envoyé de mon iPhone »), faites un appui long dans le champ et choisissez <strong>Coller</strong>.
                                        </li>
                                        <li className="leading-relaxed bg-white/5 border border-white/10 p-3 rounded-xl">
                                            <span className="text-neon-orange font-black uppercase">Étape clé :</span> Immédiatement après avoir collé, <strong>secouez physiquement votre iPhone</strong> d'un geste sec. Une boîte de dialogue Apple apparaît avec le message <em>« Annuler la modification d'attribut »</em>. Appuyez sur <strong>Annuler</strong> ! Votre signature retrouve ses couleurs exactes et son logo sans déformation.
                                        </li>
                                    </ol>
                                </div>
                            )}

                            {/* TAB: WEBMAIL LWS */}
                            {activeGuideTab === 'webmail' && (
                                <div className="space-y-3 text-xs text-gray-300">
                                    <p className="leading-relaxed">
                                        Pour configurer votre signature sur le webmail de votre hébergeur (Roundcube / LWS) :
                                    </p>
                                    <ol className="space-y-2 list-decimal list-inside pl-1">
                                        <li>Connectez-vous à votre webmail (ex: <code>webmail.dropsiders.fr</code> ou LWS).</li>
                                        <li>Allez dans <strong>Paramètres</strong> (roue crantée) &gt; <strong>Identités</strong>.</li>
                                        <li>Cliquez sur votre adresse email dans la liste.</li>
                                        <li>Cochez la case <strong>« Signature en HTML »</strong>.</li>
                                        <li>
                                            Dans le champ de signature :
                                            <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-gray-400">
                                                <li><strong>Méthode 1 (Simple) :</strong> Collez directement avec Ctrl+V (après avoir cliqué sur « Copier la signature enrichie »).</li>
                                                <li><strong>Méthode 2 (Code HTML pur) :</strong> Cliquez sur l'icône <code>&lt;&gt;</code> (Code source HTML) de l'éditeur de signature et collez le contenu du bouton « Copier Code HTML ».</li>
                                            </ul>
                                        </li>
                                        <li>Cliquez sur <strong>Enregistrer</strong>. Vos prochains emails contiendront automatiquement cette signature.</li>
                                    </ol>
                                </div>
                            )}

                            {/* TAB: GMAIL / OUTLOOK */}
                            {activeGuideTab === 'gmail' && (
                                <div className="space-y-3 text-xs text-gray-300">
                                    <p className="leading-relaxed">
                                        Pour Gmail, Outlook Web ou Apple Mail Mac :
                                    </p>
                                    <ol className="space-y-2 list-decimal list-inside pl-1">
                                        <li>Cliquez sur le bouton orange <strong>« Copier la Signature Enrichie »</strong>.</li>
                                        <li>
                                            <strong>Dans Gmail :</strong> Roue crantée &gt; <em>Voir tous les paramètres</em> &gt; onglet <em>Général</em> &gt; section <em>Signature</em> &gt; Créez une nouvelle signature &gt; Collez directement (Ctrl+V ou Cmd+V) &gt; Enregistrer les modifications.
                                        </li>
                                        <li>
                                            <strong>Dans Outlook (Web ou App) :</strong> Paramètres &gt; <em>Courrier</em> &gt; <em>Composer et répondre</em> &gt; Nouvelle signature &gt; Coller &gt; Enregistrer.
                                        </li>
                                        <li>
                                            <strong>Dans Apple Mail sur Mac :</strong> Mail &gt; <em>Réglages</em> &gt; <em>Signatures</em> &gt; Décochez « Toujours utiliser ma police par défaut » &gt; Collez la signature.
                                        </li>
                                    </ol>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* IPHONE TIP POPUP MODAL */}
            <AnimatePresence>
                {showIphoneTipModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-dark-bg border border-neon-orange/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-neon-orange/20 border border-neon-orange/40 flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-6 h-6 text-neon-orange" />
                            </div>

                            <h3 className="text-xl font-display font-black uppercase italic tracking-tight text-white mb-2">
                                Signature copiée avec succès !
                            </h3>

                            <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                                Le format enrichi (avec images, logo et liens) est dans votre presse-papier.
                            </p>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs space-y-2 mb-6">
                                <div className="text-neon-orange font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <Smartphone className="w-4 h-4" />
                                    Pour iPhone (Rappel) :
                                </div>
                                <p className="text-gray-300">
                                    1. Collez dans <strong>Réglages &gt; Mail &gt; Signature</strong>.<br />
                                    2. <strong>Secouez votre iPhone</strong> d'un geste sec.<br />
                                    3. Touchez <strong>« Annuler la modification d'attribut »</strong> pour garder la mise en forme exacte !
                                </p>
                            </div>

                            <button
                                onClick={() => setShowIphoneTipModal(false)}
                                className="w-full py-3 bg-neon-orange hover:bg-orange-500 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all"
                            >
                                J'ai compris
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
