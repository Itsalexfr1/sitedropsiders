import React, { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Gamepad2, Trophy, Clock, ShieldAlert, Sparkles, Share2, 
    CheckCircle2, XCircle, AlertTriangle, Instagram, Copy, 
    ExternalLink, ArrowRight, Heart, UserPlus, Gift, Download,
    Send, Radio, HelpCircle, Check, Flame, ChevronDown, Bell
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
    generateBrowserFingerprint, 
    checkHasAlreadyParticipated, 
    saveLocalContestEntry, 
    getLocalContestEntry,
    getAllContestEntries,
    saveAllContestEntries,
    evaluateContestAnswers,
    generateReferralCode,
    type GTAContestEntry 
} from '../utils/gtaContestSecurity';
import { generateGTA6StoryVisual } from '../utils/gtaStoryVisual';
import { useUser } from '../context/UserContext';
import { SEO } from '../components/utils/SEO';

// Countdown Target: Clôture le 12 novembre à 00h00
const CONTEST_CLOSE_DATE = new Date('2026-11-12T00:00:00');

export function GTAContestPage() {
    const [searchParams] = useSearchParams();
    const { isLoggedIn, user, showNotification } = useUser();

    // Fingerprint & Attempt Check
    const [fingerprint, setFingerprint] = useState<string>('');
    const [existingEntry, setExistingEntry] = useState<GTAContestEntry | null>(null);
    const [isCheckingAttempt, setIsCheckingAttempt] = useState(true);

    // Form fields
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [instagram, setInstagram] = useState('');
    const [email, setEmail] = useState('');
    const [plateforme, setPlateforme] = useState<'PlayStation 5 (PS5)' | 'Xbox'>('PlayStation 5 (PS5)');
    const [createAccountBonus, setCreateAccountBonus] = useState(false);

    // Questions
    const [q1, setQ1] = useState('');
    const [q2, setQ2] = useState('');
    const [q3, setQ3] = useState('');

    // Referral code incoming
    const refParam = searchParams.get('ref') || searchParams.get('parrain') || searchParams.get('code') || '';
    const [referredBy, setReferredBy] = useState(refParam);

    useEffect(() => {
        const ref = searchParams.get('ref') || searchParams.get('parrain') || searchParams.get('code');
        if (ref) {
            setReferredBy(ref.toUpperCase().trim());
        }
    }, [searchParams]);

    // UI States
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isOptinModalOpen, setIsOptinModalOpen] = useState(false);
    const [activeEntry, setActiveEntry] = useState<GTAContestEntry | null>(null);
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);
    const [copiedReferral, setCopiedReferral] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);

    // Social post URLs for Contest like buttons
    const [instaPostUrl, setInstaPostUrl] = useState<string>(() => {
        return localStorage.getItem('dropsiders_gta_contest_insta_url') || 'https://www.instagram.com/dropsiders.fr';
    });
    const [tiktokPostUrl, setTiktokPostUrl] = useState<string>(() => {
        return localStorage.getItem('dropsiders_gta_contest_tiktok_url') || 'https://www.tiktok.com/@dropsiders.fr';
    });

    // Synchronize social links from server settings
    useEffect(() => {
        fetch('/api/settings')
            .then(r => r.json())
            .then(data => {
                if (data) {
                    if (data.gta_contest_insta_url) {
                        setInstaPostUrl(data.gta_contest_insta_url);
                        localStorage.setItem('dropsiders_gta_contest_insta_url', data.gta_contest_insta_url);
                    }
                    if (data.gta_contest_tiktok_url) {
                        setTiktokPostUrl(data.gta_contest_tiktok_url);
                        localStorage.setItem('dropsiders_gta_contest_tiktok_url', data.gta_contest_tiktok_url);
                    }
                }
            })
            .catch(() => {});

        const handleSettingsSync = () => {
            const localInsta = localStorage.getItem('dropsiders_gta_contest_insta_url');
            const localTiktok = localStorage.getItem('dropsiders_gta_contest_tiktok_url');
            if (localInsta) setInstaPostUrl(localInsta);
            if (localTiktok) setTiktokPostUrl(localTiktok);
        };
        window.addEventListener('dropsiders_settings_updated', handleSettingsSync);
        return () => window.removeEventListener('dropsiders_settings_updated', handleSettingsSync);
    }, []);

    // Countdown Timer State
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
        days: 0, hours: 0, minutes: 0, seconds: 0
    });

    // 1. Initialize Fingerprint & Check Attempts
    useEffect(() => {
        let mounted = true;
        const init = async () => {
            try {
                const fp = await generateBrowserFingerprint();
                if (!mounted) return;
                setFingerprint(fp);

                // Check URL for email opt-in token confirmation (?confirm=...)
                const confirmToken = searchParams.get('confirm') || searchParams.get('token');
                if (confirmToken) {
                    handleDirectTokenConfirm(confirmToken);
                }

                // Check local participation
                const check = checkHasAlreadyParticipated(fp);
                if (check.alreadyPlayed && check.entry) {
                    let entry = check.entry;
                    let shouldResave = false;
                    if (!entry.referralCode) {
                        entry.referralCode = generateReferralCode();
                        shouldResave = true;
                    }
                    // Auto-validation : si les réponses étaient correctes mais bloquées en attente d'opt-in email
                    if (entry.status === 'PENDING_OPT_IN' && entry.isAllCorrect) {
                        entry = {
                            ...entry,
                            status: 'VALIDATED',
                            isOptedIn: true,
                            optedInAt: entry.optedInAt || new Date().toISOString()
                        };
                        shouldResave = true;
                    }
                    if (shouldResave) {
                        const all = getAllContestEntries();
                        const idx = all.findIndex(e => e.id === entry.id);
                        if (idx !== -1) {
                            all[idx] = entry;
                            saveAllContestEntries(all);
                        }
                        saveLocalContestEntry(entry);
                    }
                    setExistingEntry(entry);
                    setActiveEntry(entry);
                }
            } catch (err) {
                console.error("Erreur d'initialisation du concours:", err);
            } finally {
                if (mounted) setIsCheckingAttempt(false);
            }
        };

        init();
        return () => { mounted = false; };
    }, [searchParams]);

    // Handle incoming direct token confirmation
    const handleDirectTokenConfirm = (token: string) => {
        const all = getAllContestEntries();
        const foundIndex = all.findIndex(e => e.optInToken === token);
        if (foundIndex !== -1) {
            const entry = all[foundIndex];
            if (entry.status === 'PENDING_OPT_IN' && entry.isAllCorrect) {
                entry.status = 'VALIDATED';
                entry.isOptedIn = true;
                entry.optedInAt = new Date().toISOString();
                all[foundIndex] = entry;
                saveAllContestEntries(all);
                saveLocalContestEntry(entry);
                setExistingEntry(entry);
                setActiveEntry(entry);
                setIsShareModalOpen(true);
                showNotification?.("🎉 Ton e-mail a été validé avec succès ! Ta participation au concours GTA 6 est confirmée.", "success");
            }
        }
    };

    // 2. Countdown Timer
    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +CONTEST_CLOSE_DATE - +new Date();
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, []);

    // 3. Form Validation Trigger
    const handlePreSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!nom.trim() || !prenom.trim() || !instagram.trim() || !email.trim()) {
            alert("Veuillez remplir tous les champs obligatoires (Nom, Prénom, Instagram, E-mail).");
            return;
        }

        if (!email.includes('@') || !email.includes('.')) {
            alert("Veuillez saisir une adresse e-mail valide.");
            return;
        }

        if (!q1.trim() || !q2.trim() || !q3.trim()) {
            alert("Veuillez répondre aux 3 questions avant de continuer.");
            return;
        }

        // Open Confirmation Alert Modal
        setIsConfirmModalOpen(true);
    };

    // 4. Final Submission Execution
    const handleFinalConfirmSubmit = async () => {
        setIsConfirmModalOpen(false);
        setIsSubmitting(true);

        try {
            // Evaluate knowledge questions
            const evalResult = evaluateContestAnswers(q1, q2, q3);
            const referralCode = generateReferralCode();
            const optInToken = 'ds_opt_' + Math.random().toString(36).substring(2, 12);

            // 1 valid entry for the official lottery
            const totalTickets = evalResult.isAllCorrect ? 1 : 0;

            const newEntry: GTAContestEntry = {
                id: 'gta_' + Date.now(),
                nom: nom.trim(),
                prenom: prenom.trim(),
                instagram: instagram.trim().startsWith('@') ? instagram.trim() : `@${instagram.trim()}`,
                email: email.trim().toLowerCase(),
                plateforme,
                hasAccountBonus: false,
                referralCode,
                referredBy: referredBy.trim() ? referredBy.trim().toUpperCase() : undefined,
                referralCount: 0,
                totalTickets,
                answers: { q1: q1.trim(), q2: q2.trim(), q3: q3.trim() },
                answersValid: {
                    q1: evalResult.q1Valid,
                    q2: evalResult.q2Valid,
                    q3: evalResult.q3Valid,
                },
                isAllCorrect: evalResult.isAllCorrect,
                isOptedIn: evalResult.isAllCorrect,
                optedInAt: evalResult.isAllCorrect ? new Date().toISOString() : undefined,
                optInToken,
                fingerprint: fingerprint || 'fp_' + Date.now(),
                createdAt: new Date().toISOString(),
                status: evalResult.isAllCorrect ? 'VALIDATED' : 'FAILED',
                rejectionReason: evalResult.isAllCorrect 
                    ? undefined 
                    : `Erreur aux questions : ${!evalResult.q1Valid ? 'Q1 ' : ''}${!evalResult.q2Valid ? 'Q2 ' : ''}${!evalResult.q3Valid ? 'Q3' : ''}`.trim()
            };

            // Save in all entries registry
            const all = getAllContestEntries();

            // Credit referrer if applicable and valid
            if (referredBy) {
                const referrer = all.find(e => e.referralCode === referredBy);
                if (referrer && referrer.status === 'VALIDATED') {
                    referrer.referralCount = (referrer.referralCount || 0) + 1;
                    referrer.totalTickets = (referrer.totalTickets || 1) + 1;
                }
            }

            all.unshift(newEntry);
            saveAllContestEntries(all);

            // Save local persistent entry (locks this browser / user)
            saveLocalContestEntry(newEntry);
            setExistingEntry(newEntry);
            setActiveEntry(newEntry);

            // Try sending to backend worker if accessible
            try {
                await fetch('/api/gta-contest/participate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newEntry)
                });
            } catch (err) {
                // Local fallback handled gracefully
            }

            // Direct validation without email waiting
            if (evalResult.isAllCorrect) {
                setIsShareModalOpen(true);
                // Trigger Victory Confetti!
                confetti({
                    particleCount: 120,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#ff007f', '#00f0ff', '#ffffff', '#ffe600']
                });
                showNotification?.("🎉 Félicitations ! Tes 3 réponses sont correctes, ta participation au concours GTA 6 est validée !", "success");
            } else {
                // If failed, notify clearly
                showNotification?.("⚠️ Réponses incorrectes. Votre participation a été enregistrée mais est malheureusement invalidée.", "error");
            }

        } catch (err) {
            console.error("Erreur lors de la soumission:", err);
            alert("Une erreur est survenue lors de la validation. Veuillez réessayer.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 5. Simulate / Confirm Double Opt-in Action
    const handleSimulateOptInConfirm = () => {
        if (!activeEntry) return;

        const all = getAllContestEntries();
        const found = all.find(e => e.id === activeEntry.id);
        if (found) {
            found.status = 'VALIDATED';
            found.isOptedIn = true;
            found.optedInAt = new Date().toISOString();
            saveAllContestEntries(all);
            saveLocalContestEntry(found);
            setExistingEntry(found);
            setActiveEntry(found);

            setIsOptinModalOpen(false);
            setIsShareModalOpen(true);

            // Trigger Victory Confetti!
            confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#ff007f', '#00f0ff', '#ffffff', '#ffe600']
            });

            showNotification?.("🎉 E-mail confirmé avec succès ! Tu es officiellement qualifié(e) pour le tirage au sort GTA 6 !", "success");
        }
    };

    // 6. Generate Instagram Story Image
    const handleDownloadStory = async () => {
        if (!activeEntry) return;
        setIsGeneratingStory(true);
        try {
            const dataUrl = await generateGTA6StoryVisual({
                prenom: activeEntry.prenom,
                instagram: activeEntry.instagram,
                plateforme: activeEntry.plateforme,
                referralCode: activeEntry.referralCode,
                tickets: activeEntry.totalTickets
            });

            if (dataUrl) {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `dropsiders-gta6-story-${activeEntry.prenom}.png`;
                link.click();
                showNotification?.("📸 Story Instagram générée ! Téléchargement lancé.", "success");
            }
        } catch (err) {
            console.error("Erreur génération story:", err);
            alert("Impossible de générer l'image de story.");
        } finally {
            setIsGeneratingStory(false);
        }
    };

    // 7. Copy Referral Link
    const referralUrl = typeof window !== 'undefined' && activeEntry 
        ? `${window.location.origin}/concours-gta6?ref=${activeEntry.referralCode}`
        : '';

    const handleCopyReferral = () => {
        if (!referralUrl) return;
        navigator.clipboard.writeText(referralUrl);
        setCopiedReferral(true);
        setTimeout(() => setCopiedReferral(false), 2500);
        showNotification?.("🔗 Lien de parrainage copié dans le presse-papiers !", "success");
    };

    const handleCopyCode = (code: string) => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
        showNotification?.("📋 Code de parrainage copié !", "success");
    };

    return (
        <div className="min-h-screen bg-[#0d0221] text-white relative overflow-hidden font-sans selection:bg-[#ff007f] selection:text-white">
            <SEO 
                title="🎮 GRAND JEU CONCOURS GTA 6 : Gagne ton jeu sur PS5 ou Xbox"
                description="Participe gratuitement au grand jeu concours officiel Dropsiders et tente de gagner ton jeu GTA 6 sur PlayStation 5 ou Xbox ! Tirage au sort certifié."
                image="https://dropsiders.fr/images/og_concours_gta6.jpg"
            />
            
            {/* =========================================================================
                AMBIANCE GTA 6 : VIDÉO OFFICIELLE EN FOND DE PAGE PLEIN ÉCRAN
            ========================================================================= */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0d0221]">
                {/* Vidéo Teaser en plein écran en arrière-plan (Autoplay, Mute, Loop) */}
                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none opacity-60">
                    <iframe
                        className="w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none scale-105"
                        src="https://www.youtube.com/embed/QdBZY2fkU-0?autoplay=1&mute=1&loop=1&playlist=QdBZY2fkU-0&controls=0&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1&playsinline=1"
                        title="GTA VI Teaser Fond d'écran"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                </div>

                {/* Voile sombre pour garantir une lisibilité parfaite des textes et formulaires */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0d0221]/75 via-[#0d0221]/60 to-[#0d0221]/85" />
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-[#ff007f]/20 via-[#9900ff]/15 to-transparent rounded-full blur-[140px]" />
                <div className="absolute top-[40%] -left-40 w-[600px] h-[600px] bg-[#00f0ff]/10 rounded-full blur-[160px]" />
                <div className="absolute top-[60%] -right-40 w-[600px] h-[600px] bg-[#ff007f]/10 rounded-full blur-[160px]" />
                
                {/* Grille perspective rétro synthwave au bas */}
                <div 
                    className="absolute bottom-0 left-0 right-0 h-96 opacity-15"
                    style={{
                        background: 'linear-gradient(to bottom, transparent 0%, rgba(13, 2, 33, 0.95) 100%), repeating-linear-gradient(0deg, transparent, transparent 38px, rgba(0, 240, 255, 0.3) 38px, rgba(0, 240, 255, 0.3) 40px)',
                        transform: 'perspective(500px) rotateX(60deg)',
                        transformOrigin: 'bottom center'
                    }}
                />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">

                {/* =========================================================================
                    TOP BADGE & BRANDING
                ========================================================================= */}
                <div className="flex flex-col items-center justify-center text-center mb-6">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-black/60 border border-[#ff007f]/40 shadow-[0_0_25px_rgba(255,0,127,0.35)] backdrop-blur-xl mb-4"
                    >
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] animate-ping" />
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#00f0ff]">
                            GRAND JEU CONCOURS OFFICIEL DROPSIDERS
                        </span>
                        <Sparkles className="w-4 h-4 text-[#ff007f]" />
                    </motion.div>

                    {/* H1 NEON TITLE */}
                    <motion.h1 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl sm:text-5xl lg:text-6xl font-black font-display uppercase italic tracking-tighter text-center leading-normal sm:leading-[1.25] max-w-5xl py-2"
                        style={{
                            textShadow: '0 0 20px rgba(255, 0, 127, 0.6), 0 0 45px rgba(0, 240, 255, 0.4)'
                        }}
                    >
                        DROPSIDERS TE FAIT GAGNER{' '}
                        <span 
                            className="inline-block pb-4 pt-1 px-2 align-baseline text-transparent bg-clip-text bg-gradient-to-r from-[#ff007f] via-[#ffe600] to-[#00f0ff]"
                            style={{
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            GTA 6
                        </span>{' '}
                        SUR LA PLATEFORME DE TON CHOIX
                    </motion.h1>
                </div>

                {/* =========================================================================
                    COMPTE À REBOURS DYNAMIQUE (FOMO)
                ========================================================================= */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="max-w-2xl mx-auto mb-10"
                >
                    <div className="bg-black/50 border border-[#00f0ff]/30 rounded-3xl p-5 backdrop-blur-xl shadow-[0_0_35px_rgba(0,240,255,0.15)] flex flex-col items-center">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-[#00f0ff] mb-4">
                            <Clock className="w-4 h-4 animate-pulse text-[#ff007f]" />
                            <span>TEMPS RESTANT AVANT LA CLÔTURE DÉFINITIVE (12 NOVEMBRE 00H00)</span>
                        </div>

                        <div className="grid grid-cols-4 gap-3 sm:gap-6 w-full text-center">
                            {[
                                { label: 'JOURS', value: timeLeft.days },
                                { label: 'HEURES', value: timeLeft.hours },
                                { label: 'MINUTES', value: timeLeft.minutes },
                                { label: 'SECONDES', value: timeLeft.seconds }
                            ].map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#ff007f]/50 transition-colors"
                                >
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff007f] to-[#00f0ff] opacity-75" />
                                    <span className="text-2xl sm:text-4xl font-black font-display text-white tracking-wider tabular-nums group-hover:scale-105 transition-transform">
                                        {String(item.value).padStart(2, '0')}
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* =========================================================================
                    CHECK IF USER HAS ALREADY PARTICIPATED (LOCKED ANTI-CHEAT VIEW)
                ========================================================================= */}
                {existingEntry ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-3xl mx-auto bg-black/70 border border-[#00f0ff]/50 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)] mb-16 text-center"
                    >
                        <div className="w-20 h-20 mx-auto rounded-3xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center mb-6">
                            {existingEntry.status === 'VALIDATED' ? (
                                <CheckCircle2 className="w-10 h-10 text-[#00f0ff]" />
                            ) : existingEntry.status === 'PENDING_OPT_IN' ? (
                                <Clock className="w-10 h-10 text-[#ffe600] animate-spin-slow" />
                            ) : (
                                <XCircle className="w-10 h-10 text-[#ff007f]" />
                            )}
                        </div>

                        <div className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 bg-white/10 text-white border border-white/20">
                            PARTICIPATION ENREGISTRÉE • TENTATIVE UNIQUE VERROUILLÉE
                        </div>

                        {searchParams.get('ref') && (
                            <div className="max-w-xl mx-auto mb-6 p-4 rounded-2xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-center animate-in fade-in">
                                {searchParams.get('ref')?.toUpperCase().trim() === existingEntry.referralCode?.toUpperCase().trim() ? (
                                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#00f0ff]">
                                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00f0ff]" />
                                        <span>C'est bien ton lien de parrainage personnel ({existingEntry.referralCode}) ! Partage-le à tes amis pour qu'ils s'inscrivent depuis leur téléphone ou ordinateur.</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-yellow-400">
                                        <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-400" />
                                        <span>Lien de parrainage ami détecté ({searchParams.get('ref')}), mais ta propre participation est déjà enregistrée sur cet appareil !</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <h2 className="text-3xl font-display font-black uppercase italic tracking-tight text-white mb-3">
                            {existingEntry.status === 'VALIDATED' && (
                                <>FÉLICITATIONS <span className="text-[#00f0ff]">{existingEntry.prenom.toUpperCase()}</span> !</>
                            )}
                            {existingEntry.status === 'PENDING_OPT_IN' && (
                                <>CONFIRMATION E-MAIL REQUISE POUR <span className="text-[#ffe600]">{existingEntry.prenom.toUpperCase()}</span></>
                            )}
                            {existingEntry.status === 'FAILED' && (
                                <>PARTICIPATION INVALIDÉE POUR <span className="text-[#ff007f]">{existingEntry.prenom.toUpperCase()}</span></>
                            )}
                        </h2>

                        <p className="text-gray-300 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
                            {existingEntry.status === 'VALIDATED' && (
                                `Ta participation sur ${existingEntry.plateforme} est officiellement validée avec ${existingEntry.totalTickets} chance(s) au tirage au sort ! Partage ton lien de parrainage pour cumuler encore plus de chances.`
                            )}
                            {existingEntry.status === 'FAILED' && (
                                `Tu n'as pas obtenu les 3 bonnes réponses aux questions de connaissance. Conformément au règlement, une seule tentative par personne et par empreinte de navigateur est autorisée.`
                            )}
                        </p>

                        {/* Status detail box */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-xl mx-auto mb-8 text-left space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400 font-bold uppercase">Plateforme :</span>
                                <span className="text-[#00f0ff] font-black">{existingEntry.plateforme}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400 font-bold uppercase">Instagram :</span>
                                <span className="text-white font-black">{existingEntry.instagram}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-bold uppercase">Numéro de Parrainage :</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[#00f0ff] font-mono font-black">{existingEntry.referralCode || 'DS-N/A'}</span>
                                    {existingEntry.referralCode && (
                                        <button
                                            type="button"
                                            onClick={() => handleCopyCode(existingEntry.referralCode)}
                                            className="px-2 py-0.5 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/25 border border-[#00f0ff]/30 text-[#00f0ff] rounded-md text-[10px] font-bold uppercase transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                                            title="Copier le code de parrainage"
                                        >
                                            {copiedCode ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                            <span>{copiedCode ? 'Copié !' : 'Copier'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400 font-bold uppercase">Statut :</span>
                                <span className={`font-black uppercase ${
                                    existingEntry.status === 'VALIDATED' ? 'text-green-400' : 'text-red-400'
                                }`}>
                                    {existingEntry.status === 'VALIDATED' ? '🟢 VALIDÉE' : '🔴 ÉCHOUÉE'}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs border-t border-white/10 pt-3">
                                <span className="text-gray-400 font-bold uppercase">Tirage au Sort :</span>
                                <span className="text-[#00f0ff] font-black text-sm">🎟️ Participation Validée</span>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            {existingEntry.status !== 'FAILED' && (
                                <>
                                    <button
                                        onClick={() => setIsShareModalOpen(true)}
                                        className="px-8 py-4 bg-gradient-to-r from-[#ff007f] to-[#00f0ff] text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-[0_0_25px_rgba(255,0,127,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Partager ma Participation & Parrainer
                                    </button>
                                    <button
                                        onClick={handleDownloadStory}
                                        disabled={isGeneratingStory}
                                        className="px-6 py-4 bg-white/10 border border-white/20 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-white/20 transition-all flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4 text-[#00f0ff]" />
                                        {isGeneratingStory ? 'Génération...' : 'Télécharger Story Insta'}
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    /* =========================================================================
                        FORMULAIRE PRINCIPAL DE PARTICIPATION & QUESTIONS
                    ========================================================================= */
                    <form onSubmit={handlePreSubmit} className="max-w-4xl mx-auto space-y-12 mb-20">
                        
                        {/* INCOMING REFERRAL BADGE */}
                        {referredBy && (
                            <div className="bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <Gift className="w-5 h-5 text-[#00f0ff]" />
                                    <span className="text-xs font-bold text-gray-200">
                                        Invitation de parrainage activée (Code : <strong className="text-[#00f0ff]">{referredBy}</strong>).
                                    </span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff] bg-[#00f0ff]/20 px-3 py-1 rounded-full">
                                    BONUS AMI
                                </span>
                            </div>
                        )}

                        {/* PART 1 : COORDONNÉES ET PLATEFORME */}
                        <div className="bg-black/60 border border-white/10 rounded-[2.5rem] p-6 sm:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff007f] via-[#00f0ff] to-[#ff007f]" />

                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-2xl bg-[#ff007f]/20 border border-[#ff007f]/40 flex items-center justify-center">
                                    <Gamepad2 className="w-5 h-5 text-[#ff007f]" />
                                </div>
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-black font-display uppercase italic tracking-tight text-white">
                                        1. Tes Coordonnées & Ta Plateforme
                                    </h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                        Remplis tes informations pour recevoir le jeu GTA 6 en cas de victoire
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-300 mb-2">
                                        Nom <span className="text-[#ff007f]">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Ex: Dupont"
                                        value={nom}
                                        onChange={(e) => setNom(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 font-bold focus:outline-none focus:border-[#ff007f] focus:bg-white/10 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-300 mb-2">
                                        Prénom <span className="text-[#ff007f]">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Ex: Alexandre"
                                        value={prenom}
                                        onChange={(e) => setPrenom(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 font-bold focus:outline-none focus:border-[#ff007f] focus:bg-white/10 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-300 mb-2">
                                        Compte Instagram <span className="text-[#ff007f]">*</span>
                                    </label>
                                    <div className="relative">
                                        <Instagram className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="@toncompte"
                                            value={instagram}
                                            onChange={(e) => setInstagram(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-5 py-4 text-white placeholder-gray-500 font-bold focus:outline-none focus:border-[#00f0ff] focus:bg-white/10 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-300 mb-2">
                                        Adresse E-mail <span className="text-[#ff007f]">*</span>
                                    </label>
                                    <input 
                                        type="email" 
                                        required
                                        placeholder="ton.email@exemple.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 font-bold focus:outline-none focus:border-[#00f0ff] focus:bg-white/10 transition-all"
                                    />
                                </div>

                                {/* CHAMP CODE PARRAIN (OPTIONNEL) */}
                                <div className="sm:col-span-2 bg-[#ffe600]/10 border border-[#ffe600]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#ffe600]/20 border border-[#ffe600]/40 flex items-center justify-center shrink-0">
                                            <Gift className="w-5 h-5 text-[#ffe600]" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-[#ffe600]">
                                                Code Parrain <span className="text-gray-400 font-medium normal-case">(optionnel)</span>
                                            </label>
                                            <p className="text-[11px] text-gray-300 font-medium">
                                                Si un ami t'a partagé son code de parrainage (ex: en story), saisis-le ici !
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-60">
                                        <input 
                                            type="text" 
                                            placeholder="Ex: DS-FTB43W"
                                            value={referredBy}
                                            onChange={(e) => setReferredBy(e.target.value.toUpperCase().trim())}
                                            className="w-full bg-black/60 border border-[#ffe600]/50 rounded-xl px-4 py-3 text-[#ffe600] placeholder-gray-500 font-black tracking-widest text-center uppercase focus:outline-none focus:border-[#ffe600] focus:ring-2 focus:ring-[#ffe600]/30 transition-all text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* CHOIX DE LA PLATEFORME (RADIO BUTTONS CARDS) */}
                            <div className="mb-6">
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-300 mb-3">
                                    Plateforme Choisie pour GTA 6 <span className="text-[#ff007f]">*</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* CARTE PLAYSTATION 5 (FOND BLEU) */}
                                    <button
                                        type="button"
                                        onClick={() => setPlateforme('PlayStation 5 (PS5)')}
                                        className={`p-5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                                            plateforme === 'PlayStation 5 (PS5)'
                                                ? 'bg-[#0070d1] border-[#38bdf8] shadow-[0_0_35px_rgba(0,112,209,0.65)] ring-2 ring-[#38bdf8]/50'
                                                : 'bg-[#0070d1]/15 border-[#0070d1]/40 hover:bg-[#0070d1]/25 hover:border-[#0070d1]/70'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 px-2.5 rounded-xl flex items-center justify-center shrink-0 border ${
                                                plateforme === 'PlayStation 5 (PS5)'
                                                    ? 'bg-black/25 border-white/30'
                                                    : 'bg-[#0070d1]/30 border-[#0070d1]/40'
                                            }`}>
                                                <img 
                                                    src="/images/ps5_logo_white.png" 
                                                    alt="PlayStation 5" 
                                                    className="h-7 w-auto max-w-[100px] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" 
                                                />
                                            </div>
                                            <div>
                                                <div className="font-black text-sm text-white flex items-center gap-2">
                                                    <span>PlayStation 5</span>
                                                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-black uppercase">
                                                        PS5
                                                    </span>
                                                </div>
                                                <div className={`text-[10px] font-bold ${
                                                    plateforme === 'PlayStation 5 (PS5)' ? 'text-blue-100' : 'text-gray-300'
                                                }`}>
                                                    Code digital PS Store officiel
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                            plateforme === 'PlayStation 5 (PS5)' ? 'border-white bg-white text-[#0070d1]' : 'border-white/30'
                                        }`}>
                                            {plateforme === 'PlayStation 5 (PS5)' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                        </div>
                                    </button>

                                    {/* CARTE XBOX SERIES X (FOND VERT) */}
                                    <button
                                        type="button"
                                        onClick={() => setPlateforme('Xbox')}
                                        className={`p-5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                                            plateforme === 'Xbox'
                                                ? 'bg-[#107c10] border-[#4ade80] shadow-[0_0_35px_rgba(16,124,16,0.65)] ring-2 ring-[#4ade80]/50'
                                                : 'bg-[#107c10]/15 border-[#107c10]/40 hover:bg-[#107c10]/25 hover:border-[#107c10]/70'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border p-1 ${
                                                plateforme === 'Xbox'
                                                    ? 'bg-black/25 border-white/30'
                                                    : 'bg-[#107c10]/30 border-[#107c10]/40'
                                            }`}>
                                                <img 
                                                    src="/images/xbox_series_x_logo_official.png" 
                                                    alt="Xbox Series X" 
                                                    className="w-9 h-9 object-contain brightness-0 invert drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" 
                                                />
                                            </div>
                                            <div>
                                                <div className="font-black text-sm text-white flex items-center gap-2">
                                                    <span>Xbox Series X</span>
                                                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-black uppercase">
                                                        XBOX
                                                    </span>
                                                </div>
                                                <div className={`text-[10px] font-bold ${
                                                    plateforme === 'Xbox' ? 'text-green-100' : 'text-gray-300'
                                                }`}>
                                                    Code digital Microsoft Store officiel
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                            plateforme === 'Xbox' ? 'border-white bg-white text-[#107c10]' : 'border-white/30'
                                        }`}>
                                            {plateforme === 'Xbox' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                        </div>
                                    </button>
                                </div>
                            </div>

                        </div>

                        {/* =========================================================================
                            CONDITIONS DE PARTICIPATION OBLIGATOIRES (AVANT LES QUESTIONS)
                        ========================================================================= */}
                        <div className="relative rounded-[2.5rem] overflow-hidden border border-white/15 p-6 sm:p-8 bg-black/70 backdrop-blur-2xl shadow-2xl">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff007f] via-[#ffe600] to-[#00f0ff]" />

                            <div className="relative z-10 space-y-6">
                                <div className="text-center space-y-2">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff007f]/20 border border-[#ff007f]/40 text-[10px] font-black uppercase tracking-widest text-[#ff007f]">
                                        <Flame className="w-3.5 h-3.5" />
                                        CONDITIONS DU CONCOURS
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-black font-display uppercase italic tracking-tight text-white">
                                        Les 4 Étapes Pour Valider Ta Participation
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-xl mx-auto">
                                        Assure-toi d'effectuer toutes les étapes requises pour que ton tirage au sort soit validé !
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Condition 1 */}
                                    <div className="bg-black/60 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-[#ff007f]/50 transition-all flex flex-col justify-between">
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#ff007f]" />
                                        <div>
                                            <div className="w-8 h-8 rounded-xl bg-[#ff007f]/20 text-[#ff007f] font-black text-xs flex items-center justify-center mb-3">
                                                01
                                            </div>
                                            <div className="text-xs font-black uppercase tracking-wider text-white mb-1.5 flex items-center gap-2">
                                                <Heart className="w-4 h-4 text-[#ff007f] shrink-0" />
                                                Likez la publication
                                            </div>
                                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                                Like la publication officielle du jeu concours sur les réseaux Dropsiders.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Condition 2 */}
                                    <div className="bg-black/60 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-[#00f0ff]/50 transition-all flex flex-col justify-between">
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#00f0ff]" />
                                        <div>
                                            <div className="w-8 h-8 rounded-xl bg-[#00f0ff]/20 text-[#00f0ff] font-black text-xs flex items-center justify-center mb-3">
                                                02
                                            </div>
                                            <div className="text-xs font-black uppercase tracking-wider text-white mb-1.5 flex items-center gap-2">
                                                <UserPlus className="w-4 h-4 text-[#00f0ff] shrink-0" />
                                                Identifiez 2 potes
                                            </div>
                                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                                Identifie 2 potes en commentaire qui doivent également liker la page.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Condition 3 */}
                                    <div className="bg-black/60 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-[#ffe600]/50 transition-all flex flex-col justify-between">
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#ffe600]" />
                                        <div>
                                            <div className="w-8 h-8 rounded-xl bg-[#ffe600]/20 text-[#ffe600] font-black text-xs flex items-center justify-center mb-3">
                                                03
                                            </div>
                                            <div className="text-xs font-black uppercase tracking-wider text-white mb-1.5 flex items-center gap-2">
                                                <Share2 className="w-4 h-4 text-[#ffe600] shrink-0" />
                                                Partagez en storie
                                            </div>
                                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                                Partage en storie Instagram en mentionnant le compte @dropsiders.fr.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Condition 4 */}
                                    <div className="bg-black/60 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-green-400/50 transition-all flex flex-col justify-between">
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-green-400" />
                                        <div>
                                            <div className="w-8 h-8 rounded-xl bg-green-500/20 text-green-400 font-black text-xs flex items-center justify-center mb-3">
                                                04
                                            </div>
                                            <div className="text-xs font-black uppercase tracking-wider text-white mb-1.5 flex items-center gap-2">
                                                <Gamepad2 className="w-4 h-4 text-green-400 shrink-0" />
                                                Répondez aux 3 questions
                                            </div>
                                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                                Pour valider la participation, répondez aux 3 questions qui sont disponibles sur le site.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* =========================================================================
                            ACTION DIRECTE : LIKER LA PUBLICATION DU CONCOURS (INSTA & TIKTOK)
                        ========================================================================= */}
                        <div className="bg-black/60 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden text-center">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff007f] via-[#ffe600] to-[#00f0ff]" />

                            <div className="max-w-2xl mx-auto space-y-4">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#00f0ff]">
                                    <Heart className="w-3.5 h-3.5 text-[#ff007f] fill-[#ff007f]" />
                                    <span>VALIDER L'ÉTAPE 1 DU CONCOURS</span>
                                </div>

                                <h4 className="text-xl sm:text-2xl font-black font-display uppercase italic tracking-tight text-white">
                                    Like la publication officielle maintenant
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-300 font-medium">
                                    Clique sur le bouton ci-dessous pour ouvrir la publication officielle sur Instagram ou TikTok et y laisser ton like & tes mentions d'amis :
                                </p>

                                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                                    {/* BOUTON LIKER SUR INSTAGRAM */}
                                    <a
                                        href={instaPostUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white font-black font-display uppercase italic text-xs tracking-wider flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(220,39,67,0.4)] hover:scale-105 active:scale-95 transition-all group"
                                    >
                                        <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span>Liker sur Instagram</span>
                                        <ExternalLink className="w-4 h-4 opacity-80" />
                                    </a>

                                    {/* BOUTON LIKER SUR TIKTOK */}
                                    <a
                                        href={tiktokPostUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-black border-2 border-white/20 hover:border-[#00f0ff] text-white font-black font-display uppercase italic text-xs tracking-wider flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(0,240,255,0.25)] hover:scale-105 active:scale-95 transition-all group"
                                    >
                                        <div className="w-5 h-5 flex items-center justify-center">
                                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#00f0ff] group-hover:scale-110 transition-transform">
                                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.32a6.34 6.34 0 0 0-.86-.06A6.34 6.34 0 0 0 3.14 15.6a6.34 6.34 0 0 0 6.34 6.34c3.5 0 6.34-2.84 6.34-6.34V9.08a8.28 8.28 0 0 0 4.87 1.57V7.2a4.83 4.83 0 0 1-1.1-.51z"/>
                                            </svg>
                                        </div>
                                        <span>Liker sur TikTok</span>
                                        <ExternalLink className="w-4 h-4 opacity-80" />
                                    </a>
                                </div>

                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                                    💡 Le post s'ouvrira dans un nouvel onglet • Reviens ensuite répondre aux 3 questions ci-dessous !
                                </p>
                            </div>
                        </div>

                        {/* PART 2 : LES 3 QUESTIONS DE CONNAISSANCES (CARTES PREMIUM) */}
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#00f0ff]">
                                    ÉPREUVE DE CONNAISSANCES
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-black font-display uppercase italic tracking-tight text-white">
                                    2. Réponds aux 3 Questions GTA & Musique
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-xl mx-auto">
                                    Une seule erreur et ta participation sera définitivement invalidée. Prends ton temps pour bien orthographier tes réponses !
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* QUESTION 1 */}
                                <motion.div 
                                    whileHover={{ y: -4 }}
                                    className="bg-black/70 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between group hover:border-[#ff007f]/50 transition-all shadow-xl"
                                >
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#ff007f]" />
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#ff007f] bg-[#ff007f]/10 px-3 py-1 rounded-full border border-[#ff007f]/30">
                                                QUESTION 1
                                            </span>
                                            <HelpCircle className="w-4 h-4 text-gray-500 group-hover:text-[#ff007f] transition-colors" />
                                        </div>
                                        <h4 className="text-sm font-black uppercase tracking-wider text-white leading-snug mb-6">
                                            Quel est l'artiste qu'on doit récupérer dans GTA 5 ?
                                        </h4>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                                            Ta Réponse :
                                        </label>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="Nom de l'artiste..."
                                            value={q1}
                                            onChange={(e) => setQ1(e.target.value)}
                                            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm font-bold placeholder-gray-500 focus:outline-none focus:border-[#ff007f] focus:bg-white/10 transition-all"
                                        />
                                    </div>
                                </motion.div>

                                {/* QUESTION 2 */}
                                <motion.div 
                                    whileHover={{ y: -4 }}
                                    className="bg-black/70 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between group hover:border-[#00f0ff]/50 transition-all shadow-xl"
                                >
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#00f0ff]" />
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff] bg-[#00f0ff]/10 px-3 py-1 rounded-full border border-[#00f0ff]/30">
                                                QUESTION 2
                                            </span>
                                            <HelpCircle className="w-4 h-4 text-gray-500 group-hover:text-[#00f0ff] transition-colors" />
                                        </div>
                                        <h4 className="text-sm font-black uppercase tracking-wider text-white leading-snug mb-6">
                                            Quel est le groupe qui apparaît sur Cayo Perico lors de GTA 5 ?
                                        </h4>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                                            Ta Réponse :
                                        </label>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="Nom du groupe..."
                                            value={q2}
                                            onChange={(e) => setQ2(e.target.value)}
                                            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm font-bold placeholder-gray-500 focus:outline-none focus:border-[#00f0ff] focus:bg-white/10 transition-all"
                                        />
                                    </div>
                                </motion.div>

                                {/* QUESTION 3 */}
                                <motion.div 
                                    whileHover={{ y: -4 }}
                                    className="bg-black/70 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between group hover:border-[#ffe600]/50 transition-all shadow-xl"
                                >
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#ffe600]" />
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#ffe600] bg-[#ffe600]/10 px-3 py-1 rounded-full border border-[#ffe600]/30">
                                                QUESTION 3
                                            </span>
                                            <HelpCircle className="w-4 h-4 text-gray-500 group-hover:text-[#ffe600] transition-colors" />
                                        </div>
                                        <h4 className="text-sm font-black uppercase tracking-wider text-white leading-snug mb-6">
                                            Quels sont les artistes qui ont sorti "Free Your Mind" sur CircoLoco Records ?
                                        </h4>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                                            Ta Réponse :
                                        </label>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="Artiste 1 & Artiste 2..."
                                            value={q3}
                                            onChange={(e) => setQ3(e.target.value)}
                                            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm font-bold placeholder-gray-500 focus:outline-none focus:border-[#ffe600] focus:bg-white/10 transition-all"
                                        />
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* PART 3 : ANTI-TRICHE & BOUTON DE VALIDATION */}
                        <div className="bg-gradient-to-br from-black/80 to-[#19053b]/80 border border-white/15 rounded-[2.5rem] p-8 backdrop-blur-2xl text-center space-y-6">
                            <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-[#00f0ff]">
                                <ShieldAlert className="w-4 h-4 text-[#ff007f]" />
                                <span>SÉCURITÉ AVANCÉE : EMPREINTE DIGITALE & IP VERROUILLÉES</span>
                            </div>

                            <p className="text-xs text-gray-400 font-medium max-w-xl mx-auto leading-relaxed">
                                En soumettant ce formulaire, ton empreinte de navigateur unique et ton adresse IP seront enregistrées.
                                <strong className="text-white block mt-1">
                                    Une seule tentative est accordée par participant. Aucune réclamation en cas de faute de frappe ne sera acceptée.
                                </strong>
                            </p>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full sm:w-auto px-12 py-5 bg-gradient-to-r from-[#ff007f] via-[#ffe600] to-[#00f0ff] text-black font-black font-display uppercase italic tracking-[0.2em] rounded-2xl shadow-[0_0_35px_rgba(255,0,127,0.5)] hover:scale-105 active:scale-95 transition-all text-sm cursor-pointer"
                            >
                                {isSubmitting ? 'VALIDATION EN COURS...' : 'VALIDER MA PARTICIPATION DÉFINITIVEMENT'}
                            </button>
                        </div>
                    </form>
                )}

                {/* =========================================================================
                    SECTION RÉSEAUX SOCIAUX DROPSIDERS (WIDGETS)
                ========================================================================= */}
                <div className="bg-black/40 border border-white/10 rounded-3xl p-8 mb-16 backdrop-blur-xl text-center max-w-4xl mx-auto">
                    <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-[#ff007f] mb-3">
                        <Flame className="w-4 h-4" />
                        <span>COMMUNAUTÉ DROPSIDERS</span>
                    </div>
                    <h3 className="text-2xl font-black font-display uppercase italic tracking-tight text-white mb-2">
                        SUIS-NOUS SUR NOS RÉSEAUX POUR NE RIEN RATER
                    </h3>
                    <p className="text-xs text-gray-400 font-medium max-w-lg mx-auto mb-8">
                        L'annonce des finalistes et du gagnant se fera en direct sur nos comptes officiels.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <a 
                            href="https://instagram.com/dropsiders.fr" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-6 py-3.5 bg-gradient-to-r from-[#833ab4]/30 via-[#fd1d1d]/30 to-[#fcb045]/30 hover:from-[#833ab4]/50 hover:to-[#fcb045]/50 border border-white/20 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:scale-105"
                        >
                            <Instagram className="w-4 h-4 text-[#ff007f]" />
                            Suivre @dropsiders.fr
                        </a>

                        <a 
                            href="https://tiktok.com/@dropsiders" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-6 py-3.5 bg-white/5 hover:bg-white/15 border border-white/20 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:scale-105"
                        >
                            <span className="font-bold text-[#00f0ff]">TikTok</span>
                            Suivre @dropsiders
                        </a>

                        <a 
                            href="https://youtube.com/@dropsiders" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-6 py-3.5 bg-white/5 hover:bg-white/15 border border-white/20 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:scale-105"
                        >
                            <span className="font-bold text-[#ff0000]">YouTube</span>
                            S'abonner à la chaîne
                        </a>
                    </div>
                </div>

                {/* =========================================================================
                    CONDITIONS DE PARTICIPATION OFFICIELLES (FOOTER DU CONCOURS)
                ========================================================================= */}
                <div className="bg-black/60 border border-white/10 rounded-3xl p-8 max-w-4xl mx-auto text-xs text-gray-400 leading-relaxed space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-white border-b border-white/10 pb-3 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-[#ff007f]" />
                        CONDITIONS DE PARTICIPATION OFFICIELLES
                    </h4>

                    <p>
                        Pour participer au jeu concours, les participants doivent :
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-300">
                        <li>Suivre le compte DROPSIDERS sur la plateforme concernée.</li>
                        <li>Liker la publication du jeu concours.</li>
                        <li>Respecter les éventuelles conditions supplémentaires indiquées dans la publication.</li>
                        <li>Être en mesure de recevoir et d'utiliser un code correspondant à la plateforme choisie : PlayStation 5 ou Xbox.</li>
                    </ul>

                    <p>
                        Le concours est ouvert aux participants disposant d'un compte compatible avec la plateforme choisie.
                    </p>
                    <p>
                        Une seule participation par personne (et par IP/Fingerprint) est autorisée. Toute participation multiple ou frauduleuse pourra entraîner l'exclusion du participant.
                    </p>
                    <p className="text-[#ff007f] font-bold">
                        *Attention : La validation des réponses aux questions est définitive. En cas d'erreur, aucune possibilité de recommencer.*
                    </p>
                    <p>
                        Le gagnant sera sélectionné selon les modalités précisées dans la publication du concours et sera contacté directement par DROPSIDERS.
                    </p>
                    <p className="border-t border-white/10 pt-3 text-[11px] text-[#00f0ff] font-bold italic">
                        Précision lot : "Le lot consiste en un code de téléchargement du jeu GTA 6, dévoilé et envoyé quelques jours avant la sortie officielle sur la plateforme choisie (Xbox ou PS5)."
                    </p>
                </div>
            </div>

            {/* =========================================================================
                MODAL 1 : AVERTISSEMENT FINAL AVANT VALIDATION
            ========================================================================= */}
            <AnimatePresence>
                {isConfirmModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[#0d0221] border border-[#ff007f]/50 rounded-[2.5rem] p-8 max-w-md w-full shadow-[0_0_50px_rgba(255,0,127,0.4)] relative overflow-hidden text-center"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff007f] via-[#ffe600] to-[#00f0ff]" />

                            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#ff007f]/20 border border-[#ff007f]/40 flex items-center justify-center mb-6">
                                <AlertTriangle className="w-8 h-8 text-[#ff007f]" />
                            </div>

                            <h3 className="text-2xl font-black font-display uppercase italic tracking-tight text-white mb-3">
                                VALIDATION DÉFINITIVE
                            </h3>

                            <p className="text-xs text-gray-300 font-medium leading-relaxed mb-6">
                                As-tu bien vérifié tes 3 réponses aux questions ? 
                                <br /><br />
                                <strong className="text-[#ff007f] uppercase">
                                    AUCUNE MODIFICATION NI SECONDE CHANCE N'EST POSSIBLE.
                                </strong> 
                                <br />
                                Si une réponse est erronée, ta participation sera immédiatement éliminée sans possibilité de recommencer.
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={handleFinalConfirmSubmit}
                                    className="w-full py-4 bg-gradient-to-r from-[#ff007f] to-[#00f0ff] text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                                >
                                    JE CONFIRME ET VALIDE DÉFINITIVEMENT
                                </button>
                                <button
                                    onClick={() => setIsConfirmModalOpen(false)}
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold uppercase text-[10px] tracking-widest rounded-2xl transition-all"
                                >
                                    REVOIR MES RÉPONSES
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>



            {/* =========================================================================
                MODAL 3 : EXPÉDITION VIRALE (STORY INSTA & LIEN DE PARRAINAGE)
            ========================================================================= */}
            <AnimatePresence>
                {isShareModalOpen && activeEntry && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[#0d0221] border border-[#ff007f]/50 rounded-[2.5rem] p-6 sm:p-10 max-w-xl w-full shadow-[0_0_60px_rgba(255,0,127,0.4)] relative overflow-hidden"
                        >
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff007f]/20 border border-[#ff007f]/40 text-[10px] font-black uppercase tracking-widest text-[#ff007f] mb-3">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    PARTICIPATION VALIDÉE !
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-black font-display uppercase italic tracking-tight text-white">
                                    BOOSTE TES CHANCES DE GAGNER
                                </h3>
                                <p className="text-xs text-gray-300 font-medium mt-1">
                                    Partage ta participation et gagne <strong>+1 chance supplémentaire</strong> pour chaque ami qui participe !
                                </p>
                            </div>

                            {/* BOUTON STORY INSTAGRAM */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 text-center space-y-3">
                                <div className="text-xs font-black uppercase tracking-widest text-[#00f0ff] flex items-center justify-center gap-2">
                                    <Instagram className="w-4 h-4 text-[#ff007f]" />
                                    PARTAGER MA PARTICIPATION EN STORY INSTA
                                </div>
                                <p className="text-[11px] text-gray-400">
                                    Télécharge un visuel officiel 1080x1920 aux couleurs de Vice City prêt à poster sur ton Instagram !
                                </p>
                                <button
                                    onClick={handleDownloadStory}
                                    disabled={isGeneratingStory}
                                    className="w-full py-4 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white font-black uppercase text-xs tracking-[0.2em] rounded-xl shadow-lg hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Download className="w-4 h-4" />
                                    {isGeneratingStory ? 'Génération du visuel...' : 'TÉLÉCHARGER LE VISUEL STORY INSTA'}
                                </button>
                            </div>

                            {/* LIEN DE PARRAINAGE UNIQUE */}
                            <div className="bg-black/60 border border-white/10 rounded-2xl p-5 mb-6 space-y-3">
                                <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                                    <span className="text-gray-300 flex items-center gap-1.5">
                                        <Gift className="w-4 h-4 text-[#00f0ff]" />
                                        Ton Lien de Parrainage Unique
                                    </span>
                                    <span className="text-[#ff007f] text-[10px]">
                                        Code : {activeEntry.referralCode}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        readOnly
                                        value={referralUrl}
                                        className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-xs font-mono text-[#00f0ff] select-all focus:outline-none"
                                    />
                                    <button
                                        onClick={handleCopyReferral}
                                        className="px-5 py-3 bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-black font-black uppercase text-[11px] tracking-wider rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                                    >
                                        {copiedReferral ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copiedReferral ? 'COPIÉ !' : 'COPIER'}
                                    </button>
                                </div>
                            </div>

                            {/* FERMER */}
                            <button
                                onClick={() => setIsShareModalOpen(false)}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-colors"
                            >
                                Fermer cette fenêtre
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
