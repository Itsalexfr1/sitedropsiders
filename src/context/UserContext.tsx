import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserProfile {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    scores: Record<string, number>;
    trackIds: string[];
    createdAt: string;
}

interface UserContextType {
    user: UserProfile | null;
    isLoggedIn: boolean;
    login: (username: string, email: string) => void;
    loginSocial: (data: Partial<UserProfile>) => void;
    logout: () => void;
    updateScore: (gameId: string, score: number) => void;
    toggleTrackId: (trackId: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);

    // Initial load from localStorage
    useEffect(() => {
        const savedUser = localStorage.getItem('dropsiders_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error('Failed to parse user data', e);
            }
        }
    }, []);

    // Save to localStorage whenever user changes
    useEffect(() => {
        if (user) {
            localStorage.setItem('dropsiders_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('dropsiders_user');
        }
    }, [user]);

    const login = (username: string, email: string) => {
        const newUser: UserProfile = {
            id: crypto.randomUUID(),
            username,
            email,
            scores: {},
            trackIds: [],
            createdAt: new Date().toISOString()
        };
        setUser(newUser);
    };

    const loginSocial = (data: Partial<UserProfile>) => {
        const newUser: UserProfile = {
            id: data.id || crypto.randomUUID(),
            username: data.username || 'Utilisateur',
            email: data.email || '',
            avatar: data.avatar,
            scores: data.scores || {},
            trackIds: data.trackIds || [],
            createdAt: data.createdAt || new Date().toISOString()
        };
        setUser(newUser);
    };

    const logout = () => {
        setUser(null);
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

    return (
        <UserContext.Provider value={{
            user,
            isLoggedIn: !!user,
            login,
            loginSocial,
            logout,
            updateScore,
            toggleTrackId
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
