import { useRef } from 'react';

/**
 * Hook to play a hover sound similar to Opera GX.
 * Uses a single Audio instance to avoid memory leaks and overlapping issues.
 */
export function useHoverSound() {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playSound = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio('/Son site.mp3');
            audioRef.current.volume = 0.2;
        }

        // Reset playback if sound is already playing
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
            // Browsers often block audio until first user interaction
            // This silent catch prevents console errors
        });
    };

    return playSound;
}
