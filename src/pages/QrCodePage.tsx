import { useEffect, useRef } from 'react';
// @ts-ignore
import QRCodeStyling from 'qr-code-styling';

export function QrCodePage() {
    const qrRef = useRef<HTMLDivElement>(null);
    const qrCode = useRef<any>(null);

    useEffect(() => {
        qrCode.current = new QRCodeStyling({
            width: 1024,
            height: 1024,
            data: "https://dropsiders.com",
            image: "/Logo.png",
            dotsOptions: {
                color: "#ff0033",
                type: "rounded"
            },
            backgroundOptions: {
                color: "#050505", // Very dark black
            },
            imageOptions: {
                crossOrigin: "anonymous",
                margin: 15,
                imageSize: 0.55,
                hideBackgroundDots: true // This natively creates a black hole behind the logo
            },
            cornersSquareOptions: {
                type: "extra-rounded",
                color: "#ff0033"
            },
            cornersDotOptions: {
                type: "dot",
                color: "#ff0033"
            }
        });

        if (qrRef.current) {
            qrRef.current.innerHTML = '';
            qrCode.current.append(qrRef.current);
            
            // Adjust SVG sizing to make it responsive inside the container
            const svg = qrRef.current.querySelector('svg') || qrRef.current.querySelector('canvas');
            if (svg) {
                svg.style.width = '100%';
                svg.style.height = 'auto';
            }
        }
    }, []);

    const downloadQR = () => {
        if (!qrCode.current) return;
        qrCode.current.download({ name: "dropsiders-qr-code-rounded", extension: "png" });
    };

    return (
        <div className="min-h-screen bg-dark-bg text-white flex flex-col items-center justify-center p-6 pt-24 font-sans relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-neon-red/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-neon-red/5 rounded-full blur-[100px]" />
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-[2rem] shadow-2xl flex flex-col items-center gap-8 relative z-10 max-w-lg w-full text-center">
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider">
                        Dropsiders QR
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Design arrondi, logo isolé sur fond noir. Ce QR Code reste valide <strong className="text-neon-red">à vie</strong>.
                    </p>
                </div>

                <div 
                    className="p-4 bg-[#050505] rounded-3xl shadow-[0_0_40px_rgba(255,0,51,0.2)] overflow-hidden w-full max-w-[320px] aspect-square flex items-center justify-center"
                    ref={qrRef}
                />

                <div className="w-full space-y-4">
                    <button 
                        onClick={downloadQR}
                        className="w-full bg-neon-red hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(255,0,51,0.4)] hover:shadow-[0_0_25px_rgba(255,0,51,0.6)] flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                    >
                        Télécharger en PNG HD
                    </button>
                    <p className="text-xs text-gray-500">
                        Version haute définition (1024x1024). Parfait pour l'impression ou les stickers.
                    </p>
                </div>
            </div>
        </div>
    );
}
