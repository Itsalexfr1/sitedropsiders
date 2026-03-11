import { useState, useEffect } from 'react';
import { Bell, BellOff, Shield, Zap, Info, AlertCircle } from 'lucide-react';
import { subscribeUser, unsubscribeUser, triggerTestNotification } from '../../utils/push';

export function NotificationSettings() {
    const [isPushSupported, setIsPushSupported] = useState(true);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const [preferences, setPreferences] = useState({
        live: true,
        news: true,
        shop: true,
        recaps: false,
        interviews: false
    });

    useEffect(() => {
        const checkPush = async () => {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                setIsPushSupported(false);
                setLoading(false);
                return;
            }

            const perm = Notification.permission;
            setPermission(perm);

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);

            // Fetch preferences from local storage or backend
            const savedPrefs = localStorage.getItem('notification_preferences');
            if (savedPrefs) {
                try {
                    setPreferences(JSON.parse(savedPrefs));
                } catch (e) {
                    console.error('Error parsing preferences', e);
                }
            }

            setLoading(false);
        };

        checkPush();
    }, []);

    const handleTogglePush = async () => {
        setStatus('loading');
        try {
            if (isSubscribed) {
                await unsubscribeUser();
                setIsSubscribed(false);
            } else {
                await subscribeUser();
                setIsSubscribed(true);
                setPermission(Notification.permission);
            }
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (error) {
            console.error('Push toggle error:', error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    const handlePreferenceToggle = (key: keyof typeof preferences) => {
        const newPrefs = { ...preferences, [key]: !preferences[key] };
        setPreferences(newPrefs);
        localStorage.setItem('notification_preferences', JSON.stringify(newPrefs));

        // Sync with backend if subscribed
        if (isSubscribed) {
            syncPreferences(newPrefs);
        }
    };

    const syncPreferences = async (prefs: any) => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subscription, favorites: prefs })
                });
            }
        } catch (e) {
            console.error('Error syncing preferences', e);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-neon-red border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isPushSupported) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto text-center">
                <BellOff className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-black text-white italic uppercase mb-2">Non Supporté</h3>
                <p className="text-gray-400 text-sm mb-4">Votre navigateur ne supporte pas les notifications push dans ce mode.</p>
                <div className="bg-white/5 p-4 rounded-2xl text-[10px] text-left space-y-2">
                    <p className="font-bold text-white uppercase italic">📱 Utilisateurs iPhone / iPad :</p>
                    <p className="text-gray-500 font-medium">Pour activer les notifications, vous devez d'abord ajouter le site à votre écran d'accueil :</p>
                    <ol className="list-decimal list-inside text-gray-400 space-y-1">
                        <li>Appuyez sur le bouton <span className="text-white italic">Partager</span> (carré avec flèche).</li>
                        <li>Faites défiler et choisissez <span className="text-white italic">"Sur l'écran d'accueil"</span>.</li>
                        <li>Ouvrez l'application depuis votre écran et revenez ici.</li>
                    </ol>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 overflow-hidden">
            {/* Main Toggle */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-neon-red/5 blur-[100px] rounded-full -mr-32 -mt-32 transition-all group-hover:bg-neon-red/10" />

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className={`w-24 h-24 rounded-3xl flex items-center justify-center border transition-all duration-500 ${isSubscribed ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/10 text-white/40'}`}>
                        {isSubscribed ? <Bell className="w-10 h-10 animate-bounce" /> : <BellOff className="w-10 h-10" />}
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">
                            Notifications <span className={isSubscribed ? 'text-emerald-500' : 'text-neon-red'}>{isSubscribed ? 'Activées' : 'Désactivées'}</span>
                        </h2>
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest max-w-md">
                            {isSubscribed
                                ? "Vous recevrez les alertes en direct selon vos préférences choisies ci-dessous."
                                : "Ne ratez plus aucun lineup secret, les alertes festival en direct et les bons plans du shop."
                            }
                        </p>
                    </div>

                    <button
                        onClick={handleTogglePush}
                        disabled={status === 'loading'}
                        className={`shrink-0 px-6 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] transition-all flex items-center gap-3 ${isSubscribed ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-neon-red text-white shadow-[0_20px_40px_rgba(255,18,65,0.3)] hover:shadow-[0_25px_50px_rgba(255,18,65,0.5)] active:scale-95'}`}
                    >
                        {status === 'loading' ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isSubscribed ? (
                            <>DÉSACTIVER</>
                        ) : (
                            <>ACTIVER LE LIVE</>
                        )}
                    </button>
                </div>

                {permission === 'denied' && (
                    <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                            Oups ! Vous avez bloqué les notifications dans votre navigateur. Vous devez les réautoriser manuellement dans les réglages du site (l'icône cadenas dans la barre d'adresse).
                        </p>
                    </div>
                )}
            </div>

            {/* Preferences Grid */}
            <div className={`transition-all duration-500 ${isSubscribed ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-6 ml-4">Configure tes Alertes</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[
                        { id: 'live', label: 'Alertes Live', icon: Zap, color: 'text-neon-red', desc: 'Quand un DJ passe en live ou qu\'un set commence.' },
                        { id: 'news', label: 'Actualités', icon: Bell, color: 'text-neon-cyan', desc: 'Les dernières news du monde de l\'électro.' },
                        { id: 'shop', label: 'Bons Plans Shop', icon: Shield, color: 'text-neon-green', desc: 'Promos exclusives et nouveaux drops.' },
                        { id: 'recaps', label: 'Recaps Festivals', icon: Info, color: 'text-neon-purple', desc: 'Dès qu\'un aftermovie ou un recap est dispo.' },
                        { id: 'interviews', label: 'Interviews', icon: Zap, color: 'text-neon-blue', desc: 'Quand une nouvelle interview est publiée.' }
                    ].map((pref) => (
                        <button
                            key={pref.id}
                            onClick={() => handlePreferenceToggle(pref.id as any)}
                            className={`p-6 border rounded-3xl text-left transition-all ${preferences[pref.id as keyof typeof preferences] ? 'bg-white/5 border-white/20' : 'bg-transparent border-white/5 hover:border-white/10'}`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2 rounded-xl bg-white/5 ${pref.color}`}>
                                    <pref.icon className="w-5 h-5" />
                                </div>
                                <div className={`w-10 h-6 rounded-full relative transition-colors ${preferences[pref.id as keyof typeof preferences] ? 'bg-emerald-500' : 'bg-white/10'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${preferences[pref.id as keyof typeof preferences] ? 'left-5' : 'left-1'}`} />
                                </div>
                            </div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight mb-2 italic">{pref.label}</h4>
                            <p className="text-[10px] text-gray-500 font-bold leading-relaxed">{pref.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Advanced & Test */}
            {isSubscribed && (
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-neon-cyan/10 rounded-2xl flex items-center justify-center text-neon-cyan">
                            <Info className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-white uppercase italic tracking-tight">Outil de Diagnostic</h4>
                            <p className="text-[10px] text-gray-500 font-bold">Vérifiez que votre appareil reçoit bien les alertes.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <button
                            onClick={triggerTestNotification}
                            className="flex-1 md:flex-none px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                            Tester maintenant
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
