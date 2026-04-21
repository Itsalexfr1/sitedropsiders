import React, { createContext, useContext, useState, useEffect } from 'react';

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
            setIsAuthModalOpen
        }}>
            {children}
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
