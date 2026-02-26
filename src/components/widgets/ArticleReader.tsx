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
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        // Check if Speech Synthesis is supported
        if (!window.speechSynthesis) {
            setIsSupported(false);
            return;
        }

        const handleVoicesChanged = () => {
            setVoices(window.speechSynthesis.getVoices());
        };

        // Load voices initially
        handleVoicesChanged();

        // Register listener for voice changes
        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

        // Cleanup: stop speaking when component unmounts
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
                window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
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
            '.music-number'
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
            .replace(/([.!?])\s*/g, '$1 ')
            .trim();

        // 2. Configure Utterance
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = language === 'fr' ? 'fr-FR' : 'en-US';

        // Slightly slower rate for better natural feel - neural voices handle this well
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Voice Selection Logic
        const allVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();

        if (allVoices.length > 0) {
            const langCode = language === 'fr' ? 'fr' : 'en';

            // Priority keywords for premium/neural voices
            const premiumKeywords = [
                'Microsoft Denise Online', // High quality French Neural
                'Microsoft Henri Online',  // High quality French Neural
                'Natural',
                'Neural',
                'Online',
                'Google',
                'Premium',
                'Enhanced',
                'Aria'
            ];

            // Filter voices for current language
            const langVoices = allVoices.filter(v =>
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
            }
        }

        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        // 3. Start speaking
        window.speechSynthesis.speak(utterance);
    };

    if (!isSupported) return null;

    return (
        <button
            onClick={speak}
            className={`group relative flex items-center gap-3 px-5 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-lg active:scale-95 ${isPlaying
                    ? 'bg-neon-red text-white shadow-neon-red/30 border border-neon-red'
                    : 'bg-neon-red/10 hover:bg-neon-red hover:text-white backdrop-blur-md border border-neon-red/30 hover:border-transparent text-neon-red'
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
                    <Volume2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
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
