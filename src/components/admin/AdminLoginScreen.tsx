import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { Shield, ArrowLeft, Loader2, AlertCircle, CheckCircle2, ChevronLeft, RefreshCw, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isSuperAdmin } from '../../utils/auth';

interface AdminLoginScreenProps {
    onAuthenticated: (user: string, permissions: string[], sessionId: string) => void;
}

type LoginStep =
    | 'social'          // Step 1: Google / Discord buttons
    | 'phone_entry'     // Step 2 (editor first time): saisir numéro de tel
    | 'sms_code'        // Step 3: saisir code 6 chiffres
    | 'loading';

interface SocialUser {
    email: string;
    name: string;
    avatar?: string;
    provider: 'google' | 'discord';
    id: string;
}

export function AdminLoginScreen({ onAuthenticated }: AdminLoginScreenProps) {
    const [step, setStep] = useState<LoginStep>('social');
    const [isFirstTimeEditor, setIsFirstTimeEditor] = useState(false);
    const [socialUser, setSocialUser] = useState<SocialUser | null>(null);
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [discordLoading, setDiscordLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown resend timer
    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    // ─── Google OAuth ──────────────────────────────────────────────────────────
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setGoogleLoading(true);
            setError('');
            try {
                const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const g = res.data;
                await handleSocialAuth({
                    email: g.email,
                    name: g.name,
                    avatar: g.picture,
                    id: g.sub,
                    provider: 'google'
                });
            } catch (e) {
                setError('Erreur lors de la connexion Google.');
            } finally {
                setGoogleLoading(false);
            }
        },
        onError: () => {
            setError('Connexion Google annulée.');
            setGoogleLoading(false);
        }
    });

    // 🔄 Checkout if mobile redirect happened and returned
    useEffect(() => {
        const temp = localStorage.getItem('temp_admin_social_user');
        if (temp) {
            try {
                const data = JSON.parse(temp);
                localStorage.removeItem('temp_admin_social_user');
                localStorage.removeItem('social_auth_mode');
                handleSocialAuth(data);
            } catch (e) {}
        }
    }, []);

    // 🌟🌟🌟 Discord OAuth 🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟
    const handleDiscordLogin = () => {
        setDiscordLoading(true);
        setError('');

        const isMobile = window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
            localStorage.setItem('social_auth_mode', 'admin');
            localStorage.setItem('social_auth_redirect', '/admin');
            window.location.href = '/auth/discord';
            return;
        }

        const popup = window.open(
            '/auth/discord',
            'discord-oauth',
            'width=500,height=700,scrollbars=yes,resizable=yes,status=yes'
        );

        const handleMessage = async (event: MessageEvent) => {
            if (event.data?.type === 'DISCORD_AUTH_SUCCESS' && event.data.user) {
                const d = event.data.user;
                window.removeEventListener('message', handleMessage);
                clearInterval(interval);
                await handleSocialAuth({
                    email: d.email,
                    name: d.username,
                    avatar: d.avatar,
                    id: d.id,
                    provider: 'discord'
                });
                setDiscordLoading(false);
            }
        };

        window.addEventListener('message', handleMessage);

        const interval = setInterval(() => {
            if (popup?.closed) {
                clearInterval(interval);
                window.removeEventListener('message', handleMessage);
                setDiscordLoading(false);
            }
        }, 500);
    };

    // ─── After social auth: check if editor, check if phone exists ─────────────
    const handleSocialAuth = async (user: SocialUser) => {
        setStep('loading');
        setSocialUser(user);
        setError('');

        try {
            // Ask the backend: is this email an authorized editor/admin?
            const res = await fetch('/api/admin/check-editor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, provider: user.provider })
            });

            if (!res.ok) {
                setError("Votre compte n'est pas autorisé à accéder au tableau de bord.");
                setStep('social');
                return;
            }

            const data = await res.json();

            if (!data.authorized) {
                setError("Votre compte n'est pas autorisé. Contactez l'administrateur.");
                setStep('social');
                return;
            }

            // 👑👑👑 SUPER-ADMIN BYPASS OTP 👑👑👑
            if (isSuperAdmin(user.email)) {
                console.log("[AUTH] Super-admin detected, bypassing OTP...");
                localStorage.setItem('admin_auth_v2', 'true');
                localStorage.setItem('admin_user', user.email);
                localStorage.setItem('admin_permissions', JSON.stringify(['all']));
                localStorage.setItem('admin_provider', user.provider);
                onAuthenticated(user.email, ['all'], 'super-admin-bypass-' + Date.now());
                window.dispatchEvent(new Event('admin-login'));
                return;
            }

            // Authorized! Directly send OTP via Email
            await sendOtp(user.email);
            setStep('sms_code');
        } catch (e) {
            setError('Erreur réseau. Réessayez.');
            setStep('social');
        }
    };

    // ─── Send OTP via Email (Brevo) ──────────────────────────────────────────
    const sendOtp = async (email: string) => {
        setIsSending(true);
        setError('');
        try {
            const res = await fetch('/api/admin/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || "Impossible d'envoyer le SMS. Vérifiez le numéro.");
                return false;
            }

            setCountdown(60);
            return true;
        } catch (e) {
            setError('Erreur réseau lors de l\'envoi du SMS.');
            return false;
        } finally {
            setIsSending(false);
        }
    };

    // handlePhoneSubmit removed - using email only

    // ─── OTP digit inputs ──────────────────────────────────────────────────────
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newDigits = [...otpDigits];
        newDigits[index] = value.slice(-1);
        setOtpDigits(newDigits);
        setError('');

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when 6 digits complete
        if (value && index === 5) {
            const code = [...newDigits.slice(0, 5), value.slice(-1)].join('');
            if (code.length === 6) {
                verifyOtp([...newDigits.slice(0, 5), value.slice(-1)]);
            }
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const digits = pasted.split('');
            setOtpDigits(digits);
            inputRefs.current[5]?.focus();
            verifyOtp(digits);
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // ─── Verify OTP ───────────────────────────────────────────────────────────
    const verifyOtp = async (digits: string[]) => {
        const code = digits.join('');
        if (code.length !== 6 || !socialUser) return;

        setStep('loading');
        setError('');

        try {
            const phoneToUse = undefined;

            const res = await fetch('/api/admin/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: socialUser.email,
                    code,
                    phone: phoneToUse,
                    provider: socialUser.provider,
                    name: socialUser.name,
                    avatar: socialUser.avatar
                })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || 'Code incorrect ou expiré.');
                setOtpDigits(['', '', '', '', '', '']);
                setStep('sms_code');
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
                return;
            }

            // ✅ Auth successful
            localStorage.setItem('admin_auth_v2', 'true');
            localStorage.setItem('admin_user', data.user || socialUser.email);
            localStorage.setItem('admin_permissions', JSON.stringify(data.permissions || []));
            localStorage.setItem('admin_session_id', data.sessionId || '');
            localStorage.setItem('admin_provider', socialUser.provider);

            // Force 'all' permissions for super admins
            if (isSuperAdmin(data.user || socialUser.email)) {
                const perms: string[] = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
                if (!perms.includes('all')) {
                    localStorage.setItem('admin_permissions', JSON.stringify([...perms, 'all']));
                }
            }

            onAuthenticated(
                data.user || socialUser.email,
                data.permissions || [],
                data.sessionId || ''
            );

            // Notify reactive components like AdminEditBar
            window.dispatchEvent(new Event('admin-login'));
        } catch (e) {
            setError('Erreur réseau. Réessayez.');
            setOtpDigits(['', '', '', '', '', '']);
            setStep('sms_code');
        }
    };

    const handleOtpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        verifyOtp(otpDigits);
    };

    // ─── Resend OTP ───────────────────────────────────────────────────────────
    const handleResend = async () => {
        if (!socialUser) return;
        await sendOtp(socialUser.email);
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-32">
            {/* Background */}
            <div className="absolute inset-0 bg-dark-bg">
                <div className="absolute inset-0 opacity-30"
                    style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,18,65,0.15) 0%, transparent 70%)' }} />
            </div>

            <div className="relative w-full max-w-md z-10">
                {/* ── STEP 1: Social Auth ─────────────────────────────────────── */}
                <AnimatePresence mode="wait">
                    {step === 'social' && (
                        <motion.div
                            key="social"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-xl">
                                {/* Top Bar */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-red via-neon-purple to-neon-red rounded-t-[2.5rem]" />

                                <div className="flex justify-center mb-8">
                                    <div className="p-5 bg-neon-red/10 rounded-[2rem] border border-neon-red/20 shadow-[0_0_40px_rgba(255,18,65,0.2)]">
                                        <Shield className="w-10 h-10 text-neon-red" />
                                    </div>
                                </div>

                                <h2 className="text-3xl font-display font-black text-white text-center mb-2 uppercase italic tracking-tighter">
                                    Accès <span className="text-neon-red">Restreint</span>
                                </h2>
                                <p className="text-center text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10">
                                    Identifiez-vous via votre compte social
                                </p>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3"
                                    >
                                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                        <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>
                                    </motion.div>
                                )}

                                <div className="space-y-4">
                                    {/* Google */}
                                    <button
                                        onClick={() => googleLogin()}
                                        disabled={googleLoading || discordLoading}
                                        className="w-full flex items-center justify-center gap-4 py-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all group disabled:opacity-50"
                                    >
                                        {googleLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                                        ) : (
                                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.26 1.07-3.71 1.07-2.87 0-5.3-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.17-4.53z" />
                                            </svg>
                                        )}
                                        <span className="font-black uppercase text-[11px] tracking-widest text-white">
                                            {googleLoading ? 'Connexion...' : 'Continuer avec Google'}
                                        </span>
                                    </button>

                                    {/* Discord */}
                                    <button
                                        onClick={handleDiscordLogin}
                                        disabled={googleLoading || discordLoading}
                                        className="w-full flex items-center justify-center gap-4 py-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-[#5865F2]/20 hover:border-[#5865F2]/40 transition-all group disabled:opacity-50"
                                    >
                                        {discordLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-[#5865F2]" />
                                        ) : (
                                            <svg className="w-6 h-6 fill-[#5865F2]" viewBox="0 0 24 24">
                                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z" />
                                            </svg>
                                        )}
                                        <span className="font-black uppercase text-[11px] tracking-widest text-white">
                                            {discordLoading ? 'Connexion...' : 'Continuer avec Discord'}
                                        </span>
                                    </button>
                                </div>

                                <div className="mt-10 pt-6 border-t border-white/5">
                                    <p className="text-[9px] text-gray-600 uppercase tracking-[0.2em] text-center leading-relaxed">
                                        Espace réservé à l'équipe Dropsiders.<br />
                                        Une vérification SMS sera requise après connexion.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-xs uppercase tracking-widest font-bold transition-all group">
                                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                    Retour au site
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {/* phone_entry step removed */}

                    {/* ── STEP 3: SMS OTP Code ─────────────────────────────────── */}
                    {step === 'sms_code' && (
                        <motion.div
                            key="otp"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-xl">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-red via-neon-purple to-neon-red rounded-t-[2.5rem]" />

                                <button
                                    onClick={() => {
                                        setStep('social');
                                        setOtpDigits(['', '', '', '', '', '']);
                                        setError('');
                                    }}
                                    className="mb-8 flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Retour
                                </button>

                                {/* Icon display */}
                                <div className="flex justify-center mb-6">
                                    <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                                        <Mail className="w-8 h-8 text-green-400" />
                                    </div>
                                </div>

                                <h2 className="text-2xl font-display font-black text-white text-center mb-2 uppercase italic tracking-tighter">
                                    Code de <span className="text-neon-red">Vérification</span>
                                </h2>
                                <p className="text-center text-gray-500 text-[10px] font-black uppercase tracking-[0.15em] mb-2">
                                    Un code à 6 chiffres a été envoyé par Email
                                </p>
                                {socialUser && (
                                    <p className="text-center text-gray-400 text-xs font-bold mb-8">
                                        à l'adresse {socialUser.email}
                                    </p>
                                )}

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3"
                                    >
                                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                        <p className="text-red-400 text-xs font-bold">{error}</p>
                                    </motion.div>
                                )}

                                <form onSubmit={handleOtpSubmit} className="space-y-8">
                                    {/* 6-digit OTP input */}
                                    <div
                                        className="flex justify-center gap-3"
                                        onPaste={handleOtpPaste}
                                    >
                                        {otpDigits.map((digit, i) => (
                                            <input
                                                key={i}
                                                ref={el => { inputRefs.current[i] = el; }}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                autoFocus={i === 0}
                                                onChange={e => handleOtpChange(i, e.target.value)}
                                                onKeyDown={e => handleOtpKeyDown(i, e)}
                                                className={`w-12 h-16 text-center text-2xl font-black rounded-2xl border-2 bg-white/5 text-white focus:outline-none transition-all
                                                    ${digit
                                                        ? 'border-neon-red shadow-[0_0_20px_rgba(255,18,65,0.3)] bg-neon-red/10'
                                                        : 'border-white/10 focus:border-neon-red/50'
                                                    }`}
                                            />
                                        ))}
                                    </div>

                                    {/* Submit button */}
                                    <button
                                        type="submit"
                                        disabled={otpDigits.join('').length < 6}
                                        className="w-full py-5 bg-neon-red text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 hover:bg-neon-red/80 disabled:opacity-50 transition-all shadow-2xl shadow-neon-red/30 active:scale-95"
                                    >
                                        Vérifier le code
                                    </button>

                                    {/* Resend */}
                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            disabled={countdown > 0 || isSending}
                                            className="flex items-center gap-2 mx-auto text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <RefreshCw className={`w-3 h-3 ${isSending ? 'animate-spin' : ''}`} />
                                            {countdown > 0 ? `Renvoyer dans ${countdown}s` : 'Renvoyer le code'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {/* ── LOADING ──────────────────────────────────────────────── */}
                    {step === 'loading' && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-6 py-20"
                        >
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-4 border-white/5" />
                                <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-t-neon-red animate-spin" />
                            </div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
                                Vérification en cours...
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
