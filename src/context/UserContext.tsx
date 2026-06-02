import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import wikiFestivals from '../data/wiki_festivals.json';
import wikiClubs from '../data/wiki_clubs.json';
import wikiDjs from '../data/wiki_djs.json';

export interface DropsidersCard {
    id: string;
    type: 'festival' | 'club' | 'dj';
    name: string;
    city: string;
    country: string;
    image: string;
    djmag_rank: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    collectedAt: string;
    top_tracks?: string[];
    attendees?: number;
    attendees_label?: string;
}

interface UserProfile {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    provider?: string;
    handle?: string; // --- NEW: Unique handle ---
    scores: Record<string, number>;
    trackIds: string[];
    agendaFavorites: number[];
    instagram?: string;
    xp: number;
    drops: number;
    createdAt: string;
    newsletter?: boolean;
    mixStatus?: 'none' | 'pending' | 'approved';
    collectedCards?: DropsidersCard[];
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
    deleteAccount: () => Promise<boolean>;
    isAuthModalOpen: boolean;
    setIsAuthModalOpen: (open: boolean) => void;
    showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
    addCard: (card: DropsidersCard) => void;
    addCards: (cards: DropsidersCard[]) => void;
    removeCard: (cardId: string) => void;
    burnCards: (cardIds: string[]) => void;
    craftCard: (targetRarity: 'rare' | 'epic' | 'legendary') => DropsidersCard | null;
    collectedCards: DropsidersCard[];
    pendingBooster: DropsidersCard[] | null;
    triggerBooster: () => void;
    claimBooster: () => void;
    dismissBooster: () => void;
    // --- NEW: Trades System ---
    trades: { sent: any[], received: any[] };
    loadTrades: () => Promise<void>;
    claimHandle: (handle: string) => Promise<{ success: boolean; error?: string }>;
    createTradeOffer: (toHandle: string, offeredCardId: string, wantedCardId: string) => Promise<{ success: boolean; error?: string }>;
    respondToTrade: (tradeId: string, response: 'accepted' | 'rejected') => Promise<{ success: boolean; error?: string }>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function getRarity(rank: number): DropsidersCard['rarity'] {
    if (rank <= 10) return 'legendary';
    if (rank <= 30) return 'epic';
    if (rank <= 60) return 'rare';
    return 'common';
}

function buildCardPool(): DropsidersCard[] {
    const festivalCards: DropsidersCard[] = (wikiFestivals as any[]).map((f) => ({
        id: `festival_${f.id}`,
        type: 'festival' as const,
        name: f.name,
        city: f.city,
        country: f.country,
        image: f.image,
        djmag_rank: f.djmag_rank || 99,
        rarity: getRarity(f.djmag_rank || 99),
        collectedAt: new Date().toISOString(),
        attendees: f.attendees,
        attendees_label: f.attendees_label,
    }));

    const clubCards: DropsidersCard[] = (wikiClubs as any[]).map((c) => ({
        id: `club_${c.id}`,
        type: 'club' as const,
        name: c.name,
        city: c.city,
        country: c.country,
        image: c.image,
        djmag_rank: c.djmag_rank || 99,
        rarity: getRarity(c.djmag_rank || 99),
        collectedAt: new Date().toISOString(),
        attendees: c.attendees,
        attendees_label: c.attendees_label,
    }));

    const djCards: DropsidersCard[] = (wikiDjs as any[])
        .filter((d) => d.image && d.image.startsWith('http'))
        .map((d, index) => {
            const rank = Math.min(99, index + 1);
            return {
                id: `dj_${d.id}`,
                type: 'dj' as const,
                name: d.name,
                city: d.country || 'Intl',
                country: d.country || 'Intl',
                image: d.image,
                djmag_rank: rank,
                rarity: getRarity(rank),
                collectedAt: new Date().toISOString(),
                top_tracks: d.top_tracks || ["Titre Inconnu 1", "Titre Inconnu 2", "Titre Inconnu 3"]
            };
        });

    return [...festivalCards, ...clubCards, ...djCards];
}

function hydrateCards(stored: DropsidersCard[]): DropsidersCard[] {
    const pool = buildCardPool();
    const map = new Map<string, Partial<DropsidersCard>>();
    for (const card of pool) { map.set(card.id, card); }
    return stored.map(card => {
        const baseId = card.id.includes("_crafted_") ? card.id.split("_crafted_")[0] : card.id;
        const fresh = map.get(card.id) || map.get(baseId);
        if (!fresh) return card;
        return { ...fresh, id: card.id, collectedAt: card.collectedAt } as DropsidersCard;
    });
}

function pick9RandomCards(): DropsidersCard[] {
    const pool = buildCardPool();
    if (pool.length === 0) return [];
    
    const picked: DropsidersCard[] = [];
    const poolCopy = [...pool];
    
    for (let i = 0; i < 9; i++) {
        if (poolCopy.length === 0) break;
        const randIdx = Math.floor(Math.random() * poolCopy.length);
        const card = poolCopy.splice(randIdx, 1)[0];
        picked.push({
            ...card,
            collectedAt: new Date().toISOString()
        });
    }
    return picked;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [pendingBooster, setPendingBooster] = useState<DropsidersCard[] | null>(null);

    // --- NEW: Trades State ---
    const [trades, setTrades] = useState<{ sent: any[], received: any[] }>({ sent: [], received: [] });

    const syncUserWithBackend = async (currentUser: UserProfile) => {
        if (!currentUser || !currentUser.email) return;
        try {
            const res = await fetch('/api/users/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentUser)
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.user) {
                    setUser(prev => {
                        if (!prev) return null;
                        const updated = { ...prev, ...data.user };
                        localStorage.setItem('dropsiders_user', JSON.stringify(updated));
                        return updated;
                    });
                }
            }
        } catch (e) {
            console.error('Failed to sync user with backend', e);
        }
    };

