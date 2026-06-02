import React, { createContext, useContext, useState } from 'react';

export interface TrackItem {
    title: string;
    artist: string;
    time?: string;
}

export interface MixTrack {
    id: string;
    title: string;
    artist: string;
    label?: string;
    event?: string;
    url: string;
    embedUrl?: string;
    tracks?: TrackItem[];
}

interface PlayerContextType {
    activeTrack: MixTrack | null;
    playTrack: (track: MixTrack) => void;
    closePlayer: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const [activeTrack, setActiveTrack] = useState<MixTrack | null>(null);

    const playTrack = (track: MixTrack) => {
        setActiveTrack(track);
    };

    const closePlayer = () => {
        setActiveTrack(null);
    };

    return (
        <PlayerContext.Provider value={{ activeTrack, playTrack, closePlayer }}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
}
