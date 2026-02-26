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

        // Set language based on current site language
        utterance.lang = language === 'fr' ? 'fr-FR' : 'en-US';

        // Natural speed and pitch
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        // Try to find a better voice for the language if possible
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            const preferredVoice = voices.find(v =>
                v.lang.includes(language === 'fr' ? 'fr' : 'en') &&
                (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural'))
            );
            if (preferredVoice) {
                utterance.voice = preferredVoice;
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
        <button
            onClick={speak}
            className={`flex items-center gap-3 px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all duration-500 shadow-lg active:scale-95 group ${isPlaying
                    ? 'bg-neon-red text-white shadow-neon-red/30 border border-neon-red ring-2 ring-neon-red/20'
                    : 'bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:border-white/20'
                }`}
            title={isPlaying ? t('article_reader.stop') : t('article_reader.play')}
        >
            {isPlaying ? (
                <>
                    <div className="relative flex items-center justify-center">
                        <Square className="w-3.5 h-3.5 fill-current animate-pulse" />
                        <span className="absolute inset-0 animate-ping bg-white rounded-full opacity-30"></span>
                    </div>
                    <span className="font-black">{t('article_reader.playing')}</span>
                    <div className="flex gap-[2px] items-end h-3 ml-1">
                        <span className="w-[2px] bg-white rounded-full animate-[audio-bar_0.6s_infinite_0.1s] h-1.5"></span>
                        <span className="w-[2px] bg-white rounded-full animate-[audio-bar_0.6s_infinite_0.3s] h-3"></span>
                        <span className="w-[2px] bg-white rounded-full animate-[audio-bar_0.6s_infinite_0.2s] h-2"></span>
                    </div>
                </>
            ) : (
                <>
                    <Volume2 className="w-3.5 h-3.5 text-neon-red group-hover:scale-110 transition-transform" />
                    <span>{t('article_reader.play')}</span>
                </>
            )}

            <style>{`
                @keyframes audio-bar {
                    0%, 100% { height: 4px; }
                    50% { height: 12px; }
                }
            `}</style>
        </button>
    );
};
