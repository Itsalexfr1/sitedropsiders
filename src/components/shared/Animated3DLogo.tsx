import React from 'react';

interface Animated3DLogoProps {
    className?: string;
    /** If provided, adds a pearlescent theme color sheen that follows the swing. If null/undefined, renders 100% monochrome (steel + white). */
    themeColor?: string | null;
    depth?: number;
    speed?: number;
}

export const Animated3DLogo: React.FC<Animated3DLogoProps> = ({
    className = 'h-8 md:h-11 w-auto',
    themeColor = null,
    speed = 4.2,
}) => {
    const duration = `${speed}s`;

    return (
        <div 
            className={`animated-3d-logo-viewport relative inline-flex items-center justify-center select-none ${className}`}
            style={{
                perspective: '800px',
                perspectiveOrigin: '50% 50%',
            }}
        >
            <style>{`
                @keyframes dropsidersPendulum {
                    0% {
                        transform: translateX(-50px) rotateY(-12deg);
                    }
                    50% {
                        transform: translateX(50px) rotateY(12deg);
                    }
                    100% {
                        transform: translateX(-50px) rotateY(-12deg);
                    }
                }

                @keyframes dropsidersNacreSheen {
                    0% {
                        transform: translateX(-240px);
                    }
                    50% {
                        transform: translateX(240px);
                    }
                    100% {
                        transform: translateX(-240px);
                    }
                }
            `}</style>

            <div
                className="relative flex items-center justify-center h-full w-auto"
                style={{
                    transformStyle: 'preserve-3d',
                    animation: `dropsidersPendulum ${duration} cubic-bezier(0.42, 0.0, 0.58, 1.0) infinite`,
                    willChange: 'transform',
                }}
            >
                {/* 1. Ombre douce réaliste (ZÉRO dédoublement, ZÉRO barre blanche) */}
                <img
                    src="/logo_white_official.png"
                    alt=""
                    className="absolute h-full w-auto max-w-none object-contain pointer-events-none opacity-70"
                    style={{
                        transform: 'translateY(6px) scale(0.96)',
                        filter: 'blur(8px) brightness(0)',
                    }}
                />

                {/* 2. Logo Blanc Pur Unique (Parfaitement net, sans aucune tranche fantôme) */}
                <img
                    src="/logo_white_official.png"
                    alt="DROPSIDERS"
                    className="relative h-full w-auto max-w-none object-contain"
                    style={{
                        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.85))',
                    }}
                />

                {/* 3. Reflet Mode Vitre (100% couleur thème, zéro barre blanche) */}
                {themeColor && (
                    <svg
                        viewBox="0 0 600 269"
                        className="absolute inset-0 h-full w-auto pointer-events-none"
                        style={{ transform: 'translateZ(1px)' }}
                    >
                        <defs>
                            <mask id="logo-theme-sheen-mask">
                                <image href="/logo_white_official.png" width="600" height="269" />
                            </mask>
                            <linearGradient id="logo-theme-sheen-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor={themeColor} stopOpacity="0" />
                                <stop offset="25%" stopColor={themeColor} stopOpacity="0.20" />
                                <stop offset="50%" stopColor={themeColor} stopOpacity="0.85" />
                                <stop offset="75%" stopColor={themeColor} stopOpacity="0.20" />
                                <stop offset="100%" stopColor={themeColor} stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <g mask="url(#logo-theme-sheen-mask)">
                            <rect
                                x="-150"
                                y="0"
                                width="900"
                                height="269"
                                fill="url(#logo-theme-sheen-grad)"
                                style={{
                                    mixBlendMode: 'screen',
                                    animation: `dropsidersNacreSheen ${duration} cubic-bezier(0.42, 0.0, 0.58, 1.0) infinite`,
                                    willChange: 'transform',
                                }}
                            />
                        </g>
                    </svg>
                )}
            </div>
        </div>
    );
};

export default Animated3DLogo;

