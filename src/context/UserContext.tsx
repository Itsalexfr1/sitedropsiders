import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface UserProfile {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    provider?: string;
    scores: Record<string, number>;
    trackIds: string[];
    agendaFavorites: number[];
    instagram?: string;
    xp: number;
    drops: number;
    createdAt: string;
    newsletter?: boolean;
}


interface UserContextType {
    user: UserProfile | null;
    isLoggedIn: boolean;
    login: (username: string, email: string) => void;
    loginSocial: (data: Partial<UserProfile>) => void;
    logout: () => void;
    updateScore: (gameId: string, score: number) => void;
    toggleTrackId: (trackId: string) => void;
    toggleAgendaFavorite: (eventId: number) => void;
    updateUser: (updates: Partial<UserProfile>) => void;
    earnPoints: (xp: number, drops: number) => void;
    isAuthModalOpen: boolean;
    setIsAuthModalOpen: (open: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setNotification({ message, type });
        // Auto hide after 5 seconds
        setTimeout(() => setNotification(null), 5000);
    };

    // Initial load from localStorage
    useEffect(() => {
        const savedUser = localStorage.getItem('dropsiders_user');
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                if (!parsed.agendaFavorites) parsed.agendaFavorites = [];
                setUser(parsed);
            } catch (e) {
                console.error('Failed to parse user data', e);
            }
        }

        // --- NEW: Mobile Redirect Auth Catch ---
        const tempUserStr = localStorage.getItem('temp_social_user');
        if (tempUserStr) {
            try {
                const tempUser = JSON.parse(tempUserStr);
                loginSocial(tempUser);
                localStorage.removeItem('temp_social_user');
            } catch(e) {}
        }
        
