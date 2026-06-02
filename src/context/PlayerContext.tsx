import React, { createContext, useContext, useState, useRef } from 'react';

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
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    // Register the real togglePlay function from CustomMixPlayer
    registerTogglePlay: (fn: () => void) => void;
    togglePlay: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const [activeTrack, setActiveTrack] = useState<MixTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    // Store a ref to the actual togglePlay of the real audio player
    const togglePlayRef = useRef<() => void>(() => {});

    const playTrack = (track: MixTrack) => {
        setActiveTrack(track);
        setIsPlaying(true);
    };

    const closePlayer = () => {
        setActiveTrack(null);
        setIsPlaying(false);
    };

    // Called by CustomMixPlayer on mount to register its real togglePlay
    const registerTogglePlay = (fn: () => void) => {
        togglePlayRef.current = fn;
    };

    // This calls the real audio togglePlay (not just state)
    const togglePlay = () => {
        togglePlayRef.current();
    };

    return (
        <PlayerContext.Provider value={{ activeTrack, playTrack, closePlayer, isPlaying, setIsPlaying, registerTogglePlay, togglePlay }}>
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
