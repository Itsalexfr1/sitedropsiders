import React, { useState, useEffect } from 'react';
import { Volume2, Square } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ArticleReaderProps {
    content: string;
    title: string;
    /** Optional author to read as well */
    author?: string;
}

export const ArticleReader: React.FC<ArticleReaderProps> = ({ content, title, author }) => {
    const { t, language } = useLanguage();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        // Check if Speech Synthesis is supported
        if (!window.speechSynthesis) {
            setIsSupported(false);
        }

        // Cleanup: stop speaking when component unmounts
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const speak = () => {
        if (!isSupported) return;

        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            return;
        }

        // 1. Clean content for reading
        const doc = new DOMParser().parseFromString(content, 'text/html');

        // Remove elements we don't want to read
        const selectorsToRemove = [
            'script',
            'style',
            'iframe',
            '.no-read',
            '.artist-socials-premium',
            '.festival-socials-premium',
            '.jw-widget-newsletter',
            '.youtube-player-widget',
            '.music-number' // Avoid reading "1.", "2." etc in lists if they are styled separately
        ];

        selectorsToRemove.forEach(selector => {
            doc.querySelectorAll(selector).forEach(el => el.remove());
        });

        // Construct the readable text
        let authorText = author ? `${t('common.by')} ${author}. ` : '';
        let textToRead = `${title}. ${authorText}${doc.body.innerText}`;

        // Clean double spaces, newlines and weird artifacts
        textToRead = textToRead
            .replace(/\s+/g, ' ')
            .replace(/([.!?])\s*/g, '$1 ') // Ensure space after punctuation
            .trim();

        // 2. Configure Utterance
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = language === 'fr' ? 'fr-FR' : 'en-US';

        // Slightly slower rate for better natural feel
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        // Voice Selection Logic
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            const langCode = language === 'fr' ? 'fr' : 'en';

            // Priority keywords for premium voices
            const premiumKeywords = ['Natural', 'Online', 'Google', 'Premium', 'Enhanced', 'Aria', 'Denise', 'Henri'];

            // Filter voices for current language
            const langVoices = voices.filter(v =>
                v.lang.toLowerCase().startsWith(langCode) ||
                v.lang.toLowerCase().replace('_', '-').startsWith(langCode)
            );

            // Find the first voice that matches our premium keywords
            let bestVoice = null;
            for (const keyword of premiumKeywords) {
                bestVoice = langVoices.find(v => v.name.includes(keyword));
                if (bestVoice) break;
            }

            // Fallback to any voice of the language
            if (!bestVoice) bestVoice = langVoices[0];

            if (bestVoice) {
                utterance.voice = bestVoice;
                // If it's an online natural voice, we can slightly speed it back up
                if (bestVoice.name.includes('Natural')) utterance.rate = 1.0;
            }
        }

        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = (event) => {
            console.error('SpeechSynthesis error:', event);
            setIsPlaying(false);
        };

        // 3. Start speaking
        window.speechSynthesis.speak(utterance);
    };

    if (!isSupported) return null;

    return (
        <div className="my-6">
            <button
                onClick={speak}
                className={`group relative flex items-center gap-4 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-500 shadow-2xl active:scale-95 overflow-hidden ${isPlaying
                        ? 'bg-gradient-to-r from-neon-red to-red-600 text-white shadow-neon-red/40 border border-white/20'
                        : 'bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 text-white/90 hover:text-white hover:border-neon-red/50 hover:shadow-neon-red/10'
                    }`}
            >
                {/* Background Animation Glow */}
                <div className={`absolute inset-0 bg-gradient-to-r from-neon-red/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${isPlaying ? 'opacity-100 animate-pulse' : ''}`} />

                {isPlaying ? (
                    <>
                        <div className="relative z-10 flex items-center justify-center bg-white/20 p-2 rounded-xl">
                            <Square className="w-4 h-4 fill-white" />
                        </div>
                        <div className="relative z-10 flex flex-col items-start">
                            <span className="text-white/70 text-[8px] font-black tracking-widest mb-0.5">{t('article_reader.playing')}</span>
                            <span className="text-white">{t('article_reader.stop')}</span>
                        </div>
                        <div className="relative z-10 flex gap-[3px] items-end h-4 ml-4">
                            <span className="w-[3px] bg-white rounded-full animate-[audio-bar_0.6s_infinite_0.1s] h-2"></span>
                            <span className="w-[3px] bg-white rounded-full animate-[audio-bar_0.6s_infinite_0.3s] h-4"></span>
                            <span className="w-[3px] bg-white rounded-full animate-[audio-bar_0.6s_infinite_0.2s] h-3"></span>
                            <span className="w-[3px] bg-white rounded-full animate-[audio-bar_0.6s_infinite_0.4s] h-2.5"></span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="relative z-10 flex items-center justify-center bg-neon-red/10 p-2 rounded-xl group-hover:bg-neon-red group-hover:text-white transition-all duration-300">
                            <Volume2 className="w-4 h-4 text-neon-red group-hover:text-white group-hover:scale-110 transition-all" />
                        </div>
                        <div className="relative z-10 flex flex-col items-start text-left">
                            <span className="text-neon-red text-[8px] font-black tracking-[0.3em] mb-0.5 animate-pulse">AUDIO</span>
                            <span className="group-hover:translate-x-1 transition-transform">{t('article_reader.play')}</span>
                        </div>
                    </>
                )}

                <style>{`
                    @keyframes audio-bar {
                        0%, 100% { height: 6px; }
                        50% { height: 16px; }
                    }
                `}</style>
            </button>
        </div>
    );
};
