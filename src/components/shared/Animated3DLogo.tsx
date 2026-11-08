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
    depth = 14,
    speed = 4.2,
}) => {
    // Number of 3D slices for solid volumetric extrusion
    const sliceCount = 12;
    const slices = Array.from({ length: sliceCount }, (_, idx) => {
        const i = sliceCount - idx;
        const z = -((i / sliceCount) * depth).toFixed(1);
        const ratio = 1 - (i / sliceCount);
        // Titanium / steel shade: from 0.16 (deep back) to 0.58 (front edge)
        const shade = (0.16 + ratio * 0.42).toFixed(3);
        return { z, shade };
    });

    const duration = `${speed}s`;
    const halfDuration = `${(speed / 2).toFixed(2)}s`;

    return (
        <div 
            className={`animated-3d-logo-viewport relative inline-flex items-center justify-center select-none ${className}`}
            style={{
                perspective: '600px',
                perspectiveOrigin: '50% 50%',
            }}
        >
            <style>{`
                @keyframes dropsidersPendulum {
                    0% {
                        transform: rotateX(4deg) rotateY(-22deg);
                    }
                    50% {
                        transform: rotateX(4deg) rotateY(22deg);
                    }
                    100% {
                        transform: rotateX(4deg) rotateY(-22deg);
                    }
                }

                @keyframes dropsidersFrontLight {
                    0%, 100% {
                        filter: brightness(0.88);
                    }
                    50% {
                        filter: brightness(1.0);
                    }
                }

                @keyframes dropsidersNacreSheen {
                    0% {
                        transform: translateX(-160px);
                    }
                    50% {
                        transform: translateX(160px);
                    }
                    100% {
                        transform: translateX(-160px);
                    }
                }
            `}</style>

            <div
                className="relative flex items-center justify-center h-full w-auto"
                style={{
                    transformStyle: 'preserve-3d',
                    animation: `dropsidersPendulum ${duration} cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite, dropsidersFrontLight ${halfDuration} ease-in-out infinite`,
                    willChange: 'transform, filter',
                }}
            >
                {/* 1. Deep contact drop shadow */}
                <img
                    src="/logo_white_official.png"
                    alt=""
                    className="absolute h-full w-auto max-w-none object-contain pointer-events-none opacity-90"
                    style={{
                        transform: `translateZ(-${depth + 3}px)`,
                        filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.95))',
                    }}
                />

                {/* 2. Extruded 3D slices (Titanium / Dark Steel) */}
                {slices.map((s, idx) => (
                    <img
                        key={idx}
                        src="/logo_white_official.png"
                        alt=""
                        className="absolute h-full w-auto max-w-none object-contain pointer-events-none"
                        style={{
                            transform: `translateZ(${s.z}px)`,
                            filter: `brightness(0) invert(${s.shade})`,
                            opacity: 0.96,
                        }}
                    />
                ))}

                {/* 3. Bevel highlight slice */}
                <img
                    src="/logo_white_official.png"
                    alt=""
                    className="absolute h-full w-auto max-w-none object-contain pointer-events-none"
                    style={{
                        transform: 'translateZ(-0.4px)',
                        filter: 'brightness(0) invert(0.85)',
                    }}
                />

                {/* 4. Front Face: Crisp, vector-sharp 100% Pure White */}
                <img
                    src="/logo_white_official.png"
                    alt="DROPSIDERS"
                    className="relative h-full w-auto max-w-none object-contain"
                    style={{
                        transform: 'translateZ(0px)',
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))',
                    }}
                />

                {/* 5. Optional pearlescent theme sheen (only if themeColor is provided) */}
                {themeColor && (
                    <svg
                        viewBox="0 0 600 269"
                        className="absolute inset-0 h-full w-auto pointer-events-none"
                        style={{ transform: 'translateZ(0.2px)' }}
                    >
                        <defs>
                            <mask id="logo-theme-sheen-mask">
                                <image href="/logo_white_official.png" width="600" height="269" />
                            </mask>
                            <linearGradient id="logo-theme-sheen-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor={themeColor} stopOpacity="0" />
                                <stop offset="25%" stopColor={themeColor} stopOpacity="0.25" />
                                <stop offset="50%" stopColor={themeColor} stopOpacity="0.80" />
                                <stop offset="75%" stopColor={themeColor} stopOpacity="0.25" />
                                <stop offset="100%" stopColor={themeColor} stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <g mask="url(#logo-theme-sheen-mask)">
                            <rect
                                x="-100"
                                y="0"
                                width="800"
                                height="269"
                                fill="url(#logo-theme-sheen-grad)"
                                style={{
                                    mixBlendMode: 'screen',
                                    animation: `dropsidersNacreSheen ${duration} cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite`,
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

