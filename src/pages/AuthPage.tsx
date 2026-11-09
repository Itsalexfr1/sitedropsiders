import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { UserAuthCard } from '../components/auth/UserAuthCard';
import { SEO } from '../components/utils/SEO';

export function AuthPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isLoggedIn } = useUser();

    const searchParams = new URLSearchParams(location.search);
    const modeParam = searchParams.get('mode') || searchParams.get('auth');
    const isRegister = 
        location.pathname.includes('inscription') ||
        location.pathname.includes('rejoindre') ||
        location.pathname.includes('register') ||
        location.pathname.includes('join') ||
        location.pathname.includes('creer-compte') ||
        modeParam === 'register';

    useEffect(() => {
        if (isLoggedIn) {
            const redirect = localStorage.getItem('auth_redirect_path') || '/communaute';
            localStorage.removeItem('auth_redirect_path');
            navigate(redirect, { replace: true });
        }
    }, [isLoggedIn, navigate]);

    const handleSuccess = () => {
        const redirect = localStorage.getItem('auth_redirect_path') || '/communaute';
        localStorage.removeItem('auth_redirect_path');
        navigate(redirect, { replace: true });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-black text-white selection:bg-neon-red selection:text-white">
            <SEO 
                title={isRegister ? "Inscription • Rejoindre Dropsiders" : "Connexion • Espace Membre Dropsiders"}
                description="Rejoignez la communauté Dropsiders pour accéder aux concours, sauvegarder vos favoris et participer aux expériences exclusives."
            />

            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-neon-red/10 rounded-full blur-[140px]" />
                <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[140px]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neon-red/5 via-transparent to-transparent" />
            </div>

            <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
                {/* Logo Dropsiders */}
                <Link to="/" className="inline-flex items-center gap-3 mb-8 group transition-transform hover:scale-105">
                    <img 
                        src="/logo.png" 
                        alt="Dropsiders" 
                        className="h-10 w-auto object-contain filter drop-shadow-[0_0_20px_rgba(255,18,65,0.4)]" 
                    />
                </Link>

                {/* Main Auth Card */}
                <UserAuthCard
                    initialMode={isRegister ? 'register' : 'login'}
                    onSuccess={handleSuccess}
                    showCloseButton={false}
                />

                {/* Back to site link */}
                <div className="text-center mt-6">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-white/40 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Retour au site
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default AuthPage;

