import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { FollowerGifAlert, DEFAULT_FOLLOWER_GIF } from '../components/alerts/FollowerGifAlert';

interface AlertData {
    id: string;
    type: string;
    pseudo: string;
    gifUrl?: string;
    message?: string;
}

export const StreamAlertsOverlayPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const isTestFromUrl = searchParams.get('test') === 'true';
    const customGifFromUrl = searchParams.get('gif') || '';
    const isAdmin = searchParams.get('admin') === 'true';

    const [activeAlert, setActiveAlert] = useState<AlertData | null>(null);

    useEffect(() => {
        // BroadcastChannel to catch live alerts triggered anywhere on Dropsiders (chat, admin, etc.)
        const bc = new BroadcastChannel('dropsiders_native_chat_v1');

        bc.onmessage = (event) => {
            if (event.data?.type === 'LIVE_ALERT' && event.data?.alert) {
                const a = event.data.alert;
                setActiveAlert({
                    id: a.id || String(Date.now()),
                    type: a.type || 'follower',
                    pseudo: a.pseudo || 'NouveauFan',
                    gifUrl: a.gifUrl || customGifFromUrl || undefined,
                    message: a.message
                });
            }
        };

        // Window postMessage for embedding in external tools / OBS dock
        const handleWindowMsg = (e: MessageEvent) => {
            if (e.data?.type === 'TRIGGER_ALERT') {
                setActiveAlert({
                    id: String(Date.now()),
                    type: e.data.alertType || 'follower',
                    pseudo: e.data.pseudo || 'DropsiderFan',
                    gifUrl: e.data.gifUrl || customGifFromUrl || undefined,
                    message: e.data.message
                });
            }
        };
        window.addEventListener('message', handleWindowMsg);

        // If ?test=true in URL, trigger immediately for positioning in OBS
        if (isTestFromUrl) {
            setActiveAlert({
                id: 'test-1',
                type: 'follower',
                pseudo: searchParams.get('pseudo') || 'DJ_Martin_99',
                gifUrl: customGifFromUrl || undefined
            });
        }

        return () => {
            bc.close();
            window.removeEventListener('message', handleWindowMsg);
        };
    }, [isTestFromUrl, customGifFromUrl, searchParams]);

    const triggerManualTest = () => {
        setActiveAlert({
            id: 'test-' + Date.now(),
            type: 'follower',
            pseudo: 'Fan_Dropsiders_' + Math.floor(Math.random() * 900 + 100),
            gifUrl: customGifFromUrl || undefined
        });
    };

    return (
        <div className="w-screen h-screen bg-transparent overflow-hidden flex flex-col items-center justify-center p-6 relative">
            {/* OBS Alert Area */}
            <AnimatePresence mode="wait">
                {activeAlert && (
                    <FollowerGifAlert
                        key={activeAlert.id}
                        pseudo={activeAlert.pseudo}
                        gifUrl={activeAlert.gifUrl || DEFAULT_FOLLOWER_GIF}
                        size="stream"
                        durationMs={6000}
                        onClose={() => setActiveAlert(null)}
                    />
                )}
            </AnimatePresence>

            {/* Quick Admin Test Bar if ?admin=true */}
            {isAdmin && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl z-50">
                    <span className="text-[10px] font-black uppercase text-gray-400">
                        OBS Overlay Mode
                    </span>
                    <button
                        type="button"
                        onClick={triggerManualTest}
                        className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase rounded-xl transition-all cursor-pointer"
                    >
                        Tester Alerte Follower
                    </button>
                </div>
            )}
        </div>
    );
};