        // --- NEW: Handle Mobile/Universal Google Auth via Pre-React Interceptor ---
        const mobileGoogleToken = localStorage.getItem('dropsiders_google_mobile_token');
        if (mobileGoogleToken) {
            localStorage.removeItem('dropsiders_google_mobile_token');
            fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${mobileGoogleToken}` }
            })
            .then(res => res.json())
            .then(googleUser => {
                if (googleUser && googleUser.sub) {
                    loginSocial({
                        username: googleUser.name,
                        email: googleUser.email,
                        avatar: googleUser.picture,
                        id: googleUser.sub,
                        provider: 'google'
                    });
                    setTimeout(() => {
                        showNotification(`Succès! Vous êtes connecté via Google en tant que ${googleUser.name}.`, 'success');
                        setTimeout(() => window.location.reload(), 2000); // Laisse le temps de voir le message
                    }, 500);
                }
            })
            .catch(err => {
                console.error('Failed to fetch google user info from mobile interceptor', err);
            });
        }
    }, []);

    // Sync with backend when email is available
    useEffect(() => {
        if (user?.email && user.email.includes('@')) {
            const syncAdmin = async () => {
                try {
                    const res = await fetch(`/api/admin/check-permissions?email=${encodeURIComponent(user.email)}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success) {
                            localStorage.setItem('admin_auth_v2', 'true');
                            localStorage.setItem('admin_user', user.email);
                            localStorage.setItem('admin_permissions', JSON.stringify(data.permissions || []));
                            localStorage.setItem('admin_session_id', data.sessionId || '');
                            localStorage.setItem('admin_provider', user.provider || 'email');
                        }
                    }
                } catch (e) { console.error('Failed to sync admin status', e); }
            };
            syncAdmin();

            const syncFavorites = async () => {
                try {
                    const res = await fetch(`/api/agenda/favorites?email=${encodeURIComponent(user.email)}`);
                    if (res.ok) {
                        const backendFavs = await res.json();
                        if (Array.isArray(backendFavs) && JSON.stringify(backendFavs) !== JSON.stringify(user.agendaFavorites)) {
                            setUser(prev => prev ? { ...prev, agendaFavorites: backendFavs } : null);
                        }
                    }
                } catch (e) { console.error('Failed to sync favorites', e); }
            };
            syncFavorites();
        }
    }, [user?.email]);

    // Save to localStorage whenever user changes
    useEffect(() => {
        if (user) {
            localStorage.setItem('dropsiders_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('dropsiders_user');
        }
    }, [user]);

    const saveToRegisteredUsers = (userToSave: UserProfile) => {
        try {
            const existing: UserProfile[] = JSON.parse(localStorage.getItem('dropsiders_registered_users') || '[]');
            const idx = existing.findIndex(u => u.id === userToSave.id);
            if (idx >= 0) {
                existing[idx] = { ...existing[idx], ...userToSave };
            } else {
                existing.push(userToSave);
            }
            localStorage.setItem('dropsiders_registered_users', JSON.stringify(existing));
        } catch (e) {
            console.error('Failed to save to registered users', e);
        }
    };

    const login = async (username: string, email: string) => {
        const newUser: UserProfile = {
            id: crypto.randomUUID(),
            username,
            email,
            provider: 'email',
            scores: {},
            trackIds: [],
            agendaFavorites: [],
            xp: Number(localStorage.getItem('user_xp')) || 0,
            drops: Number(localStorage.getItem('user_drops')) || 0,
            createdAt: new Date().toISOString()
        };
        setUser(newUser);
        saveToRegisteredUsers(newUser);

        // Sync with central registry
        try {
            await fetch('/api/users/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
        } catch (e) {
            console.error('Sync failed', e);
        }
    };

    const loginSocial = async (data: Partial<UserProfile>) => {
        // Find existing user if available
        const existing: UserProfile[] = JSON.parse(localStorage.getItem('dropsiders_registered_users') || '[]');
        const found = existing.find(u => u.email === data.email || u.id === data.id);
        
        const newUser: UserProfile = {
            id: data.id || found?.id || crypto.randomUUID(),
            username: data.username || found?.username || 'Utilisateur',
            email: data.email || found?.email || '',
            avatar: data.avatar || found?.avatar,
            instagram: data.instagram || found?.instagram,
            provider: data.provider || found?.provider,
            scores: data.scores || found?.scores || {},
            trackIds: data.trackIds || found?.trackIds || [],
            agendaFavorites: data.agendaFavorites || found?.agendaFavorites || [],
            xp: (data.xp !== undefined ? data.xp : found?.xp) || Number(localStorage.getItem('user_xp')) || 0,
            drops: (data.drops !== undefined ? data.drops : found?.drops) || Number(localStorage.getItem('user_drops')) || 0,
            createdAt: data.createdAt || found?.createdAt || new Date().toISOString()
        };
        setUser(newUser);
        saveToRegisteredUsers(newUser);

        // Sync with central registry
        try {
            fetch('/api/users/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            }).catch(e => console.error('Sync failed', e));
        } catch (e) {}

        // Unified Auth: Check if this user is also an Admin/Editor
        if (newUser.email) {
            fetch(`/api/admin/check-permissions?email=${encodeURIComponent(newUser.email)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        console.log('[AUTH] Syncing admin status for', newUser.email);
                        localStorage.setItem('admin_auth_v2', 'true');
                        localStorage.setItem('admin_user', newUser.email);
                        localStorage.setItem('admin_permissions', JSON.stringify(data.permissions || []));
                        localStorage.setItem('admin_session_id', data.sessionId || '');
                        localStorage.setItem('admin_provider', newUser.provider || 'email');
                        // No password needed for session-based auth
                        localStorage.removeItem('admin_password');
                        
                        // Notify other components if needed
                        window.dispatchEvent(new Event('admin-login'));
                    }
                })
                .catch(err => console.error('[AUTH] Admin check failed', err));
        }
        
        // Clean local "guest" points after sync
        localStorage.removeItem('user_xp');
        localStorage.removeItem('user_drops');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('admin_auth_v2');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_permissions');
        localStorage.removeItem('admin_session_id');
        localStorage.removeItem('admin_provider');
        localStorage.removeItem('admin_password');
    };

    const updateScore = (gameId: string, score: number) => {
        if (!user) return;
        const currentBest = user.scores[gameId] || 0;
        if (score > currentBest) {
            setUser({
                ...user,
                scores: { ...user.scores, [gameId]: score }
            });
        }
    };

    const toggleTrackId = (trackId: string) => {
        if (!user) return;
        const exists = user.trackIds.includes(trackId);
        const newTrackIds = exists 
            ? user.trackIds.filter(id => id !== trackId)
            : [...user.trackIds, trackId];
        
        setUser({ ...user, trackIds: newTrackIds });
    };

    const toggleAgendaFavorite = async (eventId: number) => {
        if (!user) return;
        const exists = user.agendaFavorites.includes(eventId);
        const newFavs = exists 
            ? user.agendaFavorites.filter(id => id !== eventId)
            : [...user.agendaFavorites, eventId];
        
        const updatedUser = { ...user, agendaFavorites: newFavs };
        setUser(updatedUser);
        saveToRegisteredUsers(updatedUser);

        // Optional: Sync to backend immediately
        if (user.email && user.email.includes('@')) {
            try {
                await fetch('/api/agenda/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email, favorites: newFavs })
                });
            } catch (e) { console.error('Failed to save favorites to backend', e); }
        }
    };

    const updateUser = (updates: Partial<UserProfile>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        saveToRegisteredUsers(updatedUser);
    };

    const earnPoints = (xpAmount: number, dropsAmount: number) => {
        if (user) {
            const updatedUser = {
                ...user,
                xp: (user.xp || 0) + xpAmount,
                drops: (user.drops || 0) + dropsAmount
            };
            setUser(updatedUser);
            saveToRegisteredUsers(updatedUser);
        } else {
            // Unauthenticated: store in localStorage
            const currentXp = Number(localStorage.getItem('dropsiders_xp')) || 0;
            const currentDrops = Number(localStorage.getItem('dropsiders_drops')) || 0;
            localStorage.setItem('dropsiders_xp', (currentXp + xpAmount).toString());
            localStorage.setItem('dropsiders_drops', (currentDrops + dropsAmount).toString());
        }
    };

    return (
        <UserContext.Provider value={{
            user,
            isLoggedIn: !!user,
            login,
            loginSocial,
            logout,
            updateScore,
            toggleTrackId,
            toggleAgendaFavorite,
            updateUser,
            earnPoints,
            isAuthModalOpen,
            setIsAuthModalOpen,
            showNotification
        }}>
            {children}

            {/* DESIGN DROPSIDERS NOTIFICATION */}
            <AnimatePresence>
                {notification && (
                    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10000] w-[90%] max-w-[400px]">
                        <motion.div
                            initial={{ y: -100, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: -100, opacity: 0, scale: 0.9 }}
                            className="relative bg-black/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden group"
                        >
                            {/* Neon Borders */}
                            <div className={twMerge(
                                "absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity",
                                notification.type === 'success' ? "shadow-[inset_0_0_20px_rgba(0,240,255,0.4)]" : 
                                notification.type === 'error' ? "shadow-[inset_0_0_20px_rgba(255,0,51,0.4)]" : 
                                "shadow-[inset_0_0_20px_rgba(168,85,247,0.4)]"
                            )} />

                            <div className="relative flex items-start gap-4">
                                <div className={twMerge(
                                    "p-3 rounded-2xl border",
                                    notification.type === 'success' ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan" : 
                                    notification.type === 'error' ? "bg-neon-red/10 border-neon-red/30 text-neon-red" : 
                                    "bg-neon-purple/10 border-neon-purple/30 text-neon-purple"
                                )}>
                                    <div className="w-5 h-5 flex items-center justify-center">
                                        {notification.type === 'success' ? '✓' : notification.type === 'error' ? '!' : 'i'}
                                    </div>
                                </div>
                                <div className="flex-1 pt-1">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">
                                        {notification.type === 'success' ? 'Confirmation' : notification.type === 'error' ? 'Alerte' : 'Information'}
                                    </h4>
                                    <p className="text-sm font-bold text-white leading-relaxed italic">
                                        {notification.message}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setNotification(null)}
                                    className="p-2 text-white/20 hover:text-white transition-colors"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <motion.div 
                                initial={{ width: "100%" }}
                                animate={{ width: 0 }}
                                transition={{ duration: 5, ease: "linear" }}
                                className={twMerge(
                                    "absolute bottom-0 left-0 h-1",
                                    notification.type === 'success' ? "bg-neon-cyan" : 
                                    notification.type === 'error' ? "bg-neon-red" : 
                                    "bg-neon-purple"
                                )}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
