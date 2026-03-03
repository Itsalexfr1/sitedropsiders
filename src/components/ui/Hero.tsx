export function Hero({ videoId, videoUrl, accentColor = 'cyan', resolvedColor }: { videoId?: string, videoUrl?: string, accentColor?: string, resolvedColor?: string }) {
    const finalVideoId = videoId || "xoB5fdoOMV8";
    const color = resolvedColor || `var(--color-neon-${accentColor})`;

    return (
        <section className="relative h-[50vh] md:h-[65vh] min-h-[480px] w-full flex items-center overflow-hidden bg-black">
            {/* Background Video - Hidden on mobile for cleaner look and performance */}
            <div className="absolute inset-0 z-0 hidden md:block">
                <div className="absolute inset-0 bg-gradient-to-r from-dark-bg/90 via-dark-bg/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark-bg z-10" />
                <div className="absolute inset-0 w-full h-full">
                    {videoUrl ? (
                        <video
                            className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover scale-110"
                            src={videoUrl}
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                    ) : (
                        <iframe
                            className="absolute top-1/2 left-1/2 min-w-[100vw] min-h-[100vh] w-auto h-auto -translate-x-1/2 -translate-y-1/2 scale-[1.3] pointer-events-none border-none"
                            src={`https://www.youtube.com/embed/${finalVideoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${finalVideoId}&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                            title="Hero Video"
                        />
                    )}
                </div>
            </div>

            <div className="relative z-20 w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
                {/* Overlay content removed as requested */}
            </div>

            {/* Bottom Glow Line */}
            <div
                className="absolute bottom-0 left-0 right-0 h-px z-20 opacity-50"
                style={{
                    backgroundColor: color,
                    boxShadow: `0 0 15px ${color}`
                }}
            />
        </section>
    );
}
