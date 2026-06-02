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
    cover?: string;
    tracks?: TrackItem[];
}

interface PlayerContextType {
    activeTrack: MixTrack | null;
    playTrack: (track: MixTrack) => void;
    closePlayer: () => void;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    // Playback position (synced from CustomMixPlayer)
    currentTime: number;
    duration: number;
    setCurrentTime: (t: number) => void;
    setDuration: (d: number) => void;
    // Register real functions from CustomMixPlayer
    registerTogglePlay: (fn: () => void) => void;
    registerSeekTo: (fn: (s: number) => void) => void;
    togglePlay: () => void;
    seekTo: (seconds: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const [activeTrack, setActiveTrack] = useState<MixTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const togglePlayRef = useRef<() => void>(() => {});
    const seekToRef = useRef<(s: number) => void>(() => {});

    const playTrack = (track: MixTrack) => {
        setActiveTrack(track);
        setIsPlaying(true);
        setCurrentTime(0);
        setDuration(0);
    };

    const closePlayer = () => {
        setActiveTrack(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
    };

    const registerTogglePlay = (fn: () => void) => { togglePlayRef.current = fn; };
    const registerSeekTo = (fn: (s: number) => void) => { seekToRef.current = fn; };
    const togglePlay = () => togglePlayRef.current();
    const seekTo = (seconds: number) => seekToRef.current(seconds);

    return (
        <PlayerContext.Provider value={{
            activeTrack, playTrack, closePlayer,
            isPlaying, setIsPlaying,
            currentTime, duration, setCurrentTime, setDuration,
            registerTogglePlay, registerSeekTo,
            togglePlay, seekTo,
        }}>
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