    const loadTrades = async () => {
        if (!user || !user.email) return;
        try {
            const res = await fetch(`/api/trades/list?email=${encodeURIComponent(user.email)}`);
            if (res.ok) {
                const data = await res.json();
                setTrades(data);
            }
        } catch (e) {
            console.error('Failed to load trades', e);
        }
    };

    const claimHandle = async (handle: string): Promise<{ success: boolean; error?: string }> => {
        if (!user || !user.email) return { success: false, error: 'Non connectÃ©' };
        try {
            const res = await fetch('/api/users/handle/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, handle })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setUser(prev => {
                    if (!prev) return null;
                    const updated = { ...prev, handle: data.handle };
                    localStorage.setItem('dropsiders_user', JSON.stringify(updated));
                    return updated;
                });
                showNotification('Votre handle @' + data.handle + ' a Ã©tÃ© enregistrÃ© !', 'success');
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Erreur inconnue' };
            }
        } catch (e) {
            console.error('Failed to claim handle', e);
            return { success: false, error: 'Erreur de connexion' };
        }
    };

    const createTradeOffer = async (toHandle: string, offeredCardId: string, wantedCardId: string): Promise<{ success: boolean; error?: string }> => {
        if (!user || !user.email) return { success: false, error: 'Non connectÃ©' };
        try {
            const res = await fetch('/api/trades/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromEmail: user.email,
                    toHandle,
                    offeredCardId,
                    wantedCardId
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showNotification('Offre d\'Ã©change envoyÃ©e avec succÃ¨s !', 'success');
                loadTrades();
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Erreur inconnue' };
            }
        } catch (e) {
            console.error('Failed to create trade offer', e);
            return { success: false, error: 'Erreur de connexion' };
        }
    };

    const respondToTrade = async (tradeId: string, response: 'accepted' | 'rejected'): Promise<{ success: boolean; error?: string }> => {
        if (!user || !user.email) return { success: false, error: 'Non connectÃ©' };
        try {
            const res = await fetch('/api/trades/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    tradeId,
                    response
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showNotification(
                    response === 'accepted' 
                        ? 'Ã‰change acceptÃ© ! Vos cartes ont Ã©tÃ© mises Ã  jour.' 
                        : 'Ã‰change refusÃ©.',
                    'success'
                );
                const profileRes = await fetch(`/api/users/get-profile?email=${encodeURIComponent(user.email)}`);
                if (profileRes.ok) {
                    const backendUser = await profileRes.json();
                    setUser(prev => {
                        if (!prev) return null;
                        const updated = { ...prev, ...backendUser };
                        localStorage.setItem('dropsiders_user', JSON.stringify(updated));
                        return updated;
                    });
                }
                loadTrades();
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Erreur inconnue' };
            }
        } catch (e) {
            console.error('Failed to respond to trade', e);
            return { success: false, error: 'Erreur de connexion' };
        }
    };

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
                        showNotification(`SuccÃ¨s! Vous Ãªtes connectÃ© via Google en tant que ${googleUser.name}.`, 'success');
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

            const syncProfile = async () => {
                try {
                    const res = await fetch(`/api/users/get-profile?email=${encodeURIComponent(user.email)}`);
                    if (res.ok) {
                        const backendUser = await res.json();
                        setUser(prev => {
                            if (!prev) return null;
                            const merged = {
                                ...prev,
                                ...backendUser,
                                collectedCards: backendUser.collectedCards || prev.collectedCards || []
                            };
                            return merged;
                        });
                    } else if (res.status === 404) {
                        syncUserWithBackend(user);
                    }
                } catch (e) { console.error('Failed to sync profile', e); }
            };
            syncProfile();

            // Poll mix status every 30s if pending so access becomes effective immediately after admin approval
            let mixPollInterval: ReturnType<typeof setInterval> | null = null;
            if (user.mixStatus === 'pending') {
                mixPollInterval = setInterval(async () => {
                    try {
                        const res = await fetch(`/api/users/get-profile?email=${encodeURIComponent(user.email)}`);
                        if (res.ok) {
                            const backendUser = await res.json();
                            if (backendUser.mixStatus && backendUser.mixStatus !== user.mixStatus) {
                                setUser(prev => prev ? { ...prev, mixStatus: backendUser.mixStatus } : null);
                                if (backendUser.mixStatus === 'approved') {
                                    // Clear the interval once approved
                                    if (mixPollInterval) clearInterval(mixPollInterval);
                                }
                            }
                        }
                    } catch (e) { /* silent */ }
                }, 30000);
            }

            loadTrades();
            const interval = setInterval(loadTrades, 20000);
            return () => {
                clearInterval(interval);
                if (mixPollInterval) clearInterval(mixPollInterval);
            };

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
        const guestCardsStr = localStorage.getItem('dropsiders_guest_cards');
        let guestCards = [];
        if (guestCardsStr) {
            try {
                guestCards = JSON.parse(guestCardsStr);
            } catch (e) {}
        }

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
            createdAt: new Date().toISOString(),
            collectedCards: guestCards
        };
        setUser(newUser);
        saveToRegisteredUsers(newUser);
        localStorage.removeItem('dropsiders_guest_cards');

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
        const isNewUser = !found;

        const guestCardsStr = localStorage.getItem('dropsiders_guest_cards');
        let guestCards = [];
        if (guestCardsStr) {
            try {
                guestCards = JSON.parse(guestCardsStr);
            } catch (e) {}
        }

        const existingCards = found?.collectedCards || data.collectedCards || [];
        const mergedCards = [...existingCards];
        guestCards.forEach((gc: any) => {
            const alreadyHave = mergedCards.some(mc => mc.id === gc.id && mc.collectedAt.slice(0, 10) === gc.collectedAt.slice(0, 10));
            if (!alreadyHave) {
                mergedCards.push(gc);
            }
        });
        
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
            createdAt: data.createdAt || found?.createdAt || new Date().toISOString(),
            collectedCards: mergedCards
        };
        setUser(newUser);
        saveToRegisteredUsers(newUser);
        localStorage.removeItem('dropsiders_guest_cards');

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

        if (isNewUser) {
            triggerBooster();
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('admin_auth_v2');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_permissions');
        localStorage.removeItem('admin_session_id');
        localStorage.removeItem('admin_provider');
        localStorage.removeItem('admin_password');
        localStorage.removeItem('dropsiders_registered_users'); // Also clear the local registry
    };

    const deleteAccount = async (): Promise<boolean> => {
        if (!user || !user.email) return false;
        
        try {
            const res = await fetch('/api/users/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });
            
            if (res.ok) {
                logout();
                showNotification('Compte supprimÃ© avec succÃ¨s.', 'success');
                return true;
            } else {
                showNotification('Erreur lors de la suppression du compte.', 'error');
                return false;
            }
        } catch (e) {
            console.error('Delete account failed', e);
            showNotification('Erreur rÃ©seau lors de la suppression.', 'error');
            return false;
        }
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
        syncUserWithBackend(updatedUser);
    };

    const addCard = (card: DropsidersCard) => {
        const timestamped = {
            ...card,
            collectedAt: card.collectedAt || new Date().toISOString()
        };
        if (user) {
            const existing = user.collectedCards || [];
            const updatedUser = { ...user, collectedCards: [...existing, timestamped] };
            setUser(updatedUser);
            saveToRegisteredUsers(updatedUser);
            syncUserWithBackend(updatedUser);
        } else {
            // Guest: store in localStorage
            try {
                const stored: DropsidersCard[] = JSON.parse(localStorage.getItem('dropsiders_guest_cards') || '[]');
                stored.push(timestamped);
                localStorage.setItem('dropsiders_guest_cards', JSON.stringify(stored));
            } catch (e) { console.error('Failed to save guest card', e); }
        }
    };

    const addCards = (newCards: DropsidersCard[]) => {
        const timestamped = newCards.map(c => ({
            ...c,
            collectedAt: c.collectedAt || new Date().toISOString()
        }));
        if (user) {
            const existing = user.collectedCards || [];
            const updatedUser = { ...user, collectedCards: [...existing, ...timestamped] };
            setUser(updatedUser);
            saveToRegisteredUsers(updatedUser);
            syncUserWithBackend(updatedUser);
        } else {
            try {
                const stored: DropsidersCard[] = JSON.parse(localStorage.getItem('dropsiders_guest_cards') || '[]');
                stored.push(...timestamped);
                localStorage.setItem('dropsiders_guest_cards', JSON.stringify(stored));
            } catch (e) { console.error('Failed to save guest cards', e); }
        }
    };

    const triggerBooster = () => {
        const cards = pick9RandomCards();
        if (cards.length > 0) {
            setPendingBooster(cards);
        }
    };

    const claimBooster = () => {
        if (!pendingBooster) return;
        addCards(pendingBooster);
        setPendingBooster(null);
    };

    const dismissBooster = () => {
        setPendingBooster(null);
    };

    const removeCard = (cardId: string) => {
        if (user) {
            const existing = user.collectedCards || [];
            const index = existing.findIndex(c => c.id === cardId);
            if (index !== -1) {
                const updatedCards = [...existing];
                updatedCards.splice(index, 1);
                const updatedUser = { ...user, collectedCards: updatedCards };
                setUser(updatedUser);
                saveToRegisteredUsers(updatedUser);
                syncUserWithBackend(updatedUser);
            }
        } else {
            // Guest: store in localStorage
            try {
                const stored: DropsidersCard[] = JSON.parse(localStorage.getItem('dropsiders_guest_cards') || '[]');
                const index = stored.findIndex(c => c.id === cardId);
                if (index !== -1) {
                    stored.splice(index, 1);
                    localStorage.setItem('dropsiders_guest_cards', JSON.stringify(stored));
                }
            } catch (e) { console.error('Failed to remove guest card', e); }
        }
    };

    const burnCards = (cardIds: string[]) => {
        if (!user) return;
        const existing = user.collectedCards || [];
        const toRemove = new Set(cardIds);
        const updatedCards = existing.filter(c => !toRemove.has(c.id));
        if (updatedCards.length !== existing.length) {
            const updatedUser = { ...user, collectedCards: updatedCards };
            setUser(updatedUser);
            saveToRegisteredUsers(updatedUser);
            syncUserWithBackend(updatedUser);
        }
    };

    const craftCard = (targetRarity: 'rare' | 'epic' | 'legendary'): DropsidersCard | null => {
        const pool = buildCardPool().filter(c => c.rarity === targetRarity);
        if (pool.length === 0) return null;
        const crafted = pool[Math.floor(Math.random() * pool.length)];
        const timestamped = {
            ...crafted,
            id: `${crafted.id}_crafted_${Date.now()}`,
            collectedAt: new Date().toISOString()
        };
        addCard(timestamped);
        return timestamped;
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
            deleteAccount,
            isAuthModalOpen,
            setIsAuthModalOpen,
            showNotification,
            addCard,
            addCards,
            removeCard,
            burnCards,
            craftCard,
            collectedCards: hydrateCards(user?.collectedCards || (typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('dropsiders_guest_cards') || '[]') : [])),
            pendingBooster,
            triggerBooster,
            claimBooster,
            dismissBooster,
            // --- NEW: Trades System ---
            trades,
            loadTrades,
            claimHandle,
            createTradeOffer,
            respondToTrade
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
                                        {notification.type === 'success' ? 'âœ“' : notification.type === 'error' ? '!' : 'i'}
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
                                    Ã—
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

