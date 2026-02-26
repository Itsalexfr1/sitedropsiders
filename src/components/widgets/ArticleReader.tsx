import React, { useState, useEffect } from 'react';
import { Volume2, Square, User, UserCheck } from 'lucide-react';
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
    const [voiceGender, setVoiceGender] = useState<'male' | 'female'>(() => {
        return (localStorage.getItem('reader_gender') as 'male' | 'female') || 'male';
    });

    useEffect(() => {
        if (!window.speechSynthesis) {
            setIsSupported(false);
            return;
        }

        const handleVoicesChanged = () => {
            setVoices(window.speechSynthesis.getVoices());
        };

        handleVoicesChanged();
        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
                window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
            }
        };
    }, []);

    const toggleGender = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newGender = voiceGender === 'male' ? 'female' : 'male';
        setVoiceGender(newGender);
        localStorage.setItem('reader_gender', newGender);

        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            setTimeout(() => speak(), 100);
        }
    };

    const speak = () => {
        if (!isSupported) return;

        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            return;
        }

        // 1. Natural Text Processing
        const doc = new DOMParser().parseFromString(content, 'text/html');
        const selectorsToRemove = ['script', 'style', 'iframe', '.no-read', '.artist-socials-premium', '.festival-socials-premium', '.jw-widget-newsletter', '.youtube-player-widget', '.music-number'];
        selectorsToRemove.forEach(selector => doc.querySelectorAll(selector).forEach(el => el.remove()));

        // Add "..." for breathing pauses between sections
        let authorText = author ? `${t('common.by')} ${author}... ` : '';
        let textToRead = `${title}...... ${authorText} ${doc.body.innerText}`;

        // Standardize punctuation for the engine (add slight breaths)
        textToRead = textToRead
            .replace(/\s+/g, ' ')
            .replace(/([.!?])\s*/g, '$1... ')
            .trim();

        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = language === 'fr' ? 'fr-FR' : 'en-US';

        // Settings for natural pacing
        utterance.rate = 0.94;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const allVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();

        if (allVoices.length > 0) {
            const langCode = language === 'fr' ? 'fr' : 'en';

            // Priority for Neural/Natural voices
            const maleHighPrio = ['Microsoft Henri Online', 'Microsoft Alain Online', 'Microsoft Thomas Online', 'Microsoft Guy Online', 'Google français', 'Henri', 'Gilles', 'Male'];
            const femaleHighPrio = ['Microsoft Denise Online', 'Microsoft Aria Online', 'Microsoft Julie Online', 'Denise', 'Celine', 'Hortense', 'Female'];

            const genderNames = voiceGender === 'male' ? maleHighPrio : femaleHighPrio;
            const langVoices = allVoices.filter(v =>
                v.lang.toLowerCase().startsWith(langCode) ||
                v.lang.toLowerCase().replace('_', '-').startsWith(langCode)
            );

            let bestVoice = null;

            // Try specific high-quality matches first
            for (const namePattern of genderNames) {
                bestVoice = langVoices.find(v => v.name.includes(namePattern));
                if (bestVoice) break;
            }

            // Search for general "Online" (Neural) if no name matched
            if (!bestVoice) {
                bestVoice = langVoices.find(v => v.name.includes('Online') || v.name.includes('Natural'));
            }

            if (!bestVoice) bestVoice = langVoices[0];

            if (bestVoice) {
                utterance.voice = bestVoice;
                // Neural voices can handle slightly faster rate
                if (bestVoice.name.includes('Online')) utterance.rate = 1.0;
            }
        }

        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        window.speechSynthesis.speak(utterance);
    };

    if (!isSupported) return null;

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={speak}
                className={`group relative flex items-center gap-2.5 px-5 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-lg active:scale-95 ${isPlaying
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
            </button>

            {/* Gender Toggle - Discret but effective */}
            <button
                onClick={toggleGender}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 border shadow-md active:scale-90 ${voiceGender === 'male'
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-500 hover:bg-blue-500 hover:text-white'
                        : 'bg-pink-500/10 border-pink-500/30 text-pink-500 hover:bg-pink-500 hover:text-white'
                    }`}
                title={voiceGender === 'male' ? "Changer pour une voix féminine" : "Changer pour une voix masculine"}
            >
                {voiceGender === 'male' ? <User className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </button>

            <style>{`
                @keyframes audio-bar {
                    0%, 100% { height: 4px; }
                    50% { height: 12px; }
                }
            `}</style>
        </div>
    );
};
